import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { samples, counts } from './date-picker-month-year-cases.mjs';

const prefix = 'ant-design-date-picker-month-year-';
const source = '.upstream/artifacts/date-picker-month-year-source-proposal-v1/';
const protocolSHA = '166488b125f669da33f0f270fc4b205f6de830b0fe263ff2be0d9c79754ca4c0';
const authoredNames = ['initialStart', 'initialEnd', 'minDate', 'maxDate',
  'presetA', 'presetB', 'witnessStart', 'witnessEnd'];
const fixture = file => new URL('./fixtures/' + file, import.meta.url);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const metadataBytes = fs.readFileSync(fixture(prefix + 'source-manifest.json'));
assert.equal(sha(metadataBytes), 'a760c79e2083fa958d7cd75350ad52056b047d9a8f6e2f3d2b962ecc7f790bb7');
const metadata = JSON.parse(metadataBytes);
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
assert.equal(metadata.serialization.completeOriginalParts, 816);
assert.equal(metadata.serialization.originalStoredGzipBytesCopiedExactly, true);

export function readMonthYearSourceEvidence(name) {
  const entry = metadata.documents[name];
  assert(entry, 'Unknown original Source evidence document');
  const bytes = fs.readFileSync(fixture(entry.fixture));
  assert.equal(bytes.length, entry.bytes);
  assert.equal(sha(bytes), entry.sha256);
  return bytes;
}
const protocol = JSON.parse(readMonthYearSourceEvidence('protocol-freeze'));
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
export function verifyMonthYearSourcePartBinding(reference, kind, variant = 'first', expectedFile) {
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
export function verifyMonthYearSourceStoredBytes(reference, stored) {
  const { kind, variant } = partScope(reference);
  return decodeStored(verifyMonthYearSourcePartBinding(reference, kind, variant), stored);
}
export function readMonthYearSourcePart(reference) {
  const { kind, variant } = partScope(reference);
  return decode(verifyMonthYearSourcePartBinding(reference, kind, variant));
}
export function verifyMonthYearSourceManifest(value, kind = 'csr', variant = 'first') {
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
    assert.deepEqual(value.counts, { owners: 4, serializations: 8 });
    assert.equal(value.failures, 0);
    const expected = samples.flatMap(sample => ['renderToString', 'renderToStaticMarkup']
      .map(method => ({ id: sample.id, method })));
    assert.equal(value.cases.length, expected.length);
    value.cases.forEach((row, index) => {
      assert.equal(row.id, expected[index].id);
      assert.equal(row.method, expected[index].method);
      verifyMonthYearSourcePartBinding(row, kind, variant,
        file + '.parts/' + row.id + '-' + row.method + '.json');
    });
    return;
  }
  assert.equal(value.browserVersion, protocol.source.environment.chromium);
  assert.deepEqual(value.counts, counts);
  assert.deepEqual(value.errors, []);
  assert.equal(value.fatal, null);
  assert.deepEqual(value.actualCounts, { owners: 4, actions: 160, initialAndSettledPoints: 164,
    declaredEscapeReadsAfter1000: 22, wholeUnmounts: 4, cleanupReads: 4, lateReads: 4,
    rawPointParts: 198, producerParts: 202, producerInvocations: 2224, rawParts: 400 });
  assert.deepEqual(value.cases.map(row => row.id), samples.map(sample => sample.id));
  for (const [index, row] of value.cases.entries()) {
    assert.deepEqual(row.sample, samples[index]);
    assert.equal(row.failure, null);
    assert.equal(row.interruptedAction, null);
    assert.deepEqual(row.observationErrors, []);
    assert.deepEqual(row.network.failures, []);
    assert(row.network.responses.every(response => response.status < 400));
    const bind = (ref, phase) => verifyMonthYearSourcePartBinding(ref, kind, variant,
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
export function readMonthYearSourceManifest(kind = 'csr', variant = 'first') {
  scope(kind, variant);
  const entry = metadata.captures[kind + '-' + variant];
  assert.equal(entry.original.file, scope(kind, variant));
  const value = decode(entry);
  verifyMonthYearSourceManifest(value, kind, variant);
  return value;
}
export function readMonthYearSourceCase(id, variant = 'first') {
  const row = readMonthYearSourceManifest('csr', variant).cases.find(row => row.id === id);
  assert(row, 'Unknown public Source month/year owner');
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
export function verifyMonthYearSourcePoint(point) {
  const sample = samples.find(sample => sample.id === point.owner.id);
  assert(sample);
  assert.equal(point.owner.picker, sample.picker);
  assert.deepEqual(Object.keys(point.owner.authoredDates), authoredNames);
  assert.equal(typeof point.owner.alive, 'boolean');
  assert.equal(typeof point.owner.open, 'boolean');
  assert(Number.isInteger(point.owner.producerCount) && point.owner.producerCount >= 0);
  assert.equal(point.resources.timers, null);
  assert.equal(point.resources.frames, null);
  assert.equal(point.resources.observers, null);
  const arities = { open: 1, change: 2, calendar: 3, 'picker-value': 2, panel: 2, ok: 1 };
  for (const [index, call] of point.owner.callbacks.entries()) {
    assert(Object.hasOwn(arities, call.name));
    assert.equal(call.actualArgumentCount, arities[call.name]);
    assert.deepEqual(call.receiver, { type: 'undefined', isUndefined: true,
      isNull: false, identity: null });
    invocation(call, index, point.owner.authoredDates);
  }
  for (const value of Object.values(point.owner.authoredDates)) {
    dateSnapshot(
      value,
      point.owner.authoredDates
    );
  }
  for (const annotation of point.owner.modelDates) {
    dateSnapshot(annotation.value, point.owner.authoredDates);
    let identity = point.owner.rawModel.root.ref;
    for (const key of annotation.path) {
      identity = property(
        point.owner.rawModel,
        identity,
        String(key)
      ).ref;
    }
    assert.equal(identity, annotation.value.identity, 'Actual owner model date identity');
  }
}
export function readMonthYearSourceInitial(id, variant = 'first') {
  const value = readMonthYearSourcePart(readMonthYearSourceCase(id, variant).initial);
  verifyMonthYearSourcePoint(value);
  return value;
}
export function readMonthYearSourceStep(id, index, variant = 'first') {
  const row = readMonthYearSourceCase(id, variant);
  assert(Number.isInteger(index) && index >= 0 && index < row.steps.length, 'Unknown Source action');
  const value = readMonthYearSourcePart(row.steps[index]);
  assert.equal(value.index, index);
  assert.deepEqual(value.action, row.sample.actions[index]);
  for (const point of [value.before, value.afterCall, value.actual]) verifyMonthYearSourcePoint(point);
  if (value.actionEvidence.afterFocusPointer) verifyMonthYearSourcePoint(value.actionEvidence.afterFocusPointer);
  return value;
}
export function readMonthYearSourceClosed(id, index, variant = 'first') {
  const row = readMonthYearSourceCase(id, variant);
  assert(Number.isInteger(index) && index >= 0 && index < row.closed.length, 'Unknown Source close');
  const value = readMonthYearSourcePart(row.closed[index]);
  const closes = row.sample.actions.flatMap((action, step) => action.type === 'input-escape' ? [step] : []);
  assert.equal(value.actionIndex, closes[index]);
  verifyMonthYearSourcePoint(value.after1000);
  return value;
}
export function readMonthYearSourceCleanup(id, phase = 'cleanup', variant = 'first') {
  assert(['beforeUnmount', 'cleanup', 'late'].includes(phase), 'Unknown Source disposal phase');
  const value = readMonthYearSourcePart(readMonthYearSourceCase(id, variant)[phase]);
  verifyMonthYearSourcePoint(value);
  return value;
}
export function readMonthYearSourceProducerChunks(id, variant = 'first') {
  return readMonthYearSourceCase(id, variant).producerParts;
}
export function verifyMonthYearSourceProducerChunk(value, envelope) {
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
    assert.equal(typeof call.returned, 'boolean');
    invocation(call, value.cursor + index);
  }
}
export function readMonthYearSourceProducerChunk(id, index, variant = 'first') {
  const chunks = readMonthYearSourceProducerChunks(id, variant);
  assert(
    Number.isInteger(index) && index >= 0 && index < chunks.length,
    'Unknown Source producer chunk'
  );
  const value = readMonthYearSourcePart(chunks[index]);
  verifyMonthYearSourceProducerChunk(value, chunks[index]);
  return value;
}
export function readMonthYearSourceSSR(id, method, variant = 'first') {
  const reference = readMonthYearSourceManifest('ssr', variant).cases
    .find(row => row.id === id && row.method === method);
  assert(reference, 'Unknown Source owner or real SSR serializer');
  const value = readMonthYearSourcePart(reference);
  assert.equal(value.fatal, null);
  assert.equal(value.domFree, true);
  assert.equal(value.initialClosedOnly, true);
  assert.equal(sha(Buffer.from(value.rawHtml)), value.htmlSha256);
  assert(Object.values(value.resources).every(count => count === 0));
  assert(Object.values(value.refs).every(Boolean));
  assert.equal(value.state.owner.open, false);
  return value;
}
export function verifyMonthYearSourceStoredParts() {
  for (const [file, blob] of Object.entries(metadata.blobs)) {
    const stored = fs.readFileSync(fixture(file));
    assert.equal(stored.length, blob.bytes);
    assert.equal(sha(stored), blob.sha256);
    const bytes = gunzipSync(stored);
    assert.equal(bytes.length, blob.rawBytes);
    assert.equal(sha(bytes), blob.rawSHA256);
  }
  for (const name of Object.keys(metadata.documents)) readMonthYearSourceEvidence(name);
  return { sourceOnly: true, captures: 4, originalParts: 816,
    wholeBlobs: Object.keys(metadata.blobs).length };
}
