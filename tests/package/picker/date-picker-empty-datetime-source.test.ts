import fs from 'node:fs';
import { expect, it } from 'vitest';
import {
  readEmptyDatetimeSourceManifest, readEmptyDatetimeSourceCase, readEmptyDatetimeSourcePart,
  readEmptyDatetimeSourceInitial, readEmptyDatetimeSourceStep, readEmptyDatetimeSourceClosed,
  readEmptyDatetimeSourceCleanup, readEmptyDatetimeSourceEvidence,
  verifyEmptyDatetimeSourceManifest, verifyEmptyDatetimeSourcePoint,
  verifyEmptyDatetimeSourcePartBinding, verifyEmptyDatetimeSourceStoredBytes, verifyEmptyDatetimeSourceStoredParts
} from '../../browser/date-picker-empty-datetime-reference.mjs';
import type {
  EmptyDatetimeSourceVariant, EmptyDatetimeSourceOwner, EmptyDatetimeSourcePoint
} from '../../browser/date-picker-empty-datetime-reference.mjs';

it('preserves both complete independent captures and original whole raw/gzip bytes', () => {
  expect(verifyEmptyDatetimeSourceStoredParts()).toEqual({ sourceOnly: true,
    captures: 2, originalParts: 68, partBlobs: 64, allBlobs: 75 });
  const failed = JSON.parse(Buffer.from(readEmptyDatetimeSourceEvidence('failedV1')).toString('utf8'));

  expect(failed.status).toBe('failed');
  expect(failed.diagnostics).toHaveLength(2);
  expect(failed.diagnostics.every((row: { message: string }) => row.message.includes('secondStep'))).toBe(true);
});

it('reads all48 logical points/eight closes/twelve disposal reads one complete part at a time', () => {
  let points = 0, closes = 0, disposalReads = 0;
  for (const variant of ['first', 'repeat'] as const) {
    for (const row of readEmptyDatetimeSourceManifest(variant).cases) {
      const initial = readEmptyDatetimeSourceInitial(row.id, variant);
      points++;
      for (let index = 0; index < row.steps.length; index++) {
        const step = readEmptyDatetimeSourceStep(row.id, index, variant);
        points++;
        expect(step.action).toEqual(row.sample.actions[index]);
        for (const state of [step.before, step.afterCall, step.actual]) {
          expect(state.owner.authoredDates).toEqual(initial.owner.authoredDates);
          expect(state.owner.rawAuthoredModel).toEqual(initial.owner.rawAuthoredModel);
        }
      }
      for (let index = 0; index < row.closed.length; index++) {
        const closed = readEmptyDatetimeSourceClosed(row.id, index, variant);
        closes++;
        expect(closed.after1000.owner.open).toBe(false);
        expect(closed.after1000.inputs.every(input => input.value === '')).toBe(true);
      }
      for (const phase of ['beforeUnmount', 'cleanup', 'late'] as const) {
        const state = readEmptyDatetimeSourceCleanup(row.id, phase, variant);
        disposalReads++;
        if (phase !== 'beforeUnmount') {
          expect(state.owner.alive).toBe(false);
          expect(state.refs).toEqual({ owner: null, root: null, control: null });
          expect(state.inputs).toEqual([]);
          expect(state.popups).toEqual([]);
          expect(state.retained.every(node => !node.connected)).toBe(true);
        }
      }
      expect(row.cleanup.rawJSONPart.sha256).toBe(row.late.rawJSONPart.sha256);
    }
  }
  expect({ points, closes, disposalReads }).toEqual({ points: 48, closes: 8, disposalReads: 12 });
});

it('keeps original afterCall/settled hover tails and raw authored reset dates separately', () => {
  for (const variant of ['first', 'repeat'] as const) {
    for (const id of ['single', 'range'] as const) {
      const click = readEmptyDatetimeSourceStep(id, 9, variant);
      expect(click.afterCall.inputs[0].value).toBe('12:12:34.567');
      expect(click.actual.inputs[0].value).toBe('15:12:34.567');
      const calendar = click.actual.owner.callbacks.find(row => row.name === 'calendar' && row.actionIndex === 9)!;
      expect(calendar.dates[0].value.temporal.fields).toEqual([2024, 5, 13, 12, 12, 34, 567]);
      const reopened = readEmptyDatetimeSourceStep(id, 6, variant);
      expect(reopened.actual.inputs.every(input => input.value === '')).toBe(true);
      const reset = reopened.actual.owner.callbacks.find(row => row.name === 'picker-value' && row.actionIndex === 6)!;
      expect(reset.actualArgumentCount).toBe(2);
      for (const date of reset.dates) {
        expect(date.value.sameAsAuthored.panel).toBe(true);
        expect(date.value.temporal.fields).toEqual([2024, 5, 13, 18, 30, 20, 500]);
      }
    }
  }
});

it('rejects invalid captures, owners, indices and unmount phases', () => {
  expect(() => readEmptyDatetimeSourceManifest('other' as EmptyDatetimeSourceVariant)).toThrow();
  expect(() => readEmptyDatetimeSourceCase('other' as EmptyDatetimeSourceOwner)).toThrow();
  expect(() => readEmptyDatetimeSourceStep('single', -1)).toThrow();
  expect(() => readEmptyDatetimeSourceStep('single', 11)).toThrow();
  expect(() => readEmptyDatetimeSourceClosed('single', 2)).toThrow();
  expect(() => readEmptyDatetimeSourceCleanup('single', 'other' as 'cleanup')).toThrow();
});

it('rejects changed Source headers/counts, missing actions/closes and swapped owners/slots', () => {
  for (const change of [
    (value: ReturnType<typeof readEmptyDatetimeSourceManifest>) => { value.status = 'failed'; },
    (value: ReturnType<typeof readEmptyDatetimeSourceManifest>) => {
      value.browserVersion = 'wrong';
    },
    (value: ReturnType<typeof readEmptyDatetimeSourceManifest>) => {
      value.sourceProtocol.sha256 = '0'.repeat(64);
    },
    (value: ReturnType<typeof readEmptyDatetimeSourceManifest>) => {
      value.actualCounts.actions--;
    },
    (value: ReturnType<typeof readEmptyDatetimeSourceManifest>) => { value.cases[0].steps.pop(); },
    (value: ReturnType<typeof readEmptyDatetimeSourceManifest>) => { value.cases[0].closed.pop(); },
    (value: ReturnType<typeof readEmptyDatetimeSourceManifest>) => { value.cases.reverse(); },
    (value: ReturnType<typeof readEmptyDatetimeSourceManifest>) => {
      value.cases[0].initial = value.cases[1].initial;
    },
    (value: ReturnType<typeof readEmptyDatetimeSourceManifest>) => {
      value.cases[0].steps.reverse();
    }
  ]) {
    const changed = readEmptyDatetimeSourceManifest();
    change(changed);
    expect(() => verifyEmptyDatetimeSourceManifest(changed)).toThrow();
  }
});

it('rejects cross-capture metadata, changed raw/stored hashes and changed compressed bytes', () => {
  const original = readEmptyDatetimeSourceCase('single').initial;

  expect(() => verifyEmptyDatetimeSourcePartBinding(original, 'repeat')).toThrow();
  for (const key of ['sha256', 'gzipSHA256'] as const) {
    const changed = structuredClone(original);
    changed.rawJSONPart[key] = '0'.repeat(64);
    expect(() => readEmptyDatetimeSourcePart(changed)).toThrow();
  }
  const file = new URL('../../browser/fixtures/ant-design-date-picker-empty-datetime-parts/'
    + original.rawJSONPart.gzipSHA256 + '.json.gz', import.meta.url);
  const changed = fs.readFileSync(file);
  changed[0] ^= 1;

  expect(() => verifyEmptyDatetimeSourceStoredBytes(original, changed)).toThrow();
});

it('rejects changed actual Source arity/order/receiver and broken raw Dayjs identities/fields', () => {
  const point = readEmptyDatetimeSourceStep('single', 6).actual;
  for (const change of [
    (value: EmptyDatetimeSourcePoint) => { value.owner.callbacks.at(-1)!.actualArgumentCount = 1; },
    (value: EmptyDatetimeSourcePoint) => { value.owner.callbacks[0].index = 3; },
    (value: EmptyDatetimeSourcePoint) => { value.owner.callbacks[0].receiver.isUndefined = false; },
    (value: EmptyDatetimeSourcePoint) => {
      value.owner.callbacks.at(-1)!.dates[0].value.identity++;
    },
    (value: EmptyDatetimeSourcePoint) => {
      value.owner.callbacks.at(-1)!.dates[0].value.temporal.fields[3] = 0;
    },
    (value: EmptyDatetimeSourcePoint) => {
      value.owner.callbacks.at(-1)!.dates[0].value.sameAsAuthored.panel = false;
    }
  ]) {
    const changed = structuredClone(point);
    change(changed);
    expect(() => verifyEmptyDatetimeSourcePoint(changed)).toThrow();
  }
});
