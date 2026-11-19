import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { selectComponentsHydrationSamples, type SelectComponentsHydrationSample,
  type SelectComponentsHydrationAction } from './fixtures/select-components-hydration-cases.mjs';
import type { ComponentsHydrationOwner, ComponentsHydrationPoint } from './select-components-hydration-metrics.mjs';

export interface ComponentsHydrationServer {
  rawHtml: string; htmlSha256: string; state: ComponentsHydrationOwner;
  resources: { timers: number; frames: number; measurements: number; microtasks: number };
}
export interface ComponentsHydrationSourceCase {
  id: string; sample: SelectComponentsHydrationSample;
  server: {
    renderToString: ComponentsHydrationServer;
    renderToStaticMarkup: ComponentsHydrationServer
  };
  parsed: ComponentsHydrationPoint; beforeHydration: ComponentsHydrationPoint; afterCall: ComponentsHydrationPoint;
  commit: ComponentsHydrationPoint; initial: ComponentsHydrationPoint;
  steps: Array<{
    action: SelectComponentsHydrationAction;
    immediate?: ComponentsHydrationPoint;
    settled: ComponentsHydrationPoint
  }>;
  beforeUnmount: ComponentsHydrationPoint; afterUnmount: ComponentsHydrationPoint; lateCleanup: ComponentsHydrationPoint;
  recoverableErrors: unknown[];
}
interface Pin { bytes: number; sha256: string }
interface Manifest {
  status: string; sourceOnly: boolean; allRawSourcesUnchanged: boolean;
  protocol: Pin;
  copy: { storageBytes: number; storageSha256: string; decodedBytes: number; decodedSha256: string;
    repeatBytes: number; repeatSHA256: string; wholePairByteEqual: boolean };
  portableInputs: Array<Pin & { path: string; source: string; byteEqual: boolean }>;
  boundaries: Array<{ name: string; scope: string }>;
}
interface SourceHeader {
  stage: string; mode: string; version: string; react: string; revision: string; protocolSha256: string;
  archives: Array<{ sha256: string; archiveSha256: string; byteEqual: boolean }>;
  inputPins: Record<string, Pin>; originalSourcePins: Record<string, Pin>; preservedEvidence: Record<string, Pin>;
  errors: unknown[]; diagnostics: unknown[];
}
// Разрешает путь к локальному снимку относительно модуля. Текущий рабочий каталог не влияет на
// результат.
const fixture = (name: string) => new URL('./fixtures/' + name, import.meta.url);
export const componentsHydrationHash = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(readFileSync(
  fixture('ant-design-select-components-hydration-source-manifest.json'),
  'utf8'
)) as Manifest;
assert.equal(manifest.status, 'passed');
assert.equal(manifest.sourceOnly, true);
assert.equal(manifest.allRawSourcesUnchanged, true);
assert.equal(
  manifest.protocol.sha256,
  'b77c356b0aa6d4d21c2539ab426eb27040e053f878305e53b986b1b62d922105'
);
assert.deepEqual([manifest.copy.storageBytes, manifest.copy.storageSha256, manifest.copy.decodedBytes, manifest.copy.decodedSha256],
  [17521, '24d7ab4aabfb316c2df5fb4ad218d992213d6378b9ead8182ad40fbc3a324b7f', 463119, 'a627192f3ebcee9c1135ee3710eb1569990d0848e424140f846cca4523295937']);
assert.equal(manifest.copy.wholePairByteEqual, true);
assert.equal(manifest.copy.repeatBytes, manifest.copy.decodedBytes);
assert.equal(manifest.copy.repeatSHA256, manifest.copy.decodedSha256);
const stored = readFileSync(fixture('ant-design-select-components-hydration-reference.json.gz'));
assert.equal(stored.length, manifest.copy.storageBytes);
assert.equal(componentsHydrationHash(stored), manifest.copy.storageSha256);
const decoded = gunzipSync(stored);
assert.equal(decoded.length, manifest.copy.decodedBytes);
assert.equal(componentsHydrationHash(decoded), manifest.copy.decodedSha256);
export const selectComponentsHydrationReference = JSON.parse(decoded.toString('utf8')) as {
  reference: SourceHeader; cases: ComponentsHydrationSourceCase[];
};
const header = selectComponentsHydrationReference.reference;
assert.equal(header.mode, 'actual-react-hydration');
assert.equal(header.version, '6.6.8');
assert.equal(header.react, '18.3.1');
assert.equal(header.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
assert.equal(header.protocolSha256, manifest.protocol.sha256);
assert.deepEqual(header.errors, []);
assert.deepEqual(header.diagnostics, []);
assert(header.archives.every(archive => archive.byteEqual));
assert.equal(
  header.archives[0].sha256,
  'e13aa9008d4d9edbb4cad022197f568227cc224b0ba016e5356ba29ed7a7e3f4'
);
assert.equal(
  header.archives[0].archiveSha256,
  '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa'
);
for (const input of manifest.portableInputs) {
  const bytes = readFileSync(new URL('../../' + input.path, import.meta.url));
  assert.equal(input.byteEqual, true);
  assert.equal(bytes.length, input.bytes);
  assert.equal(componentsHydrationHash(bytes), input.sha256);
  assert.deepEqual(header.inputPins[input.source], { bytes: input.bytes, sha256: input.sha256 });
}
assert.equal(manifest.portableInputs.length, 2);
assert.deepEqual(manifest.boundaries.map(boundary => boundary.name), ['react-layout-commit-vs-svelte-onMount',
  'removed-control-pending-close', 'react-focus-vs-native-focusin', 'react-composed-ref-callback-vs-svelte-attachment']);
assert.deepEqual(
  selectComponentsHydrationReference.cases.map(entry => entry.sample),
  selectComponentsHydrationSamples
);
assert.equal(selectComponentsHydrationReference.cases.length, 6);
assert.equal(
  selectComponentsHydrationReference.cases.reduce((sum, entry) => sum + entry.steps.length, 0),
  34
);
for (const entry of selectComponentsHydrationReference.cases) {
  assert.deepEqual(entry.recoverableErrors, []);
  assert.deepEqual(entry.steps.map(step => step.action), entry.sample.actions);
  assert.equal(entry.beforeHydration.editor?.value, entry.sample.preHydration.value);
  assert.deepEqual(
    entry.beforeHydration.editor?.selection?.slice(0, 2),
    entry.sample.preHydration.selection
  );
  assert.equal(entry.beforeHydration.editor?.focused, true);
  for (const server of Object.values(entry.server)) {
    assert.equal(componentsHydrationHash(server.rawHtml), server.htmlSha256);
    assert.deepEqual(server.resources, { timers: 0, frames: 0, measurements: 0, microtasks: 0 });
    assert.deepEqual(server.state.events, []);
    assert.deepEqual(server.state.methods, []);
    assert.deepEqual(server.state.lifecycle, []);
  }
  for (const point of [entry.commit, entry.initial]) {
    assert(Object.values(point.identity).every(Boolean));
    assert.equal(point.refs.control, true);
    assert.equal(point.refs.rootMatchesDOM, true);
    assert.equal(point.refs.editorMatchesDOM, true);
  }
  assert.equal(entry.lateCleanup.popupCount, 0);
  assert.equal(entry.lateCleanup.refs.control, false);
  assert.equal(entry.lateCleanup.refs.rootIdentity, null);
  assert.equal(entry.lateCleanup.refs.editorIdentity, null);
  assert.equal(entry.lateCleanup.parsedRoot?.connected, false);
  assert.equal(entry.lateCleanup.parsedEditor?.connected, false);
}
const pending = selectComponentsHydrationReference.cases.find(entry => entry.id.endsWith('ac-replace-close'))!.steps.at(-1)!;
assert.equal(pending.action.type, 'close-dispose');
assert.equal(pending.immediate?.owner?.alive, false);
assert.equal(pending.immediate?.owner?.open, true);
assert.equal(pending.immediate?.refs.control, false);
assert.equal(pending.settled.owner?.alive, false);
assert.equal(pending.settled.owner?.open, false);
assert.deepEqual(
  pending.settled.owner?.events,
  [...pending.immediate!.owner!.events, ['open', false]]
);
