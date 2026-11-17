import assert from 'node:assert/strict';
import { readSelectComponentsModesCase, type ModesCase } from './select-components-modes-reference';
import { readSelectComponentsACStyleCase, type ACStyleCase } from './select-components-ac-style-reference';
import { readSelectComponentsChromium157Source, selectComponentsChromium157Metadata,
  selectComponentsChromium157ManifestSHA256, selectComponentsSourceCaseSHA256, type SelectComponentsBrowserAxis } from './select-components-chromium157-reference';

export interface SelectComponentsReferenceVariant {
  requestedChromiumVersion: string | null;
  oracleChromiumVersion: '156.0.8078.79' | '157.0.8103.78';
  axis: SelectComponentsBrowserAxis;
  caseId: string;
  measured157Input: boolean;
  completeCaseEquivalentUnder157: boolean;
  variantManifestSHA256: string | null;
  oracleStorageSHA256: string | null;
}
interface Selection<Value> { source: Value; referenceVariant: SelectComponentsReferenceVariant }
const canonicalVersion = '156.0.8078.79', currentVersion = '157.0.8103.78';
const affected = { modes: 'select-components-modes-multiple-element-input', 'ac-style': 'select-components-ac-style-input' };
export function readSelectComponentsBrowserReference(axis: 'modes', id: string, chromiumVersion?: string): Selection<ModesCase>;
export function readSelectComponentsBrowserReference(axis: 'ac-style', id: string, chromiumVersion?: string): Selection<ACStyleCase>;
export function readSelectComponentsBrowserReference(axis: SelectComponentsBrowserAxis, id: string, chromiumVersion?: string): Selection<ModesCase | ACStyleCase> {
  if (chromiumVersion !== undefined && chromiumVersion !== canonicalVersion && chromiumVersion !== currentVersion)
    throw Error('Unmeasured Chromium Source oracle: ' + chromiumVersion + '; supported exact versions: ' + canonicalVersion + ', ' + currentVersion);
  const canonical = axis === 'modes' ? readSelectComponentsModesCase(id) : readSelectComponentsACStyleCase(id);
  const referenceVariant: SelectComponentsReferenceVariant = { requestedChromiumVersion: chromiumVersion ?? null,
    oracleChromiumVersion: canonicalVersion, axis, caseId: id, measured157Input: false,
    completeCaseEquivalentUnder157: false, variantManifestSHA256: null, oracleStorageSHA256: null };
  if (chromiumVersion !== currentVersion) return { source: canonical, referenceVariant };
  const entry = selectComponentsChromium157Metadata(axis), proof = entry.cases.find(value => value.id === id);
  assert(proof, 'Every selected case has an independent Source fingerprint');
  assert.equal(selectComponentsSourceCaseSHA256(canonical), proof.canonicalSHA256, 'Canonical156 case remains exact');
  referenceVariant.variantManifestSHA256 = selectComponentsChromium157ManifestSHA256;
  if (id !== affected[axis]) {
    assert.equal(proof.wholeCaseEqual, true); assert.equal(proof.canonicalSHA256, proof.variantSHA256);
    referenceVariant.completeCaseEquivalentUnder157 = true; referenceVariant.oracleStorageSHA256 = entry.canonical.storageSha256;
    return { source: canonical, referenceVariant };
  }
  assert.equal(proof.wholeCaseEqual, false); assert.deepEqual(entry.route157, [id]);
  const source = readSelectComponentsChromium157Source<ModesCase | ACStyleCase>(axis).cases.find(value => value.id === id); assert(source);
  assert.equal(selectComponentsSourceCaseSHA256(source), proof.variantSHA256);
  referenceVariant.oracleChromiumVersion = currentVersion; referenceVariant.measured157Input = true;
  referenceVariant.oracleStorageSHA256 = entry.copy.storageSha256;
  return { source, referenceVariant };
}
