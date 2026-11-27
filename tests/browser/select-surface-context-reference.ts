import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { readReferenceBytes } from './reference-bytes';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';
import type { SelectSurfaceContextDOM } from './select-surface-context-metrics.mjs';
import { selectSurfaceContextSamples, type SelectSurfaceContextAction } from './select-surface-context-cases';

export interface SelectSurfaceContextState {
  open: boolean;
  disabled: boolean;
  variant: string;
  events: unknown[];
  fieldErrors: unknown;
  fieldWarnings: unknown;
  callCount: number;
}
export interface SelectSurfaceContextPoint {
  dom: SelectSurfaceContextDOM;
  state: SelectSurfaceContextState;
}
export interface SelectSurfaceContextSourceCase {
  id: string;
  initial: SelectSurfaceContextPoint;
  steps: Array<SelectSurfaceContextPoint & { action: SelectSurfaceContextAction }>;
  calls: SelectSurfaceProducerCall[];
  cleanup: { rootConnected: boolean; editorConnected: boolean; popupCount: number };
}
export interface SelectSurfaceContextSSRCase {
  id: string;
  state: Omit<SelectSurfaceContextState, 'callCount'> & { calls: SelectSurfaceProducerCall[] };
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
  archives: Array<{ sha256: string; archiveSha256: string; byteEqual: boolean }>;
  errors: unknown[];
  diagnostics: unknown[];
}
// Returns SHA-256 in hexadecimal form for the reconciliation of the recorded data.
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
function guard(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw Error(`Invalid frozen Select context Source: ${message}`);
  }
}
function reference<Value>(filename: string, sha256: string): Value {
  const bytes = readReferenceBytes(filename);
  guard(hash(bytes) === sha256, filename);
  return JSON.parse(bytes.toString('utf8')) as Value;
}
export const selectSurfaceContextReference = reference<{
  reference: SourceHeader; cases: SelectSurfaceContextSourceCase[];
}>('ant-design-select-surface-context-reference.json.gz',
  '7916eb6af8dc39e3e1866a1aeb2bfef034f302a59fecbd32765a15777433314d');
export const selectSurfaceContextSSRReference = reference<{
  reference: SourceHeader; cases: SelectSurfaceContextSSRCase[];
}>('ant-design-select-surface-context-ssr-reference.json',
  'a7877ee736fc894f9579fa404901e8bc939bd9621238fd27793bbbdbd3ce309e');
guard(hash(readFileSync(new URL('./select-surface-context-metrics.mjs', import.meta.url)))
  === '4a74679476eae1968a3ea46eb51f7fcfb3ee55f7273e561ffe755608c7c43926', 'portable original observer');
for (const source of [selectSurfaceContextReference, selectSurfaceContextSSRReference]) {
  const header = source.reference;
  guard(header.version === '6.6.8' && header.react === '18.3.1'
    && header.revision === '984592267de88fbf9cdaecc96a56629e721c709d', 'pinned versions');
  guard(
    header.protocolSha256 === 'e71696a2d5637befbd66a72f82345689f61401eef85ada6b4c366bf6255085d8',
    'independent context protocol'
  );
  guard(header.archives[0].sha256 === 'e13aa9008d4d9edbb4cad022197f568227cc224b0ba016e5356ba29ed7a7e3f4'
    && header.archives[0].archiveSha256 === '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa'
    && header.archives.every(archive => archive.byteEqual), 'actual original UMD');
  guard(
    isDeepStrictEqual(
      source.cases.map(entry => entry.id),
      selectSurfaceContextSamples.map(sample => sample.id)
    ),
    'complete owners'
  );
  guard(isDeepStrictEqual(header.errors, []), 'original errors');
}
guard(selectSurfaceContextReference.reference.mode === 'csr'
  && selectSurfaceContextReference.reference.diagnostics.length === 2, 'retained genuine original hook warnings');
guard(selectSurfaceContextSSRReference.reference.mode === 'ssr'
  && selectSurfaceContextSSRReference.reference.diagnostics.length === 0, 'DOM-free original diagnostics');
guard(
  selectSurfaceContextReference.cases.reduce((count, entry) => count + entry.calls.length, 0) === 66,
  'complete CSR producer and hook calls'
);
guard(
  selectSurfaceContextSSRReference.cases.reduce(
    (count, entry) => count + entry.state.calls.length,
    0
  ) === 6,
  'actual SSR producer and hook calls'
);
for (const entry of selectSurfaceContextReference.cases) {
  guard(entry.steps.length === 6, `${entry.id} full six-action trace`);
  guard(
    isDeepStrictEqual(
      entry.cleanup,
      { rootConnected: false, editorConnected: false, popupCount: 0 }
    ),
    `${entry.id} disposal`
  );
  for (const point of [entry.initial, ...entry.steps]) guard(point.state.callCount <= entry.calls.length,
    `${entry.id} exact producer prefix`);
}
for (const entry of selectSurfaceContextSSRReference.cases) {
  guard(hash(Buffer.from(entry.rawHtml)) === entry.htmlSha256, `${entry.id} raw SSR HTML`);
  guard(
    isDeepStrictEqual(entry.resources, { timers: 0, frames: 0, measurements: 0, microtasks: 0 }),
    `${entry.id} no SSR resources`
  );
  guard(isDeepStrictEqual(entry.state.events, []), `${entry.id} no SSR gestures`);
}
