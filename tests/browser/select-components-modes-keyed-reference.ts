import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { selectComponentSamples } from './select-components-modes-cases.mjs';
import type { ModesCase } from './select-components-modes-reference';
import type { ComponentsSSRState } from './select-components-reference';
// Разрешает путь к локальному снимку относительно модуля. Текущий рабочий каталог не влияет на
// результат.
const fixture = (name: string) => new URL('./fixtures/' + name, import.meta.url);
// Возвращает SHA-256 в шестнадцатеричном виде для сверки зафиксированных данных.
const hash = (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
const protocol = 'd8eea1e2c35befcaed18d700e9f2f2291f2ea476589d3425984e563981e6ed24';
interface Copy { path: string; storageBytes: number; storageSha256: string; decodedBytes: number; decodedSha256: string;
  repeatBytes: number; repeatSha256: string; wholePairByteEqual: boolean }
interface Header { axis: string; mode: string; version: string; react: string; revision: string; status: string;
  protocolSha256: string; preservedReferences: number; errors: unknown[]; diagnostics: unknown[]; archives: Array<{ byteEqual: boolean }> }
interface Source<Value> { reference: Header; cases: Value[] }
const manifest = JSON.parse(readFileSync(
  fixture('ant-design-select-components-modes-keyed-source-manifest.json'),
  'utf8'
)) as
  {
    status: string;
    sourceOnly: boolean;
    allOldSourcesUnchanged: boolean;
    protocolSha256: string;
    copies: Copy[]
  };
assert.equal(manifest.status, 'passed');
assert.equal(manifest.sourceOnly, true);
assert.equal(manifest.allOldSourcesUnchanged, true);
assert.equal(manifest.protocolSha256, protocol);
assert.equal(manifest.copies.length, 2);
// Compressed and complete decoded bytes are independently pinned below.
const pins: Record<string, [number, string, number, string]> = {
  'ant-design-select-components-modes-keyed-reference.json.gz': [2055092, "07bd199697c71be2bb4b567a94dfa941ed4991f36a7efd2f36ed84686676217b", 58161347, "fffe04379e32d98133e9b159bb6dcc1182da5ac1b1c9c18b6ead77d9d1174584"],
  'ant-design-select-components-modes-keyed-ssr-reference.json.gz': [278521, "080a164863154e42baccb0196e48ff674c63f0968479201cffc97c3d2f9f10da", 7432953, "6495b6f2b5169c818eff0ffd70c7a2168f721e45cd7a73e7a8226b8fc4308d96"]
};
function load<Value>(name: string, mode: 'csr' | 'ssr'): Source<Value> {
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
  const decoded = gunzipSync(stored);
  assert.equal(decoded.length, pin[2]);
  assert.equal(hash(decoded), pin[3]);
  const source = JSON.parse(decoded.toString('utf8')) as Source<Value>, header = source.reference;
  // The counterfactual axis is v1; the premeasurement preparation is frozen v2.
  assert.equal(header.axis, 'modes-keys-v1');
  assert.equal(header.mode, mode);
  assert.equal(header.status, 'passed');
  assert.equal(header.version, '6.6.8');
  assert.equal(header.react, '18.3.1');
  assert.equal(header.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
  assert.equal(header.protocolSha256, protocol);
  assert.equal(header.preservedReferences, 566);
  assert.deepEqual(header.errors, []);
  assert.equal(header.diagnostics.length, mode === 'csr' ? 6 : 24);
  assert.equal(header.archives.length, 4);
  assert(header.archives.every(value => value.byteEqual));
  assert.deepEqual(
    source.cases.map(value => (value as { id: string }).id),
    selectComponentSamples.map(value => value.id)
  );
  return source;
}
let csr: Source<ModesCase> | undefined;
export function readSelectComponentsModesKeyedSource() {
  const source = csr ??= load<ModesCase>(
    'ant-design-select-components-modes-keyed-reference.json.gz',
    'csr'
  );
  assert.equal(source.cases.reduce((sum, value) => sum + value.steps.length, 0), 72);
  for (const value of source.cases) {
    assert.deepEqual(
      value.steps.map(step => step.action),
      selectComponentSamples.find(sample => sample.id === value.id)!.actions
    );
  }
  return source;
}
export function readSelectComponentsModesKeyedCase(id: string) {
  const value = readSelectComponentsModesKeyedSource().cases.find(value => value.id === id);
  assert(value);
  return value;
}
export function readSelectComponentsModesKeyedSSR() {
  const source = load<{ id: string; states: ComponentsSSRState[] }>(
    'ant-design-select-components-modes-keyed-ssr-reference.json.gz',
    'ssr'
  );
  assert.equal(source.cases.reduce((sum, value) => sum + value.states.length, 0), 29);
  return source;
}
