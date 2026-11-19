export type QuarterOwner = 'single-quarter' | 'range-quarter';
export type QuarterControlName = 'need-confirm-true' | 'need-confirm-false' | 'limits-on' | 'limits-off'
  | 'block-last' | 'locale' | 'order-false' | 'order-true' | 'same-period-disabled';
export type QuarterAction = { type: 'input-open' | 'input-escape'; index: 0 | 1 }
  | { type: 'owner-control'; value: QuarterControlName }
  | { type: 'input-key'; value: string }
  | { type: 'cell-click'; title: string }
  | { type: 'preset-click'; label: string }
  | { type: 'upper-cell-click'; value: string }
  | { type: 'header-promote' | 'header-next' | 'confirm-click' }
  | { type: 'input-type'; index: 0 | 1; value: string };
export type QuarterAuthoredDateName = 'initialStart' | 'initialEnd' | 'minDate' | 'maxDate'
  | 'presetA' | 'presetB' | 'witnessStart' | 'witnessEnd';
export interface QuarterSample extends Record<QuarterAuthoredDateName, string> {
  id: QuarterOwner; kind: 'single' | 'range'; picker: 'quarter';
  blocked: { year: number; firstMonth: number; lastMonth: number };
  locale: { lang: { fieldQuarterFormat: string; cellQuarterFormat: string;
    quarterPlaceholder: string; rangeQuarterPlaceholder: [string, string] } };
  actions: QuarterAction[];
}
export const samples: QuarterSample[];
export const counts: { owners: number; actions: number; initialAndSettledPoints: number;
  declaredEscapeReadsAfter1000: number; wholeUnmounts: number; initialClosedSSRSerializations: number };
