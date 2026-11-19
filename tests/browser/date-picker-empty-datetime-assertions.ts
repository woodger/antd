import assert from 'node:assert/strict';
import type {
  EmptyDatetimeSourceCallback,
  EmptyDatetimeSourceDate,
  EmptyDatetimeSourcePoint
} from './date-picker-empty-datetime-reference.mjs';

export interface NativeEmptyDatetimePoint extends Pick<EmptyDatetimeSourcePoint,
  'owner' | 'inputs' | 'retained' | 'events' | 'environment' | 'resources'> {
  refs: {
    owner: number | null;
    root: number | null;
    control: null | { identity: number; own: unknown };
  };
  root: null | { identity: number; connected: boolean };
  popups: unknown[];
  sameRootAsInitial: boolean;
  sameOwnerAsInitial: boolean;
}

const object = (value: unknown): Record<string, unknown> => {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value));
  return value as Record<string, unknown>;
};
const array = (value: unknown): unknown[] => {
  assert(Array.isArray(value));
  return value;
};
const encodedProperty = (value: unknown, key: string) => {
  const properties = array(object(value).properties).map(object);
  const property = properties.find(row => row.key === key);
  assert(property, 'Whole encoded argument property ' + key);
  return property.value;
};

export function readNativeEmptyDatetimePoint(value: unknown): NativeEmptyDatetimePoint {
  const point = object(value);
  const owner = object(point.owner);
  assert(['single', 'range'].includes(String(owner.owner)));
  assert.equal(typeof owner.alive, 'boolean');
  assert.equal(typeof owner.open, 'boolean');
  assert.equal(typeof owner.hasTemplate, 'boolean');
  assert.equal(typeof owner.actionIndex, 'number');
  array(owner.callbacks);
  object(owner.authoredDates);
  object(point.refs);
  for (const key of ['inputs', 'popups', 'events', 'retained']) array(point[key]);
  return value as NativeEmptyDatetimePoint;
}

export function createEmptyDatetimeProof() {
  return { root: null as number | null, inputs: [] as number[], points: 0,
    callbackBoundaries: [] as unknown[] };
}

function sameDate(actual: EmptyDatetimeSourceDate, source: EmptyDatetimeSourceDate) {
  assert.deepEqual(Object.keys(actual.temporal), Object.keys(source.temporal));
  for (const key of ['valid', 'epoch', 'iso', 'fields', 'locale'] as const) {
    assert.deepEqual(actual.temporal[key], source.temporal[key], 'Exact Dayjs ' + key);
  }
  // Передача из браузера сохраняет -0; сохранённый JSON представляет тот же offset как 0.
  assert.equal(actual.temporal.utcOffset === source.temporal.utcOffset, true);
  assert.deepEqual(actual.sameAsAuthored, source.sameAsAuthored);
  assert.deepEqual(actual.encoded, source.encoded);
  assert.equal(object(object(actual.raw).root).ref, actual.identity);
}

function sameDates(actual: EmptyDatetimeSourceCallback, source: EmptyDatetimeSourceCallback) {
  assert.equal(actual.actualArgumentCount, source.actualArgumentCount);
  assert.equal(actual.dates.length, source.dates.length);
  for (const [index, date] of actual.dates.entries()) {
    assert.deepEqual(date.path, source.dates[index].path);
    sameDate(date.value, source.dates[index].value);
  }
}

function timeColumns(point: { popups: unknown[] }, side: 'native' | 'source') {
  return point.popups.map(object).filter(popup => popup.visible === true).map(popup =>
    array(popup.columns).map(value => {
      const column = object(value);
      return {
        type: column.type,
        scrollTop: object(column.surface).scrollTop,
        rows: array(column.rows).map(value => {
          const row = object(value);
          return { value: side === 'native' ? row.nativeValueAttribute : row.value,
            text: object(row.surface).text, selected: row.selected, disabled: row.disabled };
        })
      };
    })
  );
}

function verifyCalendarAndResetDates(
  actual: NativeEmptyDatetimePoint,
  source: EmptyDatetimeSourcePoint
) {
  const actualCalls = actual.owner.callbacks;
  const arities: Record<string, number> = { open: 1, calendar: 3, 'picker-value': 2 };
  for (const [index, call] of actualCalls.entries()) {
    assert.equal(call.index, index);
    assert.equal(call.actualArgumentCount, arities[call.name], 'Actual public callback arity');
    assert.equal(call.receiver.type, 'object');
    assert.equal(call.receiver.isUndefined, false);
    assert.equal(call.receiver.isNull, false);
    assert.equal(typeof call.receiver.identity, 'number');
    for (const date of call.dates) {
      const authored = actual.owner.authoredDates;
      if (date.value.sameAsAuthored.panel) assert.equal(date.value.identity, authored.panel.identity);
      if (date.value.sameAsAuthored.template) {
        assert.equal(date.value.identity, authored.template.identity);
      }
    }
  }
  for (const actionIndex of [3, 9]) {
    if (actual.owner.actionIndex < actionIndex) continue;
    const calls = actualCalls.filter(call => call.name === 'calendar'
      && call.actionIndex === actionIndex);
    const original = source.owner.callbacks.find(call => call.name === 'calendar'
      && call.actionIndex === actionIndex);
    assert.equal(calls.length, 1, 'One Source-observed calendar selection');
    assert(original);
    sameDates(calls[0], original);
    for (const key of ['0', '1']) {
      assert.deepEqual(encodedProperty(calls[0].encodedArguments, key),
        encodedProperty(original.encodedArguments, key));
    }
  }
  if (actual.owner.actionIndex >= 6) {
    const resets = actualCalls.filter(call => call.name === 'picker-value'
      && call.actionIndex === 6);
    const original = source.owner.callbacks.find(call => call.name === 'picker-value'
      && call.actionIndex === 6);
    assert.equal(resets.length, 1, 'One Source-observed reopen reset');
    assert(original);
    sameDates(resets[0], original);
    assert.deepEqual(encodedProperty(resets[0].encodedArguments, '0'),
      encodedProperty(original.encodedArguments, '0'));
  }
}

export function verifyEmptyDatetimePoint(
  actual: NativeEmptyDatetimePoint,
  source: EmptyDatetimeSourcePoint,
  proof: ReturnType<typeof createEmptyDatetimeProof>,
  label: string
) {
  for (const key of ['owner', 'actionIndex', 'alive', 'open', 'hasTemplate'] as const) {
    assert.deepEqual(actual.owner[key], source.owner[key], label + ': owner ' + key);
  }
  assert.deepEqual(actual.owner.authoredModel, source.owner.authoredModel);
  for (const role of ['panel', 'template'] as const) {
    sameDate(actual.owner.authoredDates[role], source.owner.authoredDates[role]);
  }
  assert.deepEqual(actual.inputs.map(input => input.value), source.inputs.map(input => input.value));
  assert.deepEqual(timeColumns(actual, 'native'), timeColumns(source, 'source'));
  assert(actual.root && actual.root.connected);
  proof.root ??= actual.root.identity;
  if (!proof.inputs.length) proof.inputs = actual.inputs.map(input => input.identity);
  assert.equal(actual.root.identity, proof.root);
  assert.equal(actual.refs.root, proof.root);
  assert.equal(actual.sameOwnerAsInitial, true);
  assert.equal(actual.sameRootAsInitial, true);
  assert.deepEqual(actual.inputs.map(input => input.identity), proof.inputs);
  assert(actual.refs.control);
  verifyCalendarAndResetDates(actual, source);
  proof.callbackBoundaries.push({ label, fullStreamCompared: false,
    source: source.owner.callbacks.map(call => ({ name: call.name,
      actionIndex: call.actionIndex, arity: call.actualArgumentCount, receiver: call.receiver })),
    native: actual.owner.callbacks.map(call => ({ name: call.name,
      actionIndex: call.actionIndex, arity: call.actualArgumentCount, receiver: call.receiver })),
    scope: 'Selection calendar dates/strings and reopen-reset dates/aliases/arity. '
      + 'Callback presence/order, calendar info, caret/defaultValue, date-cell classes and '
      + 'framework DOM/ref shapes are retained raw without parity claims. '
      + 'Time rows compare actual Native nativeValueAttribute with actual Source value.' });
  proof.points++;
}

export function verifyEmptyDatetimeDisposal(
  disposal: { beforeUnmount: NativeEmptyDatetimePoint; cleanup: NativeEmptyDatetimePoint;
    late: NativeEmptyDatetimePoint; trace: string[] },
  sourceCleanup: EmptyDatetimeSourcePoint,
  sourceLate: EmptyDatetimeSourcePoint
) {
  assert.deepEqual(disposal.trace, ['beforeUnmount-read', 'dispose-start', 'dispose-finished',
    'cleanup-read', 'late-1000-read']);
  for (const [actual, source] of [[disposal.cleanup, sourceCleanup], [disposal.late, sourceLate]]) {
    assert.equal(actual.owner.alive, source.owner.alive);
    assert.equal(actual.owner.alive, false);
    assert.deepEqual(actual.refs, { owner: null, root: null, control: null });
    assert.equal(actual.inputs.length, 0);
    assert.equal(actual.popups.length, 0);
    assert(actual.retained.every(node => !node.connected));
    assert.deepEqual(actual.owner.lifecycle, source.owner.lifecycle);
    assert.deepEqual(actual.owner.callbacks, disposal.beforeUnmount.owner.callbacks);
    assert.deepEqual(actual.owner.ownerActions, disposal.beforeUnmount.owner.ownerActions);
  }
}
