import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { inputWidthOwnSamples, inputWidthOwnActions, type SelectSurfaceInputWidthKind,
  type SelectSurfaceInputWidthOwnAction } from './select-surface-input-width-own-cases.mjs';
import type { readSelectSurface } from './select-surface-metrics';
import type { readSelectSurfaceSSR } from './select-surface-ssr-metrics';
import type { SelectSurfaceInputWidthOwnDOM } from './select-surface-input-width-own-metrics.mjs';
import type { SelectSurfaceOmissionDOM } from './select-surface-omission-metrics.mjs';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';

export interface SelectSurfaceInputWidthOwnState {
  widthKind: SelectSurfaceInputWidthKind;
  widthOwnKey: boolean;
  widthValue: unknown;
  inputStyle: unknown;
  rawInputStyle: unknown;
  styleOwnKeys: PropertyKey[];
  inputStyleDescriptors: Array<Record<string, unknown>>;
  fontSize: number;
  query: string;
  open: boolean;
  model: unknown;
  rawModel: unknown;
  authoredProps: unknown;
  rawAuthoredProps: unknown;
  authoredProvider: unknown;
  rawAuthoredProvider: unknown;
}
export interface SelectSurfaceInputWidthOwnPoint {
  dom: ReturnType<typeof readSelectSurface>;
  nodes: SelectSurfaceOmissionDOM;
  width: SelectSurfaceInputWidthOwnDOM;
  owner: SelectSurfaceInputWidthOwnState & { eventCount: number; rawEventCount: number; producerCount: number };
}
export interface SelectSurfaceInputWidthOwnSourceCase {
  id: string;
  initial: SelectSurfaceInputWidthOwnPoint;
  steps: Array<SelectSurfaceInputWidthOwnPoint & { action: SelectSurfaceInputWidthOwnAction }>;
  events: unknown[];
  rawEvents: unknown[];
  producerCalls: SelectSurfaceProducerCall[];
  cleanup: { originalConnected: Record<string, boolean>; popupCount: number; eventCount: number; producerCount: number;
    resourceEntries: SelectSurfaceInputWidthOwnDOM['resourceEntries'] };
}
export interface SelectSurfaceInputWidthOwnSSRCase {
  id: string;
  state: SelectSurfaceInputWidthOwnState & { events: unknown[]; rawEvents: unknown[]; calls: SelectSurfaceProducerCall[] };
  view: ReturnType<typeof readSelectSurfaceSSR>;
  resources: { timers: number; frames: number; measurements: number; microtasks: number };
  rawHtml: string;
  htmlSha256: string;
}
interface Header {
  mode: 'csr' | 'ssr'; version: string; react: string; revision: string; protocolSha256: string;
  inputPins: Record<string, string>; preservedReferences: number; errors: unknown[]; diagnostics: unknown[];
  archives: Array<{ sha256: string; archiveSha256: string; byteEqual: boolean }>;
}
interface Reference<Case> { reference: Header; cases: Case[] }
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const csrStorage = readFileSync(new URL('./fixtures/ant-design-select-surface-input-width-own-reference.json.gz', import.meta.url));
assert.equal(csrStorage.length, 175688);
assert.equal(hash(csrStorage), '7e6e4a9bf0fa6e5d0e26563d819607d205cfa6eda3c96e1653081a6c34b5d8de');
const csr = gunzipSync(csrStorage);
assert.equal(csr.length, 3598030);
assert.equal(hash(csr), '6b4e039c923c996594bbe99c1e3923b8fc83693ebc8f141fb1a65b1a6fede00c');
export const selectSurfaceInputWidthOwnReference = JSON.parse(csr.toString('utf8')) as Reference<SelectSurfaceInputWidthOwnSourceCase>;
const ssr = readFileSync(new URL('./fixtures/ant-design-select-surface-input-width-own-ssr-reference.json', import.meta.url));
assert.equal(ssr.length, 125257);
assert.equal(hash(ssr), 'dc323b41357fb52b0d3ace7ca08988abf133bb9e3153ac2674708279c90c1a05');
export const selectSurfaceInputWidthOwnSSRReference = JSON.parse(ssr.toString('utf8')) as Reference<SelectSurfaceInputWidthOwnSSRCase>;
for (const [reference, mode] of [[selectSurfaceInputWidthOwnReference, 'csr'], [selectSurfaceInputWidthOwnSSRReference, 'ssr']] as const) {
  const header = reference.reference;
  assert.equal(header.mode, mode);
  assert.equal(header.version, '6.6.8');
  assert.equal(header.react, '18.3.1');
  assert.equal(header.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
  assert.equal(header.protocolSha256, '23c81512f99956cde76e87edcc8e3385f82902a3afa207ad50e330b99724feab');
  assert.equal(header.preservedReferences, 471);
  assert.deepEqual(header.errors, []);
  assert.deepEqual(header.diagnostics, []);
  assert.equal(header.archives[0].sha256, 'e13aa9008d4d9edbb4cad022197f568227cc224b0ba016e5356ba29ed7a7e3f4');
  assert.equal(header.archives[0].archiveSha256, '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa');
  assert(header.archives.every(archive => archive.byteEqual));
  assert.deepEqual(reference.cases.map(entry => entry.id), inputWidthOwnSamples.map(sample => sample.id));
  for (const [path, sha256] of Object.entries(header.inputPins)) {
    if (!path.startsWith('.upstream/')) assert.equal(hash(readFileSync(new URL(`../../${path}`, import.meta.url))), sha256, path);
  }
}
for (const [source, portable] of [
  ['.upstream/artifacts/select-surface_input-width-own_cases.mjs', 'select-surface-input-width-own-cases.mjs'],
  ['.upstream/artifacts/select-surface_input-width-own_reader.mjs', 'select-surface-input-width-own-metrics.mjs'],
]) assert.equal(hash(readFileSync(new URL(`./${portable}`, import.meta.url))),
  selectSurfaceInputWidthOwnReference.reference.inputPins[source], `byte-identical portable ${portable}`);
for (const entry of selectSurfaceInputWidthOwnReference.cases) {
  assert.deepEqual(entry.steps.map(step => step.action), inputWidthOwnActions);
  assert.equal(entry.events.length, entry.rawEvents.length);
  assert.equal(entry.cleanup.eventCount, entry.events.length);
  assert.equal(entry.cleanup.producerCount, entry.producerCalls.length);
  assert.equal(entry.cleanup.popupCount, 0);
  assert(Object.values(entry.cleanup.originalConnected).every(connected => !connected));
  assert.deepEqual(entry.cleanup.resourceEntries, []);
  for (const point of [entry.initial, ...entry.steps]) {
    assert(point.owner.eventCount <= entry.events.length && point.owner.producerCount <= entry.producerCalls.length);
    assert.deepEqual(point.dom.view.leaks, []);
    assert.deepEqual(point.width.resourceEntries, []);
  }
}
for (const entry of selectSurfaceInputWidthOwnSSRReference.cases) {
  assert.equal(hash(Buffer.from(entry.rawHtml)), entry.htmlSha256);
  assert.deepEqual(entry.resources, { timers: 0, frames: 0, measurements: 0, microtasks: 0 });
  assert.deepEqual(entry.state.events, []);
  assert.deepEqual(entry.state.rawEvents, []);
  assert.deepEqual(entry.state.calls, []);
}
