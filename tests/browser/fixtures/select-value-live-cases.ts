import { selectValueSamples, type SelectValueSample, type SelectValueAction } from './select-value-cases';

/** Atomic public-owner updates avoid invalid intermediate model/labelInValue pairs. */
export type SelectValueLiveAction = SelectValueAction | { type: 'transaction'; updates: SelectValueAction[] };
export const selectValueLiveSamples: readonly SelectValueSample[] = [
  { ...selectValueSamples.find(sample => sample.scenario === 'supplied-text')!,
    id: 'select-value-live-labeled-single', scenario: 'live-labeled-single', optionLabelProp: 'alternate', renderer: 'text' },
  { ...selectValueSamples.find(sample => sample.scenario === 'multiple-true')!,
    id: 'select-value-live-labeled-multiple', scenario: 'live-labeled-multiple', optionLabelProp: 'alternate', renderer: 'text',
    initial: [{ kind: 'labeled', value: 'a', label: 'text' }, { kind: 'labeled', value: 'b', label: 'undefined' }] }
];
export function selectValueLiveActions(sample: SelectValueSample): readonly SelectValueLiveAction[] {
  if (sample.mode) return [{ type: 'click' }, { type: 'transaction', updates: [
    { type: 'props', set: { labelInValue: 'false' } },
    { type: 'value', value: [{ kind: 'raw', value: 'a' }, { kind: 'raw', value: 'b' }] }
  ] }, { type: 'choose', text: 'Alpha' }, { type: 'transaction', updates: [
    { type: 'props', set: { labelInValue: 'true' } },
    { type: 'value', value: [{ kind: 'labeled', value: 'a', label: 'text' }, { kind: 'labeled', value: 'b', label: 'undefined' }] }
  ] }, { type: 'choose', text: 'Beta' }, { type: 'clear' }, { type: 'outside' }];
  return [{ type: 'click' }, { type: 'choose', text: 'Alpha' }, { type: 'transaction', updates: [
    { type: 'props', set: { labelInValue: 'false' } }, { type: 'value', value: { kind: 'raw', value: 'a' } }
  ] }, { type: 'click' }, { type: 'choose', text: 'Beta' }, { type: 'transaction', updates: [
    { type: 'props', set: { labelInValue: 'true' } }, { type: 'value', value: { kind: 'labeled', value: 'b', label: 'undefined' } }
  ] }, { type: 'click' }, { type: 'choose', text: 'Alpha' }, { type: 'clear' }, { type: 'outside' }];
}
