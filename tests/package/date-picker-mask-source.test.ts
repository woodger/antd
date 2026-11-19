import fs from 'node:fs';
import { expect, it } from 'vitest';
import { samples, counts, storage, expandAction } from '../browser/date-picker-mask-cases.mjs';
import {
  readMaskSourceManifest, readMaskSourceCase, readMaskSourceInitial,
  readMaskSourceStep, readMaskSourceSubstep, readMaskSourceClosed, readMaskSourceCleanup,
  readMaskSourceProducerChunks, readMaskSourceProducerChunk, readMaskSourceSSR,
  readMaskSourceEvidence, verifyMaskSourceStoredParts, verifyMaskSourceStoredBytes,
  verifyMaskSourcePartBinding, verifyMaskSourceManifest, verifyMaskSourcePoint,
  verifyMaskSourceStep, verifyMaskSourceSubstep, verifyMaskSourceProducerChunk, verifyMaskSourceSSR
} from '../browser/date-picker-mask-reference.mjs';
import type { MaskSourcePoint, MaskSourceCSRManifest, MaskSourceVariant } from '../browser/date-picker-mask-reference.mjs';
import { readMaskHydrationSourceProfile, verifyMaskHydrationSourceIntegrity }
  from '../browser/date-picker-mask-hydration-reference.mjs';
import { readMaskHydrationPrefixSourceFact, verifyMaskHydrationPrefixSourceIntegrity }
  from '../browser/date-picker-mask-hydration-prefix-reference.mjs';

it('retains all1618 whole original parts, four manifests, public callers and final Source metadata', () => {
  expect(verifyMaskSourceStoredParts()).toMatchObject({ sourceOnly: true, captures: 4, originalParts: 1618 });
  const frozen = JSON.parse(Buffer.from(readMaskSourceEvidence('protocol-freeze')).toString());
  expect(frozen.samples).toEqual(samples); expect(frozen.counts).toEqual(counts); expect(frozen.storage).toEqual(storage);
  expect(frozen.source).toMatchObject({ version: '6.6.8', react: '18.3.1', rcPicker: '1.12.2' });
  const release = JSON.parse(Buffer.from(readMaskSourceEvidence('release')).toString());
  expect(release.runs).toHaveLength(4);
  expect(release.runs.every((run: { actualExitCode: number; terminalPinsUnchanged: boolean }) =>
    run.actualExitCode === 0 && run.terminalPinsUnchanged)).toBe(true);
  const provenance = JSON.parse(Buffer.from(readMaskSourceEvidence('audit-provenance')).toString());
  expect(provenance.documents).toHaveLength(10); expect(provenance.fullOriginalPartsVerified).toBe(1618);
  expect(Buffer.from(readMaskSourceEvidence('source-factory')).toString()).toContain('createMaskSourceApp');
}, 120000);

it('loads every child phase, exact macro immediate reference, contiguous producer and quiet disposal', () => {
  let macros = 0, children = 0, retained = 0, closes = 0, producerChunks = 0, producerRows = 0;
  for (const variant of ['first', 'repeat'] as const) for (const row of readMaskSourceManifest('csr', variant).cases) {
    const initial = readMaskSourceInitial(row.id, variant); retained++;
    let historical = initial.owner.callbacks, closeOrdinal = 0;
    const boundaries = new Map<string, Record<string, number>>([['initial', { initial: initial.owner.producerCount }]]);
    for (const [index] of row.steps.entries()) {
      const macro = readMaskSourceStep(row.id, index, variant); macros++; retained += 3;
      expect(macro.before.owner.callbacks.slice(0, historical.length)).toEqual(historical);
      historical = macro.before.owner.callbacks;
      expect(macro.substeps).toHaveLength(expandAction(row.sample.actions[index]).length);
      for (const [j] of macro.substeps.entries()) {
        const child = readMaskSourceSubstep(row.id, index, j, variant); children++; retained += 3;
        for (const point of [child.before, child.afterCall, child.actual]) {
          expect(point.owner.callbacks.slice(0, historical.length)).toEqual(historical); historical = point.owner.callbacks;
        }
        boundaries.set('step-' + index + '-substep-' + j, { before: child.before.owner.producerCount,
          afterCall: child.afterCall.owner.producerCount, settled: child.actual.owner.producerCount });
      }
      expect(macro.afterCallSource).toEqual({ substep: macro.substeps.at(-1), field: 'afterCall' });
      expect(macro.afterCall).toEqual(readMaskSourceSubstep(row.id, index, macro.substeps.length - 1, variant).afterCall);
      // afterCall is an earlier child snapshot: do not use it as a later callback-prefix observation.
      expect(macro.actual.owner.callbacks.slice(0, historical.length)).toEqual(historical); historical = macro.actual.owner.callbacks;
      boundaries.set('step-' + index, { before: macro.before.owner.producerCount,
        afterCall: macro.afterCall.owner.producerCount, settled: macro.actual.owner.producerCount });
      if (macro.action.type === 'input-escape') {
        const closed = readMaskSourceClosed(row.id, closeOrdinal++, variant); closes++; retained++;
        expect(closed.actionIndex).toBe(index);
        boundaries.set('closed-' + index, { ['closed-' + index]: closed.after1000.owner.producerCount });
      }
    }
    for (const phase of ['beforeUnmount', 'cleanup', 'late'] as const) {
      const point = readMaskSourceCleanup(row.id, phase, variant); retained++;
      const name = phase === 'beforeUnmount' ? 'before-unmount' : phase;
      boundaries.set(name, { [name]: point.owner.producerCount });
      if (phase !== 'beforeUnmount') {
        expect(point.owner.alive).toBe(false); expect(point.refs).toEqual({ owner: null, root: null, control: null });
        expect(point.inputs).toEqual([]); expect(point.popups).toEqual([]); expect(point.retained.some(node => node.connected)).toBe(false);
      }
    }
    expect(row.cleanup.rawJSONPart.sha256).toBe(row.late.rawJSONPart.sha256);
    let cursor = 0;
    for (const [index, ref] of readMaskSourceProducerChunks(row.id, variant).entries()) {
      const chunk = readMaskSourceProducerChunk(row.id, index, variant); producerChunks++; producerRows += chunk.rows.length;
      expect(chunk.cursor).toBe(cursor);
      expect(chunk.boundaries).toEqual(chunk.phase === 'terminal-tail' ? { afterLate: cursor } : boundaries.get(chunk.phase));
      for (const marker of Object.values(chunk.boundaries)) {
        expect(marker).toBeLessThanOrEqual(chunk.next);
        if (chunk.boundaryScope === 'local-substep-or-lifecycle-window') expect(marker).toBeGreaterThanOrEqual(cursor);
      }
      cursor = chunk.next; expect(cursor).toBe(ref.next);
    }
    expect(cursor).toBe(row.producerFinalCount);
  }
  expect({ macros, children, retained, closes, producerChunks, producerRows }).toEqual({
    macros: 150, children: 574, retained: 2222, closes: 10, producerChunks: 784, producerRows: 26802 });
  expect(retained - macros).toBe(counts.distinctRetainedFullReads * 2);
}, 120000);

it('keeps actual hidden time, original Date identities and physical input/caret event facts', () => {
  for (const variant of ['first', 'repeat'] as const) for (const sample of samples) {
    const initial = readMaskSourceInitial(sample.id, variant);
    expect(initial.owner.authoredDates.initialStart.temporal.fields).toEqual([2020, 11, 31, 16, 37, 59, 456]);
    expect(initial.owner.authoredDates.initialEnd.temporal.fields).toEqual([2021, 0, 15, 19, 41, 23, 789]);
    for (const index of [1, 4]) {
      const enter = readMaskSourceStep(sample.id, index, variant);
      expect(enter.actual.owner.modelDates.map(date => date.value.identity))
        .toEqual(initial.owner.modelDates.map(date => date.value.identity));
    }
    const object = readMaskSourceStep(sample.id, 2, variant).actual;
    expect(object.owner.formatProfile).toBe('object'); expect(object.owner.formatValue.type).toBe('object');
    const mask = readMaskSourceStep(sample.id, 8, variant).actual;
    expect(mask.owner.formatProfile).toBe('mask'); expect(mask.owner.formatValue.identity).not.toBe(object.owner.formatValue.identity);
    if (sample.kind === 'single') {
      const pristine = readMaskSourceStep(sample.id, 10, variant);
      expect(pristine.actual.owner.modelDates[0].value).toEqual(initial.owner.modelDates[0].value);
      expect(pristine.actual.owner.callbacks.slice(pristine.before.owner.callbacks.length).some(call => call.name === 'change')).toBe(false);
    }
    const edit = readMaskSourceStep(sample.id, 11, variant);
    expect(edit.actual.inputs.some(input => input.value === (sample.family === 'datetime'
      ? '2024-02-29 11:12:13.345' : sample.family === 'time' ? '20:21:22.345' : '2021-01-20'))).toBe(true);
    for (const [j, command] of expandAction(sample.actions[11]).entries()) {
      const child = readMaskSourceSubstep(sample.id, 11, j, variant);
      if (command.type === 'key-press') {
        const events = child.afterCall.events.slice(child.before.events.length);
        expect(events.some(event => event.type === 'keydown' && event.isTrusted)).toBe(true);
        expect(events.some(event => event.type === 'keyup' && event.isTrusted)).toBe(true);
      }
    }
    const incomplete = readMaskSourceStep(sample.id, 13, variant);
    const commands = expandAction(sample.actions[13]);
    const backspace = readMaskSourceSubstep(sample.id, 13, commands.findIndex(command => command.type === 'key-press' && command.key === 'Backspace'), variant);
    const enter = readMaskSourceSubstep(sample.id, 13, commands.findIndex(command => command.type === 'key-press' && command.key === 'Enter'), variant);
    expect(enter.before.inputs.map(input => input.value)).toEqual(backspace.actual.inputs.map(input => input.value));
    expect(enter.actual.owner.callbacks).toEqual(enter.before.owner.callbacks);
    expect(incomplete.actual.owner.open).toBe(true);
  }
}, 120000);

it('rejects corrupt gzip/hash, cross-capture references and substituted child/owner slots', () => {
  const original = readMaskSourceCase('single-date-mask').initial;
  const stored = fs.readFileSync(new URL('../browser/fixtures/ant-design-date-picker-mask-parts/'
    + original.rawJSONPart.gzipSHA256 + '.json.gz', import.meta.url));
  const corrupt = Buffer.from(stored); corrupt[Math.floor(corrupt.length / 2)] ^= 1;
  expect(() => verifyMaskSourceStoredBytes(original, corrupt)).toThrow();
  const hash = structuredClone(original); hash.rawJSONPart.sha256 = '0'.repeat(64);
  expect(() => verifyMaskSourceStoredBytes(hash, stored)).toThrow();
  expect(() => verifyMaskSourcePartBinding(original, 'csr', 'repeat')).toThrow();
  for (const mutate of [
    (value: MaskSourceCSRManifest) => { value.cases[0].substeps[0] = value.cases[1].substeps[0]; },
    (value: MaskSourceCSRManifest) => { value.cases[0].steps.reverse(); },
    (value: MaskSourceCSRManifest) => { value.cases[0].producerParts[2].cursor++; }
  ]) {
    const value = readMaskSourceManifest(); mutate(value); expect(() => verifyMaskSourceManifest(value)).toThrow();
  }
});

it('rejects dropped producer rows, broken raw Date/callback aliases and changed return graphs', () => {
  const refs = readMaskSourceProducerChunks('single-date-mask'), index = refs.findIndex(ref => ref.next - ref.cursor > 1);
  const original = readMaskSourceProducerChunk('single-date-mask', index);
  for (const mutate of [
    (value: typeof original) => { value.rows.pop(); },
    (value: typeof original) => { value.rows.reverse(); },
    (value: typeof original) => { value.boundaries.settled = value.next + 1; },
    (value: typeof original) => { value.rows[0].actualArgumentCount++; },
    (value: typeof original) => { value.rows[0].returned = true; }
  ]) {
    const value = structuredClone(original); mutate(value); expect(() => verifyMaskSourceProducerChunk(value, refs[index])).toThrow();
  }
  const point = readMaskSourceStep('single-date-mask', 12).actual;
  for (const mutate of [
    (value: MaskSourcePoint) => { value.owner.modelDates[0].value.identity++; },
    (value: MaskSourcePoint) => { value.owner.callbacks.find(call => call.dates.length)!.dates[0].value.identity++; },
    (value: MaskSourcePoint) => { value.owner.callbacks[0].actualArgumentCount++; }
  ]) {
    const value = structuredClone(point); mutate(value); expect(() => verifyMaskSourcePoint(value)).toThrow();
  }
});

it('rejects changed physical row/caret bindings and replaced macro immediate references', () => {
  const point = readMaskSourceStep('single-date-mask', 0).actual;
  for (const mutate of [
    (value: MaskSourcePoint) => { value.popups[0].dateCells[0].rowIdentity++; },
    (value: MaskSourcePoint) => { value.popups[0].tables.find(table => table.surface.tag === 'TABLE')!.rows[0].selected = true; },
    (value: MaskSourcePoint) => { value.inputs[0].selectionEnd = value.inputs[0].value.length + 1; },
    (value: MaskSourcePoint) => { value.inputs[0].focused = !value.inputs[0].focused; }
  ]) {
    const value = structuredClone(point); mutate(value); expect(() => verifyMaskSourcePoint(value)).toThrow();
  }
  const step = readMaskSourceStep('single-date-mask', 11); step.afterCall = step.before;
  expect(() => verifyMaskSourceStep(step, 'single-date-mask', 11)).toThrow();
  const child = readMaskSourceSubstep('single-date-mask', 11, 3); child.command = { type: 'key-press', key: 'F12' };
  expect(() => verifyMaskSourceSubstep(child, 'single-date-mask', 11, 3)).toThrow();
}, 120000);

it('retains independent React hydration caret, defaults, original nodes and quiet disposal', () => {
  expect(verifyMaskHydrationSourceIntegrity()).toEqual({ sourceOnly: true, profiles: 30,
    snapshots: 270, originalWholeParts: 30, wholeGzipBlobs: 30 });
  for (const variant of ['first', 'repeat'] as const) for (const sample of samples)
    for (const format of ['string', 'object', 'mask'] as const) {
      const profile = readMaskHydrationSourceProfile(sample.id, format, variant);
      const parsed = profile.observations[0];
      expect(parsed.phase).toBe('parsed');
      expect(profile.versions).toMatchObject({ react: '18.3.1', antd: '6.6.8', hasHydrateRoot: true });
      for (const point of profile.observations.filter(point =>
        ['parsed', 'preHydrate', 'afterHydrateCall', 'mounted', 'settled'].includes(point.phase))) {
        expect(point.recoverableErrors).toEqual([]);
        expect(point.nodes.sameParsed).toEqual({ target: true, owner: true, root: true,
          inputCount: true, inputs: parsed.inputs.map(() => true) });
        expect(point.inputs).toHaveLength(parsed.inputs.length);
        point.inputs.forEach((input, index) => {
          const initial = parsed.inputs[index];
          expect(input).toMatchObject({ identity: initial.identity, value: initial.value,
            defaultValue: initial.value, valueAttribute: initial.value,
            selectionStart: 0, selectionEnd: 0, selectionDirection: 'forward',
            focused: false, connected: true });
        });
      }
      const cleanup = profile.observations.find(point => point.phase === 'cleanup')!;
      const late = profile.observations.find(point => point.phase === 'late1000')!;
      expect(late.source?.owner.alive).toBe(false);
      expect(late.retainedParsedInputs.every(input => !input.connected)).toBe(true);
      expect(late.source?.owner.callbacks).toEqual(cleanup.source?.owner.callbacks);
      expect(late.source?.producers).toEqual(cleanup.source?.producers);
    }
});

it('binds the focused range hydration prefix to original bytes without editing its end field', () => {
  expect(verifyMaskHydrationPrefixSourceIntegrity()).toMatchObject({ sourceOnly: true,
    profiles: 4, labelsPerProfile: 10, verifiedFacts: 40, originalWholeParts: 4 });
  const labels = ['step-1-substep-0:settled', 'step-1:settled', 'step-2:before',
    'step-2-substep-0:before', 'step-2-substep-0:settled', 'step-2:settled',
    'step-3:before', 'step-3-substep-0:before', 'step-3-substep-0:settled', 'step-3-substep-1:before'];
  for (const owner of ['range-date-mask', 'range-time-mask'] as const)
    for (const variant of ['first', 'repeat'] as const) for (const label of labels) {
      const point = readMaskHydrationPrefixSourceFact(owner, label, variant);
      const end = point.inputs[1];
      expect(point.nodes.sameParsed).toEqual({ target: true, owner: true, root: true,
        inputCount: true, inputs: [true, true] });
      expect(point.recoverableErrors).toEqual([]);
      expect(end).toMatchObject({ focused: true, connected: true,
        selectionStart: 0, selectionEnd: 0, selectionDirection: 'forward',
        defaultValue: end.value, valueAttribute: end.value });
    }
  expect(() => readMaskHydrationPrefixSourceFact('range-date-mask', 'step-3-substep-1:settled')).toThrow();
  const changed = readMaskHydrationPrefixSourceFact('range-date-mask', 'step-1:settled');
  changed.inputs[1].selectionStart = 2;
  expect(readMaskHydrationPrefixSourceFact('range-date-mask', 'step-1:settled').inputs[1].selectionStart).toBe(0);
}, 120000);

it('retains all closed SSR profile models and rejects changed profile/resource/HTML or invalid selections', () => {
  let serializers = 0;
  for (const variant of ['first', 'repeat'] as const) for (const sample of samples)
    for (const profile of ['string', 'object', 'mask'] as const)
      for (const method of ['renderToString', 'renderToStaticMarkup'] as const) {
        const value = readMaskSourceSSR(sample.id, profile, method, variant); serializers++;
        expect(value.state.owner.modelDates.every(date => Object.values(date.value.sameAsAuthored).some(Boolean))).toBe(true);
        expect(value.state.owner.formatProfile).toBe(profile);
        expect(value.state.producers.next).toBe(value.state.producers.rows.length);
        expect(Object.values(value.refs).every(Boolean)).toBe(true);
        expect(Object.values(value.resources).every(count => count === 0)).toBe(true);
      }
  expect(serializers).toBe(60);
  const packet = readMaskSourceSSR('single-date-mask', 'mask', 'renderToString'); packet.resources.timers++;
  expect(() => verifyMaskSourceSSR(packet, 'single-date-mask', 'mask', 'renderToString')).toThrow();
  expect(() => readMaskSourceManifest('csr', 'other' as MaskSourceVariant)).toThrow();
  expect(() => readMaskSourceStep('single-date-mask', -1)).toThrow();
  expect(() => readMaskSourceSubstep('single-date-mask', 11, 999)).toThrow();
  expect(() => readMaskSourceClosed('single-date-mask', 1)).toThrow();
  expect(() => readMaskSourceProducerChunk('single-date-mask', 999)).toThrow();
  expect(() => readMaskSourceCleanup('single-date-mask', 'other' as 'cleanup')).toThrow();
}, 120000);
