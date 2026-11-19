import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { gunzipSync } from 'node:zlib';
import { datePickerPresetTransitionSamples } from './date-picker-preset-transitions-cases.mjs';
import type {
  DatePickerPresetTransitionAction, DatePickerPresetTransitionSample
} from './date-picker-preset-transitions-cases.mjs';
import type {
  DatePickerPresetTransitionsSourceOwner, DatePickerPresetTransitionsSourcePoint,
  DatePickerPresetTransitionsSourceCleanup, DatePickerPresetTransitionsSourceValue
} from './date-picker-preset-transitions-source-types';
export type {
  DatePickerPresetTransitionsSourceOwner, DatePickerPresetTransitionsSourcePoint,
  DatePickerPresetTransitionsSourceCleanup, DatePickerPresetTransitionsSourceValue
} from './date-picker-preset-transitions-source-types';

export type DatePickerPresetTransitionsSourceMode = 'csr' | 'ssr';
export type DatePickerPresetTransitionsSourceVariant = 'first' | 'repeat';
interface Pin { bytes: number; sha256: string }
interface FilePin extends Pin { file: string }
export interface DatePickerPresetTransitionsSourcePart {
  rawJSONPart: FilePin & { gzipFile: string; gzipBytes: number; gzipSHA256: string };
}
interface Counts {
  owners: number; actions: number; logicalPoints: number;
  uniqueInitialClosedSSRStates: number; initialClosedSSRSerializations: number;
}
interface CapturePin {
  source: FilePin; gzip: FilePin; fixture: string; header: DatePickerPresetTransitionsSourceHeader;
}
interface PortableManifest {
  format: string; sourceOnly: boolean; NativeDataUsed: boolean; axis: string;
  protocol: { source: FilePin; fixture: string };
  execution: { source: FilePin; fixture: string }; witnesses: { source: FilePin; fixture: string };
  counts: Counts; caseIds: string[];
  captures: Record<DatePickerPresetTransitionsSourceMode,
    Record<DatePickerPresetTransitionsSourceVariant, CapturePin>>;
  parts: Record<string, { original: DatePickerPresetTransitionsSourcePart['rawJSONPart'];
    fixture: string }>;
  preservation: { frozenInputs: number; inheritedSource: { sha256: string };
    preservedSourceV2Files: number };
  serialization: Record<string, unknown>;
  sharedCopies: Array<{ source: FilePin; target: string; transformation: string }>;
}
interface Protocol {
  status: string; axis: string; samples: DatePickerPresetTransitionSample[]; counts: Counts;
  inputPins: Record<string, Pin>; inheritedSource: { sha256: string };
  preservedSourceV2Tree: Record<string, Pin>; expectedOutcomes: null;
}
export interface DatePickerPresetTransitionsSourceHeader {
  axis: string; mode: DatePickerPresetTransitionsSourceMode; version: string; react: string;
  revision: string; node: string; chromium: string | null; protocolSHA256: string;
  inputPins: Record<string, Pin>; errors: unknown[]; diagnostics: unknown[];
  browserOwnedResourceCounters: string;
  actual: { owners: number; actions: number; logicalPoints: number; closedTransitions: number;
    initialClosedSSRSerializations: number };
}
export interface DatePickerPresetTransitionsCaseMetadata {
  id: string; sample: DatePickerPresetTransitionSample;
  initial?: DatePickerPresetTransitionsSourcePart; steps?: DatePickerPresetTransitionsSourcePart[];
  closed?: DatePickerPresetTransitionsSourcePart[]; beforeUnmount?: DatePickerPresetTransitionsSourcePart;
  cleanup?: DatePickerPresetTransitionsSourcePart; late?: DatePickerPresetTransitionsSourcePart;
  server?: DatePickerPresetTransitionsSourcePart; failure?: null; observationErrors?: unknown[];
  network?: { requests: unknown[]; responses: unknown[]; failures: unknown[] };
}
export interface DatePickerPresetTransitionsSourceManifest {
  reference: DatePickerPresetTransitionsSourceHeader; cases: DatePickerPresetTransitionsCaseMetadata[];
  storage: string; cleanupFailures: string[];
}
export interface DatePickerPresetTransitionsSourceStep {
  action: DatePickerPresetTransitionAction; actionEvidence: unknown;
  afterCall: DatePickerPresetTransitionsSourcePoint; actual: DatePickerPresetTransitionsSourcePoint;
}
export interface DatePickerPresetTransitionsSourceClosed {
  actionIndex: number; afterCall: DatePickerPresetTransitionsSourcePoint;
  settled: DatePickerPresetTransitionsSourcePoint; after1000: DatePickerPresetTransitionsSourcePoint;
}
export interface DatePickerPresetTransitionsSSRSerialization {
  rawHtml: string; htmlSha256: string; state: DatePickerPresetTransitionsSourceOwner;
  environment: { timezone: string }; refs: Record<'control' | 'root' | 'owner', boolean>;
  resources: Record<'timers' | 'frames' | 'measurements' | 'microtasks' | 'ports', number>;
  fatal: null; domFree: boolean;
  messageChannelEnvironment: { availableDuringUMDLoad: boolean; forbiddenDuringRender: boolean };
}
export interface DatePickerPresetTransitionsSourceSSR {
  serializations: Record<'renderToString' | 'renderToStaticMarkup',
    DatePickerPresetTransitionsSSRSerialization>;
  diagnostics: unknown[];
}

const prefix = 'ant-design-date-picker-preset-transitions-';
const sourceBase = '.upstream/artifacts/date-picker-preset-transitions-source-v1/';
const protocolSHA = '20a41ba69c7e91228cf6215009a1b1000376688fa46eaef911ae607fa949f0d2';
const portablePin = {
  bytes: 391919,
  sha256: '8db25532e9bab088478573cc87b3ea5f4a96e22daa8993710bb5496f6c6f1250'
};
const expectedCounts: Counts = { owners: 13, actions: 123, logicalPoints: 136,
  uniqueInitialClosedSSRStates: 13, initialClosedSSRSerializations: 26 };
const authoredDateNames = ['initialValue', 'defaultPickerValue', 'initialPickerValue',
  'initialMinDate', 'updatedMinDate', 'maxDate', 'presetValue'] as const;
const counters = { measured: false, observers: null, mutations: null, frames: null,
  timers: null, ports: null };
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
function readPinned(name: string, expected: Pin) {
  const bytes = readFileSync(fixture(name));
  assert.equal(bytes.length, expected.bytes, name + ' bytes');
  assert.equal(hash(bytes), expected.sha256, name + ' SHA-256');
  return bytes;
}
let metadata: { portable: PortableManifest; protocol: Protocol } | undefined;
function readMetadata() {
  if (metadata) return metadata;
  const portable = JSON.parse(readPinned(prefix + 'source-manifest.json', portablePin)
    .toString('utf8')) as PortableManifest;
  assert.equal(portable.format, 'ant-design-single-date-picker-preset-transitions-source-v1');
  assert.equal(portable.sourceOnly, true);
  assert.equal(portable.NativeDataUsed, false);
  assert.deepEqual(portable.counts, expectedCounts);
  assert.deepEqual(portable.caseIds, datePickerPresetTransitionSamples.map(sample => sample.id));
  assert.deepEqual(portable.serialization, { lossless: true, fieldsDropped: [], fieldsRewritten: [],
    normalizedSourceFields: [], sourceExpectedValuesDerivedFromNative: false,
    oneCompletePartAtATime: true, wholeRawPartsDeduplicatedOnlyByStoredSHA256: true,
    wholeManifestByteEqualityClaimed: false });
  assert.equal(portable.protocol.source.file, sourceBase + 'protocol-freeze.json');
  assert.equal(portable.protocol.source.sha256, protocolSHA);
  const protocol = JSON.parse(readPinned(portable.protocol.fixture, portable.protocol.source)
    .toString('utf8')) as Protocol;
  assert.equal(protocol.status, 'root-reviewed-frozen-before-Source-capture');
  assert.equal(protocol.axis, 'single-DatePicker-preset-transitions');
  assert.equal(portable.axis, protocol.axis);
  assert.deepEqual(protocol.counts, expectedCounts);
  assert.deepEqual(protocol.samples, datePickerPresetTransitionSamples);
  assert.equal(protocol.expectedOutcomes, null, 'Frozen protocol predicts no Source outcomes');
  assert.equal(Object.keys(protocol.inputPins).length, 19);
  assert.equal(Object.keys(protocol.preservedSourceV2Tree).length, 428);
  assert.equal(portable.preservation.frozenInputs, 19);
  assert.equal(portable.preservation.preservedSourceV2Files, 428);
  assert.deepEqual(portable.preservation.inheritedSource, protocol.inheritedSource);
  assert.equal(protocol.inheritedSource.sha256,
    '04be9b4879445757027d99f383a3d3188c4190882cab0c449c1d6133b6873de6');
  const execution = JSON.parse(readPinned(portable.execution.fixture, portable.execution.source)
    .toString('utf8'));
  assert.equal(execution.path, sourceBase + 'protocol-freeze.json');
  assert.equal(execution.sha256, protocolSHA);
  assert.equal(execution.bytes, portable.protocol.source.bytes);
  assert.deepEqual(portable.witnesses.source, { file: sourceBase + 'source-witnesses.json',
    ...protocol.inputPins[sourceBase + 'source-witnesses.json'] });
  readPinned(portable.witnesses.fixture, portable.witnesses.source);
  for (const copy of portable.sharedCopies) {
    assert.equal(copy.transformation,
      'byte-exact complete Source module; no import or function-body rewrites');
    assert.deepEqual({ bytes: copy.source.bytes, sha256: copy.source.sha256 },
      protocol.inputPins[copy.source.file]);
    const bytes = readFileSync(new URL('./' + copy.target.slice('tests/browser/'.length),
      import.meta.url));
    assert.equal(bytes.length, copy.source.bytes);
    assert.equal(hash(bytes), copy.source.sha256);
  }
  return metadata = { portable, protocol };
}
function scope(mode: DatePickerPresetTransitionsSourceMode,
  variant: DatePickerPresetTransitionsSourceVariant) {
  assert(['csr', 'ssr'].includes(mode), 'Unknown measured Source mode');
  assert(['first', 'repeat'].includes(variant), 'Unknown independent Source capture');
  return sourceBase + mode + '-source-' + variant + '.json';
}
export function verifyDatePickerPresetTransitionsSourceHeader(
  header: DatePickerPresetTransitionsSourceHeader, mode: DatePickerPresetTransitionsSourceMode
) {
  const { portable, protocol } = readMetadata();
  assert(['csr', 'ssr'].includes(mode));
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
  assert.equal(header.browserOwnedResourceCounters, 'unmeasured/null');
  assert.deepEqual(header.actual, portable.captures[mode].first.header.actual);
}
export function verifyDatePickerPresetTransitionsSourcePartBinding(
  reference: DatePickerPresetTransitionsSourcePart, mode: DatePickerPresetTransitionsSourceMode,
  variant: DatePickerPresetTransitionsSourceVariant
) {
  const { portable } = readMetadata();
  assert.deepEqual(Object.keys(reference), ['rawJSONPart']);
  const part = reference.rawJSONPart;
  assert(part && typeof part === 'object');
  assert.deepEqual(
    Object.keys(part),
    ['file', 'bytes', 'sha256', 'gzipFile', 'gzipBytes', 'gzipSHA256']
  );
  assert.equal(part.file.startsWith(scope(mode, variant) + '.parts/'), true);
  assert.equal(part.gzipFile, part.file + '.gz');
  const mapping = portable.parts[part.file];
  assert(mapping, 'Exact original Source part mapping');
  assert.deepEqual(part, mapping.original, 'Complete original Source raw and stored metadata');
  assert.equal(mapping.fixture, prefix + 'parts/' + part.gzipSHA256 + '.json.gz');
  assert.match(part.gzipSHA256, /^[a-f0-9]{64}$/);
  assert.match(part.sha256, /^[a-f0-9]{64}$/);
  return mapping;
}
export function verifyDatePickerPresetTransitionsSourceManifest(
  value: DatePickerPresetTransitionsSourceManifest, mode: DatePickerPresetTransitionsSourceMode,
  variant: DatePickerPresetTransitionsSourceVariant
) {
  const { portable, protocol } = readMetadata();
  scope(mode, variant);
  verifyDatePickerPresetTransitionsSourceHeader(value.reference, mode);
  assert.equal(value.storage, 'lossless-case-sections-v1');
  assert.deepEqual(value.cleanupFailures, []);
  assert.deepEqual(value.cases.map(row => row.id), portable.caseIds);
  let actions = 0, closed = 0;
  for (const [index, row] of value.cases.entries()) {
    assert.equal(row.id, row.sample.id);
    assert.deepEqual(row.sample, protocol.samples[index]);
    const bound = (part: DatePickerPresetTransitionsSourcePart, field: string) => {
      assert.equal(part.rawJSONPart.file,
        scope(mode, variant) + '.parts/' + row.id + '-' + field + '.json');
      verifyDatePickerPresetTransitionsSourcePartBinding(part, mode, variant);
    };
    if (mode === 'csr') {
      assert.equal(row.failure, null);
      assert.deepEqual(row.observationErrors, []);
      assert.deepEqual(row.network, { requests: [], responses: [], failures: [] });
      assert(row.initial && row.steps && row.closed && row.beforeUnmount && row.cleanup && row.late);
      assert.equal(row.steps.length, row.sample.actions.length);
      bound(row.initial, 'initial');
      bound(row.beforeUnmount, 'before-unmount');
      bound(row.cleanup, 'cleanup');
      bound(row.late, 'late');
      row.steps.forEach((part, step) => bound(part, 'step-' + step));
      let previousIndex = -1;
      for (const part of row.closed) {
        const match = part.rawJSONPart.file.match(/-closed-(\d+)\.json$/);
        assert(match);
        const actionIndex = Number(match[1]);
        assert(actionIndex > previousIndex && actionIndex < row.steps.length);
        bound(part, 'closed-' + actionIndex);
        previousIndex = actionIndex;
      }
      actions += row.steps.length;
      closed += row.closed.length;
      assert.equal(row.server, undefined);
    }
    else {
      assert(row.server);
      bound(row.server, 'server');
      for (const field of ['initial', 'steps', 'closed', 'beforeUnmount', 'cleanup', 'late'] as const)
        assert.equal(row[field], undefined);
    }
  }
  assert.equal(actions, mode === 'csr' ? expectedCounts.actions : 0);
  assert.equal(closed, value.reference.actual.closedTransitions);
}
/** Only small metadata is cached. No complete Source point, case or corpus is cached or assembled. */
export function readDatePickerPresetTransitionsManifest(
  mode: DatePickerPresetTransitionsSourceMode = 'csr',
  variant: DatePickerPresetTransitionsSourceVariant = 'first'
): DatePickerPresetTransitionsSourceManifest {
  const { portable } = readMetadata(), original = scope(mode, variant);
  const capture = portable.captures[mode][variant];
  assert.equal(capture.source.file, original);
  assert.equal(capture.gzip.file, original + '.gz');
  const decoded = gunzipSync(readPinned(capture.fixture, capture.gzip));
  assert.equal(decoded.length, capture.source.bytes);
  assert.equal(hash(decoded), capture.source.sha256);
  const value = JSON.parse(decoded.toString('utf8')) as DatePickerPresetTransitionsSourceManifest;
  assert.deepEqual(value.reference, capture.header);
  verifyDatePickerPresetTransitionsSourceManifest(value, mode, variant);
  return value;
}
export function readDatePickerPresetTransitionsCaseMetadata(id: string,
  mode: DatePickerPresetTransitionsSourceMode = 'csr',
  variant: DatePickerPresetTransitionsSourceVariant = 'first'
) {
  const row = readDatePickerPresetTransitionsManifest(mode, variant).cases.find(item => item.id === id);
  assert(row, 'Unknown measured Source transition owner: ' + id);
  return row;
}
/** Decode exactly one original full raw part, retaining graphs, descriptors and physical DOM. */
export function readDatePickerPresetTransitionsPart(reference: DatePickerPresetTransitionsSourcePart,
  mode: DatePickerPresetTransitionsSourceMode = 'csr',
  variant: DatePickerPresetTransitionsSourceVariant = 'first'
): unknown {
  const mapping = verifyDatePickerPresetTransitionsSourcePartBinding(reference, mode, variant);
  const part = reference.rawJSONPart;
  const decoded = gunzipSync(readPinned(mapping.fixture,
    { bytes: part.gzipBytes, sha256: part.gzipSHA256 }));
  assert.equal(decoded.length, part.bytes);
  assert.equal(hash(decoded), part.sha256);
  return JSON.parse(decoded.toString('utf8'));
}
export function datePickerPresetTransitionsEncodedArray(value: unknown): unknown[] {
  const input = record(value);
  assert.equal(input.$, 'array');
  const properties = array(input.properties).map(record);
  assert.equal(properties.at(-1)?.key, 'length');
  assert.equal(properties.at(-1)?.value, properties.length - 1);
  assert.deepEqual(properties.slice(0, -1).map(row => row.key),
    properties.slice(0, -1).map((_row, index) => String(index)));
  return properties.slice(0, -1).map(row => row.value);
}
export function datePickerPresetTransitionsRawRoot(value: unknown): Record<string, unknown> {
  const graph = record(value), reference = record(graph.root), nodes = array(graph.objects).map(record);
  assert(Number.isInteger(reference.ref));
  const node = nodes.find(item => item.id === reference.ref);
  assert(node);
  return node;
}
function rawProperty(graph: unknown, name: string) {
  return array(datePickerPresetTransitionsRawRoot(graph).properties).map(record)
    .find(row => row.key === name)?.value;
}
function verifyDateValue(value: DatePickerPresetTransitionsSourceValue,
  authored: DatePickerPresetTransitionsSourceOwner['authoredDates']
) {
  assert.deepEqual(
    Object.keys(value),
    ['encoded', 'raw', 'temporal', 'identity', 'sameAsAuthoredDates']
  );
  assert.deepEqual(Object.keys(value.sameAsAuthoredDates), authoredDateNames);
  if (value.temporal == null) {
    assert.equal(value.identity, null);
    assert.deepEqual(value.encoded, { $: 'undefined' });
    assert.deepEqual(value.raw, { root: { $: 'undefined' }, objects: [] });
  }
  else {
    const temporal = value.temporal;
    assert.deepEqual(
      Object.keys(temporal),
      ['isDayjs', 'valid', 'epoch', 'iso', 'utcOffset', 'fields']
    );
    assert.equal(temporal.isDayjs, true);
    assert.equal(temporal.valid, true);
    assert(Number.isFinite(temporal.epoch));
    assert.equal(temporal.utcOffset, 0);
    const date = new Date(temporal.epoch);
    assert.equal(date.toISOString(), temporal.iso);
    assert.deepEqual(temporal.fields, [date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
      date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()]);
    assert.equal(value.identity, datePickerPresetTransitionsRawRoot(value.raw).id);
    assert(Number.isSafeInteger(value.identity) && value.identity! > 0);
  }
  for (const name of authoredDateNames) {
    const expected = value.temporal == null && authored[name].temporal == null
      ? isDeepStrictEqual(value.encoded, authored[name].encoded)
      : value.identity !== null && value.identity === authored[name].identity;
    assert.equal(value.sameAsAuthoredDates[name], expected, 'Actual authored Dayjs alias: ' + name);
  }
}
export function verifyDatePickerPresetTransitionsSourceOwner(
  value: DatePickerPresetTransitionsSourceOwner
) {
  assert.equal(typeof value.alive, 'boolean');
  assert.equal(typeof value.open, 'boolean');
  assert.equal(typeof value.format, 'string');
  assert(['omitted', 'reject', 'accept'].includes(value.pickerOwner));
  assert.deepEqual(Object.keys(value.authoredDates), authoredDateNames);
  for (const snapshot of [value.value, value.pickerValue, value.minDate,
    ...Object.values(value.authoredDates)]) verifyDateValue(snapshot, value.authoredDates);
  assert.equal(value.events.length, value.rawEvents.length);
  assert.equal(value.events.length, value.callbackInvocations.length);
  const roots = new Set<unknown>();
  const arities: Record<string, number> = { change: 2, calendar: 3, open: 1, panel: 2,
    'picker-value': 2, ok: 1, focus: 2, blur: 2, clear: 0 };
  for (const [index, invocation] of value.callbackInvocations.entries()) {
    const args = datePickerPresetTransitionsEncodedArray(invocation.arguments);
    assert(Object.hasOwn(arities, invocation.name));
    assert.equal(invocation.actualArgumentCount, arities[invocation.name]);
    assert.equal(invocation.actualArgumentCount, args.length);
    assert.equal(rawProperty(invocation.rawArguments, 'length'), args.length);
    const root = datePickerPresetTransitionsRawRoot(invocation.rawArguments);
    assert.equal(root.array, true);
    assert(!roots.has(root.id));
    roots.add(root.id);
    assert.deepEqual(invocation.receiver, { isUndefined: true, isNull: false, type: 'undefined' });
    const event = datePickerPresetTransitionsEncodedArray(value.events[index]);
    assert.equal(event[0], invocation.name);
    assert.deepEqual(event.slice(1), args);
    assert.equal(rawProperty(value.rawEvents[index], '0'), invocation.name);
    assert.equal(rawProperty(value.rawEvents[index], 'length'), args.length + 1);
  }
  const dates = value.callbackInvocations.filter(row =>
    ['change', 'calendar', 'panel', 'picker-value', 'ok'].includes(row.name));
  assert.equal(value.callbackDates.length, dates.length);
  for (const [index, callback] of value.callbackDates.entries()) {
    const invocation = dates[index], args = datePickerPresetTransitionsEncodedArray(invocation.arguments);
    assert.equal(callback.name, invocation.name);
    assert.equal(callback.actionIndex, invocation.actionIndex);
    verifyDateValue(callback.value, value.authoredDates);
    assert.deepEqual(callback.value.encoded, args[0]);
    assert.equal(record(rawProperty(invocation.rawArguments, '0')).ref, callback.value.identity);
    const infoIndex = callback.name === 'calendar' ? 2
      : ['picker-value', 'panel'].includes(callback.name) ? 1 : null;
    assert.deepEqual(callback.info, infoIndex === null ? { $: 'undefined' } : args[infoIndex]);
    if (callback.name === 'calendar') {
      assert.deepEqual(callback.ownInfo, []);
      assert.deepEqual(callback.info, { $: 'object', properties: [] });
      assert.deepEqual(datePickerPresetTransitionsRawRoot(callback.rawInfo).properties, []);
    }
    else if (callback.name === 'picker-value') {
      assert.deepEqual(callback.ownInfo,
        datePickerPresetTransitionsRawRoot(callback.rawInfo).ownProperties);
      assert.deepEqual(array(record(callback.info).properties).map(row => record(row).key),
        ['source', 'mode']);
    }
  }
  const producerArities: Record<string, number[]> = {
    disabledDate: [2], disabledTime: [1, 3], disabledHours: [0]
  };
  for (const [index, call] of value.calls.entries()) {
    assert.equal(call.index, index);
    assert.equal(call.side, 'own');
    assert(Object.hasOwn(producerArities, String(call.kind)));
    const args = datePickerPresetTransitionsEncodedArray(call.argument);
    assert(producerArities[String(call.kind)].includes(call.actualArgumentCount as number));
    assert.equal(args.length, call.actualArgumentCount);
    assert.equal(rawProperty(call.rawArgument, 'length'), args.length);
    if (call.date) verifyDateValue(
      call.date as DatePickerPresetTransitionsSourceValue,
      value.authoredDates
    );
  }
}
export function verifyDatePickerPresetTransitionsSourcePoint(
  value: DatePickerPresetTransitionsSourcePoint
) {
  assert.equal(value.owner.alive, true);
  verifyDatePickerPresetTransitionsSourceOwner(value.owner);
  assert(value.root && value.input);
  assert.equal(value.root.connected, true);
  assert.equal(value.input.connected, true);
  assert.equal(value.sameRoot, true);
  assert.equal(value.sameInput, true);
  assert.equal(value.publicRef.controlPresent, true);
  assert.equal(value.publicRef.nativeElementIdentity, value.root.identity);
  assert.equal(value.input.attributes.find(([name]) => name === 'id')?.[1], 'preset-field');
  assert.equal(value.input.attributes.find(([name]) => name === 'name')?.[1], 'retained-date');
  assert(value.form && value.form.connected);
  assert.deepEqual(value.form.entries, [['retained-date', value.input.value]]);
  assert.deepEqual(value.publicRefDetails.controlOwnKeys, ['nativeElement', 'focus', 'blur']);
  // Source recreates some composite controls while retaining the root/input nodes.
  for (const name of ['sameControl', 'sameFocus', 'sameBlur'] as const)
    assert.equal(typeof value.publicRefDetails[name], 'boolean');
  assert(Array.isArray(value.calendarHeaders));
  assert(Array.isArray(value.timeColumns));
  assert.deepEqual(value.browserOwnedResourceCounters, counters);
  assert.deepEqual(value.environment, { timezone: 'UTC' });
  assert.deepEqual(value.resourceTiming, []);
}
export function verifyDatePickerPresetTransitionsSourceCleanup(
  value: DatePickerPresetTransitionsSourceCleanup
) {
  assert.equal(value.owner.alive, false);
  verifyDatePickerPresetTransitionsSourceOwner(value.owner);
  assert.deepEqual(value.refs, { control: true, root: true, owner: true });
  assert.equal(value.ownerCount, 0);
  assert.equal(value.popupCount, 0);
  assert(value.retained.some(node => node.owned));
  assert(value.retained.filter(node => node.owned).every(node => !node.connected));
  assert(value.retained.some(node => ['BODY', 'HTML'].includes(node.name) && !node.owned));
  assert.deepEqual(value.browserOwnedResourceCounters, counters);
  assert.deepEqual(value.resourceTiming, []);
}
export function readDatePickerPresetTransitionsInitial(id: string,
  variant: DatePickerPresetTransitionsSourceVariant = 'first'
) {
  const part = readDatePickerPresetTransitionsCaseMetadata(id, 'csr', variant).initial;
  assert(part);
  const value = readDatePickerPresetTransitionsPart(part, 'csr', variant) as
    DatePickerPresetTransitionsSourcePoint;
  verifyDatePickerPresetTransitionsSourcePoint(value);
  return value;
}
export function readDatePickerPresetTransitionsStep(id: string, index: number,
  variant: DatePickerPresetTransitionsSourceVariant = 'first'
) {
  const entry = readDatePickerPresetTransitionsCaseMetadata(id, 'csr', variant);
  assert(entry.steps);
  assert(Number.isInteger(index) && index >= 0 && index < entry.steps.length);
  const value = readDatePickerPresetTransitionsPart(entry.steps[index], 'csr', variant) as
    DatePickerPresetTransitionsSourceStep;
  assert.deepEqual(value.action, entry.sample.actions[index]);
  verifyDatePickerPresetTransitionsSourcePoint(value.afterCall);
  verifyDatePickerPresetTransitionsSourcePoint(value.actual);
  return value;
}
export function readDatePickerPresetTransitionsClosed(id: string, index: number,
  variant: DatePickerPresetTransitionsSourceVariant = 'first'
) {
  const entry = readDatePickerPresetTransitionsCaseMetadata(id, 'csr', variant);
  assert(entry.closed);
  assert(Number.isInteger(index) && index >= 0 && index < entry.closed.length);
  const part = entry.closed[index];
  const value = readDatePickerPresetTransitionsPart(part, 'csr', variant) as
    DatePickerPresetTransitionsSourceClosed;
  assert.equal(part.rawJSONPart.file.endsWith('-closed-' + value.actionIndex + '.json'), true);
  verifyDatePickerPresetTransitionsSourcePoint(value.afterCall);
  verifyDatePickerPresetTransitionsSourcePoint(value.settled);
  verifyDatePickerPresetTransitionsSourcePoint(value.after1000);
  assert.equal(value.settled.owner.open, false);
  assert.equal(value.after1000.owner.open, false);
  return value;
}
export function readDatePickerPresetTransitionsCleanup(id: string,
  phase: 'cleanup' | 'late' = 'cleanup', variant: DatePickerPresetTransitionsSourceVariant = 'first'
) {
  assert(phase === 'cleanup' || phase === 'late');
  const part = readDatePickerPresetTransitionsCaseMetadata(id, 'csr', variant)[phase];
  assert(part);
  const value = readDatePickerPresetTransitionsPart(part, 'csr', variant) as
    DatePickerPresetTransitionsSourceCleanup;
  verifyDatePickerPresetTransitionsSourceCleanup(value);
  return value;
}
export function readDatePickerPresetTransitionsSSR(id: string,
  variant: DatePickerPresetTransitionsSourceVariant = 'first'
) {
  const part = readDatePickerPresetTransitionsCaseMetadata(id, 'ssr', variant).server;
  assert(part);
  const value = readDatePickerPresetTransitionsPart(part, 'ssr', variant) as
    DatePickerPresetTransitionsSourceSSR;
  assert.deepEqual(Object.keys(value.serializations), ['renderToString', 'renderToStaticMarkup']);
  assert.deepEqual(value.diagnostics, []);
  for (const serialization of Object.values(value.serializations)) {
    assert.equal(typeof serialization.rawHtml, 'string');
    assert.equal(hash(serialization.rawHtml), serialization.htmlSha256);
    assert.equal(serialization.domFree, true);
    assert.equal(serialization.fatal, null);
    assert.deepEqual(serialization.environment, { timezone: 'UTC' });
    assert.deepEqual(serialization.refs, { control: true, root: true, owner: true });
    assert.deepEqual(serialization.resources,
      { timers: 0, frames: 0, measurements: 0, microtasks: 0, ports: 0 });
    assert.deepEqual(serialization.messageChannelEnvironment,
      { availableDuringUMDLoad: false, forbiddenDuringRender: true });
    verifyDatePickerPresetTransitionsSourceOwner(serialization.state);
    assert.equal(serialization.state.alive, false);
    assert.equal(serialization.state.open, false);
    assert.deepEqual(serialization.state.events, []);
    assert.deepEqual(serialization.state.lifecycle, []);
  }
  return value;
}
