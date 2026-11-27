import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { expect, it } from 'vitest';
import proof from '../../browser/fixtures/date-picker-preset-transitions-native-boundaries.json' with { type: 'json' };
import { datePickerPresetTransitionSamples } from '../../browser/date-picker-preset-transitions-cases.mjs';
import {
  readDatePickerPresetTransitionsInitial, readDatePickerPresetTransitionsStep,
  readDatePickerPresetTransitionsCaseMetadata, readDatePickerPresetTransitionsPart,
  readDatePickerPresetTransitionsCleanup
} from '../../browser/date-picker-preset-transitions-reference';
import type { DatePickerPresetTransitionsSourcePoint } from '../../browser/date-picker-preset-transitions-reference';
import type {
  DatePickerPresetTransitionPoint as Point, DatePickerPresetTransitionCleanup as Cleanup
} from '../../browser/date-picker-preset-transitions-native-types';
import {
  createDatePickerPresetTransitionProof, verifyDatePickerPresetTransitionPoint,
  verifyDatePickerPresetTransitionOwner, verifyDatePickerPresetTransitionDate,
  verifyDatePickerPresetTransitionCaret,
  verifyDatePickerPresetTransitionRemoval, verifyDatePickerPresetTransitionDisposalTrace
} from '../../browser/date-picker-preset-transitions-assertions';

const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
function actualPart(name: keyof typeof proof.parts): unknown {
  const pin = proof.parts[name];
  const fixtureUrl = new URL(
    '../../browser/fixtures/' + pin.compressed.file,
    import.meta.url
  );
  const compressed = readFileSync(fixtureUrl);
  assert.equal(compressed.length, pin.compressed.bytes);
  assert.equal(hash(compressed), pin.compressed.sha256);
  const raw = gunzipSync(compressed);
  assert.equal(raw.length, pin.original.bytes);
  assert.equal(hash(raw), pin.original.sha256);
  return JSON.parse(raw.toString('utf8'));
}
const point = (name: 'time-visible' | 'time-known-bad-reopen') =>
  (actualPart(name) as { actual: Point }).actual;
const sample = (id: string) => datePickerPresetTransitionSamples.find(row => row.id === id)!;
const timeSample = () => sample('datetime-disabled-meridiem');
const callbackSample = () => sample('navigation-minimum-clamp');
const callbacks = () => (actualPart('callbacks') as { actual: Point }).actual.owner;
const sourceCallbacks = () => readDatePickerPresetTransitionsStep(callbackSample().id, 1).actual.owner;

it('accepts an actual complete closed Native point against its independent Source point', () => {
  expect(() => verifyDatePickerPresetTransitionPoint(actualPart('closed-initial') as Point,
    readDatePickerPresetTransitionsInitial('date-only-hover-precision'), sample('date-only-hover-precision'),
    createDatePickerPresetTransitionProof(), 'actual closed')).not.toThrow();
});
it('rejects a changed caret, FormData, public control identity or invented resource counter', () => {
  const source = readDatePickerPresetTransitionsInitial('date-only-hover-precision');
  for (const mutate of [
    (value: Point) => { value.input!.selection = [0, 1, 'backward']; },
    (value: Point) => { value.form!.entries[0][1] = 'changed'; },
    (value: Point) => { value.publicRefDetails.sameFocus = false; },
    (value: Point) => { Object.assign(value.browserOwnedResourceCounters, { timers: 0 }); }
  ]) {
    const changed = actualPart('closed-initial') as Point;
    mutate(changed);
    expect(() => verifyDatePickerPresetTransitionPoint(changed, source, sample('date-only-hover-precision'),
      createDatePickerPresetTransitionProof(), 'changed')).toThrow();
  }
});
it('limits the measured initial caret direction boundary to the exact fresh unfocused state', () => {
  const initial = actualPart('closed-initial') as Point;
  const original = readDatePickerPresetTransitionsInitial('date-only-hover-precision');

  expect(() => verifyDatePickerPresetTransitionCaret(initial, original, 'initial construction')).not.toThrow();
  const sourceDirection = structuredClone(original);
  sourceDirection.input!.selection![2] = 'none';

  expect(() => verifyDatePickerPresetTransitionCaret(
    initial,
    sourceDirection,
    'changed Source direction'
  )).toThrow();
  const endpoints = structuredClone(initial);
  endpoints.input!.selection = [0, 0, 'none'];

  expect(() => verifyDatePickerPresetTransitionCaret(endpoints, original, 'changed endpoints')).toThrow();
  const focused = structuredClone(initial), focusedSource = structuredClone(original);
  focused.input!.focused = true;
  focusedSource.input!.focused = true;

  expect(() => verifyDatePickerPresetTransitionCaret(focused, focusedSource, 'focused construction')).toThrow();
  const later = point('time-visible'), laterSource = readDatePickerPresetTransitionsStep(
    timeSample().id,
    8
  ).actual;
  later.input!.selection![2] = 'none';

  expect(() => verifyDatePickerPresetTransitionCaret(later, laterSource, 'noninitial unfocused')).toThrow();
});
it('accepts the actual callback order and rejects unknown callbacks, wrong picker arity and receiver substitution', () => {
  const original = sourceCallbacks();

  expect(() => verifyDatePickerPresetTransitionOwner(callbacks(), original, callbackSample(),
    createDatePickerPresetTransitionProof(), 'actual')).not.toThrow();
  for (const mutate of [
    (value: ReturnType<typeof callbacks>) => { value.callbackInvocations[0].name = 'unknown'; },
    (value: ReturnType<typeof callbacks>) => {
      value.callbackInvocations.find(row => row.name === 'picker-value')!.actualArgumentCount = 1;
    },
    (value: ReturnType<typeof callbacks>) => {
      value.callbackInvocations[0].receiver = {
        isUndefined: true,
        isNull: false,
        type: 'undefined'
      };
    },
    (value: ReturnType<typeof callbacks>) => {
      value.callbackInvocations.find(row => row.nativeFocus)!.nativeFocus!.targetConnected = false;
    }
  ]) {
    const changed = callbacks();
    mutate(changed);
    expect(() => verifyDatePickerPresetTransitionOwner(changed, original, callbackSample(),
      createDatePickerPresetTransitionProof(), 'changed callback')).toThrow();
  }
});
it('rejects a missing picker notification even when the remaining local ledgers agree', () => {
  const changed = callbacks(), index = changed.callbackInvocations.findIndex(row => row.name === 'picker-value');

  expect(index).toBeGreaterThanOrEqual(0);
  changed.callbackInvocations.splice(index, 1);
  changed.events.splice(index, 1);
  changed.rawEvents.splice(index, 1);
  changed.callbackDates.splice(
    changed.callbackDates.findIndex(row => row.name === 'picker-value'),
    1
  );

  expect(() => verifyDatePickerPresetTransitionOwner(changed, sourceCallbacks(), callbackSample(),
    createDatePickerPresetTransitionProof(), 'missing picker')).toThrow();
});
it('keeps panel disabledTime arity1 and rejects changing its count without actual arguments', () => {
  const original = readDatePickerPresetTransitionsStep(timeSample().id, 8).actual.owner;
  const native = point('time-visible').owner;

  expect(() => verifyDatePickerPresetTransitionOwner(native, original, timeSample(),
    createDatePickerPresetTransitionProof(), 'actual producers')).not.toThrow();
  const call = native.calls.find(row => (row as { kind: string }).kind === 'disabledTime') as { actualArgumentCount: number };

  expect(call.actualArgumentCount).toBe(1);
  call.actualArgumentCount = 3;

  expect(() => verifyDatePickerPresetTransitionOwner(native, original, timeSample(),
    createDatePickerPresetTransitionProof(), 'wrong Native arity')).toThrow(/strict Native producer arity/);
});
it('accepts the actual precise returned preset alias and rejects a later identity substitution or changed milliseconds', () => {
  const original = readDatePickerPresetTransitionsStep(timeSample().id, 8).actual.owner.value;
  const value = point('time-visible').owner.value, identities = createDatePickerPresetTransitionProof();

  expect(() => verifyDatePickerPresetTransitionDate(value, original, identities, 'actual alias')).not.toThrow();
  const substituted = structuredClone(value), old = substituted.identity!;
  substituted.identity = old + 100000;
  const graph = substituted.raw as { root: { ref: number }; objects: Array<{ id: number }> };
  graph.root.ref = substituted.identity;
  graph.objects.find(row => row.id === old)!.id = substituted.identity;

  expect(() => verifyDatePickerPresetTransitionDate(
    substituted,
    original,
    identities,
    'substitution'
  )).toThrow();
  const milliseconds = structuredClone(value);
  milliseconds.temporal!.epoch++;
  milliseconds.temporal!.fields[6]++;
  const changedDate = new Date(milliseconds.temporal!.epoch);
  milliseconds.temporal!.iso = changedDate.toISOString();

  expect(() => verifyDatePickerPresetTransitionDate(milliseconds, original,
    createDatePickerPresetTransitionProof(), 'milliseconds')).toThrow();
});
it('allows only numeric UTC zero equivalence and rejects offset or temporal-field changes', () => {
  const original = readDatePickerPresetTransitionsStep(timeSample().id, 8).actual.owner.value;
  const value = point('time-visible').owner.value;
  value.temporal!.utcOffset = -0;

  expect(() => verifyDatePickerPresetTransitionDate(value, original,
    createDatePickerPresetTransitionProof(), 'UTC zero')).not.toThrow();
  value.temporal!.utcOffset = 60;

  expect(() => verifyDatePickerPresetTransitionDate(value, original,
    createDatePickerPresetTransitionProof(), 'offset')).toThrow();
  const extra = point('time-visible').owner.value;
  Object.assign(extra.temporal!, { extra: true });

  expect(() => verifyDatePickerPresetTransitionDate(extra, original,
    createDatePickerPresetTransitionProof(), 'extra temporal field')).toThrow();
});
it('compares actual time scroll, row selection and disabled flags without waiving the recorded reopen regression', () => {
  const original = readDatePickerPresetTransitionsStep(timeSample().id, 8).actual;

  expect(() => verifyDatePickerPresetTransitionPoint(point('time-visible'), original, timeSample(),
    createDatePickerPresetTransitionProof(), 'actual time')).not.toThrow();
  const scrolled = point('time-visible');
  scrolled.timeColumns.at(-1)!.scrollTop = 28;

  expect(() => verifyDatePickerPresetTransitionPoint(scrolled, original, timeSample(),
    createDatePickerPresetTransitionProof(), 'changed scroll')).toThrow(/shown time rows/);
  const row = point('time-visible');
  row.timeColumns.at(-1)!.cells[0].disabled = false;

  expect(() => verifyDatePickerPresetTransitionPoint(row, original, timeSample(),
    createDatePickerPresetTransitionProof(), 'changed disabled row')).toThrow();
  // This whole actual current-v2 part is deliberately a failing counterexample.
  expect(() => verifyDatePickerPresetTransitionPoint(point('time-known-bad-reopen'),
    readDatePickerPresetTransitionsStep(timeSample().id, 10).actual, timeSample(),
    createDatePickerPresetTransitionProof(), 'recorded Native28 Source0')).toThrow(/shown time rows/);
});
function removal() {
  const metadata = readDatePickerPresetTransitionsCaseMetadata(callbackSample().id);
  assert(metadata.beforeUnmount);
  return {
    nativeBefore: actualPart('before-removal') as Point, native: actualPart('cleanup') as Cleanup,
    late: actualPart('late') as Cleanup,
    sourceBefore: readDatePickerPresetTransitionsPart(metadata.beforeUnmount) as DatePickerPresetTransitionsSourcePoint,
    source: readDatePickerPresetTransitionsCleanup(callbackSample().id),
    sourceLate: readDatePickerPresetTransitionsCleanup(callbackSample().id, 'late')
  };
}
it('accepts actual removal and rejects a disconnected blur target, changed callback prefix or connected owned node', () => {
  const actual = removal();
  const verify = (value: ReturnType<typeof removal>) => verifyDatePickerPresetTransitionRemoval(value.nativeBefore,
    value.native, value.late, value.sourceBefore, value.source, value.sourceLate, callbackSample(),
    createDatePickerPresetTransitionProof(), 'actual removal');

  expect(() => verify(actual)).not.toThrow();
  for (const mutate of [
    (value: ReturnType<typeof removal>) => {
      value.native.owner.callbackInvocations.at(-1)!.nativeFocus!.targetConnected = false;
    },
    (value: ReturnType<typeof removal>) => {
      value.native.owner.callbackInvocations[0].actionIndex++;
    },
    (value: ReturnType<typeof removal>) => {
      value.native.retained.find(row => row.owned)!.connected = true;
    }
  ]) {
    const changed = removal();
    mutate(changed);
    expect(() => verify(changed)).toThrow();
  }
});
it('requires all five actual disposal operations in order and the real owner liveness transitions', () => {
  const trace = { operations: [
    { operation: 'beforeUnmount-read' as const, alive: true }, { operation: 'dispose-start' as const },
    { operation: 'dispose-finished' as const }, { operation: 'cleanup-read' as const, alive: false },
    { operation: 'late-1000-read' as const, alive: false }
  ] };

  expect(() => verifyDatePickerPresetTransitionDisposalTrace(trace)).not.toThrow();
  const reordered = structuredClone(trace);
  reordered.operations.reverse();

  expect(() => verifyDatePickerPresetTransitionDisposalTrace(reordered)).toThrow();
  const stale = structuredClone(trace);
  stale.operations[3].alive = true;

  expect(() => verifyDatePickerPresetTransitionDisposalTrace(stale)).toThrow();
});
