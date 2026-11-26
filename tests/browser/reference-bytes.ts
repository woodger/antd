import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

/** Возвращает исходные байты замера для разбора JSON и сверки его контрольной суммы. */
export function readReferenceBytes(filename: string): Buffer {
  const file = new URL('./fixtures/' + filename, import.meta.url);
  const stored = readFileSync(file);
  return filename.endsWith('.gz') ? gunzipSync(stored) : stored;
}
