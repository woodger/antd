import assert from 'node:assert/strict';
import {
  readDateWeekPrefixSourceProducerChunks, readDateWeekPrefixSourceProducerChunk, readDateWeekPrefixSourceInitial,
  readDateWeekPrefixSourceStep, readDateWeekPrefixSourceClosed, readDateWeekPrefixSourceCleanup
} from './date-picker-date-week-prefix-reference.mjs';
import type { DateWeekPrefixSample, DateWeekPrefixAuthoredDateName } from './date-picker-date-week-prefix-cases.mjs';
import type {
  DateWeekPrefixSourcePoint, DateWeekPrefixSourceOwner, DateWeekPrefixSourceDate,
  DateWeekPrefixSourceDatePath, DateWeekPrefixSourceInvocation, DateWeekPrefixSourcePopup,
  DateWeekPrefixSourceVariant, DateWeekPrefixSourceSurface
} from './date-picker-date-week-prefix-reference.mjs';

export interface NativeDateWeekPrefixPoint extends Omit<DateWeekPrefixSourcePoint, 'refs' | 'popups'> {
  refs: { owner: number | null; root: number | null; control: null | {
    identity: number; own: unknown; encoded: unknown; raw: unknown;
    focusIdentity: number; blurIdentity: number;
  } };
  popups: Array<DateWeekPrefixSourcePopup & {
    dateCells: Array<DateWeekPrefixSourcePopup['dateCells'][number] & {
      button: DateWeekPrefixSourceSurface | null;
    }>;
  }>;
}
export const dateWeekPrefixBoundaries = Object.freeze({
  receiver: 'Source public callback receiver is undefined; Native props-function receiver is an object.',
  singleCalendarInfo: 'Source Single calendar info {}; Native exactly {source:"date"}.',
  singleEmptyCalendar: 'Source Single reset undefined/undefined/{}; Native null/empty-string/{source:"date"}.',
  focusAndRefs: 'Source composite handle changes; Native control/root remain separate and stable. Native full-button panel keyboard/focus contract is retained; no Source handle/getter is synthesized.',
  closedPopup: 'Source retains hidden popup DOM; Native conditionally removes it. Only visible panel state is compared.',
  afterCall: 'Complete immediate reads stay raw. React/Svelte scheduler prefixes are not a settled-state equality claim.',
  producers: 'Every actual invocation/cursor/argument/return is retained; renderer invocation counts are not equated.',
  todayControl: 'Existing Native full-button calendar: Source Today A retains disabled:null and aria/class availability; Native Today BUTTON retains real disabled and accessible-name checks.'
});
const authoredNames: DateWeekPrefixAuthoredDateName[] = ['initialStart', 'initialEnd'];
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
const attr = (surface: DateWeekPrefixSourceSurface, name: string) =>
  surface.attributes.find(row => row[0] === name)?.[1] ?? null;

export function readNativeDateWeekPrefixPoint(value: unknown): NativeDateWeekPrefixPoint {
  const point = object(value), owner = object(point.owner);
  assert.equal(owner.picker, 'date');
  assert(['us', 'gb'].includes(String(owner.localeName)));
  assert.equal(typeof owner.weekNumbers, 'boolean');
  assert.equal(typeof owner.id, 'string');
  assert.equal(typeof owner.actionIndex, 'number');
  for (const key of ['alive', 'open', 'localized']) {
    assert.equal(typeof owner[key], 'boolean');
  }
  for (const key of ['callbacks', 'modelDates', 'lifecycle', 'ownerActions']) array(owner[key]);
  object(owner.authoredDates);
  object(point.refs);
  for (const key of ['inputs', 'popups', 'retained', 'events']) array(point[key]);
  return value as NativeDateWeekPrefixPoint;
}
interface IdentityProof {
  dates: Map<number, number>; nativeDates: Map<number, number>;
  modes: Map<number, number>; nativeModes: Map<number, number>;
}
export function createDateWeekPrefixProof() {
  return { root: null as number | null, control: null as number | null,
    focus: null as number | null, blur: null as number | null, inputs: [] as number[],
    variants: new Map<DateWeekPrefixSourceVariant, IdentityProof>(), points: 0,
    boundaries: dateWeekPrefixBoundaries, observations: [] as unknown[] };
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
function validateDate(value: DateWeekPrefixSourceDate, owner: DateWeekPrefixSourceOwner) {
  assert.equal(value.temporal.valid, true);
  assert.equal(new Date(value.temporal.epoch).toISOString(), value.temporal.iso);
  assert.equal(value.temporal.fields.length, 7);
  assert.equal(object(object(value.raw).root).ref, value.identity);
  assert.deepEqual(['$y', '$M', '$D', '$H', '$m', '$s', '$ms']
    .map(key => rawAt(value.raw, [key])), value.temporal.fields,
  'Raw Dayjs wall fields match the actual temporal snapshot');
  assert.equal(rawAt(value.raw, ['$L']), value.temporal.locale, 'Raw Dayjs locale');
  for (const role of authoredNames) {
    assert.equal(value.sameAsAuthored[role], value.identity === owner.authoredDates[role].identity,
      'Actual authored date alias ' + role);
  }
}
function sameDate(
  actual: DateWeekPrefixSourceDate,
  source: DateWeekPrefixSourceDate,
  owner: DateWeekPrefixSourceOwner,
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
  actual: DateWeekPrefixSourceDatePath[],
  source: DateWeekPrefixSourceDatePath[],
  raw: unknown,
  owner: DateWeekPrefixSourceOwner,
  proof: IdentityProof
) {
  assert.equal(actual.length, source.length);
  for (const [index, date] of actual.entries()) {
    assert.deepEqual(date.path, source[index].path);
    sameDate(date.value, source[index].value, owner, proof);
    assert.equal(object(rawAt(raw, date.path)).ref, date.value.identity);
  }
}
export function verifyDateWeekPrefixReceiverBoundary(
  actual: DateWeekPrefixSourceInvocation,
  source: DateWeekPrefixSourceInvocation
) {
  assert.deepEqual(source.receiver, {
    type: 'undefined', isUndefined: true, isNull: false, identity: null
  });
  assert.equal(actual.receiver.type, 'object');
  assert.equal(actual.receiver.isUndefined, false);
  assert.equal(actual.receiver.isNull, false);
  assert(Number.isSafeInteger(actual.receiver.identity) && actual.receiver.identity! > 0);
}
export function verifyDateWeekPrefixSingleCalendarInfoBoundary(
  actual: DateWeekPrefixSourceInvocation,
  source: DateWeekPrefixSourceInvocation
) {
  assert.deepEqual(property(source.encodedArguments, '2'), { $: 'object', properties: [] });
  assert.deepEqual(property(actual.encodedArguments, '2'), {
    $: 'object', properties: [{ key: 'source', value: 'date' }]
  });
}
export function verifyDateWeekPrefixSingleEmptyCalendarBoundary(
  actual: DateWeekPrefixSourceInvocation,
  source: DateWeekPrefixSourceInvocation
) {
  assert.equal(actual.dates.length, 0);
  assert.equal(source.dates.length, 0);
  for (const key of ['0', '1']) {
    assert.deepEqual(property(source.encodedArguments, key), { $: 'undefined' });
  }
  assert.equal(property(actual.encodedArguments, '0'), null);
  assert.equal(property(actual.encodedArguments, '1'), '');
  verifyDateWeekPrefixSingleCalendarInfoBoundary(actual, source);
}
function modeArray(call: DateWeekPrefixSourceInvocation) {
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
  actual: NativeDateWeekPrefixPoint,
  source: DateWeekPrefixSourcePoint,
  proof: IdentityProof
) {
  const originals = source.owner.callbacks;
  assert.equal(actual.owner.callbacks.length, originals.length, 'Complete public callback count');
  for (const [index, call] of actual.owner.callbacks.entries()) {
    const expected = originals[index];
    for (const key of ['index', 'actionIndex', 'name', 'actualArgumentCount'] as const) {
      assert.equal(call[key], expected[key], 'Full callback ' + key);
    }
    verifyDateWeekPrefixReceiverBoundary(call, expected);
    sameDates(call.dates, expected.dates, call.rawArguments, actual.owner, proof);
    const keys = properties(call.encodedArguments).map(row => row.key);
    assert.deepEqual(keys, properties(expected.encodedArguments).map(row => row.key));
    const single = actual.owner.id.startsWith('single-') && call.name === 'calendar';
    const empty = single && expected.dates.length === 0
      && object(property(expected.encodedArguments, '0')).$ === 'undefined';
    if (empty) {
      verifyDateWeekPrefixSingleEmptyCalendarBoundary(call, expected);
    }
    else if (single) verifyDateWeekPrefixSingleCalendarInfoBoundary(call, expected);
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
function visiblePanels(point: Pick<DateWeekPrefixSourcePoint, 'popups'>) {
  return point.popups.filter(popup => popup.visible).map(popup => ({
    count: popup.panels.length,
    cells: popup.dateCells.map(cell => ({ mode: panelMode(cell.mode), title: cell.title,
      explicitShowWeekModifier: cell.mode.split(/\s+/).includes('ant-picker-date-panel-show-week'),
      weekNumber: cell.weekNumber,
      text: cell.surface.text, selected: cell.selected, rangeStart: cell.rangeStart,
      rangeEnd: cell.rangeEnd, inRange: cell.inRange, disabled: cell.disabled,
      inView: cellFlag(cell.surface, 'in-view'), hover: cellFlag(cell.surface, 'hover'),
      today: cellFlag(cell.surface, 'today') })),
    headers: popup.headerButtons.map(button => ({ text: button.text,
      label: attr(button, 'aria-label'), disabled: button.disabled,
      visible: button.css.visibility !== 'hidden' && button.css.display !== 'none' })),
    tables: popup.tables.map(table => ({ tag: table.surface.tag,
      headers: table.headers.map(header => ({ tag: header.surface.tag,
        cells: header.cells.map(cell => ({ tag: cell.surface.tag, text: cell.surface.text,
          weekNumber: (attr(cell.surface, 'class') ?? '').split(/\s+/).includes('ant-picker-cell-week'),
          contents: cell.contents.map(content => ({ tag: content.tag, text: content.text,
            display: content.css.display, visibility: content.css.visibility })) })) })),
      rows: table.rows.map(row => ({ tag: row.surface.tag, selected: row.selected,
        hover: row.hover, rangeStart: row.rangeStart, rangeEnd: row.rangeEnd,
        rangeHover: row.rangeHover,
        cells: row.cells.map(cell => ({ tag: cell.surface.tag, title: cell.title,
          weekNumber: cell.weekNumber, text: cell.surface.text, disabled: cell.disabled,
          selected: cellFlag(cell.surface, 'selected'), rangeStart: cellFlag(
            cell.surface,
            'range-start'
          ),
          rangeEnd: cellFlag(cell.surface, 'range-end'), inRange: cellFlag(cell.surface, 'in-range'),
          inView: cellFlag(cell.surface, 'in-view'), hover: cellFlag(cell.surface, 'hover'),
          today: cellFlag(cell.surface, 'today') })) })) })),
    timeColumns: popup.columns
  }));
}
export function verifyDateWeekPrefixFooterBoundary(
  actual: NativeDateWeekPrefixPoint,
  source: DateWeekPrefixSourcePoint
) {
  const native = actual.popups.filter(popup => popup.visible);
  const original = source.popups.filter(popup => popup.visible);
  assert.equal(native.length, original.length);
  for (const [index, popup] of original.entries()) {
    const controls = native[index].footerControls;
    assert.equal(controls.length, popup.footerControls.length, 'Actual footer control count');
    for (const [ordinal, expected] of popup.footerControls.entries()) {
      const control = controls[ordinal];
      assert.equal(expected.tag, 'A');
      assert.equal(
        expected.disabled,
        null,
        'Source A has no HTML disabled property; original null retained'
      );
      assert((attr(expected, 'class') ?? '').split(/\s+/).includes('ant-picker-now-btn'));
      const disabled = attr(expected, 'aria-disabled');
      assert(disabled === 'true' || disabled === 'false', 'Actual Source availability attribute');
      assert.equal((attr(expected, 'class') ?? '').split(/\s+/).includes('ant-picker-now-btn-disabled'),
        disabled === 'true', 'Source availability class agrees with actual aria-disabled');
      assert.equal(control.tag, 'BUTTON');
      assert.equal(attr(control, 'type'), 'button');
      assert.notEqual(attr(control, 'data-picker-current'), null);
      assert((attr(control, 'class') ?? '').split(/\s+/).includes('ant-picker-today-btn'));
      assert.equal(
        control.disabled,
        disabled === 'true',
        'Actual Native HTML disabled agrees with Source availability'
      );
      assert.equal(control.text, expected.text, 'Actual Today label');
    }
  }
}
function cellFlag(surface: DateWeekPrefixSourceSurface, name: string) {
  return (attr(surface, 'class') ?? '').split(/\s+/).includes('ant-picker-cell-' + name);
}
function panelMode(className: string) {
  const names = ['date', 'week', 'month', 'year', 'decade'];
  const tokens = className.split(/\s+/);
  const modes = names.filter(name => tokens.includes('ant-picker-' + name + '-panel'));
  assert.equal(modes.length, 1, 'One actual calendar mode class token');
  return modes[0];
}
function verifyPoint(
  actual: NativeDateWeekPrefixPoint,
  source: DateWeekPrefixSourcePoint,
  proof: ReturnType<typeof createDateWeekPrefixProof>,
  variant: DateWeekPrefixSourceVariant,
  label: string,
  settled: boolean
) {
  const existing = proof.variants.get(variant);
  const next: IdentityProof = existing ? { dates: new Map(existing.dates),
    nativeDates: new Map(existing.nativeDates), modes: new Map(existing.modes),
    nativeModes: new Map(existing.nativeModes) }
    : { dates: new Map(), nativeDates: new Map(), modes: new Map(), nativeModes: new Map() };
  for (const key of ['id', 'actionIndex', 'alive', 'picker', 'open',
    'localeName', 'localized', 'weekNumbers'] as const) {
    assert.deepEqual(actual.owner[key], source.owner[key], label + ':' + key);
  }
  assert.deepEqual(Object.keys(actual.owner.authoredDates), authoredNames);
  assert.deepEqual(Object.keys(source.owner.authoredDates), authoredNames);
  for (const role of authoredNames) {
    sameDate(actual.owner.authoredDates[role], source.owner.authoredDates[role], actual.owner, next);
  }
  for (const key of ['showWeek', 'locale']) {
    const aKeys = properties(actual.owner.authoredProps).map(row => row.key);
    const sKeys = properties(source.owner.authoredProps).map(row => row.key);
    assert.equal(aKeys.includes(key), sKeys.includes(key), 'Public prop own-key omission ' + key);
    if (sKeys.includes(key)) {
      assert.deepEqual(property(actual.owner.authoredProps, key),
        property(source.owner.authoredProps, key), 'Actual public prop ' + key);
    }
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
  const aModel = object(actual.owner.rawModel).root;
  const sModel = object(source.owner.rawModel).root;
  for (const [index, call] of actual.owner.callbacks.entries()) {
    if (call.name !== 'change') continue;
    const aValue = rawAt(call.rawArguments, [0]);
    const sValue = rawAt(source.owner.callbacks[index].rawArguments, [0]);
    const linked = (model: unknown, value: unknown) => model !== null && value !== null
      && typeof model === 'object' && typeof value === 'object'
      && 'ref' in model && 'ref' in value && model.ref === value.ref;
    assert.equal(linked(aModel, aValue), linked(sModel, sValue),
      'Public model retains the actual onChange payload identity relationship');
  }
  if (settled) {
    verifyDateWeekPrefixFooterBoundary(actual, source);
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
export function verifyDateWeekPrefixPoint(
  actual: NativeDateWeekPrefixPoint,
  source: DateWeekPrefixSourcePoint,
  proof: ReturnType<typeof createDateWeekPrefixProof>,
  variant: DateWeekPrefixSourceVariant,
  label: string
) {
  verifyPoint(actual, source, proof, variant, label, true);
}
export function verifyDateWeekPrefixInputPhase(
  actual: NativeDateWeekPrefixPoint,
  source: DateWeekPrefixSourcePoint,
  proof: ReturnType<typeof createDateWeekPrefixProof>,
  variant: DateWeekPrefixSourceVariant,
  label: string
) {
  verifyPoint(actual, source, proof, variant, label, false);
}
interface DateWeekPrefixProducerWitness {
  dates: Array<{ path: Array<string | number>; identity: number }>;
}
export interface DateWeekPrefixProducerProof {
  cursor: number;
  boundary: number;
  chunks: number;
  witnesses: Map<DateWeekPrefixSourceVariant, Map<string, Map<string, DateWeekPrefixProducerWitness[]>>>;
  publicSourceDates: Map<DateWeekPrefixSourceVariant, Set<number>>;
  pendingPublicAliases: Array<{ index: number; phase: string;
    dates: Array<{ path: Array<string | number>; identity: number }>;
    witnesses: Map<DateWeekPrefixSourceVariant, DateWeekPrefixProducerWitness[]> }>;
  publicAliasInvocations: number;
  matchedInvocations: number;
  lastOwner: DateWeekPrefixSourceOwner | null;
}
function modelSignature(owner: DateWeekPrefixSourceOwner) {
  return JSON.stringify({ localeName: owner.localeName, weekNumbers: owner.weekNumbers,
    localized: owner.localized, encodedModel: owner.model,
    dates: owner.modelDates.map(date => ({ path: date.path,
      encoded: date.value.encoded, temporal: date.value.temporal,
      sameAsAuthored: date.value.sameAsAuthored })),
    aliases: owner.modelDates.map(a => owner.modelDates.map(b => a.value.identity === b.value.identity)) });
}
function producerSignature(call: Record<string, unknown>, model: DateWeekPrefixSourceOwner) {
  const dates = array(call.dates) as DateWeekPrefixSourceDatePath[];
  const info = object(property(call.encodedArguments, '1'));
  const keys = properties(info).map(row => row.key);
  const candidate = dates.find(date => date.path.length === 1 && date.path[0] === 0);
  assert(candidate, 'Actual disabledDate first argument is a Dayjs');
  const from = dates.find(date => date.path.length === 2
    && date.path[0] === 1 && date.path[1] === 'from');
  const fromOwn = keys.includes('from');
  const fromValue = fromOwn ? property(info, 'from') : undefined;
  assert.equal(from !== undefined, fromOwn && object(fromValue).$ !== 'undefined');
  const argumentRoot = rawNode(call.rawArguments, object(object(call.rawArguments).root).ref);
  const rawInfo = rawNode(call.rawArguments, object(rawAt(call.rawArguments, [1])).ref);
  assert.deepEqual(array(rawInfo.ownProperties).map(row => object(row).key), keys,
    'Raw and encoded info own keys are the same original order');
  return JSON.stringify({ name: call.name, arity: call.actualArgumentCount,
    encodedArguments: call.encodedArguments,
    rawArgumentOwnProperties: argumentRoot.ownProperties,
    rawInfoOwnProperties: rawInfo.ownProperties,
    rawDateOwnProperties: dates.map(date => rawNode(date.value.raw, date.value.identity).ownProperties),
    infoKeys: keys, type: property(info, 'type'),
    datePaths: dates.map(date => date.path),
    dateAliases: dates.map(a => dates.map(b => a.value.identity === b.value.identity)),
    modelAliases: dates.map(date => model.modelDates.map(value => date.value.identity === value.value.identity)),
    candidate: {
      temporal: candidate.value.temporal,
      sameAsAuthored: candidate.value.sameAsAuthored
    },
    from: from ? { temporal: from.value.temporal, sameAsAuthored: from.value.sameAsAuthored }
      : { own: fromOwn, encoded: fromValue },
    returned: call.returned });
}
function changedModels(
  before: DateWeekPrefixSourceOwner | null,
  after: DateWeekPrefixSourceOwner
): DateWeekPrefixSourceOwner[] {
  const changes = after.callbacks.slice(before?.callbacks.length ?? 0)
    .filter(call => call.name === 'change');
  return changes.map(call => ({ ...after,
    model: property(call.encodedArguments, '0'),
    // These are views of actual onChange payloads. Original raw graphs and IDs are retained.
    rawModel: { root: rawAt(call.rawArguments, [0]), objects: object(call.rawArguments).objects },
    modelDates: call.dates.filter(date => date.path[0] === 0)
      .map(date => ({ path: date.path.slice(1), value: date.value })) }));
}
function invocationModelWindow(
  index: number,
  previous: DateWeekPrefixSourceOwner | null,
  points: readonly DateWeekPrefixSourceOwner[]
): DateWeekPrefixSourceOwner[] {
  assert(points.length > 0);
  let before = previous;
  for (const after of points) {
    if (index < after.producerCount) {
      return [...(before ? [before] : []), after, ...changedModels(before, after)];
    }
    before = after;
  }
  // An observationEnd call after the last UI read remains bound to its last observed
  // public model. The original tail is retained; no unobserved model is invented.
  return [points.at(-1)!];
}
function sourcePhaseOwners(
  sample: DateWeekPrefixSample,
  phase: string,
  variant: DateWeekPrefixSourceVariant
): DateWeekPrefixSourceOwner[] {
  if (phase === 'initial') {
    return [readDateWeekPrefixSourceInitial(sample.id, variant).owner];
  }
  if (phase.startsWith('step-')) {
    const step = readDateWeekPrefixSourceStep(sample.id, Number(phase.slice(5)), variant);
    return [step.before, step.actionEvidence.afterFocusPointer, step.afterCall, step.actual]
      .filter((point): point is DateWeekPrefixSourcePoint => point !== undefined).map(point => point.owner);
  }
  if (phase.startsWith('closed-')) {
    const index = Number(phase.slice(7));
    const ordinal = sample.actions.slice(0, index + 1)
      .filter(action => action.type === 'input-escape').length - 1;
    const point = readDateWeekPrefixSourceClosed(sample.id, ordinal, variant);
    assert.equal(point.actionIndex, index);
    return [point.after1000.owner];
  }
  const field = phase === 'before-unmount' ? 'beforeUnmount'
    : phase === 'terminal-tail' ? 'late' : phase;
  assert(field === 'beforeUnmount' || field === 'cleanup' || field === 'late');
  return [readDateWeekPrefixSourceCleanup(sample.id, field, variant).owner];
}
export function createDateWeekPrefixProducerProof(sample: DateWeekPrefixSample): DateWeekPrefixProducerProof {
  const witnesses = new Map<DateWeekPrefixSourceVariant, Map<string, Map<string, DateWeekPrefixProducerWitness[]>>>();
  const publicSourceDates = new Map<DateWeekPrefixSourceVariant, Set<number>>();
  for (const variant of ['first', 'repeat'] as const) {
    const finalOwner = readDateWeekPrefixSourceCleanup(sample.id, 'beforeUnmount', variant).owner;
    publicSourceDates.set(variant, new Set([
      ...Object.values(finalOwner.authoredDates).map(date => date.identity),
      ...finalOwner.modelDates.map(date => date.value.identity),
      ...finalOwner.callbacks.flatMap(call => call.dates.map(date => date.value.identity))
    ]));
    const models = new Map<string, Map<string, DateWeekPrefixProducerWitness[]>>();
    const references = readDateWeekPrefixSourceProducerChunks(sample.id, variant);
    let previous: DateWeekPrefixSourceOwner | null = null;
    for (const [index, reference] of references.entries()) {
      const chunk = readDateWeekPrefixSourceProducerChunk(sample.id, index, variant);
      const points = sourcePhaseOwners(sample, reference.phase, variant);
      for (const call of chunk.rows) {
        assert.deepEqual(call.receiver, {
          type: 'undefined', isUndefined: true, isNull: false, identity: null
        });
        for (const model of invocationModelWindow(call.index, previous, points)) {
          const value = producerSignature(call as unknown as Record<string, unknown>, model);
          for (const key of [modelSignature(model),
            ...(reference.phase === 'initial' ? ['initial:' + modelSignature(model)] : [])]) {
            const signatures = models.get(key) ?? new Map<string, DateWeekPrefixProducerWitness[]>();
            const entries = signatures.get(value) ?? [];
            entries.push({ dates: call.dates.map(date => ({
              path: date.path,
              identity: date.value.identity
            })) });
            signatures.set(value, entries);
            models.set(key, signatures);
          }
        }
      }
      previous = points.at(-1)!;
    }
    witnesses.set(variant, models);
  }
  return { cursor: 0, boundary: 0, chunks: 0, witnesses, publicSourceDates,
    pendingPublicAliases: [], publicAliasInvocations: 0, matchedInvocations: 0, lastOwner: null };
}
export function verifyDateWeekPrefixProducerChunk(
  value: unknown,
  proof: DateWeekPrefixProducerProof,
  owner: DateWeekPrefixSourceOwner,
  boundaries: Record<string, number>,
  sample: DateWeekPrefixSample,
  phaseOwners: readonly DateWeekPrefixSourceOwner[] = [owner]
) {
  const chunk = object(value);
  assert.equal(chunk.cursor, proof.cursor);
  assert(Number.isSafeInteger(chunk.next) && Number(chunk.next) >= proof.cursor);
  const rows = array(chunk.rows).map(object);
  assert.equal(rows.length, Number(chunk.next) - proof.cursor);
  assert(phaseOwners.length > 0);
  assert.deepEqual(
    phaseOwners.at(-1),
    owner,
    'Final producer context is the actual complete point owner'
  );
  for (const [index, call] of rows.entries()) {
    assert.equal(call.index, proof.cursor + index);
    assert.equal(call.name, 'disabledDate');
    assert.equal(call.actualArgumentCount, 2);
    assert.equal(typeof call.returned, 'boolean');
    assert(Number.isInteger(call.actionIndex) && Number(call.actionIndex) >= -1
      && Number(call.actionIndex) < sample.actions.length);
    assert.equal(rawAt(call.rawArguments, ['length']), 2);
    assert.equal(property(call.encodedArguments, 'length'), 2);
    const dates = array(call.dates) as DateWeekPrefixSourceDatePath[];
    assert.deepEqual(dates[0]?.path, [0]);
    for (const date of dates) {
      validateDate(date.value, owner);
      assert.equal(object(rawAt(call.rawArguments, date.path)).ref, date.value.identity);
    }
    const info = property(call.encodedArguments, '1');
    assert(['date', 'week'].includes(String(property(info, 'type'))),
      'Actual normal-day date type or separate week-prefix type');
    const candidate = dates[0].value;
    const models = invocationModelWindow(Number(call.index), proof.lastOwner, phaseOwners);
    assert.equal(call.returned, candidate.temporal.fields[0] === sample.blocked.year
      && candidate.temporal.fields[1] === sample.blocked.month
      && candidate.temporal.fields[2] === sample.blocked.day,
    'Actual authored unconditional Jan2 predicate return');
    const receiver = object(call.receiver);
    assert.equal(receiver.type, 'object');
    assert.equal(receiver.isUndefined, false);
    assert.equal(receiver.isNull, false);
    assert(Number.isSafeInteger(receiver.identity) && Number(receiver.identity) > 0);
    const matched = new Map<DateWeekPrefixSourceVariant, DateWeekPrefixProducerWitness[]>();
    for (const variant of ['first', 'repeat'] as const) {
      const candidates = models.flatMap(model => proof.witnesses.get(variant)
        ?.get((chunk.phase === 'initial' ? 'initial:' : '') + modelSignature(model))
        ?.get(producerSignature(call, model)) ?? []);
      assert(candidates.length > 0,
        'Complete actual disabledDate args/raw shape/return/from aliases have a witness in Source '
        + variant + (chunk.phase === 'initial' ? ' initial closed validation' : ' within the same observed public-model window'));
      matched.set(variant, candidates);
    }
    proof.pendingPublicAliases.push({ index: Number(call.index), phase: String(chunk.phase),
      dates: dates.map(date => ({ path: date.path, identity: date.value.identity })), witnesses: matched });
    proof.matchedInvocations++;
  }
  for (const count of Object.values(boundaries)) {
    assert(Number.isSafeInteger(count) && count >= proof.boundary && count <= Number(chunk.next),
      'Actual monotonic producer observation boundary');
    proof.boundary = count;
  }
  proof.cursor = Number(chunk.next);
  proof.lastOwner = owner;
  proof.chunks++;
}

/** Check producer candidate/from references against the complete observed public Date graph.
 * Pure generated candidates never receive a cross-renderer identity bijection.
 */
export function verifyDateWeekPrefixProducerPublicAliases(
  proof: DateWeekPrefixProducerProof,
  publicProof: ReturnType<typeof createDateWeekPrefixProof>
) {
  for (const call of proof.pendingPublicAliases) {
    for (const variant of ['first', 'repeat'] as const) {
      const bindings = publicProof.variants.get(variant);
      assert(bindings, 'Complete public Date proof for Source ' + variant);
      const sourcePublicDates = proof.publicSourceDates.get(variant)!;
      assert(call.witnesses.get(variant)?.some(witness => witness.dates.every((source, index) => {
        const native = call.dates[index];
        assert.deepEqual(native.path, source.path);
        if (sourcePublicDates.has(source.identity)) {
          return bindings.dates.get(source.identity) === native.identity;
        }
        if (bindings.nativeDates.has(native.identity)) {
          return bindings.nativeDates.get(native.identity) === source.identity;
        }
        return true;
      })), 'Actual producer candidate/from retains public callback/model Date references: '
        + variant + ' ' + call.phase + ' invocation ' + call.index);
    }
  }
  proof.publicAliasInvocations = proof.pendingPublicAliases.length;
}
