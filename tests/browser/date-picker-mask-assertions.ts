import assert from 'node:assert/strict';
import { readMaskSourceInitial, readMaskSourceStep, readMaskSourceSubstep,
  readMaskSourceClosed, readMaskSourceCleanup, readMaskSourceProducerChunks,
  readMaskSourceProducerChunk } from './date-picker-mask-reference.mjs';
import { readMaskHydrationPrefixSourceFact } from './date-picker-mask-hydration-prefix-reference.mjs';
import { readMaskHydrationSourceProfile } from './date-picker-mask-hydration-reference.mjs';
import type { MaskSample } from './date-picker-mask-cases.mjs';
import type { MaskSourcePoint, MaskSourceOwner, MaskSourceDate, MaskSourceInvocation,
  MaskSourceProducer, MaskSourceProducerChunk, MaskSourceVariant, MaskSourceSurface }
  from './date-picker-mask-reference.mjs';

type Data = Record<string, unknown>;
// Narrows an unknown value before the recording. null and arrays result in a verification error.
const object = (value: unknown): Data => {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value));
  return value as Data;
};
// Confirms the shape of the array, leaving its elements unknown until a separate inspection.
const array = (value: unknown): unknown[] => {
  assert(Array.isArray(value));
  return value;
};
// Reads its own properties of a serialized object and checks the shape of each line.
const properties = (value: unknown) => array(object(value).properties).map(object);
const encoded = (value: unknown, key: string) => {
  const entry = properties(value).find(row => row.key === key);
  assert(entry, 'Complete encoded key ' + key);
  return entry.value;
};
// Seeks the source object by identifier. The no-object link interrupts the image check.
const rawNode = (graph: unknown, ref: unknown) => {
  const node = array(object(graph).objects).map(object).find(node => node.id === ref);
  assert(node, 'Raw node exists');
  return node;
};
// Goes from the root of the serialized graph, allowing links at every step.
const rawAt = (graph: unknown, path: Array<string | number>) => {
  let value = object(graph).root;
  for (const key of path) value = encoded(rawNode(graph, object(value).ref), String(key));
  return value;
};
// Looking for an attribute by name. The missing attribute remains null to compare images.
const attr = (surface: MaskSourceSurface, name: string) => surface.attributes.find(row => row[0] === name)?.[1] ?? null;
const roles = ['initialStart', 'initialEnd'] as const;
export interface MaskDifference { label: string; variant?: MaskSourceVariant; field: string; message: string; }
interface Bindings { forward: Map<number, number>; reverse: Map<number, number>; }
const bindings = (): Bindings => ({ forward: new Map(), reverse: new Map() });
const cloneBindings = (value: Bindings): Bindings => ({
  forward: new Map(value.forward),
  reverse: new Map(value.reverse)
});
function bind(actual: number, source: number, proof: Bindings) {
  assert(Number.isSafeInteger(actual) && actual > 0 && Number.isSafeInteger(source) && source > 0);
  if (proof.forward.has(source)) {
    assert.equal(
      actual,
      proof.forward.get(source),
      'Shared raw/public identity'
    );
  }
  if (proof.reverse.has(actual)) {
    assert.equal(
      source,
      proof.reverse.get(actual),
      'Distinct raw/public identity'
    );
  }
  proof.forward.set(source, actual);
  proof.reverse.set(actual, source);
}
interface CalendarBoundary { aRoot: number; sRoot: number; aInfo: number; sInfo: number; empty: boolean; }
// Analytical callback-model views retain the original graph, without rewriting stored nodes.
const rawViews = new WeakSet<object>();
function sameRaw(actual: unknown, source: unknown, proof: Bindings, boundary?: CalendarBoundary) {
  const a = object(actual), s = object(source), seen = new Set<number>(), original = new Set<number>();
  function value(left: unknown, right: unknown) {
    if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') {
      if (typeof left === 'number' && typeof right === 'number') {
        assert(left === right);
      }
      else {
        assert.deepEqual(left, right);
      }
      return;
    }
    assert.equal(Array.isArray(left), Array.isArray(right));
    assert.deepEqual(Object.keys(left), Object.keys(right));
    const l = left as Data, r = right as Data;
    if (Object.keys(l).length === 1 && Object.hasOwn(l, 'ref')) {
      node(Number(l.ref), Number(r.ref));
      return;
    }
    for (const key of Object.keys(l)) value(l[key], r[key]);
  }
  function node(left: number, right: number) {
    bind(left, right, proof);
    if (seen.has(left)) {
      assert(original.has(right));
      return;
    }
    seen.add(left);
    original.add(right);
    const l = rawNode(a, left), r = rawNode(s, right);
    assert.deepEqual(Object.keys(l), Object.keys(r));
    for (const key of Object.keys(l)) {
      if (key === 'id') continue;
      if (boundary && left === boundary.aInfo && right === boundary.sInfo
        && (key === 'properties' || key === 'ownProperties')) {
        continue;
      }
      if (boundary?.empty && left === boundary.aRoot && right === boundary.sRoot && key === 'properties') {
        const lp = array(l[key]).map(object), rp = array(r[key]).map(object);
        assert.deepEqual(lp.map(row => row.key), rp.map(row => row.key));
        for (const [index, row] of lp.entries()) {
          const other = rp[index];
          assert.deepEqual(Object.keys(row), Object.keys(other));
          if (row.key === '0' || row.key === '1') {
            assert.deepEqual(other.value, { $: 'undefined' });
            assert.equal(row.value, row.key === '0' ? null : '');
          }
          else {
            value(row, other);
          }
        }
      }
      else {
        value(l[key], r[key]);
      }
    }
  }
  value(a.root, s.root);
  if (!rawViews.has(a)) {
    assert.equal(
      seen.size,
      array(a.objects).length,
      'Every Native raw node compared'
    );
  }
  if (!rawViews.has(s)) {
    assert.equal(
      original.size,
      array(s.objects).length,
      'Every Source raw node compared'
    );
  }
}
function validateDate(date: MaskSourceDate, owner: MaskSourceOwner) {
  assert.equal(object(object(date.raw).root).ref, date.identity);
  assert.equal(date.temporal.fields.length, 7);
  for (const [index, key] of ['$y', '$M', '$D', '$H', '$m', '$s', '$ms'].entries()) {
    const raw = rawAt(date.raw, [key]), field = date.temporal.fields[index];
    if (raw !== null && typeof raw === 'object' && object(raw).$ === 'number') {
      assert(
        field === null || Number.isNaN(field),
        'Original JSON nonfinite field and strict raw numeric codec'
      );
    }
    else {
      assert.deepEqual(field, raw, 'Full raw Date field ' + key);
    }
  }
  assert.equal(rawAt(date.raw, ['$L']), date.temporal.locale);
  if (date.temporal.valid) {
    const inputDate = new Date(date.temporal.epoch!);
    assert.equal(
      inputDate.toISOString(),
      date.temporal.iso
    );
  }
  else {
    assert.equal(date.temporal.iso, null);
  }
  assert.deepEqual(Object.keys(date.sameAsAuthored), [...roles]);
  for (const role of roles) {
    assert.equal(
      date.sameAsAuthored[role],
      date.identity === owner.authoredDates[role].identity
    );
  }
}
function compatibleKnownID(actual: number, source: number, proof: Bindings) {
  return (!proof.forward.has(source) || proof.forward.get(source) === actual)
    && (!proof.reverse.has(actual) || proof.reverse.get(actual) === source);
}
function compatibleKnownDate(actual: MaskSourceDate, source: MaskSourceDate, proof: Bindings) {
  if (!compatibleKnownID(actual.identity, source.identity, proof)) {
    return false;
  }
  for (const key of ['$d', '$x']) {
    const a = rawAt(actual.raw, [key]), s = rawAt(source.raw, [key]);
    if (a && s && typeof a === 'object' && typeof s === 'object'
      && Object.hasOwn(a, 'ref') && Object.hasOwn(s, 'ref')
      && !compatibleKnownID(Number(object(a).ref), Number(object(s).ref), proof)) {
      return false;
    }
  }
  return true;
}
function sameDate(
  actual: MaskSourceDate,
  source: MaskSourceDate,
  owner: MaskSourceOwner,
  proof: Bindings
) {
  validateDate(actual, owner);
  assert.deepEqual(actual.encoded, source.encoded);
  assert.deepEqual(Object.keys(actual.temporal), Object.keys(source.temporal));
  for (const key of ['valid', 'iso', 'locale'] as const) {
    assert.deepEqual(
      actual.temporal[key],
      source.temporal[key]
    );
  }
  if (actual.temporal.valid) {
    assert.deepEqual(actual.temporal.epoch, source.temporal.epoch);
    assert.deepEqual(actual.temporal.fields, source.temporal.fields);
    assert(actual.temporal.utcOffset === source.temporal.utcOffset);
  }
  else {
    // Original JSON records nonfinite temporal numbers as null; raw codec stays exact.
    for (const key of ['epoch', 'utcOffset'] as const)
      assert(actual.temporal[key] === source.temporal[key] || source.temporal[key] === null && Number.isNaN(actual.temporal[key]));
    actual.temporal.fields.forEach((field, index) => assert(field === source.temporal.fields[index]
      || source.temporal.fields[index] === null && Number.isNaN(field)));
  }
  assert.deepEqual(actual.sameAsAuthored, source.sameAsAuthored);
  bind(actual.identity, source.identity, proof);
  sameRaw(actual.raw, source.raw, proof);
}
function validateInvocation(call: MaskSourceInvocation, index: number, owner: MaskSourceOwner) {
  assert.equal(call.index, index);
  assert(Number.isInteger(call.actionIndex) && call.actionIndex >= -1);
  assert(Number.isInteger(call.substepIndex) && call.substepIndex >= -1);
  assert.equal(encoded(call.encodedArguments, 'length'), call.actualArgumentCount);
  assert.equal(rawAt(call.rawArguments, ['length']), call.actualArgumentCount);
  for (const annotation of call.dates) {
    validateDate(annotation.value, owner);
    assert.equal(object(rawAt(call.rawArguments, annotation.path)).ref, annotation.value.identity);
  }
}
function receiver(actual: MaskSourceInvocation, source: MaskSourceInvocation) {
  assert.deepEqual(
    source.receiver,
    { type: 'undefined', isUndefined: true, isNull: false, identity: null }
  );
  assert.equal(actual.receiver.type, 'object');
  assert.equal(actual.receiver.isUndefined, false);
  assert.equal(actual.receiver.isNull, false);
  assert(Number.isSafeInteger(actual.receiver.identity) && actual.receiver.identity! > 0);
}
function producerReceiver(actual: MaskSourceProducer, source: MaskSourceProducer) {
  if (source.name === 'disabledDate') {
    if (actual.receiver.type === 'undefined') {
      assert.deepEqual(actual.receiver, source.receiver);
    }
    else {
      receiver(actual, source);
    }
    return;
  }
  assert.equal(source.name, 'disabledTime');
  if (source.receiver.type === 'undefined') {
    assert.deepEqual(
      source.receiver,
      { type: 'undefined', isUndefined: true, isNull: false, identity: null }
    );
    if (actual.receiver.type === 'undefined') {
      assert.deepEqual(actual.receiver, source.receiver);
    }
    else {
      receiver(actual, source);
    }
    return;
  }
  for (const call of [actual, source]) {
    assert.equal(call.receiver.type, 'object');
    assert.equal(call.receiver.isUndefined, false);
    assert.equal(call.receiver.isNull, false);
    assert(Number.isSafeInteger(call.receiver.identity) && call.receiver.identity! > 0);
  }
}
function calendarBoundary(
  actual: MaskSourceInvocation,
  source: MaskSourceInvocation,
  owner: MaskSourceOwner
): CalendarBoundary | undefined {
  if (owner.kind !== 'single' || owner.family === 'time' || actual.name !== 'calendar') {
    return;
  }
  assert.deepEqual(encoded(source.encodedArguments, '2'), { $: 'object', properties: [] });
  assert.deepEqual(encoded(actual.encodedArguments, '2'), {
    $: 'object', properties: [{ key: 'source', value: 'date' }] });
  const aInfo = Number(object(rawAt(actual.rawArguments, [2])).ref);
  const sInfo = Number(object(rawAt(source.rawArguments, [2])).ref);
  const an = rawNode(actual.rawArguments, aInfo), sn = rawNode(source.rawArguments, sInfo);
  assert.deepEqual(sn.properties, []);
  assert.deepEqual(sn.ownProperties, []);
  assert.deepEqual(properties(an), [{ key: 'source', value: 'date' }]);
  assert.deepEqual(an.ownProperties, [{ key: 'source', enumerable: true, configurable: true,
    writable: true, kind: 'value', valueType: 'string' }]);
  const empty = source.dates.length === 0 && object(encoded(source.encodedArguments, '0')).$ === 'undefined';
  if (empty) {
    assert.equal(actual.dates.length, 0);
    for (const key of ['0', '1']) {
      assert.deepEqual(
        encoded(source.encodedArguments, key),
        { $: 'undefined' }
      );
    }
    assert.equal(encoded(actual.encodedArguments, '0'), null);
    assert.equal(encoded(actual.encodedArguments, '1'), '');
  }
  return { aRoot: Number(object(object(actual.rawArguments).root).ref),
    sRoot: Number(object(object(source.rawArguments).root).ref), aInfo, sInfo, empty };
}
export const maskComparisonBoundaries = Object.freeze({
  callbackReceiver: 'Existing callback/validation-producer receiver boundary: exact Source undefined versus actual Native positive props-member object, or exact undefined. Source object still requires Native object. No receiver ID bijection or rewritten values; full arity/args/Date/model/from/returns stay strict.',
  singleDateCalendar: 'Single date/datetime only: Source {} versus Native {source:date}; exact empty reset undefined/undefined versus null/empty-string.',
  publicRefs: 'Real stable Native component focus/blur and separately bound root; no Source nativeElement getter synthesized.',
  closedPopup: 'Compare visible state; original Source hidden popup and Native removal remain retained raw.',
  immediatePhase: 'afterCall is retained with local raw/cursor/prefix integrity, never cross-scheduler equality.',
  pureProducers: 'No count/order/timing parity; every actual argument/return needs its executed-prefix Source witness. A single time panel arg0 may use its exact prior Source candidate object only after observed Source onChange establishes that very object as CURRENT bound model; exact prior-before/current-after model graphs, ordinal order and all raw arguments remain strict.',
  caret: 'Value/defaultValue/indices/focus remain strict. Only pre-FIRST-focusin, both-unfocused, collapsed-at-text-end Source forward/Native none follows measured native CSR construction (47 original points; caret-review f018015053943e63b77f87c93c8340d5b33852d3cad689f6fe8f2e7f0d2224c7). Focused/noncollapsed/postfocus/backward/wrong-index direction stays strict.',
  hydrationCaret: 'Only actual same parsed SSR node, same initial value/default/attribute, untouched per-input zero caret history and no first focus/edit can use independently hash-pinned React hydration parsed/settled zero caret. CSR Source remains raw; ordinary CSR has no origin metadata and stays strict.',
  hydrationFocusedPrefix: 'Only two range owners/end field/initial string and ten exact pre-end-pointerdown labels can use independently frozen Source hydrated focused-zero prefix: one focusin from start Enter with exact Source and Native Enter event contours, no end keydown/edit/pointer intent, unchanged parsed nodes/value/default/zero history. All directions/values/focus/args remain strict; ordinary CSR has no provenance.',
  inputAccessibility: 'Source INPUT expanded attribute is absent and retained raw. Native keeps its combobox/dialog/controls/expanded contract, independently checked against the actual visible popup and active input.'
});
export function createMaskProof() {
  return { variants: new Map<MaskSourceVariant, Bindings>(), root: null as number | null,
    owner: null as number | null, control: null as number | null, inputs: [] as number[],
    focus: null as number | null, blur: null as number | null,
    formats: new Map<string, number | null>(), localCallbacks: [] as MaskSourceInvocation[],
    localEvents: [] as MaskSourcePoint['events'], hydrationPristine: new Map<number, boolean>(), hydrationZeroHistory: new Map<number, boolean>(), hydrationOrigin: null as string | null, points: 0 };
}
export type MaskProof = ReturnType<typeof createMaskProof>;
export type NativeMaskPoint = Omit<MaskSourcePoint, 'refs'> & { refs: {
  owner: number | null; root: number | null; control: null | {
    identity: number; focusIdentity: number; blurIdentity: number } };
  hydrationConstruction?: MaskHydrationConstruction; };
/** Read-only production metadata, recorded from actual DOM before strict hydrate(). */
export interface MaskHydrationConstruction {
  owner: MaskSourceOwner['id']; initialFormatProfile: 'string' | 'object' | 'mask';
  rootIdentity: number; ownerIdentity: number; sameParsedRoot: boolean; sameParsedOwner: boolean;
  inputs: Array<{ sameParsedInput: boolean; parsed: {
    identity: number; id: string; type: string; value: string; defaultValue: string; valueAttribute: string | null;
    selectionStart: number | null; selectionEnd: number | null; selectionDirection: string | null;
    focused: boolean; connected: boolean;
  } }>;
}
function nativeHydrationParsedZero(point: NativeMaskPoint, index: number) {
  const origin = point.hydrationConstruction, input = point.inputs[index], row = origin?.inputs[index], parsed = row?.parsed;
  return !!(origin && input && parsed && row.sameParsedInput && origin.sameParsedRoot && origin.sameParsedOwner
    && origin.owner === point.owner.id && origin.rootIdentity === point.root?.identity && origin.ownerIdentity === point.ownerDOM?.identity
    && origin.inputs.length === point.inputs.length && parsed.identity === input.identity && parsed.id === attr(
      input,
      'id'
    )
    && parsed.type === 'text' && parsed.connected && !parsed.focused && parsed.value.length > 0
    && parsed.value === parsed.defaultValue && parsed.value === parsed.valueAttribute
    && parsed.selectionStart === 0 && parsed.selectionEnd === 0 && ['none', 'forward'].includes(parsed.selectionDirection ?? '')
    && input.connected && input.value === parsed.value && input.defaultValue === parsed.defaultValue
    && attr(input, 'value') === parsed.valueAttribute && input.selectionStart === 0 && input.selectionEnd === 0
    && input.selectionDirection === parsed.selectionDirection);
}
function nativeHydrationPristine(point: NativeMaskPoint, index: number) {
  const input = point.inputs[index];
  return !!(input && nativeHydrationParsedZero(point, index) && !input.focused
    && !point.events.some(event => event.targetIdentity === input.identity && ['focusin', 'keydown', 'keyup', 'beforeinput',
      'input', 'change', 'paste', 'compositionstart', 'compositionupdate', 'compositionend'].includes(event.type)));
}
function hydrationOriginKey(origin: MaskHydrationConstruction) {
  return JSON.stringify({ owner: origin.owner, profile: origin.initialFormatProfile, root: origin.rootIdentity,
    ownerIdentity: origin.ownerIdentity, parsed: origin.inputs.map(row => row.parsed) });
}
export function observeMaskHydrationConstruction(point: NativeMaskPoint, proof: MaskProof) {
  const origin = point.hydrationConstruction;
  if (origin && proof.hydrationOrigin === null && point.owner.alive && !point.owner.open
    && point.owner.ownerActions.length === 0 && point.owner.callbacks.length === 0
    && point.owner.formatProfile === origin.initialFormatProfile
    && point.inputs.every((_input, index) => nativeHydrationPristine(point, index))) {
    proof.hydrationOrigin = hydrationOriginKey(origin);
  }
  point.inputs.forEach((input, index) => {
    if (point.hydrationConstruction || proof.hydrationZeroHistory.has(input.identity)) {
      proof.hydrationZeroHistory.set(
        input.identity,
        proof.hydrationZeroHistory.get(input.identity) !== false && nativeHydrationParsedZero(
          point,
          index
        )
      );
    }
    if (point.hydrationConstruction || proof.hydrationPristine.has(input.identity)) {
      proof.hydrationPristine.set(
        input.identity,
        proof.hydrationPristine.get(input.identity) !== false && nativeHydrationPristine(
          point,
          index
        )
      );
    }
  });
}
export function maskHydrationConstructionCaret(
  actual: NativeMaskPoint,
  source: MaskSourcePoint,
  proof: MaskProof,
  variant: MaskSourceVariant,
  index: number
) {
  if (!actual.hydrationConstruction || proof.hydrationOrigin !== hydrationOriginKey(actual.hydrationConstruction)
    || proof.hydrationPristine.get(actual.inputs[index]?.identity) !== true
    || !nativeHydrationPristine(actual, index)) {
    return false;
  }
  const origin = actual.hydrationConstruction, parsed = origin.inputs[index].parsed, expected = source.inputs[index];
  if (!actual.owner.alive || !source.owner.alive || !expected || expected.focused
    || expected.value !== parsed.value || expected.defaultValue !== parsed.defaultValue
    || expected.selectionStart !== expected.value.length || expected.selectionEnd !== expected.value.length) {
    return false;
  }
  // This reader verifies the independently frozen Source hydration protocol/release/whole profile hashes.
  const profile = readMaskHydrationSourceProfile(origin.owner, origin.initialFormatProfile, variant);
  const before = profile.observations.find(point => point.phase === 'parsed');
  const settled = profile.observations.find(point => point.phase === 'settled');
  const a = before?.inputs[index], b = settled?.inputs[index];
  if (!before || !settled || !a || !b) {
    return false;
  }
  return !!( profile.id === origin.owner && profile.formatProfile === origin.initialFormatProfile
    && before.nodes.sameParsed.inputs[index] && settled.nodes.sameParsed.inputs[index]
    && before.nodes.sameParsed.root && settled.nodes.sameParsed.root && before.nodes.sameParsed.owner && settled.nodes.sameParsed.owner
    && a.identity === b.identity && a.id === parsed.id && b.id === parsed.id && a.type === 'text' && b.type === 'text'
    && a.connected && b.connected && !a.focused && !b.focused && a.value === parsed.value && b.value === parsed.value
    && a.defaultValue === parsed.defaultValue && b.defaultValue === parsed.defaultValue
    && a.valueAttribute === parsed.valueAttribute && b.valueAttribute === parsed.valueAttribute
    && a.selectionStart === 0 && a.selectionEnd === 0 && b.selectionStart === 0 && b.selectionEnd === 0
    && a.selectionDirection === b.selectionDirection && expected.selectionDirection === b.selectionDirection);
}
const hydrationFocusedLabels: Record<string, [number, number]> = {
  'step-1-substep-0:settled': [1, 0], 'step-1:settled': [1, -1],
  'step-2:before': [2, -1], 'step-2-substep-0:before': [2, 0],
  'step-2-substep-0:settled': [2, 0], 'step-2:settled': [2, -1],
  'step-3:before': [3, -1], 'step-3-substep-0:before': [3, 0],
  'step-3-substep-0:settled': [3, 0], 'step-3-substep-1:before': [3, 1]
};
function inheritedRangeFocusEvents(
  events: readonly Data[],
  start: unknown,
  end: unknown,
  text: string,
  direction: unknown,
  native: boolean
) {
  const signature: string[] = [];
  for (const event of events) {
    const target = native ? event.targetIdentity : event.target;
    const input = event[native ? 'inputAtCapture' : 'input'];
    if (input && object(input).identity === end) {
      const snapshot = object(input);
      if (snapshot.value !== text || snapshot.defaultValue !== text || snapshot.selectionStart !== 0
        || snapshot.selectionEnd !== 0 || snapshot.selectionDirection !== direction) {
        return null;
      }
    }
    if (target === start && (event.type === 'keydown' || event.type === 'keyup')) {
      if (event.key !== 'Enter' || event.actionIndex !== 1 || event.substepIndex !== 0 || event.isTrusted !== true) {
        return null;
      }
      signature.push(event.type === 'keydown' ? 'start-enter-keydown' : 'start-enter-keyup');
    }
    if (target === start && event.type === 'focusout') {
      if (event.actionIndex !== 1 || event.substepIndex !== 0 || event.isTrusted !== true
        || event[native ? 'relatedTargetIdentity' : 'relatedTarget'] !== end) {
        return null;
      }
      signature.push('start-to-end-focusout');
    }
    if (target !== end) continue;
    if (['keydown', 'input', 'change', 'paste', 'compositionstart', 'compositionupdate',
      'compositionend', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'focusout'].includes(String(event.type))) {
      return null;
    }
    if (event.type === 'focusin') {
      if (event.actionIndex !== 1 || event.substepIndex !== 0 || event.isTrusted !== true
        || event[native ? 'relatedTargetIdentity' : 'relatedTarget'] !== start) {
        return null;
      }
      signature.push('focusin-from-start-enter');
    }
    else if (event.type === 'beforeinput') {
      // React emits this unchanged-field event from the start Enter; Native prevents its default.
      if (native || event.actionIndex !== 1 || event.substepIndex !== 0 || event.key !== null
        || event.isTrusted !== true || event.active !== end) {
        return null;
      }
      signature.push('source-inherited-enter-beforeinput');
    }
    else if (event.type === 'keyup') {
      if (event.actionIndex !== 1 || event.substepIndex !== 0 || event.key !== 'Enter' || event.isTrusted !== true) {
        return null;
      }
      signature.push('inherited-enter-keyup');
    }
  }
  const expected = native ? [
    'start-enter-keydown,start-to-end-focusout,focusin-from-start-enter,inherited-enter-keyup',
    'start-enter-keydown,start-enter-keyup,start-to-end-focusout,focusin-from-start-enter'
  ] : ['start-enter-keydown,start-to-end-focusout,focusin-from-start-enter,source-inherited-enter-beforeinput,inherited-enter-keyup'];
  return expected.includes(signature.join(',')) ? ['start-enter-to-end-focus'] : null;
}
export function maskHydrationFocusedPrefixCaret(
  actual: NativeMaskPoint,
  source: MaskSourcePoint,
  proof: MaskProof,
  variant: MaskSourceVariant,
  index: number,
  label: string
) {
  const stage = hydrationFocusedLabels[label], origin = actual.hydrationConstruction;
  const input = actual.inputs[index], expected = source.inputs[index];
  if (!stage || index !== 1 || !actual.owner.alive || !source.owner.alive || !origin || origin.initialFormatProfile !== 'string'
    || !['range-date-mask', 'range-time-mask'].includes(actual.owner.id)
    || proof.hydrationOrigin !== hydrationOriginKey(origin) || proof.hydrationZeroHistory.get(input?.identity) !== true
    || !nativeHydrationParsedZero(actual, index) || !input.focused || !expected?.focused
    || actual.owner.actionIndex !== stage[0] || actual.owner.substepIndex !== stage[1]
    || expected.selectionStart !== expected.value.length || expected.selectionEnd !== expected.value.length
    || input.value !== expected.value || input.defaultValue !== expected.defaultValue
    || input.selectionDirection !== expected.selectionDirection) {
    return false;
  }
  const nativeEvents = inheritedRangeFocusEvents(actual.events as unknown as Data[], actual.inputs[0].identity,
    input.identity, input.value, input.selectionDirection, true);
  if (!nativeEvents) {
    return false;
  }
  const fact = readMaskHydrationPrefixSourceFact(
    actual.owner.id as 'range-date-mask' | 'range-time-mask',
    label,
    variant
  );
  const reference = fact.inputs[index], state = fact.source?.owner;
  if (!reference || !state || !state.alive || state.id !== actual.owner.id || state.actionIndex !== stage[0] || state.substepIndex !== stage[1]
    || state.open !== actual.owner.open || state.formatProfile !== actual.owner.formatProfile
    || !fact.nodes.sameParsed.owner || !fact.nodes.sameParsed.root || !fact.nodes.sameParsed.inputs[index]
    || reference.identity !== fact.nodes.parsed.inputs[index] || reference.id !== attr(input, 'id')
    || !reference.connected || !reference.focused || reference.value !== input.value || reference.defaultValue !== input.defaultValue
    || reference.valueAttribute !== attr(input, 'value') || reference.selectionStart !== 0 || reference.selectionEnd !== 0
    || reference.selectionDirection !== input.selectionDirection) {
    return false;
  }
  const sourceEvents = inheritedRangeFocusEvents(fact.events, fact.inputs[0].identity, reference.identity,
    reference.value, reference.selectionDirection, false);
  return sourceEvents !== null && isSameEventSignature(nativeEvents, sourceEvents);
}
function isSameEventSignature(actual: string[], source: string[]) {
  return actual.length === source.length && actual.every((value, index) => value === source[index]);
}
export function readNativeMaskPoint(value: unknown): NativeMaskPoint {
  const point = object(value), owner = object(point.owner);
  assert(['date', 'datetime', 'time'].includes(String(owner.family)));
  assert(['single', 'range'].includes(String(owner.kind)));
  for (const key of ['inputs', 'popups', 'retained', 'events']) array(point[key]);
  for (const key of ['callbacks', 'modelDates', 'ownerActions', 'lifecycle']) array(owner[key]);
  return value as NativeMaskPoint;
}
export function verifyMaskNativeAccessibility(point: NativeMaskPoint) {
  if (!point.owner.alive) {
    assert.equal(point.inputs.length, 0);
    assert.equal(point.popups.length, 0);
    return;
  }
  const visible = point.popups.filter(popup => popup.visible);
  assert.equal(visible.length, point.owner.open ? 1 : 0, 'Real Native controlled dialog visibility');
  const controls = point.inputs.map(input => attr(input, 'aria-controls'));
  assert(controls.every(value => typeof value === 'string' && value.length > 0));
  assert.equal(new Set(controls).size, 1, 'Range inputs control the same actual popup');
  if (visible.length) {
    assert.equal(attr(visible[0].surface, 'role'), 'dialog');
    assert.equal(attr(visible[0].surface, 'id'), controls[0]);
  }
  let active = point.inputs.findIndex(input => input.focused);
  if (active < 0) {
    const focus = point.events.filter(event => event.type === 'focusin'
      && point.inputs.some(input => input.identity === event.targetIdentity)).at(-1);
    if (focus) active = point.inputs.findIndex(input => input.identity === focus.targetIdentity);
  }
  if (point.inputs.length === 1) active = 0;
  if (visible.length) assert(active >= 0, 'Expanded Range input follows actual input focus history');
  point.inputs.forEach((input, index) => {
    assert.equal(attr(input, 'role'), 'combobox');
    assert.equal(attr(input, 'aria-haspopup'), 'dialog');
    assert.equal(attr(input, 'aria-expanded'), String(Boolean(visible.length) && index === active));
  });
}
export function verifyMaskLocalPoint(point: NativeMaskPoint, proof?: MaskProof) {
  const owner = point.owner;
  if (proof) observeMaskHydrationConstruction(point, proof);
  for (const role of roles) validateDate(owner.authoredDates[role], owner);
  for (const annotation of owner.modelDates) {
    validateDate(annotation.value, owner);
    assert.equal(object(rawAt(owner.rawModel, annotation.path)).ref, annotation.value.identity);
  }
  owner.callbacks.forEach((call, index) => validateInvocation(call, index, owner));
  assert.deepEqual(rawAt(owner.rawAuthoredProps, ['value']), object(owner.rawModel).root);
  assert.deepEqual(rawAt(owner.rawAuthoredProps, ['format']), object(owner.formatValue.raw).root);
  if (owner.formatValue.type === 'object') {
    assert.equal(object(object(owner.formatValue.raw).root).ref, owner.formatValue.identity);
    assert.deepEqual(rawNode(owner.formatValue.raw, owner.formatValue.identity).authoredRole,
      { authoredFormat: owner.formatProfile });
  }
  else {
    assert.equal(owner.formatValue.identity, null);
  }
  const observedEvents = new Set(['pointerdown', 'mousedown', 'mouseup', 'click', 'mouseover', 'mouseout',
    'keydown', 'keyup', 'beforeinput', 'input', 'change', 'selectionchange', 'focusin', 'focusout', 'paste',
    'compositionstart', 'compositionupdate', 'compositionend']);
  for (const event of point.events) {
    assert(observedEvents.has(event.type));
    assert.equal(event.phase, 'document-capture-before-target-handler');
    assert.equal(event.eventPhase, 1);
    assert.equal(typeof event.isTrusted, 'boolean');
    assert(Number.isFinite(event.timeStamp));
    assert(Number.isSafeInteger(event.producerCursorAtCapture) && event.producerCursorAtCapture >= 0
      && event.producerCursorAtCapture <= owner.producerCount);
    assert(Number.isSafeInteger(event.callbackCountAtCapture) && event.callbackCountAtCapture >= 0
      && event.callbackCountAtCapture <= owner.callbacks.length);
    if (event.inputAtCapture) {
      if (event.targetTag === 'INPUT') {
        assert.equal(
          event.targetIdentity,
          event.inputAtCapture.identity
        );
      }
      else {
        assert.equal(
          event.inputAtCapture.focused,
          true,
          'Non-input target snapshot describes the actual active input'
        );
      }
      assert.equal(typeof event.inputAtCapture.value, 'string');
      assert.equal(typeof event.inputAtCapture.defaultValue, 'string');
      const input = event.inputAtCapture;
      if (input.selectionStart !== null || input.selectionEnd !== null) {
        assert(input.selectionStart !== null && input.selectionEnd !== null
          && input.selectionStart >= 0 && input.selectionStart <= input.selectionEnd
          && input.selectionEnd <= input.value.length);
      }
    }
  }
  if (!proof) {
    return;
  }
  assert.deepEqual(owner.callbacks.slice(0, proof.localCallbacks.length), proof.localCallbacks,
    'Native cumulative callbacks remain append-only, including immediate reads');
  proof.localCallbacks = owner.callbacks;
  assert.deepEqual(
    point.events.slice(0, proof.localEvents.length),
    proof.localEvents,
    'Raw Native event log is append-only'
  );
  proof.localEvents = point.events;
  for (const call of owner.callbacks) {
    assert.equal(call.receiver.type, 'object');
    assert.equal(call.receiver.isUndefined, false);
    assert.equal(call.receiver.isNull, false);
    assert(Number.isSafeInteger(call.receiver.identity) && call.receiver.identity! > 0);
  }
  if (owner.alive) {
    assert(point.root?.connected && point.ownerDOM?.connected && point.refs.control);
    proof.root ??= point.root.identity;
    proof.owner ??= point.ownerDOM.identity;
    proof.control ??= point.refs.control.identity;
    proof.focus ??= point.refs.control.focusIdentity;
    proof.blur ??= point.refs.control.blurIdentity;
    if (!proof.inputs.length) proof.inputs = point.inputs.map(input => input.identity);
    assert.equal(point.root.identity, proof.root);
    assert.equal(point.refs.root, proof.root);
    assert.equal(point.ownerDOM.identity, proof.owner);
    assert.equal(point.refs.owner, proof.owner);
    assert.equal(point.refs.control.identity, proof.control);
    assert.equal(point.refs.control.focusIdentity, proof.focus);
    assert.equal(point.refs.control.blurIdentity, proof.blur);
    assert.deepEqual(point.inputs.map(input => input.identity), proof.inputs);
    assert(point.sameOwnerAsInitial && point.sameRootAsInitial && point.inputs.every(input => input.sameAsInitial));
  }
  else {
    assert.deepEqual(point.refs, { owner: null, root: null, control: null });
    assert.equal(point.inputs.length, 0);
    assert.equal(point.popups.length, 0);
    assert(point.retained.every(node => !node.connected));
  }
  const previous = proof.formats.get(owner.formatProfile);
  if (proof.formats.has(owner.formatProfile)) {
    assert.equal(
      owner.formatValue.identity,
      previous,
      'Stable authored format object'
    );
  }
  else {
    proof.formats.set(owner.formatProfile, owner.formatValue.identity);
  }
}
function focusKind(point: Pick<MaskSourcePoint, 'inputs' | 'focus'>) {
  if (!point.focus) {
    return null;
  }
  const index = point.inputs.findIndex(input => input.identity === point.focus!.identity);
  if (index !== -1) {
    return { kind: 'input', index };
  }
  const get = (key: string) => point.focus!.attributes.find(row => row[0] === key)?.[1] ?? null;
  return {
    kind: point.focus.tag,
    role: get('role'),
    id: get('id'),
    title: get('title'),
    label: get('aria-label')
  };
}
function initialCaretConstructionBoundary(
  actual: NativeMaskPoint,
  source: MaskSourcePoint,
  index: number
) {
  const a = actual.inputs[index], s = source.inputs[index];
  return a.selectionDirection === 'none' && s.selectionDirection === 'forward'
    && !a.focused && !s.focused && a.selectionStart === a.value.length && a.selectionEnd === a.value.length
    && s.selectionStart === s.value.length && s.selectionEnd === s.value.length
    && !actual.events.some(event => event.type === 'focusin' && event.targetIdentity === a.identity)
    && !source.events.some(event => event.type === 'focusin' && event.targetIdentity === s.identity);
}
function visibleState(point: Pick<MaskSourcePoint, 'popups'>) {
  return point.popups.filter(popup => popup.visible).map(popup => ({
    panels: popup.panels.length,
    headers: popup.headerButtons.map(button => ({ text: button.text, label: attr(
      button,
      'aria-label'
    ),
      disabled: button.disabled, visible: button.css.display !== 'none' && button.css.visibility !== 'hidden' })),
    cells: popup.dateCells.map(cell => ({ title: cell.title, text: cell.surface.text, weekNumber: cell.weekNumber,
      selected: cell.selected, rangeStart: cell.rangeStart, rangeEnd: cell.rangeEnd, inRange: cell.inRange, disabled: cell.disabled,
      inView: (attr(cell.surface, 'class') ?? '').split(/\s+/).includes('ant-picker-cell-in-view'),
      hover: (attr(cell.surface, 'class') ?? '').split(/\s+/).includes('ant-picker-cell-hover'),
      today: (attr(cell.surface, 'class') ?? '').split(/\s+/).includes('ant-picker-cell-today') })),
    columns: popup.columns.map(column => ({ type: column.type,
      rows: column.rows.map(row => {
        const data = row as unknown as Data;
        return {
        value: data.valueAttribute ?? data.nativeValueAttribute ?? data.value, text: row.surface.text,
        selected: row.selected, disabled: row.disabled };
      }) }))
  }));
}
export function verifyMaskFooterBoundary(actual: NativeMaskPoint, source: MaskSourcePoint) {
  const native = actual.popups.filter(popup => popup.visible), original = source.popups.filter(popup => popup.visible);
  assert.equal(native.length, original.length);
  original.forEach((popup, index) => {
    const controls = native[index].footerControls;
    assert.equal(controls.length, popup.footerControls.length, 'Actual visible footer controls');
    popup.footerControls.forEach((expected, ordinal) => {
      const control = controls[ordinal];
      assert.equal(
        control.text?.trim(),
        expected.text?.trim(),
        'Footer accessible label; original textContent retained'
      );
      assert.equal(control.tag, 'BUTTON');
      assert.equal(attr(control, 'type'), 'button');
      if (expected.tag === 'A') {
        assert.equal(expected.disabled, null);
        assert((attr(expected, 'class') ?? '').split(/\s+/).includes('ant-picker-now-btn'));
        const disabled = attr(expected, 'aria-disabled');
        assert(disabled === 'true' || disabled === 'false');
        assert.equal(
          (attr(expected, 'class') ?? '').split(/\s+/).includes('ant-picker-now-btn-disabled'),
          disabled === 'true'
        );
        assert.notEqual(attr(control, 'data-picker-current'), null);
        assert.equal(control.disabled, disabled === 'true');
      }
      else {
        assert.equal(expected.tag, 'BUTTON');
        assert.equal(control.disabled, expected.disabled);
      }
      assert(
        control.text?.trim() || attr(control, 'aria-label'),
        'Actual Native footer accessible name'
      );
    });
  });
}
function rawView(graph: unknown, path: Array<string | number>) {
  const value = { root: rawAt(graph, path), objects: object(graph).objects };
  rawViews.add(value);
  return value;
}
export function compareMaskPoint(
  actual: NativeMaskPoint,
  source: MaskSourcePoint,
  proof: MaskProof,
  variant: MaskSourceVariant,
  label: string
): MaskDifference[] {
  const differences: MaskDifference[] = [];
  const check = (field: string, operation: () => void) => {
    try {
      operation();
    }
    catch (error) {
      differences.push({ label, variant, field, message: String(error).slice(0, 3000) });
    }
  };
  observeMaskHydrationConstruction(actual, proof);
  check('Native local fields', () => verifyMaskLocalPoint(actual));
  check('Native operational accessibility', () => verifyMaskNativeAccessibility(actual));
  for (const key of ['id', 'family', 'kind', 'picker', 'actionIndex', 'substepIndex', 'alive', 'open', 'formatProfile'] as const)
    check('owner.' + key, () => assert.deepEqual(actual.owner[key], source.owner[key]));
  const dateBindings = cloneBindings(proof.variants.get(variant) ?? bindings());
  check('model and authored Date graph', () => {
    for (const role of roles) {
      sameDate(
        actual.owner.authoredDates[role],
        source.owner.authoredDates[role],
        actual.owner,
        dateBindings
      );
    }
    assert.deepEqual(actual.owner.model, source.owner.model);
    assert.equal(actual.owner.modelDates.length, source.owner.modelDates.length);
    actual.owner.modelDates.forEach((date, index) => {
      assert.deepEqual(date.path, source.owner.modelDates[index].path);
      sameDate(date.value, source.owner.modelDates[index].value, actual.owner, dateBindings);
    });
    sameRaw(actual.owner.rawModel, source.owner.rawModel, dateBindings);
    proof.variants.set(variant, dateBindings);
  });
  check('format identity/shape', () => {
    assert.equal(actual.owner.formatValue.type, source.owner.formatValue.type);
    assert.deepEqual(actual.owner.formatValue.encoded, source.owner.formatValue.encoded);
    const next = cloneBindings(proof.variants.get(variant) ?? bindings());
    sameRaw(actual.owner.formatValue.raw, source.owner.formatValue.raw, next);
    proof.variants.set(variant, next);
  });
  check('ordinary public authored props', () => {
    const aKeys = properties(actual.owner.authoredProps).map(row => row.key).filter(key => key !== 'style');
    const sKeys = properties(source.owner.authoredProps).map(row => row.key).filter(key => key !== 'ref' && key !== 'style');
    assert.deepEqual([...aKeys].sort(), [...sKeys].sort());
    assert.equal(encoded(actual.owner.authoredProps, 'style'), 'width:100%');
    assert.deepEqual(
      encoded(source.owner.authoredProps, 'style'),
      { $: 'object', properties: [{ key: 'width', value: '100%' }] }
    );
    const next = cloneBindings(proof.variants.get(variant) ?? bindings());
    for (const key of aKeys) {
      assert(typeof key === 'string');
      assert.deepEqual(
        encoded(actual.owner.authoredProps, key),
        encoded(source.owner.authoredProps, key)
      );
      sameRaw(
        rawView(actual.owner.rawAuthoredProps, [key]),
        rawView(source.owner.rawAuthoredProps, [key]),
        next
      );
    }
    proof.variants.set(variant, next);
  });
  check('owner actions/lifecycle', () => {
    assert.equal(actual.owner.ownerActions.length, source.owner.ownerActions.length);
    actual.owner.ownerActions.forEach((action, index) => {
      const original = source.owner.ownerActions[index];
      const { nativeIsTrusted, ...syntheticFields } = original;
      assert.deepEqual(action, syntheticFields);
      assert.equal(
        action.isTrusted,
        nativeIsTrusted,
        'Source wrapped native event versus actual Native DOM event trust'
      );
    });
    assert.deepEqual(actual.owner.lifecycle, source.owner.lifecycle);
  });
  check(
    'callback count',
    () => assert.equal(actual.owner.callbacks.length, source.owner.callbacks.length)
  );
  for (const [index, call] of actual.owner.callbacks.entries()) {
    const expected = source.owner.callbacks[index];
    if (!expected) continue;
    check('callback[' + index + '] full args/Date aliases', () => {
      const next = cloneBindings(proof.variants.get(variant) ?? bindings());
      for (const key of ['index', 'actionIndex', 'substepIndex', 'name', 'actualArgumentCount'] as const)
        assert.deepEqual(call[key], expected[key]);
      receiver(call, expected);
      const boundary = calendarBoundary(call, expected, actual.owner);
      const keys = properties(call.encodedArguments).map(row => row.key);
      assert.deepEqual(keys, properties(expected.encodedArguments).map(row => row.key));
      for (const key of keys) {
        assert(typeof key === 'string');
        if (boundary && (key === '2' || boundary.empty && (key === '0' || key === '1'))) continue;
        assert.deepEqual(
          encoded(call.encodedArguments, key),
          encoded(expected.encodedArguments, key)
        );
      }
      assert.equal(call.dates.length, expected.dates.length);
      call.dates.forEach((date, position) => {
        assert.deepEqual(date.path, expected.dates[position].path);
        sameDate(date.value, expected.dates[position].value, actual.owner, next);
      });
      sameRaw(call.rawArguments, expected.rawArguments, next, boundary);
      proof.variants.set(variant, next);
    });
  }
  check('input count', () => assert.equal(actual.inputs.length, source.inputs.length));
  actual.inputs.forEach((input, index) => {
    const original = source.inputs[index];
    if (!original) {
      return;
    }
    const hydrationCaret = maskHydrationConstructionCaret(actual, source, proof, variant, index);
    const focusedHydrationCaret = maskHydrationFocusedPrefixCaret(
      actual,
      source,
      proof,
      variant,
      index,
      label
    );
    for (const key of ['value', 'defaultValue', 'selectionStart', 'selectionEnd', 'selectionDirection', 'focused'] as const) {
      check('input[' + index + '].' + key, () => {
        if (hydrationCaret && ['selectionStart', 'selectionEnd', 'selectionDirection'].includes(key)) {
          return;
        }
        if (focusedHydrationCaret && (key === 'selectionStart' || key === 'selectionEnd')) {
          return;
        }
        if (key === 'selectionDirection' && initialCaretConstructionBoundary(actual, source, index)) {
          return;
        }
        assert.deepEqual(input[key], original[key]);
      });
    }
    check(
      'original Source input expanded attribute absent',
      () => assert.equal(attr(original, 'aria-expanded'), null)
    );
    for (const name of ['placeholder', 'disabled', 'readonly']) {
      check(
        'input[' + index + '].' + name,
        () => assert.equal(attr(input, name), attr(original, name))
      );
    }
  });
  check('physical focus', () => assert.deepEqual(focusKind(actual), focusKind(source)));
  check(
    'visible popup/calendar/time state',
    () => assert.deepEqual(visibleState(actual), visibleState(source))
  );
  check('footer label/availability/accessibility', () => verifyMaskFooterBoundary(actual, source));
  proof.points++;
  return differences;
}
export function verifyMaskPoint(
  actual: NativeMaskPoint,
  source: MaskSourcePoint,
  proof: MaskProof,
  variant: MaskSourceVariant,
  label: string
) {
  const differences = compareMaskPoint(actual, source, proof, variant, label);
  assert.deepEqual(differences, [], 'Mask public before/settled Source comparison');
}

interface ProducerFrame { phase: string; chunk: MaskSourceProducerChunk; points: MaskSourceOwner[]; }
function modelSignature(owner: MaskSourceOwner) {
  return JSON.stringify({ family: owner.family, kind: owner.kind, picker: owner.picker,
    model: owner.model,
    dates: owner.modelDates.map(row => ({ path: row.path, temporal: row.value.temporal,
      encoded: row.value.encoded, aliases: row.value.sameAsAuthored })),
    sharing: owner.modelDates.map(a => owner.modelDates.map(b => a.value.identity === b.value.identity)) });
}
function changedModels(before: MaskSourceOwner | null, after: MaskSourceOwner): MaskSourceOwner[] {
  return after.callbacks.slice(before?.callbacks.length ?? 0).filter(call => call.name === 'change')
    .map(call => {
      const rawModel = {
        root: rawAt(call.rawArguments, [0]),
        objects: object(call.rawArguments).objects
      };
      rawViews.add(rawModel);
      return { ...after, model: encoded(call.encodedArguments, '0'), rawModel,
        modelDates: call.dates.filter(row => row.path[0] === 0)
          .map(row => ({ path: row.path.slice(1), value: row.value })) };
    });
}
function modelWindow(
  index: number,
  previous: MaskSourceOwner | null,
  points: readonly MaskSourceOwner[]
) {
  let before = previous;
  for (const after of points) {
    if (index < after.producerCount) {
      return [...(before ? [before] : []), after, ...changedModels(
        before,
        after
      )];
    }
    before = after;
  }
  return [points.at(-1)!];
}
function phasePoints(
  sample: MaskSample,
  phase: string,
  variant: MaskSourceVariant
): MaskSourceOwner[] {
  if (phase === 'initial') {
    return [readMaskSourceInitial(sample.id, variant).owner];
  }
  const sub = /^step-(\d+)-substep-(\d+)$/.exec(phase);
  if (sub) {
    const value = readMaskSourceSubstep(sample.id, Number(sub[1]), Number(sub[2]), variant);
    return [value.before.owner, value.afterCall.owner, value.actual.owner];
  }
  const macro = /^step-(\d+)$/.exec(phase);
  if (macro) {
    const value = readMaskSourceStep(sample.id, Number(macro[1]), variant);
    return [value.before.owner, value.afterCall.owner, value.actual.owner];
  }
  const closed = /^closed-(\d+)$/.exec(phase);
  if (closed) {
    const index = Number(closed[1]);
    const ordinal = sample.actions.slice(0, index + 1).filter(action => action.type === 'input-escape').length - 1;
    return [readMaskSourceClosed(sample.id, ordinal, variant).after1000.owner];
  }
  const field = phase === 'before-unmount' ? 'beforeUnmount' : phase === 'terminal-tail' ? 'late' : phase;
  assert(
    field === 'beforeUnmount' || field === 'cleanup' || field === 'late',
    'Declared completed lifecycle phase'
  );
  return [readMaskSourceCleanup(sample.id, field, variant).owner];
}
interface SourceWitness {
  ordinal: number; row: number; owner: MaskSourceOwner; publicIDs: Set<number>;
  dateIDs: Array<{ identity: number; internals: Array<number | null> }>;
}
interface SourceWitnessPool {
  frontier: number; limit: number; refs: ReturnType<typeof readMaskSourceProducerChunks>;
  slots: Map<string, SourceWitness[]>; candidates: Map<string, SourceWitness[]>; frames: Map<number, ProducerFrame>;
}
function producerSignature(call: MaskSourceProducer) {
  return JSON.stringify({ name: call.name, arity: call.actualArgumentCount,
    encodedArguments: call.encodedArguments, returned: call.returned,
    dates: call.dates.map(row => ({ path: row.path, encoded: row.value.encoded,
      temporal: row.value.temporal, aliases: row.value.sameAsAuthored })),
    sharing: call.dates.map(a => call.dates.map(b => a.value.identity === b.value.identity)) });
}
function sourceFrame(
  sample: MaskSample,
  ordinal: number,
  variant: MaskSourceVariant,
  pool: SourceWitnessPool
): ProducerFrame {
  const existing = pool.frames.get(ordinal);
  if (existing) {
    return existing;
  }
  const ref = pool.refs[ordinal];
  assert(ref);
  const chunk = readMaskSourceProducerChunk(sample.id, ordinal, variant);
  const frame = {
    phase: ref.phase,
    chunk,
    points: chunk.rows.length ? phasePoints(sample, ref.phase, variant) : []
  };
  pool.frames.set(ordinal, frame);
  if (pool.frames.size > 4) pool.frames.delete(pool.frames.keys().next().value!);
  return frame;
}
function compactModel(owner: MaskSourceOwner): MaskSourceOwner {
  // Keep actual model/Date graphs; cumulative callback/DOM graphs stay in lazy whole parts.
  return {
    ...owner,
    callbacks: [],
    ownerActions: [],
    lifecycle: [],
    rawAuthoredProps: null,
    authoredProps: null
  };
}
function sourceWitnesses(
  sample: MaskSample,
  phase: string,
  variant: MaskSourceVariant,
  proof: MaskProducerProof
): SourceWitnessPool {
  let pool = proof.sourcePools.get(variant);
  if (!pool) {
    pool = { frontier: -1, limit: -1, refs: readMaskSourceProducerChunks(sample.id, variant),
      slots: new Map(), candidates: new Map(), frames: new Map() };
    proof.sourcePools.set(variant, pool);
  }
  const frontier = pool.refs.findIndex(ref => ref.phase === phase);
  assert(frontier >= 0, 'Source has this declared physical/lifecycle transition');
  pool.limit = frontier;
  for (let ordinal = pool.frontier + 1; ordinal <= frontier; ordinal++) {
    const frame = sourceFrame(sample, ordinal, variant, pool);
    const publicIDs = new Set(frame.points.flatMap(owner => [
      ...Object.values(owner.authoredDates).map(date => date.identity),
      ...owner.modelDates.map(date => date.value.identity),
      ...owner.callbacks.flatMap(call => call.dates.map(date => date.value.identity))]));
    const contexts = new Map<string, MaskSourceOwner>();
    for (const [row, call] of frame.chunk.rows.entries()) {
      for (const owner of modelWindow(call.index, frame.points[0], frame.points)) {
        const modelKey = modelSignature(owner), key = modelKey + '\n' + producerSignature(call);
        let context = contexts.get(modelKey);
        if (!context) {
          context = compactModel(owner);
          contexts.set(modelKey, context);
        }
        const values = pool.slots.get(key) ?? [];
        const dateIDs = call.dates.map(date => ({ identity: date.value.identity,
          internals: ['$d', '$x'].map(key => {
            const value = rawAt(date.value.raw, [key]);
            return value && typeof value === 'object' && Object.hasOwn(value, 'ref') ? Number(object(value).ref) : null;
          }) }));
        const witness = { ordinal, row, owner: context, publicIDs, dateIDs };
        values.push(witness);
        pool.slots.set(key, values);
        const signature = producerSignature(call), candidates = pool.candidates.get(signature) ?? [];
        candidates.push(witness);
        pool.candidates.set(signature, candidates);
      }
    }
    pool.frontier = ordinal;
  }
  return pool;
}
function promotedCurrentModel(
  call: MaskSourceProducer,
  owner: MaskSourceOwner,
  witness: SourceWitness,
  pool: SourceWitnessPool,
  proof: MaskProducerProof,
  publicProof: MaskProof,
  variant: MaskSourceVariant
): MaskSourceOwner | null {
  if (call.name !== 'disabledTime' || call.actualArgumentCount !== 1 || owner.kind !== 'single'
    || !['datetime', 'time'].includes(owner.family) || witness.ordinal === 0 || pool.limit === 0) {
    return null;
  }
  if (call.dates.length !== 1 || call.dates[0].path.length !== 1 || call.dates[0].path[0] !== 0
    || owner.modelDates.length !== 1 || owner.modelDates[0].path.length !== 0
    || call.dates[0].value.identity !== owner.modelDates[0].value.identity) {
    return null;
  }
  const established = publicProof.variants.get(variant);
  if (!established) {
    return null;
  }
  const currentFrame = sourceFrame(proof.sample, pool.limit, variant, pool);
  const currentPoints = currentFrame.points.length ? currentFrame.points
    : phasePoints(proof.sample, pool.refs[pool.limit].phase, variant);
  for (const current of currentPoints) {
    if (modelSignature(current) !== modelSignature(owner) || current.modelDates.length !== 1
      || current.modelDates[0].path.length !== 0) {
      continue;
    }
    const sourceID = current.modelDates[0].value.identity;
    if (witness.dateIDs.length !== 1 || witness.dateIDs[0].identity !== sourceID
      || established.forward.get(sourceID) !== owner.modelDates[0].value.identity) {
      continue;
    }
    for (const change of current.callbacks) {
      if (change.name !== 'change' || !change.dates.some(date => date.path.length === 1 && date.path[0] === 0
        && date.value.identity === sourceID) || change.actionIndex < 0 || change.substepIndex < 0) {
        continue;
      }
      const transitionOrdinal = pool.refs.findIndex(ref => ref.phase === 'step-' + change.actionIndex + '-substep-' + change.substepIndex);
      if (transitionOrdinal < witness.ordinal || transitionOrdinal > pool.limit) continue;
      const transition = readMaskSourceSubstep(
        proof.sample.id,
        change.actionIndex,
        change.substepIndex,
        variant
      );
      try {
        assert.deepEqual(transition.actual.owner.callbacks[change.index], change);
        assert.deepEqual(witness.owner.rawModel, transition.before.owner.rawModel,
          'Prior candidate witness belongs to the exact model before this actual Source change');
        assert.deepEqual(transition.actual.owner.rawModel, current.rawModel,
          'Observed Source change establishes the exact current public model graph');
        assert(transition.actual.owner.modelDates.some(date => date.path.length === 0 && date.value.identity === sourceID));
        assert.equal(object(rawAt(change.rawArguments, [0])).ref, sourceID);
        return current;
      }
      catch { /* An unrelated prior model never authorizes this promotion. */ }
    }
  }
  return null;
}
export function createMaskProducerProof(sample: MaskSample) {
  return { sample, cursor: 0, chunks: 0, matchedCalls: 0, localCalls: 0,
    previousOwner: null as MaskSourceOwner | null, returnedIdentity: null as number | null,
    sourceReturnedIdentity: new Map<MaskSourceVariant, number>(),
    sourcePools: new Map<MaskSourceVariant, SourceWitnessPool>(),
    pendingAliases: [] as Array<{ index: number; variant: MaskSourceVariant;
      actual: MaskSourceProducer; source: MaskSourceProducer; publicSourceIDs: Set<number> }> };
}
export type MaskProducerProof = ReturnType<typeof createMaskProducerProof>;
function producerLocal(
  call: MaskSourceProducer,
  index: number,
  owner: MaskSourceOwner,
  proof: MaskProducerProof
) {
  validateInvocation(call, index, owner);
  assert(call.name === 'disabledDate' || call.name === 'disabledTime');
  if (call.receiver.type === 'undefined') {
    assert.deepEqual(
      call.receiver,
      { type: 'undefined', isUndefined: true, isNull: false, identity: null }
    );
  }
  else {
    assert.equal(call.receiver.type, 'object');
    assert.equal(call.receiver.isUndefined, false);
    assert.equal(call.receiver.isNull, false);
    assert(Number.isSafeInteger(call.receiver.identity) && call.receiver.identity! > 0);
  }
  if (call.name === 'disabledDate') {
    assert.equal(call.returned, false);
    assert.equal(object(call.rawReturned).root, false);
    assert.equal(call.returnedIdentity, null);
  }
  else {
    assert(Number.isSafeInteger(call.returnedIdentity) && call.returnedIdentity! > 0);
    assert.equal(object(object(call.rawReturned).root).ref, call.returnedIdentity);
    const node = rawNode(call.rawReturned, call.returnedIdentity);
    assert.deepEqual(node.authoredRole, { authoredTimeRestrictions: true });
    assert.deepEqual(node.properties, []);
    assert.deepEqual(node.ownProperties, []);
    assert.deepEqual(call.returned, { $: 'authored', role: { authoredTimeRestrictions: true } });
    proof.returnedIdentity ??= call.returnedIdentity;
    assert.equal(
      call.returnedIdentity,
      proof.returnedIdentity,
      'Actual time restriction result object stays identical'
    );
  }
}
export function compareMaskProducerChunk(
  chunk: MaskSourceProducerChunk,
  phaseOwners: readonly MaskSourceOwner[],
  proof: MaskProducerProof,
  publicProof: MaskProof,
  label: string,
  compareSource = true
): MaskDifference[] {
  const differences: MaskDifference[] = [];
  const check = (field: string, operation: () => void, variant?: MaskSourceVariant) => {
    try {
      operation();
      return true;
    }
    catch (error) {
      differences.push({ label, variant, field, message: String(error).slice(0, 3000) });
      return false;
    }
  };
  assert(phaseOwners.length > 0);
  check('Native producer cursor/window', () => {
    assert.equal(chunk.cursor, proof.cursor);
    assert.equal(chunk.next - chunk.cursor, chunk.rows.length);
    assert.equal(chunk.observationEnd, chunk.next);
    assert(Number.isSafeInteger(chunk.next) && chunk.next >= proof.cursor);
    for (const count of Object.values(chunk.boundaries)) assert(Number.isSafeInteger(count) && count >= 0 && count <= chunk.next);
    if (chunk.boundaryScope !== 'aggregate-macro-window-covering-earlier-child-parts') {
      let previous = chunk.cursor;
      for (const count of Object.values(chunk.boundaries)) {
        assert(count >= previous);
        previous = count;
      }
    }
    else {
      assert(
        /^step-\d+$/.test(chunk.phase),
        'Only macro boundary windows include prior child parts'
      );
    }
  });
  const pools = new Map<MaskSourceVariant, SourceWitnessPool>();
  if (compareSource && chunk.rows.length) {
    for (const variant of ['first', 'repeat'] as const) {
      check('Source executed-prefix witness domain', () =>
        pools.set(variant, sourceWitnesses(proof.sample, chunk.phase, variant, proof)), variant);
    }
  }
  for (const [offset, call] of chunk.rows.entries()) {
    const index = chunk.cursor + offset;
    const contexts = modelWindow(index, proof.previousOwner, phaseOwners);
    check(
      'producer[' + index + '] actual local raw/return/Date integrity',
      () => producerLocal(call, index, contexts.at(-1)!, proof)
    );
    proof.localCalls++;
    if (!compareSource) continue;
    for (const variant of ['first', 'repeat'] as const) {
      const pool = pools.get(variant);
      let match: MaskSourceProducer | undefined, matchPublic = new Set<number>();
      const errors: string[] = [];
      for (const owner of contexts) {
        const key = modelSignature(owner) + '\n' + producerSignature(call);
        const direct = pool?.slots.get(key) ?? [];
        const promoting = direct.length === 0 && call.name === 'disabledTime' && call.actualArgumentCount === 1;
        const choices = direct.length ? direct : promoting ? pool?.candidates.get(producerSignature(call)) ?? [] : [];
        for (const witness of choices) {
          // Never borrow future observations. Initial closed checks remain initial-only.
          if (witness.ordinal > pool!.limit || chunk.phase === 'initial' && witness.ordinal !== 0) continue;
          const sourceOwner = promoting && pool
            ? promotedCurrentModel(call, owner, witness, pool, proof, publicProof, variant) : witness.owner;
          if (!sourceOwner) continue;
          const established = publicProof.variants.get(variant) ?? bindings();
          const compatible = owner.modelDates.every((date, n) => sourceOwner.modelDates[n]
              && compatibleKnownDate(date.value, sourceOwner.modelDates[n].value, established))
            && call.dates.every((date, n) => {
              const ids = witness.dateIDs[n];
              if (!ids || !compatibleKnownID(date.value.identity, ids.identity, established)) {
                return false;
              }
              return ['$d', '$x'].every((key, index) => {
                const value = rawAt(date.value.raw, [key]), sourceID = ids.internals[index];
                return sourceID === null || !value || typeof value !== 'object' || !Object.hasOwn(
                  value,
                  'ref'
                )
                  || compatibleKnownID(Number(object(value).ref), sourceID, established);
              });
            });
          if (!compatible) {
            if (errors.length < 2) errors.push('Established public Date/$d/$x identity conflicts with this prior Source witness.');
            continue;
          }
          const frame = sourceFrame(proof.sample, witness.ordinal, variant, pool!);
          const original = frame.chunk.rows[witness.row];
          try {
            assert.equal(call.name, original.name);
            assert.equal(call.actualArgumentCount, original.actualArgumentCount);
            producerReceiver(call, original);
            assert.deepEqual(call.encodedArguments, original.encodedArguments);
            assert.deepEqual(call.returned, original.returned);
            const next = cloneBindings(publicProof.variants.get(variant) ?? bindings());
            for (const role of roles) {
              sameDate(
                owner.authoredDates[role],
                sourceOwner.authoredDates[role],
                owner,
                next
              );
            }
            assert.equal(owner.modelDates.length, sourceOwner.modelDates.length);
            owner.modelDates.forEach((date, n) => {
              assert.deepEqual(date.path, sourceOwner.modelDates[n].path);
              sameDate(date.value, sourceOwner.modelDates[n].value, owner, next);
            });
            sameRaw(owner.rawModel, sourceOwner.rawModel, next);
            // Ephemeral call/argument/info/candidate IDs use fresh maps seeded with public bindings.
            const local = cloneBindings(next);
            sameRaw(call.rawArguments, original.rawArguments, local);
            sameRaw(call.rawReturned, original.rawReturned, local);
            assert.equal(call.dates.length, original.dates.length);
            call.dates.forEach((date, n) => {
              assert.deepEqual(date.path, original.dates[n].path);
              sameDate(date.value, original.dates[n].value, owner, local);
            });
            if (call.name === 'disabledTime') {
              const old = proof.sourceReturnedIdentity.get(variant);
              if (old !== undefined) assert.equal(original.returnedIdentity, old);
              proof.sourceReturnedIdentity.set(variant, original.returnedIdentity!);
              bind(call.returnedIdentity!, original.returnedIdentity!, next);
            }
            publicProof.variants.set(variant, next);
            match = original;
            matchPublic = new Set([...witness.publicIDs, ...sourceOwner.modelDates.map(date => date.value.identity)]);
            break;
          }
          catch (error) { if (errors.length < 2) errors.push(String(error).slice(0, 700)); }
        }
        if (match) break;
      }
      check('producer[' + index + '] full Source argument/return/model/from witness', () => {
        assert(match, 'No strict Source ' + variant + ' witness in ' + chunk.phase
          + (chunk.phase === 'initial' ? ' INITIAL CLOSED ONLY' : ' established observed-model/candidate/from prefix (no future pool)') + ': ' + errors.join('; '));
      }, variant);
      if (match) {
        proof.pendingAliases.push({
          index,
          variant,
          actual: call,
          source: match,
          publicSourceIDs: matchPublic
        });
        proof.matchedCalls++;
      }
    }
  }
  proof.cursor = chunk.next;
  proof.previousOwner = phaseOwners.at(-1)!;
  proof.chunks++;
  return differences;
}
export function verifyMaskProducerPublicAliases(
  proof: MaskProducerProof,
  publicProof: MaskProof
): MaskDifference[] {
  const differences: MaskDifference[] = [];
  for (const pair of proof.pendingAliases) {
    try {
      const map = publicProof.variants.get(pair.variant);
      assert(map);
      pair.source.dates.forEach((date, index) => {
        const actual = pair.actual.dates[index];
        assert.deepEqual(actual.path, date.path);
        if (pair.publicSourceIDs.has(date.value.identity)) {
          assert(
            map.forward.has(date.value.identity),
            'Source public Date anchor unresolved after earlier public callback/model mismatches: ' + date.value.identity
          );
          assert.equal(
            actual.value.identity,
            map.forward.get(date.value.identity),
            'Producer retains actual public Date/from object'
          );
        }
        if (map.reverse.has(actual.value.identity)) {
          assert.equal(
            map.reverse.get(actual.value.identity),
            date.value.identity
          );
        }
      });
    }
    catch (error) { differences.push({ label: proof.sample.id + '/producer[' + pair.index + ']', variant: pair.variant,
      field: 'public candidate/from alias', message: String(error).slice(0, 3000) }); }
  }
  return differences;
}
