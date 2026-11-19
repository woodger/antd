// Обходит перетаскиваемые каталоги для Upload. Чтение каталога продолжается
// до пустой порции, а путь сохраняется у принятого файла.
// Ant Design 6.6.8 / rc-upload 1.1.1 traverseFileTree; MIT, vendor/LICENSE.rc-upload.

// Пропускает недоступный файл. Source оставляет Promise незавершённым при ошибке.
function readDirectoryFile(entry: FileSystemFileEntry): Promise<File | undefined> {
  return new Promise(resolve => {
    // Сигнализирует обходу, что файл следует пропустить.
    const skipFile = () => resolve(undefined);
    entry.file(resolve, skipFile);
  });
}

// Сбой чтения завершает текущий каталог так же, как последняя пустая порция.
function readDirectoryEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise(resolve => {
    // Пустая порция останавливает чтение этого каталога.
    const finishDirectory = () => resolve([]);
    reader.readEntries(resolve, finishDirectory);
  });
}

/** Обходит FileSystemEntry в ширину, читая все порции directory reader. */
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
