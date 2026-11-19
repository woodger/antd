import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { selectComponentSamples, type SelectComponentsResponsiveSample } from './select-components-responsive-cases.mjs';
import type { ModesCase, ModesPoint } from './select-components-modes-reference';
import type { ComponentsSSRState } from './select-components-reference';
import type { SelectComponentsResponsiveOverflow } from './select-components-responsive-metrics.mjs';
export { selectComponentSamples as selectComponentsResponsiveSamples };
export type { SelectComponentsResponsiveSample };
export interface ResponsivePoint extends ModesPoint { overflow: SelectComponentsResponsiveOverflow }
export interface ResponsiveCase extends Omit<ModesCase, 'initial' | 'steps'> {
  initial: ResponsivePoint;
  steps: Array<ResponsivePoint & { action: SelectComponentsResponsiveSample['actions'][number] }>;
}
export interface ResponsiveSSRState extends ComponentsSSRState { refs: Record<string, boolean> }
interface Header { axis: string; mode: 'csr' | 'ssr'; status: string; version: string; react: string; revision: string;
  protocolSha256: string; preservedReferences: number; errors: unknown[]; diagnostics: unknown[]; archives: Array<{ byteEqual: boolean }> }
interface Source<Value> { reference: Header; cases: Value[] }
interface Copy { path: string; storageBytes: number; storageSha256: string; decodedBytes: number; decodedSha256: string;
  repeatBytes: number; repeatSha256: string; wholePairByteEqual: boolean }
const fixture = (name: string) => new URL('./fixtures/' + name, import.meta.url);
const hash = (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
const protocol = '1b0dd23f2ef35ee069acb02e6398a595a81e79acdb2b4d987a1e785a34295348';
const manifest = JSON.parse(readFileSync(
  fixture('ant-design-select-components-responsive-source-manifest.json'),
  'utf8'
)) as
  {
    status: string;
    sourceOnly: boolean;
    allRawSourcesUnchanged: boolean;
    protocolSha256: string;
    copies: Copy[]
  };
assert.equal(manifest.status, 'passed');
assert.equal(manifest.sourceOnly, true);
assert.equal(manifest.allRawSourcesUnchanged, true);
assert.equal(manifest.protocolSha256, protocol);
assert.equal(manifest.copies.length, 2);
const pins: Record<string, [number, string, number, string]> = {
  'ant-design-select-components-responsive-reference.json.gz': [852045, '9df4ef982f1cec94d704276630eeed53c9dcbbccd6ab2bedca4a39ca5983a702', 26098146, '7cf64201b575227378b5477c6e17feb5d870fc76af8b1997f1449a994a6cb983'],
  'ant-design-select-components-responsive-ssr-reference.json.gz': [20572, '36c46d973f0a173e7a7bddf2446e5e63a2c3223ddb7747f674864c1ffce42070', 515996, '292fe7d2fc2716f270926dd53142eb0d95f53781ee2874818c2b6e623a54a0f1']
};
function load<Value>(name: string, mode: Header['mode']): Source<Value> {
  const pin = pins[name], copy = manifest.copies.find(value => value.path.endsWith('/' + name));
  assert(pin && copy);
  assert.deepEqual(
    [copy.storageBytes, copy.storageSha256, copy.decodedBytes, copy.decodedSha256],
    pin
  );
  assert.equal(copy.wholePairByteEqual, true);
  assert.equal(copy.repeatBytes, pin[2]);
  assert.equal(copy.repeatSha256, pin[3]);
  const bytes = readFileSync(fixture(name));
  assert.equal(bytes.length, pin[0]);
  assert.equal(hash(bytes), pin[1]);
  const decoded = gunzipSync(bytes);
  assert.equal(decoded.length, pin[2]);
  assert.equal(hash(decoded), pin[3]);
  const source = JSON.parse(decoded.toString('utf8')) as Source<Value>, header = source.reference;
  assert.equal(header.axis, 'responsive');
  assert.equal(header.mode, mode);
  assert.equal(header.status, 'passed');
  assert.equal(header.version, '6.6.8');
  assert.equal(header.react, '18.3.1');
  assert.equal(header.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
  assert.equal(header.protocolSha256, protocol);
  assert.equal(header.preservedReferences, 797);
  assert.deepEqual(header.errors, []);
  assert.deepEqual(header.diagnostics, []);
  assert.equal(header.archives.length, 4);
  assert(header.archives.every(value => value.byteEqual));
  assert.deepEqual(
    source.cases.map(value => (value as { id: string }).id),
    selectComponentSamples.map(value => value.id)
  );
  return source;
}
let csr: Source<ResponsiveCase> | undefined;
export function readSelectComponentsResponsiveSource() {
  const source = csr ??= load<ResponsiveCase>(
    'ant-design-select-components-responsive-reference.json.gz',
    'csr'
  );
  assert.equal(source.cases.reduce((sum, value) => sum + value.steps.length, 0), 12);
  for (const value of source.cases) {
    assert.deepEqual(
      value.steps.map(step => step.action),
      selectComponentSamples.find(sample => sample.id === value.id)!.actions
    );
    assert.equal(value.initial.dom, null);
    assert(value.steps.every(step => step.dom === null));
    assert.equal(value.cleanup.popupCount, 0);
    assert.equal(value.cleanup.ownerCount, 0);
    assert(Object.values(value.cleanup.refs).every(Boolean));
    assert(value.cleanup.retainedConnected.every(node => !node.connected));
    assert.deepEqual(value.late, { events: value.cleanup.events, rawEvents: value.cleanup.rawEvents,
      producerCalls: value.cleanup.producerCalls, lifecycle: value.cleanup.lifecycle, bodyActivity: value.cleanup.bodyActivity });
  }
  return source;
}
export function readSelectComponentsResponsiveCase(id: string) {
  const result = readSelectComponentsResponsiveSource().cases.find(value => value.id === id);
  assert(result);
  return result;
}
export function readSelectComponentsResponsiveSSR() {
  const source = load<{ id: string; states: ResponsiveSSRState[] }>(
    'ant-design-select-components-responsive-ssr-reference.json.gz',
    'ssr'
  );
  assert.equal(source.cases.reduce((sum, value) => sum + value.states.length, 0), 2);
  for (const value of source.cases) {
    assert.deepEqual(value.states.map(value => value.name), ['initial']);
    const state = value.states[0];
    assert.deepEqual(state.resources, { timers: 0, frames: 0, microtasks: 0, measurements: 0 });
    assert(Object.values(state.refs).every(Boolean));
    assert.deepEqual(state.state.events, []);
    assert.deepEqual(state.state.rawEvents, []);
    assert.deepEqual(state.state.lifecycle, []);
  }
  return source;
}
