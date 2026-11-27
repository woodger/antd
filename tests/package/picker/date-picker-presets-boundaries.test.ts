import { expect, it } from 'vitest';
import proof from '../../browser/fixtures/date-picker-presets-native-boundaries.json' with { type: 'json' };
import { datePickerPresetSamples } from '../../browser/date-picker-presets-cases.mjs';
import type { DatePickerPresetValue, DatePickerPresetOwner } from '../../browser/date-picker-presets-metrics.mjs';
import {
  readDatePickerPresetsCaseMetadata,
  readDatePickerPresetsCleanup,
  readDatePickerPresetsPart,
  readDatePickerPresetsStep
} from '../../browser/date-picker-presets-reference';
import type { DatePickerPresetsSourcePoint } from '../../browser/date-picker-presets-reference';
import {
  createDatePickerPresetsIdentityProof,
  verifyDatePickerPresetsPhysical,
  verifyDatePickerPresetsReturnedDate,
  verifyDatePickerPresetsRemovalBlur,
  verifyDatePickerPresetsValidationOrder
} from '../../browser/date-picker-presets-assertions';
import type {
  DatePickerPresetsPhysical, DatePickerPresetsRemovalBefore
} from '../../browser/date-picker-presets-assertions';

const physical = proof.physical as unknown as DatePickerPresetsPhysical;
const sourcePhysical = () => readDatePickerPresetsStep('custom-label-prefix', 0).actual;
const nativeReturn = proof.lazyResult as unknown as DatePickerPresetValue;
function sourceReturn() {
  const point = readDatePickerPresetsStep('lazy-hover-click', 1).actual;
  return (point.owner.lazyCalls[0] as { result: DatePickerPresetValue }).result;
}
const sample = datePickerPresetSamples.find(sample => sample.id === 'lazy-hover-click')!;
const nativeBefore = proof.removalBefore as unknown as DatePickerPresetsRemovalBefore;
const nativeAfter = proof.removalAfter as unknown as Pick<DatePickerPresetOwner, 'alive' | 'callbackInvocations'>;
function sourceRemoval() {
  const part = readDatePickerPresetsCaseMetadata(sample.id).beforeUnmount!;
  return {
    before: readDatePickerPresetsPart(part) as DatePickerPresetsSourcePoint,
    after: readDatePickerPresetsCleanup(sample.id).owner
  };
}
it('accepts actual Native row/label CSS and boxes against the full independent Source part', () => {
  expect(() => verifyDatePickerPresetsPhysical(physical, sourcePhysical(), 'recorded', 'vite-hmr'))
    .not.toThrow();
});
it('rejects a changed measured width, color, padding side or physical box', () => {
  const source = sourcePhysical();
  for (const field of ['width', 'color', 'paddingLeft']) {
    const changed = structuredClone(physical);
    changed.presets[0].css.find(([name]) => name === field)![1] = 'changed';
    expect(() => verifyDatePickerPresetsPhysical(changed, source, field, 'vite-hmr')).toThrow();
  }
  const changed = structuredClone(physical);
  changed.presets[0].box.width += 1;

  expect(() => verifyDatePickerPresetsPhysical(changed, source, 'box', 'vite-hmr')).toThrow();
});
it('rejects an arbitrary scope class, wrong renderer or extra literal child', () => {
  const source = sourcePhysical(), changed = structuredClone(physical);
  changed.presets[0].attributes = [['class', 'unexpected']];

  expect(() => verifyDatePickerPresetsPhysical(changed, source, 'scope', 'vite-hmr')).toThrow();
  expect(() => verifyDatePickerPresetsPhysical(physical, source, 'renderer', 'no-hmr')).toThrow();
  const literal = structuredClone(physical);
  literal.presets[0].children!.push({ identity: -1, type: 3, name: '#text', text: 'extra' });

  expect(() => verifyDatePickerPresetsPhysical(literal, source, 'literal', 'vite-hmr')).toThrow();
});
it('rejects altered custom label HTML and unknown compiler anchors', () => {
  const source = sourcePhysical(), changed = structuredClone(physical);
  changed.authoredLabels[0].html += '<i>extra</i>';

  expect(() => verifyDatePickerPresetsPhysical(changed, source, 'label', 'vite-hmr')).toThrow();
  const anchor = structuredClone(physical);
  anchor.popups[0].allElements[0].html = anchor.popups[0].allElements[0].html!
    .replace('<!---->', '<!--unknown-->');

  expect(() => verifyDatePickerPresetsPhysical(anchor, source, 'anchor', 'vite-hmr')).toThrow();
});
it('accepts the actual returned Dayjs object and rejects a substituted alias', () => {
  const source = sourceReturn(), identities = createDatePickerPresetsIdentityProof();

  expect(() => verifyDatePickerPresetsReturnedDate(nativeReturn, source, identities, 'actual'))
    .not.toThrow();
  const cloned = structuredClone(nativeReturn);
  const graph = cloned.raw as { root: { ref: number }; objects: Array<{ id: number }> };
  const old = cloned.identity!;
  cloned.identity = old + 100000;
  graph.root.ref = cloned.identity;
  graph.objects.find(node => node.id === old)!.id = cloned.identity;

  expect(() => verifyDatePickerPresetsReturnedDate(cloned, source, identities, 'substitution'))
    .toThrow();
});
it('rejects changing full preset milliseconds or the recorded lazy return relation', () => {
  const source = sourceReturn(), changed = structuredClone(nativeReturn);
  changed.temporal!.epoch += 1;
  const changedDate = new Date(changed.temporal!.epoch);
  changed.temporal!.iso = changedDate.toISOString();
  changed.temporal!.fields[6] += 1;

  expect(() => verifyDatePickerPresetsReturnedDate(changed, source,
    createDatePickerPresetsIdentityProof(), 'precision')).toThrow();
  const alias = structuredClone(nativeReturn);
  alias.sameAsLazyReturns[0] = false;

  expect(() => verifyDatePickerPresetsReturnedDate(alias, source,
    createDatePickerPresetsIdentityProof(), 'return')).toThrow();
});
it('accepts numeric UTC zero signs and rejects a changed offset or temporal field set', () => {
  const source = sourceReturn(), negativeZero = structuredClone(nativeReturn);
  negativeZero.temporal!.utcOffset = -0;

  expect(() => verifyDatePickerPresetsReturnedDate(negativeZero, source,
    createDatePickerPresetsIdentityProof(), 'negative zero')).not.toThrow();
  const offset = structuredClone(nativeReturn);
  offset.temporal!.utcOffset = 60;

  expect(() => verifyDatePickerPresetsReturnedDate(offset, source,
    createDatePickerPresetsIdentityProof(), 'offset')).toThrow();
  const extra = structuredClone(nativeReturn);
  Object.assign(extra.temporal!, { unexpected: true });

  expect(() => verifyDatePickerPresetsReturnedDate(extra, source,
    createDatePickerPresetsIdentityProof(), 'extra field')).toThrow();
  const missing = structuredClone(nativeReturn);
  delete (missing.temporal as Partial<NonNullable<DatePickerPresetValue['temporal']>>).fields;

  expect(() => verifyDatePickerPresetsReturnedDate(missing, source,
    createDatePickerPresetsIdentityProof(), 'missing field')).toThrow();
});
it('accepts only the observed connected removal blur after the exact live callback prefix', () => {
  const source = sourceRemoval();

  expect(() => verifyDatePickerPresetsRemovalBlur(nativeBefore, nativeAfter,
    source.before, source.after, sample, 'recorded')).not.toThrow();
});
it('rejects missing metadata, disconnected targets, extra callbacks and a changed prefix', () => {
  const source = sourceRemoval();
  for (const field of ['targetConnected', 'currentTargetMatchesTarget', 'ownerAlive'] as const) {
    const changed = structuredClone(nativeAfter);
    changed.callbackInvocations.at(-1)!.nativeFocus![field] = false;
    expect(() => verifyDatePickerPresetsRemovalBlur(nativeBefore, changed,
      source.before, source.after, sample, field)).toThrow();
  }
  const missing = structuredClone(nativeAfter);
  delete missing.callbackInvocations.at(-1)!.nativeFocus;

  expect(() => verifyDatePickerPresetsRemovalBlur(nativeBefore, missing,
    source.before, source.after, sample, 'metadata')).toThrow();
  const extra = structuredClone(nativeAfter);
  extra.callbackInvocations.push(structuredClone(extra.callbackInvocations.at(-1)!));

  expect(() => verifyDatePickerPresetsRemovalBlur(nativeBefore, extra,
    source.before, source.after, sample, 'extra')).toThrow();
  const prefix = structuredClone(nativeAfter);
  prefix.callbackInvocations[0].actionIndex += 1;

  expect(() => verifyDatePickerPresetsRemovalBlur(nativeBefore, prefix,
    source.before, source.after, sample, 'prefix')).toThrow();
});
it('rejects a pre-calendar validation even when a later valid-looking call remains', () => {
  const sample = datePickerPresetSamples.find(sample => sample.id === 'static-validity')!;
  const source = readDatePickerPresetsStep(sample.id, 9).actual.owner;
  const native = proof.validationOrder as unknown as Pick<DatePickerPresetOwner,
    'calls' | 'callbackInvocations'>;

  expect(() => verifyDatePickerPresetsValidationOrder(native, source, sample)).not.toThrow();
  const changed = structuredClone(native);
  const calendar = changed.callbackInvocations.find(row => row.name === 'calendar')!;
  const first = structuredClone(changed.calls[0]) as {
    rawArgument: { root: { ref: number }; objects: Array<{ id: number }> }
  };
  const graph = first.rawArgument, old = graph.root.ref;
  graph.root.ref = (calendar.rawArguments as { root: { ref: number } }).root.ref - 1;
  graph.objects.find(node => node.id === old)!.id = graph.root.ref;
  changed.calls.unshift(first);

  expect(() => verifyDatePickerPresetsValidationOrder(changed, source, sample)).toThrow();
});
