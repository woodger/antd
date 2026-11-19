import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { autocompleteRenderSamples, autocompleteRenderActions, autocompleteRenderSSRStates,
  type AutocompleteRenderAction } from './autocomplete-render-cases.mjs';
import type { AutocompleteRenderDOM } from './autocomplete-render-metrics.mjs';
import type { readSelectSurface } from './select-surface-metrics';
import type { readSelectSurfaceSSR } from './select-surface-ssr-metrics';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';

export interface AutocompleteRenderOwner {
  settings: unknown; model: unknown; open: boolean;
  authoredProps: unknown; rawAuthoredProps: unknown; authoredProvider: unknown; rawAuthoredProvider: unknown;
}
export interface AutocompleteRenderPoint {
  dom: ReturnType<typeof readSelectSurface>;
  nodes: AutocompleteRenderDOM;
  owner: AutocompleteRenderOwner & {
    producerCount: number;
    eventCount: number;
    rawEventCount: number;
    lifecycleCount: number
  };
}
export interface AutocompleteRenderCase {
  id: string; initial: AutocompleteRenderPoint;
  steps: Array<AutocompleteRenderPoint & { action: AutocompleteRenderAction }>;
  events: unknown[]; rawEvents: unknown[]; producerCalls: SelectSurfaceProducerCall[];
  lifecycle: Array<{ kind: string; attached: boolean; tag: string | null; value: string | null }>;
  cleanup: { nodes: AutocompleteRenderDOM; owner: AutocompleteRenderOwner & { events: unknown[]; rawEvents: unknown[];
    calls: SelectSurfaceProducerCall[]; lifecycle: AutocompleteRenderCase['lifecycle'] } };
  late: AutocompleteRenderCase['cleanup'];
}
export interface AutocompleteRenderSSRCase {
  id: string;
  states: Array<{ name: string; state: AutocompleteRenderOwner & { events: unknown[]; rawEvents: unknown[];
    calls: SelectSurfaceProducerCall[]; lifecycle: AutocompleteRenderCase['lifecycle'] };
    view: ReturnType<typeof readSelectSurfaceSSR>;
    resources: { timers: number; frames: number; measurements: number; microtasks: number };
    rawHtml: string; htmlSha256: string }>;
}
interface Header { mode: 'csr' | 'ssr'; version: string; react: string; revision: string; protocolSha256: string;
  preservedReferences: number; inputPins: Record<string, string>; errors: unknown[]; diagnostics: unknown[];
  archives: Array<{ sha256: string; archiveSha256: string; byteEqual: boolean }> }
const hash = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
const compressed = readFileSync(new URL(
  './fixtures/ant-design-autocomplete-render-reference.json.gz',
  import.meta.url
));
assert.equal(compressed.length, 986923);
assert.equal(hash(compressed), '78333e2cd394d73aad39acc4a94b055e0f37aff53947ae55930a06d8e91849dc');
const csr = gunzipSync(compressed);
assert.equal(csr.length, 39379489);
assert.equal(hash(csr), 'c8e31ad89fb4fc0a1bcf94548c99eb211e560e64fd9123792c50101666eaaa8d');
const ssr = readFileSync(new URL(
  './fixtures/ant-design-autocomplete-render-ssr-reference.json',
  import.meta.url
));
assert.equal(ssr.length, 1750313);
assert.equal(hash(ssr), 'c23ec4ca70e497a1d7564e1e1b107a7e785d16ba8af9439db18ab1ab136afb0f');
export const autocompleteRenderReference = JSON.parse(csr.toString('utf8')) as {
  reference: Header;
  cases: AutocompleteRenderCase[]
};
export const autocompleteRenderSSRReference = JSON.parse(ssr.toString('utf8')) as {
  reference: Header;
  cases: AutocompleteRenderSSRCase[]
};
for (const [reference, mode] of [[autocompleteRenderReference, 'csr'], [autocompleteRenderSSRReference, 'ssr']] as const) {
  const h = reference.reference;
  assert.equal(h.mode, mode);
  assert.equal(h.version, '6.6.8');
  assert.equal(h.react, '18.3.1');
  assert.equal(h.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
  assert.equal(h.protocolSha256, '002dbf1896d450559395d0c5c8d388a9c652d74b551058ab5812a007da7c32ee');
  assert.equal(h.preservedReferences, 478);
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
  assert.deepEqual(reference.cases.map(c => c.id), autocompleteRenderSamples.map(s => s.id));
  for (const [path, sha] of Object.entries(h.inputPins)) {
    if (path.startsWith('tests/'))
      assert.equal(hash(readFileSync(new URL('../../' + path, import.meta.url))), sha, path);
  }
}
for (const [path, source] of [['autocomplete-render-cases.mjs', '.upstream/artifacts/autocomplete-render-cases.mjs'],
  ['autocomplete-render-metrics.mjs', '.upstream/artifacts/autocomplete-render-reader.mjs']]) {
  assert.equal(
    hash(readFileSync(new URL('./' + path, import.meta.url))),
    autocompleteRenderReference.reference.inputPins[source],
    path
  );
}
assert.equal(autocompleteRenderReference.cases.reduce((n, c) => n + c.steps.length, 0), 60);
assert.equal(autocompleteRenderReference.cases.reduce((n, c) => n + c.producerCalls.length, 0), 484);
for (const c of autocompleteRenderReference.cases) {
  const sample = autocompleteRenderSamples.find(s => s.id === c.id)!;
  assert.deepEqual(c.steps.map(s => s.action), autocompleteRenderActions(sample));
  assert.equal(c.producerCalls.filter(p => p.kind === 'tagRender').length, 0);
  assert.deepEqual(c.cleanup, c.late);
  assert.equal(c.cleanup.nodes.popupCount, 0);
  for (const point of [c.initial, ...c.steps]) {
    assert(point.owner.producerCount <= c.producerCalls.length);
    assert.equal(point.owner.eventCount, point.owner.rawEventCount);
    assert(point.owner.eventCount <= c.events.length);
    assert.deepEqual(point.nodes.resources, []);
    assert.deepEqual(point.dom.view.leaks, []);
  }
}
for (const c of autocompleteRenderSSRReference.cases) {
  assert.deepEqual(c.states.map(s => s.name), autocompleteRenderSSRStates.map(s => s.name));
  for (const s of c.states) {
    assert.equal(hash(Buffer.from(s.rawHtml)), s.htmlSha256);
    assert.deepEqual(s.state.events, []);
    assert.deepEqual(s.state.rawEvents, []);
    assert.deepEqual(s.state.lifecycle, []);
    assert.equal(s.state.calls.filter(c => c.kind !== 'labelRender').length, 0);
    assert.deepEqual(s.resources, { timers: 0, frames: 0, measurements: 0, microtasks: 0 });
  }
}
