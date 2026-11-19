import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream, readFileSync } from 'node:fs';
import { createGunzip, gunzipSync } from 'node:zlib';
import { selectCustomTagPrefixSamples, type SelectCustomTagPrefixSample, type SelectCustomTagPrefixAction } from './select-components-responsive-tag-prefix-cases.mjs';
import type { SelectCustomTagPrefixDetails } from './select-components-responsive-tag-prefix-metrics.mjs';
import type { SelectComponentsResponsiveDOM, SelectComponentsResponsiveOverflow } from './select-components-responsive-metrics.mjs';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';

export type ResponsiveTagPrefixMode = 'csr' | 'ssr';
export type ResponsiveTagPrefixVariant = 'first' | 'repeat';
interface Pin { bytes: number; sha256: string }
interface PathPin extends Pin { path: string }
export interface ResponsiveTagPrefixRawProperty { key: unknown; value?: unknown; get?: unknown; set?: unknown }
export interface ResponsiveTagPrefixDescriptor { key: unknown; enumerable: boolean; configurable: boolean; writable?: boolean; kind: string; valueType?: string; get?: boolean; set?: boolean }
export interface ResponsiveTagPrefixRawGraph {
  root: unknown;
  objects: Array<{ id: number; type: string; array: boolean; authoredRole: unknown;
    ownProperties?: ResponsiveTagPrefixDescriptor[]; properties?: ResponsiveTagPrefixRawProperty[];
    opaque?: string; nodeType?: number; nodeName?: string; attributes?: string[][] | null }>;
}
export interface ResponsiveTagPrefixProducerCall extends SelectSurfaceProducerCall {
  rawArgument: ResponsiveTagPrefixRawGraph; rawResult: ResponsiveTagPrefixRawGraph;
  argumentCount?: number; argumentOwnKeys?: unknown[][]; argumentDescriptors?: ResponsiveTagPrefixDescriptor[][];
}
export interface ResponsiveTagPrefixBodyActivity {
  kind: 'tag' | 'prefix'; value?: unknown; isMaxTag?: boolean; context: unknown; rawContext: ResponsiveTagPrefixRawGraph;
}
export interface ResponsiveTagPrefixSourceOwner {
  model: unknown; rawModel: ResponsiveTagPrefixRawGraph; open: boolean; query: string; alive: boolean;
  settings: unknown; rawSettings: ResponsiveTagPrefixRawGraph; context: unknown; rawContext: ResponsiveTagPrefixRawGraph;
  events: unknown[]; rawEvents: ResponsiveTagPrefixRawGraph[]; calls: ResponsiveTagPrefixProducerCall[];
  lifecycle: Array<{ slot: 'input'; event: 'attach' | 'detach'; tag: string | null }>;
  bodyActivity: ResponsiveTagPrefixBodyActivity[]; authoredSample: unknown; rawAuthoredSample: ResponsiveTagPrefixRawGraph;
  authoredProps: unknown; rawAuthoredProps: ResponsiveTagPrefixRawGraph; authoredProvider: unknown; rawAuthoredProvider: ResponsiveTagPrefixRawGraph;
}
export interface ResponsiveTagPrefixSourcePoint {
  icons: SelectComponentsResponsiveDOM; overflow: SelectComponentsResponsiveOverflow; customTagsPrefix: SelectCustomTagPrefixDetails;
  owner: Omit<ResponsiveTagPrefixSourceOwner, 'events' | 'rawEvents' | 'calls' | 'lifecycle' | 'bodyActivity'> & {
    eventCount: number; rawEventCount: number; producerCount: number; lifecycleCount: number; bodyActivityCount: number;
  };
}
export interface ResponsiveTagPrefixSourceLedger {
  events: unknown[]; rawEvents: ResponsiveTagPrefixRawGraph[]; producerCalls: ResponsiveTagPrefixProducerCall[];
  lifecycle: ResponsiveTagPrefixSourceOwner['lifecycle']; bodyActivity: ResponsiveTagPrefixBodyActivity[];
}
export interface ResponsiveTagPrefixSourceCleanup {
  owner: ResponsiveTagPrefixSourceOwner; retainedConnected: Array<{
    identity: number;
    connected: boolean
  }>;
  popupCount: number; ownerCount: number; refs: Record<'control' | 'root' | 'editor' | 'authoredRoot' | 'authoredInput', boolean>;
  browserOwnedResourceCounters: BrowserCounters; resourceTiming: unknown[];
}
export interface ResponsiveTagPrefixCSRCase {
  id: string; sample: SelectCustomTagPrefixSample; initial: ResponsiveTagPrefixSourcePoint;
  steps: Array<ResponsiveTagPrefixSourcePoint & { action: SelectCustomTagPrefixAction }>;
  ledger: ResponsiveTagPrefixSourceLedger; cleanup: ResponsiveTagPrefixSourceCleanup; late: ResponsiveTagPrefixSourceCleanup;
  failure: unknown; observationErrors: unknown[]; network: {
    requests: unknown[];
    requestFailures: unknown[];
    responses: unknown[]
  };
}
export interface ResponsiveTagPrefixSSRSerialization {
  rawHtml: string; htmlSha256: string; state: ResponsiveTagPrefixSourceOwner;
  refs: ResponsiveTagPrefixSourceCleanup['refs']; resources: Record<'timers' | 'frames' | 'measurements' | 'microtasks' | 'ports', number>;
  fatal: unknown; domFree: boolean; messageChannelEnvironment: {
    availableDuringUMDLoad: boolean;
    forbiddenDuringRender: boolean
  };
}
export interface ResponsiveTagPrefixSSRCase {
  id: string; sample: SelectCustomTagPrefixSample;
  server: {
    serializations: Record<'renderToString' | 'renderToStaticMarkup', ResponsiveTagPrefixSSRSerialization>;
    diagnostics: unknown[]
  };
}
interface BrowserCounters { measured: false; observers: null; mutations: null; frames: null; timers: null; ports: null }
export interface ResponsiveTagPrefixSourceHeader {
  axis: string; mode: ResponsiveTagPrefixMode; version: string; react: string; revision: string; node: string; chromium: string | null;
  status: string; protocol: string; protocolSha256: string; inputPins: Record<string, Pin>;
  archives: Array<{
    archive: string;
    member: string;
    path: string;
    sha256: string;
    archiveSha256: string;
    byteEqual: boolean
  }>;
  errors: unknown[]; diagnostics: unknown[]; browserOwnedResourceCounters: BrowserCounters;
}
export interface ResponsiveTagPrefixSource<Value> { reference: ResponsiveTagPrefixSourceHeader; cases: Value[] }
export interface ResponsiveTagPrefixCopy {
  mode: ResponsiveTagPrefixMode; variant: ResponsiveTagPrefixVariant; path: string;
  storageBytes: number; storageSha256: string; decodedBytes: number; decodedSha256: string;
}
interface Alignment {
  firstCount: number; repeatCount: number; matched: number; pairs: Array<[number, number]>;
  onlyFirst: Array<{ index: number; signature: string; hasCompleteEquivalentOtherSide: boolean }>;
  onlyRepeat: Array<{ index: number; signature: string; hasCompleteEquivalentOtherSide: boolean }>;
}
export interface ResponsiveTagPrefixPairProof {
  status: string; protocolSha256: string; canonicalSourceModified: boolean; CSRWholePairByteEqual: boolean; SSRWholePairByteEqual: boolean;
  completeDOMCSSOMBoxFocusSnapshotsEqual: number;
  rawGraphComparison: { scope: string; allocatorIDs: string; descriptorsGettersKeyOrderObjectOrderValuesFunctionsDOMMetadataAliasedEdges: string;
    globalCrossRenderIdentityStabilityClaim: boolean; allAllocatorIDsRetainedInOriginalFiles: boolean; normalizationOfSourceFiles: string; negativeControlsPassed: string[] };
  counts: {
    owners: number;
    CSRactionsPerVariant: number;
    CSRpointsPerVariant: number;
    uniqueInitialSSRStates: number;
    actualSSRSerializationsPerVariant: number
  };
  byteProofs: Record<ResponsiveTagPrefixMode, { mode: string; wholePairByteEqual: boolean; normalization: string; exclusions: string[];
    raw: Record<ResponsiveTagPrefixVariant, PathPin> }>;
  cases: Array<{ id: string; points: Array<{ index: number; action: unknown; wholeDOMCSSOMBoxFocusSnapshotsEqual: boolean;
    differentRawAllocatorFields: string[]; countDifferences: unknown[] }>;
    producerAlignment: Alignment; bodyAlignment: Alignment;
    observedTagRender: { calls: number; normal: number; rest: number; ownKeys: string[]; actualArgumentCount: number;
      restOwnUndefined: string[]; callbackArgumentResultInfoAlias: boolean; descriptorProfiles: unknown[] };
    actualEventOrder: string[]; cleanup: unknown }>;
  ssrFacts: unknown[];
}
export interface ResponsiveTagPrefixManifest {
  status: string; sourceOnly: boolean; allRawSourcesUnchanged: boolean; protocol: PathPin;
  frozenProtocol: {
    status: string;
    inputPins: Record<string, Pin>;
    preservedReferences: Record<string, Pin>;
    priorProduction: Record<string, { count: number; pins: Record<string, Pin> }>
  };
  counts: {
    owners: number;
    actionsPerOwner: number;
    actions: number;
    CSRInitialAndActionPoints: number;
    uniqueInitialSSRStates: number;
    actualInitialSSRSerializationsPerRun: number
  };
  copies: ResponsiveTagPrefixCopy[]; independentlyCapturedRaw: Record<ResponsiveTagPrefixMode, Record<ResponsiveTagPrefixVariant, PathPin>>;
  headerByModeAndVariant: Record<ResponsiveTagPrefixMode, Record<ResponsiveTagPrefixVariant, ResponsiveTagPrefixSourceHeader>>;
  portableInputs: Array<Pin & { path: string; source: string; byteEqual: boolean }>;
  repeatProof: { path: string; bytes: number; sha256: string; CSRWholePairByteEqual: boolean; SSRWholePairByteEqual: boolean;
    completeDOMCSSOMBoxFocusSnapshotsEqual: number; pureInvocationVariance: string; graphProof: string };
  diagnostics: Record<string, { errors: number; diagnostics: number }>;
  resources: { browserOwnedCountersMeasured: boolean; browserOwnedCounters: Omit<BrowserCounters, 'measured'>;
    actualSSRForbiddenCounters: ResponsiveTagPrefixSSRSerialization['resources'] };
  preservation: {
    frozenInputs: number;
    oldReferences: number;
    oldProductionStandTrees: number;
    verifiedBeforeAndAfter: boolean
  };
  serialization: {
    format: string;
    compressionLevel: number;
    decodedWholeRawBytes: boolean;
    fieldsDropped: string[];
    rewrittenValues: string[];
    normalizedSourceFields: string[]
  };
  sourceOracleVariant: string; NativeDataUsed: boolean;
}
const prefix = 'ant-design-select-components-responsive-tag-prefix-';
const sourceBase = '.upstream/artifacts/select-components-responsive-tagrender-prefix-source-v1/';
const protocol = '85bf9833e79305571a7dcbb5d15679fd652d36f88f9a5a8b50142762cc97a45d';
// Возвращает SHA-256 в шестнадцатеричном виде для сверки зафиксированных данных.
const hash = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
// Разрешает путь к локальному снимку относительно модуля. Текущий рабочий каталог не влияет на
// результат.
const fixture = (name: string) => new URL('./fixtures/' + name, import.meta.url);
const sameLiteral = (actual: unknown, expected: unknown, label: string) => assert.equal(
  JSON.stringify(actual),
  JSON.stringify(expected),
  label
);
const counters = {
  measured: false,
  observers: null,
  mutations: null,
  frames: null,
  timers: null,
  ports: null
} as const;
const SSRresources = { timers: 0, frames: 0, measurements: 0, microtasks: 0, ports: 0 };
const tagKeys = ['label', 'value', 'index', 'disabled', 'closable', 'onClose', 'isMaxTag'];
const rawPins = {
  csr: {
    first: {
      bytes: 146842729,
      sha256: 'da3f230d4bcda48e21e9567b73defb936b0ef73de760d048be71e36756c8b63c'
    },
    repeat: {
      bytes: 149042948,
      sha256: '0358ab178d9af21356b6fe75764cf7e162c8efc98f195af215f60259dc2dfc8c'
    }
  },
  ssr: {
    first: {
      bytes: 1709900,
      sha256: '6062a61248bd7497738d23b92129dd4924ea8c1f5aabc9e6b289bd4282e798b4'
    },
    repeat: {
      bytes: 1709900,
      sha256: '6062a61248bd7497738d23b92129dd4924ea8c1f5aabc9e6b289bd4282e798b4'
    }
  }
};
const storedPins = {
  csr: {
    first: {
      path: prefix + 'reference.json.gz',
      storageBytes: 4115582,
      storageSha256: '326fcfec346d0601feb6f500edcad776abb23af44e7988d245feb515e8db1207'
    },
    repeat: {
      path: prefix + 'repeat-reference.json.gz',
      storageBytes: 4172232,
      storageSha256: 'bf5b6bdabeb2869b748905194c72e47aa764676a7a1b016b00318bb3226af3b5'
    }
  },
  ssr: {
    first: {
      path: prefix + 'ssr-reference.json.gz',
      storageBytes: 57800,
      storageSha256: 'b9b2bc65605a5013ff1a28e40446acf0f63f40e08bf64927f6e04c31a5b6f175'
    },
    repeat: {
      path: prefix + 'ssr-reference.json.gz',
      storageBytes: 57800,
      storageSha256: 'b9b2bc65605a5013ff1a28e40446acf0f63f40e08bf64927f6e04c31a5b6f175'
    }
  }
};
function selection(mode: ResponsiveTagPrefixMode, variant: ResponsiveTagPrefixVariant) {
  assert(mode === 'csr' || mode === 'ssr', 'Unknown independently measured Source mode');
  assert(variant === 'first' || variant === 'repeat', 'Unknown independent Source capture variant');
}
let manifestCache: ResponsiveTagPrefixManifest | undefined;
export function readSelectComponentsResponsiveTagPrefixManifest() {
  if (manifestCache) {
    return manifestCache;
  }
  const bytes = readFileSync(fixture(prefix + 'source-manifest.json'));
  assert.equal(bytes.length, 382260);
  assert.equal(hash(bytes), '8341c95e91cfe93baa76715785cf2039f80977864459717720c78a48415ad2e8');
  const manifest = JSON.parse(bytes.toString('utf8')) as ResponsiveTagPrefixManifest;
  assert.equal(manifest.status, 'passed-source-only-measured-variance-preserved');
  assert.equal(manifest.sourceOnly, true);
  assert.equal(manifest.allRawSourcesUnchanged, true);
  assert.equal(manifest.NativeDataUsed, false);
  assert.deepEqual(
    manifest.protocol,
    { path: sourceBase + 'protocol-freeze.json', bytes: 333775, sha256: protocol }
  );
  assert.equal(manifest.frozenProtocol.status, 'frozen-after-root-review-before-source-measurement');
  const protocolBytes = JSON.stringify(manifest.frozenProtocol, null, 2) + '\n';
  assert.equal(Buffer.byteLength(protocolBytes), manifest.protocol.bytes);
  assert.equal(hash(protocolBytes), protocol);
  assert.equal(Object.keys(manifest.frozenProtocol.inputPins).length, 22);
  assert.equal(Object.keys(manifest.frozenProtocol.preservedReferences).length, 906);
  assert.equal(Object.keys(manifest.frozenProtocol.priorProduction).length, 7);
  assert.deepEqual(
    manifest.preservation,
    {
      frozenInputs: 22,
      oldReferences: 906,
      oldProductionStandTrees: 7,
      verifiedBeforeAndAfter: true
    }
  );
  assert.deepEqual(
    manifest.counts,
    {
      owners: 2,
      actionsPerOwner: 9,
      actions: 18,
      CSRInitialAndActionPoints: 20,
      uniqueInitialSSRStates: 2,
      actualInitialSSRSerializationsPerRun: 4
    }
  );
  assert.deepEqual(
    manifest.serialization,
    {
      format: 'gzip',
      compressionLevel: 9,
      decodedWholeRawBytes: true,
      fieldsDropped: [],
      rewrittenValues: [],
      normalizedSourceFields: []
    }
  );
  assert.deepEqual(
    manifest.resources,
    {
      browserOwnedCountersMeasured: false,
      browserOwnedCounters: { observers: null, mutations: null, frames: null, timers: null, ports: null },
      actualSSRForbiddenCounters: SSRresources
    }
  );
  assert.deepEqual(
    manifest.copies.map(copy => [copy.mode, copy.variant]),
    [['csr', 'first'], ['csr', 'repeat'], ['ssr', 'first'], ['ssr', 'repeat']]
  );
  for (const mode of ['csr', 'ssr'] as const) {
    for (const variant of ['first', 'repeat'] as const) {
      const copy = manifest.copies.find(copy => copy.mode === mode && copy.variant === variant)!;
      assert.deepEqual(
        copy,
        {
          mode,
          variant,
          ...storedPins[mode][variant],
          decodedBytes: rawPins[mode][variant].bytes,
          decodedSha256: rawPins[mode][variant].sha256
        }
      );
      assert.deepEqual(
        manifest.independentlyCapturedRaw[mode][variant],
        { path: sourceBase + mode + '-source-' + variant + '.json', ...rawPins[mode][variant] }
      );
      const header = manifest.headerByModeAndVariant[mode][variant];
      assert.equal(header.protocolSha256, protocol);
      sameLiteral(
        header.inputPins,
        manifest.frozenProtocol.inputPins,
        'Every actual frozen Source input pin/order'
      );
    }
  }
  for (const input of manifest.portableInputs) {
    assert.equal(input.byteEqual, true);
    const bytes = readFileSync(new URL(input.path, import.meta.url));
    assert.equal(bytes.length, input.bytes);
    assert.equal(hash(bytes), input.sha256);
    assert.deepEqual(
      manifest.frozenProtocol.inputPins[input.source],
      { bytes: input.bytes, sha256: input.sha256 }
    );
  }
  assert.deepEqual(manifest.repeatProof, { path: prefix + 'repeat-proof.json', bytes: 186541, sha256: '4461fc145bd5f60cb79272381e6d24f892c055160aa81d6ddedc622d0764f8cb',
    CSRWholePairByteEqual: false, SSRWholePairByteEqual: true, completeDOMCSSOMBoxFocusSnapshotsEqual: 20,
    pureInvocationVariance: 'additional and reordered complete-equivalent invocations; literal chronological ledgers retained in both CSR variants',
    graphProof: 'strict per-graph allocator-ID bijection only; descriptors/getters/order/values/functions/metadata/internal-aliases all retained; no global cross-render ID stability claim' });
  return manifestCache = manifest;
}
let proofCache: ResponsiveTagPrefixPairProof | undefined;
export function readSelectComponentsResponsiveTagPrefixPairProof() {
  if (proofCache) {
    return proofCache;
  }
  const manifest = readSelectComponentsResponsiveTagPrefixManifest(), bytes = readFileSync(fixture(manifest.repeatProof.path));
  assert.equal(bytes.length, manifest.repeatProof.bytes);
  assert.equal(hash(bytes), manifest.repeatProof.sha256);
  const proof = JSON.parse(bytes.toString('utf8')) as ResponsiveTagPrefixPairProof;
  assert.equal(proof.protocolSha256, protocol);
  assert.equal(proof.canonicalSourceModified, false);
  assert.equal(proof.CSRWholePairByteEqual, false);
  assert.equal(proof.SSRWholePairByteEqual, true);
  assert.equal(proof.completeDOMCSSOMBoxFocusSnapshotsEqual, 20);
  assert.equal(proof.rawGraphComparison.normalizationOfSourceFiles, 'none');
  assert.equal(proof.rawGraphComparison.globalCrossRenderIdentityStabilityClaim, false);
  assert.equal(proof.rawGraphComparison.allAllocatorIDsRetainedInOriginalFiles, true);
  assert.deepEqual(
    proof.cases.map(entry => entry.id),
    selectCustomTagPrefixSamples.map(sample => sample.id)
  );
  assert.deepEqual(proof.cases.map(entry => [entry.producerAlignment.firstCount, entry.producerAlignment.repeatCount, entry.producerAlignment.matched,
    entry.producerAlignment.onlyFirst.length, entry.producerAlignment.onlyRepeat.length, entry.bodyAlignment.firstCount, entry.bodyAlignment.repeatCount]),
    [[607, 619, 595, 12, 24, 280, 286], [634, 646, 619, 15, 27, 292, 298]]);
  for (const [index, entry] of proof.cases.entries()) {
    const sample = selectCustomTagPrefixSamples[index];
    assert.equal(entry.points.length, 10);
    for (const [point, actual] of entry.points.entries()) {
      assert.equal(actual.index, point);
      assert.equal(actual.wholeDOMCSSOMBoxFocusSnapshotsEqual, true);
      assert.deepEqual(actual.action, point ? sample.actions[point - 1] : 'initial');
    }
    for (const alignment of [entry.producerAlignment, entry.bodyAlignment]) {
      assert.equal(alignment.matched + alignment.onlyFirst.length, alignment.firstCount);
      assert.equal(alignment.matched + alignment.onlyRepeat.length, alignment.repeatCount);
      assert([...alignment.onlyFirst, ...alignment.onlyRepeat].every(row => row.hasCompleteEquivalentOtherSide));
    }
    assert.deepEqual(entry.observedTagRender.ownKeys, tagKeys);
    assert.deepEqual(entry.observedTagRender.restOwnUndefined, ['value', 'index', 'onClose']);
    assert.equal(entry.observedTagRender.callbackArgumentResultInfoAlias, true);
  }
  return proofCache = proof;
}
// Сужает неизвестное значение до записи. null и массивы приводят к ошибке проверки.
function object(value: unknown, label: string): Record<string, unknown> {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value), label);
  return value as Record<string, unknown>;
}
function encodedProperties(value: unknown, kind: string, label: string) {
  const node = object(value, label);
  assert.equal(node.$, kind);
  assert(Array.isArray(node.properties), label + '/properties');
  return node.properties as Array<{ key: unknown; value: unknown }>;
}
function rawProperty(graph: ResponsiveTagPrefixRawGraph, reference: unknown, key: string) {
  const ref = object(reference, 'Actual Source graph reference');
  assert.equal(typeof ref.ref, 'number');
  const node = graph.objects.find(node => node.id === ref.ref);
  assert(node);
  const matchingProperty = node.properties?.find(property => property.key === key);
  return matchingProperty?.value;
}
export function readResponsiveTagPrefixSourceInfo(call: ResponsiveTagPrefixProducerCall): Record<string, unknown> {
  assert.equal(call.kind, 'tagRender');
  assert.equal(call.side, 'own');
  assert.equal(call.argumentCount, 1);
  assert.deepEqual(call.argumentOwnKeys, [tagKeys]);
  const args = encodedProperties(call.argument, 'array', 'Actual recorded tagRender arguments');
  assert.deepEqual(args.map(property => property.key), ['0', 'length']);
  assert.equal(args[1].value, 1);
  const properties = encodedProperties(args[0].value, 'object', 'Actual recorded tagRender info');
  assert.deepEqual(
    properties.map(property => property.key),
    tagKeys,
    'Own undefined keys cannot become omissions'
  );
  const info = Object.fromEntries(properties.map(property => [property.key as string, property.value]));
  assert.equal(typeof info.isMaxTag, 'boolean');
  assert.equal(typeof info.closable, 'boolean');
  assert(Array.isArray(call.argumentDescriptors));
  assert.equal(call.argumentDescriptors.length, 1);
  const descriptors = call.argumentDescriptors[0];
  assert.deepEqual(descriptors.map(descriptor => descriptor.key), tagKeys);
  assert(descriptors.every(descriptor => descriptor.kind === 'value' && descriptor.enumerable && descriptor.configurable && descriptor.writable));
  if (info.isMaxTag) {
    for (const key of ['value', 'index', 'onClose']) {
      assert.deepEqual(info[key], { $: 'undefined' });
      assert.equal(descriptors.find(descriptor => descriptor.key === key)?.valueType, 'undefined');
    }
    assert.equal(info.disabled, false);
    assert.equal(info.closable, false);
  }
  else {
    assert.equal(typeof info.value, 'string');
    assert.equal(typeof info.index, 'number');
    assert.deepEqual(info.disabled, { $: 'undefined' });
    assert.equal(info.closable, true);
    assert.equal(object(info.onClose, 'Actual normal onClose').$, 'function');
  }
  const rawInfo = rawProperty(call.rawArgument, call.rawArgument.root, '0');
  const rawInfoNode = call.rawArgument.objects.find(node => node.id === object(
    rawInfo,
    'Raw actual info'
  ).ref);
  assert(rawInfoNode);
  assert.deepEqual(rawInfoNode.properties?.map(property => property.key), tagKeys);
  assert.deepEqual(rawInfoNode.ownProperties, descriptors);
  const props = rawProperty(call.rawResult, call.rawResult.root, 'props');
  const carriedInfo = rawProperty(call.rawResult, props, 'info');
  assert.deepEqual(
    carriedInfo,
    rawInfo,
    'Authored returned ReactElement retains the exact input argument object alias'
  );
  return info;
}
function sourceHeader(
  header: ResponsiveTagPrefixSourceHeader,
  mode: ResponsiveTagPrefixMode,
  variant: ResponsiveTagPrefixVariant
) {
  const expected = readSelectComponentsResponsiveTagPrefixManifest().headerByModeAndVariant[mode][variant];
  sameLiteral(header, expected, 'Complete independently pinned Source header/order');
  assert.equal(header.axis, 'responsive-custom-tag-render-leading-prefix');
  assert.equal(header.mode, mode);
  assert.equal(header.status, 'completed-observation');
  assert.equal(header.version, '6.6.8');
  assert.equal(header.react, '18.3.1');
  assert.equal(header.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
  assert.equal(header.node, 'v24.18.0');
  assert.equal(header.chromium, mode === 'csr' ? '157.0.8103.78' : null);
  assert.equal(header.protocolSha256, protocol);
  assert.deepEqual(header.errors, []);
  assert.deepEqual(header.diagnostics, []);
  assert.deepEqual(header.browserOwnedResourceCounters, counters);
}
export function validateResponsiveTagPrefixCSR(
  source: ResponsiveTagPrefixSource<ResponsiveTagPrefixCSRCase>,
  variant: ResponsiveTagPrefixVariant = 'first'
) {
  selection('csr', variant);
  sourceHeader(source.reference, 'csr', variant);
  assert.deepEqual(
    source.cases.map(entry => entry.id),
    selectCustomTagPrefixSamples.map(sample => sample.id)
  );
  for (const [index, entry] of source.cases.entries()) {
    const sample = selectCustomTagPrefixSamples[index];
    assert.deepEqual(entry.sample, sample);
    assert.equal(entry.failure, null);
    assert.deepEqual(entry.observationErrors, []);
    assert.deepEqual(entry.network, { requests: [], requestFailures: [], responses: [] });
    assert.equal(entry.steps.length, 9);
    assert.deepEqual(entry.steps.map(step => step.action), sample.actions);
    for (const call of entry.ledger.producerCalls) {
      if (call.kind === 'tagRender') readResponsiveTagPrefixSourceInfo(call);
    }
    const points = [entry.initial, ...entry.steps];
    let previous = { event: 0, rawEvent: 0, producer: 0, lifecycle: 0, body: 0 };
    for (const point of points) {
      const owner = point.owner;
      assert(owner.alive);
      assert(point.icons.current.root && point.icons.current.editor);
      assert.equal(point.icons.publicRefs.rootMatches, true);
      assert.equal(
        point.icons.publicRefs.authoredInput?.identity,
        point.icons.current.editor.identity,
        'Actual authored ref points at the physical editor'
      );
      assert.equal(point.customTagsPrefix.editor?.identity, point.icons.current.editor.identity);
      assert.equal(point.overflow.suffixContainsEditor, true);
      assert.equal(point.overflow.rootHasSamePublicEditor, true);
      assert.deepEqual(point.customTagsPrefix.prefixTopology.overflowPrefixNodes, []);
      if (point.customTagsPrefix.leadingPrefix) {
        assert.equal(point.customTagsPrefix.prefixTopology.leadingPrefixIsDirectRootChild, true);
        assert.equal(point.customTagsPrefix.prefixTopology.leadingPrefixOutsideOverflow, true);
      }
      else {
        assert.equal(point.customTagsPrefix.prefixTopology.leadingPrefixIsDirectRootChild, false);
        assert.equal(point.customTagsPrefix.prefixTopology.leadingPrefixOutsideOverflow, false);
      }
      assert.equal(point.customTagsPrefix.browserOwnedResourceCounters.measured, false);
      for (const key of ['observers', 'mutations', 'frames', 'timers', 'ports'] as const) {
        assert.equal(
          point.customTagsPrefix.browserOwnedResourceCounters[key],
          null
        );
      }
      const counts = {
        event: owner.eventCount,
        rawEvent: owner.rawEventCount,
        producer: owner.producerCount,
        lifecycle: owner.lifecycleCount,
        body: owner.bodyActivityCount
      };
      const totals = {
        event: entry.ledger.events.length,
        rawEvent: entry.ledger.rawEvents.length,
        producer: entry.ledger.producerCalls.length,
        lifecycle: entry.ledger.lifecycle.length,
        body: entry.ledger.bodyActivity.length
      };
      for (const key of Object.keys(counts) as Array<keyof typeof counts>) {
        assert(Number.isInteger(counts[key]));
        assert(counts[key] >= previous[key]);
        assert(counts[key] <= totals[key]);
      }
      previous = counts;
    }
    assert.equal(
      entry.ledger.producerCalls.length,
      index === 0 ? variant === 'first' ? 607 : 619 : variant === 'first' ? 634 : 646
    );
    assert.equal(entry.cleanup.owner.alive, false);
    assert.equal(entry.cleanup.popupCount, 0);
    assert.equal(entry.cleanup.ownerCount, 0);
    assert(Object.values(entry.cleanup.refs).every(Boolean));
    assert(entry.cleanup.retainedConnected.every(node => !node.connected));
    assert.deepEqual(entry.cleanup.browserOwnedResourceCounters, counters);
    assert.deepEqual(entry.cleanup.resourceTiming, []);
    sameLiteral(
      entry.cleanup.owner.events,
      entry.ledger.events,
      'Actual Source removal produces no new public event'
    );
    sameLiteral(
      entry.cleanup.owner.rawEvents,
      entry.ledger.rawEvents,
      'Actual Source removal raw events unchanged'
    );
    sameLiteral(
      entry.cleanup.owner.calls,
      entry.ledger.producerCalls,
      'Actual Source removal producer ledger unchanged'
    );
    sameLiteral(
      entry.late,
      entry.cleanup,
      'Whole actual removal observations remain quiet at1000ms'
    );
  }
  return source;
}
export function validateResponsiveTagPrefixSSR(
  source: ResponsiveTagPrefixSource<ResponsiveTagPrefixSSRCase>,
  variant: ResponsiveTagPrefixVariant = 'first'
) {
  selection('ssr', variant);
  sourceHeader(source.reference, 'ssr', variant);
  assert.deepEqual(
    source.cases.map(entry => entry.id),
    selectCustomTagPrefixSamples.map(sample => sample.id)
  );
  for (const [index, entry] of source.cases.entries()) {
    assert.deepEqual(entry.sample, selectCustomTagPrefixSamples[index]);
    assert.deepEqual(entry.server.diagnostics, []);
    assert.deepEqual(
      Object.keys(entry.server.serializations),
      ['renderToString', 'renderToStaticMarkup']
    );
    for (const state of Object.values(entry.server.serializations)) {
      assert.equal(state.fatal, null);
      assert.equal(state.domFree, true);
      assert.equal(hash(state.rawHtml), state.htmlSha256);
      assert.deepEqual(state.resources, SSRresources);
      assert.deepEqual(
        state.messageChannelEnvironment,
        { availableDuringUMDLoad: false, forbiddenDuringRender: true }
      );
      assert.deepEqual(
        state.refs,
        { control: true, root: true, editor: true, authoredRoot: true, authoredInput: true }
      );
      assert.deepEqual(state.state.events, []);
      assert.deepEqual(state.state.rawEvents, []);
      assert.deepEqual(state.state.lifecycle, []);
      const tags = state.state.calls.filter(call => call.kind === 'tagRender');
      assert.equal(tags.length, 1);
      assert.equal(
        readResponsiveTagPrefixSourceInfo(tags[0]).isMaxTag,
        true,
        'Actual SSR invokes the separate rest producer with own undefined keys'
      );
    }
  }
  return source;
}
export function verifyResponsiveTagPrefixDecodedBytes(
  decoded: Uint8Array,
  mode: ResponsiveTagPrefixMode,
  variant: ResponsiveTagPrefixVariant
) {
  selection(mode, variant);
  const expected = rawPins[mode][variant];
  assert.equal(decoded.length, expected.bytes, 'Full independently captured decoded bytes');
  assert.equal(hash(decoded), expected.sha256, 'Full independently captured decoded SHA');
  return expected;
}
let csrCache: {
  variant: ResponsiveTagPrefixVariant;
  source: ResponsiveTagPrefixSource<ResponsiveTagPrefixCSRCase>
} | undefined;
let ssrCache: ResponsiveTagPrefixSource<ResponsiveTagPrefixSSRCase> | undefined;
function decodedSource(mode: ResponsiveTagPrefixMode, variant: ResponsiveTagPrefixVariant) {
  selection(mode, variant);
  readSelectComponentsResponsiveTagPrefixPairProof();
  const copy = storedPins[mode][variant];
  const stored = readFileSync(fixture(copy.path));
  assert.equal(stored.length, copy.storageBytes);
  assert.equal(hash(stored), copy.storageSha256);
  const decoded = gunzipSync(stored);
  verifyResponsiveTagPrefixDecodedBytes(decoded, mode, variant);
  return decoded.toString('utf8');
}
export function readSelectComponentsResponsiveTagPrefixCSR(variant: ResponsiveTagPrefixVariant = 'first') {
  selection('csr', variant);
  if (csrCache?.variant === variant) {
    return csrCache.source;
  }
  const source = validateResponsiveTagPrefixCSR(
    JSON.parse(decodedSource('csr', variant)) as ResponsiveTagPrefixSource<ResponsiveTagPrefixCSRCase>,
    variant
  );
  csrCache = { variant, source };
  return source;
}
export function readSelectComponentsResponsiveTagPrefixSSR(variant: ResponsiveTagPrefixVariant = 'first') {
  selection('ssr', variant);
  if (ssrCache) {
    sourceHeader(ssrCache.reference, 'ssr', variant);
    return ssrCache;
  }
  const source = validateResponsiveTagPrefixSSR(
    JSON.parse(decodedSource('ssr', variant)) as ResponsiveTagPrefixSource<ResponsiveTagPrefixSSRCase>,
    variant
  );
  return ssrCache = source;
}
export function readSelectComponentsResponsiveTagPrefixCase(
  id: string,
  variant: ResponsiveTagPrefixVariant = 'first'
) {
  assert(
    selectCustomTagPrefixSamples.some(sample => sample.id === id),
    'Unknown independently measured Source owner'
  );
  return readSelectComponentsResponsiveTagPrefixCSR(variant).cases.find(entry => entry.id === id)!;
}
/** Retain/verify the full second CSR corpus without retaining two147MB decoded
 * graphs in every package/browser worker. The pinned paired proof covers every
 * raw field; both compressed and decoded repeat bytes are independently checked. */
export async function verifySelectComponentsResponsiveTagPrefixRepeatArchive(mode: ResponsiveTagPrefixMode = 'csr') {
  selection(mode, 'repeat');
  readSelectComponentsResponsiveTagPrefixPairProof();
  const copy = storedPins[mode].repeat;
  const storedHash = createHash('sha256');
  let storageBytes = 0;
  for await (const chunk of createReadStream(fixture(copy.path))) {
    storageBytes += chunk.length;
    storedHash.update(chunk);
  }
  assert.equal(storageBytes, copy.storageBytes);
  assert.equal(storedHash.digest('hex'), copy.storageSha256);
  const decodedHash = createHash('sha256');
  let decodedBytes = 0;
  for await (const chunk of createReadStream(fixture(copy.path)).pipe(createGunzip())) {
    decodedBytes += chunk.length;
    decodedHash.update(chunk);
  }
  assert.equal(decodedBytes, rawPins[mode].repeat.bytes);
  assert.equal(decodedHash.digest('hex'), rawPins[mode].repeat.sha256);
  return {
    mode,
    variant: 'repeat' as const,
    wholePairByteEqual: mode === 'ssr',
    storageBytes,
    decodedBytes,
    decodedSha256: rawPins[mode].repeat.sha256
  };
}
