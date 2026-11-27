import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
export interface SelectTagCloseKey { key: string; code: string; which: number; keyCode: number; ctrlKey: boolean }
export interface SelectTagCloseKeyCase {
  id: string; key: SelectTagCloseKey; beforeOpen: boolean; immediateOpen: boolean; settledOpen: boolean; lateOpen: boolean;
  eventKindsBefore: string[]; eventKindsSettled: string[]; eventKindsAfterKeyboard: string[];
}
interface Projection { cases: SelectTagCloseKeyCase[] }
interface Snapshot { owner: { open: boolean; events: unknown[] } }
interface RawCase {
  id: string; key: SelectTagCloseKey & { id: string }; sample: { id: string };
  immediate: {
    afterMouseDown: Snapshot;
    afterKeyboard: Snapshot;
    actualKey: SelectTagCloseKey;
    physicalEditorUnchanged: boolean
  };
  trace: Array<{ phase: string; actual: Snapshot }>; failure: unknown; observationErrors: unknown[];
  network: { requests: unknown[]; failures: unknown[]; responses: unknown[] };
}
interface RawSource { kind: string; reference: Record<string, unknown>; cases: RawCase[] }
const prefix = 'ant-design-select-components-tag-close-key-counter-';
// Allows the path to a local image relative to the module. Current working directory does not
// affect the result.
const fixture = (name: string) => new URL('./fixtures/' + name, import.meta.url);
// Returns SHA-256 in hexadecimal form for the reconciliation of the recorded data.
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const pins = {
  first: {
    storageBytes: 1902674,
    storageSha256: '4b0fa1c3d223b25cda8b56678e58c7b9e29e40a492c07657abe786e946b395ea',
    decodedSha256: '94dba92aca291ea7ded4e67255d2aa34045cca6abb14322266cb3c60c1204eb5'
  },
  repeat: {
    storageBytes: 1902685,
    storageSha256: '752011e3e6e217078a58b70ecf09806edfbb59ed40c6e33d4c9d89d1a7305f0b',
    decodedSha256: '48945b0a52301e4d65d1fe98044433188e7638f7907ca03920660af26e274fd5'
  }
};
function kinds(snapshot: Snapshot) {
  return snapshot.owner.events.map(value => {
    assert(value && typeof value === 'object');
    const row = value as { $: string; properties: Array<{ key: string; value: unknown }> };
    assert.equal(row.$, 'array');
    assert.equal(row.properties[0].key, '0');
    assert.equal(typeof row.properties[0].value, 'string');
    return row.properties[0].value as string;
  });
}
function project(source: RawSource): Projection {
  return { cases: source.cases.map(entry => {
    const phase = (name: string) => {
      const row = entry.trace.find(row => row.phase === name);
      assert(row);
      return row.actual;
    };
    const { id: _id, ...key } = entry.key;
    return { id: entry.id, key, beforeOpen: phase('before').owner.open, immediateOpen: entry.immediate.afterKeyboard.owner.open,
      settledOpen: phase('settled').owner.open, lateOpen: phase('late100').owner.open,
      eventKindsBefore: kinds(phase('before')), eventKindsSettled: kinds(phase('settled')), eventKindsAfterKeyboard: kinds(entry.immediate.afterKeyboard) };
  }) };
}
let cache: Projection | undefined;
/** Only the independently equal key/open/event-name projection is compared.
 * Both complete raw histories remain lossless and independently pinned; their
 * pure render-call chronology is not claimed to be byte equal or normalized.
 */
export function readSelectTagCloseKeyCounter(): Projection {
  if (cache) {
    return cache;
  }
  const manifestBytes = readFileSync(fixture(prefix + 'source-manifest.json'));
  assert.equal(manifestBytes.length, 5493);
  assert.equal(
    hash(manifestBytes),
    '2dff325c99283488e50200fcbdf2709da976964d92d52ce6b4060d2369bb1252'
  );
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  const protocolBytes = readFileSync(fixture(prefix + 'source-protocol.json'));
  assert.equal(protocolBytes.length, 164563);
  assert.equal(
    hash(protocolBytes),
    '33a7039d7f906c4bf54be36c49c65bc5d94d1f14cfb70feb752c1f512e344c76'
  );
  const protocol = JSON.parse(protocolBytes.toString('utf8'));
  assert.equal(protocol.status, 'frozen-before-counter-launch');
  assert.equal(protocol.frozenCallerCopies.length, 4);
  assert(protocol.frozenCallerCopies.every((copy: { byteEqual: boolean }) => copy.byteEqual));
  assert.equal(Object.keys(protocol.inputs).length, 11);
  assert.equal(Object.keys(protocol.protectedFiles).length, 722);
  assert.equal(protocol.productionStands.length, 9);
  assert.equal(manifest.wholeRawByteEqual, false);
  assert.equal(manifest.projectionFirstRepeatEqual, true);
  assert.deepEqual(
    manifest.serialization,
    {
      lossless: true,
      fieldsDropped: [],
      fieldsRewritten: [],
      SourceExpectedValuesDerivedFromNative: false
    }
  );
  const projections: Projection[] = [];
  for (const variant of ['first', 'repeat'] as const) {
    const expected = pins[variant], stored = readFileSync(fixture(prefix + variant + '-reference.json.gz'));
    assert.equal(stored.length, expected.storageBytes);
    assert.equal(hash(stored), expected.storageSha256);
    const decoded = gunzipSync(stored);
    assert.equal(decoded.length, 73008965);
    assert.equal(hash(decoded), expected.decodedSha256);
    const source = JSON.parse(decoded.toString('utf8')) as RawSource;
    assert.equal(source.kind, 'independent-Original-public-pending-custom-tag-close-key-counter');
    assert.deepEqual(source.reference, manifest.headers[variant]);
    assert.equal(source.reference.version, '6.6.8');
    assert.equal(source.reference.react, '18.3.1');
    assert.equal(source.reference.rcSelect, '1.10.1');
    assert.equal(source.reference.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
    assert.equal(source.reference.chromium, '157.0.8103.78');
    assert.equal(source.reference.node, 'v24.18.0');
    assert.equal(source.reference.counterProtocolSha256, hash(protocolBytes));
    assert.equal(
      source.reference.originalSourceProtocolSha256,
      '85bf9833e79305571a7dcbb5d15679fd652d36f88f9a5a8b50142762cc97a45d'
    );
    assert.deepEqual(source.reference.errors, []);
    assert.deepEqual(source.reference.diagnostics, []);
    assert.deepEqual(source.reference.pinsChanged, []);
    assert.equal(source.reference.protectedFileCount, 722);
    assert.equal(source.reference.protectedProductionStandCount, 9);
    assert.deepEqual(
      source.cases.map(entry => entry.id),
      protocol.keyCases.map((key: { id: string }) => key.id)
    );
    source.cases.forEach((entry, index) => {
      assert.deepEqual(entry.key, protocol.keyCases[index]);
      assert.equal(entry.sample.id, protocol.sampleId);
      assert.equal(entry.failure, null);
      assert.deepEqual(entry.observationErrors, []);
      assert.deepEqual(entry.network, { requests: [], failures: [], responses: [] });
      assert.deepEqual(entry.trace.map(row => row.phase), ['before', 'settled', 'late100']);
      const { id: _id, ...key } = entry.key;
      assert.deepEqual(entry.immediate.actualKey, key);
      assert.equal(entry.immediate.physicalEditorUnchanged, true);
      assert.equal(entry.immediate.afterMouseDown.owner.open, true);
    });
    projections.push(project(source));
  }
  assert.deepEqual(
    projections[0],
    projections[1],
    'Independent Source key/open/event projections; full raw histories are not rewritten'
  );
  assert.deepEqual(projections[0], manifest.projection);
  return cache = projections[0];
}
