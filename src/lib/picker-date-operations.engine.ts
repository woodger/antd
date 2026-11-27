// Uses one date configuration for calendar operations in the field and panel. The adapter owns
// values, which pass through with their original type and identity.
import type { Dayjs } from 'dayjs';
import type { GenerateConfig } from './date-generate.types';
import { dayjsGenerateConfig } from './date-picker-dayjs.engine';
import type { TimePickerUnit } from './time-picker.types';

export type PickerDatePeriod = 'day' | 'month' | 'year';

type PickerDateFields<DateType> = Pick<GenerateConfig<DateType>,
  'getYear' | 'getMonth' | 'getDate' | 'getHour' | 'getMinute' | 'getSecond' | 'getMillisecond'
  | 'setYear' | 'setMonth' | 'setDate' | 'setHour' | 'setMinute' | 'setSecond' | 'setMillisecond'
  | 'addYear' | 'addMonth' | 'addDate' | 'isValidate'>;

export interface PickerDateOperations<DateType extends object> {
  generateConfig: GenerateConfig<DateType>;
  fields: PickerDateFields<DateType>;
  getTimeUnit: (value: DateType, unit: TimePickerUnit) => number;
  setTimeUnit: (value: DateType, unit: TimePickerUnit, next: number) => DateType;
  add: (value: DateType, amount: number, unit: PickerDatePeriod | 'millisecond') => DateType;
  startOf: (value: DateType, period: PickerDatePeriod) => DateType;
  endOf: (value: DateType, period: PickerDatePeriod) => DateType;
  isBefore: (value: DateType, reference: DateType, period?: PickerDatePeriod) => boolean;
  isAfter: (value: DateType, reference: DateType, period?: PickerDatePeriod) => boolean;
  samePeriod: (value: DateType, reference: DateType, period: PickerDatePeriod) => boolean;
  sameTime: (value: DateType, reference: DateType) => boolean;
  sameWallValue: (value: DateType | null, reference: DateType | null) => boolean;
  sameValue: (
    value: DateType | null | undefined, reference: DateType | null | undefined
  ) => boolean;
  compare: (value: DateType, reference: DateType) => number;
  key: (value: DateType) => number | string;
  formatKey: (value: DateType, format?: string, locale?: string) => string;
}

const timeReaders = {
  hour: 'getHour', minute: 'getMinute', second: 'getSecond', millisecond: 'getMillisecond'
} as const;
const timeWriters = {
  hour: 'setHour', minute: 'setMinute', second: 'setSecond', millisecond: 'setMillisecond'
} as const;
const calendarOffsets = { day: 'addDate', month: 'addMonth', year: 'addYear' } as const;

/** Collects panel operations from GenerateConfig, saving its methods. */
export function createPickerDateOperations<DateType extends object>(
  generateConfig: GenerateConfig<DateType>,
  fields: PickerDateFields<DateType> = generateConfig
): PickerDateOperations<DateType> {
  /** Sets the boundary time of the calendar period with an accuracy to a millisecond. */
  function setDayBoundary(value: DateType, end: boolean) {
    const hours = fields.setHour(value, end ? 23 : 0);
    const minutes = fields.setMinute(hours, end ? 59 : 0);
    const seconds = fields.setSecond(minutes, end ? 59 : 0);

    return fields.setMillisecond(seconds, end ? 999 : 0);
  }

  /** Compares the fields to the selected period, starting from the calendar year. */
  function samePeriod(value: DateType, reference: DateType, period: PickerDatePeriod) {
    return fields.getYear(value) === fields.getYear(reference)
      && (period === 'year' || fields.getMonth(value) === fields.getMonth(reference))
      && (period !== 'day' || fields.getDate(value) === fields.getDate(reference));
  }

  /** Compares the time for the time mode and the boundaries, accurate to a second. */
  function sameTime(value: DateType, reference: DateType) {
    return fields.getHour(value) === fields.getHour(reference)
      && fields.getMinute(value) === fields.getMinute(reference)
      && fields.getSecond(value) === fields.getSecond(reference);
  }

  /** Compares all calendar fields, including a fraction of a second, like isSameTimestamp rc-picker. */
  function sameWallValue(value: DateType | null, reference: DateType | null) {
    if (!value || !reference) {
      return value === reference;
    }

    return samePeriod(value, reference, 'day') && sameTime(value, reference)
      && fields.getMillisecond(value) === fields.getMillisecond(reference);
  }

  return {
    generateConfig,
    fields,
    // Select a deleter column without converting the date value.
    getTimeUnit: (value, unit) => fields[timeReaders[unit]](value),
    // Passes the new column value to the adapter and returns the date it computes.
    setTimeUnit: (value, unit, next) => fields[timeWriters[unit]](value, next),
    // Calendar step depends on the selected unit. For a fraction of a second, it keeps the transfer.
    add: (value, amount, unit) => unit === 'millisecond'
      ? fields.setMillisecond(value, fields.getMillisecond(value) + amount)
      : fields[calendarOffsets[unit]](value, amount),
    // Nullifies the younger fields of the selected calendar period.
    startOf(value, period) {
      const month = period === 'year' ? fields.setMonth(value, 0) : value;
      const day = period === 'day' ? month : fields.setDate(month, 1);

      return setDayBoundary(day, false);
    },
    // The last day determines the adapter, including the different length of the months.
    endOf(value, period) {
      const month = period === 'year' ? fields.setMonth(value, 11) : value;
      const day = period === 'day' ? month : generateConfig.getEndDate(month);

      return setDayBoundary(day, true);
    },
    // The order within one calendar period is considered to be equal.
    isBefore: (value, reference, period) => (!period || !samePeriod(value, reference, period))
      && generateConfig.isAfter(reference, value),
    // Verifies exceeding the border with the specified accuracy, if specified.
    isAfter: (value, reference, period) => (!period || !samePeriod(value, reference, period))
      && generateConfig.isAfter(value, reference),
    samePeriod,
    sameTime,
    sameWallValue,
    // The field uses null and undefined as the absence of the selected date.
    sameValue: (value, reference) => value === reference
      || sameWallValue(value ?? null, reference ?? null),
    // The order of the adapter specifies the sorting, matching values leave the order of entry.
    compare: (value, reference) => generateConfig.isAfter(value, reference) ? 1
      : generateConfig.isAfter(reference, value) ? -1 : 0,
    // The tag key is saved when the date is replaced with an equal instance of the same adapter.
    key: value => [
      fields.getYear(value), fields.getMonth(value), fields.getDate(value),
      fields.getHour(value), fields.getMinute(value), fields.getSecond(value),
      fields.getMillisecond(value)
    ].join(':'),
    // Calendar labels and focus markers use the same location and format.
    formatKey: (value, format = 'YYYY-MM-DD HH:mm:ss.SSS', locale = 'en_US') =>
      generateConfig.locale.format(locale, value, format)
  };
}

const dayjsFields: PickerDateFields<Dayjs> = {
  // The panel uses the calendar year in the mode of the instance of Dayjs itself.
  getYear: value => value.year(),
  // An index from zero is used for the grid and calculating the quarter.
  getMonth: value => value.month(),
  // Keeps the local day of the month when comparing the cells.
  getDate: value => value.date(),
  // The timeline of the clock column starts from scratch.
  getHour: value => value.hour(),
  // Saves minutes in the original value zone.
  getMinute: value => value.minute(),
  // Brings back a second of minutes for restrictions and a selection column.
  getSecond: value => value.second(),
  // Readers the accuracy of the field without conversion to timestamp.
  getMillisecond: value => value.millisecond(),
  // Sets the year by the rules of the original instance of Dayjs.
  setYear: (value, year) => value.year(year),
  // Moving to the month keeps Dayjs rules for short months.
  setMonth: (value, month) => value.month(month),
  // The installation of the day keeps the transfer to the next month.
  setDate: (value, day) => value.date(day),
  // Replacing an hour by saving UTC or local time mode at the value.
  setHour: (value, hour) => value.hour(hour),
  // Replaces the minute in the same calendar mode.
  setMinute: (value, minute) => value.minute(minute),
  // Replaces a second without rounding to a minute.
  setSecond: (value, second) => value.second(second),
  // Keeps milliseconds in Dayjs.
  setMillisecond: (value, millisecond) => value.millisecond(millisecond),
  // Scrolls the year of the panel on the calendar.
  addYear: (value, amount) => value.add(amount, 'year'),
  // Scrolls the month with the correction of the day in the target month.
  addMonth: (value, amount) => value.add(amount, 'month'),
  // Keeps the calendar step when moving through the change of the clock shift.
  addDate: (value, amount) => value.add(amount, 'day'),
  // Checks the value in its original copy.
  isValidate: value => value.isValid()
};

export const dayjsPickerDates: PickerDateOperations<Dayjs> = {
  ...createPickerDateOperations(dayjsGenerateConfig, dayjsFields),
  // Saves the original Dayjs get, including the settings connected plugins.
  getTimeUnit: (value, unit) => value.get(unit),
  // Saves Dayjs set to change one column.
  setTimeUnit: (value, unit, next) => value.set(unit, next),
  // Uses Dayjs calendar and absolute steps with current zone rules.
  add: (value, amount, unit) => value.add(amount, unit),
  // Calculates the beginning in the starting zone of the value with timezone plugins rules.
  startOf: (value, period) => value.startOf(period),
  // Calculates the end of the period by means of the original Dayjs.
  endOf: (value, period) => value.endOf(period),
  // Saves a comparison of Dayjs with bringing to the period of the first value.
  isBefore: (value, reference, period) => value.isBefore(reference, period),
  // Saves a comparison of Dayjs at the beginning of the period of the first value.
  isAfter: (value, reference, period) => value.isAfter(reference, period),
  // For navigation, Dayjs compares the calendar interval of the first value.
  samePeriod: (value, reference, period) => value.isSame(reference, period),
  // Choosing the default date is compared as timestamp and takes into account zone displacement.
  sameValue: (value, reference) => value?.valueOf() === reference?.valueOf(),
  // Sorts Dayjs tags at the same numerical timestamp.
  compare: (value, reference) => value.valueOf() - reference.valueOf(),
  // Dayjs tags use the original timestamp as part of the key.
  key: value => value.valueOf(),
  // Dayjs service labels retain the locale of the instance itself.
  formatKey: (value, format) => value.format(format)
};
