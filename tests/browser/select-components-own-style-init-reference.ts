import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGunzip, gunzipSync } from 'node:zlib';
import { readReferenceBytes } from './reference-bytes';
import { selectOwnStyleInitSamples, selectOwnStyleInitEntryPaths, selectOwnStyleInitClientProfile, selectOwnStyleInitPrehydrateSetters,
  type SelectComponentsOwnStyleSample, type SelectComponentsOwnStyleAction, type SelectOwnStyleInitEntryPath } from './select-components-own-style-init-cases.mjs';
import type { ComponentsPoint, ComponentsCase, ComponentsSSRState } from './select-components-reference';
import type { SelectComponentsModesDOM } from './select-components-modes-metrics.mjs';
import type { OwnStyleDetails } from './select-components-own-style-init-metrics.mjs';
export { selectOwnStyleInitSamples as selectComponentsOwnStyleInitSamples, selectOwnStyleInitEntryPaths as selectComponentsOwnStyleInitEntryPaths };
export type { SelectComponentsOwnStyleSample, SelectComponentsOwnStyleAction, SelectOwnStyleInitEntryPath };
export interface OwnStyleInitPoint extends Omit<ComponentsPoint, 'icons' | 'dom'> {
  icons: SelectComponentsModesDOM;
  details: OwnStyleDetails;
  owner: ComponentsPoint['owner'] & { profile: 'same' | 'mismatch'; phase: string; rawSettings: unknown;
    authoredInputProps: unknown; rawAuthoredInputProps: unknown; rawAuthoredInputStyle: unknown;
    inputOwnKeys: string[]; inputOwnDescriptors: unknown[]; inputHasOwnStyle: boolean };
}
export interface OwnStyleInitObservation extends Omit<OwnStyleInitPoint, 'owner'> { owner: Record<string, unknown> }
export interface OwnStyleInitSSRState extends Omit<ComponentsSSRState, 'name'> { refs: Record<string, boolean> }
export interface OwnStyleInitSSRCase { id: string; sample: SelectComponentsOwnStyleSample;
  server: { renderToString: OwnStyleInitSSRState; renderToStaticMarkup: OwnStyleInitSSRState } }
export interface OwnStyleInitCase extends Omit<ComponentsCase, 'initial' | 'steps'> {
  entryPath: SelectOwnStyleInitEntryPath; profile: 'same' | 'mismatch'; prehydrateEdits: Array<{
    property: string;
    value: string
  }>;
  sample: SelectComponentsOwnStyleSample; initial: OwnStyleInitPoint;
  steps: Array<OwnStyleInitPoint & { action: SelectComponentsOwnStyleAction }>;
  server?: OwnStyleInitSSRCase['server']; parsed?: OwnStyleInitObservation; beforeHydration?: OwnStyleInitObservation;
  afterCall?: OwnStyleInitObservation; commit?: OwnStyleInitPoint; beforeUnmount: OwnStyleInitPoint;
  recoverableErrors: unknown[]; network: {
    requests: unknown[];
    requestFailures: unknown[];
    responses: unknown[]
  };
}
export type OwnStyleInitMode = 'csr' | 'ssr' | 'hydrate';
interface Header { axis: string; mode: OwnStyleInitMode; status: string; version: string; react: string; revision: string;
  node: string; chromium: string | null; protocolSha256: string; preservedReferences: number;
  inputPins: Record<string, { bytes: number; sha256: string }>; errors: unknown[]; diagnostics: unknown[];
  archives: Array<{ byteEqual: boolean; sha256: string; archiveSha256: string }> }
export interface OwnStyleInitSource<Value> { reference: Header; cases: Value[] }
interface Copy { mode: OwnStyleInitMode; variant: 'first'; path: string; source: string; storageBytes: number;
  storageSha256: string; decodedBytes: number; decodedSha256: string; losslessDecodedByteEqual: boolean }
interface RepeatChanges { file: string; bytes: number; sha256: string }
interface RepeatProof { mode: OwnStyleInitMode; path: string; bytes: number; sha256: string; wholePairByteEqual: boolean;
  first: { bytes: number; sha256: string }; repeat: { bytes: number; sha256: string };
  changes?: RepeatChanges;
  totalComputedArrays: number; customOrderPermutations: number; otherRawDifferences: number;
  allStandardNamesValuesPrioritiesAndOrderEqual: boolean; allCustomNamesValuesAndPrioritiesEqual: boolean }
// Returns SHA-256 in hexadecimal form for the reconciliation of the recorded data.
const hash = (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
// Allows the path to a local image relative to the module. Current working directory does not
// affect the result.
const fixture = (name: string) => new URL('./fixtures/' + name, import.meta.url);
const protocol = '345e89218b2c7a76172070d95cfa58d815db579997f65ded00596bf57b8b8351';
const manifestBytes = readFileSync(fixture('ant-design-select-components-own-style-init-source-manifest.json'));
assert.equal(manifestBytes.length, 8270);
assert.equal(
  hash(manifestBytes),
  'b1a118873129b9f771f202010efc2d65657fd771dee0b4bbb80c8b66857fe1fc'
);
export const selectComponentsOwnStyleInitManifest = JSON.parse(manifestBytes.toString('utf8')) as {
  status: string; sourceOnly: boolean; allRawSourcesUnchanged: boolean; protocolSha256: string;
  frozenInputs: number; preservedReferences: number; copies: Copy[]; repeatProofs: RepeatProof[];
  counts: { owners: number; entryPaths: number; clientTrajectories: number; actionsPerTrajectory: number;
    clientActions: number; clientInitialAndActionPoints: number; uniqueInitialSSRStates: number; serializersPerSSRState: number };
};
const manifest = selectComponentsOwnStyleInitManifest;
assert.equal(manifest.status, 'passed');
assert.equal(manifest.sourceOnly, true);
assert.equal(manifest.allRawSourcesUnchanged, true);
assert.equal(manifest.protocolSha256, protocol);
assert.equal(manifest.frozenInputs, 10);
assert.equal(manifest.preservedReferences, 848);
assert.equal(manifest.copies.length, 3);
assert.equal(manifest.repeatProofs.length, 3);
assert.deepEqual(manifest.counts, { owners: 2, entryPaths: 4, clientTrajectories: 8, actionsPerTrajectory: 12,
  clientActions: 96, clientInitialAndActionPoints: 104, uniqueInitialSSRStates: 2, serializersPerSSRState: 2 });
const pins: Record<string, [number, string, number, string]> = {
  "ant-design-select-components-own-style-init-csr-first-reference.json.gz": [
    6467865,
    "5b7eb875ef6b9c9e19487e7da88359ef940f02aa6eae9f28470a9635a01ea9c2",
    107628300,
    "e1bf37981fe1c07bc6d3b462c480802ff007e0abfd8545e34a86e97009f3b250"
  ],
  "ant-design-select-components-own-style-init-ssr-reference.json.gz": [
    18918,
    "c932dd27b2f007a82beae1930c491028a424814ac02f86430f072bbd7e688c68",
    374771,
    "611338304e648203c259877e17d5349828230f7b79e5906922b5126f915833a9"
  ],
  "ant-design-select-components-own-style-init-hydrate-first-reference.json.gz": [
    22100630,
    "107ce7a86af25ae957fc59b82bc6645ec384cae751c6c15079da399c11405e0a",
    367593608,
    "b156fecf625b40c03b055f998ea1eec8527dcf1e5233c05db36b20dfdd661100"
  ]
};
const proofPins = {
  csr: { wholePairByteEqual: false, totalComputedArrays: 748, customOrderPermutations: 203,
    sha256: 'cbc4fbb3e78005590cf6316c059f9c1730fe679e266703e48082ec066ffa148f' },
  ssr: { wholePairByteEqual: true, totalComputedArrays: 0, customOrderPermutations: 0,
    sha256: 'b6d03323df9e409b9aa84a074bae901f6e8f25940d68f8bcbf74e82f4c40e320' },
  hydrate: { wholePairByteEqual: false, totalComputedArrays: 2700, customOrderPermutations: 42,
    sha256: '776a891a98a46fe7fcff27119d66d75c079d05441c789e0bcb82ba32f7b8a172' }
};
for (const [mode, expected] of Object.entries(proofPins)) {
  const proof = manifest.repeatProofs.find(value => value.mode === mode);
  assert(proof);
  assert.equal(proof.sha256, expected.sha256);
  assert.equal(proof.wholePairByteEqual, expected.wholePairByteEqual);
  assert.equal(proof.totalComputedArrays, expected.totalComputedArrays);
  assert.equal(proof.customOrderPermutations, expected.customOrderPermutations);
  assert.equal(proof.otherRawDifferences, 0);
  assert.equal(proof.allStandardNamesValuesPrioritiesAndOrderEqual, true);
  assert.equal(proof.allCustomNamesValuesAndPrioritiesEqual, true);
}
/** Verifies the first capture with independent file control sums and the original JSON. */
function canonicalCopy(mode: OwnStyleInitMode): Copy {
  const copy = manifest.copies.find(value => value.mode === mode && value.variant === 'first');
  assert(copy);
  const pin = pins[basename(copy.path)];
  assert(pin);
  assert.deepEqual(
    [copy.storageBytes, copy.storageSha256, copy.decodedBytes, copy.decodedSha256],
    pin
  );
  assert.equal(copy.losslessDecodedByteEqual, true);
  const proof = manifest.repeatProofs.find(value => value.mode === mode);
  assert(proof);
  assert.deepEqual(
    [copy.decodedBytes, copy.decodedSha256],
    [proof.first.bytes, proof.first.sha256]
  );
  return copy;
}
function readCanonical<Value>(mode: OwnStyleInitMode): OwnStyleInitSource<Value> {
  const copy = canonicalCopy(mode);
  const stored = readFileSync(fixture(basename(copy.path)));
  assert.equal(stored.length, copy.storageBytes);
  assert.equal(hash(stored), copy.storageSha256);
  const raw = gunzipSync(stored);
  assert.equal(raw.length, copy.decodedBytes);
  assert.equal(hash(raw), copy.decodedSha256);
  const result = JSON.parse(raw.toString('utf8')) as OwnStyleInitSource<Value>, header = result.reference;
  assert.equal(header.axis, 'own-style-init-update-hydration');
  assert.equal(header.mode, mode);
  assert.equal(header.status, 'completed-observation');
  assert.equal(header.version, '6.6.8');
  assert.equal(header.react, '18.3.1');
  assert.equal(header.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
  assert.equal(header.node, 'v24.18.0');
  assert.equal(header.chromium, mode === 'ssr' ? null : '157.0.8103.78');
  assert.equal(header.protocolSha256, protocol);
  assert.equal(header.preservedReferences, 848);
  assert.equal(Object.keys(header.inputPins).length, 10);
  assert.deepEqual(header.errors, []);
  assert.deepEqual(header.diagnostics, []);
  assert.equal(header.archives.length, 4);
  assert(header.archives.every(value => value.byteEqual));
  assert.equal(
    header.archives[0].sha256,
    'e13aa9008d4d9edbb4cad022197f568227cc224b0ba016e5356ba29ed7a7e3f4'
  );
  assert.equal(
    header.archives[0].archiveSha256,
    '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa'
  );
  return result;
}
let csr: OwnStyleInitSource<OwnStyleInitCase> | undefined, hydrate: OwnStyleInitSource<OwnStyleInitCase> | undefined;
let ssr: OwnStyleInitSource<OwnStyleInitSSRCase> | undefined;
export function readSelectComponentsOwnStyleInitSSR(): OwnStyleInitSource<OwnStyleInitSSRCase> {
  if (ssr) {
    return ssr;
  }
  const source = readCanonical<OwnStyleInitSSRCase>('ssr');
  assert.deepEqual(
    source.cases.map(value => value.id),
    selectOwnStyleInitSamples.map(sample => sample.id)
  );
  for (const value of source.cases) {
    for (const state of Object.values(value.server)) {
      assert.equal(state.htmlSha256, hash(Buffer.from(state.rawHtml)));
      assert(Object.values(state.refs).every(Boolean));
      assert.deepEqual(state.resources, { timers: 0, frames: 0, measurements: 0, microtasks: 0 });
      assert.deepEqual(state.state.events, []);
      assert.deepEqual(state.state.rawEvents, []);
      assert.deepEqual(state.state.lifecycle, []);
    }
  }
  return ssr = source;
}
export function readSelectComponentsOwnStyleInitSource(mode: 'csr' | 'hydrate'): OwnStyleInitSource<OwnStyleInitCase> {
  const cached = mode === 'csr' ? csr : hydrate;
  if (cached) {
    return cached;
  }
  const source = readCanonical<OwnStyleInitCase>(mode), paths = mode === 'csr' ? ['csr'] : selectOwnStyleInitEntryPaths.filter(value => value !== 'csr');
  assert.deepEqual(
    source.cases.map(value => [value.id, value.entryPath]),
    selectOwnStyleInitSamples.flatMap(sample => paths.map(path => [sample.id, path]))
  );
  assert.equal(
    source.cases.reduce((sum, value) => sum + value.steps.length, 0),
    mode === 'csr' ? 24 : 72
  );
  for (const value of source.cases) {
    const sample = selectOwnStyleInitSamples.find(sample => sample.id === value.id);
    assert(sample);
    assert.deepEqual(value.sample, sample);
    assert.deepEqual(value.steps.map(step => step.action), sample.actions);
    assert.equal(value.profile, selectOwnStyleInitClientProfile(value.entryPath));
    assert.deepEqual(value.prehydrateEdits, selectOwnStyleInitPrehydrateSetters(value.entryPath));
    assert.deepEqual(value.recoverableErrors, []);
    assert.deepEqual(value.network, { requests: [], requestFailures: [], responses: [] });
    assert.equal(value.cleanup.popupCount, 0);
    assert.equal(value.cleanup.ownerCount, 0);
    assert(Object.values(value.cleanup.refs).every(Boolean));
    assert(value.cleanup.retainedConnected.every(node => !node.connected));
    assert.deepEqual(value.late, { events: value.cleanup.events, rawEvents: value.cleanup.rawEvents,
      producerCalls: value.cleanup.producerCalls, lifecycle: value.cleanup.lifecycle, bodyActivity: value.cleanup.bodyActivity });
    if (mode === 'hydrate') {
      const server = readSelectComponentsOwnStyleInitSSR().cases.find(sample => sample.id === value.id);
      assert(server);
      assert.deepEqual(
        value.server,
        server.server,
        'Actual SSR inputs match the independently measured DOM-free initial states'
      );
      assert(value.parsed && value.beforeHydration && value.afterCall && value.commit);
    }
  }
  if (mode === 'csr') {
    csr = source;
  }
  else {
    hydrate = source;
  }
  return source;
}
export function readSelectComponentsOwnStyleInitCase(
  id: string,
  entryPath: SelectOwnStyleInitEntryPath = 'csr'
): OwnStyleInitCase {
  const source = readSelectComponentsOwnStyleInitSource(entryPath === 'csr' ? 'csr' : 'hydrate');
  const result = source.cases.find(value => value.id === id && value.entryPath === entryPath);
  assert(result);
  return result;
}
/** Displacements and replacement lengths are measured in bytes of the original UTF-8, including indents and line translations. */
function readRepeatChanges(record: RepeatChanges, captureBytes: number) {
  const raw = readReferenceBytes(record.file);
  assert.equal(raw.length, record.bytes);
  assert.equal(hash(raw), record.sha256);

  const rows: { offset: number; text: string }[] = JSON.parse(raw.toString('utf8'));
  const changes: { offset: number; bytes: Buffer }[] = [];
  let previousEnd = 0;
  for (const { offset, text } of rows) {
    const bytes = Buffer.from(text, 'utf8');
    assert(Number.isSafeInteger(offset) && offset >= previousEnd);
    previousEnd = offset + bytes.length;
    assert(bytes.length > 0 && previousEnd <= captureBytes);
    changes.push({ offset, bytes });
  }
  return changes;
}

/** Verifies the original SHA-256 re-measuring without loading the second hydration graph into memory. */
export async function verifySelectComponentsOwnStyleInitRepeat(mode: 'csr' | 'hydrate') {
  const copy = canonicalCopy(mode);
  const proof = manifest.repeatProofs.find(value => value.mode === mode);
  assert(proof?.changes);
  const changes = readRepeatChanges(proof.changes, copy.decodedBytes);

  const firstHash = createHash('sha256');
  const repeatHash = createHash('sha256');
  let position = 0;
  let next = 0;
  const file = fixture(basename(copy.path));
  await pipeline(createReadStream(file), createGunzip(), async source => {
    for await (const chunk of source) {
      firstHash.update(chunk);
      const end = position + chunk.length;

      // A replacement can cross a decompression chunk boundary.
      while (next < changes.length && changes[next].offset < end) {
        const { offset, bytes } = changes[next];
        const start = Math.max(position, offset);
        const stop = Math.min(end, offset + bytes.length);
        bytes.copy(chunk, start - position, start - offset, stop - offset);
        if (stop < offset + bytes.length) {
          break;
        }
        next++;
      }

      repeatHash.update(chunk);
      position = end;
    }
  });

  assert.equal(next, changes.length);
  assert.equal(position, copy.decodedBytes);
  assert.equal(firstHash.digest('hex'), copy.decodedSha256);
  const sha256 = repeatHash.digest('hex');
  assert.equal(position, proof.repeat.bytes);
  assert.equal(sha256, proof.repeat.sha256);
  return { bytes: position, sha256 };
}
