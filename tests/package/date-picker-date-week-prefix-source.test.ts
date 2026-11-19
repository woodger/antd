import fs from 'node:fs';
import { expect, it } from 'vitest';
import { samples } from '../browser/date-picker-date-week-prefix-cases.mjs';
import {
  readDateWeekPrefixSourceManifest, readDateWeekPrefixSourceCase, readDateWeekPrefixSourceInitial,
  readDateWeekPrefixSourceStep, readDateWeekPrefixSourceClosed, readDateWeekPrefixSourceCleanup,
  readDateWeekPrefixSourceProducerChunks, readDateWeekPrefixSourceProducerChunk, readDateWeekPrefixSourceSSR,
  readDateWeekPrefixSourceEvidence, verifyDateWeekPrefixSourceManifest, verifyDateWeekPrefixSourcePoint,
  verifyDateWeekPrefixSourceProducerChunk, verifyDateWeekPrefixSourcePartBinding,
  verifyDateWeekPrefixSourceStoredBytes, verifyDateWeekPrefixSourceStoredParts, verifyDateWeekPrefixSourceSSR
} from '../browser/date-picker-date-week-prefix-reference.mjs';
import type { DateWeekPrefixSourceCSRManifest, DateWeekPrefixSourcePoint, DateWeekPrefixSourceSSRLocale,
  DateWeekPrefixSourceVariant } from '../browser/date-picker-date-week-prefix-reference.mjs';

it('retains four original manifests, all132 complete parts and frozen authored inputs', () => {
  const stored = verifyDateWeekPrefixSourceStoredParts();

  expect(stored).toMatchObject({ sourceOnly: true, captures: 4, originalParts: 132 });
  expect(stored.wholeBlobs).toBeGreaterThan(0);
  const frozen = JSON.parse(Buffer.from(readDateWeekPrefixSourceEvidence('protocol-freeze')).toString());

  expect(frozen.samples).toEqual(samples);
  expect(frozen.source.version).toBe('6.6.8');
  expect(frozen.source.rcPicker).toBe('1.12.2');
  expect(frozen.source.react).toBe('18.3.1');
  const release = JSON.parse(Buffer.from(readDateWeekPrefixSourceEvidence('release')).toString());

  expect(release.runs).toHaveLength(4);
  expect(release.runs.every((run: { actualExitCode: number }) => run.actualExitCode === 0)).toBe(true);
});

it('loads every UI/producer/US SSR part with raw aliases, append-only callbacks and complete cursors', () => {
  const totals = {
    points: 0,
    closed: 0,
    disposal: 0,
    chunks: 0,
    producers: 0,
    serializers: 0,
    SSRProducers: 0
  };
  for (const variant of ['first', 'repeat'] as const) {
    for (const row of readDateWeekPrefixSourceManifest('csr', variant).cases) {
      const initial = readDateWeekPrefixSourceInitial(row.id, variant);
      totals.points++;
      const boundaries = new Map<string, Record<string, number>>([['initial', { initial: initial.owner.producerCount }]]);
      let callbacks = initial.owner.callbacks, close = 0;
      for (const [index] of row.steps.entries()) {
        const step = readDateWeekPrefixSourceStep(row.id, index, variant);
        totals.points++;
        for (const point of [step.before, ...(step.actionEvidence.afterFocusPointer
          ? [step.actionEvidence.afterFocusPointer] : []), step.afterCall, step.actual]) {
          expect(point.owner.callbacks.slice(0, callbacks.length)).toEqual(callbacks);
          callbacks = point.owner.callbacks;
        }
        boundaries.set('step-' + index, { before: step.before.owner.producerCount,
          ...(step.actionEvidence.afterFocusPointer ? { afterFocusPointer: step.actionEvidence.afterFocusPointer.owner.producerCount } : {}),
          afterCall: step.afterCall.owner.producerCount, settled: step.actual.owner.producerCount });
        if (step.action.type === 'input-escape') {
          const closed = readDateWeekPrefixSourceClosed(row.id, close++, variant);
          totals.closed++;
          expect(closed.actionIndex).toBe(index);
          boundaries.set(
            'closed-' + index,
            { ['closed-' + index]: closed.after1000.owner.producerCount }
          );
          expect(closed.after1000.owner.callbacks.slice(0, callbacks.length)).toEqual(callbacks);
          callbacks = closed.after1000.owner.callbacks;
        }
      }
      for (const phase of ['beforeUnmount', 'cleanup', 'late'] as const) {
        const point = readDateWeekPrefixSourceCleanup(row.id, phase, variant);
        totals.disposal++;
        const label = phase === 'beforeUnmount' ? 'before-unmount' : phase;
        boundaries.set(label, { [label]: point.owner.producerCount });
        expect(point.owner.callbacks.slice(0, callbacks.length)).toEqual(callbacks);
        callbacks = point.owner.callbacks;
        if (phase !== 'beforeUnmount') {
          expect(point.owner.alive).toBe(false);
          expect(point.refs).toEqual({ owner: null, root: null, control: null });
          expect(point.popups).toEqual([]);
          expect(point.retained.every(node => !node.connected)).toBe(true);
        }
      }
      expect(row.cleanup.rawJSONPart.sha256).toBe(row.late.rawJSONPart.sha256);
      let cursor = 0;
      for (const [index, ref] of readDateWeekPrefixSourceProducerChunks(row.id, variant).entries()) {
        const chunk = readDateWeekPrefixSourceProducerChunk(row.id, index, variant);
        totals.chunks++;
        totals.producers += chunk.rows.length;
        expect(chunk.cursor).toBe(cursor);
        expect(chunk.boundaries).toEqual(ref.phase === 'terminal-tail' ? { afterLate: cursor } : boundaries.get(ref.phase));
        for (const call of chunk.rows) {
          for (const date of call.dates) {
            for (const [name, authored] of Object.entries(initial.owner.authoredDates)) {
              expect(date.value.sameAsAuthored[name as keyof typeof initial.owner.authoredDates])
                .toBe(date.value.identity === authored.identity);
            }
          }
        }
        cursor = chunk.next;
      }
      expect(cursor).toBe(row.producerFinalCount);
    }
    for (const ref of readDateWeekPrefixSourceManifest('ssr', variant).cases) {
      const packet = readDateWeekPrefixSourceSSR(ref.id, ref.locale, ref.method, variant);
      totals.serializers++;
      totals.SSRProducers += packet.state.producers.next;
      expect(packet.initialLocale).toBe('us');
      expect(packet.state.owner.callbacks).toEqual([]);
      expect(packet.state.producers.next).toBe(ref.id.startsWith('range-') ? 2 : 1);
    }
  }
  expect(totals).toEqual({
    points: 44,
    closed: 4,
    disposal: 12,
    chunks: 64,
    producers: 6984,
    serializers: 8,
    SSRProducers: 12
  });
}, 120000);

it('keeps actual date rows, prefix toggles, partial GB labels and authored validation references', () => {
  for (const variant of ['first', 'repeat'] as const) {
    for (const sample of samples) {
      const initial = readDateWeekPrefixSourceInitial(sample.id, variant);
      expect(initial.owner.picker).toBe('date');
      expect(initial.owner.authoredDates.initialStart.temporal.fields).toEqual([2020, 11, 31, 16, 37, 59, 456]);
      expect(initial.owner.authoredDates.initialEnd.temporal.fields).toEqual([2021, 0, 15, 9, 12, 34, 567]);
      const visible = (point: DateWeekPrefixSourcePoint) => point.popups.find(popup => popup.visible)!.tables[0];
      const opened = visible(readDateWeekPrefixSourceStep(sample.id, 0, variant).actual);
      expect(opened.headers[0].cells.map(cell => cell.surface.text)).toEqual(['Week', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
      expect(opened.rows.every(row => row.cells.length === 8 && row.cells[0].weekNumber)).toBe(true);
      const hidden = visible(readDateWeekPrefixSourceStep(sample.id, 2, variant).actual);
      expect(hidden.headers[0].cells).toHaveLength(7);
      expect(hidden.rows.every(row => row.cells.length === 7 && row.cells.every(cell => !cell.weekNumber))).toBe(true);
      const gb = readDateWeekPrefixSourceStep(sample.id, 6, variant).actual;
      expect(gb.inputs.map(input => input.attributes.find(attribute => attribute[0] === 'placeholder')?.[1]))
        .toEqual(sample.kind === 'range' ? ['Authored start date', 'Authored end date'] : ['Authored date']);
      expect(visible(gb).headers[0].cells.map(cell => cell.surface.text)).toEqual(['Week', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
      const closed = readDateWeekPrefixSourceSSR(sample.id, 'us', 'renderToString', variant);
      for (const [index, call] of closed.state.producers.rows.entries()) {
        const name = index === 0 ? 'initialStart' : 'initialEnd';
        expect(call.dates[0].value.identity).toBe(closed.state.owner.authoredDates[name].identity);
        expect(call.dates[0].value.temporal).toEqual(closed.state.owner.authoredDates[name].temporal);
      }
    }
  }
});

it('rejects corrupted gzip, changed hashes, cross-capture and owner/action slot substitutions', () => {
  const original = readDateWeekPrefixSourceCase('single-date-week-prefix').initial;
  const stored = fs.readFileSync(new URL('../browser/fixtures/ant-design-date-picker-date-week-prefix-parts/'
    + original.rawJSONPart.gzipSHA256 + '.json.gz', import.meta.url));
  const corrupt = Buffer.from(stored);
  corrupt[Math.floor(corrupt.length / 2)] ^= 1;

  expect(() => verifyDateWeekPrefixSourceStoredBytes(original, corrupt)).toThrow();
  const hash = structuredClone(original);
  hash.rawJSONPart.sha256 = '0'.repeat(64);

  expect(() => verifyDateWeekPrefixSourceStoredBytes(hash, stored)).toThrow();
  expect(() => verifyDateWeekPrefixSourcePartBinding(original, 'csr', 'repeat')).toThrow();
  for (const mutate of [
    (value: DateWeekPrefixSourceCSRManifest) => {
      value.cases[0].steps[0] = value.cases[1].steps[0];
    },
    (value: DateWeekPrefixSourceCSRManifest) => { value.cases[0].steps.reverse(); },
    (value: DateWeekPrefixSourceCSRManifest) => { value.cases[0].producerParts[2].cursor++; }
  ]) {
    const value = readDateWeekPrefixSourceManifest('csr');
    mutate(value);
    expect(() => verifyDateWeekPrefixSourceManifest(value)).toThrow();
  }
});

it('rejects dropped/reordered producers, impossible boundaries and changed raw date or callback aliases', () => {
  const refs = readDateWeekPrefixSourceProducerChunks('single-date-week-prefix');
  const index = refs.findIndex(ref => ref.next - ref.cursor > 1);
  const original = readDateWeekPrefixSourceProducerChunk('single-date-week-prefix', index);
  for (const mutate of [
    (value: typeof original) => { value.rows.pop(); },
    (value: typeof original) => { value.rows.reverse(); },
    (value: typeof original) => { value.boundaries.settled = value.next + 1; },
    (value: typeof original) => { value.rows[0].actualArgumentCount++; },
    (value: typeof original) => { value.rows[0].dates[0].value.temporal.fields[6]++; }
  ]) {
    const value = structuredClone(original);
    mutate(value);
    expect(() => verifyDateWeekPrefixSourceProducerChunk(value, refs[index])).toThrow();
  }
  const point = readDateWeekPrefixSourceStep('single-date-week-prefix', 3).actual;
  for (const mutate of [
    (value: DateWeekPrefixSourcePoint) => { value.owner.modelDates[0].value.identity++; },
    (value: DateWeekPrefixSourcePoint) => {
      value.owner.callbacks.find(call => call.dates.length)!.dates[0].value.identity++;
    },
    (value: DateWeekPrefixSourcePoint) => { value.owner.callbacks[0].actualArgumentCount++; }
  ]) {
    const value = structuredClone(point);
    mutate(value);
    expect(() => verifyDateWeekPrefixSourcePoint(value)).toThrow();
  }
});

it('rejects changed TR/TD/TH bindings and unsupported or swapped closed SSR profiles', () => {
  const original = readDateWeekPrefixSourceStep('single-date-week-prefix', 0).actual;
  for (const mutate of [
    (value: DateWeekPrefixSourcePoint) => {
      value.popups[0].tables[0].rows[0].selected = !value.popups[0].tables[0].rows[0].selected;
    },
    (value: DateWeekPrefixSourcePoint) => {
      value.popups[0].tables[0].rows[0].cells[0].weekNumber = false;
    },
    (value: DateWeekPrefixSourcePoint) => { value.popups[0].dateCells[0].rowIdentity++; },
    (value: DateWeekPrefixSourcePoint) => {
      value.popups[0].tables[0].headers[0].cells[0].surface.parentIdentity!++;
    }
  ]) {
    const value = structuredClone(original);
    mutate(value);
    expect(() => verifyDateWeekPrefixSourcePoint(value)).toThrow();
  }
  const packet = readDateWeekPrefixSourceSSR('single-date-week-prefix', 'us', 'renderToString');

  expect(() => verifyDateWeekPrefixSourceSSR(
    packet,
    'single-date-week-prefix',
    'gb' as DateWeekPrefixSourceSSRLocale,
    'renderToString'
  )).toThrow();
  packet.method = 'renderToStaticMarkup';

  expect(() => verifyDateWeekPrefixSourceSSR(
    packet,
    'single-date-week-prefix',
    'us',
    'renderToString'
  )).toThrow();
  const profile = readDateWeekPrefixSourceManifest('ssr');
  profile.cases[0].locale = 'gb' as DateWeekPrefixSourceSSRLocale;

  expect(() => verifyDateWeekPrefixSourceManifest(profile, 'ssr')).toThrow();
});

it('rejects unsupported variants and out-of-range action, producer and disposal selections', () => {
  expect(() => readDateWeekPrefixSourceManifest('csr', 'other' as DateWeekPrefixSourceVariant)).toThrow();
  expect(() => readDateWeekPrefixSourceStep('single-date-week-prefix', -1)).toThrow();
  expect(() => readDateWeekPrefixSourceStep('single-date-week-prefix', 10)).toThrow();
  expect(() => readDateWeekPrefixSourceProducerChunk('single-date-week-prefix', 999)).toThrow();
  expect(() => readDateWeekPrefixSourceCleanup('single-date-week-prefix', 'other' as 'cleanup')).toThrow();
  const point = readDateWeekPrefixSourceInitial('single-date-week-prefix');
  point.owner.picker = 'week' as 'date';

  expect(() => verifyDateWeekPrefixSourcePoint(point)).toThrow();
});
