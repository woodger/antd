import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { selectComponentSamples as baseSamples } from './select-icons-cases.mjs';
import { selectComponentSamples as flowSamples, type SelectComponentsSample, type SelectComponentsAction } from './select-components-flow-cases.mjs';
import type { IconCase, IconOwner, IconSSRState } from './select-icons-reference';
import type { SelectIconsDOM } from './select-icons-metrics.mjs';

export type { SelectComponentsSample, SelectComponentsAction };
export const selectComponentsSamples: SelectComponentsSample[] = [...baseSamples, ...flowSamples];
export interface ComponentsPoint {
  dom: null;
  icons: SelectIconsDOM & { formData?: Array<[string, FormDataEntryValue]> | null };
  owner: IconOwner & { bodyActivity?: unknown[]; eventCount: number; rawEventCount: number; producerCount: number; lifecycleCount: number };
}
export interface ComponentsCase extends Omit<IconCase, 'initial' | 'steps' | 'cleanup' | 'late'> {
  cleanup: IconCase['cleanup'] & { bodyActivity?: unknown[] };
  late: IconCase['late'] & { bodyActivity?: unknown[] };
  initial: ComponentsPoint;
  steps: Array<ComponentsPoint & { action: SelectComponentsAction }>;
}
export interface ComponentsSSRState extends IconSSRState {
  state: IconSSRState['state'] & { bodyActivity?: unknown[] };
}
interface Header {
  axis: string; mode: string; version: string; react: string; revision: string; protocolSha256: string;
  preservedReferences: number; errors: unknown[]; diagnostics: unknown[];
  archives: Array<{ sha256: string; archiveSha256: string; byteEqual: boolean }>;
}
interface Source<Value> { reference: Header; cases: Value[] }
interface Copy { source: string; path: string; decodedBytes: number; decodedSha256: string; storageBytes: number;
  storageSha256: string; repeatBytes: number; repeatSHA256: string; wholePairByteEqual: boolean }
const fixture = (name: string) => new URL('./fixtures/' + name, import.meta.url);
const hash = (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
const manifest = JSON.parse(readFileSync(fixture('ant-design-select-components-source-manifest.json'), 'utf8')) as
  { status: string; sourceOnly: boolean; allRawSourcesUnchanged: boolean; copies: Copy[] };
assert.equal(manifest.status, 'passed'); assert.equal(manifest.sourceOnly, true); assert.equal(manifest.allRawSourcesUnchanged, true);
assert.equal(manifest.copies.length, 4);
const protocols = { base: 'cd02a1968c63d39ab9b165960cbf0524b4e30959506ff07b1c8da35076b3a728',
  flow: '189cec9d33fa40678bac63b6d9ef399068a491c58831635c08a7426ac4b28b7e' };
const pins: Record<string, [number, string, number, string]> = {
  'ant-design-select-components-reference.json.gz': [485314, '6dc7115a58ea1d69b08607b1a735c1e0c039e60ac18e02f1c00668d3c36cbe56', 14304114, '1502dfc983f7545b8fdb5405e494f920541e295057d74ecb7f892835a854dcbd'],
  'ant-design-select-components-ssr-reference.json.gz': [76839, '0c479d32a14b5692c093bb5cbfccbe7e1616a6b3ca5aeb7884552714e7626e9f', 1769109, '0bcb22152cb6cf0526a1faee09b31759d4b4363bd854572108305a6252e1ac45'],
  'ant-design-select-components-flow-reference.json.gz': [1730770, '1b76936cfdcbd00deece5fefbec1a24b0522fd0c22136891007c34146abfea10', 54197851, '4b65383ef167e56eb11ea88fd42accf02b4016e00980689de1a535ed6838496b'],
  'ant-design-select-components-flow-ssr-reference.json.gz': [225398, '713b590f2f3bc848c117824a465ab47c001b05ed2a933802ed35e938af0e22ae', 6678643, '12055f0255fa54690a6b46a866306de46df08cc6a61fee312a93da8483a9cb62']
};
function load<Value>(name: string, mode: 'csr' | 'ssr', flow: boolean): Source<Value> {
  const p = pins[name]; assert(p, name);
  const copy = manifest.copies.find(c => c.path.endsWith('/' + name)); assert(copy);
  assert.deepEqual([copy.storageBytes, copy.storageSha256, copy.decodedBytes, copy.decodedSha256], p);
  assert.equal(copy.wholePairByteEqual, true); assert.equal(copy.repeatBytes, copy.decodedBytes); assert.equal(copy.repeatSHA256, copy.decodedSha256);
  const stored = readFileSync(fixture(name)); assert.equal(stored.length, p[0]); assert.equal(hash(stored), p[1]);
  const raw = gunzipSync(stored); assert.equal(raw.length, p[2]); assert.equal(hash(raw), p[3]);
  const result = JSON.parse(raw.toString('utf8')) as Source<Value>, h = result.reference;
  assert.equal(h.axis, 'components'); assert.equal(h.mode, mode); assert.equal(h.version, '6.6.8'); assert.equal(h.react, '18.3.1');
  assert.equal(h.revision, '984592267de88fbf9cdaecc96a56629e721c709d'); assert.equal(h.protocolSha256, protocols[flow ? 'flow' : 'base']);
  assert.equal(h.preservedReferences, 478); assert.deepEqual(h.errors, []); assert.equal(h.diagnostics.length, flow ? mode === 'csr' ? 1 : 5 : 2);
  assert(h.archives.every(a => a.byteEqual));
  return result;
}
let base: Source<ComponentsCase> | undefined, flow: Source<ComponentsCase> | undefined;
export function readSelectComponentsCase(id: string): ComponentsCase {
  const isFlow = id.startsWith('select-icons-components-flow-');
  const result = isFlow ? flow ??= load('ant-design-select-components-flow-reference.json.gz', 'csr', true)
    : base ??= load('ant-design-select-components-reference.json.gz', 'csr', false);
  const samples = isFlow ? flowSamples : baseSamples;
  assert.deepEqual(result.cases.map(c => c.id), samples.map(s => s.id));
  assert.equal(result.cases.reduce((n, c) => n + c.steps.length, 0), isFlow ? 71 : 67);
  for (const c of result.cases) {
    assert.deepEqual(c.steps.map(s => s.action), samples.find(s => s.id === c.id)!.actions);
    assert.equal(c.initial.dom, null); assert(c.steps.every(s => s.dom === null));
    assert.equal(c.cleanup.popupCount, 0); assert.equal(c.cleanup.ownerCount, 0);
    assert(c.cleanup.retainedConnected.every(n => !n.connected)); assert(Object.values(c.cleanup.refs).every(Boolean));
    assert.deepEqual(c.late, { events: c.cleanup.events, rawEvents: c.cleanup.rawEvents, producerCalls: c.cleanup.producerCalls, lifecycle: c.cleanup.lifecycle,
      ...(isFlow ? { bodyActivity: c.cleanup.bodyActivity } : {}) });
  }
  const c = result.cases.find(c => c.id === id); assert(c); return c;
}
export function selectComponentsStaticStates(sample: SelectComponentsSample) {
  const states = [{ name: 'initial', settings: { ...sample.settings } }];
  let settings = { ...sample.settings };
  sample.actions.forEach((action, index) => {
    if (action.type === 'props') { settings = { ...settings, ...action.set }; for (const key of action.drop ?? []) delete settings[key]; }
    else if (action.type === 'context') { const config = { ...settings.config, ...action.set }; for (const key of action.drop ?? []) delete config[key]; settings = { ...settings, config }; }
    else if (action.type === 'inner') settings = { ...settings, inner: action.value };
    else return;
    states.push({ name: 'authored-props-' + index, settings });
  });
  return states;
}
export function readSelectComponentsSSR() {
  const a = load<{ id: string; states: ComponentsSSRState[] }>('ant-design-select-components-ssr-reference.json.gz', 'ssr', false);
  const b = load<{ id: string; states: ComponentsSSRState[] }>('ant-design-select-components-flow-ssr-reference.json.gz', 'ssr', true);
  assert.equal(a.cases.reduce((n, c) => n + c.states.length, 0), 26); assert.equal(b.cases.reduce((n, c) => n + c.states.length, 0), 25);
  return { base: a, flow: b, cases: [...a.cases, ...b.cases] };
}
