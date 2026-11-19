import fs from 'node:fs';
import { expect, it } from 'vitest';
import { samples } from '../browser/date-picker-quarter-cases.mjs';
import {
  readQuarterSourceManifest, readQuarterSourceCase, readQuarterSourceInitial,
  readQuarterSourceStep, readQuarterSourceClosed, readQuarterSourceCleanup,
  readQuarterSourceProducerChunks, readQuarterSourceProducerChunk, readQuarterSourceSSR,
  readQuarterSourceEvidence, verifyQuarterSourceManifest, verifyQuarterSourcePoint,
  verifyQuarterSourceProducerChunk, verifyQuarterSourcePartBinding,
  verifyQuarterSourceStoredBytes, verifyQuarterSourceStoredParts
} from '../browser/date-picker-quarter-reference.mjs';
import type {
  QuarterSourceVariant, QuarterSourceCaptureKind, QuarterSourcePoint
} from '../browser/date-picker-quarter-reference.mjs';

it('preserves four independent complete manifests and all456 original whole parts', () => {
  expect(verifyQuarterSourceStoredParts()).toEqual({
    sourceOnly: true, captures: 4, originalParts: 456, wholeBlobs: 323
  });
  const freeze = JSON.parse(Buffer.from(readQuarterSourceEvidence('protocol-freeze')).toString());
  expect(freeze.samples).toEqual(samples);
  expect(freeze.source.version).toBe('6.6.8');
  expect(freeze.source.rcPicker).toBe('1.12.2');
  expect(freeze.source.react).toBe('18.3.1');
});

it('reads every UI/producer/SSR original on demand with complete cursor and raw alias links', () => {
  let points = 0, closed = 0, disposal = 0, producerChunks = 0, producers = 0, serializers = 0;
  for (const variant of ['first', 'repeat'] as const) {
    for (const row of readQuarterSourceManifest('csr', variant).cases) {
      const boundaries = new Map<string, Record<string, number>>();
      const initial = readQuarterSourceInitial(row.id, variant);
      points++;
      boundaries.set('initial', { initial: initial.owner.producerCount });
      let callbacks = initial.owner.callbacks;
      let closeIndex = 0;
      for (let index = 0; index < row.steps.length; index++) {
        const actual = readQuarterSourceStep(row.id, index, variant);
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
          const value = readQuarterSourceClosed(row.id, closeIndex++, variant);
          closed++;
          expect(value.actionIndex).toBe(index);
          boundaries.set('closed-' + index, { ['closed-' + index]: value.after1000.owner.producerCount });
          expect(value.after1000.owner.callbacks.slice(0, callbacks.length)).toEqual(callbacks);
          callbacks = value.after1000.owner.callbacks;
        }
      }
      for (const phase of ['beforeUnmount', 'cleanup', 'late'] as const) {
        const value = readQuarterSourceCleanup(row.id, phase, variant);
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
      for (const [index, ref] of readQuarterSourceProducerChunks(row.id, variant).entries()) {
        const chunk = readQuarterSourceProducerChunk(row.id, index, variant);
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
    for (const ref of readQuarterSourceManifest('ssr', variant).cases) {
      const actual = readQuarterSourceSSR(ref.id, ref.method, variant);
      serializers++;
      expect(actual.state.owner.open).toBe(false);
      expect(actual.state.owner.callbacks).toEqual([]);
      expect(actual.state.producers.rows).toEqual([]);
      expect(Object.values(actual.resources).every(value => value === 0)).toBe(true);
      expect(Object.values(actual.refs).every(Boolean)).toBe(true);
    }
  }
  expect({ points, closed, disposal, producerChunks, producers, serializers }).toEqual({
    points: 184, closed: 26, disposal: 12, producerChunks: 226, producers: 1146, serializers: 8
  });
}, 120000);

it('retains actual quarter callbacks, clamped hidden dates and authored preset aliases', () => {
  for (const variant of ['first', 'repeat'] as const) {
    const upper = readQuarterSourceStep('single-quarter', 2, variant);
    const upperCalls = upper.actual.owner.callbacks.slice(upper.before.owner.callbacks.length);
    expect(upperCalls.map(call => call.name)).toEqual(['calendar', 'panel']);
    expect(upperCalls.map(call => call.dates[0].value.identity))
      .toEqual(Array(2).fill(upperCalls[0].dates[0].value.identity));
    const terminal = readQuarterSourceStep('single-quarter', 3, variant);
    const calls = terminal.actual.owner.callbacks.slice(terminal.before.owner.callbacks.length);
    expect(calls.map(call => call.name)).toEqual(['calendar', 'change', 'open', 'picker-value']);
    expect(terminal.actual.owner.modelDates[0].value.temporal.fields)
      .toEqual([2024, 3, 30, 0, 0, 0, 0]);
    const a = readQuarterSourceStep('single-quarter', 33, variant).actual.owner.modelDates[0].value;
    const b = readQuarterSourceStep('single-quarter', 35, variant).actual.owner.modelDates[0].value;
    expect(a.temporal.fields).toEqual([2024, 4, 20, 16, 37, 59, 456]);
    expect(a.sameAsAuthored.presetA).toBe(true);
    expect(b.temporal.fields).toEqual([2024, 3, 10, 8, 23, 45, 678]);
    expect(b.sameAsAuthored.presetB).toBe(true);
    const unordered = readQuarterSourceStep('range-quarter', 44, variant).actual.owner;
    const ordered = readQuarterSourceStep('range-quarter', 47, variant).actual.owner;
    expect(unordered.modelDates.map(row => row.value.identity))
      .toEqual([unordered.authoredDates.presetA.identity, unordered.authoredDates.presetB.identity]);
    expect(ordered.modelDates.map(row => row.value.identity))
      .toEqual([ordered.authoredDates.presetB.identity, ordered.authoredDates.presetA.identity]);
    expect(readQuarterSourceStep('range-quarter', 51, variant).actual.owner.modelDates
      .map(row => row.value.temporal.fields))
      .toEqual([[2024, 4, 20, 16, 37, 59, 456], [2024, 3, 10, 0, 0, 0, 0]]);
    for (const sample of samples) {
      const change = sample.actions.findIndex(action =>
        action.type === 'owner-control' && action.value === 'block-last');
      expect(readQuarterSourceStep(sample.id, change, variant).actual.owner.disabledBoundary)
        .toBe('last');
      const labels = new Set(readQuarterSourceProducerChunks(sample.id, variant).flatMap((_, index) =>
        readQuarterSourceProducerChunk(sample.id, index, variant).rows.map(call => call.boundary)));
      expect([...labels]).toEqual(['first', 'last']);
    }
  }
});

it('keeps all measured afterCall variance with identical complete producer rows', () => {
  for (const [id, phase, firstBoundary, repeatBoundary] of [
    ['single-quarter', 'step-29', 209, 217],
    ['range-quarter', 'step-38', 239, 257],
    ['range-quarter', 'step-39', 328, 339]
  ] as const) {
    const aIndex = readQuarterSourceProducerChunks(id).findIndex(ref => ref.phase === phase);
    const bIndex = readQuarterSourceProducerChunks(id, 'repeat').findIndex(ref => ref.phase === phase);
    const a = readQuarterSourceProducerChunk(id, aIndex);
    const b = readQuarterSourceProducerChunk(id, bIndex, 'repeat');
    expect(a.boundaries.afterCall).toBe(firstBoundary);
    expect(b.boundaries.afterCall).toBe(repeatBoundary);
    expect(a.rows).toEqual(b.rows);
    expect(a.cursor).toBe(b.cursor);
    expect(a.next).toBe(b.next);
    expect(a.boundaries.settled).toBe(b.boundaries.settled);
  }
  const phases = JSON.parse(Buffer.from(readQuarterSourceEvidence('phase-stability')).toString());
  expect(phases.differingPoints).toBe(4);
  expect(phases.variance.map((row: { phase: string }) => row.phase))
    .toEqual(Array(4).fill('afterCall'));
  const selected = JSON.parse(Buffer.from(readQuarterSourceEvidence('selected-variances')).toString());
  expect(selected.varianceCount).toBe(0);
});

it('rejects corrupted compressed bytes, altered hashes and valid parts swapped across owner/action slots', () => {
  const original = readQuarterSourceCase('single-quarter').initial;
  const bytes = fs.readFileSync(new URL('../browser/fixtures/ant-design-date-picker-quarter-parts/'
    + original.rawJSONPart.gzipSHA256 + '.json.gz', import.meta.url));
  const changedBytes = Buffer.from(bytes);
  changedBytes[Math.floor(changedBytes.length / 2)] ^= 1;
  expect(() => verifyQuarterSourceStoredBytes(original, changedBytes)).toThrow();
  const wrongHash = structuredClone(original);
  wrongHash.rawJSONPart.sha256 = '0'.repeat(64);
  expect(() => verifyQuarterSourceStoredBytes(wrongHash, bytes)).toThrow();
  expect(() => verifyQuarterSourcePartBinding(original, 'csr', 'repeat')).toThrow();
  const ownerSwap = readQuarterSourceManifest('csr');
  ownerSwap.cases[0].steps[0] = ownerSwap.cases[1].steps[0];
  expect(() => verifyQuarterSourceManifest(ownerSwap)).toThrow();
  const actionSwap = readQuarterSourceManifest('csr');
  actionSwap.cases[0].steps.reverse();
  expect(() => verifyQuarterSourceManifest(actionSwap)).toThrow();
  const chunkGap = readQuarterSourceManifest('csr');
  chunkGap.cases[0].producerParts[2].cursor++;
  expect(() => verifyQuarterSourceManifest(chunkGap)).toThrow();
  const wrongMethod = readQuarterSourceManifest('ssr');
  wrongMethod.cases[0].method = 'renderToStaticMarkup';
  expect(() => verifyQuarterSourceManifest(wrongMethod, 'ssr')).toThrow();
  const header = readQuarterSourceManifest();
  header.sourceProtocol.sha256 = '0'.repeat(64);
  expect(() => verifyQuarterSourceManifest(header)).toThrow();
  const count = readQuarterSourceManifest();
  count.actualCounts.producerInvocations--;
  expect(() => verifyQuarterSourceManifest(count)).toThrow();
});

it('rejects lost/reordered producer records, impossible boundaries and changed raw callback aliases', () => {
  const refs = readQuarterSourceProducerChunks('single-quarter');
  const index = refs.findIndex(ref => ref.next - ref.cursor > 1);
  const original = readQuarterSourceProducerChunk('single-quarter', index);
  const missing = structuredClone(original);
  missing.rows.pop();
  expect(() => verifyQuarterSourceProducerChunk(missing, refs[index])).toThrow();
  const swapped = structuredClone(original);
  swapped.rows.reverse();
  expect(() => verifyQuarterSourceProducerChunk(swapped, refs[index])).toThrow();
  const boundary = structuredClone(original);
  boundary.boundaries.settled = boundary.next + 1;
  expect(() => verifyQuarterSourceProducerChunk(boundary, refs[index])).toThrow();
  const arity = structuredClone(original);
  arity.rows[0].actualArgumentCount++;
  expect(() => verifyQuarterSourceProducerChunk(arity, refs[index])).toThrow();
  const label = structuredClone(original);
  Object.assign(label.rows[0], { boundary: 'invented' });
  expect(() => verifyQuarterSourceProducerChunk(label, refs[index])).toThrow();
  const returned = structuredClone(original);
  Object.assign(returned.rows[0], { returned: 'false' });
  expect(() => verifyQuarterSourceProducerChunk(returned, refs[index])).toThrow();
  const point = readQuarterSourceStep('single-quarter', 3).actual;
  const alias = structuredClone(point);
  alias.owner.callbacks.find(call => call.name === 'calendar' && call.actionIndex === 3)!
    .dates[0].value.identity++;
  expect(() => verifyQuarterSourcePoint(alias)).toThrow();
  const hidden = structuredClone(point);
  hidden.owner.callbacks.find(call => call.name === 'calendar' && call.actionIndex === 3)!
    .dates[0].value.temporal.fields[6]++;
  expect(() => verifyQuarterSourcePoint(hidden)).toThrow();
  const callbackArity = structuredClone(point);
  callbackArity.owner.callbacks[0].actualArgumentCount++;
  expect(() => verifyQuarterSourcePoint(callbackArity)).toThrow();
});

it('rejects unsupported capture kinds, variants, owners and chunk/action/disposal selections', () => {
  expect(() => readQuarterSourceManifest('other' as QuarterSourceCaptureKind)).toThrow();
  expect(() => readQuarterSourceManifest('csr', 'other' as QuarterSourceVariant)).toThrow();
  expect(() => readQuarterSourceStep('single-quarter', -1)).toThrow();
  expect(() => readQuarterSourceStep('single-quarter', 37)).toThrow();
  expect(() => readQuarterSourceProducerChunk('single-quarter', 999)).toThrow();
  expect(() => readQuarterSourceCleanup('single-quarter', 'other' as 'cleanup')).toThrow();
  const wrong = readQuarterSourceInitial('single-quarter') as QuarterSourcePoint;
  wrong.owner.id = 'range-quarter';
  expect(() => verifyQuarterSourcePoint(wrong)).toThrow();
});
