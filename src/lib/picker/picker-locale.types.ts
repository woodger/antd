import type { datePickerEnUS } from './date-picker.locale';

/** Language rc-picker; download Day.js locale, except built en/ru, should the consumer. */
// Legacy dayFormat is stored in default locale data, but does not include deprecated override API.
export type PickerLocale = Omit<Partial<typeof datePickerEnUS.lang>, 'dayFormat'> & {
  locale: string;
  shortWeekDays?: string[];
  shortMonths?: string[];
  monthFormat?: string;
  fieldDateTimeFormat?: string;
  fieldDateFormat?: string;
  fieldTimeFormat?: string;
  fieldMonthFormat?: string;
  fieldYearFormat?: string;
  fieldWeekFormat?: string;
  fieldQuarterFormat?: string;
  cellYearFormat?: string;
  cellQuarterFormat?: string;
  cellDateFormat?: string;
};
