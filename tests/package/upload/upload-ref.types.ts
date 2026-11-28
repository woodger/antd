import type { UploadDragger, UploadRcFile, UploadRef } from '@woodger/antd';

type UploadResponse = { stored: boolean; };
type DraggerRef = ReturnType<typeof UploadDragger<UploadResponse>>;

export function checkDraggerRef(ref: DraggerRef, file: UploadRcFile, response: UploadResponse) {
  const uploadRef: UploadRef<UploadResponse> = ref;
  const error = new Error('Failed to upload');

  ref.onBatchStart([{ file, parsedFile: file }]);
  ref.onProgress({ percent: 50 }, file);
  ref.onSuccess(response, file);
  ref.onError(error, response, file);

  // @ts-expect-error The structured response must match the component's response type.
  ref.onSuccess({ stored: 1 }, file);
  // @ts-expect-error The error response uses the same response type.
  ref.onError(error, { stored: 1 }, file);

  return uploadRef;
}
