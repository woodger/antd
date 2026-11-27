// Bypass the drag-and-drop directories for Upload. The directory read continues to an empty
// portion, and the path is saved from the received file. Ant Design 6.6.8 / rc-upload 1.1.1
// traverseFileTree; MIT, vendor/LICENSE.rc-upload.

// Skipping an unavailable file. Source leaves Promise unfinished in error.
function readDirectoryFile(entry: FileSystemFileEntry): Promise<File | undefined> {
  return new Promise(resolve => {
    // Signals the circumvention that the file should be skipped.
    const skipFile = () => resolve(undefined);
    entry.file(resolve, skipFile);
  });
}

// The reading failure completes the current directory in the same way as the last blank portion.
function readDirectoryEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise(resolve => {
    // An empty portion stops reading this directory.
    const finishDirectory = () => resolve([]);
    reader.readEntries(resolve, finishDirectory);
  });
}

/** Bypasses FileSystemEntry in width, reading all portions of directory reader. */
export async function collectUploadDirectoryFiles(
  items: Iterable<Pick<DataTransferItem, 'webkitGetAsEntry'>>,
  isAccepted: (file: File) => boolean
): Promise<File[]> {
  const pending = [...items].map(item => item.webkitGetAsEntry());
  const files: File[] = [];

  for (let index = 0; index < pending.length; index++) {
    const entry = pending[index];
    if (!entry) continue;

    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file = await readDirectoryFile(fileEntry);
      if (!file || !isAccepted(file)) continue;

      if (entry.fullPath && !file.webkitRelativePath) {
        Object.defineProperty(file, 'webkitRelativePath', {
          value: entry.fullPath.replace(/^\//, ''), writable: false
        });
      }
      files.push(file);
    }
    else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      while (true) {
        const entries = await readDirectoryEntries(reader);
        if (!entries.length) break;

        pending.push(...entries);
      }
    }
  }

  return files;
}
