// XHR-transport Upload preserves the starting events of the progress and returns the cancellation
// of a specific query. Formation of the list remains with the controller.
import type { UploadRequestOptions } from './upload.types';
// XHR-transportation rc-upload 1.1.1; MIT, vendor/LICENSE.rc-upload.

// Adds fields before the file. Arrays use repeated keys with [].
function createUploadBody<T>(option: UploadRequestOptions<T>): FormData {
  const body = new FormData();
  for (const [key, value] of Object.entries(option.data ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        body.append(`${key}[]`, item as string | Blob);
      }
    }
    else {
      body.append(key, value as string | Blob);
    }
  }

  body.append(option.filename, option.file, option.file.name);
  return body;
}

// Installs handlers and headers before sending. Explicit null rules out the headline.
export function uploadRequest<T = unknown>(option: UploadRequestOptions<T>) {
  const xhr = new XMLHttpRequest();
  if (option.onProgress && xhr.upload) {
    // Passes the same ProgressEvent with percent when total is known.
    xhr.upload.onprogress = event => {
      const progress = event as ProgressEvent & { percent: number; };
      if (event.total > 0)
        progress.percent = event.loaded / event.total * 100;
      option.onProgress?.(progress);
    };
  }
  const body = createUploadBody(option);

  // Saves an opaque response if the text does not understand as JSON.
  const readResponse = () => {
    const text = xhr.responseText || xhr.response;
    try {
      return JSON.parse(text);
    }
    catch {
      return text;
    }
  };
  // Passes the transport error without converting the event.
  xhr.onerror = event => option.onError?.(event);
  // Decodes the answer only if the corresponding callback is installed.
  xhr.onload = () => {
    if (xhr.status < 200 || xhr.status >= 300) {
      const transportError = new Error(`cannot ${option.method} ${option.action} ${xhr.status}'`);
      const error = Object.assign(transportError, {
        status: xhr.status, method: option.method, url: option.action
      });
      option.onError?.(error, readResponse());
    }
    else {
      option.onSuccess?.(readResponse(), xhr);
    }
  };
  xhr.open(option.method, option.action, true);
  if (option.withCredentials)
    xhr.withCredentials = true;
  if (option.headers?.['X-Requested-With'] !== null)
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  for (const [key, value] of Object.entries(option.headers ?? {})) {
    if (value !== null)
      xhr.setRequestHeader(key, value);
  }
  xhr.send(body);

  return {
    // Cancels XHR of this call. The list of files belongs to the controller.
    abort: () => xhr.abort()
  };
}
