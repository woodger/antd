import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';

export interface AutocompleteCloseSample {
  id: string;
  virtual: boolean;
  method: 'direct-pointer' | 'settled-hover-pointer' | 'enter';
}
export interface AutocompleteCloseNode {
  identity: number; connected: boolean; tag: string; text: string | null; html: string;
  attributes: Array<[string, string]>; classes: string[]; cssText: string;
  inlineProperties: Array<{ name: string; value: string; priority: string }>;
  css: Record<string, string>; box: { x: number; y: number; width: number; height: number };
  scrollTop: number; scrollHeight: number; clientHeight: number;
  value: string | null; caret: Array<number | null> | null;
}
export type AutocompleteCloseSlot = 'root' | 'editor' | 'popup' | 'list' | 'holder';
export interface AutocompleteCloseNodes {
  current: Record<AutocompleteCloseSlot, AutocompleteCloseNode | null>;
  original: Partial<Record<AutocompleteCloseSlot, AutocompleteCloseNode | null>>;
  sameAsOriginal: Record<AutocompleteCloseSlot, boolean | null>;
  visualRows: Array<AutocompleteCloseNode & { active: boolean; selected: boolean }>;
  srRows: Array<AutocompleteCloseNode & { insideVisualList: boolean }>;
  activeVisualTitles: Array<string | null>; ariaActiveDescendant: string | null;
  popupText: string | null; popupCount: number;
  focus: { tag?: string; id?: string; isEditor: boolean };
  publicRootMatches: boolean;
  resources: Array<{ name: string; initiatorType: string }>;
}
export interface AutocompleteCloseOwner {
  value: string | undefined; query: string | undefined; open: boolean;
  authoredProps: unknown; rawAuthoredProps: unknown; authoredProvider: unknown; rawAuthoredProvider: unknown;
}
export interface AutocompleteClosePoint {
  phase: string; nodes: AutocompleteCloseNodes;
  owner: AutocompleteCloseOwner & {
    producerCount: number;
    eventCount: number;
    rawEventCount: number
  };
}
interface Cleanup {
  nodes: AutocompleteCloseNodes;
  owner: AutocompleteCloseOwner & {
    events: unknown[];
    rawEvents: unknown[];
    calls: SelectSurfaceProducerCall[]
  };
  snapshots: AutocompleteClosePoint[]; flags: { selectionCallback: boolean };
}
export interface AutocompleteCloseCase {
  id: string; sample: AutocompleteCloseSample;
  initial: AutocompleteClosePoint; opened: AutocompleteClosePoint; typed: AutocompleteClosePoint;
  prepared: AutocompleteClosePoint; closed: AutocompleteClosePoint; outside: AutocompleteClosePoint;
  events: unknown[]; rawEvents: unknown[]; producerCalls: SelectSurfaceProducerCall[];
  phases: AutocompleteClosePoint[]; flags: { selectionCallback: boolean }; cleanup: Cleanup; late: Cleanup;
}
interface Header {
  version: string; react: string; revision: string; protocolSha256: string; preservedReferences: number;
  inputPins: Record<string, string>; errors: unknown[]; diagnostics: unknown[];
  archives: Array<{ sha256: string; archiveSha256: string; byteEqual: boolean }>;
}
// Returns SHA-256 in hexadecimal form for the reconciliation of the recorded data.
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const referenceUrl = new URL(
  './fixtures/ant-design-autocomplete-close-reference.json.gz',
  import.meta.url
);
const compressed = readFileSync(referenceUrl);
assert.equal(compressed.length, 1097585);
assert.equal(hash(compressed), '667b940d4008f19067a0d17eae9e79dab5c8171d5b9ff15a4063f5a7c231ccbf');
const decoded = gunzipSync(compressed);
assert.equal(decoded.length, 38026481);
assert.equal(hash(decoded), 'a4543842faf98637bf2f2cb1b386f2fcd43b9b63209e3a2634c2fbf5b879ae5c');
export const autocompleteCloseReference = JSON.parse(decoded.toString('utf8')) as {
  reference: Header;
  cases: AutocompleteCloseCase[]
};
const header = autocompleteCloseReference.reference;
assert.equal(header.version, '6.6.8');
assert.equal(header.react, '18.3.1');
assert.equal(header.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
assert.equal(
  header.protocolSha256,
  '6eaa0d419b03d4d61b5be55b0531f05d01453201602b530b2f64f361677d371c'
);
assert.equal(header.preservedReferences, 482);
assert.deepEqual(header.errors, []);
assert.deepEqual(header.diagnostics, []);
assert.equal(
  header.archives[0].sha256,
  'e13aa9008d4d9edbb4cad022197f568227cc224b0ba016e5356ba29ed7a7e3f4'
);
assert.equal(
  header.archives[0].archiveSha256,
  '8eb361740b62dc79762f21d036dea685d5e7c1d714315ea3247b9aa5d2269dfa'
);
assert(header.archives.every(item => item.byteEqual));
for (const [path, sha] of Object.entries(header.inputPins)) {
  if (path.startsWith('tests/'))
    assert.equal(hash(readFileSync(new URL('../../' + path, import.meta.url))), sha, path);
}
const expectedIds = [false, true].flatMap(virtual => ['direct-pointer', 'settled-hover-pointer', 'enter']
  .map(method => 'autocomplete-close-low-' + (virtual ? 'virtual' : 'full') + '-' + method));
assert.deepEqual(autocompleteCloseReference.cases.map(owner => owner.id), expectedIds);
export const autocompleteClosePhases = ['initial', 'opened', 'typed', 'prepared', 'closed', 'outside'] as const;
for (const owner of autocompleteCloseReference.cases) {
  assert.equal(owner.sample.id, owner.id);
  assert.equal(owner.flags.selectionCallback, true);
  assert.deepEqual(owner.cleanup, owner.late);
  assert.equal(owner.cleanup.nodes.popupCount, 0);
  assert.deepEqual(autocompleteClosePhases.map(name => owner[name]), owner.phases);
  assert.equal(owner.events.length, owner.rawEvents.length);
  for (const name of autocompleteClosePhases) {
    const point = owner[name];
    assert.equal(point.owner.eventCount, point.owner.rawEventCount);
    assert(point.owner.eventCount <= owner.events.length);
    assert(point.owner.producerCount <= owner.producerCalls.length);
    assert.deepEqual(point.nodes.resources, []);
  }
}
