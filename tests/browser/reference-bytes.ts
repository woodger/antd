import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

/** Returns the original measurement bytes for JSON parsing and checksum verification. */
export function readReferenceBytes(filename: string): Buffer {
  const file = new URL('./fixtures/' + filename, import.meta.url);
  const stored = readFileSync(file);
  return filename.endsWith('.gz') ? gunzipSync(stored) : stored;
}
