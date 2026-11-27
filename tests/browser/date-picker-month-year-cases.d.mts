export type MonthYearOwner = 'single-month' | 'single-year' | 'range-month' | 'range-year';
export type MonthYearControlName = 'need-confirm-true' | 'need-confirm-false' | 'limits-on' | 'limits-off'
  | 'locale' | 'order-false' | 'order-true' | 'same-period-disabled';
export type MonthYearAction = { type: 'input-open' | 'input-escape'; index: 0 | 1 }
  | { type: 'owner-control'; value: MonthYearControlName }
  | { type: 'input-key'; value: string }
  | { type: 'cell-click'; title: string }
  | { type: 'preset-click'; label: string }
  | { type: 'upper-cell-click'; value: string }
  | { type: 'header-promote' | 'header-next' | 'confirm-click' }
  | { type: 'input-type'; index: 0 | 1; value: string };
export type MonthYearAuthoredDateName = 'initialStart' | 'initialEnd' | 'minDate' | 'maxDate'
  | 'presetA' | 'presetB' | 'witnessStart' | 'witnessEnd';
export interface MonthYearSample extends Record<MonthYearAuthoredDateName, string> {
  id: MonthYearOwner; kind: 'single' | 'range'; picker: 'month' | 'year';
  blocked: { year: number; month?: number };
  locale: { lang: { fieldMonthFormat?: string; monthPlaceholder?: string;
    rangeMonthPlaceholder?: [string, string]; fieldYearFormat?: string; yearPlaceholder?: string;
    rangeYearPlaceholder?: [string, string] } };
  actions: MonthYearAction[];
}
export const samples: MonthYearSample[];
export const counts: { owners: number; actions: number; initialAndSettledPoints: number;
  declaredEscapeReadsAfter1000: number; wholeUnmounts: number; initialClosedSSRSerializations: number };
