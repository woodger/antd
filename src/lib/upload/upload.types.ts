import type { Snippet } from 'svelte';
import type { HTMLAnchorAttributes, HTMLAttributes } from 'svelte/elements';
import type { ProgressProps } from '../progress/progress.types';
export interface UploadRcFile extends File {
  uid: string;
  lastModifiedDate?: Date;
}
export type UploadFileStatus = 'error' | 'done' | 'uploading' | 'removed';
export interface UploadFile<T = unknown> {
  uid: string;
  name: string;
  /** Metadata upstream; line label still uses the name. */
  fileName?: string;
  size?: number;
  type?: string;
  lastModified?: number;
  lastModifiedDate?: Date;
  status?: UploadFileStatus;
  percent?: number;
  originFileObj?: UploadRcFile;
  response?: T;
  /** Controlled string metadata: statusText takes precedence over message. */
  error?: Error | ProgressEvent | { statusText?: string; message?: string; };
  xhr?: XMLHttpRequest;
  url?: string;
  /** An empty string preserves the fallback to url and prohibits generation via previewFile. */
  thumbUrl?: string;
  /** Custom preview cache; line image uses thumbUrl or url. */
  preview?: string;
  crossOrigin?: 'anonymous' | 'use-credentials' | '';
  /** Filename link attributes or their JSON; class/onclick/style use native Svelte API. */
  linkProps?: HTMLAnchorAttributes | string;
  /** The available name progress of this file; progress props can overlap it. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
}
export interface UploadLocale {
  uploading?: string;
  removeFile?: string;
  downloadFile?: string;
  uploadError?: string;
  previewFile?: string;
}
export interface UploadRequestOptions<T = unknown> {
  action: string;
  filename: string;
  file: UploadRcFile;
  method: string;
  data?: Record<string, unknown>;
  headers?: Record<string, string | null>;
  withCredentials?: boolean;
  onProgress?: (event: { percent: number; }) => void;
  onSuccess?: (response: T, xhr?: XMLHttpRequest) => void;
  onError?: (error: Error | ProgressEvent, response?: T) => void;
}
export interface UploadRequest {
  abort?: () => void;
}
export type UploadRequestHandler<T = unknown> = (
  options: UploadRequestOptions<T>
) => UploadRequest | void;
export interface UploadChangeParam<T = unknown> {
  file: UploadFile<T> | UploadRcFile;
  fileList: UploadFile<T>[];
  event?: { percent: number; };
}
/** The result of preparation of batch; null preserves the file in the list without uploading status. */
export interface UploadBatchFileInfo {
  file: UploadRcFile;
  parsedFile: File | Blob | string | null;
}
/** Ref nested bootloader with request cancellation. */
export interface UploadUploaderRef<T = unknown> {
  abort: (file?: UploadFile<T> | string) => void;
}
/** Imperative API Upload/Dragger via bind:this; list and DOM refs read from current state. */
export interface UploadRef<T = unknown> {
  /** Publishes the prepared batch without beforeUpload and without the launch of transport. */
  onBatchStart: (batch: readonly UploadBatchFileInfo[]) => void;
  /** Parses the response JSON string. Ignores a uid missing from the current list. */
  onSuccess: (response: T | string, file: UploadRcFile, xhr?: XMLHttpRequest) => void;
  onProgress: (event: { percent: number; }, file: UploadRcFile) => void;
  onError: (
    error: NonNullable<UploadFile<T>['error']>,
    response: T | undefined,
    file: UploadRcFile
  ) => void;
  readonly fileList: readonly UploadFile<T>[];
  /** The delegated abort is available after mount; does not remove the line in itself. */
  readonly upload: UploadUploaderRef<T> | null;
  readonly nativeElement: HTMLSpanElement | undefined;
  readonly inputElement: HTMLInputElement | undefined;
  /** Retains the former direct abort Svelte-component. */
  abort: (file?: UploadFile<T> | string) => void;
}
/** Upload string actions; preview accepts DOM event for regular onclick. */
export interface UploadItemRenderActions {
  download: () => void;
  preview: (event?: MouseEvent) => void;
  remove: () => void;
}
export interface UploadListOptions<T = unknown> {
  showRemoveIcon?: boolean | ((file: UploadFile<T>) => boolean);
  showDownloadIcon?: boolean | ((file: UploadFile<T>) => boolean);
  showPreviewIcon?: boolean | ((file: UploadFile<T>) => boolean);
  /** Snippet receives the current file; the missing prop preserves the original icon. */
  removeIcon?: Snippet<[UploadFile<T>]>;
  downloadIcon?: Snippet<[UploadFile<T>]>;
  previewIcon?: Snippet<[UploadFile<T>]>;
  extra?: Snippet<[UploadFile<T>]>;
}
/** Line Progress without percent/type and deprecated strokeWidth; percentage belongs to the file. */
export type UploadListProgressProps = Omit<
  Extract<ProgressProps, { type?: 'line'; }>,
  'percent' | 'type' | 'strokeWidth'
>;
export type UploadSemanticSlots = Partial<Record<'root' | 'list' | 'item' | 'trigger', string>>;
export interface UploadSemanticInfo<T = unknown> {
  props: UploadProps<T> & {
    listType: NonNullable<UploadProps<T>['listType']>;
    type: 'select' | 'drag';
    multiple: boolean;
    hasControlInside: boolean;
    disabled: boolean;
    showUploadList: NonNullable<UploadProps<T>['showUploadList']>;
  };
}
export type UploadSemanticValue<T = unknown> = UploadSemanticSlots
  | ((info: UploadSemanticInfo<T>) => UploadSemanticSlots | undefined);
/** The general record is replaced entirely in the nested provider; local props has priority. */
export type UploadConfig = Pick<
  UploadProps,
  'class' | 'style' | 'classNames' | 'styles' | 'accept' | 'customRequest' | 'progress'
>;
/** Selection and uploading of files with controlled list, beforeUpload and configurable transport. */
export interface UploadProps<T = unknown> extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'onchange' | 'ondrop' | 'onerror' | 'onprogress'
> {
  /** Local namespace Upload/Dragger and list; blank line inherits ConfigProvider. */
  prefixCls?: string;
  /** A managed list; changes are published through onChange and are pending acceptance by the owner. */
  fileList?: readonly UploadFile<T>[];
  /** Initial list in the absence of fileList. */
  defaultFileList?: readonly UploadFile<T>[];
  /** @defaultValue 'file' */
  name?: string;
  /** @defaultValue '' */
  action?: string | ((file: UploadRcFile) => string | PromiseLike<string>);
  /** @defaultValue 'post' */
  method?: 'POST' | 'PUT' | 'PATCH' | 'post' | 'put' | 'patch';
  data?:
  Record<string, unknown>
  | ((file: UploadFile<T>) => Record<string, unknown> | PromiseLike<Record<string, unknown>>);
  headers?: Record<string, string | null>;
  withCredentials?: boolean;
  /** @defaultValue '' */
  accept?: string | { format?: string; filter?: 'native' | ((file: File) => boolean); };
  /** @defaultValue false */
  multiple?: boolean;
  /**
   * Folder selection and traversal of nested files on drop or paste. Preserves webkitRelativePath.
   * @defaultValue false
   */
  directory?: boolean;
  /**
   * Pastes files from document paste events. Disabled blocks pasting, unlike rc-upload 1.1.1, which
   * has no guard.
   * @defaultValue false
   */
  pastable?: boolean;
  capture?: boolean | 'user' | 'environment';
  disabled?: boolean;
  /** false stops sending, UPLOAD_LIST_IGNORE excludes the file from the list. */
  beforeUpload?: (
    file: UploadRcFile,
    fileList: UploadRcFile[]
  ) => void | boolean | string | Blob | PromiseLike<void | boolean | string | Blob>;
  /** Our own transport; info.defaultRequest provides the original XHR implementation. */
  customRequest?: (
    options: UploadRequestOptions<T>,
    info: { defaultRequest: UploadRequestHandler<T>; }
  ) => UploadRequest | void;
  onChange?: (info: UploadChangeParam<T>) => void;
  /** false or Promise from false prohibits file deletion. */
  onRemove?: (file: UploadFile<T>) => void | boolean | PromiseLike<void | boolean>;
  onDrop?: (event: DragEvent) => void;
  onPreview?: (file: UploadFile<T>) => void;
  onDownload?: (file: UploadFile<T>) => void;
  maxCount?: number;
  /** @defaultValue true */
  openFileDialogOnClick?: boolean;
  /** @defaultValue true */
  hasControlInside?: boolean;
  /** @defaultValue true */
  showUploadList?: boolean | UploadListOptions<T>;
  /** @defaultValue 'text' */
  listType?: 'text' | 'picture' | 'picture-card' | 'picture-circle';
  /** Generator thumbnail for picture lists at originFileObj and thumbUrl === undefined. */
  previewFile?: (file: File | Blob) => PromiseLike<string>;
  isImageUrl?: (file: UploadFile<T>) => boolean;
  /** File icon with context file/listType; finished thumbnail still shows the image. */
  iconRender?: Snippet<[file: UploadFile<T>, listType: NonNullable<UploadProps<T>['listType']>]>;
  /** The original line is Snippet with Tooltip errors; fileList keeps the current order. */
  itemRender?: Snippet<[
    originNode: Snippet,
    file: UploadFile<T>,
    fileList: readonly UploadFile<T>[],
    actions: UploadItemRenderActions
  ]>;
  /** Absence sets size=[-1,2]/showInfo=false; transferred object replaces defaults. */
  progress?: UploadListProgressProps;
  /** Classes wrapper/list/item/trigger; callback receives raw props and resolved defaults. */
  classNames?: UploadSemanticValue<T>;
  /** CSS-lines of the same slots; the usual style overlaps styles.trigger. */
  styles?: UploadSemanticValue<T>;
  locale?: UploadLocale;
  type?: 'select' | 'drag';
  children?: Snippet;
  rootClassName?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLSpanElement;
  /** The native ref is available after mount and cleared on unmount. */
  inputElement?: HTMLInputElement;
}
/** Upload with drag-and-drop surface and additional container height. */
export interface UploadDraggerProps<T = unknown> extends UploadProps<T> {
  height?: number;
}
