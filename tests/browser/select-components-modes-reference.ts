import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { selectComponentSamples, selectComponentFaultSamples, type SelectComponentsModesSample, type SelectComponentsModesAction } from './select-components-modes-cases.mjs';
import type { ComponentsCase, ComponentsPoint, ComponentsSSRState } from './select-components-reference';
import type { SelectComponentsModesDOM } from './select-components-modes-metrics.mjs';
export { selectComponentSamples as selectComponentsModesSamples, selectComponentFaultSamples as selectComponentsModesFaultSamples };
export type { SelectComponentsModesSample, SelectComponentsModesAction };
export interface ModesPoint extends Omit<ComponentsPoint, 'icons'> { icons: SelectComponentsModesDOM }
export interface ModesCase extends Omit<ComponentsCase, 'initial' | 'steps'> {
  initial: ModesPoint;
  steps: Array<ModesPoint & { action: SelectComponentsModesAction }>;
}
interface Header {
  axis: 'modes' | 'composite'; mode: 'csr' | 'ssr'; status: string; version: string; react: string; revision: string;
  protocolSha256: string; preservedReferences: number; errors: unknown[]; diagnostics: unknown[]; archives: Array<{ byteEqual: boolean }>;
}
interface Source<Value> { reference: Header; cases: Value[] }
interface Copy { path: string; storageBytes: number; storageSha256: string; decodedBytes: number; decodedSha256: string;
  repeatBytes: number; repeatSha256: string; wholePairByteEqual: boolean }
const hash = (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
const fixture = (name: string) => new URL('./fixtures/' + name, import.meta.url);
const manifest = JSON.parse(readFileSync(
  fixture('ant-design-select-components-modes-source-manifest.json'),
  'utf8'
)) as
  {
    status: string;
    sourceOnly: boolean;
    allRawSourcesUnchanged: boolean;
    protocolSha256: string;
    copies: Copy[]
  };
const protocol = '2d7eff1deec53913cbaa866af541d6beb35e581b07e0167226be0af2275d8dbe';
assert.equal(manifest.status, 'passed');
assert.equal(manifest.sourceOnly, true);
assert.equal(manifest.allRawSourcesUnchanged, true);
assert.equal(manifest.protocolSha256, protocol);
assert.equal(manifest.copies.length, 4);
const pins: Record<string, [number, string, number, string]> = {
  'ant-design-select-components-modes-reference.json.gz': [2043530, 'cbcd11fd0a091134f2699eb91abeaa0378986ede63a64b257c6c1ada0bf6244e', 57702873, '8f8abf200b493f761aaed4167d781428f9306c55fe629f6de477f1307a028584'],
  'ant-design-select-components-modes-ssr-reference.json.gz': [276024, 'd602765c71cc45f11c2c6aa1164a19b765c6113cc1a4fdc2b2181854b5ee27a2', 7353837, '4720ba047811cbfc8ffb12e97d082ce904ea526a9a65d09b7aecf9392a1a1bee'],
  'ant-design-select-components-modes-composite-reference.json.gz': [2875858, '80207fde1a75f776837b56b2f74485a8065fa4f63b37993d83f618124c8a651d', 14602559, '55dccef7d013a0db9ae54f82ac530e2ff96c7ee2089aef5c2c6602a1bd7e1025'],
  'ant-design-select-components-modes-composite-ssr-reference.json.gz': [12728, 'e5de2a508ea60393ce4fc744ef7aebb57ff1ff02163946560a3a5ebad49fbc31', 296937, 'ed1c4f7bfc1aef58e403da94e165f513afb1e7baeb63edb1201d2bb778397b0e']
};
function load<Value>(name: string, axis: Header['axis'], mode: Header['mode']): Source<Value> {
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
  assert.equal(h.axis, axis);
  assert.equal(h.mode, mode);
  assert.equal(h.version, '6.6.8');
  assert.equal(h.react, '18.3.1');
  assert.equal(h.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
  assert.equal(h.protocolSha256, protocol);
  assert.equal(h.preservedReferences, 534);
  assert.deepEqual(h.errors, []);
  assert(h.archives.every(a => a.byteEqual));
  assert.equal(
    h.diagnostics.length,
    axis === 'modes' ? mode === 'csr' ? 6 : 24 : mode === 'csr' ? 1 : 0
  );
  assert.equal(h.status, axis === 'composite' && mode === 'csr' ? 'observed-failure' : 'passed');
  return source;
}
let normal: Source<ModesCase> | undefined;
export function readSelectComponentsModesCase(id: string): ModesCase {
  const source = normal ??= load(
    'ant-design-select-components-modes-reference.json.gz',
    'modes',
    'csr'
  );
  assert.deepEqual(source.cases.map(c => c.id), selectComponentSamples.map(s => s.id));
  assert.equal(source.cases.reduce((sum, c) => sum + c.steps.length, 0), 72);
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
export function selectComponentsModesStaticStates(sample: SelectComponentsModesSample) {
  let settings = { ...sample.settings };
  const states = [{ name: 'initial', settings }];
  sample.actions.forEach((action, index) => {
    if (action.type !== 'props') return;
    settings = { ...settings, ...action.set };
    for (const key of action.drop ?? []) delete settings[key];
    states.push({ name: 'authored-props-' + index, settings });
  });
  return states;
}
export function readSelectComponentsModesSSR() {
  const normal = load<{ id: string; states: ComponentsSSRState[] }>(
    'ant-design-select-components-modes-ssr-reference.json.gz',
    'modes',
    'ssr'
  );
  const composite = load<{ id: string; states: ComponentsSSRState[] }>(
    'ant-design-select-components-modes-composite-ssr-reference.json.gz',
    'composite',
    'ssr'
  );
  assert.equal(normal.cases.reduce((sum, c) => sum + c.states.length, 0), 29);
  assert.equal(composite.cases.length, 1);
  assert.equal(composite.cases[0].states.length, 1);
  return { normal, composite, cases: [...normal.cases, ...composite.cases] };
}
export function readSelectComponentsModesCompositeFault() {
  const source = load<{ id: string; status: string; failedAt: { action: string }; completedActions: number; plannedActions: unknown[];
    failure: { message: string }; partial: unknown; cleanup: unknown; late: unknown; observationErrors: unknown[] }>(
    'ant-design-select-components-modes-composite-reference.json.gz', 'composite', 'csr');
  assert.equal(source.cases.length, 1);
  const c = source.cases[0];
  assert.equal(c.id, selectComponentFaultSamples[0].id);
  assert.equal(c.status, 'failed');
  assert.equal(c.failedAt.action, 'mount');
  assert.equal(c.completedActions, 0);
  assert.equal(c.plannedActions.length, 2);
  assert(c.failure.message.includes("Cannot set properties of undefined (setting 'width')"));
  assert(c.failure.message.includes('antd.js:29619:25'));
  assert(c.partial && c.cleanup && c.late);
  assert.deepEqual(c.observationErrors, []);
  return source;
}
