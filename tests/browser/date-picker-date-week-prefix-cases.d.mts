export type DateWeekPrefixOwner = 'single-date-week-prefix' | 'range-date-week-prefix';
export type DateWeekPrefixLocaleName = 'us' | 'gb';
export type DateWeekPrefixControlName = 'hide-week-numbers' | 'show-week-numbers' | 'locale-gb';
export type DateWeekPrefixAction = { type: 'input-open' | 'input-escape'; index: 0 | 1 }
  | { type: 'owner-control'; value: DateWeekPrefixControlName }
  | { type: 'cell-click'; title: string; panel: 0 }
  | { type: 'week-number-hover' | 'week-number-click'; contains: string; panel: 0 };
export type DateWeekPrefixAuthoredDateName = 'initialStart' | 'initialEnd';
export interface DateWeekPrefixSample extends Record<DateWeekPrefixAuthoredDateName, string> {
  id: DateWeekPrefixOwner; kind: 'single' | 'range'; picker: 'date'; initialLocale: 'us';
  initialShowWeek: true;
  blocked: { year: number; month: number; day: number };
  localeGB: { lang: { locale: 'en_GB'; placeholder: string; rangePlaceholder: [string, string] } };
  actions: DateWeekPrefixAction[];
}
export const samples: DateWeekPrefixSample[];
export const counts: { owners: number; actions: number; initialAndSettledPoints: number;
  declaredEscapeReadsAfter1000: number; wholeUnmounts: number; initialClosedSSRSerializations: number };
