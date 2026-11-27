import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { ownershipScenarios, ownershipOwnerSample, type HydrationOwnershipScenario,
  type HydrationOwnershipOwnerKey, type HydrationOwnershipAction, type HydrationOwnershipOwnerSample } from './select-components-hydration-ownership-cases.mjs';
import type { HydrationOwnershipOwnerState, HydrationOwnershipPoint } from './select-components-hydration-ownership-metrics.mjs';

export interface HydrationOwnershipServerOwner {
  sample: HydrationOwnershipOwnerSample; rawHtml: string; htmlSha256: string;
  state: HydrationOwnershipOwnerState; refs: Record<'control' | 'root' | 'editor' | 'authoredInput' | 'outside', boolean>;
}
export interface HydrationOwnershipServerSerialization {
  owners: Partial<Record<HydrationOwnershipOwnerKey, HydrationOwnershipServerOwner>>;
  resources: Record<'timers' | 'frames' | 'measurements' | 'microtasks' | 'ports', number>;
  fatal: unknown; domFree: boolean; independentRenderCalls: number;
  callerUIDs: Partial<Record<HydrationOwnershipOwnerKey, string>>; documentPairCallerUIDEqual: boolean | null;
  messageChannelEnvironment: { availableDuringUMDLoad: boolean; forbiddenDuringRender: boolean };
}
export interface HydrationOwnershipSourceCase {
  id: string; scenario: HydrationOwnershipScenario;
  server: {
    serializations: Record<'renderToString' | 'renderToStaticMarkup', HydrationOwnershipServerSerialization>;
    diagnostics: unknown[]
  };
  trace: Array<{ phase: string; actual: HydrationOwnershipPoint; action?: HydrationOwnershipAction }>;
  completedActions: number; peerCleanups: number; fatal: unknown;
  recoverableErrors: Partial<Record<HydrationOwnershipOwnerKey, unknown[]>>;
  network: { requests: unknown[]; requestFailures: unknown[]; responses: unknown[] };
}
interface Pin { bytes: number; sha256: string }
interface Header {
  axis: string; version: string; react: string; revision: string; node: string; chromium: string;
  status: string; protocol: string; protocolSha256: string; inputPins: Record<string, Pin>;
  archives: unknown[]; preservedReferences: number; errors: unknown[]; diagnostics: unknown[];
  browserOwnedResourceCounters: {
    measured: false;
    observers: null;
    mutations: null;
    frames: null;
    timers: null;
    ports: null;
    reason: string
  };
}
export interface HydrationOwnershipSource { reference: Header; cases: HydrationOwnershipSourceCase[] }
interface Copy { variant: 'first' | 'repeat'; path: string; storageBytes: number; storageSha256: string; decodedBytes: number; decodedSha256: string }
interface Manifest {
  status: string; sourceOnly: boolean; allRawSourcesUnchanged: boolean; protocol: Pin;
  copies: Copy[]; headerByVariant: Record<'first' | 'repeat', Header>;
  counts: {
    scenarios: number;
    actualHydratedRoots: number;
    targetActions: number;
    finalPeerCleanups: number
  };
  portableInputs: Array<Pin & { path: string; source: string; byteEqual: boolean }>;
  repeatProof: { wholePairByteEqual: boolean; path: string; bytes: number; sha256: string };
  independentlyCapturedRaw: Record<'first' | 'repeat', Pin & { path: string }>;
  frozenProtocol: {
    status: string;
    inputPins: Record<string, Pin>;
    preservedReferences: Record<string, Pin>;
    priorProduction: Record<string, unknown>
  };
  rawPointsPerRun: number; actualInitialSSRSerializationsPerRun: number;
  preservation: {
    inputFiles: number;
    references: number;
    priorProductionStandTrees: number;
    verifiedBeforeAndAfter: boolean
  };
  serialization: {
    format: string;
    compressionLevel: number;
    decodedWholeRawByteEqual: boolean;
    fieldsDropped: string[];
    normalizedFields: string[]
  };
}
// Returns SHA-256 in hexadecimal form for the reconciliation of the recorded data.
const hash = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
// Allows the path to a local image relative to the module. Current working directory does not
// affect the result.
const fixture = (name: string) => new URL('./fixtures/' + name, import.meta.url);
// Independently captured official Source; both complete raw runs are byte-equal.
const frozen = { manifest: {
  bytes: 345867,
  sha256: '02a2f57dd06aa4c8b41c038ac3e8b826fa5f523988e1653ab421a869b0b4f679'
}, protocolSha256: '9e9b8ace4ca04684095e2158b168ccb14e8a39c08a351c9c4542688adc90462d',
  first: {
    storageBytes: 1764888,
    storageSha256: 'a8be2ee627031e98fee1c1cdeacd7c6e2e893463f68233be79059d61a92f027a',
    decodedBytes: 44787854,
    decodedSha256: '60043a0466e56bf05887e3f3d1125d2ee334b566f4b1b0a843e6fc082f66b20e'
  },
  repeat: {
    storageBytes: 1764888,
    storageSha256: 'a8be2ee627031e98fee1c1cdeacd7c6e2e893463f68233be79059d61a92f027a',
    decodedBytes: 44787854,
    decodedSha256: '60043a0466e56bf05887e3f3d1125d2ee334b566f4b1b0a843e6fc082f66b20e'
  } };
let manifestCache: Manifest | undefined;
export function readSelectComponentsHydrationOwnershipManifest() {
  if (manifestCache) {
    return manifestCache;
  }
  const bytes = readFileSync(fixture('ant-design-select-components-hydration-ownership-source-manifest.json'));
  assert.equal(bytes.length, frozen.manifest.bytes);
  assert.equal(hash(bytes), frozen.manifest.sha256);
  const manifest = JSON.parse(bytes.toString('utf8')) as Manifest;
  assert.equal(manifest.status, 'passed');
  assert.equal(manifest.sourceOnly, true);
  assert.equal(manifest.allRawSourcesUnchanged, true);
  assert.deepEqual(
    manifest.protocol,
    {
      path: '.upstream/artifacts/select-components-hydration-ownership-source-v1/protocol-freeze.json',
      bytes: 319871,
      sha256: frozen.protocolSha256
    }
  );
  assert.equal(manifest.frozenProtocol.status, 'frozen-after-root-review-before-source-measurement');
  assert.equal(Object.keys(manifest.frozenProtocol.inputPins).length, 10);
  assert.equal(Object.keys(manifest.frozenProtocol.preservedReferences).length, 881);
  assert.equal(Object.keys(manifest.frozenProtocol.priorProduction).length, 6);
  assert.deepEqual(
    manifest.preservation,
    { inputFiles: 10, references: 881, priorProductionStandTrees: 6, verifiedBeforeAndAfter: true }
  );
  assert.deepEqual(
    manifest.serialization,
    {
      format: 'gzip',
      compressionLevel: 9,
      decodedWholeRawByteEqual: true,
      fieldsDropped: [],
      normalizedFields: []
    }
  );
  assert.equal(manifest.rawPointsPerRun, 204);
  assert.equal(manifest.actualInitialSSRSerializationsPerRun, 32);
  for (const variant of ['first', 'repeat'] as const) {
    assert.deepEqual(manifest.independentlyCapturedRaw[variant], { path: `.upstream/artifacts/select-components-hydration-ownership-source-v1/source-${variant}.json`, bytes: 44787854,
      sha256: '60043a0466e56bf05887e3f3d1125d2ee334b566f4b1b0a843e6fc082f66b20e' });
    assert.equal(manifest.headerByVariant[variant].protocolSha256, frozen.protocolSha256);
    assert.deepEqual(manifest.headerByVariant[variant].inputPins, manifest.frozenProtocol.inputPins);
  }
  assert.deepEqual(
    manifest.counts,
    { scenarios: 12, actualHydratedRoots: 16, targetActions: 60, finalPeerCleanups: 4 }
  );
  assert.deepEqual(manifest.copies.map(copy => copy.variant), ['first', 'repeat']);
  for (const variant of ['first', 'repeat'] as const) {
    const copy = manifest.copies.find(copy => copy.variant === variant)!;
    assert.equal(copy.path, 'ant-design-select-components-hydration-ownership-reference.json.gz');
    const { storageBytes, storageSha256, decodedBytes, decodedSha256 } = copy;
    assert.deepEqual({ storageBytes, storageSha256, decodedBytes, decodedSha256 }, frozen[variant]);
  }
  for (const input of manifest.portableInputs) {
    assert.equal(input.byteEqual, true);
    const bytes = readFileSync(new URL(input.path, import.meta.url));
    assert.equal(bytes.length, input.bytes);
    assert.equal(hash(bytes), input.sha256);
    assert.deepEqual(
      manifest.headerByVariant.first.inputPins[input.source],
      { bytes: input.bytes, sha256: input.sha256 }
    );
  }
  assert.deepEqual(
    manifest.repeatProof,
    {
      wholePairByteEqual: true,
      path: 'ant-design-select-components-hydration-ownership-repeat-proof.json',
      bytes: 11549,
      sha256: 'b1526a6d75b4ded32ddc1a3a26907d936bd69ea935dcf1596cad40a9933f5c07'
    }
  );
  const proof = readFileSync(fixture(manifest.repeatProof.path));
  assert.equal(proof.length, manifest.repeatProof.bytes);
  assert.equal(hash(proof), manifest.repeatProof.sha256);
  return manifestCache = manifest;
}
function phases(scenario: HydrationOwnershipScenario) {
  const names = ['parsed', 'beforeHydration', ...scenario.environment.hydrationOrder.flatMap(key =>
    [key + '-hydrate-return', key + '-first-owner-commit', key + '-settled'])];
  for (const [index, action] of scenario.actions.entries()) {
    if (action.type === 'controlled-query' || action.type === 'intrinsic-tag-replacement') names.push('action-' + index + '-immediate');
    if (action.type === 'target-dispose') {
      names.push(
        'target-before-dispose',
        'target-dispose-immediate'
      );
    }
    names.push('action-' + index + '-settled');
    if (action.type === 'target-dispose') names.push('target-late');
  }
  if (scenario.environment.owners.includes('A')) {
    names.push(
      'peer-before-dispose',
      'peer-disposed',
      'peer-late'
    );
  }
  return names;
}
/** Integrity/schema checks only. Browser-specific actual values and every raw
 * callback/DOM/ref/focus row stay in their independently measured Source form. */
export function validateHydrationOwnershipSource(
  source: HydrationOwnershipSource,
  expectedHeader: Header
) {
  assert.deepEqual(source.reference, expectedHeader, 'complete independently pinned Source header');
  const header = source.reference;
  assert.equal(header.axis, 'independent-root-shadow-hydration-ownership');
  assert.equal(header.version, '6.6.8');
  assert.equal(header.react, '18.3.1');
  assert.equal(header.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
  assert.equal(header.status, 'completed-observation');
  assert.deepEqual(header.errors, []);
  assert.equal(header.browserOwnedResourceCounters.measured, false);
  for (const name of ['observers', 'mutations', 'frames', 'timers', 'ports'] as const) {
    assert.equal(
      header.browserOwnedResourceCounters[name],
      null
    );
  }
  assert.deepEqual(
    source.cases.map(entry => entry.id),
    ownershipScenarios.map(scenario => scenario.id)
  );
  let hydratedRoots = 0, actions = 0, peerCleanups = 0;
  for (const [index, entry] of source.cases.entries()) {
    const scenario = ownershipScenarios[index], keys = scenario.environment.owners;
    assert.deepEqual(entry.scenario, scenario);
    assert.equal(entry.fatal, null);
    assert.equal(entry.completedActions, scenario.actions.length);
    actions += entry.completedActions;
    assert.equal(entry.peerCleanups, keys.includes('A') ? 1 : 0);
    peerCleanups += entry.peerCleanups;
    assert.deepEqual(Object.keys(entry.recoverableErrors), keys);
    for (const key of keys) assert.deepEqual(entry.recoverableErrors[key], []);
    assert.deepEqual(entry.network.requestFailures, []);
    assert.deepEqual(
      Object.keys(entry.server.serializations),
      ['renderToString', 'renderToStaticMarkup']
    );
    for (const state of Object.values(entry.server.serializations)) {
      assert.deepEqual(Object.keys(state.owners), keys);
      assert.equal(state.fatal, null);
      assert.equal(state.domFree, true);
      assert.equal(state.independentRenderCalls, keys.length);
      assert.deepEqual(
        state.resources,
        { timers: 0, frames: 0, measurements: 0, microtasks: 0, ports: 0 }
      );
      assert.deepEqual(
        state.messageChannelEnvironment,
        { availableDuringUMDLoad: false, forbiddenDuringRender: true }
      );
      for (const key of keys) {
        const owner = state.owners[key]!;
        assert.deepEqual(owner.sample, ownershipOwnerSample(scenario, key));
        assert.equal(hash(owner.rawHtml), owner.htmlSha256);
        assert.equal(typeof owner.state.callerUID, 'string');
        assert(owner.state.callerUID.length > 0);
        assert.equal(owner.state.ownerKey, key);
        assert.equal(owner.state.publicId, owner.sample.publicId);
        assert.equal(state.callerUIDs[key], owner.state.callerUID);
        assert.deepEqual(
          owner.refs,
          { control: true, root: true, editor: true, authoredInput: true, outside: true }
        );
      }
      assert.equal(
        state.documentPairCallerUIDEqual,
        keys.includes('A') ? state.callerUIDs.A === state.callerUIDs.B : null
      );
    }
    assert.deepEqual(entry.trace.map(row => row.phase), phases(scenario));
    for (const row of entry.trace) {
      assert.equal(row.actual.scenarioId, scenario.id);
      assert.deepEqual(Object.keys(row.actual.roots), keys);
      for (const key of keys) {
        const root = row.actual.roots[key]!;
        assert.equal(root.target.nodeType, scenario.environment.kind === 'document' ? 1 : 11);
        assert.equal(
          root.target.shadowMode,
          scenario.environment.kind === 'document' ? null : scenario.environment.kind === 'shadow-open' ? 'open' : 'closed'
        );
        assert.equal(
          root.target.hostExposesSavedRoot,
          scenario.environment.kind === 'document' ? null : scenario.environment.kind === 'shadow-open'
        );
        assert.equal(row.actual.resources.ownedBrowserCounters.measured, false);
      }
      if (row.action) {
        const match = /^action-(\d+)-(?:immediate|settled)$/.exec(row.phase);
        assert(match);
        assert.deepEqual(row.action, scenario.actions[Number(match[1])]);
      }
    }
    hydratedRoots += keys.length;
  }
  assert.deepEqual({
    scenarios: source.cases.length,
    actualHydratedRoots: hydratedRoots,
    targetActions: actions,
    finalPeerCleanups: peerCleanups
  },
    { scenarios: 12, actualHydratedRoots: 16, targetActions: 60, finalPeerCleanups: 4 });
  return source;
}
const cache = new Map<'first' | 'repeat', HydrationOwnershipSource>();
export function readSelectComponentsHydrationOwnershipSource(variant: 'first' | 'repeat' = 'first'): HydrationOwnershipSource {
  assert(variant === 'first' || variant === 'repeat', 'Unknown Source ownership capture variant');
  const old = cache.get(variant);
  if (old) {
    return old;
  }
  const manifest = readSelectComponentsHydrationOwnershipManifest();
  if (variant === 'repeat') {
    const first = readSelectComponentsHydrationOwnershipSource('first');
    assert.deepEqual(manifest.headerByVariant.repeat, first.reference);
    cache.set('repeat', first);
    return first;
  }
  const copy = manifest.copies.find(copy => copy.variant === variant)!;
  const stored = readFileSync(fixture(copy.path));
  assert.equal(stored.length, copy.storageBytes);
  assert.equal(hash(stored), copy.storageSha256);
  const decoded = gunzipSync(stored);
  assert.equal(decoded.length, copy.decodedBytes);
  assert.equal(hash(decoded), copy.decodedSha256);
  const result = validateHydrationOwnershipSource(
    JSON.parse(decoded.toString('utf8')) as HydrationOwnershipSource,
    manifest.headerByVariant[variant]
  );
  cache.set(variant, result);
  return result;
}
export function readSelectComponentsHydrationOwnershipCase(
  id: string,
  variant: 'first' | 'repeat' = 'first'
) {
  assert(
    ownershipScenarios.some(scenario => scenario.id === id),
    'Unknown Source ownership scenario: ' + id
  );
  return readSelectComponentsHydrationOwnershipSource(variant).cases.find(entry => entry.id === id)!;
}

export function readHydrationOwnershipSourcePhase(
  entry: HydrationOwnershipSourceCase,
  phase: string
) {
  const point = entry.trace.find(row => row.phase === phase);
  assert(point, 'Unknown independently captured Source phase: ' + phase);
  return point.actual;
}
