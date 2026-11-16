import {
  selectVirtualDefaults, selectVirtualData, selectVirtualOptions,
  type SelectVirtualSample
} from './select-virtual-cases';

export interface SelectVirtualEdgeSample extends SelectVirtualSample {
  family: 'auto-complete';
  scenario: 'basic';
  layout: 'plain';
  initialValue?: string;
  edge: 'empty-option' | 'group-estimate';
}
export type SelectVirtualEdgeAction =
  | { type: 'click' | 'outside' }
  | { type: 'edge-group-ref' }
  | { type: 'ref'; method: 'scrollTo'; target:
    { kind: 'key'; key: string; align: 'top' } | { kind: 'index'; index: number } };

const base = { ...selectVirtualDefaults, family: 'auto-complete', scenario: 'basic', layout: 'plain', height: 'small' } as const;
export const selectVirtualEdgeSamples: readonly SelectVirtualEdgeSample[] = [
  { ...base, id: 'auto-complete-empty-option-empty-value', edge: 'empty-option', count: 2, initialValue: '' },
  { ...base, id: 'auto-complete-empty-option-other-value', edge: 'empty-option', count: 2, initialValue: 'other' },
  { ...base, id: 'auto-complete-group-estimate32', edge: 'group-estimate', groups: true },
  { ...base, id: 'auto-complete-group-estimate16', edge: 'group-estimate', groups: true, itemHeight: 'small' }
];

/** Authored public options; no expected measurements or captured Source inputs are imported. */
export function selectVirtualEdgeOptions(sample: SelectVirtualEdgeSample) {
  const data = sample.edge === 'empty-option' ? [
    { key: 'empty-key', value: '', label: 'Empty option', disabled: false },
    { key: 'other-key', value: 'other', label: 'Other option', disabled: false }
  ] : selectVirtualData();
  return selectVirtualOptions(data, sample.count, sample.groups);
}
export function selectVirtualEdgeActions(sample: SelectVirtualEdgeSample): readonly SelectVirtualEdgeAction[] {
  return sample.edge === 'group-estimate' ? [{ type: 'click' }, { type: 'edge-group-ref' },
    { type: 'ref', method: 'scrollTo', target: { kind: 'index', index: 0 } }, { type: 'outside' }]
    : [{ type: 'click' }, { type: 'ref', method: 'scrollTo', target: { kind: 'key', key: 'empty-key', align: 'top' } },
      { type: 'outside' }];
}
