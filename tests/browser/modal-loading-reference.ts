import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type { ModalLoadingAction, ModalLoadingSample } from './modal-loading-cases.mjs';
import type { ModalLoadingCleanup, ModalLoadingPoint } from './modal-loading-metrics.mjs';

export interface ModalLoadingSourceCase {
  id: string; sample: ModalLoadingSample; initial: ModalLoadingPoint;
  steps: Array<{ action: ModalLoadingAction; actual: ModalLoadingPoint }>;
  beforeUnmount: ModalLoadingPoint; cleanup: ModalLoadingCleanup; late: ModalLoadingCleanup;
  failure: null; observationErrors: unknown[];
  network: { requests: unknown[]; failures: unknown[]; responses: unknown[] };
}
export interface ModalLoadingSourceCSR {
  reference: { axis: string; mode: 'csr'; version: string; react: string; revision: string; node: string; chromium: string;
    protocolSha256: string; inputPins: Record<string, { bytes: number; sha256: string }>;
    preservedReferenceCount: number; protectedProductionStandCount: number;
    pinsChanged: unknown[]; errors: unknown[]; diagnostics: unknown[] };
  cases: ModalLoadingSourceCase[];
}
const fixture = (name: string) => new URL('./fixtures/' + name, import.meta.url);
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const readPinned = (name: string, bytes: number, sha256: string) => {
  const value = readFileSync(fixture(name));
  assert.equal(value.length, bytes, name + ' stored bytes');
  assert.equal(hash(value), sha256, name + ' SHA-256');
  return value;
};
let cache: ModalLoadingSourceCSR | undefined;
/** Returns the complete unmodified Source corpus, including all raw graphs and DOM snapshots. */
export function readModalLoadingSourceCSR(): ModalLoadingSourceCSR {
  if (cache) return cache;
  const manifestBytes = readPinned('ant-design-modal-loading-source-manifest.json', 6291, 'd927d8c7aa2b7d2cc3e3e3f8beea7aae0fc451f82e740142905edc8adb0610c9');
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  assert.equal(manifest.format, 'ant-design-plain-modal-loading-csr-v1');
  assert.equal(manifest.wholeRawByteEqual, true);
  assert.deepEqual(manifest.serialization, { lossless: true, fieldsDropped: [], fieldsRewritten: [], sourceExpectedValuesDerivedFromNative: false });
  assert.deepEqual(Object.keys(manifest.copies), ['first', 'repeat']);
  assert.deepEqual(manifest.counts, { owners: 2, actions: 10, initialAndSettledPoints: 12, cleanup: 2, late1000: 2 });
  const stored = readPinned('ant-design-modal-loading-reference.json.gz', 119555, '43a0f7869d06d6a4abf6cfd67a29624a79a41c46ee07de2fec98005c53e4d9e1');
  const decoded = gunzipSync(stored);
  assert.equal(decoded.length, 3008606);
  assert.equal(hash(decoded), '6e895d3f9c10b2815cd14462524b3aab97a099036171312484f6bf029f5daad6');
  assert.deepEqual(manifest.artifact, { file: 'ant-design-modal-loading-reference.json.gz',
    storage: { bytes: stored.length, sha256: hash(stored) }, decoded: { bytes: decoded.length, sha256: hash(decoded) } });
  for (const variant of ['first', 'repeat']) {
    const copy = manifest.copies[variant];
    assert.equal(copy.file, manifest.artifact.file);
    assert.equal(copy.independentlyCapturedRaw.file, '.upstream/artifacts/modal-loading-source-v1/source-' + variant + '.json');
    assert.equal(copy.independentlyCapturedRaw.bytes, decoded.length);
    assert.equal(copy.independentlyCapturedRaw.sha256, hash(decoded));
    assert.equal(copy.originalCompressedRaw.file, copy.independentlyCapturedRaw.file + '.gz');
    assert.equal(copy.originalCompressedRaw.bytes, stored.length);
    assert.equal(copy.originalCompressedRaw.sha256, hash(stored));
  }
  const protocolBytes = readPinned('ant-design-modal-loading-source-protocol.json', 187678, '4d3e2a1fbfbc4e13a11fecc5d4157701dd692c96e6db0b0c7864a9f475af4ee7');
  const protocol = JSON.parse(protocolBytes.toString('utf8'));
  assert.equal(protocol.status, 'frozen-after-root-review-before-source-capture');
  assert.equal(protocol.axis, manifest.axis); assert.equal(protocol.mode, 'csr');
  assert.equal(protocol.productionStands.length, 12);
  assert.equal(Object.keys(protocol.inputPins).length, 17);
  assert.equal(Object.keys(protocol.preservedReferences).length, 819);
  assert.equal(protocol.publicCaller.customFooter, 'ReactNode child component; no footer render-function');
  assert.equal(protocol.publicCaller.callbacks, 'Ordinary caller ignores cancel/ok arguments; afterClose is observed; afterOpenChange is omitted; no callback event API parity claim');
  const proofBytes = readPinned('ant-design-modal-loading-source-repeat-proof.json', 12149, '2a7fcc82d12f7d74856259c71c3e73c004ebcea00c39d6c1f6ada7df36297d9d');
  const proof = JSON.parse(proofBytes.toString('utf8'));
  assert.equal(proof.wholeByteEqual, true); assert.equal(proof.normalizationsApplied, false);
  for (const variant of ['first', 'repeat']) {
    assert.deepEqual(proof.raws[variant], manifest.artifact.decoded);
    assert.deepEqual(proof.losslessGzips[variant], manifest.artifact.storage);
  }
  assert.deepEqual(proof.protocol, { bytes: protocolBytes.length, sha256: hash(protocolBytes) });
  const source = JSON.parse(decoded.toString('utf8')) as ModalLoadingSourceCSR;
  assert.deepEqual(source.reference, manifest.sourceHeader);
  assert.equal(source.reference.axis, 'plain-modal-loading-body-footer-lifecycle');
  assert.equal(source.reference.mode, 'csr'); assert.equal(source.reference.version, '6.6.8');
  assert.equal(source.reference.react, '18.3.1'); assert.equal(source.reference.node, 'v24.18.0');
  assert.equal(source.reference.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
  assert.equal(source.reference.chromium, '157.0.8103.78');
  assert.equal(source.reference.protocolSha256, hash(protocolBytes));
  assert.deepEqual(source.reference.inputPins, protocol.inputPins);
  assert.equal(source.reference.preservedReferenceCount, 819); assert.equal(source.reference.protectedProductionStandCount, 12);
  assert.deepEqual(source.reference.errors, []); assert.deepEqual(source.reference.diagnostics, []); assert.deepEqual(source.reference.pinsChanged, []);
  assert.deepEqual(source.cases.map(entry => entry.id), ['default-footer', 'custom-footer-local-prefix']);
  assert.deepEqual(source.cases.map(entry => entry.id), manifest.caseIds);
  source.cases.forEach((entry, index) => {
    assert.deepEqual(entry.sample, protocol.samples[index]); assert.equal(entry.id, entry.sample.id);
    assert.deepEqual(entry.steps.map(step => step.action), entry.sample.actions);
    assert.equal(entry.steps.length, 5); assert.equal(entry.failure, null); assert.deepEqual(entry.observationErrors, []);
    assert.deepEqual(entry.network, { requests: [], failures: [], responses: [] });
    for (const point of [entry.initial, ...entry.steps.map(step => step.actual), entry.beforeUnmount]) {
      assert(point.owner.props && point.owner.rawProps);
      assert.equal(point.owner.events.length, point.owner.rawEvents.length);
      assert.deepEqual(point.browserOwnedResourceCounters, manifest.browserOwnedResourceCounters);
    }
    for (const point of [entry.cleanup, entry.late]) assert.deepEqual(point.browserOwnedResourceCounters, manifest.browserOwnedResourceCounters);
    assert.deepEqual(entry.cleanup, entry.late);
  });
  return cache = source;
}
export function readModalLoadingSourceCase(id: string): ModalLoadingSourceCase {
  const entry = readModalLoadingSourceCSR().cases.find(entry => entry.id === id);
  assert(entry, 'Unknown measured Modal.loading case: ' + id);
  return entry;
}
