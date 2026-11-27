import assert from 'node:assert/strict';
import {
  readQuarterSourceProducerChunks, readQuarterSourceProducerChunk
} from './date-picker-quarter-reference.mjs';
import type { QuarterSample, QuarterAuthoredDateName } from './date-picker-quarter-cases.mjs';
import type {
  QuarterSourcePoint, QuarterSourceOwner, QuarterSourceDate,
  QuarterSourceDatePath, QuarterSourceInvocation, QuarterSourcePopup,
  QuarterSourceVariant, QuarterSourceSurface
} from './date-picker-quarter-reference.mjs';

export interface NativeQuarterPoint extends Omit<QuarterSourcePoint, 'refs' | 'popups'> {
  refs: { owner: number | null; root: number | null; control: null | {
    identity: number; own: unknown; encoded: unknown; raw: unknown;
    focusIdentity: number; blurIdentity: number;
  } };
  popups: Array<QuarterSourcePopup & {
    dateCells: Array<QuarterSourcePopup['dateCells'][number] & {
      button: QuarterSourceSurface | null;
    }>;
  }>;
}
export const quarterBoundaries = Object.freeze({
  receiver: 'Source public callback receiver is undefined; Native props-function receiver is an object.',
  singleCalendarInfo: 'Source Single calendar info {}; Native exactly {source:"date"}.',
  singleEmptyCalendar: 'Source Single reset undefined/undefined/{}; Native null/empty-string/{source:"date"}.',
  focusAndRefs: 'Source composite handle changes; Native control/root remain separate and stable. Native full-button panel keyboard/focus contract is retained; no Source handle/getter is synthesized.',
  closedPopup: 'Source retains hidden popup DOM; Native conditionally removes it. Only visible panel state is compared.',
  afterCall: 'Complete immediate reads stay raw. React/Svelte scheduler prefixes are not a settled-state equality claim.',
  producers: 'Every actual invocation/cursor/argument/return is retained; renderer invocation counts are not equated.'
});
const authoredNames: QuarterAuthoredDateName[] = ['initialStart', 'initialEnd', 'minDate',
  'maxDate', 'presetA', 'presetB', 'witnessStart', 'witnessEnd'];
// Narrows an unknown value before the recording. null and arrays result in a verification error.
const object = (value: unknown): Record<string, unknown> => {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value));
  return value as Record<string, unknown>;
};
// Confirms the shape of the array, leaving its elements unknown until a separate inspection.
const array = (value: unknown): unknown[] => {
  assert(Array.isArray(value));
  return value;
};
// Reads its own properties of a serialized object and checks the shape of each line.
const properties = (value: unknown) => array(object(value).properties).map(object);
// Extends meaning by name properties. The missing entry is considered an incomplete picture.
const property = (value: unknown, key: string) => {
  const row = properties(value).find(row => row.key === key);
  assert(row, 'Complete observed property ' + key);
  return row.value;
};
// Seeks the source object by identifier. The no-object link interrupts the image check.
const rawNode = (graph: unknown, ref: unknown) => {
  const node = array(object(graph).objects).map(object).find(node => node.id === ref);
  assert(node, 'Actual raw node binding');
  return node;
};
// Goes from the root of the serialized graph, allowing links at every step.
function rawAt(graph: unknown, path: Array<string | number>) {
  let value: unknown = object(graph).root;
  for (const key of path) value = property(rawNode(graph, object(value).ref), String(key));
  return value;
}
// Looking for an attribute by name. The missing attribute remains null to compare images.
const attr = (surface: QuarterSourceSurface, name: string) =>
  surface.attributes.find(row => row[0] === name)?.[1] ?? null;

export function readNativeQuarterPoint(value: unknown): NativeQuarterPoint {
  const point = object(value), owner = object(point.owner);
  assert.equal(owner.picker, 'quarter');
  assert(['first', 'last'].includes(String(owner.disabledBoundary)));
  assert.equal(typeof owner.id, 'string');
  assert.equal(typeof owner.actionIndex, 'number');
  for (const key of ['alive', 'open', 'limited', 'localized', 'order', 'witness']) {
    assert.equal(typeof owner[key], 'boolean');
  }
  for (const key of ['callbacks', 'modelDates', 'lifecycle', 'ownerActions']) array(owner[key]);
  object(owner.authoredDates);
  object(point.refs);
  for (const key of ['inputs', 'popups', 'retained', 'events']) array(point[key]);
  return value as NativeQuarterPoint;
}
interface IdentityProof {
  dates: Map<number, number>; nativeDates: Map<number, number>;
  modes: Map<number, number>; nativeModes: Map<number, number>;
}
export function createQuarterProof() {
  return { root: null as number | null, control: null as number | null,
    focus: null as number | null, blur: null as number | null, inputs: [] as number[],
    variants: new Map<QuarterSourceVariant, IdentityProof>(), points: 0,
    boundaries: quarterBoundaries, observations: [] as unknown[] };
}
// Checks the correspondence in both directions, excluding the merging of different objects in one
// pair of shots.
function bindIdentity(
  actual: number,
  source: number,
  forward: Map<number, number>,
  reverse: Map<number, number>,
  label: string
) {
  if (forward.has(source)) assert.equal(actual, forward.get(source), label + ' shared identity');
  if (reverse.has(actual)) assert.equal(source, reverse.get(actual), label + ' distinct identity');
  forward.set(source, actual);
  reverse.set(actual, source);
}
function validateDate(value: QuarterSourceDate, owner: QuarterSourceOwner) {
  assert.equal(value.temporal.valid, true);
  const inputDate = new Date(value.temporal.epoch);
  assert.equal(inputDate.toISOString(), value.temporal.iso);
  assert.equal(value.temporal.fields.length, 7);
  assert.equal(object(object(value.raw).root).ref, value.identity);
  assert.deepEqual(['$y', '$M', '$D', '$H', '$m', '$s', '$ms']
    .map(key => rawAt(value.raw, [key])), value.temporal.fields,
  'Raw Dayjs wall fields match the actual temporal snapshot');
  for (const role of authoredNames) {
    assert.equal(value.sameAsAuthored[role], value.identity === owner.authoredDates[role].identity,
      'Actual authored date alias ' + role);
  }
}
function sameDate(
  actual: QuarterSourceDate,
  source: QuarterSourceDate,
  owner: QuarterSourceOwner,
  proof: IdentityProof
) {
  validateDate(actual, owner);
  assert.deepEqual(Object.keys(actual.temporal), Object.keys(source.temporal));
  for (const key of ['valid', 'epoch', 'iso', 'fields', 'locale'] as const) {
    assert.deepEqual(actual.temporal[key], source.temporal[key], 'Complete Dayjs ' + key);
  }
  // JSON preserves 0 instead of the directly transmitted numerical -0; the remaining fields are strict.
  assert.equal(actual.temporal.utcOffset === source.temporal.utcOffset, true);
  assert.deepEqual(actual.sameAsAuthored, source.sameAsAuthored);
  assert.deepEqual(actual.encoded, source.encoded);
  bindIdentity(actual.identity, source.identity, proof.dates, proof.nativeDates, 'Dayjs');
}
function sameDates(
  actual: QuarterSourceDatePath[],
  source: QuarterSourceDatePath[],
  raw: unknown,
  owner: QuarterSourceOwner,
  proof: IdentityProof
) {
  assert.equal(actual.length, source.length);
  for (const [index, date] of actual.entries()) {
    assert.deepEqual(date.path, source[index].path);
    sameDate(date.value, source[index].value, owner, proof);
    assert.equal(object(rawAt(raw, date.path)).ref, date.value.identity);
  }
}
export function verifyQuarterReceiverBoundary(
  actual: QuarterSourceInvocation,
  source: QuarterSourceInvocation
) {
  assert.deepEqual(source.receiver, {
    type: 'undefined', isUndefined: true, isNull: false, identity: null
  });
  assert.equal(actual.receiver.type, 'object');
  assert.equal(actual.receiver.isUndefined, false);
  assert.equal(actual.receiver.isNull, false);
  assert(Number.isSafeInteger(actual.receiver.identity) && actual.receiver.identity! > 0);
}
export function verifyQuarterSingleCalendarInfoBoundary(
  actual: QuarterSourceInvocation,
  source: QuarterSourceInvocation
) {
  assert.deepEqual(property(source.encodedArguments, '2'), { $: 'object', properties: [] });
  assert.deepEqual(property(actual.encodedArguments, '2'), {
    $: 'object', properties: [{ key: 'source', value: 'date' }]
  });
}
export function verifyQuarterSingleEmptyCalendarBoundary(
  actual: QuarterSourceInvocation,
  source: QuarterSourceInvocation
) {
  assert.equal(actual.dates.length, 0);
  assert.equal(source.dates.length, 0);
  for (const key of ['0', '1']) {
    assert.deepEqual(property(source.encodedArguments, key), { $: 'undefined' });
  }
  assert.equal(property(actual.encodedArguments, '0'), null);
  assert.equal(property(actual.encodedArguments, '1'), '');
  verifyQuarterSingleCalendarInfoBoundary(actual, source);
}
function modeArray(call: QuarterSourceInvocation) {
  const path = call.name === 'panel' ? [1] : call.name === 'picker-value' ? [1, 'mode'] : null;
  if (!path) {
    return null;
  }
  const value = rawAt(call.rawArguments, path);
  if (!value || typeof value !== 'object' || !('ref' in value)) {
    return null;
  }
  const node = rawNode(call.rawArguments, object(value).ref);
  assert.equal(node.array, true);
  return node;
}
function sameCallbacks(
  actual: NativeQuarterPoint,
  source: QuarterSourcePoint,
  proof: IdentityProof
) {
  const originals = source.owner.callbacks;
  assert.equal(actual.owner.callbacks.length, originals.length, 'Complete public callback count');
  for (const [index, call] of actual.owner.callbacks.entries()) {
    const expected = originals[index];
    for (const key of ['index', 'actionIndex', 'name', 'actualArgumentCount'] as const) {
      assert.equal(call[key], expected[key], 'Full callback ' + key);
    }
    verifyQuarterReceiverBoundary(call, expected);
    sameDates(call.dates, expected.dates, call.rawArguments, actual.owner, proof);
    const keys = properties(call.encodedArguments).map(row => row.key);
    assert.deepEqual(keys, properties(expected.encodedArguments).map(row => row.key));
    const single = actual.owner.id.startsWith('single-') && call.name === 'calendar';
    const empty = single && expected.dates.length === 0
      && object(property(expected.encodedArguments, '0')).$ === 'undefined';
    if (empty) {
      verifyQuarterSingleEmptyCalendarBoundary(call, expected);
    }
    else if (single) verifyQuarterSingleCalendarInfoBoundary(call, expected);
    for (const key of keys) {
      assert(typeof key === 'string');
      if (single && key === '2' || empty && (key === '0' || key === '1')) continue;
      assert.deepEqual(property(call.encodedArguments, key), property(
        expected.encodedArguments,
        key
      ),
        'Exact callback payload and picker-info own-key order');
    }
    if (actual.owner.id.startsWith('range-')) {
      const a = modeArray(call), s = modeArray(expected);
      assert.equal(a === null, s === null);
      if (a && s) {
        assert.deepEqual(a.ownProperties, s.ownProperties);
        assert.deepEqual(a.properties, s.properties);
        bindIdentity(a.id as number, s.id as number, proof.modes, proof.nativeModes, 'Mode tuple');
      }
    }
  }
}
function visiblePanels(point: Pick<QuarterSourcePoint, 'popups'>) {
  return point.popups.filter(popup => popup.visible).map(popup => ({
    count: popup.panels.length,
    cells: popup.dateCells.map(cell => ({ mode: panelMode(cell.mode), title: cell.title,
      text: cell.surface.text, selected: cell.selected, rangeStart: cell.rangeStart,
      rangeEnd: cell.rangeEnd, inRange: cell.inRange, disabled: cell.disabled,
      inView: cellFlag(cell.surface, 'in-view'), hover: cellFlag(cell.surface, 'hover'),
      today: cellFlag(cell.surface, 'today') })),
    headers: popup.headerButtons.map(button => ({ text: button.text,
      label: attr(button, 'aria-label'), disabled: button.disabled,
      visible: button.css.visibility !== 'hidden' && button.css.display !== 'none' })),
    footers: popup.footerControls.map(control => ({ disabled: control.disabled })),
    timeColumns: popup.columns
  }));
}
function cellFlag(surface: QuarterSourceSurface, name: string) {
  return (attr(surface, 'class') ?? '').split(/\s+/).includes('ant-picker-cell-' + name);
}
function panelMode(className: string) {
  const names = ['date', 'quarter', 'month', 'year', 'decade'];
  const tokens = className.split(/\s+/);
  const modes = names.filter(name => tokens.includes('ant-picker-' + name + '-panel'));
  assert.equal(modes.length, 1, 'One actual calendar mode class token');
  return modes[0];
}
function verifyPoint(
  actual: NativeQuarterPoint,
  source: QuarterSourcePoint,
  proof: ReturnType<typeof createQuarterProof>,
  variant: QuarterSourceVariant,
  label: string,
  settled: boolean
) {
  const existing = proof.variants.get(variant);
  const next: IdentityProof = existing ? { dates: new Map(existing.dates),
    nativeDates: new Map(existing.nativeDates), modes: new Map(existing.modes),
    nativeModes: new Map(existing.nativeModes) }
    : { dates: new Map(), nativeDates: new Map(), modes: new Map(), nativeModes: new Map() };
  for (const key of ['id', 'actionIndex', 'alive', 'picker', 'open', 'needConfirm',
    'limited', 'disabledBoundary', 'localized', 'order', 'witness'] as const) {
    assert.deepEqual(actual.owner[key], source.owner[key], label + ':' + key);
  }
  for (const role of authoredNames) {
    sameDate(actual.owner.authoredDates[role], source.owner.authoredDates[role], actual.owner, next);
  }
  assert.deepEqual(actual.owner.model, source.owner.model);
  sameDates(
    actual.owner.modelDates,
    source.owner.modelDates,
    actual.owner.rawModel,
    actual.owner,
    next
  );
  assert.deepEqual(actual.inputs.map(input => ({ value: input.value,
    placeholder: attr(input, 'placeholder'), disabled: attr(input, 'disabled') !== null })),
  source.inputs.map(input => ({ value: input.value,
    placeholder: attr(input, 'placeholder'), disabled: attr(input, 'disabled') !== null })));
  sameCallbacks(actual, source, next);
  if (settled) {
    assert.deepEqual(
      visiblePanels(actual),
      visiblePanels(source),
      'Visible calendar/header/footer state'
    );
  }
  if (actual.owner.alive) {
    assert(actual.root?.connected);
    proof.root ??= actual.root.identity;
    proof.control ??= actual.refs.control?.identity ?? null;
    proof.focus ??= actual.refs.control?.focusIdentity ?? null;
    proof.blur ??= actual.refs.control?.blurIdentity ?? null;
    if (!proof.inputs.length) proof.inputs = actual.inputs.map(input => input.identity);
    assert.equal(actual.root.identity, proof.root);
    assert.equal(actual.refs.root, proof.root);
    assert.equal(actual.refs.control?.identity, proof.control);
    assert.equal(actual.refs.control?.focusIdentity, proof.focus);
    assert.equal(actual.refs.control?.blurIdentity, proof.blur);
    assert.equal(actual.sameOwnerAsInitial, true);
    assert.equal(actual.sameRootAsInitial, true);
    assert.deepEqual(actual.inputs.map(input => input.identity), proof.inputs);
    const focused = object(actual.focus);
    for (const input of actual.inputs) {
      assert.equal(
        input.focused,
        input.identity === focused.identity,
        'Actual physical focus sidecar'
      );
    }
  }
  else {
    assert.deepEqual(actual.refs, { owner: null, root: null, control: null });
    assert.equal(actual.inputs.length, 0);
    assert.equal(actual.popups.length, 0);
    assert(actual.retained.every(node => !node.connected));
    assert.deepEqual(actual.owner.lifecycle, source.owner.lifecycle);
  }
  proof.variants.set(variant, next);
  proof.points++;
  proof.observations.push({ label, variant, callbackCount: actual.owner.callbacks.length,
    sourceProducerCount: source.owner.producerCount, nativeProducerCount: actual.owner.producerCount,
    sourceFocus: source.focus, nativeFocus: actual.focus,
    sourceCaret: source.inputs.map(input => [input.selectionStart, input.selectionEnd, input.selectionDirection]),
    nativeCaret: actual.inputs.map(input => [input.selectionStart, input.selectionEnd, input.selectionDirection]) });
}
export function verifyQuarterPoint(
  actual: NativeQuarterPoint,
  source: QuarterSourcePoint,
  proof: ReturnType<typeof createQuarterProof>,
  variant: QuarterSourceVariant,
  label: string
) {
  verifyPoint(actual, source, proof, variant, label, true);
}
export function verifyQuarterInputPhase(
  actual: NativeQuarterPoint,
  source: QuarterSourcePoint,
  proof: ReturnType<typeof createQuarterProof>,
  variant: QuarterSourceVariant,
  label: string
) {
  verifyPoint(actual, source, proof, variant, label, false);
}
export interface QuarterProducerProof {
  cursor: number;
  boundary: number;
  chunks: number;
  witnesses: Map<QuarterSourceVariant, Set<string>>;
  matchedInvocations: number;
}
function producerSignature(call: Record<string, unknown>) {
  const dates = array(call.dates) as QuarterSourceDatePath[];
  const info = object(property(call.encodedArguments, '1'));
  const keys = properties(info).map(row => row.key);
  const candidate = dates.find(date => date.path.length === 1 && date.path[0] === 0);
  assert(candidate, 'Actual disabledDate first argument is a Dayjs');
  const from = dates.find(date => date.path.length === 2
    && date.path[0] === 1 && date.path[1] === 'from');
  const fromOwn = keys.includes('from');
  const fromValue = fromOwn ? property(info, 'from') : undefined;
  assert.equal(from !== undefined, fromOwn && object(fromValue).$ !== 'undefined');
  return JSON.stringify({
    name: call.name,
    boundary: call.boundary,
    arity: call.actualArgumentCount,
    encodedArguments: call.encodedArguments,
    infoKeys: keys,
    type: property(info, 'type'),
    datePaths: dates.map(date => date.path),
    dateAliases: dates.map(a => dates.map(b => a.value.identity === b.value.identity)),
    candidate: { temporal: candidate.value.temporal,
      sameAsAuthored: candidate.value.sameAsAuthored },
    from: from ? { temporal: from.value.temporal, sameAsAuthored: from.value.sameAsAuthored }
      : { own: fromOwn, encoded: fromValue },
    returned: call.returned
  });
}
export function createQuarterProducerProof(sample: QuarterSample): QuarterProducerProof {
  const witnesses = new Map<QuarterSourceVariant, Set<string>>();
  for (const variant of ['first', 'repeat'] as const) {
    const signatures = new Set<string>();
    const references = readQuarterSourceProducerChunks(sample.id, variant);
    for (const [index] of references.entries()) {
      const chunk = readQuarterSourceProducerChunk(sample.id, index, variant);
      for (const call of chunk.rows) {
        assert.deepEqual(call.receiver, {
          type: 'undefined', isUndefined: true, isNull: false, identity: null
        });
        signatures.add(producerSignature(call as unknown as Record<string, unknown>));
      }
    }
    // Only bounded semantic signatures are retained. Whole original Source parts stay in the reader.
    witnesses.set(variant, signatures);
  }
  return { cursor: 0, boundary: 0, chunks: 0, witnesses, matchedInvocations: 0 };
}
export function verifyQuarterProducerChunk(
  value: unknown,
  proof: QuarterProducerProof,
  owner: QuarterSourceOwner,
  boundaries: Record<string, number>,
  sample: QuarterSample
) {
  const chunk = object(value);
  assert.equal(chunk.cursor, proof.cursor);
  assert(Number.isSafeInteger(chunk.next) && Number(chunk.next) >= proof.cursor);
  const rows = array(chunk.rows).map(object);
  assert.equal(rows.length, Number(chunk.next) - proof.cursor);
  for (const [index, call] of rows.entries()) {
    assert.equal(call.index, proof.cursor + index);
    assert.equal(call.name, 'disabledDate');
    assert.equal(call.actualArgumentCount, 2);
    assert(['first', 'last'].includes(String(call.boundary)));
    assert.equal(typeof call.returned, 'boolean');
    assert(Number.isInteger(call.actionIndex) && Number(call.actionIndex) >= -1
      && Number(call.actionIndex) < sample.actions.length);
    assert.equal(rawAt(call.rawArguments, ['length']), 2);
    assert.equal(property(call.encodedArguments, 'length'), 2);
    const dates = array(call.dates) as QuarterSourceDatePath[];
    assert.deepEqual(dates[0]?.path, [0]);
    for (const date of dates) {
      validateDate(date.value, owner);
      assert.equal(object(rawAt(call.rawArguments, date.path)).ref, date.value.identity);
    }
    const info = property(call.encodedArguments, '1');
    assert.equal(property(info, 'type'), 'quarter');
    const candidate = dates[0].value;
    const month = call.boundary === 'first' ? sample.blocked.firstMonth : sample.blocked.lastMonth;
    assert.equal(call.returned, candidate.temporal.fields[0] === sample.blocked.year
      && candidate.temporal.fields[1] === month, 'Actual authored disabledDate predicate result');
    const receiver = object(call.receiver);
    assert.equal(receiver.type, 'object');
    assert.equal(receiver.isUndefined, false);
    assert.equal(receiver.isNull, false);
    assert(Number.isSafeInteger(receiver.identity) && Number(receiver.identity) > 0);
    const signature = producerSignature(call);
    for (const variant of ['first', 'repeat'] as const) {
      assert(proof.witnesses.get(variant)?.has(signature),
        'Actual disabledDate argument/return signature exists in Source ' + variant);
    }
    proof.matchedInvocations++;
  }
  for (const count of Object.values(boundaries)) {
    assert(Number.isSafeInteger(count) && count >= proof.boundary && count <= Number(chunk.next),
      'Actual monotonic producer observation boundary');
    proof.boundary = count;
  }
  proof.cursor = Number(chunk.next);
  proof.chunks++;
}
