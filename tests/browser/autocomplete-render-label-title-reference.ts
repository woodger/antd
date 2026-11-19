import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { labelTitleSamples, labelTitleActions, labelTitleSSRStates, type LabelTitleAction } from './autocomplete-render-label-title-cases.mjs';
import type { LabelTitleDOM } from './autocomplete-render-label-title-metrics.mjs';
import type { AutocompleteRenderOwner } from './autocomplete-render-reference';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';
import type { readSelectSurface } from './select-surface-metrics';
import type { readSelectSurfaceSSR } from './select-surface-ssr-metrics';
export interface LabelTitleOwner extends AutocompleteRenderOwner {
  renderer: string; optionTitleOwnKey: boolean; optionOwnKeys: PropertyKey[];
}
export interface LabelTitlePoint {
  dom: ReturnType<typeof readSelectSurface>; nodes: LabelTitleDOM;
  owner: LabelTitleOwner & { producerCount: number; eventCount: number; rawEventCount: number };
}
export interface LabelTitleCase {
  id: string; initial: LabelTitlePoint; steps: Array<LabelTitlePoint & { action: LabelTitleAction }>;
  events: unknown[]; rawEvents: unknown[]; producerCalls: SelectSurfaceProducerCall[];
  cleanup: {
    nodes: LabelTitleDOM;
    owner: LabelTitleOwner & {
      events: unknown[];
      rawEvents: unknown[];
      calls: SelectSurfaceProducerCall[]
    }
  };
  late: LabelTitleCase['cleanup'];
}
export interface LabelTitleSSRCase {
  id: string; states: Array<{ name: string; state: LabelTitleOwner & {
    events: unknown[];
    rawEvents: unknown[];
    calls: SelectSurfaceProducerCall[]
  };
    view: ReturnType<typeof readSelectSurfaceSSR>; resources: {
      timers: number;
      frames: number;
      measurements: number;
      microtasks: number
    };
    rawHtml: string; htmlSha256: string }>;
}
interface Header { mode: string; version: string; react: string; revision: string; protocolSha256: string;
  preservedReferences: number; inputPins: Record<string, string>; errors: unknown[]; diagnostics: unknown[];
  archives: Array<{ sha256: string; archiveSha256: string; byteEqual: boolean }> }
const hash = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
function load<Value>(path: string, bytes: number, sha: string): Value {
  const data = readFileSync(new URL('./fixtures/' + path, import.meta.url));
  assert.equal(data.length, bytes);
  assert.equal(hash(data), sha);
  return JSON.parse(data.toString('utf8')) as Value;
}
export const autocompleteLabelTitleReference = load<{ reference: Header; cases: LabelTitleCase[] }>(
  'ant-design-autocomplete-render-label-title-reference.json', 1378306, 'b6003c7b9daba3bc2d8a7dfe23a4335404ce70cc43d552117028e206b2d8d2f1');
export const autocompleteLabelTitleSSRReference = load<{
  reference: Header;
  cases: LabelTitleSSRCase[]
}>(
  'ant-design-autocomplete-render-label-title-ssr-reference.json', 558643, 'b1a88f9349ec2a88e228b4ec4f10c00bdda48a221ab7b75e91ee4aa8f85b332a');
for (const [r, mode] of [[autocompleteLabelTitleReference, 'csr'], [autocompleteLabelTitleSSRReference, 'ssr']] as const) {
  const h = r.reference;
  assert.equal(h.mode, mode);
  assert.equal(h.version, '6.6.8');
  assert.equal(h.react, '18.3.1');
  assert.equal(h.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
  assert.equal(h.protocolSha256, 'bb6617a4c570e8e5cc97e45815eebf0d38ef7aa4afa7d4d1ac134c08f940c3e6');
  assert.equal(h.preservedReferences, 480);
  assert.deepEqual(h.errors, []);
  assert.deepEqual(h.diagnostics, []);
  assert.equal(
    h.archives[0].sha256,
    'e13aa9008d4d9edbb4cad022197f568227cc224b0ba016e5356ba29ed7a7e3f4'
  );
  assert.equal(
    h.archives[0].archiveSha256,
    '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa'
  );
  assert(h.archives.every(a => a.byteEqual));
  assert.deepEqual(r.cases.map(c => c.id), labelTitleSamples.map(s => s.id));
  for (const [path, sha] of Object.entries(h.inputPins)) if (path.startsWith('tests/'))
    assert.equal(hash(readFileSync(new URL('../../' + path, import.meta.url))), sha, path);
}
for (const [file, source] of [['autocomplete-render-label-title-cases.mjs', '.upstream/artifacts/autocomplete-render-label-title-cases.mjs'],
  ['autocomplete-render-label-title-metrics.mjs', '.upstream/artifacts/autocomplete-render-label-title-reader.mjs']])
  assert.equal(
    hash(readFileSync(new URL('./' + file, import.meta.url))),
    autocompleteLabelTitleReference.reference.inputPins[source],
    file
  );
for (const c of autocompleteLabelTitleReference.cases) {
  assert.deepEqual(c.steps.map(s => s.action), labelTitleActions);
  assert.deepEqual(c.cleanup, c.late);
  assert.equal(c.cleanup.nodes.popupCount, 0);
  assert.equal(c.producerCalls.length, 6);
  for (const p of [c.initial, ...c.steps]) {
    assert.equal(p.owner.optionTitleOwnKey, false);
    assert.deepEqual(p.owner.optionOwnKeys, ['value', 'label']);
  }
}
for (const c of autocompleteLabelTitleSSRReference.cases) {
  assert.deepEqual(c.states.map(s => s.name), labelTitleSSRStates.map(s => s.name));
  for (const s of c.states) {
    assert.equal(hash(Buffer.from(s.rawHtml)), s.htmlSha256);
    assert.equal(s.state.calls.length, 1);
    assert.deepEqual(s.resources, { timers: 0, frames: 0, measurements: 0, microtasks: 0 });
  }
}
