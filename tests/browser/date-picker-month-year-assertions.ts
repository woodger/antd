import assert from 'node:assert/strict';
import type { MonthYearSample, MonthYearAuthoredDateName } from './date-picker-month-year-cases.mjs';
import type {
  MonthYearSourcePoint, MonthYearSourceOwner, MonthYearSourceDate,
  MonthYearSourceDatePath, MonthYearSourceInvocation, MonthYearSourcePopup,
  MonthYearSourceVariant, MonthYearSourceSurface
} from './date-picker-month-year-reference.mjs';

export interface NativeMonthYearPoint extends Omit<MonthYearSourcePoint, 'refs' | 'popups'> {
  refs: { owner: number | null; root: number | null; control: null | {
    identity: number; own: unknown; encoded: unknown; raw: unknown;
    focusIdentity: number; blurIdentity: number;
  } };
  popups: Array<MonthYearSourcePopup & {
    dateCells: Array<MonthYearSourcePopup['dateCells'][number] & {
      button: MonthYearSourceSurface | null;
    }>;
  }>;
}
export const monthYearBoundaries = Object.freeze({
  receiver: 'Source public callback receiver is undefined; Native props-function receiver is an object.',
  singleCalendarInfo: 'Source Single calendar info {}; Native exactly {source:"date"}.',
  singleEmptyCalendar: 'Source Single reset undefined/undefined/{}; Native null/empty-string/{source:"date"}.',
  focusAndRefs: 'Source composite handle changes; Native control/root remain separate and stable. Native full-button panel keyboard/focus contract is retained; no Source handle/getter is synthesized.',
  closedPopup: 'Source retains hidden popup DOM; Native conditionally removes it. Only visible panel state is compared.',
  afterCall: 'Complete immediate reads stay raw. React/Svelte scheduler prefixes are not a settled-state equality claim.',
  producers: 'Every actual invocation/cursor/argument/return is retained; renderer invocation counts are not equated.'
});
const authoredNames: MonthYearAuthoredDateName[] = ['initialStart', 'initialEnd', 'minDate',
  'maxDate', 'presetA', 'presetB', 'witnessStart', 'witnessEnd'];
// Сужает неизвестное значение до записи. null и массивы приводят к ошибке проверки.
const object = (value: unknown): Record<string, unknown> => {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value));
  return value as Record<string, unknown>;
};
// Подтверждает форму массива, оставляя его элементы неизвестными до отдельной проверки.
const array = (value: unknown): unknown[] => {
  assert(Array.isArray(value));
  return value;
};
// Читает собственные свойства сериализованного объекта и проверяет форму каждой строки.
const properties = (value: unknown) => array(object(value).properties).map(object);
// Извлекает значение по имени свойства. Отсутствующая запись считается неполным снимком.
const property = (value: unknown, key: string) => {
  const row = properties(value).find(row => row.key === key);
  assert(row, 'Complete observed property ' + key);
  return row.value;
};
// Ищет исходный объект по идентификатору. Ссылка без объекта прерывает проверку снимка.
const rawNode = (graph: unknown, ref: unknown) => {
  const node = array(object(graph).objects).map(object).find(node => node.id === ref);
  assert(node, 'Actual raw node binding');
  return node;
};
// Проходит путь от корня сериализованного графа, разрешая ссылки на каждом шаге.
function rawAt(graph: unknown, path: Array<string | number>) {
  let value: unknown = object(graph).root;
  for (const key of path) value = property(rawNode(graph, object(value).ref), String(key));
  return value;
}
// Ищет атрибут по имени. Отсутствующий атрибут остаётся null для сравнения снимков.
const attr = (surface: MonthYearSourceSurface, name: string) =>
  surface.attributes.find(row => row[0] === name)?.[1] ?? null;

export function readNativeMonthYearPoint(value: unknown): NativeMonthYearPoint {
  const point = object(value), owner = object(point.owner);
  assert(['month', 'year'].includes(String(owner.picker)));
  assert.equal(typeof owner.id, 'string');
  assert.equal(typeof owner.actionIndex, 'number');
  for (const key of ['alive', 'open', 'limited', 'localized', 'order', 'witness']) {
    assert.equal(typeof owner[key], 'boolean');
  }
  for (const key of ['callbacks', 'modelDates', 'lifecycle', 'ownerActions']) array(owner[key]);
  object(owner.authoredDates);
  object(point.refs);
  for (const key of ['inputs', 'popups', 'retained', 'events']) array(point[key]);
  return value as NativeMonthYearPoint;
}
interface IdentityProof {
  dates: Map<number, number>; nativeDates: Map<number, number>;
  modes: Map<number, number>; nativeModes: Map<number, number>;
}
export function createMonthYearProof() {
  return { root: null as number | null, control: null as number | null,
    focus: null as number | null, blur: null as number | null, inputs: [] as number[],
    variants: new Map<MonthYearSourceVariant, IdentityProof>(), points: 0,
    boundaries: monthYearBoundaries, observations: [] as unknown[] };
}
// Проверяет соответствие identity в обе стороны, исключая слияние разных объектов в одной паре
// снимков.
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
function validateDate(value: MonthYearSourceDate, owner: MonthYearSourceOwner) {
  assert.equal(value.temporal.valid, true);
  assert.equal(new Date(value.temporal.epoch).toISOString(), value.temporal.iso);
  assert.equal(value.temporal.fields.length, 7);
  assert.equal(object(object(value.raw).root).ref, value.identity);
  for (const role of authoredNames) {
    assert.equal(value.sameAsAuthored[role], value.identity === owner.authoredDates[role].identity,
      'Actual authored date alias ' + role);
  }
}
function sameDate(
  actual: MonthYearSourceDate,
  source: MonthYearSourceDate,
  owner: MonthYearSourceOwner,
  proof: IdentityProof
) {
  validateDate(actual, owner);
  assert.deepEqual(Object.keys(actual.temporal), Object.keys(source.temporal));
  for (const key of ['valid', 'epoch', 'iso', 'fields', 'locale'] as const) {
    assert.deepEqual(actual.temporal[key], source.temporal[key], 'Complete Dayjs ' + key);
  }
  // JSON сохраняет 0 вместо переданного напрямую числового -0; остальные поля строги.
  assert.equal(actual.temporal.utcOffset === source.temporal.utcOffset, true);
  assert.deepEqual(actual.sameAsAuthored, source.sameAsAuthored);
  assert.deepEqual(actual.encoded, source.encoded);
  bindIdentity(actual.identity, source.identity, proof.dates, proof.nativeDates, 'Dayjs');
}
function sameDates(
  actual: MonthYearSourceDatePath[],
  source: MonthYearSourceDatePath[],
  raw: unknown,
  owner: MonthYearSourceOwner,
  proof: IdentityProof
) {
  assert.equal(actual.length, source.length);
  for (const [index, date] of actual.entries()) {
    assert.deepEqual(date.path, source[index].path);
    sameDate(date.value, source[index].value, owner, proof);
    assert.equal(object(rawAt(raw, date.path)).ref, date.value.identity);
  }
}
export function verifyMonthYearReceiverBoundary(
  actual: MonthYearSourceInvocation,
  source: MonthYearSourceInvocation
) {
  assert.deepEqual(source.receiver, {
    type: 'undefined', isUndefined: true, isNull: false, identity: null
  });
  assert.equal(actual.receiver.type, 'object');
  assert.equal(actual.receiver.isUndefined, false);
  assert.equal(actual.receiver.isNull, false);
  assert(Number.isSafeInteger(actual.receiver.identity) && actual.receiver.identity! > 0);
}
export function verifyMonthYearSingleCalendarInfoBoundary(
  actual: MonthYearSourceInvocation,
  source: MonthYearSourceInvocation
) {
  assert.deepEqual(property(source.encodedArguments, '2'), { $: 'object', properties: [] });
  assert.deepEqual(property(actual.encodedArguments, '2'), {
    $: 'object', properties: [{ key: 'source', value: 'date' }]
  });
}
export function verifyMonthYearSingleEmptyCalendarBoundary(
  actual: MonthYearSourceInvocation,
  source: MonthYearSourceInvocation
) {
  assert.equal(actual.dates.length, 0);
  assert.equal(source.dates.length, 0);
  for (const key of ['0', '1']) {
    assert.deepEqual(property(source.encodedArguments, key), { $: 'undefined' });
  }
  assert.equal(property(actual.encodedArguments, '0'), null);
  assert.equal(property(actual.encodedArguments, '1'), '');
  verifyMonthYearSingleCalendarInfoBoundary(actual, source);
}
function modeArray(call: MonthYearSourceInvocation) {
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
  actual: NativeMonthYearPoint,
  source: MonthYearSourcePoint,
  proof: IdentityProof
) {
  const originals = source.owner.callbacks;
  assert.equal(actual.owner.callbacks.length, originals.length, 'Complete public callback count');
  for (const [index, call] of actual.owner.callbacks.entries()) {
    const expected = originals[index];
    for (const key of ['index', 'actionIndex', 'name', 'actualArgumentCount'] as const) {
      assert.equal(call[key], expected[key], 'Full callback ' + key);
    }
    verifyMonthYearReceiverBoundary(call, expected);
    sameDates(call.dates, expected.dates, call.rawArguments, actual.owner, proof);
    const keys = properties(call.encodedArguments).map(row => row.key);
    assert.deepEqual(keys, properties(expected.encodedArguments).map(row => row.key));
    const single = actual.owner.id.startsWith('single-') && call.name === 'calendar';
    const empty = single && expected.dates.length === 0
      && object(property(expected.encodedArguments, '0')).$ === 'undefined';
    if (empty) {
      verifyMonthYearSingleEmptyCalendarBoundary(call, expected);
    }
    else if (single) verifyMonthYearSingleCalendarInfoBoundary(call, expected);
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
function visiblePanels(point: Pick<MonthYearSourcePoint, 'popups'>) {
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
function cellFlag(surface: MonthYearSourceSurface, name: string) {
  return (attr(surface, 'class') ?? '').split(/\s+/).includes('ant-picker-cell-' + name);
}
function panelMode(className: string) {
  const names = ['date', 'month', 'year', 'decade'];
  const tokens = className.split(/\s+/);
  const modes = names.filter(name => tokens.includes('ant-picker-' + name + '-panel'));
  assert.equal(modes.length, 1, 'One actual calendar mode class token');
  return modes[0];
}
function verifyPoint(
  actual: NativeMonthYearPoint,
  source: MonthYearSourcePoint,
  proof: ReturnType<typeof createMonthYearProof>,
  variant: MonthYearSourceVariant,
  label: string,
  settled: boolean
) {
  const existing = proof.variants.get(variant);
  const next: IdentityProof = existing ? { dates: new Map(existing.dates),
    nativeDates: new Map(existing.nativeDates), modes: new Map(existing.modes),
    nativeModes: new Map(existing.nativeModes) }
    : { dates: new Map(), nativeDates: new Map(), modes: new Map(), nativeModes: new Map() };
  for (const key of ['id', 'actionIndex', 'alive', 'picker', 'open', 'needConfirm',
    'limited', 'localized', 'order', 'witness'] as const) {
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
export function verifyMonthYearPoint(
  actual: NativeMonthYearPoint,
  source: MonthYearSourcePoint,
  proof: ReturnType<typeof createMonthYearProof>,
  variant: MonthYearSourceVariant,
  label: string
) {
  verifyPoint(actual, source, proof, variant, label, true);
}
export function verifyMonthYearInputPhase(
  actual: NativeMonthYearPoint,
  source: MonthYearSourcePoint,
  proof: ReturnType<typeof createMonthYearProof>,
  variant: MonthYearSourceVariant,
  label: string
) {
  verifyPoint(actual, source, proof, variant, label, false);
}
export interface MonthYearProducerProof { cursor: number; boundary: number; chunks: number; }
export function createMonthYearProducerProof(): MonthYearProducerProof {
  return { cursor: 0, boundary: 0, chunks: 0 };
}
export function verifyMonthYearProducerChunk(
  value: unknown,
  proof: MonthYearProducerProof,
  owner: MonthYearSourceOwner,
  boundaries: Record<string, number>,
  sample: MonthYearSample
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
    assert.equal(typeof call.returned, 'boolean');
    assert(Number.isInteger(call.actionIndex) && Number(call.actionIndex) >= -1
      && Number(call.actionIndex) < sample.actions.length);
    const dates = array(call.dates) as MonthYearSourceDatePath[];
    assert.deepEqual(dates[0]?.path, [0]);
    for (const date of dates) {
      validateDate(date.value, owner);
      assert.equal(object(rawAt(call.rawArguments, date.path)).ref, date.value.identity);
    }
  }
  for (const count of Object.values(boundaries)) {
    assert(Number.isSafeInteger(count) && count >= proof.boundary && count <= Number(chunk.next),
      'Actual monotonic producer observation boundary');
    proof.boundary = count;
  }
  proof.cursor = Number(chunk.next);
  proof.chunks++;
}
