import fs from 'node:fs';
import assert from 'node:assert/strict';
import { gunzipSync } from 'node:zlib';
import { digest, locateJSONRanges, extractFact, pointPaths, factLeaves } from './date-picker-mask-hydration-prefix-json.mjs';

const prefix = 'ant-design-date-picker-mask-hydration-prefix-';
const fixture = name => new URL('./fixtures/' + name, import.meta.url);
const metadataBytes = fs.readFileSync(fixture(prefix + 'source-manifest.json'));
assert.equal(
  digest(metadataBytes),
  'd6318232e49bd3e8b2174971fbf9b29dd7a46706e8854dbf2ac03b3c3f449eb5'
);
const metadata = JSON.parse(metadataBytes);
assert.equal(metadata.sourceOnly, true);
assert.equal(metadata.NativeDataUsed, false);
assert.equal(metadata.format, 'ant-design-public-numeric-mask-hydrated-range-prefix-source-v1');
assert.equal(metadata.profiles.length, 4);
assert.deepEqual(metadata.factProjection.omitted, ['/html', '/source/producers']);
assert.deepEqual(metadata.factProjection.leaves, factLeaves);
assert.deepEqual(metadata.factProjection.pointPaths, pointPaths);
assert.equal(metadata.serialization.originalStoredGzipBytesCopiedExactly, true);
assert.equal(metadata.serialization.IDsRenumbered, false);
for (const field of ['rawFieldsDropped', 'rawFieldsRewritten', 'normalizedFields']) {
  assert.deepEqual(
    metadata.serialization[field],
    []
  );
}
export function readMaskHydrationPrefixSourceManifest() { return structuredClone(metadata); }
export function readMaskHydrationPrefixSourceEvidence(name) {
  const entry = metadata.documents[name];
  assert(entry, 'Unknown Source prefix evidence');
  const bytes = fs.readFileSync(fixture(entry.fixture));
  assert.equal(bytes.length, entry.bytes);
  assert.equal(digest(bytes), entry.sha256);
  return bytes;
}
const protocol = JSON.parse(readMaskHydrationPrefixSourceEvidence('protocol-freeze'));
assert.equal(
  digest(readMaskHydrationPrefixSourceEvidence('protocol-freeze')),
  metadata.sourceProtocolSHA256
);
assert.equal(protocol.status, 'Root-reviewed-frozen-before-mask-React-hydration-prefix-observation');
assert.equal(protocol.rootLease, metadata.rootLease);
assert.deepEqual(
  JSON.parse(readMaskHydrationPrefixSourceEvidence('protocol-proposal')),
  protocol.proposal
);
assert.equal(metadata.documents['protocol-proposal'].sha256, protocol.reviewedProposalSHA256);
for (const name of ['capture', 'protocol', 'plan']) {
  const entry = metadata.documents[name];
  assert.deepEqual(
    { bytes: entry.bytes, sha256: entry.sha256 },
    protocol.proposal.inputPins[entry.originalFile]
  );
}
const factory = metadata.documents['source-factory'];
assert.deepEqual(
  { bytes: factory.bytes, sha256: factory.sha256 },
  protocol.proposal.preservedOriginalPins[factory.originalFile]
);
readMaskHydrationPrefixSourceEvidence('source-factory');
const release = JSON.parse(readMaskHydrationPrefixSourceEvidence('release'));
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
const indexBytes = fs.readFileSync(fixture(metadata.factIndex.fixture));
assert.equal(indexBytes.length, metadata.factIndex.bytes);
assert.equal(digest(indexBytes), metadata.factIndex.sha256);
const index = JSON.parse(indexBytes), verified = new Map();
function entryFor(id, variant) {
  assert(['first', 'repeat'].includes(variant), 'Unknown Source prefix run');
  const entry = metadata.profiles.find(row => row.id === id && row.variant === variant);
  assert(entry, 'Unknown range Source prefix owner');
  return entry;
}
function rawProfile(entry) {
  const original = entry.original, stored = fs.readFileSync(fixture(entry.fixture));
  assert.equal(entry.fixture, prefix + 'parts/' + original.gzipSHA256 + '.json.gz');
  assert.equal(stored.length, original.gzipBytes);
  assert.equal(digest(stored), original.gzipSHA256);
  const raw = gunzipSync(stored, { maxOutputLength: original.bytes });
  assert.equal(raw.length, original.bytes);
  assert.equal(digest(raw), original.sha256);
  return raw;
}
function verifyFacts(entry) {
  const key = entry.variant + '/' + entry.id;
  if (verified.has(key)) {
    return verified.get(key);
  }
  const raw = rawProfile(entry), authored = protocol.proposal.profiles.find(row => row.id === entry.id);
  assert.equal(authored.formatProfile, 'string');
  const facts = index.profiles.find(row => row.id === entry.id && row.variant === entry.variant);
  assert(facts);
  assert.deepEqual(facts.original, entry.original);
  const pointers = Object.values(pointPaths).flatMap(pointer => [pointer, ...factLeaves.map(leaf => pointer + leaf)]);
  const ranges = locateJSONRanges(raw, pointers), small = new Map();
  assert.deepEqual(ranges, facts.ranges, 'Exact actual JSON pointer/byte-range/hash binding');
  for (const [label, pointer] of Object.entries(pointPaths)) {
    const fact = extractFact(raw, pointer, ranges);
    assert.deepEqual(
      fact,
      facts.facts[label],
      'Every included original field equals its indexed raw leaf'
    );
    assert.equal(fact.source.owner.id, entry.id);
    const scope = /^step-(\d+)(?:-substep-(\d+))?:/.exec(label);
    assert.equal(fact.source.owner.actionIndex, Number(scope[1]));
    assert.equal(fact.source.owner.substepIndex, scope[2] === undefined ? -1 : Number(scope[2]));
    small.set(label, JSON.stringify(fact));
  }
  verified.set(key, small);
  return small;
}
export function readMaskHydrationPrefixSourceFact(id, label, variant = 'first') {
  assert(Object.hasOwn(pointPaths, label), 'Uncaptured Source prefix label');
  return JSON.parse(verifyFacts(entryFor(id, variant)).get(label));
}
export function readMaskHydrationPrefixSourcePoint(id, label, variant = 'first') {
  assert(Object.hasOwn(pointPaths, label), 'Uncaptured Source prefix label');
  const entry = entryFor(id, variant);
  verifyFacts(entry);
  const raw = rawProfile(entry), factIndex = index.profiles.find(row => row.id === id && row.variant === variant);
  const range = factIndex.ranges[pointPaths[label]];
  assert.equal(digest(raw.subarray(range.start, range.end)), range.sha256);
  return JSON.parse(raw.subarray(range.start, range.end).toString());
}
/** Exact whole JSON bytes; avoids V8's whole-string limit for the 538MB repeat packet. */
export function readMaskHydrationPrefixSourceRawProfile(id, variant = 'first') {
  return rawProfile(entryFor(id, variant));
}
export function verifyMaskHydrationPrefixSourceIntegrity() {
  for (const name of Object.keys(metadata.documents)) readMaskHydrationPrefixSourceEvidence(name);
  for (const variant of ['first', 'repeat']) {
    const manifest = JSON.parse(readMaskHydrationPrefixSourceEvidence('capture-' + variant));
    assert.equal(manifest.status, 'complete');
    assert.equal(manifest.cases.length, 2);
    assert.equal(manifest.counts.executedSubsteps, 12);
    assert.equal(manifest.counts.retainedFullPhasePositions, 80);
    assert.equal(manifest.counts.distinctRetainedFullReads, 72);
    assert.equal(manifest.lifecycle.browserCloseAwaited, true);
    assert.equal(manifest.lifecycle.allContextsCloseAwaited, true);
    assert.equal(manifest.terminalInputVerification.unchanged, true);
    assert.deepEqual(manifest.errors, []);
    assert.deepEqual(manifest.captureIssues, []);
    assert.equal(manifest.fatal, null);
    for (const reference of manifest.cases) {
      assert.deepEqual(
        reference.rawJSONPart,
        entryFor(reference.id, variant).original
      );
    }
  }
  for (const entry of metadata.profiles) verifyFacts(entry);
  return { sourceOnly: true, profiles: 4, labelsPerProfile: 10, verifiedFacts: 40,
    originalWholeParts: 4, completeRetainedPhasePositions: 160, distinctFullReads: 144,
    cachedData: 'small verified facts only; no raw buffers or producer ledgers' };
}
