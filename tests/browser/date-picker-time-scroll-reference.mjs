import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';

const fixture = name => new URL('./fixtures/' + name, import.meta.url);
const sha = value => createHash('sha256').update(value).digest('hex');
const file = 'ant-design-date-picker-time-scroll-source-manifest.json';
const bytes = readFileSync(fixture(file));
assert.equal(sha(bytes), '5098be724cc6c2bd7c58f3f61ba9c2fddbd025c8339e215f21cea20147213876');
const metadata = JSON.parse(bytes);
assert.equal(metadata.sourceOnly, true);
assert.equal(metadata.NativeDataUsed, false);
assert.equal(
  metadata.protocolSHA256,
  '6ab38509e7c2f926c146ed85884674c3e3c438b3163d174078aeb36d34535274'
);
function decode(entry) {
  const stored = readFileSync(fixture(entry.fixture));
  assert(stored.length < 1000000);
  assert.equal(stored.length, entry.original.gzipBytes);
  assert.equal(sha(stored), entry.original.gzipSHA256);
  const decoded = gunzipSync(stored);
  assert.equal(decoded.length, entry.original.bytes);
  assert.equal(sha(decoded), entry.original.sha256);
  return JSON.parse(decoded);
}
const captures = new Map();
export function readTimeScrollSourceCapture(variant = 'first') {
  assert(['first', 'repeat'].includes(variant));
  if (!captures.has(variant)) captures.set(variant, decode(metadata.captures[variant]));
  return captures.get(variant);
}
export function readTimeScrollSourceCase(id, variant = 'first') {
  const result = readTimeScrollSourceCapture(variant).cases.find(row => row.id === id);
  assert(result, 'Unknown actual Source scroll profile');
  return result;
}
export function readTimeScrollSourcePart(part) {
  const entry = metadata.parts[part.rawJSONPart.file];
  assert(entry, 'Source original path has no portable whole-file mapping');
  assert.deepEqual(entry.original, part.rawJSONPart);
  return decode(entry);
}
export function verifyAllTimeScrollSource() {
  for (const entry of Object.values(metadata.documents)) {
    const raw = readFileSync(fixture(entry.fixture));
    assert.equal(raw.length, entry.original.bytes);
    assert.equal(sha(raw), entry.original.sha256);
  }
  for (const variant of ['first', 'repeat']) {
    const capture = readTimeScrollSourceCapture(variant);
    assert.equal(capture.sourceProtocol.sha256, metadata.protocolSHA256);
    assert.deepEqual(capture.actualCounts, { owners: 2, actions: 17, logicalPoints: 19,
      closedAfter1000: 2, trustedWheelActions: 5 });
    assert.deepEqual(capture.errors, []);
    assert.deepEqual(capture.diagnostics, []);
    assert.equal(capture.terminalInputVerification.unchanged, true);
  }
  for (const entry of Object.values(metadata.parts)) decode(entry);
  return { parts: Object.keys(metadata.parts).length,
    blobs: Object.keys(metadata.blobs).length, sourceOnly: true };
}
