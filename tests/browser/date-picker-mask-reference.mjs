import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { samples, counts, storage, expandAction } from './date-picker-mask-cases.mjs';

const prefix = 'ant-design-date-picker-mask-';
const source = '.upstream/artifacts/date-picker-mask-source-proposal-v1/';
const protocolSHA = '18caf577d37c657652640b13f22292e052e914a435c4ad38627f6b231df790fe';
const authoredNames = ['initialStart', 'initialEnd'];
// Allows the path to a local image relative to the module. Current working directory does not
// affect the result.
const fixture = file => new URL('./fixtures/' + file, import.meta.url);
// Returns SHA-256 in hexadecimal form for the reconciliation of the recorded data.
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = fs.readFileSync(fixture(prefix + 'source-manifest.json'));
assert.equal(sha(bytes), '9e8a052085e1e8a57320a3e1ce05d98afbd06e354e21de2cb9b60209a2daa8da');
const metadata = JSON.parse(bytes);
assert.equal(metadata.format, 'ant-design-public-date-picker-numeric-mask-source-v1');
assert.equal(metadata.sourceOnly, true);
assert.equal(metadata.NativeDataUsed, false);
assert.equal(metadata.sourceProtocolSHA256, protocolSHA);
assert.deepEqual(metadata.counts, counts);
assert.deepEqual(metadata.storage, storage);
for (const key of ['rawFieldsDropped', 'rawFieldsRewritten', 'normalizedFields'])
  assert.deepEqual(metadata.serialization[key], []);
assert.equal(metadata.serialization.IDsRenumbered, false);
assert.equal(metadata.serialization.oneCompletePartAtATime, true);
assert.equal(metadata.serialization.wholeCorpusCache, false);
assert.equal(metadata.serialization.originalStoredGzipBytesCopiedExactly, true);
assert.equal(metadata.serialization.completeOriginalParts, 1618);
assert.equal(metadata.serialization.completeOriginalManifests, 4);
assert.equal(Object.keys(metadata.parts).length, 1618);

// Reads one capture document and checks the original size and hash before returning bytes.
export function readMaskSourceEvidence(name) {
  const entry = metadata.documents[name];
  assert(entry, 'Unknown Source evidence document');
  const stored = fs.readFileSync(fixture(entry.fixture));
  assert.equal(stored.length, entry.storedBytes);
  assert.equal(sha(stored), entry.storedSHA256);
  const raw = entry.storage === 'gzip-derived-index' ? gunzipSync(stored) : stored;
  assert.equal(raw.length, entry.bytes);
  assert.equal(sha(raw), entry.sha256);
  return raw;
}
const protocol = JSON.parse(readMaskSourceEvidence('protocol-freeze'));
assert.equal(metadata.documents['protocol-freeze'].sha256, protocolSHA);
assert.equal(protocol.source.version, '6.6.8');
assert.equal(protocol.source.react, '18.3.1');
assert.equal(protocol.source.rcPicker, '1.12.2');
assert.deepEqual(protocol.samples, samples);
assert.deepEqual(protocol.counts, counts);
assert.deepEqual(protocol.storage, storage);
for (const entry of [metadata.sharedCases, metadata.sharedSchema]) {
  const fixtureUrl = new URL('./' + entry.file, import.meta.url);
  const raw = fs.readFileSync(fixtureUrl);
  assert.equal(raw.length, entry.bytes);
  assert.equal(sha(raw), entry.sha256);
}
assert.equal(metadata.sharedCases.sha256, protocol.inputPins[source + 'cases.mjs'].sha256);
const release = JSON.parse(readMaskSourceEvidence('release'));
assert.equal(release.status, 'released');
assert.equal(release.sourceProtocolSHA256, protocolSHA);
assert.equal(release.rootLease, protocol.rootLease);
assert.equal(release.sourceInputPinsUnchangedAtRelease, true);
assert.equal(release.priorSourceMetadataPinsUnchanged, true);
assert.equal(release.NativeDataRead, false);
assert.deepEqual(release.rawMutations, []);
assert.deepEqual(release.runs.map(run => [run.kind, run.variant]),
  [['csr', 'first'], ['csr', 'repeat'], ['ssr', 'first'], ['ssr', 'repeat']]);
for (const run of release.runs) {
  const original = metadata.captures[run.kind + '-' + run.variant].original;
  for (const key of ['file', 'bytes', 'sha256', 'gzipFile', 'gzipBytes', 'gzipSHA256'])
    assert.deepEqual(original[key], run[key]);
  assert.equal(run.actualExitCode, 0);
  assert.equal(run.terminalPinsUnchanged, true);
}
// Defines the original manifest separately for CSR and SSR and for each independent running.
function scope(kind, variant) {
  assert(['csr', 'ssr'].includes(kind), 'Unknown Source capture kind');
  assert(['first', 'repeat'].includes(variant), 'Unknown Source capture variant');
  return source + kind + '-source-' + variant + '.json';
}
// Checks the dimensions and hashes of compressed and original bytes. Unpacking takes place between
// these checks.
function decodeStored(entry, stored) {
  const original = entry.original;
  assert.equal(entry.originalStoredGzipBytesCopiedExactly, true);
  assert.equal(entry.fixture, prefix + 'parts/' + original.gzipSHA256 + '.json.gz');
  assert.equal(stored.length, original.gzipBytes);
  assert.equal(sha(stored), original.gzipSHA256);
  const raw = gunzipSync(stored);
  assert.equal(raw.length, original.bytes);
  assert.equal(sha(raw), original.sha256);
  return raw;
}
// Readers one part and disassembles JSON after the reconciliation with the original record of the manifesto.
function decode(entry) {
  return JSON.parse(decodeStored(entry, fs.readFileSync(fixture(entry.fixture))));
}
// Verifies the binding of the part to a specific run and the initial metadata. In a given way, the
// action slot also checks.
export function verifyMaskSourcePartBinding(reference, kind, variant = 'first', expectedFile) {
  const original = reference.rawJSONPart ?? reference;
  assert(original.file.startsWith(scope(kind, variant) + '.parts/'), 'Original capture binding');
  assert.equal(original.gzipFile, original.file + '.gz');
  if (expectedFile !== undefined) {
    assert.equal(
      original.file,
      expectedFile,
      'Original owner/action/substep slot binding'
    );
  }
  const entry = metadata.parts[original.file];
  assert(entry, 'Missing original Source whole part');
  assert.deepEqual(entry.original, original);
  return entry;
}
// Finds a run that owns the original part of the fixed file name.
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
// Checks the transmitted compressed bytes with the recording of the original run before unpacking.
export function verifyMaskSourceStoredBytes(reference, stored) {
  const { kind, variant } = partScope(reference);
  return decodeStored(verifyMaskSourcePartBinding(reference, kind, variant), stored);
}
// Selects a binding on the capture link and reads one verified part.
export function readMaskSourcePart(reference) {
  const { kind, variant } = partScope(reference);
  return decode(verifyMaskSourcePartBinding(reference, kind, variant));
}
export function verifyMaskSourceManifest(value, kind = 'csr', variant = 'first') {
  const file = scope(kind, variant);
  assert.equal(value.status, 'complete');
  assert.equal(value.variant, variant);
  assert.deepEqual(value.sourceProtocol, { file: source + 'protocol-freeze.json', sha256: protocolSHA,
    reviewedProposalSHA256: protocol.reviewedProposalSHA256, rootLease: protocol.rootLease });
  assert.deepEqual(value.terminalInputVerification, { unchanged: true, sha256: protocolSHA });
  assert.deepEqual(value.diagnostics, []);
  if (kind === 'ssr') {
    assert.deepEqual(value.counts, { owners: 5, serializations: 30 });
    assert.equal(value.failures, 0);
    const expected = samples.flatMap(sample => ['string', 'object', 'mask'].flatMap(formatProfile =>
      ['renderToString', 'renderToStaticMarkup'].map(method => ({
        id: sample.id,
        formatProfile,
        method
      }))));
    assert.equal(value.cases.length, expected.length);
    value.cases.forEach((row, index) => {
      for (const key of ['id', 'formatProfile', 'method']) {
        assert.equal(
          row[key],
          expected[index][key]
        );
      }
      verifyMaskSourcePartBinding(row, kind, variant, file + '.parts/' + row.id + '-'
        + row.formatProfile + '-' + row.method + '.json');
    });
    return;
  }
  assert.equal(value.browserVersion, protocol.source.environment.chromium);
  assert.deepEqual(value.counts, counts);
  assert.deepEqual(value.storage, storage);
  assert.deepEqual(value.actualCounts, metadata.captureCounts['csr-' + variant]);
  assert.deepEqual(value.errors, []);
  assert.equal(value.fatal, null);
  assert.deepEqual(value.cases.map(row => row.id), samples.map(sample => sample.id));
  assert.equal(
    value.cases.reduce((sum, row) => sum + row.producerFinalCount, 0),
    value.actualCounts.producerInvocations
  );
  for (const [index, row] of value.cases.entries()) {
    const sample = samples[index];
    assert.deepEqual(row.sample, sample);
    for (const key of ['failure', 'interruptedAction', 'interruptedSubstep']) {
      assert.equal(
        row[key],
        null
      );
    }
    assert.deepEqual(row.observationErrors, []);
    assert.deepEqual(row.network.failures, []);
    assert(row.network.responses.every(response => response.status < 400));
    // Binds the part to the specific owner and the phase of action in the original run.
    const bind = (ref, phase) => verifyMaskSourcePartBinding(ref, kind, variant,
      file + '.parts/' + row.id + '-' + phase + '.json');
    bind(row.initial, 'initial');
    assert.equal(row.steps.length, sample.actions.length);
    const producerPhases = ['initial'], closes = [], expectedChildren = [];
    row.steps.forEach((ref, step) => {
      bind(ref, 'step-' + step);
      expandAction(sample.actions[step]).forEach((command, substepIndex) => {
        expectedChildren.push({ actionIndex: step, substepIndex, command });
        producerPhases.push('step-' + step + '-substep-' + substepIndex);
      });
      producerPhases.push('step-' + step);
      if (sample.actions[step].type === 'input-escape') {
        closes.push(step);
        producerPhases.push('closed-' + step);
      }
    });
    assert.equal(row.substeps.length, expectedChildren.length);
    row.substeps.forEach((ref, index) => {
      const expected = expectedChildren[index];
      for (const key of ['actionIndex', 'substepIndex', 'command']) {
        assert.deepEqual(
          ref[key],
          expected[key]
        );
      }
      bind(ref, 'step-' + ref.actionIndex + '-substep-' + ref.substepIndex);
    });
    assert.equal(row.closed.length, closes.length);
    row.closed.forEach((ref, index) => bind(ref, 'closed-' + closes[index]));
    for (const [field, phase] of [['beforeUnmount', 'before-unmount'], ['cleanup', 'cleanup'], ['late', 'late']]) {
      bind(row[field], phase);
      producerPhases.push(phase);
    }
    producerPhases.push('terminal-tail');
    assert.deepEqual(row.producerParts.map(row => row.phase), producerPhases);
    let cursor = 0;
    for (const ref of row.producerParts) {
      bind(ref, ref.phase + '-producers');
      assert.equal(ref.cursor, cursor);
      assert(Number.isInteger(ref.next) && ref.next >= cursor);
      cursor = ref.next;
    }
    assert.equal(cursor, row.producerFinalCount);
  }
}
export function readMaskSourceManifest(kind = 'csr', variant = 'first') {
  const file = scope(kind, variant), entry = metadata.captures[kind + '-' + variant];
  assert.equal(entry.original.file, file);
  const value = decode(entry);
  verifyMaskSourceManifest(value, kind, variant);
  return value;
}
export function readMaskSourceCase(id, variant = 'first') {
  const row = readMaskSourceManifest('csr', variant).cases.find(row => row.id === id);
  assert(row, 'Unknown Source owner');
  return row;
}
// Seeks the source object by identifier. The no-object link interrupts the image check.
function rawNode(graph, identity) {
  const node = graph.objects.find(node => node.id === identity);
  assert(node, 'Missing original raw identity');
  return node;
}
function property(graph, identity, key) {
  const found = rawNode(graph, identity).properties?.find(row => row.key === key);
  assert(found && Object.hasOwn(found, 'value'), 'Missing original data property');
  return found.value;
}
function rawAt(graph, path) {
  let result = graph.root;
  for (const key of path) result = property(graph, result.ref, String(key));
  return result;
}
// Conserves fields and dates with the original graph and bindings to the transmitted values.
function dateSnapshot(value, authored) {
  assert.equal(value.raw.root.ref, value.identity);
  assert.equal(typeof value.temporal.valid, 'boolean');
  assert.equal(value.temporal.fields.length, 7);
  for (const [index, key] of ['$y', '$M', '$D', '$H', '$m', '$s', '$ms'].entries()) {
    const field = property(value.raw, value.identity, key);
    if (field && typeof field === 'object' && field.$ === 'number') {
      assert.equal(
        value.temporal.fields[index],
        null
      );
    }
    else {
      assert.deepEqual(value.temporal.fields[index], field);
    }
  }
  assert.equal(property(value.raw, value.identity, '$L'), value.temporal.locale);
  if (value.temporal.valid) {
    const date = new Date(value.temporal.epoch);
    assert.equal(
      date.toISOString(),
      value.temporal.iso
    );
  }
  else {
    assert.equal(value.temporal.iso, null);
  }
  assert.deepEqual(Object.keys(value.sameAsAuthored), authoredNames);
  for (const name of authoredNames) {
    assert.equal(value.sameAsAuthored[name], authored
      ? value.identity === authored[name].identity : rawNode(value.raw, value.identity).authoredRole?.authoredDate === name);
  }
}
function invocation(call, index, authored, producer = false) {
  assert.equal(call.index, index);
  assert(Number.isInteger(call.actionIndex) && call.actionIndex >= -1);
  assert(Number.isInteger(call.substepIndex) && call.substepIndex >= -1);
  const matchingProperty = call.encodedArguments.properties.find(row => row.key === 'length');
  const length = matchingProperty?.value;
  assert(Number.isInteger(length) && length >= 0);
  assert.equal(call.actualArgumentCount, length);
  assert.equal(rawAt(call.rawArguments, ['length']), length);
  for (const annotation of call.dates) {
    dateSnapshot(annotation.value, authored);
    assert.equal(rawAt(call.rawArguments, annotation.path).ref, annotation.value.identity);
  }
  assert.equal(call.receiver.isUndefined, call.receiver.type === 'undefined');
  if (producer) {
    assert(['disabledDate', 'disabledTime'].includes(call.name));
    if (call.name === 'disabledDate') {
      assert.equal(call.returned, false);
      assert.equal(call.rawReturned.root, false);
      assert.equal(call.returnedIdentity, null);
    }
    else {
      assert.equal(call.rawReturned.root.ref, call.returnedIdentity);
      const node = rawNode(call.rawReturned, call.returnedIdentity);
      assert.deepEqual(node.authoredRole, { authoredTimeRestrictions: true });
      assert.deepEqual(node.properties, []);
      assert.deepEqual(node.ownProperties, []);
      assert.deepEqual(call.returned, { $: 'authored', role: { authoredTimeRestrictions: true } });
    }
  }
}
function verifyOwner(owner) {
  const sample = samples.find(sample => sample.id === owner.id);
  assert(sample);
  assert.equal(owner.kind, sample.kind);
  assert.equal(owner.family, sample.family);
  assert.equal(owner.picker, sample.family === 'time' ? 'time' : 'date');
  assert.equal(typeof owner.open, 'boolean');
  assert.equal(typeof owner.alive, 'boolean');
  assert(Number.isInteger(owner.actionIndex) && owner.actionIndex >= -1 && owner.actionIndex < sample.actions.length);
  assert(Number.isInteger(owner.substepIndex) && owner.substepIndex >= -1);
  assert(Number.isInteger(owner.producerCount) && owner.producerCount >= 0);
  assert.deepEqual(Object.keys(owner.authoredDates), authoredNames);
  for (const value of Object.values(owner.authoredDates)) dateSnapshot(value, owner.authoredDates);
  for (const annotation of owner.modelDates) {
    dateSnapshot(annotation.value, owner.authoredDates);
    assert.equal(rawAt(owner.rawModel, annotation.path).ref, annotation.value.identity);
  }
  const format = owner.formatValue;
  assert(['string', 'object', 'mask'].includes(owner.formatProfile));
  if (owner.formatProfile === 'string') {
    assert.equal(format.type, 'string');
    assert.equal(format.identity, null);
    assert.equal(format.raw.root, sample.plainFormat);
  }
  else {
    assert.equal(format.type, 'object');
    assert.equal(format.raw.root.ref, format.identity);
    assert.deepEqual(
      rawNode(format.raw, format.identity).authoredRole,
      { authoredFormat: owner.formatProfile }
    );
    assert.equal(
      property(format.raw, format.identity, 'format'),
      owner.formatProfile === 'mask' ? sample.maskFormat : sample.plainFormat
    );
    if (owner.formatProfile === 'mask') {
      assert.equal(
        property(format.raw, format.identity, 'type'),
        'mask'
      );
    }
  }
  assert.deepEqual(rawAt(owner.rawAuthoredProps, ['format']), format.raw.root);
  assert.deepEqual(rawAt(owner.rawAuthoredProps, ['value']), owner.rawModel.root);
  owner.callbacks.forEach((call, index) => {
    assert(['change', 'open', 'calendar', 'picker-value', 'panel', 'ok', 'clear'].includes(call.name));
    invocation(call, index, owner.authoredDates);
  });
}
export function verifyMaskSourceRows(point) {
  // Looking for an attribute by name. The missing attribute remains null to compare images.
  const attr = (node, key) => node.attributes.find(([name]) => name === key)?.[1] ?? null;
  const has = (node, name) => (attr(node, 'class') ?? '').split(/\s+/).includes(name);
  for (const popup of point.popups) {
    const cells = new Map();
    for (const table of popup.tables) {
      // The unchanged scoped reader names every .ant-picker-content surface "tables".
      // Time content is an actual DIV with no queried TR/TH/TD rows, retained verbatim.
      assert(['TABLE', 'DIV'].includes(table.surface.tag));
      if (table.surface.tag === 'DIV') {
        assert.deepEqual(table.headers, []);
        assert.deepEqual(table.rows, []);
      }
      for (const header of table.headers) {
        assert.equal(header.surface.tag, 'TR');
        for (const cell of header.cells) {
          assert.equal(cell.surface.tag, 'TH');
          assert.equal(cell.surface.parentIdentity, header.surface.identity);
        }
      }
      for (const row of table.rows) {
        assert.equal(row.surface.tag, 'TR');
        for (const [flag, name] of [['selected', 'selected'], ['hover', 'hover'], ['rangeStart', 'range-start'],
          ['rangeEnd', 'range-end'], ['rangeHover', 'range-hover']]) {
          assert.equal(row[flag], has(row.surface, 'ant-picker-week-panel-row-' + name));
        }
        for (const cell of row.cells) {
          assert.equal(cell.surface.tag, 'TD');
          assert.equal(cell.surface.parentIdentity, row.surface.identity);
          assert.equal(cell.title, attr(cell.surface, 'title'));
          assert.equal(cell.weekNumber, has(cell.surface, 'ant-picker-cell-week'));
          assert.equal(cell.disabled, has(cell.surface, 'ant-picker-cell-disabled'));
          assert(!cells.has(cell.surface.identity));
          cells.set(cell.surface.identity, { row, cell });
        }
      }
    }
    for (const cell of popup.dateCells) {
      const binding = cells.get(cell.surface.identity);
      assert(binding);
      assert.equal(cell.rowIdentity, binding.row.surface.identity);
      for (const key of ['title', 'weekNumber', 'disabled']) {
        assert.deepEqual(
          cell[key],
          binding.cell[key]
        );
      }
      assert(popup.panels.some(panel => panel.identity === cell.panelIdentity));
      for (const [flag, name] of [['selected', 'selected'], ['rangeStart', 'range-start'],
        ['rangeEnd', 'range-end'], ['inRange', 'in-range']]) {
        assert.equal(cell[flag], has(cell.surface, 'ant-picker-cell-' + name));
      }
    }
  }
}
export function verifyMaskSourcePoint(point) {
  verifyOwner(point.owner);
  verifyMaskSourceRows(point);
  for (const input of point.inputs) {
    assert.equal(input.tag, 'INPUT');
    assert.equal(typeof input.value, 'string');
    assert.equal(typeof input.defaultValue, 'string');
    assert.equal(typeof input.focused, 'boolean');
    assert.equal(input.focused, input.identity === point.focus?.identity);
    for (const caret of [input.selectionStart, input.selectionEnd])
      assert(caret === null || Number.isInteger(caret) && caret >= 0 && caret <= input.value.length);
  }
  for (const event of point.events) {
    assert.equal(typeof event.isTrusted, 'boolean');
    assert.equal(event.phase, 'document-capture-before-target-handler');
    assert([1, 2].includes(event.eventPhase));
    assert(Number.isFinite(event.timeStamp));
    assert(event.producerCursorAtCapture <= point.owner.producerCount);
    assert(event.callbackCountAtCapture <= point.owner.callbacks.length);
  }
}
export function verifyMaskSourceSubstep(value, id, index, substepIndex) {
  const sample = samples.find(sample => sample.id === id);
  assert(sample);
  const command = expandAction(sample.actions[index])[substepIndex];
  assert(command);
  assert.equal(value.index, index);
  assert.equal(value.substepIndex, substepIndex);
  assert.deepEqual(value.command, command);
  for (const field of ['before', 'afterCall', 'actual']) {
    verifyMaskSourcePoint(value[field]);
    assert.equal(value[field].owner.id, id);
    assert.equal(value[field].owner.actionIndex, index);
    assert.equal(value[field].owner.substepIndex, substepIndex);
  }
  for (const [a, b] of [['before', 'afterCall'], ['afterCall', 'actual']]) {
    assert.deepEqual(
      value[b].owner.callbacks.slice(0, value[a].owner.callbacks.length),
      value[a].owner.callbacks
    );
    assert.deepEqual(value[b].events.slice(0, value[a].events.length), value[a].events);
    assert(value[b].owner.producerCount >= value[a].owner.producerCount);
  }
}
export function verifyMaskSourceStep(value, id, index, variant = 'first') {
  const row = readMaskSourceCase(id, variant);
  assert(row.sample.actions[index]);
  assert.equal(value.scope, 'macro');
  assert.equal(value.index, index);
  assert.deepEqual(value.action, row.sample.actions[index]);
  const expected = row.substeps.filter(ref => ref.actionIndex === index);
  assert.equal(value.substeps.length, expected.length);
  value.substeps.forEach((ref, j) => assert.deepEqual(ref.rawJSONPart, expected[j].rawJSONPart));
  assert.deepEqual(value.afterCallSource, { substep: value.substeps.at(-1), field: 'afterCall' });
  const last = readMaskSourcePart(value.substeps.at(-1));
  assert.deepEqual(
    value.afterCall,
    last.afterCall,
    'Macro afterCall retains the exact original final child immediate snapshot'
  );
  for (const field of ['before', 'afterCall', 'actual']) {
    verifyMaskSourcePoint(value[field]);
    assert.equal(value[field].owner.id, id);
    assert.equal(value[field].owner.actionIndex, index);
  }
  assert.equal(value.actual.owner.substepIndex, -1);
}
export function readMaskSourceInitial(id, variant = 'first') {
  const value = readMaskSourcePart(readMaskSourceCase(id, variant).initial);
  verifyMaskSourcePoint(value);
  return value;
}
export function readMaskSourceStep(id, index, variant = 'first') {
  const row = readMaskSourceCase(id, variant);
  assert(row.steps[index]);
  const value = readMaskSourcePart(row.steps[index]);
  verifyMaskSourceStep(value, id, index, variant);
  return value;
}
export function readMaskSourceSubstep(id, index, substepIndex, variant = 'first') {
  const ref = readMaskSourceCase(id, variant).substeps.find(row => row.actionIndex === index && row.substepIndex === substepIndex);
  assert(ref, 'Unknown original Source substep');
  const value = readMaskSourcePart(ref);
  verifyMaskSourceSubstep(value, id, index, substepIndex);
  return value;
}
export function readMaskSourceClosed(id, index, variant = 'first') {
  const row = readMaskSourceCase(id, variant);
  assert(Number.isInteger(index) && index >= 0 && row.closed[index]);
  const actionIndex = row.sample.actions.flatMap((action, actionIndex) => action.type === 'input-escape' ? [actionIndex] : [])[index];
  const value = readMaskSourcePart(row.closed[index]);
  assert.equal(value.actionIndex, actionIndex);
  verifyMaskSourcePoint(value.after1000);
  return value;
}
export function readMaskSourceCleanup(id, phase = 'cleanup', variant = 'first') {
  assert(['beforeUnmount', 'cleanup', 'late'].includes(phase));
  const value = readMaskSourcePart(readMaskSourceCase(id, variant)[phase]);
  verifyMaskSourcePoint(value);
  return value;
}
export function readMaskSourceProducerChunks(id, variant = 'first') {
  return readMaskSourceCase(id, variant).producerParts;
}
export function verifyMaskSourceProducerChunk(value, envelope) {
  if (envelope) {
    for (const key of ['phase', 'cursor', 'next']) {
      assert.deepEqual(
        value[key],
        envelope[key]
      );
    }
  }
  assert(['local-substep-or-lifecycle-window', 'aggregate-macro-window-covering-earlier-child-parts'].includes(value.boundaryScope));
  assert(Number.isInteger(value.cursor) && value.cursor >= 0);
  assert.equal(value.next - value.cursor, value.rows.length);
  assert.equal(value.observationEnd, value.next);
  for (const count of Object.values(value.boundaries)) {
    assert(Number.isInteger(count) && count >= 0 && count <= value.next);
    if (value.boundaryScope === 'local-substep-or-lifecycle-window') assert(count >= value.cursor);
  }
  value.rows.forEach((call, index) => invocation(call, value.cursor + index, undefined, true));
}
export function readMaskSourceProducerChunk(id, index, variant = 'first') {
  const ref = readMaskSourceProducerChunks(id, variant)[index];
  assert(ref);
  const value = readMaskSourcePart(ref);
  verifyMaskSourceProducerChunk(value, ref);
  return value;
}
export function verifyMaskSourceSSR(value, id, formatProfile, method) {
  assert(samples.some(sample => sample.id === id));
  assert(['string', 'object', 'mask'].includes(formatProfile));
  assert(['renderToString', 'renderToStaticMarkup'].includes(method));
  assert.equal(value.formatProfile, formatProfile);
  assert.equal(value.method, method);
  assert.equal(value.initialClosedOnly, true);
  assert.equal(value.domFree, true);
  assert.equal(value.fatal, null);
  assert(Object.values(value.refs).every(Boolean));
  assert(Object.values(value.resources).every(count => count === 0));
  assert.equal(sha(value.rawHtml), value.htmlSha256);
  verifyOwner(value.state.owner);
  assert.equal(value.state.owner.id, id);
  assert.equal(value.state.owner.formatProfile, formatProfile);
  assert.equal(value.state.owner.open, false);
  assert.equal(value.state.owner.alive, false);
  assert.equal(value.state.producers.cursor, 0);
  assert.equal(value.state.producers.next, value.state.producers.rows.length);
  assert.equal(value.state.owner.producerCount, value.state.producers.next);
  value.state.producers.rows.forEach((call, index) => invocation(
    call,
    index,
    value.state.owner.authoredDates,
    true
  ));
  assert(Number.isFinite(value.environment.dateNow));
}
export function readMaskSourceSSR(id, formatProfile, method, variant = 'first') {
  const row = readMaskSourceManifest('ssr', variant).cases.find(row => row.id === id
    && row.formatProfile === formatProfile && row.method === method);
  assert(row, 'Unknown initial closed Source SSR profile');
  const value = readMaskSourcePart(row);
  verifyMaskSourceSSR(value, id, formatProfile, method);
  return value;
}
export function verifyMaskSourceStoredParts() {
  for (const entry of [...Object.values(metadata.captures), ...Object.values(metadata.parts)])
    decodeStored(entry, fs.readFileSync(fixture(entry.fixture)));
  for (const name of Object.keys(metadata.documents)) readMaskSourceEvidence(name);
  for (const kind of ['csr', 'ssr']) {
    for (const variant of ['first', 'repeat']) {
      readMaskSourceManifest(
        kind,
        variant
      );
    }
  }
  return {
    sourceOnly: true,
    captures: 4,
    originalParts: 1618,
    wholeBlobs: Object.keys(metadata.blobs).length
  };
}
