// Implements GenerateConfig with Dayjs. Normalizes the locale and values from another Dayjs
// instance before adapter operations. The Day.js adapter follows @rc-component/picker 1.12.2. MIT,
// vendor/LICENSE.rc-picker.
import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import weekday from 'dayjs/plugin/weekday.js';
import localeData from 'dayjs/plugin/localeData.js';
import weekOfYear from 'dayjs/plugin/weekOfYear.js';
import weekYear from 'dayjs/plugin/weekYear.js';
import 'dayjs/locale/ru.js';
import type { GenerateConfig } from './date-generate.types';

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);
dayjs.extend((_options, constructor) => {
  const original = constructor.prototype.format;
  constructor.prototype.format = function(format) {
    // The original formatter uses the current Dayjs instance as its receiver.
    return original.call(this, (format ?? '').replace('Wo', 'wo'));
  };
});
const localeMap: Record<string, string> = {
  bn_BD: 'bn-bd',
  by_BY: 'be',
  en_GB: 'en-gb',
  en_US: 'en',
  fr_BE: 'fr',
  fr_CA: 'fr-ca',
  hy_AM: 'hy-am',
  km_KH: 'km',
  kmr_IQ: 'ku',
  nl_BE: 'nl-be',
  pt_BR: 'pt-br',
  zh_CN: 'zh-cn',
  zh_HK: 'zh-hk',
  zh_TW: 'zh-tw'
};
// Maps Picker locale names to Dayjs codes while preserving regional exceptions.
const localeName = (locale: string) => localeMap[locale] || locale.split('_')[0];
// Preserves adapter behavior when multiple instances of Day.js are present.
const own = (value: Dayjs) => !dayjs.isDayjs(value) || value instanceof dayjs
  ? value
  : dayjs(value.valueOf());

// Uses Dayjs to check whether the text exactly matches the format.
const parseStrictDayjs = (text: string, format: string) => dayjs(text, format, true);

// Returns the first match in the field's locale. The week branch ends the search.
export function parseDayjsInput(
  locale: string,
  text: string,
  formats: readonly string[],
  parseFormat: (text: string, format: string) => Dayjs | null = parseStrictDayjs
): Dayjs | null {
  for (const format of formats) {
    if (format.includes('wo') || format.includes('Wo')) {
      const [year, week] = text.split('-');
      const requestedYear = Number(year);
      const usesWeekYear = format.replace(/\[[^\]]*\]/g, '').includes('gggg');
      const first = dayjs(year, 'YYYY').startOf('year').locale(localeName(locale));
      for (let n = 0; n <= 52; n++) {
        const candidate = first.add(n, 'week');
        if (candidate.format('Wo') !== week) {
          continue;
        }

        // A January date may belong to the last week of the preceding year.
        if (!usesWeekYear || candidate.weekYear() === requestedYear) {
          return candidate;
        }
      }
      return null;
    }
    const date = parseFormat(text, format)?.locale(localeName(locale));
    if (date?.isValid()) {
      return date;
    }
  }
  return null;
}

export const dayjsGenerateConfig: GenerateConfig<Dayjs> = {
  // Uses the current zone when the Dayjs timezone plugin is available.
  getNow: () => {
    const now = dayjs() as Dayjs & { tz?: () => Dayjs; };
    return typeof now.tz === 'function' ? now.tz() : now;
  },
  // Parses an internal date with a one- or two-digit month.
  getFixedDate: text => dayjs(text, ['YYYY-M-DD', 'YYYY-MM-DD']),
  // Returns the end of the month according to the Dayjs calendar.
  getEndDate: value => own(value).endOf('month'),
  // Computes the weekday index on a shared scale using the English locale.
  getWeekDay: value => {
    const date = own(value).locale('en');
    return date.weekday() + date.localeData().firstDayOfWeek();
  },
  // Reads the calendar year used by the year panel.
  getYear: value => own(value).year(),
  // Returns a zero-based month index as required by GenerateConfig.
  getMonth: value => own(value).month(),
  // Returns a one-based day of the month for the grid.
  getDate: value => own(value).date(),
  // Reads the hour on a 24-hour clock. The panel computes meridiem.
  getHour: value => own(value).hour(),
  // Reads the minute of the current hour for the selection column.
  getMinute: value => own(value).minute(),
  // Reads the second of the current minute for the selection column.
  getSecond: value => own(value).second(),
  // Represents the fractional second as an integer from 0 to 999.
  getMillisecond: value => own(value).millisecond(),
  // Shifts the calendar year and normalizes the day in the destination month.
  addYear: (value, amount) => own(value).add(amount, 'year'),
  // Shifts by calendar month rather than by a fixed number of days.
  addMonth: (value, amount) => own(value).add(amount, 'month'),
  // Shifts the calendar day using Dayjs local date arithmetic.
  addDate: (value, amount) => own(value).add(amount, 'day'),
  // Creates a value for the selected year using the adapter's date adjustment.
  setYear: (value, year) => own(value).year(year),
  // Passes a zero-based month index to Dayjs, including year rollover.
  setMonth: (value, month) => own(value).month(month),
  // Sets the calendar day for navigation between cells.
  setDate: (value, date) => own(value).date(date),
  // Sets the hour while retaining the other Dayjs time units.
  setHour: (value, hour) => own(value).hour(hour),
  // Sets the minute and leaves overflow normalization to the adapter.
  setMinute: (value, minute) => own(value).minute(minute),
  // Sets the second without rounding milliseconds.
  setSecond: (value, second) => own(value).second(second),
  // Sets the milliseconds in the time value.
  setMillisecond: (value, millisecond) => own(value).millisecond(millisecond),
  // Compares normalized Dayjs values without rounding to a larger unit.
  isAfter: (a, b) => own(a).isAfter(own(b)),
  // Checks Dayjs validity before publishing the value.
  isValidate: value => own(value).isValid(),
  locale: {
    // Reads the locale's first day of the week for grid alignment.
    getWeekFirstDay: locale => dayjs().locale(localeName(locale)).localeData().firstDayOfWeek(),
    // Returns the start of the week in the requested locale.
    getWeekFirstDate: (locale, value) => own(value).locale(localeName(locale)).weekday(0),
    // Reads the week number using the same locale rules as parse.
    getWeek: (locale, value) => own(value).locale(localeName(locale)).week(),
    // Returns short weekday labels from Dayjs localeData.
    getShortWeekDays: locale => dayjs().locale(localeName(locale)).localeData().weekdaysMin(),
    // Returns short month names in Dayjs index order.
    getShortMonths: locale => dayjs().locale(localeName(locale)).localeData().monthsShort(),
    // Formats the value in the requested locale and supports week number notation.
    format: (locale, value, format) => own(value).locale(localeName(locale)).format(format),
    // Returns just the value for the shared GenerateConfig contract.
    parse: (locale, text, formats) => parseDayjsInput(locale, text, formats)
  }
};
