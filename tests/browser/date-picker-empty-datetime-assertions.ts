import assert from 'node:assert/strict';
import { actions } from './date-picker-empty-datetime-cases.mjs';
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

export const emptyDatetimeCallbackBoundaries = Object.freeze({
  receiver: 'Source receiver is undefined; actual Native props-function receiver is a non-null object.',
  singleCalendarInfo: 'Source Single calendar info is {}; Native preserves the exact {source} payload.',
  singleEmptyCalendar: 'Source Single cancellation passes undefined/undefined/{}; Native preserves null/empty-string/{source:"date"}.'
});

export function verifyEmptyDatetimeCallbackReceiverBoundary(
  actual: EmptyDatetimeSourceCallback,
  source: EmptyDatetimeSourceCallback
) {
  assert.deepEqual(source.receiver, {
    type: 'undefined', isUndefined: true, isNull: false, identity: null
  });
  assert.equal(actual.receiver.type, 'object');
  assert.equal(actual.receiver.isUndefined, false);
  assert.equal(actual.receiver.isNull, false);
  assert(Number.isSafeInteger(actual.receiver.identity) && actual.receiver.identity! > 0);
}

export function verifyEmptyDatetimeSingleCalendarInfoBoundary(
  actual: EmptyDatetimeSourceCallback,
  source: EmptyDatetimeSourceCallback
) {
  assert.equal(actual.name, 'calendar');
  assert.equal(source.name, 'calendar');
  assert.deepEqual(encodedProperty(source.encodedArguments, '2'), { $: 'object', properties: [] });
  const type = actions[source.actionIndex]?.type;
  assert(type === 'date-click' || type === 'hour-click' || type === 'input-escape');
  assert.deepEqual(encodedProperty(actual.encodedArguments, '2'), {
    $: 'object', properties: [{ key: 'source', value: type === 'hour-click' ? 'time' : 'date' }]
  });
}

export function verifyEmptyDatetimeSingleEmptyCalendarBoundary(
  actual: EmptyDatetimeSourceCallback,
  source: EmptyDatetimeSourceCallback
) {
  assert.equal(actions[source.actionIndex]?.type, 'input-escape');
  assert.equal(source.dates.length, 0);
  assert.equal(actual.dates.length, 0);
  assert.deepEqual(encodedProperty(source.encodedArguments, '0'), { $: 'undefined' });
  assert.deepEqual(encodedProperty(source.encodedArguments, '1'), { $: 'undefined' });
  assert.equal(encodedProperty(actual.encodedArguments, '0'), null);
  assert.equal(encodedProperty(actual.encodedArguments, '1'), '');
  verifyEmptyDatetimeSingleCalendarInfoBoundary(actual, source);
}

function rawArgumentDateIdentity(call: EmptyDatetimeSourceCallback, path: number[]) {
  const graph = object(call.rawArguments);
  let value = object(graph.root);
  for (const part of path) {
    const node = array(graph.objects).map(object).find(node => node.id === value.ref);
    assert(node, 'Actual callback raw argument node');
    const property = array(node.properties).map(object).find(row => row.key === String(part));
    assert(property, 'Actual callback raw date path');
    value = object(property.value);
  }
  return value.ref;
}

export function verifyEmptyDatetimeCallbacks(
  actual: NativeEmptyDatetimePoint,
  source: EmptyDatetimeSourcePoint
) {
  const actualCalls = actual.owner.callbacks;
  const originalCalls = source.owner.callbacks;
  assert.equal(actualCalls.length, originalCalls.length, 'Full public callback ledger length');
  const sourceToNative = new Map<number, number>();
  const nativeToSource = new Map<number, number>();
  const bindDate = (date: EmptyDatetimeSourceDate, original: EmptyDatetimeSourceDate) => {
    if (sourceToNative.has(original.identity)) {
      assert.equal(date.identity, sourceToNative.get(original.identity),
        'Actual shared Dayjs matches Source identity relation');
    }
    if (nativeToSource.has(date.identity)) {
      assert.equal(original.identity, nativeToSource.get(date.identity),
        'Distinct Source Dayjs remain distinct actual Native arguments');
    }
    sourceToNative.set(original.identity, date.identity);
    nativeToSource.set(date.identity, original.identity);
  };
  for (const role of ['panel', 'template'] as const) {
    bindDate(actual.owner.authoredDates[role], source.owner.authoredDates[role]);
  }
  for (const [index, call] of actualCalls.entries()) {
    const original = originalCalls[index];
    assert.equal(call.index, index);
    assert.equal(call.index, original.index);
    assert.equal(call.name, original.name, 'Full public callback order');
    assert.equal(call.actionIndex, original.actionIndex, 'Actual callback action binding');
    verifyEmptyDatetimeCallbackReceiverBoundary(call, original);
    sameDates(call, original);
    for (const [dateIndex, date] of call.dates.entries()) {
      bindDate(date.value, original.dates[dateIndex].value);
      assert.equal(rawArgumentDateIdentity(call, date.path), date.value.identity);
    }
    const keys = array(object(call.encodedArguments).properties).map(row => object(row).key);
    assert.deepEqual(keys,
      array(object(original.encodedArguments).properties).map(row => object(row).key));
    const singleCalendar = actual.owner.owner === 'single' && call.name === 'calendar';
    const emptyCalendar = singleCalendar && original.dates.length === 0;
    if (emptyCalendar) {
      verifyEmptyDatetimeSingleEmptyCalendarBoundary(call, original);
    }
    else if (singleCalendar) verifyEmptyDatetimeSingleCalendarInfoBoundary(call, original);
    for (const key of keys) {
      assert.equal(typeof key, 'string');
      if (singleCalendar && key === '2') continue;
      if (emptyCalendar && (key === '0' || key === '1')) continue;
      assert.deepEqual(encodedProperty(call.encodedArguments, key as string),
        encodedProperty(original.encodedArguments, key as string), 'Whole actual callback argument');
    }
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
  verifyEmptyDatetimeCallbacks(actual, source);
  proof.callbackBoundaries.push({ label, fullStreamCompared: true,
    acceptedBoundaries: emptyDatetimeCallbackBoundaries,
    source: source.owner.callbacks.map(call => ({ name: call.name,
      actionIndex: call.actionIndex, arity: call.actualArgumentCount, receiver: call.receiver })),
    native: actual.owner.callbacks.map(call => ({ name: call.name,
      actionIndex: call.actionIndex, arity: call.actualArgumentCount, receiver: call.receiver })),
    scope: 'Full callback names/order/action binding/arity and encoded argument payloads, '
      + 'including picker info own-key order and all temporal/alias/Dayjs sharing relations. '
      + 'Receiver, Single calendar info and Single empty reset have named boundary assertions. '
      + 'Caret/defaultValue, date-cell classes and framework DOM/ref shapes remain raw. '
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
  for (const [actual, source] of [
    [disposal.cleanup, sourceCleanup], [disposal.late, sourceLate]
  ] as const) {
    assert.equal(actual.owner.alive, source.owner.alive);
    assert.equal(actual.owner.alive, false);
    assert.deepEqual(actual.refs, { owner: null, root: null, control: null });
    assert.equal(actual.inputs.length, 0);
    assert.equal(actual.popups.length, 0);
    assert(actual.retained.every(node => !node.connected));
    assert.deepEqual(actual.owner.lifecycle, source.owner.lifecycle);
    assert.deepEqual(actual.owner.callbacks, disposal.beforeUnmount.owner.callbacks);
    assert.deepEqual(actual.owner.ownerActions, disposal.beforeUnmount.owner.ownerActions);
    verifyEmptyDatetimeCallbacks(actual, source);
  }
}
