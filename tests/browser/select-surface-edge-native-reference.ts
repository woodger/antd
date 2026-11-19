import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { selectSurfaceEdgeActions, selectSurfaceEdgeSamples, type SelectSurfaceEdgeAction } from './fixtures/select-surface-edge-cases';
import type { readSelectSurface } from './select-surface-metrics';
import type { SelectSurfaceEdgePaint } from './select-surface-edge-metrics.mjs';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';

export interface SelectSurfaceEdgeOwner {
  model: unknown;
  rawModel: unknown;
  open: boolean;
  authoredProps: unknown;
  rawAuthoredProps: unknown;
  eventCount: number;
  rawEventCount: number;
  callCount: number;
}
export interface SelectSurfaceEdgePoint {
  dom: ReturnType<typeof readSelectSurface>;
  paint: SelectSurfaceEdgePaint;
  owner: SelectSurfaceEdgeOwner;
}
export interface SelectSurfaceEdgeSourceCase {
  id: string;
  axis: 'replacement' | 'prefix' | 'placeholder';
  control: 'select' | 'autocomplete';
  initial: SelectSurfaceEdgePoint;
  steps: Array<SelectSurfaceEdgePoint & { action: SelectSurfaceEdgeAction;
    identity: { root: boolean; editor: boolean } }>;
  events: unknown[];
  rawEvents: unknown[];
  producerCalls: SelectSurfaceProducerCall[];
  cleanup: { rootConnected: boolean; editorConnected: boolean; popupCount: number };
}
interface Header {
  version: string;
  react: string;
  revision: string;
  protocolSha256: string;
  inputPins: Record<string, string>;
  archives: Array<{ sha256: string; archiveSha256: string; byteEqual: boolean }>;
  preservedReferences: number;
  errors: unknown[];
  diagnostics: unknown[];
}
// Возвращает SHA-256 в шестнадцатеричном виде для сверки зафиксированных данных.
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const bytes = readFileSync(new URL(
  './fixtures/ant-design-select-surface-edge-reference.json',
  import.meta.url
));
assert.equal(
  hash(bytes),
  '06795b3a7ec0185ab9b5929e25ccc42bd5eff100bba87bb56c836b40a3f24f39',
  'frozen original edge bytes'
);
export const selectSurfaceEdgeNativeReference = JSON.parse(bytes.toString('utf8')) as {
  reference: Header; cases: SelectSurfaceEdgeSourceCase[];
};
const { reference, cases } = selectSurfaceEdgeNativeReference;
assert.deepEqual([reference.version, reference.react, reference.revision],
  ['6.6.8', '18.3.1', '984592267de88fbf9cdaecc96a56629e721c709d'], 'original edge versions');
assert.equal(
  reference.protocolSha256,
  '3355010dcbc2f5cc8de71071361307dfde59c9b1d9996418db2519126eef087c',
  'original edge protocol'
);
assert.equal(reference.preservedReferences, 467, 'preserved predecessor references');
assert.equal(
  reference.archives[0].sha256,
  'e13aa9008d4d9edbb4cad022197f568227cc224b0ba016e5356ba29ed7a7e3f4',
  'actual original UMD'
);
assert.equal(
  reference.archives[0].archiveSha256,
  '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa',
  'original package archive'
);
assert(
  reference.archives.every(archive => archive.byteEqual),
  'all original archive members are unchanged'
);
assert.deepEqual(reference.errors, [], 'original browser errors');
assert.deepEqual(reference.diagnostics, [], 'original diagnostics');
for (const [path, pin] of Object.entries(reference.inputPins)) if (!path.startsWith('.upstream/')) {
  assert.equal(
    hash(readFileSync(new URL(`../../${path}`, import.meta.url))),
    pin,
    `frozen edge input ${path}`
  );
}
assert.deepEqual(
  cases.map(entry => entry.id),
  selectSurfaceEdgeSamples.map(sample => sample.id),
  'all six original edge owners'
);
assert.equal(
  cases.reduce((count, entry) => count + entry.steps.length, 0),
  30,
  'all thirty original edge actions'
);
assert.equal(
  cases.reduce((count, entry) => count + entry.producerCalls.length, 0),
  10,
  'all actual original edge producer calls'
);
for (const [index, entry] of cases.entries()) {
  assert.deepEqual(
    entry.steps.map(step => step.action),
    selectSurfaceEdgeActions(selectSurfaceEdgeSamples[index]),
    `${entry.id} immutable trace`
  );
  assert.equal(entry.events.length, entry.rawEvents.length, `${entry.id} complete raw event ledger`);
  assert.deepEqual(
    entry.cleanup,
    { rootConnected: false, editorConnected: false, popupCount: 0 },
    `${entry.id} original disposal`
  );
  for (const point of [entry.initial, ...entry.steps]) {
    assert.equal(point.owner.rawEventCount, point.owner.eventCount, `${entry.id} raw event prefix`);
    assert(
      point.owner.eventCount <= entry.events.length && point.owner.callCount <= entry.producerCalls.length,
      `${entry.id} ledger prefixes`
    );
    assert.deepEqual(point.dom.view.leaks, [], `${entry.id} original public attributes`);
    assert.deepEqual(point.paint.raw.cssErrors, [], `${entry.id} all matching actual CSS readable`);
  }
}
