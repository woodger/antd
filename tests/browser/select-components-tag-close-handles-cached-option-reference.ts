import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { readTagCloseHandleSourceArray, readTagCloseHandleSourceInfo, type SourceCSRCase,
  type TagCloseHandleSource, type TagCloseHandleSample } from './select-components-tag-close-handles-reference.ts';

interface Pin { path: string; bytes: number; sha256: string }
interface Manifest { status: string; SourceOnly: boolean; NativeDataUsed: boolean;
  protocol: { source: Pin; fixture: string }; rawPair: {
    first: Pin;
    repeat: Pin;
    wholeByteEqual: boolean
  };
  portable: {
    path: string;
    storageBytes: number;
    storageSha256: string;
    decodedBytes: number;
    decodedSha256: string
  };
  header: unknown; sample: TagCloseHandleSample; actualCounts: unknown;
  serialization: {
    losslessWholeRawBytes: boolean;
    fieldsDropped: string[];
    rewrittenValues: string[];
    normalizedSourceFields: string[]
  } }
const prefix = 'ant-design-select-components-tag-close-handles-cached-option-';
// Разрешает путь к локальному снимку относительно модуля. Текущий рабочий каталог не влияет на
// результат.
const fixture = (name: string) => new URL('./fixtures/' + name, import.meta.url);
// Возвращает SHA-256 в шестнадцатеричном виде для сверки зафиксированных данных.
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const protocolSHA = 'f3b0ed104dc916bbcb429bf48682c0b6fb2f2b7cd5507a2277df37d05487a735';
let manifestCache: Manifest | undefined, caseCache: SourceCSRCase | undefined;
export function readSelectTagCloseHandlesCachedOptionManifest() {
  if (manifestCache) {
    return manifestCache;
  }
  const bytes = readFileSync(fixture(prefix + 'source-manifest.json'));
  assert.equal(bytes.length, 5909);
  assert.equal(hash(bytes), '953888e3eaf15923cf6c8b0246bf23f767e4084a0989f485914e06de32b69579');
  const manifest = JSON.parse(bytes.toString('utf8')) as Manifest;
  assert.equal(manifest.status, 'passed-independent-Original-cached-option-counter');
  assert(manifest.SourceOnly);
  assert.equal(manifest.NativeDataUsed, false);
  const protocol = readFileSync(fixture(manifest.protocol.fixture));
  assert.equal(protocol.length, 9774);
  assert.equal(hash(protocol), protocolSHA);
  const frozen = JSON.parse(protocol.toString('utf8')) as {
    status: string;
    inputPins: Record<string, unknown>;
    samples: TagCloseHandleSample[]
  };
  assert.equal(frozen.status, 'frozen-after-root-review-before-source-counter');
  assert.equal(Object.keys(frozen.inputPins).length, 3);
  assert.deepEqual(frozen.samples, [manifest.sample]);
  assert(manifest.rawPair.wholeByteEqual);
  for (const variant of ['first', 'repeat'] as const) {
    assert.deepEqual(manifest.rawPair[variant], {
      path: '.upstream/artifacts/select-components-tag-close-handles-cached-option-source-counter-v1/source-' + variant + '.json',
      bytes: 3781242, sha256: 'd07a82838bd206cfde897c37b81a1c900c12634ff7c272f089225cb9adf65f24' });
  }
  assert.deepEqual(
    manifest.serialization,
    {
      losslessWholeRawBytes: true,
      fieldsDropped: [],
      rewrittenValues: [],
      normalizedSourceFields: []
    }
  );
  return manifestCache = manifest;
}
function properties(value: unknown) {
  assert(value && typeof value === 'object');
  const object = value as {
    $: string;
    properties: Array<{ key: string; value?: unknown; accessor?: unknown }>
  };
  assert.equal(object.$, 'object');
  return object.properties;
}
export function validateSelectTagCloseHandlesCachedOptionCase(entry: SourceCSRCase) {
  const manifest = readSelectTagCloseHandlesCachedOptionManifest();
  assert.equal(entry.id, 'select-close-handles-cached-option');
  assert.deepEqual(entry.sample, manifest.sample);
  assert.equal(entry.failure, null);
  assert.deepEqual(entry.observationErrors, []);
  assert.equal(entry.setup, null);
  assert.equal(entry.steps.length, 2);
  assert.deepEqual(entry.steps.map(step => step.action), manifest.sample.actions);
  assert.deepEqual(
    [entry.initial, ...entry.steps].map(point => readTagCloseHandleSourceArray(point.owner.model)),
    [['a', 'b'], ['a', 'b'], ['b']]
  );
  assert.deepEqual(entry.steps[0].owner.optionIdentities.map(option => option.value), ['b']);
  assert.deepEqual(
    entry.ledger.events.map(event => readTagCloseHandleSourceArray(event)[0]),
    ['invoke-before', 'change', 'deselect', 'invoke-after']
  );
  const deselect = readTagCloseHandleSourceArray(entry.ledger.events[2]), option = properties(deselect[2]);
  assert.equal(deselect[1], 'a');
  assert.deepEqual(option.map(row => row.key), ['key', 'value', 'label', 'marker', 'props']);
  for (const [key, value] of Object.entries({
    key: 'option-a',
    value: 'a',
    label: 'Alpha old',
    marker: 'initial-a'
  })) {
    assert.equal(
      option.find(row => row.key === key)?.value,
      value
    );
  }
  assert(
    option.find(row => row.key === 'props')?.accessor,
    'Actual deprecated Source getter remains in the full raw oracle'
  );
  assert.equal(entry.ledger.invocations.length, 1);
  const invocation = entry.ledger.invocations[0];
  assert.equal(invocation.actualArgumentCount, 1);
  assert.deepEqual(readTagCloseHandleSourceArray(invocation.arguments), [{ $: 'undefined' }]);
  assert.deepEqual(invocation.result, { $: 'undefined' });
  assert.equal(invocation.thrown, null);
  assert(invocation.handle.callbackIsInfoOnClose);
  for (const call of entry.ledger.producerCalls) {
    if (call.kind === 'tagRender') readTagCloseHandleSourceInfo(call);
  }
  assert.deepEqual(entry.network, { requests: [], requestFailures: [], responses: [] });
  for (const point of [entry.initial, ...entry.steps]) assert(point.dom.sameRoot && point.dom.sameEditor);
  assert(Object.values(entry.cleanup.refs).every(Boolean));
  assert.equal(entry.cleanup.ownerCount, 0);
  assert.equal(entry.cleanup.popupCount, 0);
  assert(entry.cleanup.retainedConnected.filter(node => node.ownedAtFirstObservation).every(node => !node.connected));
  assert.equal(
    JSON.stringify(entry.cleanup),
    JSON.stringify(entry.late),
    'Actual whole late1000ms observation'
  );
  return entry;
}
/** One complete independently captured Source case; no Native-shaped projection. */
export function readSelectTagCloseHandlesCachedOptionCase(): SourceCSRCase {
  if (caseCache) {
    return caseCache;
  }
  const manifest = readSelectTagCloseHandlesCachedOptionManifest(), stored = readFileSync(fixture(manifest.portable.path));
  assert.equal(stored.length, 112895);
  assert.equal(hash(stored), '8853919e17555a9efb20412247ac60294e05ad48b3a9b6ace3b6a33021b04a6d');
  const bytes = gunzipSync(stored);
  assert.equal(bytes.length, 3781242);
  assert.equal(hash(bytes), 'd07a82838bd206cfde897c37b81a1c900c12634ff7c272f089225cb9adf65f24');
  const source = JSON.parse(bytes.toString('utf8')) as TagCloseHandleSource<SourceCSRCase> & { reference: { originalHandleSourceProtocolSha256: string } };
  assert.deepEqual(source.reference, manifest.header);
  assert.equal(source.reference.mode, 'csr');
  assert.equal(source.reference.kind, 'Original-public-tag-render-cached-option-counter');
  assert.equal(source.reference.version, '6.6.8');
  assert.equal(source.reference.react, '18.3.1');
  assert.equal(source.reference.rcSelect, '1.10.1');
  assert.equal(source.reference.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
  assert.equal(source.reference.chromium, '157.0.8103.78');
  assert.equal(source.reference.node, 'v24.18.0');
  assert.equal(source.reference.protocolSha256, protocolSHA);
  assert.equal(
    source.reference.originalHandleSourceProtocolSha256,
    'b1678a2f9ea70c1b9cff69534e0f36348ba6eec90b4087f24832ba5543b6eb96'
  );
  assert.deepEqual(source.reference.errors, []);
  assert.deepEqual(source.reference.diagnostics, []);
  assert.equal(source.cases.length, 1);
  assert.deepEqual(source.reference.actualCounts, { owners: 1, actions: 2, logicalInitialAndActionPoints: 3, retentionSetupButtonInvocations: 0,
    totalCallerButtonInvocations: 2, uniqueInitialSSRStates: 0, initialSSRSerializations: 0 });
  return caseCache = validateSelectTagCloseHandlesCachedOptionCase(source.cases[0]);
}
