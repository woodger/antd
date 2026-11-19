export type WeekOwner = 'single-week' | 'range-week';
export type WeekLocaleName = 'us' | 'gb';
export type WeekControlName = 'need-confirm-true' | 'need-confirm-false' | 'limits-on' | 'limits-off'
  | 'locale-gb' | 'hide-week-numbers' | 'default-week-numbers' | 'order-false'
  | 'order-true' | 'same-week-disabled';
export type WeekAction = { type: 'input-open' | 'input-escape'; index: 0 | 1 }
  | { type: 'owner-control'; value: WeekControlName }
  | { type: 'input-key'; value: string }
  | { type: 'cell-click' | 'cell-hover'; title: string; panel: 0 | 1 }
  | { type: 'week-number-click'; contains: string; panel: 0 | 1 }
  | { type: 'preset-click'; label: string }
  | { type: 'upper-cell-click'; title: string }
  | { type: 'header-promote'; mode: 'year' }
  | { type: 'header-next-month' | 'confirm-click' | 'pointer-leave' }
  | { type: 'input-type'; index: 0 | 1; value: string };
export type WeekAuthoredDateName = 'initialStart' | 'initialEnd' | 'minDate' | 'maxDate'
  | 'presetA' | 'presetB' | 'witnessStart' | 'witnessEnd';
export interface WeekSample extends Record<WeekAuthoredDateName, string> {
  id: WeekOwner; kind: 'single' | 'range'; picker: 'week'; initialLocale: WeekLocaleName;
  blocked: { year: number; month: number; day: number };
  localeGB: { lang: { locale: 'en_GB'; weekPlaceholder: string;
    rangeWeekPlaceholder: [string, string] } };
  actions: WeekAction[];
}
export const samples: WeekSample[];
export const counts: { owners: number; actions: number; initialAndSettledPoints: number;
  declaredEscapeReadsAfter1000: number; wholeUnmounts: number; initialClosedSSRSerializations: number };
