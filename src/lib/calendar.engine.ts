// Calendar grid and year and month list operations use GenerateConfig. The adapter owns date
// formatting and comparison. Calendar 6.6.8 and PickerPanel 1.12.2, under MIT. See
// vendor/LICENSE.ant-design and LICENSE.rc-picker.
import type { GenerateConfig } from './date-generate.types';
import type { CalendarLang, CalendarLocale, CalendarMode } from './calendar.types';
import { datePickerEnUS } from './date-picker.locale';
export { fillPickerLocale as calendarFilledLocale } from './picker-locale.engine';

// Compares the years of two dates through the adapter.
export function calendarSameYear<T>(a: T | undefined, b: T | undefined, date: GenerateConfig<T>) {
  return !!a && !!b && date.getYear(a) === date.getYear(b);
}

// Includes the year when comparing months.
export function calendarSameMonth<T>(a: T | undefined, b: T | undefined, date: GenerateConfig<T>) {
  return calendarSameYear(a, b, date) && date.getMonth(a!) === date.getMonth(b!);
}

// Compares the calendar day independently of time.
export function calendarSameDate<T>(a: T | undefined, b: T | undefined, date: GenerateConfig<T>) {
  return calendarSameMonth(a, b, date) && date.getDate(a!) === date.getDate(b!);
}

// Applies local settings over context and the shared English defaults.
export function calendarLocale(context?: CalendarLocale, local?: CalendarLocale) {
  return {
    ...datePickerEnUS,
    ...context,
    ...local,
    lang: { ...datePickerEnUS.lang, ...context?.lang, ...local?.lang } as CalendarLang,
    timePickerLocale: {
      ...datePickerEnUS.timePickerLocale,
      ...context?.timePickerLocale,
      ...local?.timePickerLocale
    }
  };
}

// Uses years from the allowed range or builds a window around the current year.
export function calendarYearOptions<T>(
  value: T,
  range: [T, T] | undefined,
  locale: CalendarLang,
  date: GenerateConfig<T>
) {
  const year = date.getYear(value);
  const start = range ? date.getYear(range[0]) : year - 10;
  const end = range ? date.getYear(range[1]) + 1 : start + 20;
  const options: { value: number; label: string; }[] = [];

  for (let index = start; index < end; index++)
    options.push({ value: index, label: `${index}${locale.year === '年' ? '年' : ''}` });

  return options;
}

// Limits the month list to the current year within validRange.
export function calendarMonthOptions<T>(
  value: T,
  range: [T, T] | undefined,
  locale: CalendarLang,
  date: GenerateConfig<T>
) {
  const year = date.getYear(value);
  const start = range && date.getYear(range[0]) === year ? date.getMonth(range[0]) : 0;
  const end = range && date.getYear(range[1]) === year ? date.getMonth(range[1]) : 11;
  const months = locale.shortMonths || date.locale.getShortMonths?.(locale.locale) || [];
  const options: { value: number; label: string; }[] = [];

  for (let index = start; index <= end; index++)
    options.push({ value: index, label: months[index] });

  return options;
}

// Preserves the month when changing years and clamps it in the first and last years of the range.
export function calendarSetYear<T>(
  value: T,
  year: number,
  range: [T, T] | undefined,
  date: GenerateConfig<T>
) {
  let next = date.setYear(value, year);

  if (range) {
    const [start, end] = range;
    const nextYear = date.getYear(next);
    const nextMonth = date.getMonth(next);

    if (nextYear === date.getYear(end) && nextMonth > date.getMonth(end))
      next = date.setMonth(next, date.getMonth(end));

    if (nextYear === date.getYear(start) && nextMonth < date.getMonth(start))
      next = date.setMonth(next, date.getMonth(start));
  }

  return next;
}

// Checks validRange bounds before calling the consumer's disabledDate.
export function calendarDateDisabled<T>(
  value: T,
  range: [T, T] | undefined,
  disabledDate: ((value: T) => boolean) | undefined,
  date: GenerateConfig<T>
): boolean {
  return !!(range && (date.isAfter(range[0], value) || date.isAfter(value, range[1])))
    || !!disabledDate?.(value);
}

// Treats the month as unavailable when both endpoints are disabled.
export function calendarMonthDisabled<T>(
  value: T,
  range: [T, T] | undefined,
  disabledDate: ((value: T) => boolean) | undefined,
  date: GenerateConfig<T>
): boolean {
  const start = date.setDate(value, 1);
  const next = date.setMonth(start, date.getMonth(start) + 1);
  const end = date.addDate(next, -1);

  return calendarDateDisabled(start, range, disabledDate, date)
    && calendarDateDisabled(end, range, disabledDate, date);
}

// Builds a year grid of months or six weeks aligned to the locale's week start.
export function calendarRows<T>(
  value: T,
  mode: CalendarMode,
  locale: string,
  date: GenerateConfig<T>
): T[][] {
  if (mode === 'year') {
    const base = date.setMonth(value, 0);

    return Array.from({ length: 4 }, (_, row) =>
      Array.from({ length: 3 }, (_, col) => date.addMonth(base, row * 3 + col))
    );
  }

  const first = date.setDate(value, 1);
  const weekFirstDay = date.locale.getWeekFirstDay(locale);
  const startWeekDay = date.getWeekDay(first);
  let base = date.addDate(first, weekFirstDay - startWeekDay);

  if (date.getMonth(base) === date.getMonth(value) && date.getDate(base) > 1)
    base = date.addDate(base, -7);

  return Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 7 }, (_, col) => date.addDate(base, row * 7 + col))
  );
}
