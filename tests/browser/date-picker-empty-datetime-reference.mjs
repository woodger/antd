import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { samples, counts } from './date-picker-empty-datetime-cases.mjs';

const source = '.upstream/artifacts/date-picker-empty-datetime-proposal-v2/';
const prefix = 'ant-design-date-picker-empty-datetime-';
const protocolSHA = '5214ca6f831ded7c015998f8f119129aea1499d7124754b763977415602fc1d1';
// Разрешает путь к локальному снимку относительно модуля. Текущий рабочий каталог не влияет на
// результат.
const fixture = name => new URL('./fixtures/' + name, import.meta.url);
// Возвращает SHA-256 в шестнадцатеричном виде для сверки зафиксированных данных.
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const metadataBytes = fs.readFileSync(fixture(prefix + 'source-manifest.json'));
assert.equal(metadataBytes.length, 73371);
assert.equal(sha(metadataBytes), 'b45db0d01ee428c186367719e3dfcab03587b534e426023d994106a17a0cef40');
const metadata = JSON.parse(metadataBytes);
assert.equal(metadata.format, 'ant-design-empty-datetime-source-v2');
assert.equal(metadata.sourceOnly, true);
assert.equal(metadata.NativeDataUsed, false);
assert.equal(metadata.protocolSHA256, protocolSHA);
assert.deepEqual(metadata.counts, counts);
assert.deepEqual(metadata.caseIds, samples.map(sample => sample.id));
assert.deepEqual(metadata.serialization.rawFieldsDropped, []);
assert.deepEqual(metadata.serialization.rawFieldsRewritten, []);
assert.deepEqual(metadata.serialization.normalizedFields, []);
assert.equal(metadata.serialization.oneCompletePartAtATime, true);
assert.equal(metadata.serialization.completeOriginalParts, 68);
assert.equal(metadata.serialization.wholeManifestOrAfterCallByteEqualityClaimed, false);

// Проверяет размеры и хеши сжатых и исходных байтов. Распаковка происходит между этими
// проверками.
function decodeStored(entry, stored) {
  assert.match(entry.fixture, new RegExp('^' + prefix + 'parts/[0-9a-f]{64}\\.json\\.gz$'));
  assert.equal(stored.length, entry.stored.bytes, 'Stored gzip byte count');
  assert.equal(sha(stored), entry.stored.sha256, 'Stored gzip SHA256');
  assert.equal(entry.fixture, prefix + 'parts/' + entry.stored.sha256 + '.json.gz');
  if (entry.storedOriginalGzipByteCopy) {
    assert.equal(entry.stored.bytes, entry.original.gzipBytes);
    assert.equal(entry.stored.sha256, entry.original.gzipSHA256);
  }
  const bytes = gunzipSync(stored);
  assert.equal(bytes.length, entry.original.bytes, 'Original raw byte count');
  assert.equal(sha(bytes), entry.original.sha256, 'Original raw SHA256');
  return bytes;
}
function bytes(entry) { return decodeStored(entry, fs.readFileSync(fixture(entry.fixture))); }
const protocol = JSON.parse(bytes(metadata.evidence['protocol-freeze.json']));
assert.equal(metadata.evidence['protocol-freeze.json'].original.sha256, protocolSHA);
assert.equal(protocol.source.version, '6.6.8');
assert.equal(protocol.source.react, '18.3.1');
assert.equal(protocol.status, 'Root-reviewed-frozen-before-empty-datetime-Source-browser');
assert.equal(protocol.source.environment.fixedDate, '2024-06-10T08:23:45.678Z');
assert.deepEqual(protocol.samples, samples);
assert.deepEqual(protocol.counts, counts);
const sharedBytes = fs.readFileSync(new URL(
  './date-picker-empty-datetime-cases.mjs',
  import.meta.url
));
assert.equal(sha(sharedBytes), protocol.inputPins[source + 'cases.mjs'].sha256);
assert.equal(sharedBytes.length, protocol.inputPins[source + 'cases.mjs'].bytes);
const scope = variant => {
  assert(['first', 'repeat'].includes(variant), 'Unknown independent Source capture');
  return source + 'csr-source-' + variant + '.json';
};
// Проверяет привязку части к конкретному прогону и исходным метаданным. При заданном пути сверяет
// и слот действия.
export function verifyEmptyDatetimeSourcePartBinding(reference, variant = 'first', expectedFile) {
  const base = scope(variant);
  assert.deepEqual(Object.keys(reference), ['rawJSONPart']);
  const original = reference.rawJSONPart;
  assert.equal(original.file.startsWith(base + '.parts/'), true, 'Source capture path binding');
  if (expectedFile !== undefined) {
    assert.equal(
      original.file,
      expectedFile,
      'Source owner/action slot binding'
    );
  }
  assert.equal(original.gzipFile, original.file + '.gz');
  const entry = metadata.parts[original.file];
  assert(entry, 'Missing whole original Source part mapping');
  assert.deepEqual(entry.original, original, 'Exact original raw/stored byte metadata');
  assert.equal(entry.fixture, prefix + 'parts/' + original.gzipSHA256 + '.json.gz');
  return entry;
}
export function verifyEmptyDatetimeSourceManifest(value, variant = 'first') {
  const file = scope(variant);
  assert.equal(value.status, 'complete');
  assert.equal(value.variant, variant);
  assert.equal(value.sourceProtocol.file, source + 'protocol-freeze.json');
  assert.equal(value.sourceProtocol.sha256, protocolSHA);
  assert.equal(value.sourceProtocol.reviewedProposalSHA256, protocol.reviewedProposalSHA256);
  assert.equal(value.sourceProtocol.rootLease, protocol.rootLease);
  assert.equal(value.browserVersion, protocol.source.environment.chromium);
  assert.deepEqual(value.counts, counts);
  assert.deepEqual(value.actualCounts, metadata.expectedActual);
  assert.deepEqual(value.errors, []);
  assert.deepEqual(value.diagnostics, []);
  assert.equal(value.fatal, null);
  assert.deepEqual(value.terminalInputVerification, { unchanged: true, sha256: protocolSHA });
  assert.deepEqual(value.cases.map(row => row.id), metadata.caseIds);
  for (const [index, row] of value.cases.entries()) {
    assert.deepEqual(row.sample, samples[index]);
    assert.equal(row.failure, null);
    assert.deepEqual(row.observationErrors, []);
    assert.equal(row.interruptedAction, null);
    assert.deepEqual(row.network, { requests: [], responses: [], failures: [] });
    const bind = (ref, suffix) => verifyEmptyDatetimeSourcePartBinding(ref, variant,
      file + '.parts/' + row.id + '-' + suffix + '.json');
    bind(row.initial, 'initial');
    assert.equal(row.steps.length, row.sample.actions.length);
    row.steps.forEach((ref, step) => bind(ref, 'step-' + step));
    const closes = row.sample.actions.flatMap((action, step) => action.type === 'input-escape' ? [step] : []);
    assert.equal(row.closed.length, closes.length);
    row.closed.forEach((ref, close) => bind(ref, 'closed-' + closes[close]));
    bind(row.beforeUnmount, 'before-unmount');
    bind(row.cleanup, 'cleanup');
    bind(row.late, 'late');
  }
}
// Разрешает идентификатор объекта и имя его свойства. Сохраняет сериализованное значение без
// преобразования.
function property(graph, ref, key) {
  const node = graph.objects.find(node => node.id === ref?.ref);
  assert(node, 'Actual raw object reference absent');
  const found = node.properties?.find(item => item.key === key);
  assert(found && Object.hasOwn(found, 'value'), 'Original data property absent: ' + key);
  return found.value;
}
const encodedArgument = (callback, index) => callback.encodedArguments.properties
  .find(item => item.key === String(index))?.value;
export function verifyEmptyDatetimeSourcePoint(point) {
  assert(metadata.caseIds.includes(point.owner.owner));
  assert.equal(point.resources.timers, null);
  assert.equal(point.resources.frames, null);
  assert.equal(point.resources.observers, null);
  const arities = { open: 1, calendar: 3, 'picker-value': 2 };
  for (const [index, callback] of point.owner.callbacks.entries()) {
    assert.equal(callback.index, index, 'Actual callback tape ordering');
    assert(
      Object.hasOwn(arities, callback.name),
      'Unexpected callback in this bounded actual Source tape'
    );
    assert.equal(
      callback.actualArgumentCount,
      arities[callback.name],
      'Actual Source callback arity'
    );
    assert.deepEqual(
      callback.receiver,
      { type: 'undefined', isUndefined: true, isNull: false, identity: null }
    );
    assert.equal(callback.encodedArguments.$, 'array');
    assert.equal(encodedArgument(callback, 'length'), callback.actualArgumentCount);
    assert.equal(
      property(callback.rawArguments, callback.rawArguments.root, 'length'),
      callback.actualArgumentCount
    );
    for (const annotated of callback.dates) {
      const date = annotated.value;
      assert.equal(date.raw.root.ref, date.identity);
      let ref = callback.rawArguments.root;
      for (const key of annotated.path) ref = property(callback.rawArguments, ref, String(key));
      assert.equal(ref.ref, date.identity, 'Full raw argument/Dayjs annotation alias');
      const fields = ['$y', '$M', '$D', '$H', '$m', '$s', '$ms'];
      assert.deepEqual(
        fields.map(key => property(callback.rawArguments, ref, key)),
        date.temporal.fields
      );
      assert.deepEqual(
        fields.map(key => property(date.raw, date.raw.root, key)),
        date.temporal.fields
      );
      assert.equal(date.temporal.valid, true);
      assert.equal(new Date(date.temporal.epoch).toISOString(), date.temporal.iso);
      assert.equal(
        date.sameAsAuthored.panel,
        date.identity === point.owner.authoredDates.panel.identity
      );
      assert.equal(
        date.sameAsAuthored.template,
        date.identity === point.owner.authoredDates.template.identity
      );
    }
  }
}
export function readEmptyDatetimeSourceManifest(variant = 'first') {
  scope(variant);
  const entry = metadata.captures[variant];
  assert.equal(entry.original.file, scope(variant));
  const value = JSON.parse(bytes(entry));
  verifyEmptyDatetimeSourceManifest(value, variant);
  return value;
}
export function readEmptyDatetimeSourceCase(id, variant = 'first') {
  const row = readEmptyDatetimeSourceManifest(variant).cases.find(row => row.id === id);
  assert(row, 'Unknown Source owner');
  return row;
}
export function verifyEmptyDatetimeSourceStoredBytes(reference, stored) {
  const variant = reference.rawJSONPart.file.startsWith(scope('first') + '.parts/') ? 'first' : 'repeat';
  return decodeStored(verifyEmptyDatetimeSourcePartBinding(reference, variant), stored);
}
export function readEmptyDatetimeSourcePart(reference) {
  const variant = reference.rawJSONPart.file.startsWith(scope('first') + '.parts/') ? 'first' : 'repeat';
  return JSON.parse(bytes(verifyEmptyDatetimeSourcePartBinding(reference, variant)));
}
export function readEmptyDatetimeSourceInitial(id, variant = 'first') {
  const value = readEmptyDatetimeSourcePart(readEmptyDatetimeSourceCase(id, variant).initial);
  verifyEmptyDatetimeSourcePoint(value);
  return value;
}
export function readEmptyDatetimeSourceStep(id, index, variant = 'first') {
  const row = readEmptyDatetimeSourceCase(id, variant);
  assert(
    Number.isInteger(index) && index >= 0 && index < row.steps.length,
    'Unknown Source action index'
  );
  const value = readEmptyDatetimeSourcePart(row.steps[index]);
  assert.equal(value.index, index);
  assert.deepEqual(value.action, row.sample.actions[index]);
  for (const point of [value.before, value.afterCall, value.actual]) verifyEmptyDatetimeSourcePoint(point);
  return value;
}
export function readEmptyDatetimeSourceClosed(id, index, variant = 'first') {
  const row = readEmptyDatetimeSourceCase(id, variant);
  assert(
    Number.isInteger(index) && index >= 0 && index < row.closed.length,
    'Unknown Source close index'
  );
  const value = readEmptyDatetimeSourcePart(row.closed[index]);
  assert.equal(row.sample.actions[value.actionIndex].type, 'input-escape');
  verifyEmptyDatetimeSourcePoint(value.after1000);
  return value;
}
export function readEmptyDatetimeSourceCleanup(id, phase = 'cleanup', variant = 'first') {
  assert(['beforeUnmount', 'cleanup', 'late'].includes(phase), 'Unknown public unmount phase');
  const value = readEmptyDatetimeSourcePart(readEmptyDatetimeSourceCase(id, variant)[phase]);
  verifyEmptyDatetimeSourcePoint(value);
  return value;
}
export function readEmptyDatetimeSourceEvidence(name) {
  assert(Object.hasOwn(metadata.evidence, name), 'Unknown Source provenance file');
  return bytes(metadata.evidence[name]);
}
export function verifyEmptyDatetimeSourceStoredParts() {
  for (const variant of ['first', 'repeat']) readEmptyDatetimeSourceManifest(variant);
  for (const entry of Object.values(metadata.parts)) bytes(entry);
  for (const entry of Object.values(metadata.evidence)) bytes(entry);
  return { sourceOnly: true, captures: 2, originalParts: Object.keys(metadata.parts).length,
    partBlobs: new Set(Object.values(metadata.parts).map(entry => entry.fixture)).size,
    allBlobs: new Set([...Object.values(metadata.parts), ...Object.values(metadata.evidence),
      ...Object.values(metadata.captures)].map(entry => entry.fixture)).size };
}
