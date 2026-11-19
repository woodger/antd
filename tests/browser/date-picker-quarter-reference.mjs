import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { samples, counts } from './date-picker-quarter-cases.mjs';

const prefix = 'ant-design-date-picker-quarter-';
const source = '.upstream/artifacts/date-picker-quarter-source-proposal-v1/';
const protocolSHA = 'ee43854db3b3606e976375467ffa174c7053ad9ebe069a2066705cad80bd2e87';
const authoredNames = ['initialStart', 'initialEnd', 'minDate', 'maxDate',
  'presetA', 'presetB', 'witnessStart', 'witnessEnd'];
const fixture = file => new URL('./fixtures/' + file, import.meta.url);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const metadataBytes = fs.readFileSync(fixture(prefix + 'source-manifest.json'));
assert.equal(sha(metadataBytes), '4e572afcf77aca2e3e288f1e1ec3dc9192eacca3c0e882c4f97d58bed4ce891e');
const metadata = JSON.parse(metadataBytes);
assert.equal(metadata.format, 'ant-design-public-date-picker-quarter-source-v1');
assert.equal(metadata.sourceOnly, true);
assert.equal(metadata.NativeDataUsed, false);
assert.equal(metadata.sourceProtocolSHA256, protocolSHA);
assert.deepEqual(metadata.counts, counts);
assert.deepEqual(metadata.serialization.rawFieldsDropped, []);
assert.deepEqual(metadata.serialization.rawFieldsRewritten, []);
assert.deepEqual(metadata.serialization.normalizedFields, []);
assert.equal(metadata.serialization.IDsRenumbered, false);
assert.equal(metadata.serialization.oneCompletePartAtATime, true);
assert.equal(metadata.serialization.wholeCorpusCache, false);
assert.equal(metadata.serialization.completeOriginalParts, 456);
assert.equal(metadata.serialization.completeOriginalManifests, 4);
assert.equal(Object.keys(metadata.parts).length, 456);
assert.equal(metadata.serialization.originalStoredGzipBytesCopiedExactly, true);

export function readQuarterSourceEvidence(name) {
  const entry = metadata.documents[name];
  assert(entry, 'Unknown original Source evidence document');
  const bytes = fs.readFileSync(fixture(entry.fixture));
  assert.equal(bytes.length, entry.bytes);
  assert.equal(sha(bytes), entry.sha256);
  return bytes;
}
const protocol = JSON.parse(readQuarterSourceEvidence('protocol-freeze'));
assert.equal(metadata.documents['protocol-freeze'].sha256, protocolSHA);
assert.equal(protocol.source.version, '6.6.8');
assert.equal(protocol.source.rcPicker, '1.12.2');
assert.equal(protocol.source.react, '18.3.1');
assert.deepEqual(protocol.samples, samples);
assert.deepEqual(protocol.counts, counts);
for (const entry of [metadata.sharedCases, metadata.sharedSchema]) {
  const bytes = fs.readFileSync(new URL('./' + entry.file, import.meta.url));
  assert.equal(bytes.length, entry.bytes);
  assert.equal(sha(bytes), entry.sha256);
}
assert.equal(metadata.sharedCases.sha256, protocol.inputPins[source + 'cases.mjs'].sha256);
const release = JSON.parse(readQuarterSourceEvidence('release'));
assert.equal(release.status, 'released');
assert.equal(release.sourceProtocolSHA256, protocolSHA);
assert.equal(release.sourceInputPinsUnchangedAtRelease, true);
assert.equal(release.priorSourceMetadataPinsUnchanged, true);
assert.equal(release.NativeDataRead, false);
assert.deepEqual(release.rawMutations, []);
assert.equal(release.runs.length, 4);
for (const run of release.runs) {
  const original = metadata.captures[run.kind + '-' + run.variant].original;
  assert.equal(original.file, run.file);
  assert.equal(original.bytes, run.bytes);
  assert.equal(original.sha256, run.sha256);
  assert.equal(run.actualExitCode, 0);
  assert.equal(run.terminalPinsUnchanged, true);
}

function scope(kind, variant) {
  assert(['csr', 'ssr'].includes(kind), 'Unknown Source capture kind');
  assert(['first', 'repeat'].includes(variant), 'Unknown independent Source capture');
  return source + kind + '-source-' + variant + '.json';
}
function decodeStored(entry, stored) {
  const original = entry.original;
  assert.match(entry.fixture, new RegExp('^' + prefix + 'parts/[0-9a-f]{64}\\.json\\.gz$'));
  assert.equal(entry.originalStoredGzipBytesCopiedExactly, true);
  assert.equal(stored.length, original.gzipBytes);
  assert.equal(sha(stored), original.gzipSHA256);
  assert.equal(entry.fixture, prefix + 'parts/' + original.gzipSHA256 + '.json.gz');
  const bytes = gunzipSync(stored);
  assert.equal(bytes.length, original.bytes);
  assert.equal(sha(bytes), original.sha256);
  return bytes;
}
function decode(entry) {
  return JSON.parse(decodeStored(entry, fs.readFileSync(fixture(entry.fixture))));
}
export function verifyQuarterSourcePartBinding(reference, kind, variant = 'first', expectedFile) {
  const original = reference.rawJSONPart ?? reference;
  const capture = scope(kind, variant);
  assert.equal(original.file.startsWith(capture + '.parts/'), true, 'Original capture binding');
  assert.equal(original.gzipFile, original.file + '.gz');
  if (expectedFile !== undefined) {
    assert.equal(
      original.file,
      expectedFile,
      'Owner/action slot binding'
    );
  }
  const entry = metadata.parts[original.file];
  assert(entry, 'Missing complete original Source part');
  assert.deepEqual(entry.original, original, 'Exact original raw/stored metadata');
  return entry;
}
function partScope(reference) {
  const original = reference.rawJSONPart ?? reference;
  for (const kind of ['csr', 'ssr']) {
    for (const variant of ['first', 'repeat']) {
      if (original.file.startsWith(scope(kind, variant) + '.parts/')) {
        return { kind, variant };
      }
    }
  }
  throw Error('Part does not belong to this independent Source corpus');
}
export function verifyQuarterSourceStoredBytes(reference, stored) {
  const { kind, variant } = partScope(reference);
  return decodeStored(verifyQuarterSourcePartBinding(reference, kind, variant), stored);
}
export function readQuarterSourcePart(reference) {
  const { kind, variant } = partScope(reference);
  return decode(verifyQuarterSourcePartBinding(reference, kind, variant));
}
export function verifyQuarterSourceManifest(value, kind = 'csr', variant = 'first') {
  const file = scope(kind, variant);
  assert.equal(value.status, 'complete');
  assert.equal(value.variant, variant);
  assert.equal(value.sourceProtocol.file, source + 'protocol-freeze.json');
  assert.equal(value.sourceProtocol.sha256, protocolSHA);
  assert.equal(value.sourceProtocol.rootLease, protocol.rootLease);
  assert.equal(value.sourceProtocol.reviewedProposalSHA256, protocol.reviewedProposalSHA256);
  assert.deepEqual(value.terminalInputVerification, { unchanged: true, sha256: protocolSHA });
  assert.deepEqual(value.diagnostics, []);
  if (kind === 'ssr') {
    assert.deepEqual(value.counts, { owners: 2, serializations: 4 });
    assert.equal(value.failures, 0);
    const expected = samples.flatMap(sample => ['renderToString', 'renderToStaticMarkup']
      .map(method => ({ id: sample.id, method })));
    assert.equal(value.cases.length, expected.length);
    value.cases.forEach((row, index) => {
      assert.equal(row.id, expected[index].id);
      assert.equal(row.method, expected[index].method);
      verifyQuarterSourcePartBinding(row, kind, variant,
        file + '.parts/' + row.id + '-' + row.method + '.json');
    });
    return;
  }
  assert.equal(value.browserVersion, protocol.source.environment.chromium);
  assert.deepEqual(value.counts, counts);
  assert.deepEqual(value.errors, []);
  assert.equal(value.fatal, null);
  assert.deepEqual(value.actualCounts, { owners: 2, actions: 90, initialAndSettledPoints: 92,
    declaredEscapeReadsAfter1000: 13, wholeUnmounts: 2, cleanupReads: 2, lateReads: 2,
    rawPointParts: 111, producerParts: 113, producerInvocations: 573, rawParts: 224 });
  assert.deepEqual(value.cases.map(row => row.id), samples.map(sample => sample.id));
  assert.equal(value.cases.reduce((sum, row) => sum + row.producerFinalCount, 0),
    value.actualCounts.producerInvocations);
  for (const [index, row] of value.cases.entries()) {
    assert.deepEqual(row.sample, samples[index]);
    assert.equal(row.failure, null);
    assert.equal(row.interruptedAction, null);
    assert.deepEqual(row.observationErrors, []);
    assert.deepEqual(row.network.failures, []);
    assert(row.network.responses.every(response => response.status < 400));
    const bind = (ref, phase) => verifyQuarterSourcePartBinding(ref, kind, variant,
      file + '.parts/' + row.id + '-' + phase + '.json');
    bind(row.initial, 'initial');
    assert.equal(row.steps.length, row.sample.actions.length);
    const producerPhases = ['initial'];
    const closes = [];
    row.steps.forEach((reference, step) => {
      bind(reference, 'step-' + step);
      producerPhases.push('step-' + step);
      if (row.sample.actions[step].type === 'input-escape') {
        closes.push(step);
        producerPhases.push('closed-' + step);
      }
    });
    assert.equal(row.closed.length, closes.length);
    row.closed.forEach((reference, close) => bind(reference, 'closed-' + closes[close]));
    for (const [key, phase] of [['beforeUnmount', 'before-unmount'], ['cleanup', 'cleanup'], ['late', 'late']]) {
      bind(row[key], phase);
      producerPhases.push(phase);
    }
    producerPhases.push('terminal-tail');
    assert.deepEqual(row.producerParts.map(part => part.phase), producerPhases);
    let cursor = 0;
    for (const part of row.producerParts) {
      bind(part, part.phase + '-producers');
      assert.equal(part.cursor, cursor, 'All original producer chunks are contiguous');
      assert(Number.isInteger(part.next) && part.next >= cursor);
      cursor = part.next;
    }
    assert.equal(cursor, row.producerFinalCount);
  }
}
export function readQuarterSourceManifest(kind = 'csr', variant = 'first') {
  scope(kind, variant);
  const entry = metadata.captures[kind + '-' + variant];
  assert.equal(entry.original.file, scope(kind, variant));
  const value = decode(entry);
  verifyQuarterSourceManifest(value, kind, variant);
  return value;
}
export function readQuarterSourceCase(id, variant = 'first') {
  const row = readQuarterSourceManifest('csr', variant).cases.find(row => row.id === id);
  assert(row, 'Unknown public Source quarter owner');
  return row;
}
function property(graph, identity, key) {
  const node = graph.objects.find(node => node.id === identity);
  assert(node, 'Missing actual raw object identity');
  const found = node.properties?.find(row => row.key === key);
  assert(found && Object.hasOwn(found, 'value'), 'Missing original data property ' + key);
  return found.value;
}
function dateSnapshot(value, authored) {
  assert.equal(value.raw.root.ref, value.identity);
  const fields = ['$y', '$M', '$D', '$H', '$m', '$s', '$ms'];
  assert.deepEqual(
    fields.map(key => property(value.raw, value.identity, key)),
    value.temporal.fields
  );
  assert.equal(value.temporal.fields.length, 7);
  assert.equal(value.temporal.valid, true);
  assert.equal(new Date(value.temporal.epoch).toISOString(), value.temporal.iso);
  assert.deepEqual(Object.keys(value.sameAsAuthored), authoredNames);
  for (const name of authoredNames) {
    assert.equal(value.sameAsAuthored[name], value.identity === authored[name].identity);
  }
}
function invocation(call, index, authored) {
  assert.equal(call.index, index, 'Monotonic invocation index');
  const length = call.encodedArguments.properties.find(row => row.key === 'length')?.value;
  assert(Number.isInteger(length) && length >= 0);
  assert.equal(call.actualArgumentCount, length);
  assert.equal(property(call.rawArguments, call.rawArguments.root.ref, 'length'), length);
  for (const annotation of call.dates) {
    const date = annotation.value;
    if (authored) {
      dateSnapshot(date, authored);
    }
    else {
      assert.equal(date.raw.root.ref, date.identity);
      assert.deepEqual(['$y', '$M', '$D', '$H', '$m', '$s', '$ms']
        .map(key => property(date.raw, date.identity, key)), date.temporal.fields);
    }
    let identity = call.rawArguments.root.ref;
    for (const key of annotation.path) identity = property(call.rawArguments, identity, String(key)).ref;
    assert.equal(identity, date.identity, 'Raw argument date identity agrees with its annotation');
  }
}
function verifyOwner(owner) {
  const sample = samples.find(sample => sample.id === owner.id);
  assert(sample);
  assert.equal(owner.picker, sample.picker);
  assert.deepEqual(Object.keys(owner.authoredDates), authoredNames);
  assert.equal(typeof owner.alive, 'boolean');
  assert.equal(typeof owner.open, 'boolean');
  assert(['first', 'last'].includes(owner.disabledBoundary));
  assert(Number.isInteger(owner.producerCount) && owner.producerCount >= 0);
  const model = owner.rawModel.objects.find(node => node.id === owner.rawModel.root.ref);
  assert(model, 'Complete actual Source model graph');
  assert.equal(model.array, sample.kind === 'range', 'Actual owner model shape');
  const arities = { open: 1, change: 2, calendar: 3, 'picker-value': 2, panel: 2, ok: 1 };
  for (const [index, call] of owner.callbacks.entries()) {
    assert(Object.hasOwn(arities, call.name));
    assert.equal(call.actualArgumentCount, arities[call.name]);
    assert.deepEqual(call.receiver, { type: 'undefined', isUndefined: true,
      isNull: false, identity: null });
    invocation(call, index, owner.authoredDates);
  }
  for (const value of Object.values(owner.authoredDates)) dateSnapshot(value, owner.authoredDates);
  for (const annotation of owner.modelDates) {
    dateSnapshot(annotation.value, owner.authoredDates);
    let identity = owner.rawModel.root.ref;
    for (const key of annotation.path) identity = property(owner.rawModel, identity, String(key)).ref;
    assert.equal(identity, annotation.value.identity, 'Actual owner model date identity');
  }
}
export function verifyQuarterSourcePoint(point) {
  verifyOwner(point.owner);
  assert.equal(point.resources.timers, null);
  assert.equal(point.resources.frames, null);
  assert.equal(point.resources.observers, null);
  assert.equal(point.refs.owner, point.ownerDOM?.identity ?? null);
  assert.equal(point.refs.root, point.root?.identity ?? null);
  if (point.refs.control) {
    const control = point.refs.control;
    assert.deepEqual(control.own.map(row => row.key), ['nativeElement', 'focus', 'blur']);
    assert.equal(control.nativeElementIdentity, point.refs.root);
    assert.equal(control.raw.root.ref, control.identity);
    assert.equal(property(control.raw, control.identity, 'nativeElement').ref, point.refs.root);
  }
}
export function readQuarterSourceInitial(id, variant = 'first') {
  const value = readQuarterSourcePart(readQuarterSourceCase(id, variant).initial);
  verifyQuarterSourcePoint(value);
  return value;
}
export function readQuarterSourceStep(id, index, variant = 'first') {
  const row = readQuarterSourceCase(id, variant);
  assert(Number.isInteger(index) && index >= 0 && index < row.steps.length, 'Unknown Source action');
  const value = readQuarterSourcePart(row.steps[index]);
  assert.equal(value.index, index);
  assert.deepEqual(value.action, row.sample.actions[index]);
  for (const point of [value.before, value.afterCall, value.actual]) verifyQuarterSourcePoint(point);
  if (value.actionEvidence.afterFocusPointer) verifyQuarterSourcePoint(value.actionEvidence.afterFocusPointer);
  return value;
}
export function readQuarterSourceClosed(id, index, variant = 'first') {
  const row = readQuarterSourceCase(id, variant);
  assert(Number.isInteger(index) && index >= 0 && index < row.closed.length, 'Unknown Source close');
  const value = readQuarterSourcePart(row.closed[index]);
  const closes = row.sample.actions.flatMap((action, step) => action.type === 'input-escape' ? [step] : []);
  assert.equal(value.actionIndex, closes[index]);
  verifyQuarterSourcePoint(value.after1000);
  return value;
}
export function readQuarterSourceCleanup(id, phase = 'cleanup', variant = 'first') {
  assert(['beforeUnmount', 'cleanup', 'late'].includes(phase), 'Unknown Source disposal phase');
  const value = readQuarterSourcePart(readQuarterSourceCase(id, variant)[phase]);
  verifyQuarterSourcePoint(value);
  return value;
}
export function readQuarterSourceProducerChunks(id, variant = 'first') {
  return readQuarterSourceCase(id, variant).producerParts;
}
export function verifyQuarterSourceProducerChunk(value, envelope) {
  assert.equal(value.next - value.cursor, value.rows.length);
  assert.equal(value.observationEnd, value.next);
  assert(Number.isInteger(value.cursor) && value.cursor >= 0);
  if (envelope) {
    for (const key of ['phase', 'cursor', 'next']) assert.equal(value[key], envelope[key]);
  }
  const boundaries = Object.entries(value.boundaries);
  assert(boundaries.length > 0);
  let previous = value.cursor;
  for (const [, count] of boundaries) {
    assert(Number.isInteger(count) && count >= previous && count <= value.next,
      'Actual UI boundaries lie in the original monotonic producer interval');
    previous = count;
  }
  if (value.phase === 'terminal-tail') {
    assert.deepEqual(
      value.boundaries,
      { afterLate: value.cursor }
    );
  }
  for (const [index, call] of value.rows.entries()) {
    assert.equal(call.name, 'disabledDate');
    assert(['first', 'last'].includes(call.boundary), 'Actual authored disabledDate function label');
    assert.equal(call.actualArgumentCount, 2);
    assert.deepEqual(call.receiver, { type: 'undefined', isUndefined: true,
      isNull: false, identity: null });
    assert.equal(typeof call.returned, 'boolean');
    invocation(call, value.cursor + index);
  }
}
export function readQuarterSourceProducerChunk(id, index, variant = 'first') {
  const chunks = readQuarterSourceProducerChunks(id, variant);
  assert(
    Number.isInteger(index) && index >= 0 && index < chunks.length,
    'Unknown Source producer chunk'
  );
  const value = readQuarterSourcePart(chunks[index]);
  verifyQuarterSourceProducerChunk(value, chunks[index]);
  return value;
}
export function readQuarterSourceSSR(id, method, variant = 'first') {
  const reference = readQuarterSourceManifest('ssr', variant).cases
    .find(row => row.id === id && row.method === method);
  assert(reference, 'Unknown Source owner or real SSR serializer');
  const value = readQuarterSourcePart(reference);
  assert.equal(value.fatal, null);
  assert.equal(value.domFree, true);
  assert.equal(value.initialClosedOnly, true);
  assert.equal(sha(Buffer.from(value.rawHtml)), value.htmlSha256);
  assert(Object.values(value.resources).every(count => count === 0));
  assert(Object.values(value.refs).every(Boolean));
  assert.equal(value.state.owner.id, id);
  verifyOwner(value.state.owner);
  assert.equal(value.state.owner.open, false);
  assert.equal(value.state.owner.alive, false);
  assert.deepEqual(value.state.owner.callbacks, []);
  assert.deepEqual(value.state.producers, { cursor: 0, next: 0, rows: [] });
  return value;
}
export function verifyQuarterSourceStoredParts() {
  for (const [file, blob] of Object.entries(metadata.blobs)) {
    const stored = fs.readFileSync(fixture(file));
    assert.equal(stored.length, blob.bytes);
    assert.equal(sha(stored), blob.sha256);
    const bytes = gunzipSync(stored);
    assert.equal(bytes.length, blob.rawBytes);
    assert.equal(sha(bytes), blob.rawSHA256);
  }
  for (const name of Object.keys(metadata.documents)) readQuarterSourceEvidence(name);
  return { sourceOnly: true, captures: 4, originalParts: 456,
    wholeBlobs: Object.keys(metadata.blobs).length };
}
