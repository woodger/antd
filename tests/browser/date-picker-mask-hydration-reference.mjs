import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';

const prefix = 'ant-design-date-picker-mask-hydration-';
const fixture = file => new URL('./fixtures/' + file, import.meta.url);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const metadataBytes = fs.readFileSync(fixture(prefix + 'source-manifest.json'));
assert.equal(sha(metadataBytes), 'be9f73aecbcd370e59dc34afb300cfa0924f4cf99ec8fc3c9f3119a372665486');
const metadata = JSON.parse(metadataBytes);
assert.equal(metadata.format, 'ant-design-public-date-picker-mask-initial-hydration-source-v1');
assert.equal(metadata.sourceOnly, true);
assert.equal(metadata.NativeDataUsed, false);
assert.equal(metadata.serialization.originalStoredGzipBytesCopiedExactly, true);
assert.equal(metadata.serialization.IDsRenumbered, false);
for (const field of ['rawFieldsDropped', 'rawFieldsRewritten', 'normalizedFields'])
  assert.deepEqual(metadata.serialization[field], []);
assert.equal(metadata.profiles.length, 30);

export function readMaskHydrationSourceManifest() { return structuredClone(metadata); }
export function readMaskHydrationSourceEvidence(name) {
  const entry = metadata.documents[name];
  assert(entry, 'Unknown hydration Source evidence');
  const bytes = fs.readFileSync(fixture(entry.fixture));
  assert.equal(bytes.length, entry.bytes);
  assert.equal(sha(bytes), entry.sha256);
  return bytes;
}
const freezeBytes = readMaskHydrationSourceEvidence('protocol-freeze');
assert.equal(sha(freezeBytes), metadata.sourceProtocolSHA256);
const protocol = JSON.parse(freezeBytes);
assert.equal(protocol.status, 'Root-reviewed-frozen-before-mask-React-hydration-observation');
assert.equal(protocol.reviewedProposalSHA256, metadata.documents['protocol-proposal'].sha256);
assert.equal(protocol.rootLease, metadata.rootLease);
assert.deepEqual(
  JSON.parse(readMaskHydrationSourceEvidence('protocol-proposal')),
  protocol.proposal
);
assert.deepEqual(metadata.phases, protocol.proposal.phases);
assert.equal(protocol.proposal.counts.profilesPerRun, 15);
for (const name of ['capture', 'protocol', 'plan']) {
  const entry = metadata.documents[name];
  assert.deepEqual(
    { bytes: entry.bytes, sha256: entry.sha256 },
    protocol.proposal.inputPins[entry.originalFile]
  );
}
const factory = metadata.documents['source-factory'];
assert.deepEqual({ bytes: factory.bytes, sha256: factory.sha256 },
  protocol.proposal.preservedOriginalPins[factory.originalFile]);
readMaskHydrationSourceEvidence('source-factory');
const release = JSON.parse(readMaskHydrationSourceEvidence('release'));
assert.equal(release.status, 'released');
assert.equal(release.freeze.sha256, metadata.sourceProtocolSHA256);
assert.equal(release.rootLease, metadata.rootLease);
assert.equal(release.unchanged, true);
assert.deepEqual(release.runs.map(row => row.operation), ['first', 'repeat']);
for (const run of release.runs) {
  assert.equal(run.actualExitCode, 0);
  assert.equal(run.terminalObserved, true);
  const manifest = release.manifests.find(row => row.variant === run.operation);
  assert.equal(manifest.sha256, metadata.documents['capture-' + run.operation].sha256);
  assert.equal(manifest.browserCloseAwaited, true);
}

function profileEntry(id, formatProfile, variant) {
  assert(['first', 'repeat'].includes(variant), 'Unknown hydration Source run');
  assert(['string', 'object', 'mask'].includes(formatProfile), 'Unknown initial format profile');
  const entry = metadata.profiles.find(row => row.id === id && row.formatProfile === formatProfile && row.variant === variant);
  assert(entry, 'Unknown hydration Source owner/profile');
  return entry;
}
export function verifyMaskHydrationSourcePoint(value, phase) {
  assert(value && typeof value === 'object');
  assert(metadata.phases.includes(value.phase));
  if (phase !== undefined) assert.equal(value.phase, phase);
  assert(Array.isArray(value.inputs) && Array.isArray(value.retainedParsedInputs));
  for (const input of [...value.inputs, ...value.retainedParsedInputs]) {
    for (const key of ['identity', 'id', 'type', 'value', 'defaultValue', 'outerHTML'])
      assert.equal(typeof input[key], 'string', key);
    for (const key of ['selectionStart', 'selectionEnd'])
      assert(input[key] === null || Number.isSafeInteger(input[key]), key);
    assert(input.selectionDirection === null || ['forward', 'backward', 'none'].includes(input.selectionDirection));
    assert.equal(typeof input.focused, 'boolean');
    assert.equal(typeof input.connected, 'boolean');
    assert(input.valueAttribute === null || typeof input.valueAttribute === 'string');
    assert(input.attributes && typeof input.attributes === 'object');
  }
  assert(value.nodes && value.nodes.sameParsed && Array.isArray(value.nodes.sameParsed.inputs));
  assert(Array.isArray(value.events) && Array.isArray(value.recoverableErrors));
  if (value.source !== null) {
    const { owner, producers } = value.source;
    assert(owner && owner.rawModel && owner.authoredDates && Array.isArray(owner.callbacks));
    assert.equal(producers.cursor, 0);
    assert.equal(producers.rows.length, producers.next);
    assert.equal(owner.producerCount, producers.next);
    producers.rows.forEach((call, index) => {
      assert.equal(call.index, index);
      assert.equal(call.actionIndex, -1);
      assert.equal(call.substepIndex, -1);
      assert(Number.isSafeInteger(call.actualArgumentCount));
      assert(call.rawArguments && Object.hasOwn(call, 'rawReturned') && Array.isArray(call.dates));
    });
  }
}
export function readMaskHydrationSourceProfile(id, formatProfile, variant = 'first') {
  const entry = profileEntry(id, formatProfile, variant), original = entry.original;
  assert.equal(entry.fixture, prefix + 'parts/' + original.gzipSHA256 + '.json.gz');
  const stored = fs.readFileSync(fixture(entry.fixture));
  assert.equal(stored.length, original.gzipBytes);
  assert.equal(sha(stored), original.gzipSHA256);
  const bytes = gunzipSync(stored);
  assert.equal(bytes.length, original.bytes);
  assert.equal(sha(bytes), original.sha256);
  const value = JSON.parse(bytes);
  assert.equal(value.id, id);
  assert.equal(value.formatProfile, formatProfile);
  assert.equal(value.failure, null);
  assert.equal(value.contextCloseAwaited, true);
  assert.deepEqual(value.observations.map(point => point.phase), metadata.phases);
  assert.deepEqual(value.sourceSSR, entry.sourceSSR);
  const authored = protocol.proposal.profiles.find(row => row.id === id && row.formatProfile === formatProfile);
  assert.deepEqual(value.sourceSSR, authored.sourceSSR);
  assert.equal(value.originalSourceHTML.sha256, entry.originalHTMLSHA256);
  assert.equal(sha(Buffer.from(value.originalSourceHTML.value)), entry.originalHTMLSHA256);
  value.observations.forEach(point => verifyMaskHydrationSourcePoint(point));
  return value;
}
export function readMaskHydrationSourcePoint(id, formatProfile, phase, variant = 'first') {
  assert(metadata.phases.includes(phase), 'Unknown hydration Source observation phase');
  return readMaskHydrationSourceProfile(id, formatProfile, variant).observations.find(point => point.phase === phase);
}
export function readMaskHydrationSourceCapture(variant = 'first') {
  assert(['first', 'repeat'].includes(variant));
  const capture = JSON.parse(readMaskHydrationSourceEvidence('capture-' + variant));
  assert.equal(capture.status, 'complete');
  assert.equal(capture.variant, variant);
  assert.equal(capture.cases.length, 15);
  assert.equal(capture.counts.snapshots, 135);
  assert.equal(capture.lifecycle.browserCloseAwaited, true);
  assert.equal(capture.lifecycle.allContextsCloseAwaited, true);
  assert.equal(capture.terminalInputVerification.unchanged, true);
  assert.equal(capture.terminalInputVerification.sha256, metadata.sourceProtocolSHA256);
  assert.deepEqual(capture.errors, []);
  assert.deepEqual(capture.captureIssues, []);
  assert.equal(capture.fatal, null);
  for (const reference of capture.cases) {
    const entry = profileEntry(reference.id, reference.formatProfile, variant);
    assert.deepEqual(reference.rawJSONPart, entry.original);
  }
  return capture;
}
export function verifyMaskHydrationSourceIntegrity() {
  for (const name of Object.keys(metadata.documents)) readMaskHydrationSourceEvidence(name);
  for (const variant of ['first', 'repeat']) readMaskHydrationSourceCapture(variant);
  let snapshots = 0;
  for (const entry of metadata.profiles)
    snapshots += readMaskHydrationSourceProfile(entry.id, entry.formatProfile, entry.variant).observations.length;
  assert.equal(snapshots, 270);
  return { sourceOnly: true, profiles: 30, snapshots, originalWholeParts: 30,
    wholeGzipBlobs: new Set(metadata.profiles.map(row => row.fixture)).size };
}
