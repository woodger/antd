import fs from 'node:fs';
import { expect, it } from 'vitest';
import { samples } from '../browser/date-picker-week-cases.mjs';
import {
  readWeekSourceManifest, readWeekSourceCase, readWeekSourceInitial,
  readWeekSourceStep, readWeekSourceClosed, readWeekSourceCleanup,
  readWeekSourceProducerChunks, readWeekSourceProducerChunk, readWeekSourceSSR,
  readWeekSourceEvidence, verifyWeekSourceManifest, verifyWeekSourcePoint,
  verifyWeekSourceProducerChunk, verifyWeekSourcePartBinding,
  verifyWeekSourceStoredBytes, verifyWeekSourceStoredParts, verifyWeekSourceSSR
} from '../browser/date-picker-week-reference.mjs';
import type {
  WeekSourceVariant, WeekSourceCaptureKind, WeekSourcePoint
} from '../browser/date-picker-week-reference.mjs';

it('preserves four independent complete manifests and all620 original whole parts', () => {
  expect(verifyWeekSourceStoredParts()).toEqual({
    sourceOnly: true, captures: 4, originalParts: 620, wholeBlobs: 435
  });
  const freeze = JSON.parse(Buffer.from(readWeekSourceEvidence('protocol-freeze')).toString());
  expect(freeze.samples).toEqual(samples);
  expect(freeze.source.version).toBe('6.6.8');
  expect(freeze.source.rcPicker).toBe('1.12.2');
  expect(freeze.source.react).toBe('18.3.1');
});

it('reads every UI/producer/SSR original on demand with complete cursor and raw alias links', () => {
  let points = 0, closed = 0, disposal = 0, producerChunks = 0, producers = 0, serializers = 0;
  for (const variant of ['first', 'repeat'] as const) {
    for (const row of readWeekSourceManifest('csr', variant).cases) {
      const boundaries = new Map<string, Record<string, number>>();
      const initial = readWeekSourceInitial(row.id, variant);
      points++;
      boundaries.set('initial', { initial: initial.owner.producerCount });
      let callbacks = initial.owner.callbacks;
      let closeIndex = 0;
      for (let index = 0; index < row.steps.length; index++) {
        const actual = readWeekSourceStep(row.id, index, variant);
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
          const value = readWeekSourceClosed(row.id, closeIndex++, variant);
          closed++;
          expect(value.actionIndex).toBe(index);
          boundaries.set('closed-' + index, { ['closed-' + index]: value.after1000.owner.producerCount });
          expect(value.after1000.owner.callbacks.slice(0, callbacks.length)).toEqual(callbacks);
          callbacks = value.after1000.owner.callbacks;
        }
      }
      for (const phase of ['beforeUnmount', 'cleanup', 'late'] as const) {
        const value = readWeekSourceCleanup(row.id, phase, variant);
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
      for (const [index, ref] of readWeekSourceProducerChunks(row.id, variant).entries()) {
        const chunk = readWeekSourceProducerChunk(row.id, index, variant);
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
    for (const ref of readWeekSourceManifest('ssr', variant).cases) {
      const actual = readWeekSourceSSR(ref.id, ref.locale, ref.method, variant);
      serializers++;
      expect(actual.state.owner.open).toBe(false);
      expect(actual.state.owner.callbacks).toEqual([]);
      expect(actual.state.producers.rows).toEqual([]);
      expect(Object.values(actual.resources).every(value => value === 0)).toBe(true);
      expect(Object.values(actual.refs).every(Boolean)).toBe(true);
    }
  }
  expect({ points, closed, disposal, producerChunks, producers, serializers }).toEqual({
    points: 254, closed: 34, disposal: 12, producerChunks: 304, producers: 6898, serializers: 16
  });
}, 120000);

it('retains actual week rows, locale headers, ordinal weekdays and authored preset aliases', () => {
  const sample = samples.find(value => value.id === 'single-week')!;
  const visible = (point: WeekSourcePoint) => point.popups.find(popup => popup.visible)!.tables[0];
  for (const variant of ['first', 'repeat'] as const) {
    const initial = readWeekSourceStep('single-week', 0, variant).actual;
    const us = visible(initial);
    expect(us.headers[0].cells.map(cell => cell.surface.text))
      .toEqual(['Week', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
    expect(us.rows).toHaveLength(6);
    expect(us.rows.every(row => row.cells.length === 8 && row.cells[0].weekNumber)).toBe(true);
    expect(us.rows.some(row => row.selected)).toBe(true);
    const locale = sample.actions.findIndex(action => action.type === 'owner-control' && action.value === 'locale-gb');
    const gb = visible(readWeekSourceStep('single-week', locale + 1, variant).actual);
    expect(gb.headers[0].cells.map(cell => cell.surface.text))
      .toEqual(['Week', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
    const hidden = sample.actions.findIndex(action => action.type === 'owner-control' && action.value === 'hide-week-numbers');
    const noNumbers = visible(readWeekSourceStep('single-week', hidden + 1, variant).actual);
    expect(noNumbers.headers[0].cells).toHaveLength(7);
    expect(noNumbers.rows.every(row => row.cells.length === 7 && row.cells.every(cell => !cell.weekNumber))).toBe(true);
    const restored = sample.actions.findIndex(action => action.type === 'owner-control' && action.value === 'default-week-numbers');
    expect(visible(readWeekSourceStep('single-week', restored + 1, variant).actual).rows
      .every(row => row.cells.length === 8 && row.cells[0].weekNumber)).toBe(true);
    const enter = sample.actions.flatMap((action, index) => action.type === 'input-key' && action.value === 'Enter' ? [index] : []);
    expect(readWeekSourceStep('single-week', enter[0], variant).actual.owner.modelDates[0].value.temporal.fields)
      .toEqual([2021, 0, 8, 0, 0, 0, 0]);
    expect(readWeekSourceStep('single-week', enter[1], variant).actual.owner.modelDates[0].value.temporal.fields)
      .toEqual([2020, 11, 30, 0, 0, 0, 0]);
    for (const label of ['Hidden A', 'Hidden B']) {
      const index = sample.actions.findIndex(action => action.type === 'preset-click' && action.label === label);
      const owner = readWeekSourceStep('single-week', index, variant).actual.owner;
      const key = label === 'Hidden A' ? 'presetA' : 'presetB';
      expect(owner.modelDates[0].value.identity).toBe(owner.authoredDates[key].identity);
      expect(owner.modelDates[0].value.temporal).toEqual(owner.authoredDates[key].temporal);
    }
    const usSSR = readWeekSourceSSR('single-week', 'us', 'renderToString', variant);
    const gbSSR = readWeekSourceSSR('single-week', 'gb', 'renderToString', variant);
    expect(usSSR.rawHtml).toContain('value="2021-1st"');
    expect(gbSSR.rawHtml).toContain('value="2020-53rd"');
    expect(usSSR.initialLocale).toBe('us'); expect(gbSSR.initialLocale).toBe('gb');
  }
});

it('keeps measured immediate-phase variance and complete equal producer rows', () => {
  for (const [id, phase, firstBoundary, repeatBoundary] of [
    ['single-week', 'step-38', 1395, 1343], ['range-week', 'step-53', 880, 783]
  ] as const) {
    const aIndex = readWeekSourceProducerChunks(id).findIndex(ref => ref.phase === phase);
    const bIndex = readWeekSourceProducerChunks(id, 'repeat').findIndex(ref => ref.phase === phase);
    const a = readWeekSourceProducerChunk(id, aIndex);
    const b = readWeekSourceProducerChunk(id, bIndex, 'repeat');
    expect(a.boundaries.afterCall).toBe(firstBoundary);
    expect(b.boundaries.afterCall).toBe(repeatBoundary);
    expect(a.rows).toEqual(b.rows);
    expect(a.cursor).toBe(b.cursor); expect(a.next).toBe(b.next);
    expect(a.boundaries.settled).toBe(b.boundaries.settled);
  }
  const phases = JSON.parse(Buffer.from(readWeekSourceEvidence('phase-stability')).toString());
  expect(phases.differingPoints).toBe(1);
  const all = JSON.parse(Buffer.from(readWeekSourceEvidence('all-point-stability')).toString());
  expect([all.checkedPoints, all.stablePoints, all.differingPoints]).toEqual([417, 416, 1]);
  const selected = JSON.parse(Buffer.from(readWeekSourceEvidence('selected-variances')).toString());
  expect(selected.varianceCount).toBe(2);
});

it('rejects corrupted compressed bytes, altered hashes and valid parts swapped across owner/action slots', () => {
  const original = readWeekSourceCase('single-week').initial;
  const bytes = fs.readFileSync(new URL('../browser/fixtures/ant-design-date-picker-week-parts/'
    + original.rawJSONPart.gzipSHA256 + '.json.gz', import.meta.url));
  const changedBytes = Buffer.from(bytes);
  changedBytes[Math.floor(changedBytes.length / 2)] ^= 1;
  expect(() => verifyWeekSourceStoredBytes(original, changedBytes)).toThrow();
  const wrongHash = structuredClone(original);
  wrongHash.rawJSONPart.sha256 = '0'.repeat(64);
  expect(() => verifyWeekSourceStoredBytes(wrongHash, bytes)).toThrow();
  expect(() => verifyWeekSourcePartBinding(original, 'csr', 'repeat')).toThrow();
  const ownerSwap = readWeekSourceManifest('csr');
  ownerSwap.cases[0].steps[0] = ownerSwap.cases[1].steps[0];
  expect(() => verifyWeekSourceManifest(ownerSwap)).toThrow();
  const actionSwap = readWeekSourceManifest('csr');
  actionSwap.cases[0].steps.reverse();
  expect(() => verifyWeekSourceManifest(actionSwap)).toThrow();
  const chunkGap = readWeekSourceManifest('csr');
  chunkGap.cases[0].producerParts[2].cursor++;
  expect(() => verifyWeekSourceManifest(chunkGap)).toThrow();
  const wrongMethod = readWeekSourceManifest('ssr');
  wrongMethod.cases[0].method = 'renderToStaticMarkup';
  expect(() => verifyWeekSourceManifest(wrongMethod, 'ssr')).toThrow();
  const header = readWeekSourceManifest();
  header.sourceProtocol.sha256 = '0'.repeat(64);
  expect(() => verifyWeekSourceManifest(header)).toThrow();
  const count = readWeekSourceManifest();
  count.actualCounts.producerInvocations--;
  expect(() => verifyWeekSourceManifest(count)).toThrow();
});

it('rejects lost/reordered producer records, impossible boundaries and changed raw callback aliases', () => {
  const refs = readWeekSourceProducerChunks('single-week');
  const index = refs.findIndex(ref => ref.next - ref.cursor > 1);
  const original = readWeekSourceProducerChunk('single-week', index);
  const missing = structuredClone(original);
  missing.rows.pop();
  expect(() => verifyWeekSourceProducerChunk(missing, refs[index])).toThrow();
  const swapped = structuredClone(original);
  swapped.rows.reverse();
  expect(() => verifyWeekSourceProducerChunk(swapped, refs[index])).toThrow();
  const boundary = structuredClone(original);
  boundary.boundaries.settled = boundary.next + 1;
  expect(() => verifyWeekSourceProducerChunk(boundary, refs[index])).toThrow();
  const arity = structuredClone(original);
  arity.rows[0].actualArgumentCount++;
  expect(() => verifyWeekSourceProducerChunk(arity, refs[index])).toThrow();
  const label = structuredClone(original);
  Object.assign(label.rows[0], { name: 'invented' });
  expect(() => verifyWeekSourceProducerChunk(label, refs[index])).toThrow();
  const returned = structuredClone(original);
  Object.assign(returned.rows[0], { returned: 'false' });
  expect(() => verifyWeekSourceProducerChunk(returned, refs[index])).toThrow();
  const point = readWeekSourceStep('single-week', 4).actual;
  const alias = structuredClone(point);
  alias.owner.callbacks.find(call => call.name === 'calendar' && call.actionIndex === 4)!
    .dates[0].value.identity++;
  expect(() => verifyWeekSourcePoint(alias)).toThrow();
  const hidden = structuredClone(point);
  hidden.owner.callbacks.find(call => call.name === 'calendar' && call.actionIndex === 4)!
    .dates[0].value.temporal.fields[6]++;
  expect(() => verifyWeekSourcePoint(hidden)).toThrow();
  const callbackArity = structuredClone(point);
  callbackArity.owner.callbacks[0].actualArgumentCount++;
  expect(() => verifyWeekSourcePoint(callbackArity)).toThrow();
  const rowPoint = readWeekSourceStep('single-week', 0).actual;
  for (const mutate of [
    (value: WeekSourcePoint) => { value.popups[0].tables[0].rows[0].selected = !value.popups[0].tables[0].rows[0].selected; },
    (value: WeekSourcePoint) => { value.popups[0].tables[0].rows[0].cells[0].weekNumber = false; },
    (value: WeekSourcePoint) => { value.popups[0].dateCells[0].rowIdentity++; },
    (value: WeekSourcePoint) => { value.popups[0].tables[0].headers[0].cells[0].surface.parentIdentity!++; }
  ]) {
    const value = structuredClone(rowPoint); mutate(value);
    expect(() => verifyWeekSourcePoint(value)).toThrow();
  }
  const profile = readWeekSourceManifest('ssr');
  profile.cases[0].locale = 'gb';
  expect(() => verifyWeekSourceManifest(profile, 'ssr')).toThrow();
  const packet = readWeekSourceSSR('single-week', 'us', 'renderToString');
  expect(() => verifyWeekSourceSSR(packet, 'single-week', 'gb', 'renderToString')).toThrow();
  packet.method = 'renderToStaticMarkup';
  expect(() => verifyWeekSourceSSR(packet, 'single-week', 'us', 'renderToString')).toThrow();

});

it('rejects unsupported capture kinds, variants, owners and chunk/action/disposal selections', () => {
  expect(() => readWeekSourceManifest('other' as WeekSourceCaptureKind)).toThrow();
  expect(() => readWeekSourceManifest('csr', 'other' as WeekSourceVariant)).toThrow();
  expect(() => readWeekSourceStep('single-week', -1)).toThrow();
  expect(() => readWeekSourceStep('single-week', 50)).toThrow();
  expect(() => readWeekSourceProducerChunk('single-week', 999)).toThrow();
  expect(() => readWeekSourceCleanup('single-week', 'other' as 'cleanup')).toThrow();
  const wrong = readWeekSourceInitial('single-week') as WeekSourcePoint;
  wrong.owner.id = 'range-week';
  expect(() => verifyWeekSourcePoint(wrong)).toThrow();
});
