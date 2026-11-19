import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { selectComponentSamples, type SelectComponentsACStyleSample, type SelectComponentsACStyleAction } from './select-components-ac-style-cases.mjs';
import type { ComponentsCase, ComponentsPoint, ComponentsSSRState } from './select-components-reference';
import type { SelectComponentsACStyleDOM } from './select-components-ac-style-metrics.mjs';
export { selectComponentSamples as selectComponentsACStyleSamples };
export type { SelectComponentsACStyleSample, SelectComponentsACStyleAction };
export interface ACStylePoint extends Omit<ComponentsPoint, 'icons'> { icons: SelectComponentsACStyleDOM }
export interface ACStyleCase extends Omit<ComponentsCase, 'initial' | 'steps'> {
  initial: ACStylePoint;
  steps: Array<ACStylePoint & { action: SelectComponentsACStyleAction }>;
}
interface Header {
  axis: 'ac-style'; mode: 'csr' | 'ssr'; status: string; version: string; react: string; revision: string;
  protocolSha256: string; preservedReferences: number; errors: unknown[]; diagnostics: unknown[]; archives: Array<{ byteEqual: boolean }>;
}
interface Source<Value> { reference: Header; cases: Value[] }
interface Copy { path: string; storageBytes: number; storageSha256: string; decodedBytes: number; decodedSha256: string;
  repeatBytes: number; repeatSha256: string; wholePairByteEqual: boolean }
const hash = (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
const fixture = (name: string) => new URL('./fixtures/' + name, import.meta.url);
const manifest = JSON.parse(readFileSync(
  fixture('ant-design-select-components-ac-style-source-manifest.json'),
  'utf8'
)) as
  {
    status: string;
    sourceOnly: boolean;
    allRawSourcesUnchanged: boolean;
    protocolSha256: string;
    copies: Copy[]
  };
const protocol = '2d85873c9fec23c14b568b43bebd9736b33267579cadaa1a12934ea855e73663';
assert.equal(manifest.status, 'passed');
assert.equal(manifest.sourceOnly, true);
assert.equal(manifest.allRawSourcesUnchanged, true);
assert.equal(manifest.protocolSha256, protocol);
assert.equal(manifest.copies.length, 2);
const pins: Record<string, [number, string, number, string]> = {
  'ant-design-select-components-ac-style-reference.json.gz': [470092, 'ff1f3fce5ed820ce8a3dd7bfc2431c21352ef6bc97332e37e0ff02c15c07ac21', 13379063, 'ca92e08f7ae3f0095761f65588d23c4fc87cb3c2a277fc0d61b5166d2a5660fd'],
  'ant-design-select-components-ac-style-ssr-reference.json.gz': [137095, 'fb28412c8bbb1ad899a353883803975e03dc68fd7258263d35a09e2da475632f', 3872567, 'e34a90804070a6fd9822af4e656cd19936af2cea164cfa43cbac823fa2900b3f']
};
function load<Value>(name: string, mode: Header['mode']): Source<Value> {
  const pin = pins[name], copy = manifest.copies.find(copy => copy.path.endsWith('/' + name));
  assert(pin && copy);
  assert.deepEqual(
    [copy.storageBytes, copy.storageSha256, copy.decodedBytes, copy.decodedSha256],
    pin
  );
  assert.equal(copy.wholePairByteEqual, true);
  assert.equal(copy.repeatBytes, pin[2]);
  assert.equal(copy.repeatSha256, pin[3]);
  const stored = readFileSync(fixture(name));
  assert.equal(stored.length, pin[0]);
  assert.equal(hash(stored), pin[1]);
  const raw = gunzipSync(stored);
  assert.equal(raw.length, pin[2]);
  assert.equal(hash(raw), pin[3]);
  const source = JSON.parse(raw.toString('utf8')) as Source<Value>, h = source.reference;
  assert.equal(h.axis, 'ac-style');
  assert.equal(h.mode, mode);
  assert.equal(h.version, '6.6.8');
  assert.equal(h.react, '18.3.1');
  assert.equal(h.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
  assert.equal(h.protocolSha256, protocol);
  assert.equal(h.preservedReferences, 550);
  assert.deepEqual(h.errors, []);
  assert(h.archives.every(a => a.byteEqual));
  assert.equal(h.diagnostics.length, mode === 'csr' ? 2 : 16);
  assert.equal(h.status, 'passed');
  return source;
}
let captured: Source<ACStyleCase> | undefined;
export function readSelectComponentsACStyleCase(id: string): ACStyleCase {
  const source = captured ??= load('ant-design-select-components-ac-style-reference.json.gz', 'csr');
  assert.deepEqual(source.cases.map(c => c.id), selectComponentSamples.map(s => s.id));
  assert.equal(source.cases.reduce((sum, c) => sum + c.steps.length, 0), 20);
  for (const c of source.cases) {
    assert.deepEqual(
      c.steps.map(step => step.action),
      selectComponentSamples.find(s => s.id === c.id)!.actions
    );
    assert.equal(c.initial.dom, null);
    assert(c.steps.every(step => step.dom === null));
    assert.equal(c.cleanup.popupCount, 0);
    assert.equal(c.cleanup.ownerCount, 0);
    assert(Object.values(c.cleanup.refs).every(Boolean));
    assert(c.cleanup.retainedConnected.every(node => !node.connected));
    assert.deepEqual(c.late, { events: c.cleanup.events, rawEvents: c.cleanup.rawEvents, producerCalls: c.cleanup.producerCalls,
      lifecycle: c.cleanup.lifecycle, bodyActivity: c.cleanup.bodyActivity });
  }
  const result = source.cases.find(c => c.id === id);
  assert(result);
  return result;
}
export function selectComponentsACStyleStaticStates(sample: SelectComponentsACStyleSample) {
  let settings = { ...sample.settings };
  const states = [{ name: 'initial', settings }];
  sample.actions.forEach((action, index) => {
    if (action.type !== 'props') {
      return;
    }
    settings = { ...settings, ...action.set };
    for (const key of action.drop ?? []) delete settings[key];
    states.push({ name: 'authored-props-' + index, settings });
  });
  return states;
}
export function readSelectComponentsACStyleSSR() {
  const source = load<{ id: string; states: ComponentsSSRState[] }>(
    'ant-design-select-components-ac-style-ssr-reference.json.gz',
    'ssr'
  );
  assert.deepEqual(source.cases.map(c => c.id), selectComponentSamples.map(s => s.id));
  assert.equal(source.cases.reduce((sum, c) => sum + c.states.length, 0), 16);
  return source;
}
