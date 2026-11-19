import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { selectSurfaceStyleHistoryActions, selectSurfaceStyleHistorySamples } from './fixtures/select-surface-style-history-cases';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';
import type { readSelectSurface } from './select-surface-metrics';
import type { SelectSurfaceStyleHistoryDOM } from './select-surface-style-history-metrics.mjs';

export type SelectSurfaceStyleHistoryAction = typeof selectSurfaceStyleHistoryActions[number];
export interface SelectSurfaceStyleHistoryOwner {
  phase: string;
  open: boolean;
  model: unknown;
  rawModel: unknown;
  maps: unknown;
  rawMaps: unknown;
  authoredProps: unknown;
  rawAuthoredProps: unknown;
  eventCount: number;
  rawEventCount: number;
  callCount: number;
}
export interface SelectSurfaceStyleHistoryPoint {
  dom: ReturnType<typeof readSelectSurface>;
  border: SelectSurfaceStyleHistoryDOM;
  owner: SelectSurfaceStyleHistoryOwner;
}
export interface SelectSurfaceStyleHistorySourceCase {
  id: string;
  initial: SelectSurfaceStyleHistoryPoint;
  steps: Array<SelectSurfaceStyleHistoryPoint & { action: SelectSurfaceStyleHistoryAction;
    identity: { root: boolean; editor: boolean } }>;
  events: unknown[];
  rawEvents: unknown[];
  producerCalls: SelectSurfaceProducerCall[];
  cleanup: { rootConnected: boolean; editorConnected: boolean; popupCount: number };
}
export interface SelectSurfaceStyleHistorySSRCase {
  id: string;
  state: Omit<SelectSurfaceStyleHistoryOwner, 'eventCount' | 'rawEventCount' | 'callCount'> & {
    events: unknown[]; rawEvents: unknown[]; calls: SelectSurfaceProducerCall[]
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
// Возвращает SHA-256 в шестнадцатеричном виде для сверки зафиксированных данных.
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
function guard(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw Error(`Invalid frozen style history Source: ${message}`);
  }
}
function reference<Value>(filename: string, sha256: string): Value {
  const bytes = readFileSync(new URL(`./fixtures/${filename}`, import.meta.url));
  guard(hash(bytes) === sha256, filename);
  return JSON.parse(bytes.toString('utf8')) as Value;
}
export const selectSurfaceStyleHistoryNativeReference = reference<{
  reference: SourceHeader; cases: SelectSurfaceStyleHistorySourceCase[];
}>('ant-design-select-surface-style-history-reference.json',
  'dccfb9125276b92582645226ced7b4387492fa660a3deb95436b257c9258e7ad');
export const selectSurfaceStyleHistorySSRReference = reference<{
  reference: SourceHeader; cases: SelectSurfaceStyleHistorySSRCase[];
}>('ant-design-select-surface-style-history-ssr-reference.json',
  '0bb0050bac2bf73e1821de00385c83c91b9a50c9e090621567f6a143ac257c66');
for (const source of [selectSurfaceStyleHistoryNativeReference, selectSurfaceStyleHistorySSRReference]) {
  const header = source.reference;
  guard(header.version === '6.6.8' && header.react === '18.3.1'
    && header.revision === '984592267de88fbf9cdaecc96a56629e721c709d', 'pinned versions');
  guard(
    header.protocolSha256 === '1e4cde30d8a1d8743933e79d35dddf24afae2bac2f3dd760f7fb927f4f171008',
    'independent protocol'
  );
  guard(header.preservedReferences === 468, 'immutable predecessor datasets');
  guard(header.archives[0].sha256 === 'e13aa9008d4d9edbb4cad022197f568227cc224b0ba016e5356ba29ed7a7e3f4'
    && header.archives[0].archiveSha256 === '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa'
    && header.archives.every(archive => archive.byteEqual), 'actual original archive');
  guard(
    isDeepStrictEqual(
      source.cases.map(entry => entry.id),
      selectSurfaceStyleHistorySamples.map(sample => sample.id)
    ),
    'complete ordered owners'
  );
  guard(
    isDeepStrictEqual(header.errors, []) && isDeepStrictEqual(header.diagnostics, []),
    'original diagnostics'
  );
  for (const [path, sha256] of Object.entries(header.inputPins)) {
    if (!path.startsWith('.upstream/')) guard(
      hash(readFileSync(new URL(`../../${path}`, import.meta.url))) === sha256,
      path
    );
  }
}
for (const entry of selectSurfaceStyleHistoryNativeReference.cases) {
  guard(
    isDeepStrictEqual(entry.steps.map(step => step.action), selectSurfaceStyleHistoryActions),
    `${entry.id} full gesture sequence`
  );
  guard(entry.rawEvents.length === entry.events.length, `${entry.id} complete raw event ledger`);
  guard(
    isDeepStrictEqual(
      entry.cleanup,
      { rootConnected: false, editorConnected: false, popupCount: 0 }
    ),
    `${entry.id} disposal`
  );
  const final = entry.steps.at(-1)!;
  guard(
    isDeepStrictEqual(entry.initial.owner.maps, final.owner.maps),
    `${entry.id} identical initial/final authored maps`
  );
  for (const target of ['root', 'input'] as const) guard(
    entry.initial.border[target].computed.borderTopColor !== final.border[target].computed.borderTopColor,
    `${entry.id} identical maps retain distinct actual ${target} border history`);
  for (const point of [entry.initial, ...entry.steps]) {
    guard(point.owner.eventCount <= entry.events.length && point.owner.callCount <= entry.producerCalls.length,
      `${entry.id} actual prefix counts`);
    guard(isDeepStrictEqual(point.dom.view.leaks, []), `${entry.id} public attribute leakage`);
  }
}
for (const entry of selectSurfaceStyleHistorySSRReference.cases) {
  guard(hash(Buffer.from(entry.rawHtml)) === entry.htmlSha256, `${entry.id} complete raw SSR HTML`);
  guard(
    isDeepStrictEqual(entry.resources, { timers: 0, frames: 0, measurements: 0, microtasks: 0 }),
    `${entry.id} DOM-free resources`
  );
  guard(isDeepStrictEqual(entry.state.events, []) && isDeepStrictEqual(entry.state.rawEvents, [])
    && isDeepStrictEqual(entry.state.calls, []), `${entry.id} actual SSR ledgers`);
}
