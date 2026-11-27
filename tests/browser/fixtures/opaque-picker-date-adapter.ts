// Factory scenario adapter. An immutable object with a single field comes outwards; calendar
// arithmetics uses UTC within the implementation.
import type { GenerateConfig } from '@woodger/antd';

export type OpaquePickerDate = Readonly<{ stamp: number; }>;

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weekMilliseconds = 7 * 24 * 60 * 60 * 1000;

/** Creates a value in a view that uses an independent UMD run. */
export function opaqueDate(text: string): OpaquePickerDate {
  return Object.freeze({ stamp: Date.parse(text) });
}

/** Deploys the value only inside the adapter or in the observation of the test. */
export function readOpaqueDate(value: OpaquePickerDate): Date {
  return new Date(value.stamp);
}

/** Applies the change to a separate copy UTC of the date, maintaining the immutability of the value. */
function editOpaqueDate(value: OpaquePickerDate, edit: (date: Date) => number | void) {
  const date = readOpaqueDate(value);
  edit(date);

  return Object.freeze({ stamp: date.getTime() });
}

/** Shifting the month with the limitation of the day with the last number of the new month. */
function addMonth(value: OpaquePickerDate, amount: number) {
  return editOpaqueDate(value, date => {
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + amount);
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
    date.setUTCDate(Math.min(day, end.getUTCDate()));
  });
}

/** Formats tokens that the test calendar and editor use. */
function printOpaqueDate(value: OpaquePickerDate, format: string) {
  const date = readOpaqueDate(value);
  const month = date.getUTCMonth() + 1;
  const tokens: Record<string, number> = {
    YYYY: date.getUTCFullYear(), MM: month, M: month, DD: date.getUTCDate(), D: date.getUTCDate(),
    HH: date.getUTCHours(), mm: date.getUTCMinutes(), ss: date.getUTCSeconds(),
    SSS: date.getUTCMilliseconds(), Q: Math.ceil(month / 3)
  };
  // Literals in brackets go into the label without processing tokens.
  return format.replace(/\[[^\]]*\]|YYYY|MM|DD|HH|mm|ss|SSS|M|D|Q/g, token =>
    token.startsWith('[') ? token.slice(1, -1) : String(tokens[token]).padStart(token.length, '0'));
}

export const opaquePickerAdapter: GenerateConfig<OpaquePickerDate> = {
  // Connects the service date with the receiver of a particular adapter.
  getNow() { return this.getFixedDate('2024-06-19T16:00:00Z'); },
  getFixedDate: opaqueDate,
  // Determines the last number of the month, saving time.
  getEndDate: value => editOpaqueDate(value, date => date.setUTCMonth(date.getUTCMonth() + 1, 0)),
  // Brings back the index of the day for the grid with the start of the week on Sunday.
  getWeekDay: value => readOpaqueDate(value).getUTCDay(),
  // He reads the calendar year on UTC.
  getYear: value => readOpaqueDate(value).getUTCFullYear(),
  // Returns the index of the month from zero.
  getMonth: value => readOpaqueDate(value).getUTCMonth(),
  // Returns the number of the month from the unit.
  getDate: value => readOpaqueDate(value).getUTCDate(),
  // Reads an hour in a 24-hour format.
  getHour: value => readOpaqueDate(value).getUTCHours(),
  // Returns the minutes in the current hour.
  getMinute: value => readOpaqueDate(value).getUTCMinutes(),
  // Returns seconds in the current minute.
  getSecond: value => readOpaqueDate(value).getUTCSeconds(),
  // Keeps the fractional part of the second without rounding.
  getMillisecond: value => readOpaqueDate(value).getUTCMilliseconds(),
  // The year and the month use one way to choose the day on the border of February.
  addYear(value, amount) { return this.addMonth(value, amount * 12); },
  addMonth,
  // Shifts the date on the calendar days, saving units of time.
  addDate: (value, amount) => editOpaqueDate(value, date => date.setUTCDate(date.getUTCDate() + amount)),
  // Replacing the Calendar year using normalization UTC Date.
  setYear: (value, year) => editOpaqueDate(value, date => date.setUTCFullYear(year)),
  // Replaces the index of the month with the transfer in the next year.
  setMonth: (value, month) => editOpaqueDate(value, date => date.setUTCMonth(month)),
  // Replaces the number of the month.
  setDate: (value, day) => editOpaqueDate(value, date => date.setUTCDate(day)),
  // Sets an hour with a transfer at midnight when overflowing.
  setHour: (value, hour) => editOpaqueDate(value, date => date.setUTCHours(hour)),
  // Replaces the unit of time regardless of the calendar day.
  setMinute: (value, minute) => editOpaqueDate(value, date => date.setUTCMinutes(minute)),
  // Set seconds without rounding milliseconds.
  setSecond: (value, second) => editOpaqueDate(value, date => date.setUTCSeconds(second)),
  // Maintains the transfer in the current second with a negative millisecond.
  setMillisecond: (value, ms) => editOpaqueDate(value, date => date.setUTCMilliseconds(ms)),
  // Compares the absolute UTC values of the range.
  isAfter: (a, b) => a.stamp > b.stamp,
  // Discards service NaN value, which returns Date.parse.
  isValidate: value => Number.isFinite(value.stamp),
  locale: {
    // The beginning of the week coincides with the setting of UMD-run.
    getWeekFirstDay: () => 0,
    // Reads the first date of the week by means of the same calendar.
    getWeekFirstDate(_locale, value) {
      return opaquePickerAdapter.addDate(value, -opaquePickerAdapter.getWeekDay(value));
    },
    // Considers the number of the week from the beginning of the calendar year.
    getWeek(_locale, value) {
      const year = opaquePickerAdapter.getYear(value);
      return Math.ceil((value.stamp - Date.UTC(year, 0, 1)) / weekMilliseconds) + 1;
    },
    // Uses brief labels captured in the benchmark.
    getShortWeekDays: () => weekdays,
    // Returns labels in the order of indexes of the month.
    getShortMonths: () => months,
    // Formats the date as an editor's text or cell label.
    format: (_locale, value, format) => printOpaqueDate(value, format),
    // Accepts an exact calendar date and validates it through the locale receiver.
    parse(locale, text, formats) {
      if (!formats.includes('YYYY-MM-DD') || !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return null;
      }

      const date = opaqueDate(`${text}T00:00:00Z`);
      return opaquePickerAdapter.isValidate(date) && this.format(locale, date, 'YYYY-MM-DD') === text
        ? date : null;
    }
  }
};
