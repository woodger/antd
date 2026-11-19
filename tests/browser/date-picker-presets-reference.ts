import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type { DatePickerPresetAction, DatePickerPresetSample } from './date-picker-presets-cases.mjs';
import type { DatePickerPresetOwner, DatePickerPresetPoint, readDatePickerPresetsCleanup as readCapturedDatePickerPresetsCleanup } from './date-picker-presets-metrics.mjs';

export type DatePickerPresetsSourceMode = 'csr' | 'ssr';
export type DatePickerPresetsSourceVariant = 'first' | 'repeat';
interface Pin { bytes: number; sha256: string }
interface FilePin extends Pin { file: string }
export interface DatePickerPresetsSourcePart {
  rawJSONPart: FilePin & { gzipFile: string; gzipBytes: number; gzipSHA256: string };
}
interface CapturePin { source: FilePin; gzip: FilePin; fixture: string; header: DatePickerPresetsSourceHeader }
interface PortableManifest {
  format: string; sourceOnly: boolean; NativeDataUsed: boolean; axis: string;
  protocol: { source: FilePin; fixture: string }; execution: { source: FilePin; fixture: string }; witnesses: {
    source: FilePin;
    fixture: string
  };
  counts: {
    owners: number;
    CSRactions: number;
    CSRlogicalPoints: number;
    uniqueClosedSSRStates: number;
    actualClosedSSRSerializations: number
  };
  caseIds: string[]; captures: Record<DatePickerPresetsSourceMode, Record<DatePickerPresetsSourceVariant, CapturePin>>;
  parts: Record<string, { original: DatePickerPresetsSourcePart['rawJSONPart']; fixture: string }>;
  preservation: {
    frozenInputs: number;
    preservedReferences: number;
    inheritedSource: { wholeHistoricalStandTrees: number };
    thirteenthStand: { status: string }
  };
  serialization: Record<string, unknown>;
}
interface Protocol {
  status: string; axis: string; samples: DatePickerPresetSample[]; counts: PortableManifest['counts'];
  inputPins: Record<string, Pin>; preservedReferences: Record<string, Pin>;
}
export interface DatePickerPresetsSourceHeader {
  axis: string; mode: DatePickerPresetsSourceMode; version: string; react: string; revision: string;
  node: string; chromium: string | null; protocolSHA256: string; inputPins: Record<string, Pin>;
  errors: unknown[]; diagnostics: unknown[]; SourceBrowserOwnedResourceCounters: string;
  actual: {
    owners: number;
    actions: number;
    closedTransitions: number;
    closedSSRSerializations: number
  };
}
export interface DatePickerPresetsCaseMetadata {
  id: string; sample: DatePickerPresetSample; initial?: DatePickerPresetsSourcePart;
  steps?: DatePickerPresetsSourcePart[]; closed?: DatePickerPresetsSourcePart[];
  beforeUnmount?: DatePickerPresetsSourcePart; cleanup?: DatePickerPresetsSourcePart; late?: DatePickerPresetsSourcePart;
  server?: DatePickerPresetsSourcePart; failure?: null; observationErrors?: unknown[];
  network?: { requests: unknown[]; responses: unknown[]; failures: unknown[] };
}
export interface DatePickerPresetsSourceManifest {
  reference: DatePickerPresetsSourceHeader; cases: DatePickerPresetsCaseMetadata[];
  storage: string; cleanupFailures: string[];
}
export type DatePickerPresetsSourcePoint = DatePickerPresetPoint;
export interface DatePickerPresetsSourceStep {
  action: DatePickerPresetAction; actionEvidence: unknown;
  afterCall: DatePickerPresetsSourcePoint; actual: DatePickerPresetsSourcePoint;
}
export interface DatePickerPresetsSourceClosed {
  actionIndex: number; afterCall: DatePickerPresetsSourcePoint;
  settled: DatePickerPresetsSourcePoint; after1000: DatePickerPresetsSourcePoint;
}
export type DatePickerPresetsSourceCleanup = ReturnType<typeof readCapturedDatePickerPresetsCleanup>;
export interface DatePickerPresetsSSRSerialization {
  rawHtml: string; htmlSha256: string; state: DatePickerPresetOwner;
  environment: { timezone: string }; refs: Record<string, boolean>;
  resources: Record<'timers' | 'frames' | 'measurements' | 'microtasks' | 'ports', number>;
  fatal: null; domFree: boolean;
  messageChannelEnvironment: { availableDuringUMDLoad: boolean; forbiddenDuringRender: boolean };
}
export interface DatePickerPresetsSourceSSR {
  serializations: Record<'renderToString' | 'renderToStaticMarkup', DatePickerPresetsSSRSerialization>;
  diagnostics: unknown[];
}
const prefix = 'ant-design-date-picker-presets-';
const sourceBase = '.upstream/artifacts/date-picker-presets-source-v2/';
const protocolSHA = '04be9b4879445757027d99f383a3d3188c4190882cab0c449c1d6133b6873de6';
const portablePin = {
  bytes: 183041,
  sha256: 'fb2240cf0762dc123cb9e7b34b92725a88737ef75c7dbc66a78865d5df494160'
};
const ids = ['static-validity', 'lazy-hover-click', 'preview-false-and-switch', 'time-confirm-preset', 'controlled-rejection', 'custom-label-prefix'];
const expectedCounts = {
  owners: 6,
  CSRactions: 58,
  CSRlogicalPoints: 64,
  uniqueClosedSSRStates: 6,
  actualClosedSSRSerializations: 12
};
const counters = {
  measured: false,
  observers: null,
  mutations: null,
  frames: null,
  timers: null,
  ports: null
};
const hash = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex');
const fixture = (name: string) => new URL('./fixtures/' + name, import.meta.url);
const record = (value: unknown): Record<string, unknown> => {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value));
  return value as Record<string, unknown>;
};
const array = (value: unknown): unknown[] => {
  assert(Array.isArray(value));
  return value;
};
const readPinned = (name: string, expected: Pin) => {
  const bytes = readFileSync(fixture(name));
  assert.equal(bytes.length, expected.bytes, name + ' bytes');
  assert.equal(hash(bytes), expected.sha256, name + ' SHA-256');
  return bytes;
};
let metadata: { portable: PortableManifest; protocol: Protocol } | undefined;
function readMetadata() {
  if (metadata) return metadata;
  const portable = JSON.parse(readPinned(prefix + 'source-manifest.json', portablePin).toString('utf8')) as PortableManifest;
  assert.equal(portable.format, 'ant-design-single-date-picker-presets-source-v1');
  assert.equal(portable.sourceOnly, true);
  assert.equal(portable.NativeDataUsed, false);
  assert.deepEqual(portable.counts, expectedCounts);
  assert.deepEqual(portable.caseIds, ids);
  assert.deepEqual(portable.serialization, { lossless: true, fieldsDropped: [], fieldsRewritten: [], normalizedSourceFields: [],
    sourceExpectedValuesDerivedFromNative: false, oneCompletePartAtATime: true,
    wholeRawPartsDeduplicatedOnlyByStoredSHA256: true, wholeManifestByteEqualityClaimed: false });
  assert.equal(portable.protocol.source.file, sourceBase + 'protocol-freeze.json');
  assert.equal(portable.protocol.source.sha256, protocolSHA);
  const protocol = JSON.parse(readPinned(portable.protocol.fixture, portable.protocol.source).toString('utf8')) as Protocol;
  assert.equal(protocol.status, 'root-reviewed-frozen-before-Source-capture');
  assert.equal(protocol.axis, 'single-DatePicker-presets-previewValue');
  assert.equal(portable.axis, protocol.axis);
  assert.deepEqual(protocol.counts, expectedCounts);
  assert.equal(Object.keys(protocol.inputPins).length, 18);
  assert.equal(Object.keys(protocol.preservedReferences).length, 556);
  assert.equal(portable.preservation.frozenInputs, 18);
  assert.equal(portable.preservation.preservedReferences, 556);
  assert.equal(portable.preservation.inheritedSource.wholeHistoricalStandTrees, 12);
  assert.equal(portable.preservation.thirteenthStand.status, 'passed');
  const execution = JSON.parse(readPinned(portable.execution.fixture, portable.execution.source).toString('utf8'));
  assert.equal(execution.path, sourceBase + 'protocol-freeze.json');
  assert.equal(execution.sha256, protocolSHA);
  assert.equal(execution.bytes, portable.protocol.source.bytes);
  assert.deepEqual(
    portable.witnesses.source,
    {
      file: sourceBase + 'source-witnesses.json',
      ...protocol.inputPins[sourceBase + 'source-witnesses.json']
    }
  );
  readPinned(portable.witnesses.fixture, portable.witnesses.source);
  return metadata = { portable, protocol };
}
function scope(mode: DatePickerPresetsSourceMode, variant: DatePickerPresetsSourceVariant) {
  assert(['csr', 'ssr'].includes(mode), 'Unknown measured Source mode');
  assert(['first', 'repeat'].includes(variant), 'Unknown independent Source capture');
  return sourceBase + mode + '-source-' + variant + '.json';
}
/** Проверяет заголовок эталона без подмены исходных данных Svelte-формой. */
export function verifyDatePickerPresetsSourceHeader(
  header: DatePickerPresetsSourceHeader,
  mode: DatePickerPresetsSourceMode
) {
  const { protocol } = readMetadata();
  assert.equal(header.axis, protocol.axis);
  assert.equal(header.mode, mode);
  assert.equal(header.version, '6.6.8');
  assert.equal(header.react, '18.3.1');
  assert.equal(header.revision, '984592267de88fbf9cdaecc96a56629e721c709d');
  assert.equal(header.node, 'v24.18.0');
  assert.equal(header.chromium, mode === 'csr' ? '157.0.8103.78' : null);
  assert.equal(header.protocolSHA256, protocolSHA);
  assert.deepEqual(header.inputPins, protocol.inputPins);
  assert.deepEqual(header.errors, []);
  assert.deepEqual(header.diagnostics, []);
  assert.equal(header.SourceBrowserOwnedResourceCounters, 'unmeasured/null');
  assert.deepEqual(header.actual, mode === 'csr'
    ? { owners: 6, actions: 58, closedTransitions: 14, closedSSRSerializations: 0 }
    : { owners: 6, actions: 0, closedTransitions: 0, closedSSRSerializations: 12 });
}
/** Mapping обязан указывать на тот же целый raw, который записан в Source manifest. */
export function verifyDatePickerPresetsSourcePartBinding(reference: DatePickerPresetsSourcePart,
  mode: DatePickerPresetsSourceMode, variant: DatePickerPresetsSourceVariant) {
  const { portable } = readMetadata(), part = reference.rawJSONPart;
  assert(part && typeof part === 'object');
  assert(
    part.file.startsWith(scope(mode, variant) + '.parts/'),
    'Source part belongs to this exact capture'
  );
  assert.equal(part.gzipFile, part.file + '.gz');
  const mapping = portable.parts[part.file];
  assert(mapping, 'Every original Source part has an exact portable mapping');
  assert.deepEqual(part, mapping.original, 'Original complete raw part metadata');
  assert.match(mapping.fixture, /^ant-design-date-picker-presets-parts\/[a-f0-9]{64}\.json\.gz$/);
  assert.equal(
    mapping.fixture,
    'ant-design-date-picker-presets-parts/' + part.gzipSHA256 + '.json.gz'
  );
  return mapping;
}
export function verifyDatePickerPresetsSourceManifest(value: DatePickerPresetsSourceManifest,
  mode: DatePickerPresetsSourceMode, variant: DatePickerPresetsSourceVariant) {
  const { protocol } = readMetadata();
  scope(mode, variant);
  verifyDatePickerPresetsSourceHeader(value.reference, mode);
  assert.equal(value.storage, 'lossless-case-sections-v1');
  assert.deepEqual(value.cleanupFailures, []);
  assert.deepEqual(value.cases.map(item => item.id), ids);
  let actions = 0, closed = 0;
  for (const [index, item] of value.cases.entries()) {
    assert.equal(item.id, item.sample.id);
    assert.deepEqual(item.sample, protocol.samples[index]);
    if (mode === 'csr') {
      assert.equal(item.failure, null);
      assert.deepEqual(item.observationErrors, []);
      assert.deepEqual(item.network, { requests: [], responses: [], failures: [] });
      assert(item.initial && item.steps && item.closed && item.beforeUnmount && item.cleanup && item.late);
      assert.equal(item.steps.length, item.sample.actions.length);
      actions += item.steps.length;
      closed += item.closed.length;
      const bound = (part: DatePickerPresetsSourcePart, field: string) => {
        assert.equal(
          part.rawJSONPart.file,
          scope(mode, variant) + '.parts/' + item.id + '-' + field + '.json'
        );
        verifyDatePickerPresetsSourcePartBinding(part, mode, variant);
      };
      bound(item.initial, 'initial');
      bound(item.beforeUnmount, 'beforeUnmount');
      bound(item.cleanup, 'cleanup');
      bound(item.late, 'late');
      item.steps.forEach((part, index) => bound(part, 'steps-' + index));
      item.closed.forEach((part, index) => bound(part, 'closed-' + index));
      assert.equal(item.server, undefined);
    }
    else {
      assert(item.server);
      assert.equal(
        item.server.rawJSONPart.file,
        scope(mode, variant) + '.parts/' + item.id + '-server.json'
      );
      verifyDatePickerPresetsSourcePartBinding(item.server, mode, variant);
      assert.equal(item.initial, undefined);
      assert.equal(item.steps, undefined);
    }
  }
  assert.equal(actions, mode === 'csr' ? 58 : 0);
  assert.equal(closed, mode === 'csr' ? 14 : 0);
}
/** Загружает только небольшой manifest; snapshots никогда не кэшируются или склеиваются. */
export function readDatePickerPresetsManifest(mode: DatePickerPresetsSourceMode = 'csr',
  variant: DatePickerPresetsSourceVariant = 'first'): DatePickerPresetsSourceManifest {
  const { portable } = readMetadata(), original = scope(mode, variant), capture = portable.captures[mode][variant];
  assert.equal(capture.source.file, original);
  assert.equal(capture.gzip.file, original + '.gz');
  const decoded = gunzipSync(readPinned(capture.fixture, capture.gzip));
  assert.equal(decoded.length, capture.source.bytes);
  assert.equal(hash(decoded), capture.source.sha256);
  const value = JSON.parse(decoded.toString('utf8')) as DatePickerPresetsSourceManifest;
  assert.deepEqual(value.reference, capture.header);
  verifyDatePickerPresetsSourceManifest(value, mode, variant);
  return value;
}
export function readDatePickerPresetsCaseMetadata(id: string, mode: DatePickerPresetsSourceMode = 'csr',
  variant: DatePickerPresetsSourceVariant = 'first') {
  const value = readDatePickerPresetsManifest(mode, variant).cases.find(item => item.id === id);
  assert(value, 'Unknown measured DatePicker preset owner: ' + id);
  return value;
}
/** Читает полный raw одной части: все DOM/CSSOM, графы, descriptors и ledgers остаются исходными. */
export function readDatePickerPresetsPart(reference: DatePickerPresetsSourcePart,
  mode: DatePickerPresetsSourceMode = 'csr', variant: DatePickerPresetsSourceVariant = 'first'): unknown {
  const mapping = verifyDatePickerPresetsSourcePartBinding(reference, mode, variant), part = reference.rawJSONPart;
  const decoded = gunzipSync(readPinned(
    mapping.fixture,
    { bytes: part.gzipBytes, sha256: part.gzipSHA256 }
  ));
  assert.equal(decoded.length, part.bytes);
  assert.equal(hash(decoded), part.sha256);
  return JSON.parse(decoded.toString('utf8'));
}
export function datePickerPresetsEncodedArray(value: unknown): unknown[] {
  const input = record(value);
  assert.equal(input.$, 'array');
  const properties = array(input.properties).map(record);
  assert.equal(properties.at(-1)?.key, 'length');
  assert.equal(properties.at(-1)?.value, properties.length - 1);
  assert.deepEqual(
    properties.slice(0, -1).map(row => row.key),
    properties.slice(0, -1).map((_row, index) => String(index))
  );
  return properties.slice(0, -1).map(row => row.value);
}
export function datePickerPresetsRawRoot(value: unknown): Record<string, unknown> {
  const graph = record(value), reference = record(graph.root), nodes = array(graph.objects).map(record);
  assert(Number.isInteger(reference.ref));
  const node = nodes.find(item => item.id === reference.ref);
  assert(node);
  return node;
}
function rawProperty(graph: unknown, name: string) {
  return array(datePickerPresetsRawRoot(graph).properties).map(record).find(row => row.key === name)?.value;
}
function dateValue(value: unknown) {
  const snapshot = record(value);
  if (snapshot.temporal == null) {
    assert(snapshot.encoded == null || record(snapshot.encoded).$ === 'undefined');
    return;
  }
  const temporal = record(snapshot.temporal);
  assert.equal(temporal.isDayjs, true);
  assert.equal(temporal.valid, true);
  assert(typeof temporal.epoch === 'number');
  assert(Number.isFinite(temporal.epoch));
  assert.equal(new Date(temporal.epoch).toISOString(), temporal.iso);
  assert.equal(array(temporal.fields).length, 7);
  assert.equal(temporal.utcOffset, 0);
  assert.equal(snapshot.identity, datePickerPresetsRawRoot(snapshot.raw).id);
  array(snapshot.sameAsLazyReturns);
}
export function verifyDatePickerPresetsSourceOwner(value: DatePickerPresetOwner) {
  dateValue(value.value);
  assert.equal(value.events.length, value.rawEvents.length);
  assert.equal(value.events.length, value.callbackInvocations.length);
  const roots = new Set<unknown>();
  value.callbackInvocations.forEach((invocation, index) => {
    const args = datePickerPresetsEncodedArray(invocation.arguments);
    assert.equal(invocation.actualArgumentCount, args.length);
    assert.equal(rawProperty(invocation.rawArguments, 'length'), args.length);
    const root = datePickerPresetsRawRoot(invocation.rawArguments);
    assert.equal(root.array, true);
    assert(
      !roots.has(root.id),
      'Fresh callback argument arrays share the monotonic Source allocator'
    );
    roots.add(root.id);
    const event = datePickerPresetsEncodedArray(value.events[index]);
    assert.equal(event[0], invocation.name);
    assert.deepEqual(event.slice(1), args);
    if (invocation.name === 'clear') assert.equal(args.length, 0);
  });
  const lazy = value.lazyCalls.map(record);
  for (const call of lazy) {
    assert.equal(call.actualArgumentCount, 0);
    assert.deepEqual(datePickerPresetsEncodedArray(call.arguments), []);
    assert.equal(rawProperty(call.rawArgumentsObject, 'length'), 0);
    const root = datePickerPresetsRawRoot(call.rawArgumentsObject);
    assert.equal(root.array, false);
    assert.deepEqual(root.ownProperties, call.argumentOwnDescriptors);
    assert.deepEqual(call.argumentOwnDescriptors, [
      {
        key: 'length',
        enumerable: false,
        configurable: true,
        writable: true,
        kind: 'value',
        valueType: 'number'
      },
      {
        key: 'callee',
        enumerable: false,
        configurable: false,
        kind: 'accessor',
        get: true,
        set: true
      },
      {
        key: { symbol: null, description: 'Symbol.iterator' },
        enumerable: false,
        configurable: true,
        writable: true,
        kind: 'value',
        valueType: 'function'
      }
    ]);
    assert.deepEqual(call.receiver, { isUndefined: true, isNull: false, type: 'undefined' });
    dateValue(call.result);
    const snapshot = record(call.result), aliases = array(snapshot.sameAsLazyReturns);
    assert.equal(aliases.at(-1), true, 'Actual returned object is registered before its snapshot');
  }
  for (const item of value.callbackDates) {
    const callback = record(item), snapshot = record(callback.value);
    dateValue(snapshot);
    if (callback.name === 'calendar') {
      assert.deepEqual(callback.ownInfo, []);
      const info = record(callback.actualInfo);
      assert.equal(info.$, 'object');
      assert.deepEqual(info.properties, []);
      assert.deepEqual(datePickerPresetsRawRoot(callback.rawInfo).properties, []);
    }
    array(snapshot.sameAsLazyReturns).forEach((same, index) => {
      if (same) assert.equal(
        snapshot.identity,
        record(lazy[index].result).identity,
        'Actual callback preserves the recorded returned Dayjs alias'
      );
    });
  }
}
export function verifyDatePickerPresetsSourcePoint(value: DatePickerPresetsSourcePoint) {
  assert.equal(value.owner.alive, true);
  verifyDatePickerPresetsSourceOwner(value.owner);
  assert(value.root && value.input);
  assert.equal(value.root.connected, true);
  assert.equal(value.input.connected, true);
  assert.equal(value.sameRoot, true);
  assert.equal(value.sameInput, true);
  assert.equal(value.publicRef.controlPresent, true);
  assert.equal(value.publicRef.nativeElementIdentity, value.root.identity);
  assert.equal(value.input.attributes.find(([name]) => name === 'id')?.[1], 'preset-field');
  assert.deepEqual(value.browserOwnedResourceCounters, counters);
  assert.deepEqual(value.environment, { timezone: 'UTC' });
  assert.deepEqual(value.resourceTiming, []);
}
export function verifyDatePickerPresetsSourceCleanup(value: DatePickerPresetsSourceCleanup) {
  assert.equal(value.owner.alive, false);
  verifyDatePickerPresetsSourceOwner(value.owner);
  assert.deepEqual(value.refs, { control: true, root: true, owner: true });
  assert.equal(value.ownerCount, 0);
  assert.equal(value.popupCount, 0);
  assert(value.retained.some(node => node.owned));
  assert(value.retained.filter(node => node.owned).every(node => !node.connected));
  assert(value.retained.some(node => ['BODY', 'HTML'].includes(node.name) && !node.owned));
  assert.deepEqual(value.browserOwnedResourceCounters, counters);
  assert.deepEqual(value.resourceTiming, []);
}
export function readDatePickerPresetsInitial(
  id: string,
  variant: DatePickerPresetsSourceVariant = 'first'
) {
  const part = readDatePickerPresetsCaseMetadata(id, 'csr', variant).initial;
  assert(part);
  const value = readDatePickerPresetsPart(part, 'csr', variant) as DatePickerPresetsSourcePoint;
  verifyDatePickerPresetsSourcePoint(value);
  return value;
}
export function readDatePickerPresetsStep(
  id: string,
  index: number,
  variant: DatePickerPresetsSourceVariant = 'first'
) {
  const entry = readDatePickerPresetsCaseMetadata(id, 'csr', variant);
  assert(entry.steps);
  assert(
    Number.isInteger(index) && index >= 0 && index < entry.steps.length,
    'Measured Source action index'
  );
  const value = readDatePickerPresetsPart(entry.steps[index], 'csr', variant) as DatePickerPresetsSourceStep;
  assert.deepEqual(value.action, entry.sample.actions[index]);
  verifyDatePickerPresetsSourcePoint(value.afterCall);
  verifyDatePickerPresetsSourcePoint(value.actual);
  return value;
}
export function readDatePickerPresetsClosed(
  id: string,
  index: number,
  variant: DatePickerPresetsSourceVariant = 'first'
) {
  const entry = readDatePickerPresetsCaseMetadata(id, 'csr', variant);
  assert(entry.closed);
  assert(
    Number.isInteger(index) && index >= 0 && index < entry.closed.length,
    'Measured Source closed transition index'
  );
  const value = readDatePickerPresetsPart(entry.closed[index], 'csr', variant) as DatePickerPresetsSourceClosed;
  assert(Number.isInteger(value.actionIndex) && value.actionIndex >= 0 && value.actionIndex < entry.sample.actions.length);
  verifyDatePickerPresetsSourcePoint(value.afterCall);
  verifyDatePickerPresetsSourcePoint(value.settled);
  verifyDatePickerPresetsSourcePoint(value.after1000);
  assert.equal(value.settled.owner.open, false);
  assert.equal(value.after1000.owner.open, false);
  return value;
}
export function readDatePickerPresetsCleanup(
  id: string,
  phase: 'cleanup' | 'late' = 'cleanup',
  variant: DatePickerPresetsSourceVariant = 'first'
) {
  assert(phase === 'cleanup' || phase === 'late');
  const part = readDatePickerPresetsCaseMetadata(id, 'csr', variant)[phase];
  assert(part);
  const value = readDatePickerPresetsPart(part, 'csr', variant) as DatePickerPresetsSourceCleanup;
  verifyDatePickerPresetsSourceCleanup(value);
  return value;
}
export function readDatePickerPresetsSSR(
  id: string,
  variant: DatePickerPresetsSourceVariant = 'first'
) {
  const part = readDatePickerPresetsCaseMetadata(id, 'ssr', variant).server;
  assert(part);
  const value = readDatePickerPresetsPart(part, 'ssr', variant) as DatePickerPresetsSourceSSR;
  assert.deepEqual(Object.keys(value.serializations), ['renderToString', 'renderToStaticMarkup']);
  assert.deepEqual(value.diagnostics, []);
  for (const state of Object.values(value.serializations)) {
    assert.equal(typeof state.rawHtml, 'string');
    assert.equal(hash(state.rawHtml), state.htmlSha256);
    assert.equal(state.domFree, true);
    assert.equal(state.fatal, null);
    assert.deepEqual(state.environment, { timezone: 'UTC' });
    assert.deepEqual(state.refs, { control: true, root: true, owner: true });
    assert.deepEqual(
      state.resources,
      { timers: 0, frames: 0, measurements: 0, microtasks: 0, ports: 0 }
    );
    assert.deepEqual(
      state.messageChannelEnvironment,
      { availableDuringUMDLoad: false, forbiddenDuringRender: true }
    );
    verifyDatePickerPresetsSourceOwner(state.state);
    assert.equal(state.state.alive, false);
    assert.equal(state.state.open, false);
    assert.deepEqual(state.state.events, []);
    assert.deepEqual(state.state.lazyCalls, []);
    assert.deepEqual(state.state.lifecycle, []);
    assert.deepEqual(state.state.bodyActivity, []);
  }
  return value;
}
