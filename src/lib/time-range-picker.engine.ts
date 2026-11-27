// Resolves input, time settings, and validation for both range endpoints. Passes the from context
// for dependent end constraints.
// Range time paths from rc-picker 1.12.2. MIT, vendor/LICENSE.rc-picker.
import dayjs, { type Dayjs } from 'dayjs';
import type {} from 'dayjs/plugin/utc.js';
import type { RangePickerValue } from './range-picker.types';
import type { TimeRangePickerProps } from './time-range-picker.types';
import type { DatePickerFormat, DatePickerTimeConfig } from './date-picker.types';
import type { PickerLocale } from './picker-locale.types';
import { createTimePickerEngine, timePickerClock, timePickerSameValue } from './time-picker.engine';
import { createDatePickerEngine, pickerCalendarValue } from './date-picker.engine';
import { parseDayjsInput } from './date-picker-dayjs.engine';
import { dayjsPickerDates, type PickerDateOperations } from './picker-date-operations.engine';

export type TimeRangeInputParser<DateType extends object> = (
  text: string, locale: string, formats: readonly DatePickerFormat<DateType>[], boundary: DateType | null
) => DateType | null;

const calendarFormat = 'YYYY-MM-DD';

// Recognizes clock formats by skipping literals in square brackets.
function isTimeOnlyFormat(format: string): boolean {
  const remainingFormat = format.replace(/\[[^\]]*\]|LTS?|[HhmsSAa]/g, '');
  return !/[A-Za-z]/.test(remainingFormat);
}

// Checks the time on the border date. Formats with an explicit date, offset, or timestamp are dealt
// with directly, since the values of these fields are specified by the text itself.
function parseTimeRangeFormat(text: string, format: string, boundary: Dayjs): Dayjs | null {
  if (!isTimeOnlyFormat(format)) {
    return dayjs(text, format, true);
  }

  const date = boundary.locale('en').format(calendarFormat);
  const input = `${date} ${text}`;
  const inputFormat = `${calendarFormat} ${format}`;

  // If the consumer has connected UTC, we extract the time fields regardless of the browser zone.
  const parsed = typeof dayjs.utc === 'function'
    ? dayjs.utc(input, inputFormat, true) : dayjs(input, inputFormat, true);
  if (!parsed.isValid()) {
    return null;
  }

  // The transfer preserves the Dayjs border regime. The transition to daylight saving time can
  // shift the clock during installation, so we check the final fields with disassembled input.
  const value = pickerCalendarValue(boundary, parsed);
  return timePickerSameValue(value, parsed) ? value : null;
}

// Introduction only time inherits the date and mode Dayjs edited boundary.
export function parseTimeRangeInput(
  text: string,
  locale: string,
  formats: readonly DatePickerFormat[],
  currentBoundary: Dayjs | null
): Dayjs | null {
  const stringFormats = formats.filter((format): format is string => typeof format === 'string');
  if (!currentBoundary?.isValid()) {
    return parseDayjsInput(locale, text, stringFormats);
  }

  // Uses the original order of formats, setting the date only during the analysis of time.
  const parseFormat = (input: string, format: string) =>
    parseTimeRangeFormat(input, format, currentBoundary);
  return parseDayjsInput(locale, text, stringFormats, parseFormat);
}

// Sets defaultOpenValue of the selected field in profile TimePicker. The solitary value refers to
// the beginning.
export function timeRangeClock<DateType extends object = Dayjs>(
  props: TimeRangePickerProps<'time', DateType>, locale: PickerLocale, index: number
) {
  const { disabledTime: _disabledTime, defaultOpenValue, ...clock } = props;
  const defaults = Array.isArray(defaultOpenValue) ? defaultOpenValue : [defaultOpenValue];
  return timePickerClock({ ...clock, defaultOpenValue: defaults[index] }, locale);
}

/** Checks a couple of time values with the rules of the owner and the adapter. */
export function createTimeRangePickerEngine<DateType extends object>(
  dates: PickerDateOperations<DateType>,
  calendar = createDatePickerEngine(dates),
  timePicker = createTimePickerEngine(dates, calendar)
) {
  const { generateConfig: adapter, fields } = dates;
  const { parsePicker, pickerCalendarValue, pickerTimeDisabled } = calendar;
  const { timePickerSameValue, timePickerDateDisabled } = timePicker;

  // After the transfer, it deflects the time that the adapter has shifted due to the change of displacement.
  function applyParsedTime(boundary: DateType, parsed: DateType): DateType | null {
    const value = pickerCalendarValue(boundary, parsed);
    const sameClock = dates.sameTime(value, parsed)
      && fields.getMillisecond(value) === fields.getMillisecond(parsed);

    return sameClock && dates.samePeriod(value, boundary, 'day') ? value : null;
  }

  // Disassembling the input through the adapter. Only the format of the clock inherits the date of the border.
  function parseAdapterTimeRangeInput(
    text: string,
    locale: string,
    formats: readonly DatePickerFormat<DateType>[],
    boundary: DateType | null
  ): DateType | null {
    if (!boundary || !fields.isValidate(boundary)) {
      return parsePicker(text, locale, formats);
    }

    for (const format of formats) {
      if (typeof format !== 'string') {
        continue;
      }

      const parsed = adapter.locale.parse(locale, text, [format]);
      if (!parsed) {
        continue;
      }
      if (!isTimeOnlyFormat(format)) {
        return parsed;
      }

      const value = applyParsedTime(boundary, parsed);
      if (value) {
        return value;
      }
    }

    return null;
  }

  // Compares the corresponding dates on the calendar fields of time with an accuracy of milliseconds.
  function sameTimeRange(a: RangePickerValue<DateType>, b: RangePickerValue<DateType>) {
    return timePickerSameValue(a[0], b[0]) && timePickerSameValue(a[1], b[1]);
  }

  // Checks the date, general restrictions and then disabledTime with the correct endpoint and from
  // where the range is started.
  function timeRangeInvalid(
    date: DateType,
    props: TimeRangePickerProps<'time', DateType>,
    clock: DatePickerTimeConfig<DateType>,
    index: number,
    info?: { from?: DateType | null; }
  ) {
    return !fields.isValidate(date) || timePickerDateDisabled(date, {
      minDate: props.minDate,
      maxDate: props.maxDate,
      // Passes time as the type and the validation context to the custom disabledDate.
      disabledDate: value => !!props.disabledDate?.(value, { type: 'time', ...info })
    }) || pickerTimeDisabled(date, {
      showTime: clock,
      // Converts the field index to start/end for the original callback. Missing setup gives empty
      // restrictions.
      disabledTime: value => props.disabledTime?.(value, index === 1 ? 'end' : 'start', {
        from: info?.from
      }) ?? {}
    });
  }

  // Checks allowed empty fields and range order. Supplies the range start when validating the end.
  function validTimeRange(
    values: RangePickerValue<DateType>,
    empty: readonly boolean[],
    order: boolean,
    disabled: readonly boolean[],
    invalid: (date: DateType, index: number, info?: { from?: DateType | null; }) => boolean
  ) {
    const [start, end] = values;
    return Boolean((start || empty[0]) && (end || empty[1])
      && (!order || !start || !end || dates.sameTime(start, end) || dates.isAfter(end, start))
      && (disabled[0] || !start || !invalid(start, 0))
      && (disabled[1] || !end || !invalid(end, 1, { from: start })));
  }

  return { parseAdapterTimeRangeInput, sameTimeRange, timeRangeInvalid, validTimeRange };
}

export const { sameTimeRange, timeRangeInvalid, validTimeRange } =
  createTimeRangePickerEngine(dayjsPickerDates);
