// Describes an Upload file list and representation. The selection and recognition of images do not
// use transport.
import type { HTMLAnchorAttributes } from 'svelte/elements';
import type { UploadFile, UploadProps, UploadRcFile } from './upload.types';
// Ant Design 6.6.8 / rc-upload 1.1.1; MIT, vendor/LICENSE.ant-design and LICENSE.rc-upload.
export const UPLOAD_LIST_IGNORE = '__ANT_SVELTE_UPLOAD_LIST_IGNORE__';

// Gives the server string response a priority over statusText, message and general fallback.
export function getUploadErrorMessage(response: unknown, error: unknown, fallback: string): string {
  if (typeof response === 'string' && response) {
    return response;
  }
  if (error === null || (typeof error !== 'object' && typeof error !== 'function')) {
    return fallback;
  }

  const statusText: unknown = Reflect.get(error, 'statusText');
  if (typeof statusText === 'string' && statusText) {
    return statusText;
  }
  const message: unknown = Reflect.get(error, 'message');

  return typeof message === 'string' && message ? message : fallback;
}

/** The unvalid JSON emits SyntaxError as the original filename render. */
export function resolveUploadLinkProps(value: UploadFile['linkProps']): HTMLAnchorAttributes {
  const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value;

  return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
    ? parsed as HTMLAnchorAttributes
    : {};
}

// Copies string metadata by saving a link to the original File.
export function uploadFileObject<T = unknown>(file: UploadRcFile): UploadFile<T> {
  return {
    ...file,
    lastModified: file.lastModified,
    lastModifiedDate: file.lastModifiedDate,
    name: file.name,
    size: file.size,
    type: file.type,
    uid: file.uid,
    percent: 0,
    originFileObj: file
  };
}
// Updates the uid entry at the previous position or adds it to the end.
export function updateUploadList<T = unknown>(
  file: UploadFile<T>,
  list: readonly UploadFile<T>[]
): UploadFile<T>[] {
  const next = [...list];
  const index = next.findIndex(item => item.uid === file.uid);
  if (index < 0) {
    next.push(file);
  }
  else {
    next[index] = file;
  }
  return next;
}
// Separately calculates the new list and the need for onChange. At maxCount = 1 the last file
// remains.
export function limitUploadList<T = unknown>(
  file: UploadFile<T> | UploadRcFile,
  list: readonly UploadFile<T>[],
  maxCount?: number
) {
  const next = maxCount === 1 ? list.slice(-1) : maxCount ? list.slice(0, maxCount) : [...list];
  return {
    list: next,
    notify: maxCount === 1
      || !maxCount
      || list.length <= maxCount
      || 'status' in file
      && file.status === 'removed'
      || next.some(
        item => item.uid === file.uid
      )
  };
}
// Matches extensions, MIME, and wildcard with File name and type.
export function uploadAccept(file: Pick<File, 'name' | 'type'>, accept?: string): boolean {
  if (!accept) {
    return true;
  }
  return accept.split(',').some(type => {
    const valid = type.trim();
    if (/^\*(\/\*)?$/.test(type)) {
      return true;
    }
    if (valid.startsWith('.')) {
      const lower = valid.toLowerCase();
      return (lower === '.jpg' || lower === '.jpeg' ? ['.jpg', '.jpeg'] : [lower]).some(
        ext => file.name.toLowerCase().endsWith(ext)
      );
    }
    if (valid.endsWith('/*')) {
      return file.type.replace(/\/.*$/, '') === valid.replace(
        /\/.*$/,
        ''
      );
    }
    return file.type === valid || /^\w+$/.test(valid);
  });
}
// Follows the native and user filter until the forced check accept.
export function filterUploadFile(
  file: File,
  accept: UploadProps['accept'],
  force: boolean
): boolean {
  if (typeof accept === 'object') {
    if (accept.filter === 'native') {
      return true;
    }
    if (typeof accept.filter === 'function') {
      return accept.filter(file);
    }
  }
  return !force || uploadAccept(file, typeof accept === 'string' ? accept : accept?.format);
}
// Without thumbnail MIME takes precedence. In other words, it classifies URL and expansion.
export function uploadIsImage(file: UploadFile): boolean {
  if (file.type && !file.thumbUrl) {
    return file.type.startsWith('image/');
  }
  const url = file.thumbUrl || file.url || '';
  const name = (url || file.name).split('/').at(-1)?.split(/#|\?/)[0] ?? '';
  const ext = /\.[^./\\]*$/.exec(name)?.[0]?.toLowerCase();
  if (url.startsWith('data:image/')
    || [
      '.avif',
      '.bmp',
      '.dpg',
      '.gif',
      '.heic',
      '.heif',
      '.ico',
      '.jfif',
      '.jpg',
      '.jpeg',
      '.png',
      '.svg',
      '.tif',
      '.tiff',
      '.webp'
    ].includes(
      ext ?? ''
    )) {
    return true;
  }
  return !url.startsWith('data:') && !ext;
}
