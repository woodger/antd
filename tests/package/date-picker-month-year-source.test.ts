import fs from 'node:fs';
import { expect, it } from 'vitest';
import { samples } from '../browser/date-picker-month-year-cases.mjs';
import {
  readMonthYearSourceManifest, readMonthYearSourceCase, readMonthYearSourceInitial,
  readMonthYearSourceStep, readMonthYearSourceClosed, readMonthYearSourceCleanup,
  readMonthYearSourceProducerChunks, readMonthYearSourceProducerChunk, readMonthYearSourceSSR,
  readMonthYearSourceEvidence, verifyMonthYearSourceManifest, verifyMonthYearSourcePoint,
  verifyMonthYearSourceProducerChunk, verifyMonthYearSourcePartBinding,
  verifyMonthYearSourceStoredBytes, verifyMonthYearSourceStoredParts
} from '../browser/date-picker-month-year-reference.mjs';
import type {
  MonthYearSourceVariant, MonthYearSourceCaptureKind, MonthYearSourcePoint
} from '../browser/date-picker-month-year-reference.mjs';

it('preserves four independent complete manifests and all816 original whole parts', () => {
  expect(verifyMonthYearSourceStoredParts()).toEqual({
    sourceOnly: true, captures: 4, originalParts: 816, wholeBlobs: 528
  });
  const freeze = JSON.parse(Buffer.from(readMonthYearSourceEvidence('protocol-freeze')).toString());

  expect(freeze.samples).toEqual(samples);
  expect(freeze.source.version).toBe('6.6.8');
  expect(freeze.source.rcPicker).toBe('1.12.2');
  expect(freeze.source.react).toBe('18.3.1');
});

it('reads every UI/producer/SSR original on demand with complete cursor and raw alias links', () => {
  let points = 0, closed = 0, disposal = 0, producerChunks = 0, producers = 0, serializers = 0;
  for (const variant of ['first', 'repeat'] as const) {
    for (const row of readMonthYearSourceManifest('csr', variant).cases) {
      const boundaries = new Map<string, Record<string, number>>();
      const initial = readMonthYearSourceInitial(row.id, variant);
      points++;
      boundaries.set('initial', { initial: initial.owner.producerCount });
      let callbacks = initial.owner.callbacks;
      let closeIndex = 0;
      for (let index = 0; index < row.steps.length; index++) {
        const actual = readMonthYearSourceStep(row.id, index, variant);
        points++;
        for (const point of [actual.before, ...(actual.actionEvidence.afterFocusPointer
          ? [actual.actionEvidence.afterFocusPointer] : []), actual.afterCall, actual.actual]) {
          expect(point.owner.callbacks.slice(0, callbacks.length)).toEqual(callbacks);
          callbacks = point.owner.callbacks;
        }
        boundaries.set('step-' + index, {
          before: actual.before.owner.producerCount,
          ...(actual.actionEvidence.afterFocusPointer ? {
            afterFocusPointer: actual.actionEvidence.afterFocusPointer.owner.producerCount
          } : {}),
          afterCall: actual.afterCall.owner.producerCount,
          settled: actual.actual.owner.producerCount
        });
        if (actual.action.type === 'input-escape') {
          const value = readMonthYearSourceClosed(row.id, closeIndex++, variant);
          closed++;
          expect(value.actionIndex).toBe(index);
          boundaries.set(
            'closed-' + index,
            { ['closed-' + index]: value.after1000.owner.producerCount }
          );
          expect(value.after1000.owner.callbacks.slice(0, callbacks.length)).toEqual(callbacks);
          callbacks = value.after1000.owner.callbacks;
        }
      }
      for (const phase of ['beforeUnmount', 'cleanup', 'late'] as const) {
        const value = readMonthYearSourceCleanup(row.id, phase, variant);
        disposal++;
        const label = phase === 'beforeUnmount' ? 'before-unmount' : phase;
        boundaries.set(label, { [label]: value.owner.producerCount });
        expect(value.owner.callbacks.slice(0, callbacks.length)).toEqual(callbacks);
        callbacks = value.owner.callbacks;
        if (phase !== 'beforeUnmount') {
          expect(value.owner.alive).toBe(false);
          expect(value.refs).toEqual({ owner: null, root: null, control: null });
          expect(value.popups).toEqual([]);
          expect(value.retained.every(node => !node.connected)).toBe(true);
        }
      }
      expect(row.cleanup.rawJSONPart.sha256).toBe(row.late.rawJSONPart.sha256);
      let cursor = 0;
      for (const [index, ref] of readMonthYearSourceProducerChunks(row.id, variant).entries()) {
        const chunk = readMonthYearSourceProducerChunk(row.id, index, variant);
        producerChunks++;
        expect(chunk.cursor).toBe(cursor);
        expect(chunk.next).toBe(ref.next);
        expect(chunk.boundaries).toEqual(ref.phase === 'terminal-tail'
          ? { afterLate: cursor } : boundaries.get(ref.phase));
        for (const call of chunk.rows) {
          for (const date of call.dates) {
            for (const [name, authored] of Object.entries(initial.owner.authoredDates)) {
              expect(date.value.sameAsAuthored[name as keyof typeof initial.owner.authoredDates])
                .toBe(date.value.identity === authored.identity);
            }
          }
        }
        producers += chunk.rows.length;
        cursor = chunk.next;
      }
      expect(cursor).toBe(row.producerFinalCount);
    }
    for (const ref of readMonthYearSourceManifest('ssr', variant).cases) {
      const actual = readMonthYearSourceSSR(ref.id, ref.method, variant);
      serializers++;
      expect(actual.state.owner.open).toBe(false);
      expect(actual.state.owner.callbacks).toEqual([]);
      expect(actual.state.producers.rows).toEqual([]);
      expect(Object.values(actual.resources).every(value => value === 0)).toBe(true);
      expect(Object.values(actual.refs).every(Boolean)).toBe(true);
    }
  }
  expect({ points, closed, disposal, producerChunks, producers, serializers }).toEqual({
    points: 328, closed: 44, disposal: 24, producerChunks: 404, producers: 4448, serializers: 16
  });
}, 120000);

it('keeps measured upper calendar updates, duplicate year picker calls and full hidden dates', () => {
  for (const variant of ['first', 'repeat'] as const) {
    const month = readMonthYearSourceStep('single-month', 2, variant);
    expect(month.actual.owner.callbacks.slice(month.before.owner.callbacks.length).map(row => row.name))
      .toEqual(['calendar', 'panel']);
    const year = readMonthYearSourceStep('single-year', 2, variant);
    const calls = year.actual.owner.callbacks.slice(year.before.owner.callbacks.length);
    expect(calls.map(row => row.name)).toEqual(['calendar', 'picker-value', 'picker-value', 'panel']);
    expect(calls.map(row => row.dates[0].value.identity)).toEqual(Array(4).fill(calls[0].dates[0].value.identity));
    expect(calls[0].dates[0].value.temporal.fields).toEqual([2020, 1, 28, 0, 0, 0, 0]);
    for (const [id, fields] of [
      ['single-month', [2024, 1, 29, 0, 0, 0, 0]],
      ['single-year', [2025, 1, 28, 0, 0, 0, 0]]
    ] as const) {
      const selected = readMonthYearSourceStep(id, 3, variant);
      const actual = selected.actual.owner.callbacks.slice(selected.before.owner.callbacks.length);
      expect(actual.map(row => row.name)).toEqual(['calendar', 'change', 'open', 'picker-value']);
      expect(actual[0].dates[0].value.temporal.fields).toEqual(fields);
    }
  }
});

it('retains both real afterCall producer boundaries without equating them across renders', () => {
  const first = readMonthYearSourceProducerChunks('range-month')
    .findIndex(ref => ref.phase === 'step-32');
  const repeat = readMonthYearSourceProducerChunks('range-month', 'repeat')
    .findIndex(ref => ref.phase === 'step-32');
  const a = readMonthYearSourceProducerChunk('range-month', first);
  const b = readMonthYearSourceProducerChunk('range-month', repeat, 'repeat');

  expect(a.boundaries.afterCall).toBe(268);
  expect(b.boundaries.afterCall).toBe(239);
  expect(a.rows).toEqual(b.rows);
  expect(a.cursor).toBe(b.cursor);
  expect(a.next).toBe(b.next);
  expect(a.boundaries.settled).toBe(b.boundaries.settled);
});

it('rejects corrupted compressed bytes, altered hashes and valid parts swapped across owner/action slots', () => {
  const original = readMonthYearSourceCase('single-month').initial;
  const bytes = fs.readFileSync(new URL('../browser/fixtures/ant-design-date-picker-month-year-parts/'
    + original.rawJSONPart.gzipSHA256 + '.json.gz', import.meta.url));
  const changedBytes = Buffer.from(bytes);
  changedBytes[Math.floor(changedBytes.length / 2)] ^= 1;

  expect(() => verifyMonthYearSourceStoredBytes(original, changedBytes)).toThrow();
  const wrongHash = structuredClone(original);
  wrongHash.rawJSONPart.sha256 = '0'.repeat(64);

  expect(() => verifyMonthYearSourceStoredBytes(wrongHash, bytes)).toThrow();
  expect(() => verifyMonthYearSourcePartBinding(original, 'csr', 'repeat')).toThrow();
  const ownerSwap = readMonthYearSourceManifest('csr');
  ownerSwap.cases[0].steps[0] = ownerSwap.cases[1].steps[0];

  expect(() => verifyMonthYearSourceManifest(ownerSwap)).toThrow();
  const actionSwap = readMonthYearSourceManifest('csr');
  actionSwap.cases[0].steps.reverse();

  expect(() => verifyMonthYearSourceManifest(actionSwap)).toThrow();
  const chunkGap = readMonthYearSourceManifest('csr');
  chunkGap.cases[0].producerParts[2].cursor++;

  expect(() => verifyMonthYearSourceManifest(chunkGap)).toThrow();
  const wrongMethod = readMonthYearSourceManifest('ssr');
  wrongMethod.cases[0].method = 'renderToStaticMarkup';

  expect(() => verifyMonthYearSourceManifest(wrongMethod, 'ssr')).toThrow();
});

it('rejects lost/reordered producer records, impossible boundaries and changed raw callback aliases', () => {
  const refs = readMonthYearSourceProducerChunks('single-month');
  const index = refs.findIndex(ref => ref.next - ref.cursor > 1);
  const original = readMonthYearSourceProducerChunk('single-month', index);
  const missing = structuredClone(original);
  missing.rows.pop();

  expect(() => verifyMonthYearSourceProducerChunk(missing, refs[index])).toThrow();
  const swapped = structuredClone(original);
  swapped.rows.reverse();

  expect(() => verifyMonthYearSourceProducerChunk(swapped, refs[index])).toThrow();
  const boundary = structuredClone(original);
  boundary.boundaries.settled = boundary.next + 1;

  expect(() => verifyMonthYearSourceProducerChunk(boundary, refs[index])).toThrow();
  const point = readMonthYearSourceStep('single-month', 3).actual;
  const alias = structuredClone(point);
  alias.owner.callbacks.find(call => call.name === 'calendar' && call.actionIndex === 3)!
    .dates[0].value.identity++;

  expect(() => verifyMonthYearSourcePoint(alias)).toThrow();
  const hidden = structuredClone(point);
  hidden.owner.callbacks.find(call => call.name === 'calendar' && call.actionIndex === 3)!
    .dates[0].value.temporal.fields[6]++;

  expect(() => verifyMonthYearSourcePoint(hidden)).toThrow();
});

it('rejects unsupported capture kinds, variants, owners and chunk/action/disposal selections', () => {
  expect(() => readMonthYearSourceManifest('other' as MonthYearSourceCaptureKind)).toThrow();
  expect(() => readMonthYearSourceManifest('csr', 'other' as MonthYearSourceVariant)).toThrow();
  expect(() => readMonthYearSourceStep('single-month', -1)).toThrow();
  expect(() => readMonthYearSourceStep('single-month', 32)).toThrow();
  expect(() => readMonthYearSourceProducerChunk('single-month', 999)).toThrow();
  expect(() => readMonthYearSourceCleanup('single-month', 'other' as 'cleanup')).toThrow();
  const wrong = readMonthYearSourceInitial('single-month') as MonthYearSourcePoint;
  wrong.owner.id = 'single-year';

  expect(() => verifyMonthYearSourcePoint(wrong)).toThrow();
});
