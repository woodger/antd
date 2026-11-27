import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { isDeepStrictEqual } from 'node:util';
import { readReferenceBytes } from './reference-bytes';
import { selectSurfaceSamples, selectSurfaceActions } from './fixtures/select-surface-cases';
import type { SelectSurfaceAction } from './fixtures/select-surface-cases';
import type { readSelectSurface } from './select-surface-metrics';
import type { readSelectSurfaceSSR } from './select-surface-ssr-metrics';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';

export interface SelectSurfaceOwner {
  settings: unknown;
  model: unknown;
  open: boolean;
  authoredProps: unknown;
  rawAuthoredProps: unknown;
  authoredProvider: unknown;
  rawAuthoredProvider: unknown;
  callCount: number;
  eventCount: number;
  rawEventCount: number;
}
export type SelectSurfaceSnapshot = ReturnType<typeof readSelectSurface> & { owner: SelectSurfaceOwner };
export interface SelectSurfaceSourceCase {
  id: string;
  initial: SelectSurfaceSnapshot;
  steps: Array<SelectSurfaceSnapshot & { action: SelectSurfaceAction;
    identity: { root: boolean; editor: boolean; publicRoot: boolean } }>;
  events: unknown[];
  rawEvents: unknown[];
  producerCalls: SelectSurfaceProducerCall[];
  cleanup: { rootConnected: boolean; editorConnected: boolean; popupCount: number;
    eventCount: number; producerCount: number };
}
export interface SelectSurfaceSourceSSRCase {
  id: string;
  view: ReturnType<typeof readSelectSurfaceSSR>;
  resources: { timers: number; frames: number; measurements: number; microtasks: number };
  state: { calls: SelectSurfaceProducerCall[]; events: unknown[]; rawEvents: unknown[] };
  diagnostics: string[];
  rawHtml: string;
  htmlSha256: string;
}
interface SourceHeader {
  version: string;
  react: string;
  revision: string;
  protocolSha256: string;
  inputPins: Record<string, string>;
  archives: Array<{ path: string; sha256: string; archiveSha256: string; byteEqual: boolean }>;
  preservedReferences: number;
  errors?: unknown[];
  diagnostics?: unknown[];
  domAvailableDuringRender?: boolean;
}
function guard(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw Error(`Invalid independent Select surface Source: ${message}`);
  }
}
// Returns SHA-256 in hexadecimal form for the reconciliation of the recorded data.
function sha256(bytes: Uint8Array) { return createHash('sha256').update(bytes).digest('hex'); }
const stored = readFileSync(new URL(
  './fixtures/ant-design-select-surface-reference.json.gz',
  import.meta.url
));
guard(
  sha256(stored) === '836623978050d863893226a864f3f6b23b0daf6cfcf2614b2a6381ce6c4b3cd1',
  'gzip storage bytes'
);
const primaryBytes = gunzipSync(stored);
guard(primaryBytes.length === 37006189
  && sha256(primaryBytes) === 'a3e71faa6a23ee83311ac8b078e8fb618e7c695b1dc263663f470497437be62c', 'original CSR bytes');
export const selectSurfaceReference = JSON.parse(primaryBytes.toString('utf8')) as {
  reference: SourceHeader; cases: SelectSurfaceSourceCase[];
};
const ssrBytes = readReferenceBytes('ant-design-select-surface-ssr-reference.json.gz');
guard(ssrBytes.length === 3183815
  && sha256(ssrBytes) === '53400dff120a7bb4caf01a242ced30c5522096255ab97cb7f08ac5b2e4ee7375', 'original SSR bytes');
export const selectSurfaceSSRReference = JSON.parse(ssrBytes.toString('utf8')) as {
  reference: SourceHeader; cases: SelectSurfaceSourceSSRCase[];
};
for (const source of [selectSurfaceReference, selectSurfaceSSRReference]) {
  const header = source.reference;
  guard(header.version === '6.6.8' && header.react === '18.3.1'
    && header.revision === '984592267de88fbf9cdaecc96a56629e721c709d', 'pinned original versions');
  guard(
    header.protocolSha256 === '4e4957b5b88b2352c0d40f23d8835fc6371c0b69d16f884cc530a6ef5fcdd901',
    'protocol'
  );
  guard(header.preservedReferences === 463, 'predecessor references');
  guard(header.archives[0].sha256 === 'e13aa9008d4d9edbb4cad022197f568227cc224b0ba016e5356ba29ed7a7e3f4'
    && header.archives[0].archiveSha256 === '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa'
    && header.archives.every(archive => archive.byteEqual), 'original UMD archive');
  guard(
    isDeepStrictEqual(
      source.cases.map(entry => entry.id),
      selectSurfaceSamples.map(sample => sample.id)
    ),
    'ordered owners'
  );
  for (const [path, hash] of Object.entries(header.inputPins)) {
    if (path.startsWith('.upstream/')) continue;
    guard(sha256(readFileSync(new URL(`../../${path}`, import.meta.url))) === hash, path);
  }
}
guard(isDeepStrictEqual(selectSurfaceReference.reference.errors, []), 'browser errors');
guard(
  selectSurfaceReference.reference.diagnostics?.length === 2,
  'retained original browser diagnostics'
);
guard(
  selectSurfaceSSRReference.reference.domAvailableDuringRender === false,
  'DOM-free original SSR'
);
guard(
  selectSurfaceReference.cases.reduce((sum, entry) => sum + entry.producerCalls.length, 0) === 448,
  'complete CSR producer ledger'
);
guard(
  selectSurfaceSSRReference.cases.reduce((sum, entry) => sum + entry.state.calls.length, 0) === 42,
  'actual SSR producer ledger'
);
for (const [index, entry] of selectSurfaceReference.cases.entries()) {
  guard(
    isDeepStrictEqual(
      entry.steps.map(step => step.action),
      selectSurfaceActions(selectSurfaceSamples[index])
    ),
    `${entry.id} full trace`
  );
  guard(entry.rawEvents.length === entry.events.length, `${entry.id} raw event ledger`);
  guard(isDeepStrictEqual(entry.cleanup, { rootConnected: false, editorConnected: false, popupCount: 0,
    eventCount: entry.events.length, producerCount: entry.producerCalls.length }), `${entry.id} disposal`);
  for (const point of [entry.initial, ...entry.steps]) {
    guard(point.owner.callCount <= entry.producerCalls.length
      && point.owner.eventCount <= entry.events.length
      && point.owner.rawEventCount === point.owner.eventCount, `${entry.id} exact ledger prefixes`);
    guard(isDeepStrictEqual(point.view.leaks, []), `${entry.id} public attributes`);
  }
}
for (const entry of selectSurfaceSSRReference.cases) {
  guard(sha256(Buffer.from(entry.rawHtml)) === entry.htmlSha256, `${entry.id} raw SSR HTML`);
  guard(
    isDeepStrictEqual(entry.resources, { timers: 0, frames: 0, measurements: 0, microtasks: 0 }),
    `${entry.id} SSR resources`
  );
  guard(
    isDeepStrictEqual(entry.state.events, []) && isDeepStrictEqual(entry.state.rawEvents, []),
    `${entry.id} no SSR gestures`
  );
}
