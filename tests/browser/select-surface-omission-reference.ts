import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readReferenceBytes } from './reference-bytes';
import { omissionSamples, omissionActions, widthActions, omissionSSRStates, widthSSRStates,
  type SelectSurfaceOmissionAction } from './select-surface-omission-cases.mjs';
import { defaultOmissionSamples, defaultOmissionActions } from './select-surface-omission-default-cases.mjs';
import type { readSelectSurface } from './select-surface-metrics';
import type { readSelectSurfaceSSR } from './select-surface-ssr-metrics';
import type { SelectSurfaceOmissionDOM } from './select-surface-omission-metrics.mjs';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';

export interface SelectSurfaceOmissionLifecycle {
  index: number;
  action: unknown;
  kind: string;
  instance?: number;
  attached?: boolean;
  connected?: boolean | null;
}
export interface SelectSurfaceOmissionOwner {
  axis?: 'omission' | 'width';
  popup?: 'wrapped' | 'omitted';
  model: unknown;
  rawModel: unknown;
  open: boolean;
  query: string;
  fontSize: number;
  unrelated: string;
  popupOwnKey?: boolean;
  popupIsSameCallback?: boolean | null;
  popupCallbackIdentity?: number;
  authoredProps: unknown;
  rawAuthoredProps: unknown;
  authoredProvider: unknown;
  rawAuthoredProvider: unknown;
  eventCount: number;
  rawEventCount: number;
  producerCount: number;
  lifecycleCount?: number;
}
export interface SelectSurfaceOmissionPoint {
  dom: ReturnType<typeof readSelectSurface>;
  omission?: SelectSurfaceOmissionDOM;
  width?: SelectSurfaceOmissionDOM;
  owner: SelectSurfaceOmissionOwner;
}
export interface SelectSurfaceOmissionSourceCase {
  id: string;
  initial: SelectSurfaceOmissionPoint;
  steps: Array<SelectSurfaceOmissionPoint & { action: SelectSurfaceOmissionAction }>;
  events: unknown[];
  rawEvents: unknown[];
  producerCalls: SelectSurfaceProducerCall[];
  lifecycle?: SelectSurfaceOmissionLifecycle[];
  cleanup: { originalConnected: Record<string, boolean>; popupCount: number; footerCount?: number;
    eventCount: number; producerCount: number; lifecycle?: SelectSurfaceOmissionLifecycle[] };
}
export interface SelectSurfaceOmissionSSRState {
  name: string;
  view: ReturnType<typeof readSelectSurfaceSSR>;
  state: Omit<SelectSurfaceOmissionOwner, 'eventCount' | 'rawEventCount' | 'producerCount' | 'lifecycleCount'> & {
    events: unknown[]; rawEvents: unknown[]; calls: SelectSurfaceProducerCall[]; lifecycle?: SelectSurfaceOmissionLifecycle[];
  };
  resources: { timers: number; frames: number; measurements: number; microtasks: number };
  rawHtml: string;
  htmlSha256: string;
}
interface SourceHeader {
  mode: 'csr' | 'ssr';
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
interface SourceReference<Case> { reference: SourceHeader; cases: Case[] }
type SSRCase = { id: string; states: SelectSurfaceOmissionSSRState[] };
// Returns SHA-256 in hexadecimal form for the reconciliation of the recorded data.
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
function reference<Case>(
  filename: string,
  sha256: string,
  byteLength: number
): SourceReference<Case> {
  const bytes = readReferenceBytes(filename);
  assert.equal(bytes.length, byteLength, filename);
  assert.equal(hash(bytes), sha256, filename);
  return JSON.parse(bytes.toString('utf8')) as SourceReference<Case>;
}
export const selectSurfaceOmissionReference = reference<SelectSurfaceOmissionSourceCase>(
  'ant-design-select-surface-omission-reference.json.gz',
  '7c92067411c25f5515a9b4e389127879c861fa90b5d9b335fed7fd8724421010', 4639913);
export const selectSurfaceOmissionSSRReference = reference<SSRCase>(
  'ant-design-select-surface-omission-ssr-reference.json',
  'a7652d636039b7ca7a034f0e19c2cc6d08c163bba63c94a30960c866d87109cb', 434703);
export const selectSurfaceOmissionWidthReference = reference<SelectSurfaceOmissionSourceCase>(
  'ant-design-select-surface-omission-width-reference.json',
  '37369ae387b5af9277a62d32c544545885dd2aad8dcde990cb5ccca83351b891', 637821);
export const selectSurfaceOmissionWidthSSRReference = reference<SSRCase>(
  'ant-design-select-surface-omission-width-ssr-reference.json',
  'f28e83c44a6bc68501e1fdc0f781d10938f53c6ef243255d759b4b2413e4cd5a', 179645);
export const selectSurfaceOmissionDefaultReference = reference<SelectSurfaceOmissionSourceCase>(
  'ant-design-select-surface-omission-default-reference.json.gz',
  'ee333b6be254c9f264f8e897a18146cf5ef2c94c189b46b3a675ae4f16c4fdde', 3164603);
for (const [source, protocol, owners] of [
  [selectSurfaceOmissionReference, '4e210470cbdef5ebd111174f8fb4cc93d999fd03380ff144413f9f69b045b494', omissionSamples.map(sample => sample.id)],
  [selectSurfaceOmissionSSRReference, '4e210470cbdef5ebd111174f8fb4cc93d999fd03380ff144413f9f69b045b494', omissionSamples.map(sample => sample.id)],
  [selectSurfaceOmissionWidthReference, '90f0a2d58cff6a644a186b51ddb4f17590d517570d57c010399aeb2d46eccd59', ['select-surface-omission-width-open']],
  [selectSurfaceOmissionWidthSSRReference, '90f0a2d58cff6a644a186b51ddb4f17590d517570d57c010399aeb2d46eccd59', ['select-surface-omission-width-open']],
  [selectSurfaceOmissionDefaultReference, '8b8bfb5db105e7fd91a7816c606b7493e8c12ec996d21f8c477c313b282893d4', defaultOmissionSamples.map(sample => sample.id)],
] as const) {
  const header = source.reference;
  assert.equal(header.version, '6.6.8');
  assert.equal(header.react, '18.3.1');
  assert.equal(header.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
  assert.equal(header.protocolSha256, protocol);
  assert.equal(header.preservedReferences, 471);
  assert.deepEqual(header.errors, []);
  assert.deepEqual(header.diagnostics, []);
  assert.equal(
    header.archives[0].sha256,
    'e13aa9008d4d9edbb4cad022197f568227cc224b0ba016e5356ba29ed7a7e3f4'
  );
  assert.equal(
    header.archives[0].archiveSha256,
    '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa'
  );
  assert(header.archives.every(archive => archive.byteEqual));
  assert.deepEqual(source.cases.map(entry => entry.id), owners, 'complete original owner order');
  for (const [path, sha256] of Object.entries(header.inputPins)) {
    if (!path.startsWith('.upstream/')) assert.equal(
      hash(readFileSync(new URL(`../../${path}`, import.meta.url))),
      sha256,
      path
    );
  }
}
for (const [original, portable] of [
  ['.upstream/artifacts/select-surface-omission-cases.mjs', 'select-surface-omission-cases.mjs'],
  ['.upstream/artifacts/select-surface-omission-reader.mjs', 'select-surface-omission-metrics.mjs'],
]) assert.equal(hash(readFileSync(new URL(`./${portable}`, import.meta.url))),
  selectSurfaceOmissionReference.reference.inputPins[original], `byte-identical portable ${portable}`);
assert.equal(hash(readFileSync(new URL(
  './select-surface-omission-default-cases.mjs',
  import.meta.url
))),
  selectSurfaceOmissionDefaultReference.reference.inputPins['.upstream/artifacts/select-surface-omission-default-cases.mjs'],
  'byte-identical default-origin public owners/actions');
for (const entry of [...selectSurfaceOmissionReference.cases, ...selectSurfaceOmissionWidthReference.cases,
  ...selectSurfaceOmissionDefaultReference.cases]) {
  const actions = entry.id.includes('width') ? widthActions
    : entry.id.startsWith('select-surface-omission-default-') ? defaultOmissionActions : omissionActions;
  assert.deepEqual(entry.steps.map(step => step.action), actions, `${entry.id} complete actions`);
  assert.equal(entry.events.length, entry.rawEvents.length, `${entry.id} complete raw events`);
  assert.equal(entry.cleanup.eventCount, entry.events.length);
  assert.equal(entry.cleanup.producerCount, entry.producerCalls.length);
  assert.equal(entry.cleanup.popupCount, 0);
  assert(Object.values(entry.cleanup.originalConnected).every(connected => !connected));
  for (const point of [entry.initial, ...entry.steps]) {
    assert(point.owner.eventCount <= entry.events.length && point.owner.producerCount <= entry.producerCalls.length);
    assert.deepEqual(point.dom.view.leaks, []);
  }
}
for (const entry of [...selectSurfaceOmissionSSRReference.cases, ...selectSurfaceOmissionWidthSSRReference.cases]) {
  assert.deepEqual(entry.states.map(state => state.name),
    (entry.id.includes('width') ? widthSSRStates : omissionSSRStates).map(state => state.name));
  for (const state of entry.states) {
    assert.equal(hash(Buffer.from(state.rawHtml)), state.htmlSha256);
    assert.deepEqual(state.resources, { timers: 0, frames: 0, measurements: 0, microtasks: 0 });
    assert.deepEqual(state.state.events, []);
    assert.deepEqual(state.state.rawEvents, []);
    assert.deepEqual(state.state.lifecycle ?? [], []);
  }
}
