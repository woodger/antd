// XHR-транспорт Upload сохраняет исходные события прогресса и возвращает
// отмену конкретного запроса. Формирование списка остаётся у контроллера.
import type { UploadRequestOptions } from './upload.types';
// XHR-транспорт rc-upload 1.1.1; MIT, vendor/LICENSE.rc-upload.

// Добавляет поля до файла. Массивы передаются повторяющимися ключами с [].
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

// Устанавливает обработчики и заголовки до send. Явный null исключает заголовок.
export function uploadRequest<T = unknown>(option: UploadRequestOptions<T>) {
  const xhr = new XMLHttpRequest();
  if (option.onProgress && xhr.upload) {
    // Передаёт тот же ProgressEvent с percent, если известен total.
    xhr.upload.onprogress = event => {
      const progress = event as ProgressEvent & { percent: number; };
      if (event.total > 0)
        progress.percent = event.loaded / event.total * 100;
      option.onProgress?.(progress);
    };
  }
  const body = createUploadBody(option);

  // Сохраняет непрозрачный ответ, если текст не разбирается как JSON.
  const readResponse = () => {
    const text = xhr.responseText || xhr.response;
    try {
      return JSON.parse(text);
    }
    catch {
      return text;
    }
  };
  // Ошибка транспорта передаётся без преобразования события.
  xhr.onerror = event => option.onError?.(event);
  // Декодирует ответ только если соответствующий callback установлен.
  xhr.onload = () => {
    if (xhr.status < 200 || xhr.status >= 300) {
      const error = Object.assign(
        new Error(`cannot ${option.method} ${option.action} ${xhr.status}'`),
        { status: xhr.status, method: option.method, url: option.action }
      );
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
    // Отменяет XHR этого вызова. Список файлов принадлежит контроллеру.
    abort: () => xhr.abort()
  };
}
