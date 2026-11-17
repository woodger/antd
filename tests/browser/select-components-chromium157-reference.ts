import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { selectComponentSamples as modes } from './select-components-modes-cases.mjs';
import { selectComponentSamples as acStyle } from './select-components-ac-style-cases.mjs';

export type SelectComponentsBrowserAxis = 'modes' | 'ac-style';
interface Pin { path: string; storageBytes: number; storageSha256: string; decodedBytes: number; decodedSha256: string;
  repeatBytes: number; repeatSha256: string; wholePairByteEqual: boolean }
export interface BrowserCaseProof { id: string; canonicalSHA256: string; variantSHA256: string; wholeCaseEqual: boolean }
interface VariantEntry {
  axis: SelectComponentsBrowserAxis; browser: string; mode: string; protocolSha256: string; preservedReferences: number;
  owners: number; actions: number; diagnostics: number; diagnosticsVerbatim: unknown[]; copy: Pin;
  canonical: { path: string; storageSha256: string }; route157: string[]; cases: BrowserCaseProof[];
}
interface Header { axis: string; mode: string; chromium: string; version: string; react: string; revision: string;
  protocolSha256: string; preservedReferences: number; status: string; errors: unknown[]; diagnostics: unknown[];
  archives: Array<{ byteEqual: boolean }> }
export interface Chromium157Source<Value> { reference: Header; cases: Value[] }
const hash = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex');
export const selectComponentsSourceCaseSHA256 = (value: unknown) => hash(JSON.stringify(value));
const fixture = (name: string) => new URL('./fixtures/' + name, import.meta.url);
const manifestBytes = readFileSync(fixture('ant-design-select-components-chromium157-source-manifest.json'));
export const selectComponentsChromium157ManifestSHA256 = 'f051a2c49a863bd30b9fbf7e6e5dd4605ce9ba486610ec65c7576b203c9b66cd';
assert.equal(hash(manifestBytes), selectComponentsChromium157ManifestSHA256);
const manifest = JSON.parse(manifestBytes.toString('utf8')) as { version: number; sourceOnly: boolean;
  canonicalBrowser: string; variantBrowser: string; old156ArtifactsUnchanged: boolean; axes: Record<SelectComponentsBrowserAxis, VariantEntry> };
assert.equal(manifest.version, 1); assert.equal(manifest.sourceOnly, true); assert.equal(manifest.old156ArtifactsUnchanged, true);
assert.equal(manifest.canonicalBrowser, '156.0.8078.79'); assert.equal(manifest.variantBrowser, '157.0.8103.78');
const definitions = {
  modes: { name: 'ant-design-select-components-modes-chromium157-reference.json.gz', sample: modes, refs: 534,
    protocol: '2d7eff1deec53913cbaa866af541d6beb35e581b07e0167226be0af2275d8dbe', diagnostics: 6, actions: 72,
    route: 'select-components-modes-multiple-element-input',
    pin: [2043530, 'ad7f834a632c2b9ad9057785ed1c3eae7943798e8a7b1fb429f43740d857ffc3', 57702863, '279396eb1a86a3b481da120eb50b51ee08bd8311185fb3ee6851c93762a1ad8c'] },
  'ac-style': { name: 'ant-design-select-components-ac-style-chromium157-reference.json.gz', sample: acStyle, refs: 550,
    protocol: '2d85873c9fec23c14b568b43bebd9736b33267579cadaa1a12934ea855e73663', diagnostics: 2, actions: 20,
    route: 'select-components-ac-style-input',
    pin: [470091, '4e2cb3c9a40e69a44876065d89bc37ac791b178843c6953cd3f1b48c67a1a1b3', 13379053, '1cd6bc25cea2bd948100152aef9b5df4822bdede4e6dacf590c4c6388d97b700'] }
} as const;
const sources = new Map<SelectComponentsBrowserAxis, Chromium157Source<unknown>>();
export function readSelectComponentsChromium157Source<Value>(axis: SelectComponentsBrowserAxis): Chromium157Source<Value> {
  if (!sources.has(axis)) {
    const definition = definitions[axis], entry = manifest.axes[axis], pin = entry.copy;
    assert.equal(entry.axis, axis); assert.equal(entry.browser, '157.0.8103.78'); assert.equal(entry.mode, 'csr');
    assert.equal(pin.path, 'tests/browser/fixtures/' + definition.name);
    assert.deepEqual([pin.storageBytes, pin.storageSha256, pin.decodedBytes, pin.decodedSha256], definition.pin);
    assert.equal(pin.wholePairByteEqual, true); assert.equal(pin.repeatBytes, pin.decodedBytes); assert.equal(pin.repeatSha256, pin.decodedSha256);
    assert.equal(entry.protocolSha256, definition.protocol); assert.equal(entry.preservedReferences, definition.refs);
    assert.deepEqual(entry.route157, [definition.route]); assert.equal(entry.actions, definition.actions);
    const stored = readFileSync(fixture(definition.name)); assert.equal(stored.length, pin.storageBytes); assert.equal(hash(stored), pin.storageSha256);
    const decoded = gunzipSync(stored); assert.equal(decoded.length, pin.decodedBytes); assert.equal(hash(decoded), pin.decodedSha256);
    const source = JSON.parse(decoded.toString('utf8')) as Chromium157Source<{ id: string; steps: Array<{ action: unknown }>;
      cleanup: { popupCount: number; ownerCount: number; refs: Record<string, boolean>; retainedConnected: Array<{ connected: boolean }> } }>;
    const header = source.reference;
    assert.equal(header.axis, axis); assert.equal(header.mode, 'csr'); assert.equal(header.chromium, '157.0.8103.78');
    assert.equal(header.version, '6.6.8'); assert.equal(header.react, '18.3.1'); assert.equal(header.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
    assert.equal(header.protocolSha256, definition.protocol); assert.equal(header.preservedReferences, definition.refs); assert.equal(header.status, 'passed');
    assert.deepEqual(header.errors, []); assert.deepEqual(header.diagnostics, entry.diagnosticsVerbatim); assert.equal(header.diagnostics.length, definition.diagnostics);
    assert.equal(header.archives.length, 4); assert(header.archives.every(archive => archive.byteEqual));
    assert.equal(source.cases.length, entry.owners); assert.deepEqual(source.cases.map(value => value.id), definition.sample.map(value => value.id));
    assert.equal(source.cases.reduce((sum, value) => sum + value.steps.length, 0), definition.actions);
    for (const [index, value] of source.cases.entries()) {
      assert.deepEqual(value.steps.map(step => step.action), definition.sample[index].actions);
      const proof = entry.cases[index]; assert.equal(proof.id, value.id); assert.equal(selectComponentsSourceCaseSHA256(value), proof.variantSHA256);
      assert.equal(proof.wholeCaseEqual, value.id !== definition.route);
      if (proof.wholeCaseEqual) assert.equal(proof.variantSHA256, proof.canonicalSHA256);
      assert.equal(value.cleanup.popupCount, 0); assert.equal(value.cleanup.ownerCount, 0);
      assert(Object.values(value.cleanup.refs).every(Boolean)); assert(value.cleanup.retainedConnected.every(node => !node.connected));
    }
    sources.set(axis, source);
  }
  return sources.get(axis)! as Chromium157Source<Value>;
}
export function selectComponentsChromium157Metadata(axis: SelectComponentsBrowserAxis) {
  readSelectComponentsChromium157Source(axis); return manifest.axes[axis];
}
