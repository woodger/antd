import { expect, it } from 'vitest';
import {
  readDatePickerPresetTransitionsManifest, readDatePickerPresetTransitionsCaseMetadata,
  readDatePickerPresetTransitionsInitial, readDatePickerPresetTransitionsStep,
  readDatePickerPresetTransitionsClosed, readDatePickerPresetTransitionsCleanup,
  readDatePickerPresetTransitionsSSR, readDatePickerPresetTransitionsPart,
  verifyDatePickerPresetTransitionsSourceHeader, verifyDatePickerPresetTransitionsSourceManifest,
  verifyDatePickerPresetTransitionsSourcePartBinding, verifyDatePickerPresetTransitionsSourceOwner,
  verifyDatePickerPresetTransitionsSourcePoint, verifyDatePickerPresetTransitionsSourceCleanup
} from '../browser/date-picker-preset-transitions-reference';
import type {
  DatePickerPresetTransitionsSourceMode, DatePickerPresetTransitionsSourceVariant,
  DatePickerPresetTransitionsSourcePoint
} from '../browser/date-picker-preset-transitions-reference';

it('reads all independent CSR full parts without assembling or caching an owner corpus', () => {
  let logicalPoints = 0, closed = 0, fullParts = 0;
  for (const variant of ['first', 'repeat'] as const) {
    const manifest = readDatePickerPresetTransitionsManifest('csr', variant);
    expect(manifest.cases).toHaveLength(13);
    for (const entry of manifest.cases) {
      expect(readDatePickerPresetTransitionsInitial(entry.id, variant).owner.open).toBe(false);
      logicalPoints++; fullParts++;
      let previousOpen = false, closedIndex = 0;
      for (const [index, action] of entry.sample.actions.entries()) {
        const step = readDatePickerPresetTransitionsStep(entry.id, index, variant);
        expect(step.action).toEqual(action); logicalPoints++; fullParts++;
        if (previousOpen && !step.actual.owner.open) {
          expect(entry.closed![closedIndex].rawJSONPart.file)
            .toMatch(new RegExp('-closed-' + index + '\\.json$'));
          closedIndex++;
        }
        previousOpen = step.actual.owner.open;
      }
      expect(closedIndex).toBe(entry.closed!.length);
      for (let index = 0; index < entry.closed!.length; index++) {
        expect(readDatePickerPresetTransitionsClosed(entry.id, index, variant)
          .after1000.owner.open).toBe(false); closed++; fullParts++;
      }
      verifyDatePickerPresetTransitionsSourcePoint(readDatePickerPresetTransitionsPart(
        entry.beforeUnmount!, 'csr', variant) as DatePickerPresetTransitionsSourcePoint);
      fullParts++;
      for (const phase of ['cleanup', 'late'] as const) {
        expect(readDatePickerPresetTransitionsCleanup(entry.id, phase, variant).owner.alive)
          .toBe(false); fullParts++;
      }
      expect(entry.late!.rawJSONPart.sha256).toBe(entry.cleanup!.rawJSONPart.sha256);
    }
  }
  expect(logicalPoints).toBe(272); expect(closed).toBe(56); expect(fullParts).toBe(406);
}, 240000);

it('retains all 52 real DOM-free closed Source serializations with their original full state', () => {
  let states = 0, serializations = 0;
  for (const variant of ['first', 'repeat'] as const) {
    for (const entry of readDatePickerPresetTransitionsManifest('ssr', variant).cases) {
      const source = readDatePickerPresetTransitionsSSR(entry.id, variant); states++;
      for (const state of Object.values(source.serializations)) {
        expect(state.rawHtml).toContain('id="preset-field"');
        expect(state.rawHtml).toContain('name="retained-date"');
        expect(state.state.value.sameAsAuthoredDates.initialValue).toBe(true);
        serializations++;
      }
    }
  }
  expect(states).toBe(26); expect(serializations).toBe(52);
});

it('rejects unknown captures, owners, action indices and cleanup phases', () => {
  expect(() => readDatePickerPresetTransitionsManifest('unknown' as DatePickerPresetTransitionsSourceMode))
    .toThrow();
  expect(() => readDatePickerPresetTransitionsManifest('csr',
    'unknown' as DatePickerPresetTransitionsSourceVariant)).toThrow();
  expect(() => readDatePickerPresetTransitionsCaseMetadata('unknown')).toThrow();
  expect(() => readDatePickerPresetTransitionsStep('format-rejected-calendar', -1)).toThrow();
  expect(() => readDatePickerPresetTransitionsCleanup('format-rejected-calendar',
    'unknown' as 'cleanup')).toThrow();
});

it('rejects changed Source headers, missing actions, closed transitions and reordered cases', () => {
  const original = readDatePickerPresetTransitionsManifest();
  const header = structuredClone(original.reference); header.version = 'wrong';
  expect(() => verifyDatePickerPresetTransitionsSourceHeader(header, 'csr')).toThrow();
  const counters = structuredClone(original.reference);
  counters.browserOwnedResourceCounters = 'measured';
  expect(() => verifyDatePickerPresetTransitionsSourceHeader(counters, 'csr')).toThrow();
  const missing = structuredClone(original); missing.cases[0].steps!.pop();
  expect(() => verifyDatePickerPresetTransitionsSourceManifest(missing, 'csr', 'first')).toThrow();
  const closed = structuredClone(original); closed.cases[0].closed!.pop();
  expect(() => verifyDatePickerPresetTransitionsSourceManifest(closed, 'csr', 'first')).toThrow();
  const order = structuredClone(original);
  [order.cases[0], order.cases[1]] = [order.cases[1], order.cases[0]];
  expect(() => verifyDatePickerPresetTransitionsSourceManifest(order, 'csr', 'first')).toThrow();
});

it('binds every original part to its exact capture, owner, actual slot and raw/stored byte pins', () => {
  const original = readDatePickerPresetTransitionsManifest();
  const cross = structuredClone(original); cross.cases[0].initial = cross.cases[1].initial;
  expect(() => verifyDatePickerPresetTransitionsSourceManifest(cross, 'csr', 'first')).toThrow();
  const initial = original.cases[0].initial!;
  expect(() => verifyDatePickerPresetTransitionsSourcePartBinding(initial, 'csr', 'repeat')).toThrow();
  for (const key of ['sha256', 'gzipSHA256'] as const) {
    const changed = structuredClone(initial); changed.rawJSONPart[key] = '0'.repeat(64);
    expect(() => readDatePickerPresetTransitionsPart(changed)).toThrow();
  }
  const removed = structuredClone(initial);
  delete (removed.rawJSONPart as Partial<typeof removed.rawJSONPart>).gzipBytes;
  expect(() => readDatePickerPresetTransitionsPart(removed)).toThrow();
  const order = structuredClone(original);
  [order.cases[0].steps![0], order.cases[0].steps![1]] =
    [order.cases[0].steps![1], order.cases[0].steps![0]];
  expect(() => verifyDatePickerPresetTransitionsSourceManifest(order, 'csr', 'first')).toThrow();
});

it('preserves the actual two-argument Source picker-value callback and fresh raw argument arrays', () => {
  const source = readDatePickerPresetTransitionsStep('navigation-controlled-picker-accept', 1)
    .actual.owner;
  expect(source.callbackInvocations.some(row => row.name === 'picker-value'
    && row.actualArgumentCount === 2)).toBe(true);
  const arity = structuredClone(source);
  arity.callbackInvocations.find(row => row.name === 'picker-value')!.actualArgumentCount = 1;
  expect(() => verifyDatePickerPresetTransitionsSourceOwner(arity)).toThrow();
  const receiver = structuredClone(source); receiver.callbackInvocations[0].receiver.isUndefined = false;
  expect(() => verifyDatePickerPresetTransitionsSourceOwner(receiver)).toThrow();
  const dropped = structuredClone(source); dropped.callbackInvocations.pop();
  expect(() => verifyDatePickerPresetTransitionsSourceOwner(dropped)).toThrow();
});

it('rejects replacement of Source calendar info or omission of real picker info fields', () => {
  const source = readDatePickerPresetTransitionsStep('navigation-controlled-picker-accept', 1)
    .actual.owner;
  const calendar = structuredClone(source);
  calendar.callbackDates.find(row => row.name === 'calendar')!.ownInfo = [{ key: 'source' }];
  expect(() => verifyDatePickerPresetTransitionsSourceOwner(calendar)).toThrow();
  const picker = structuredClone(source);
  picker.callbackDates.find(row => row.name === 'picker-value')!.info = { $: 'object', properties: [] };
  expect(() => verifyDatePickerPresetTransitionsSourceOwner(picker)).toThrow();
});

it('rejects cloned authored Dayjs aliases and preserves omitted authored undefined values', () => {
  const source = readDatePickerPresetTransitionsStep('navigation-controlled-picker-accept', 1)
    .actual.owner;
  expect(source.pickerValue.sameAsAuthoredDates.presetValue).toBe(true);
  const changed = structuredClone(source); changed.pickerValue.identity = -1;
  expect(() => verifyDatePickerPresetTransitionsSourceOwner(changed)).toThrow();
  const aliases = structuredClone(source); aliases.pickerValue.sameAsAuthoredDates.presetValue = false;
  expect(() => verifyDatePickerPresetTransitionsSourceOwner(aliases)).toThrow();
  const omitted = structuredClone(source); omitted.minDate.encoded = null;
  expect(() => verifyDatePickerPresetTransitionsSourceOwner(omitted)).toThrow();
});

it('rejects altered actual Source producer arity or ledger order', () => {
  const source = readDatePickerPresetTransitionsStep('datetime-disabled-meridiem', 1).actual.owner;
  expect(source.calls.some(call => call.kind === 'disabledTime' && call.actualArgumentCount === 3))
    .toBe(true);
  const arity = structuredClone(source); arity.calls[0].actualArgumentCount = 1;
  expect(() => verifyDatePickerPresetTransitionsSourceOwner(arity)).toThrow();
  const order = structuredClone(source); order.calls[0].index = -1;
  expect(() => verifyDatePickerPresetTransitionsSourceOwner(order)).toThrow();
});

it('rejects incomplete cleanup while preserving the captured unowned connected BODY and HTML', () => {
  const original = readDatePickerPresetTransitionsCleanup('format-rejected-calendar');
  expect(() => verifyDatePickerPresetTransitionsSourceCleanup(original)).not.toThrow();
  const connected = structuredClone(original);
  connected.retained.find(node => node.owned)!.connected = true;
  expect(() => verifyDatePickerPresetTransitionsSourceCleanup(connected)).toThrow();
  const refs = structuredClone(original); refs.refs.control = false;
  expect(() => verifyDatePickerPresetTransitionsSourceCleanup(refs)).toThrow();
});
