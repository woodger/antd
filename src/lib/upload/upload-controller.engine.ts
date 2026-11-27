// Coordinates the preparation, publication of the list and lifecycle transport Upload. The register
// associates the uid of the file with the transport for subsequent cancellation.
import type {
  UploadFile,
  UploadProps,
  UploadRcFile,
  UploadRequest,
  UploadRequestHandler,
  UploadRequestOptions,
  UploadRef
} from './upload.types';
import {
  UPLOAD_LIST_IGNORE,
  uploadFileObject,
  updateUploadList,
  limitUploadList
} from './upload.engine';
// Life cycle Upload 6.6.8 and AjaxUploader 1.1.1; MIT, vendor/LICENSE.ant-design and LICENSE.rc-upload.
export function createUploadController<T = unknown>(
  options: {
    props: () => UploadProps<T>;
    files: () => readonly UploadFile<T>[];
    setFiles: (files: UploadFile<T>[]) => void;
    defaultRequest: UploadRequestHandler<T>;
    uid: () => string;
  }
) {
  let disposed = false;
  const requests = new Map<string, UploadRequest | void>();
  // Restriction maxCount specifies separately the list and necessity of onChange.
  const publish = (
    file: UploadFile<T> | UploadRcFile,
    list: readonly UploadFile<T>[],
    event?: { percent: number; }
  ) => {
    const result = limitUploadList(file, list, options.props().maxCount);
    options.setFiles(result.list);
    if (result.notify)
      options.props().onChange?.({ file, fileList: result.list, ...(event ? { event } : {}) });
  };
  // Doesn't publish a network response for a deleted file or destroyed Upload.
  const update = (
    file: UploadRcFile,
    patch: Partial<UploadFile<T>>,
    event?: { percent: number; }
  ) => {
    if (disposed || !options.files().some(item => item.uid === file.uid)) {
      return;
    }
    const item = { ...uploadFileObject<T>(file), ...patch };
    const list = updateUploadList(item, options.files());
    publish(item, list, event);
  };
  // Retains the original progress event for public onChange.
  const onProgress: UploadRef<T>['onProgress'] = (event, file) => {
    update(file, { status: 'uploading', percent: event.percent }, event);
  };
  // Saves an opaque server response if the string is not JSON.
  const onSuccess: UploadRef<T>['onSuccess'] = (response, file, xhr) => {
    let parsed: unknown = response;
    try {
      if (typeof response === 'string') parsed = JSON.parse(response);
    }
    catch { /* upstream preserves no-JSON line */ }
    update(file, { status: 'done', percent: 100, response: parsed as T, xhr });
  };
  // Sets the current row to error and passes both parts of the response.
  const onError: UploadRef<T>['onError'] = (error, response, file) => {
    update(file, { status: 'error', error, response });
  };
  // Builds a general list of the batch before the first notification. Callback can remove Upload.
  const onBatchStart: UploadRef<T>['onBatchStart'] = batch => {
    if (disposed) {
      return;
    }
    const accepted = batch.filter(item => !Reflect.get(item.file, UPLOAD_LIST_IGNORE));
    let list = [...options.files()];
    const items = accepted.map(item => uploadFileObject<T>(item.file));
    for (const item of items) list = updateUploadList(item, list);
    accepted.forEach((item, index) => {
      if (disposed) {
        return;
      }
      if (item.parsedFile) {
        items[index].status = 'uploading';
        publish(items[index], list);
      }
      else {
        const clone = new File([item.file], item.file.name, { type: item.file.type });
        const uploadFile = Object.assign(clone, { uid: item.file.uid });
        publish(uploadFile, list);
      }
    });
  };
  // Removes the handle from the registry prior to the abort call, which can synchronously cause callbacks.
  const abort = (file?: UploadFile<T> | string) => {
    const fileUids = file === undefined
      ? [...requests.keys()]
      : [typeof file === 'string' ? file : file.uid];
    for (const fileUid of fileUids) {
      const transport = requests.get(fileUid);
      requests.delete(fileUid);
      transport?.abort?.();
    }
  };

  // Allows beforeUpload until action and data read. The ban and LIST_IGNORE are different.
  async function prepareUploadFile(file: UploadRcFile, batch: UploadRcFile[]) {
    let result: Awaited<ReturnType<NonNullable<UploadProps<T>['beforeUpload']>>>;
    try {
      result = await options.props().beforeUpload?.(file, batch);
    }
    catch {
      result = false;
    }
    if (result === false
      || result === UPLOAD_LIST_IGNORE) {
      return {
        origin: file,
        parsed: null,
        ignored: result === UPLOAD_LIST_IGNORE,
        action: '',
        data: {}
      };
    }
    const props = options.props();
    const action = typeof props.action === 'function'
      ? await props.action(file)
      : props.action ?? '';
    const data = typeof props.data === 'function' ? await props.data(file) : props.data ?? {};
    // Line beforeUpload in Ant wrapper does not replace the file; Blob/File is replaced.
    const transformed = result && typeof result === 'object' ? result : file;
    let parsed: UploadRcFile;
    if (transformed instanceof File) {
      parsed = transformed as UploadRcFile;
    }
    else {
      const replacement = new File([transformed], file.name, { type: file.type });
      parsed = Object.assign(replacement, { uid: file.uid });
    }

    parsed.uid = file.uid;
    return { origin: file, parsed, ignored: false, action, data };
  }

  // Notifies about the finished batch and launches the transport only for accepted files.
  async function upload(files: readonly File[]) {
    const batch = files.map(file => Object.assign(file, { uid: options.uid() }));
    const ready = await Promise.all(batch.map(file => prepareUploadFile(file, batch)));
    if (disposed) {
      return;
    }
    const accepted = ready.filter(item => !item.ignored);
    onBatchStart(accepted.map(item => ({ file: item.origin, parsedFile: item.parsed })));
    for (const item of accepted) {
      startRequest(item);
    }
  }

  // Synchronous completion of customRequest does not leave a handle on the cancellation registry.
  function startRequest(item: Awaited<ReturnType<typeof prepareUploadFile>>) {
    if (!item.parsed || disposed) {
      return;
    }

    const props = options.props();
    const file = item.parsed;
    let completed = false;
    const requestOptions: UploadRequestOptions<T> = {
      action: item.action,
      data: item.data,
      file,
      filename: props.name ?? 'file',
      method: props.method ?? 'post',
      headers: props.headers,
      withCredentials: props.withCredentials,
      // Progress is published with current uid and does not close transportation.
      onProgress: event => onProgress(event, file),
      // Removes the transport to the user notification of success.
      onSuccess: (response, xhr) => {
        completed = true;
        requests.delete(file.uid);
        onSuccess(response, file, xhr);
      },
      // An error ends the transport just like success and retains the response.
      onError: (error, response) => {
        completed = true;
        requests.delete(file.uid);
        onError(error, response, file);
      }
    };
    const transport = props.customRequest
      ? props.customRequest(requestOptions, { defaultRequest: options.defaultRequest })
      : options.defaultRequest(requestOptions);
    if (completed) {
      return;
    }

    if (disposed) {
      // customRequest could unmount Upload before returning the cancellation handler.
      transport?.abort?.();
      return;
    }

    requests.set(file.uid, transport);
  }

  // Awaits permission to remove before the cancellation of the transport and the publication of the list.
  async function remove(file: UploadFile<T>) {
    const result = await options.props().onRemove?.(file);
    if (disposed || result === false) {
      return;
    }
    const list = options.files();
    const next = list.filter(item => item.uid !== file.uid);
    if (next.length === list.length) {
      return;
    }
    for (const item of list) {
      if (item.uid === file.uid && !Object.isFrozen(item))
        item.status = 'removed';
    }
    abort(file);
    publish({ ...file, status: 'removed' }, next);
  }
  return {
    upload,
    remove,
    abort,
    onBatchStart,
    onProgress,
    onSuccess,
    onError,
    // Blocks the publication until active transport is cancelled.
    dispose: () => {
      disposed = true;
      abort();
    }
  };
}
