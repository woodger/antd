import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type { ResponsiveTagPrefixRawGraph as RawGraph, ResponsiveTagPrefixDescriptor as Descriptor,
  ResponsiveTagPrefixProducerCall as ProducerCall } from './select-components-responsive-tag-prefix-reference';

export type { RawGraph as TagCloseHandleRawGraph, ProducerCall as TagCloseHandleProducerCall };
export type TagCloseHandleMode = 'csr' | 'ssr';
interface Pin { bytes: number; sha256: string }
interface PathPin extends Pin { path: string }
export type TagCloseHandleAction =
  | { id: string; type: 'invoke'; from: 'latest' | 'retained'; value: string; slot?: string; saveAs?: string; reason: string }
  | { id: string; type: 'retain'; from: 'latest'; value: string; slot: string; reason: string }
  | { id: string; type: 'model' | 'enable-reset'; value: string[] }
  | { id: string; type: 'disabled'; value: boolean }
  | { id: string; type: 'options'; phase: string };
export interface TagCloseHandleSample {
  id: string; mode: 'multiple' | 'tags'; initialModel: string[];
  initialOptions: Array<{ key: string; value: string; label: string; disabled?: boolean; marker: string }>;
  replacementOptions: TagCloseHandleSample['initialOptions']; retentionSetup: Extract<TagCloseHandleAction, { type: 'retain' }> | null;
  actions: TagCloseHandleAction[];
}
export interface TagCloseHandle {
  value: string; infoIdentity: number; callbackIdentity: number; info: unknown; rawInfo: RawGraph;
  callback: unknown; rawCallback: RawGraph; callbackOwnKeys: string[]; callbackDescriptors: Descriptor[];
  sameInfoAsLastProduced: boolean; sameCallbackAsLastProduced: boolean; callbackIsInfoOnClose: boolean;
}
export interface TagCloseHandleInvocation {
  actionIndex: number; id: string; reason: string; from: 'latest' | 'retained'; slot?: string; handle: TagCloseHandle;
  actualArgumentCount: number; arguments: unknown; rawArguments: RawGraph; eventCountBefore: number; eventCountAfter: number;
  result: unknown; rawResult: RawGraph; thrown: unknown;
}
interface Retention { actionIndex: number; id: string; reason: string; slot: string; handle: TagCloseHandle; savedExactInvokedFunction?: boolean }
interface Lifecycle { event: 'attach' | 'detach'; tag: string | null }
interface BodyActivity { info: unknown; rawInfo: RawGraph }
export interface TagCloseHandleSourceOwner {
  model: unknown; rawModel: RawGraph; options: unknown; rawOptions: RawGraph;
  modelIdentity: number; optionsIdentity: number; optionIdentities: Array<{ value: string; identity: number }>;
  disabled: boolean; open: boolean; alive: boolean; actionIndex: number;
  events: unknown[]; rawEvents: RawGraph[]; calls: ProducerCall[]; invocations: TagCloseHandleInvocation[];
  retention: Retention[]; lifecycle: Lifecycle[]; bodyActivity: BodyActivity[];
  lastProducedInvocableHandles: Array<TagCloseHandle & { currentlySelected: boolean }>;
  retainedHandles: Array<TagCloseHandle & { slot: string; currentlySelected: boolean }>;
  authoredSample: unknown; rawAuthoredSample: RawGraph; authoredProps: unknown; rawAuthoredProps: RawGraph;
  authoredProvider: unknown; rawAuthoredProvider: RawGraph;
}
interface BrowserCounters { measured: false; observers: null; mutations: null; frames: null; timers: null; ports: null }
export interface TagCloseHandleDOMNode {
  identity: number; tag: string; connected: boolean; parentIdentity: number | null;
  attributes: string[][]; html: string; styleAttribute: string | null; cssText: string;
  inlineProperties: Array<{ name: string; value: string; priority: string }>; css: Record<string, string>;
  box: { x: number; y: number; width: number; height: number }; metrics: Record<string, number | null>;
  value: unknown; defaultValue: unknown; selection: [number | null, number | null, string | null] | null;
  focused: boolean; textContent: string; childNodes: Array<{ identity: number; type: number; name: string; text: string | null }>;
}
export interface TagCloseHandleDOM {
  root: TagCloseHandleDOMNode | null; editor: TagCloseHandleDOMNode | null; sameRoot: boolean; sameEditor: boolean; publicRootMatches: boolean;
  tags: TagCloseHandleDOMNode[]; buttons: TagCloseHandleDOMNode[]; allRootElements: TagCloseHandleDOMNode[];
  activeElement: { identity: number; tag: string; connected: boolean; attributes: string[][] } | null;
  popupCount: number; ownerCount: number; browserOwnedResourceCounters: BrowserCounters; resourceTiming: unknown[];
}
export interface TagCloseHandleSourcePoint {
  dom: TagCloseHandleDOM;
  owner: Omit<TagCloseHandleSourceOwner, 'events' | 'rawEvents' | 'calls' | 'invocations' | 'retention' | 'lifecycle' | 'bodyActivity'> & {
    eventCount: number; rawEventCount: number; producerCount: number; invocationCount: number; retentionCount: number; lifecycleCount: number; bodyActivityCount: number };
}
export interface TagCloseHandleSourceLedger {
  events: unknown[]; rawEvents: RawGraph[]; producerCalls: ProducerCall[]; invocations: TagCloseHandleInvocation[];
  retention: Retention[]; lifecycle: Lifecycle[]; bodyActivity: BodyActivity[];
}
export interface TagCloseHandleSourceCleanup {
  owner: TagCloseHandleSourceOwner; retainedConnected: Array<{ identity: number; connected: boolean; ownedAtFirstObservation: boolean }>;
  ownerCount: number; popupCount: number; refs: Record<'control' | 'root' | 'editor', boolean>;
  browserOwnedResourceCounters: BrowserCounters; resourceTiming: unknown[];
}
export interface SourceCSRCase {
  id: string; sample: TagCloseHandleSample;
  setup: { action: TagCloseHandleAction; actualButtonInvocations: number; before: TagCloseHandleSourcePoint; after: TagCloseHandleSourcePoint } | null;
  initial: TagCloseHandleSourcePoint; steps: Array<TagCloseHandleSourcePoint & { action: TagCloseHandleAction }>;
  callerButtonInvocations: Array<{ actionId: string; index: number }>; ledger: TagCloseHandleSourceLedger;
  cleanup: TagCloseHandleSourceCleanup; late: TagCloseHandleSourceCleanup; failure: unknown; observationErrors: unknown[];
  network: { requests: unknown[]; requestFailures: unknown[]; responses: Array<{ url: string; status: number }> };
}
export interface TagCloseHandleSSRSerialization {
  rawHtml: string; htmlSha256: string; state: TagCloseHandleSourceOwner; refs: TagCloseHandleSourceCleanup['refs'];
  resources: Record<'timers' | 'frames' | 'measurements' | 'microtasks' | 'ports', number>; fatal: unknown; domFree: boolean;
  messageChannelEnvironment: { availableDuringUMDLoad: boolean; forbiddenDuringRender: boolean };
}
export interface SourceSSRCase {
  id: string; sample: TagCloseHandleSample;
  server: { serializations: Record<'renderToString' | 'renderToStaticMarkup', TagCloseHandleSSRSerialization>; diagnostics: unknown[] };
}
interface Counts { owners: number; actions: number; logicalInitialAndActionPoints: number; retentionSetupButtonInvocations: number;
  totalCallerButtonInvocations: number; uniqueInitialSSRStates: number; initialSSRSerializations: number }
export interface TagCloseHandleSourceHeader {
  kind: string; mode: TagCloseHandleMode; version: string; react: string; rcSelect: string; revision: string; node: string; chromium: string | null;
  protocolSha256: string; inputPins: Record<string, Pin>; errors: unknown[]; diagnostics: unknown[]; actualCounts: Counts;
  plannedScopeCounts: Counts; browserOwnedResourceCounters: BrowserCounters; assertions: string;
}
export interface TagCloseHandleSource<Value> { reference: TagCloseHandleSourceHeader; cases: Value[] }
export interface TagCloseHandleManifest {
  status: string; sourceOnly: boolean; NativeDataUsed: boolean;
  protocol: { source: PathPin; fixture: PathPin; byteEqual: boolean }; captureReview: TagCloseHandleManifest['protocol'];
  copies: Record<TagCloseHandleMode, { path: string; storageBytes: number; storageSha256: string; decodedBytes: number; decodedSha256: string;
    wholePairByteEqual: boolean; provenance: Record<'first' | 'repeat', PathPin> }>;
  headers: Record<TagCloseHandleMode, TagCloseHandleSourceHeader>; actualCounts: Record<TagCloseHandleMode, Counts>;
  plannedScope: { owners: number; actionsPerOwner: number; modelAndCallbackActions: number; logicalInitialAndActionPoints: number;
    retentionSetupButtonInvocations: number; totalCallerButtonInvocations: number; uniqueInitialSSRStates: number; initialSSRSerializationsPerRun: number };
  preservation: { frozenInputs: number; oldReferences: number; wholeHistoricalStandTrees: number; verifiedBeforeAndAfter: boolean;
    allFourOriginalRawCapturesUnchanged: boolean; historicalReports: Record<string, PathPin & { status: string }> };
  diagnostics: { csr: { errors: number; diagnostics: number }; ssr: { errors: number; diagnostics: number }; message: string; reason: string };
  resources: { browserOwnedResourceCounters: BrowserCounters; actualSSRForbiddenCounters: TagCloseHandleSSRSerialization['resources'] };
  serialization: { format: string; level: number; losslessWholeRawBytes: boolean; fieldsDropped: string[]; rewrittenValues: string[];
    normalizedSourceFields: string[]; onePortablePerModeBecauseBothIndependentRawCapturesAreWholeByteEqual: boolean };
}
interface Protocol { status: string; source: { version: string; react: string; rcSelect: string; revision: string; node: string; chromium: string };
  inputPins: Record<string, Pin>; preservedReferences: Record<string, Pin>; priorProduction: Record<string, unknown>; samples: TagCloseHandleSample[] }
const prefix = 'ant-design-select-components-tag-close-handles-';
const sourceBase = '.upstream/artifacts/select-components-tag-close-handles-source-v1/';
const protocolSHA = 'b1678a2f9ea70c1b9cff69534e0f36348ba6eec90b4087f24832ba5543b6eb96';
const hash = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
const fixture = (name: string) => new URL('./fixtures/' + name, import.meta.url);
const equalLiteral = (actual: unknown, expected: unknown, label: string) => assert.equal(JSON.stringify(actual), JSON.stringify(expected), label);
const tagKeys = ['label', 'value', 'index', 'disabled', 'closable', 'onClose', 'isMaxTag'];
const undefinedValue = { $: 'undefined' };
const counters = { measured: false, observers: null, mutations: null, frames: null, timers: null, ports: null } as const;
const resources = { timers: 0, frames: 0, measurements: 0, microtasks: 0, ports: 0 };
const rawPins = {
  csr: { bytes: 21000790, sha256: '5e774df2b534a29e49a8beaf3938f37519abfa261153709393699bfe47acc179', storageBytes: 607773, storageSha256: '3a7f98b08b5741cc7d7f976df7f39979de333d82ed576510d64fd07ded5146ff' },
  ssr: { bytes: 1519632, sha256: '30146c5c2f432346fb6d98cf7c0c048502ae8a8860c57f5a282c06666f378030', storageBytes: 47563, storageSha256: '2ef5f431f4cc0e73e1623e70052078fcb1877c49c20aec2f112bac994eeef2bd' }
};
const ownedIds = ['select-close-handles-nonclosable', 'select-close-handles-retained'];
let manifestCache: TagCloseHandleManifest | undefined, protocolCache: Protocol | undefined;
export function readSelectTagCloseHandlesManifest() {
  if (manifestCache) return manifestCache;
  const bytes = readFileSync(fixture(prefix + 'source-manifest.json'));
  assert.equal(bytes.length, 23525); assert.equal(hash(bytes), '10be72298454dad04a9bfbf32e678ffa72331abbced70103341433c471fd3e4d');
  const manifest = JSON.parse(bytes.toString('utf8')) as TagCloseHandleManifest;
  assert.equal(manifest.status, 'passed-source-only-complete-pairs-byte-equal'); assert(manifest.sourceOnly); assert.equal(manifest.NativeDataUsed, false);
  const protocolBytes = readFileSync(fixture(prefix + 'source-protocol.json'));
  assert.equal(protocolBytes.length, 513946); assert.equal(hash(protocolBytes), protocolSHA);
  const protocol = JSON.parse(protocolBytes.toString('utf8')) as Protocol;
  assert.equal(protocol.status, 'frozen-after-root-review-before-source-measurement');
  assert.equal(Object.keys(protocol.inputPins).length, 26); assert.equal(Object.keys(protocol.preservedReferences).length, 1503);
  assert.equal(Object.keys(protocol.priorProduction).length, 12); assert.deepEqual(protocol.samples.map(sample => sample.id), ownedIds);
  assert.equal(manifest.protocol.byteEqual, true); assert.equal(manifest.protocol.source.path, sourceBase + 'protocol-freeze.json');
  assert.deepEqual(manifest.protocol.fixture, { path: prefix + 'source-protocol.json', bytes: 513946, sha256: protocolSHA });
  const review = readFileSync(fixture(prefix + 'capture-review.json'));
  assert.equal(review.length, 85967); assert.equal(hash(review), '54486a8c288b9473d4ae509134d0c4c901d260816306bf900705bd1a512a67cd');
  assert.equal(manifest.captureReview.byteEqual, true); assert.equal(manifest.captureReview.fixture.sha256, hash(review));
  assert.equal(manifest.preservation.frozenInputs, 26); assert.equal(manifest.preservation.oldReferences, 1503); assert.equal(manifest.preservation.wholeHistoricalStandTrees, 12);
  assert(manifest.preservation.verifiedBeforeAndAfter && manifest.preservation.allFourOriginalRawCapturesUnchanged);
  assert.deepEqual(manifest.resources, { browserOwnedResourceCounters: counters, actualSSRForbiddenCounters: resources });
  assert.deepEqual(manifest.serialization, { format: 'gzip', level: 9, losslessWholeRawBytes: true, fieldsDropped: [], rewrittenValues: [], normalizedSourceFields: [],
    onePortablePerModeBecauseBothIndependentRawCapturesAreWholeByteEqual: true });
  for (const mode of ['csr', 'ssr'] as const) {
    const copy = manifest.copies[mode], expected = rawPins[mode]; assert(copy.wholePairByteEqual);
    assert.equal(copy.path, prefix + (mode === 'csr' ? 'reference.json.gz' : 'ssr-reference.json.gz'));
    assert.equal(copy.storageBytes, expected.storageBytes); assert.equal(copy.storageSha256, expected.storageSha256);
    assert.equal(copy.decodedBytes, expected.bytes); assert.equal(copy.decodedSha256, expected.sha256);
    for (const variant of ['first', 'repeat']) assert.deepEqual(copy.provenance[variant as 'first' | 'repeat'], {
      path: sourceBase + mode + '-source-' + variant + '.json', bytes: expected.bytes, sha256: expected.sha256 });
  }
  protocolCache = protocol; return manifestCache = manifest;
}
function object(value: unknown, label: string): Record<string, unknown> {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value), label); return value as Record<string, unknown>;
}
function properties(value: unknown, kind: string) {
  const encoded = object(value, 'Actual Source encoded value'); assert.equal(encoded.$, kind); assert(Array.isArray(encoded.properties));
  return encoded.properties as Array<{ key: string; value: unknown }>;
}
export function readTagCloseHandleSourceArray(value: unknown) {
  const rows = properties(value, 'array'); assert.equal(rows.at(-1)?.key, 'length'); assert.equal(rows.at(-1)?.value, rows.length - 1);
  assert.deepEqual(rows.slice(0, -1).map(row => row.key), rows.slice(0, -1).map((_row, index) => String(index)));
  return rows.slice(0, -1).map(row => row.value);
}
function rawNode(graph: RawGraph, reference: unknown) {
  const ref = object(reference, 'Actual raw Source reference'); assert.equal(typeof ref.ref, 'number');
  const node = graph.objects.find(node => node.id === ref.ref); assert(node, 'Recorded Source node must exist'); return node;
}
function rawProperty(graph: RawGraph, reference: unknown, key: string) {
  return rawNode(graph, reference).properties?.find(property => property.key === key)?.value;
}
function verifyCallback(graph: RawGraph, reference: unknown) {
  const node = rawNode(graph, reference); assert.equal(node.type, 'function');
  assert.deepEqual(node.properties?.map(row => row.key), ['length', 'name']);
  assert.equal(rawProperty(graph, reference, 'length'), 1, 'Actual onClose arity'); assert.equal(rawProperty(graph, reference, 'name'), 'onClose');
}
export function readTagCloseHandleSourceInfo(call: ProducerCall) {
  assert.equal(call.kind, 'tagRender'); assert.equal(call.side, 'own'); assert.equal(call.argumentCount, 1);
  assert.deepEqual(call.argumentOwnKeys, [tagKeys]); const args = readTagCloseHandleSourceArray(call.argument); assert.equal(args.length, 1);
  const rows = properties(args[0], 'object'); assert.deepEqual(rows.map(row => row.key), tagKeys, 'Exact own undefined keys and order');
  const info = Object.fromEntries(rows.map(row => [row.key, row.value]));
  const descriptors = call.argumentDescriptors?.[0]; assert(descriptors); assert.equal(call.argumentDescriptors!.length, 1);
  assert.deepEqual(descriptors.map(row => row.key), tagKeys); assert(descriptors.every(row => row.enumerable && row.configurable && row.writable && row.kind === 'value'));
  const rawInfo = rawProperty(call.rawArgument, call.rawArgument.root, '0'), node = rawNode(call.rawArgument, rawInfo);
  assert.deepEqual(node.properties?.map(row => row.key), tagKeys); assert.deepEqual(node.ownProperties, descriptors);
  assert.equal(typeof info.isMaxTag, 'boolean'); assert.equal(typeof info.closable, 'boolean');
  if (info.isMaxTag) {
    for (const key of ['value', 'index', 'onClose']) { assert.deepEqual(info[key], undefinedValue); assert.equal(descriptors.find(row => row.key === key)?.valueType, 'undefined'); }
    assert.equal(info.disabled, false); assert.equal(info.closable, false);
  } else {
    assert.equal(typeof info.value, 'string'); assert.equal(typeof info.index, 'number');
    if (info.disabled !== true) assert.deepEqual(info.disabled, undefinedValue);
    assert.equal(object(info.onClose, 'Actual function metadata').name, 'onClose');
    verifyCallback(call.rawArgument, rawProperty(call.rawArgument, rawInfo, 'onClose'));
  }
  const props = rawProperty(call.rawResult, call.rawResult.root, 'props');
  assert.deepEqual(rawProperty(call.rawResult, props, 'info'), rawInfo, 'Returned ReactElement carries the exact original info alias');
  return info;
}
function header(actual: TagCloseHandleSourceHeader, mode: TagCloseHandleMode) {
  const manifest = readSelectTagCloseHandlesManifest(); equalLiteral(actual, manifest.headers[mode], 'Full actual Source header/order');
  assert.equal(actual.kind, 'Original-public-tag-render-close-handles'); assert.equal(actual.mode, mode);
  assert.equal(actual.version, '6.6.8'); assert.equal(actual.react, '18.3.1'); assert.equal(actual.rcSelect, '1.10.1');
  assert.equal(actual.revision, '984592267de88fbf9cdaecc96a56629e721c709d'); assert.equal(actual.node, 'v24.18.0');
  assert.equal(actual.chromium, mode === 'csr' ? '157.0.8103.78' : null); assert.equal(actual.protocolSha256, protocolSHA);
  equalLiteral(actual.inputPins, protocolCache!.inputPins, 'All frozen Source inputs/order');
  assert.deepEqual(actual.errors, []); assert.equal(actual.diagnostics.length, mode === 'csr' ? 1 : 2);
  assert.deepEqual(actual.browserOwnedResourceCounters, counters); assert.deepEqual(actual.actualCounts, manifest.actualCounts[mode]);
}
export function validateSelectTagCloseHandlesCSR(source: TagCloseHandleSource<SourceCSRCase>) {
  header(source.reference, 'csr'); assert.deepEqual(source.cases.map(row => row.id), ownedIds);
  for (const [index, entry] of source.cases.entries()) {
    const sample = protocolCache!.samples[index]; assert.deepEqual(entry.sample, sample); assert.equal(entry.failure, null); assert.deepEqual(entry.observationErrors, []);
    assert.deepEqual(entry.network, { requests: [], requestFailures: [], responses: [] });
    assert.equal(entry.steps.length, 6); assert.deepEqual(entry.steps.map(step => step.action), sample.actions);
    assert.equal(entry.callerButtonInvocations.length, index ? 7 : 6);
    if (sample.retentionSetup) { assert(entry.setup); assert.deepEqual(entry.setup.action, sample.retentionSetup); assert.equal(entry.setup.actualButtonInvocations, 1); equalLiteral(entry.setup.after, entry.initial, 'Real post-setup initial point'); }
    else assert.equal(entry.setup, null);
    assert.equal(entry.ledger.rawEvents.length, entry.ledger.events.length);
    for (const call of entry.ledger.producerCalls) if (call.kind === 'tagRender') readTagCloseHandleSourceInfo(call);
    for (const invocation of entry.ledger.invocations) {
      const handle = invocation.handle; assert(handle.callbackIsInfoOnClose); verifyCallback(handle.rawCallback, handle.rawCallback.root);
      assert.equal(object(handle.rawInfo.root, 'Actual info identity').ref, handle.infoIdentity);
      assert.equal(object(handle.rawCallback.root, 'Actual callback identity').ref, handle.callbackIdentity);
      assert.deepEqual(rawNode(handle.rawCallback, handle.rawCallback.root).ownProperties, handle.callbackDescriptors);
      assert.deepEqual(handle.callbackOwnKeys, ['length', 'name']);
      assert.deepEqual(handle.rawCallback.root, rawProperty(handle.rawInfo, handle.rawInfo.root, 'onClose'), 'Actual retained function/info alias');
      assert.equal(invocation.actualArgumentCount, 1); assert.deepEqual(readTagCloseHandleSourceArray(invocation.arguments), [undefinedValue]);
      assert.deepEqual(rawNode(invocation.rawArguments, invocation.rawArguments.root).properties?.map(row => row.key), ['0', 'length']);
      assert.deepEqual(rawProperty(invocation.rawArguments, invocation.rawArguments.root, '0'), undefinedValue);
      assert.equal(rawProperty(invocation.rawArguments, invocation.rawArguments.root, 'length'), 1);
      assert.deepEqual(invocation.result, undefinedValue); assert.equal(invocation.thrown, null);
    }
    for (const point of [entry.initial, ...entry.steps]) {
      assert(point.owner.alive); assert(point.dom.root?.connected && point.dom.editor?.connected);
      assert(point.dom.sameRoot && point.dom.sameEditor); assert.equal(point.dom.publicRootMatches, true, 'Source ref observation only');
      assert.deepEqual(point.dom.browserOwnedResourceCounters, counters);
      assert(point.owner.eventCount <= entry.ledger.events.length && point.owner.producerCount <= entry.ledger.producerCalls.length);
    }
    assert.equal(entry.cleanup.owner.alive, false); assert.equal(entry.cleanup.ownerCount, 0); assert.equal(entry.cleanup.popupCount, 0);
    assert(Object.values(entry.cleanup.refs).every(Boolean));
    assert(entry.cleanup.retainedConnected.filter(node => node.ownedAtFirstObservation).every(node => !node.connected));
    assert(entry.cleanup.retainedConnected.some(node => !node.ownedAtFirstObservation && node.connected), 'Unowned document nodes stay in raw cleanup');
    assert.deepEqual(entry.cleanup.browserOwnedResourceCounters, counters);
    equalLiteral(entry.cleanup.owner.events, entry.ledger.events, 'Actual cleanup events');
    equalLiteral(entry.cleanup.owner.calls, entry.ledger.producerCalls, 'Actual cleanup producers');
    equalLiteral(entry.late, entry.cleanup, 'Whole actual Source late1000ms observation');
  }
  return source;
}
export function validateSelectTagCloseHandlesSSR(source: TagCloseHandleSource<SourceSSRCase>) {
  header(source.reference, 'ssr'); assert.deepEqual(source.cases.map(row => row.id), ownedIds);
  for (const [index, entry] of source.cases.entries()) {
    assert.deepEqual(entry.sample, protocolCache!.samples[index]); assert.equal(entry.server.diagnostics.length, index ? 2 : 0);
    assert.deepEqual(Object.keys(entry.server.serializations), ['renderToString', 'renderToStaticMarkup']);
    for (const state of Object.values(entry.server.serializations)) {
      assert.equal(state.fatal, null); assert(state.domFree); assert.equal(hash(state.rawHtml), state.htmlSha256);
      assert.deepEqual(state.resources, resources); assert.deepEqual(state.refs, { control: true, root: true, editor: true });
      assert.deepEqual(state.state.events, []); assert.deepEqual(state.state.invocations, []); assert.deepEqual(state.state.lifecycle, []);
      assert.deepEqual(state.messageChannelEnvironment, { availableDuringUMDLoad: false, forbiddenDuringRender: true });
      for (const call of state.state.calls) if (call.kind === 'tagRender') readTagCloseHandleSourceInfo(call);
    }
  }
  return source;
}
export function verifySelectTagCloseHandlesDecodedBytes(bytes: Uint8Array, mode: TagCloseHandleMode) {
  assert(mode === 'csr' || mode === 'ssr', 'Unknown measured Source mode'); const pin = rawPins[mode];
  assert.equal(bytes.length, pin.bytes, 'Decoded complete Source bytes'); assert.equal(hash(bytes), pin.sha256, 'Decoded complete Source SHA');
}
function decode(mode: TagCloseHandleMode) {
  const copy = readSelectTagCloseHandlesManifest().copies[mode], stored = readFileSync(fixture(copy.path));
  assert.equal(stored.length, copy.storageBytes); assert.equal(hash(stored), copy.storageSha256);
  const decoded = gunzipSync(stored); verifySelectTagCloseHandlesDecodedBytes(decoded, mode); return decoded.toString('utf8');
}
let csrCache: TagCloseHandleSource<SourceCSRCase> | undefined, ssrCache: TagCloseHandleSource<SourceSSRCase> | undefined;
/** Complete actual Source data; no Native-shaped expected projection. */
export function readSelectTagCloseHandlesCSR() {
  return csrCache ??= validateSelectTagCloseHandlesCSR(JSON.parse(decode('csr')) as TagCloseHandleSource<SourceCSRCase>);
}
export function readSelectTagCloseHandlesSSR() {
  return ssrCache ??= validateSelectTagCloseHandlesSSR(JSON.parse(decode('ssr')) as TagCloseHandleSource<SourceSSRCase>);
}
export function readSelectTagCloseHandlesCase(id: string): SourceCSRCase {
  assert(ownedIds.includes(id), 'Unknown measured Source owner'); return readSelectTagCloseHandlesCSR().cases.find(row => row.id === id)!;
}
export function readSelectTagCloseHandlesSSRCase(id: string): SourceSSRCase {
  assert(ownedIds.includes(id), 'Unknown measured Source owner'); return readSelectTagCloseHandlesSSR().cases.find(row => row.id === id)!;
}
