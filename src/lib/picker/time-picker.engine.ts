// Calculates Picker time formats and columns. Limitations of each next column are obtained by the
// values of the previous units in the order of hours, minutes, seconds. TimePanelBody/useTimeInfo
// from rc-picker 1.12.2; MIT, vendor/LICENSE.rc-picker.
import type { Dayjs } from 'dayjs';
import type { DatePickerFormat, DatePickerProps, DatePickerTimeConfig } from './date-picker.types';
import type { TimePickerProps, TimePickerColumnType } from './time-picker.types';
import { dayjsPickerDates, type PickerDateOperations } from './picker-date-operations.engine';
import { createDatePickerEngine } from './date-picker.engine';
import { normalizePickerFieldFormat } from './picker-mask.engine';
import { fillPickerLocale } from './picker-locale.engine';
import type { PickerLocale } from './picker-locale.types';

export interface TimePickerOption<Value extends number | 'am' | 'pm' = number | 'am' | 'pm'> {
  value: Value;
  label: string;
  disabled: boolean;
}

// Fills implicit display flags, taking into account the obvious true and false in props.
function fillShow(
  config: Pick<DatePickerTimeConfig, 'showHour' | 'showMinute' | 'showSecond' | 'showMillisecond'>
) {
  const explicit = [config.showHour, config.showMinute, config.showSecond, config.showMillisecond]
    .some(value => value !== undefined);
  const hasFalse = [config.showHour, config.showMinute, config.showSecond]
    .some(value => value === false);
  const hasTrue = [config.showHour, config.showMinute, config.showSecond]
    .some(value => value === true);
  const fallback = explicit ? hasFalse || !hasTrue : true;

  return {
    showHour: config.showHour ?? fallback,
    showMinute: config.showMinute ?? fallback,
    showSecond: config.showSecond ?? fallback,
    showMillisecond: config.showMillisecond
  };
}

// Builds the format of time from visible units and mode 12 hours.
export function timeFormat(config: Pick<DatePickerTimeConfig,
  'showHour' | 'showMinute' | 'showSecond' | 'showMillisecond' | 'use12Hours'>) {
  const show = fillShow(config);
  const units = [
    show.showHour && (config.use12Hours ? 'hh' : 'HH'),
    show.showMinute && 'mm',
    show.showSecond && 'ss'
  ].filter(Boolean);

  return units.join(':') + (show.showMillisecond ? '.SSS' : '')
    + (config.use12Hours ? ' A' : '');
}

// The explicit format takes precedence over the locale format and column settings.
export function timePickerFormats<DateType extends object = Dayjs>(
  props: Pick<TimePickerProps<'time', DateType>, 'format' | 'use12Hours' | 'showHour' | 'showMinute'
    | 'showSecond' | 'showMillisecond'>,
  locale: NonNullable<TimePickerProps['locale']>['lang'] = {}
): DatePickerFormat<DateType>[] {
  if (props.format) {
    return normalizePickerFieldFormat<DateType>(props.format, 'HH:mm:ss').formats;
  }

  return [locale.fieldTimeFormat || timeFormat(props)];
}

// Adds the missing formats to locale for a temporary editor.
export function timePickerLang<DateType extends object = Dayjs>(
  props: Pick<TimePickerProps<'time', DateType>,
    'showHour' | 'showMinute' | 'showSecond' | 'showMillisecond' | 'use12Hours' | 'format'>,
  locale: PickerLocale
) {
  return fillPickerLocale(locale, timeFormat(props));
}

// Infers visible columns from the format unless explicit show flags specify them.
export function timePickerClock<DateType extends object = Dayjs>(
  props: Pick<TimePickerProps<'time', DateType>, Exclude<keyof DatePickerTimeConfig, 'disabledTime'>>,
  locale: NonNullable<TimePickerProps['locale']>['lang'] = {}
): DatePickerTimeConfig<DateType> {
  const formats = timePickerFormats(props, locale);
  const format = formats[0];
  const baseline = typeof format === 'string'
    ? format : locale.fieldTimeFormat || timeFormat(props);
  const explicit = [props.showHour, props.showMinute, props.showSecond, props.showMillisecond]
    .some(value => value !== undefined);
  const config = {
    ...props,
    format: typeof format === 'string' ? format : undefined,
    showHour: props.showHour ?? (!explicit && /[Hhk]|LT|LLL/.test(baseline)),
    showMinute: props.showMinute ?? (!explicit && /m|LT|LLL/.test(baseline)),
    showSecond: props.showSecond ?? (!explicit && /s|LTS/.test(baseline)),
    showMillisecond: props.showMillisecond ?? (!explicit && baseline.includes('SSS')),
    use12Hours: props.use12Hours ?? /[aA]|LT|LLL|LTS/.test(baseline)
  };

  // With explicit show flags rc-picker fills unchartered units with common fallback.
  const show = fillShow(explicit ? props : config);

  if (!explicit && !show.showHour && !show.showMinute
    && !show.showSecond && !show.showMillisecond) {
    show.showHour = true;
    show.showMinute = true;
    show.showSecond = true;
  }

  return { ...config, ...show };
}

// Reads time settings DatePicker separately from the date and literals in the format.
export function datePickerClock<DateType extends object = Dayjs>(
  props: Pick<DatePickerProps<DateType>, 'format' | 'showTime'>,
  locale: NonNullable<DatePickerProps['locale']>['lang'] = {}
): DatePickerTimeConfig<DateType> {
  const config = typeof props.showTime === 'object' ? props.showTime : {};
  const first = config.format
    || normalizePickerFieldFormat<DateType>(props.format, '').formats[0];
  const format = typeof first === 'string' && first
    ? first : locale.fieldDateTimeFormat || `YYYY-MM-DD ${timeFormat(config)}`;
  // The letters in [literal] do not include units; the original error is recorded in the registry.
  const baseline = format.replace(/\[[^\]]*\]/g, '');
  const filled = timePickerClock({ ...config, format: baseline });

  return { ...filled, format: config.format || timeFormat(filled) };
}

// Builds available units with a given pitch. At hideDisabled removes blocked.
export function timePickerOptions(
  count: number,
  step = 1,
  disabled: readonly number[] = [],
  hideDisabled = false,
  pad = 2
): TimePickerOption<number>[] {
  const increment = step >= 1 ? step | 0 : 1;

  // Overflow of the bit step in upstream loops for; do not run the endless cycle.
  if (increment <= 0) {
    throw new RangeError('TimePicker step overflows a positive 32-bit integer');
  }

  const options: TimePickerOption<number>[] = [];

  for (let value = 0; value < count; value += increment) {
    const unavailable = disabled.includes(value);

    if (!hideDisabled || !unavailable)
      options.push({ value, label: String(value).padStart(pad, '0'), disabled: unavailable });
  }

  return options;
}

// Reserves the current value, including 0. Prior to the selection takes the first available line.
function selectedTimeUnit(options: TimePickerOption<number>[], current: number | undefined) {
  if (current != null) {
    return current;
  }

  const firstEnabled = options.find(option => !option.disabled);
  return firstEnabled?.value;
}

/** Prepares a list of units and actions with a date for a single adapter. */
export function createTimePickerEngine<DateType extends object>(
  dates: PickerDateOperations<DateType>,
  calendar = createDatePickerEngine(dates)
) {
  const { generateConfig: adapter, fields } = dates;
  const { pickerCalendarValue, validPickerTime } = calendar;

  // Assembles the status of the columns and the time template to select a new unit.
  function timePickerPanel(
    value: DateType | null,
    pickerValue: DateType | null | undefined,
    config: DatePickerTimeConfig<DateType>,
    disabledTime: TimePickerProps<'time', DateType>['disabledTime'],
    locale: NonNullable<TimePickerProps['locale']>['lang'],
    now: DateType
  ) {
    const dynamic = disabledTime?.(value || now) || {};
    const source = value ?? pickerValue;
    const reference = source ?? now;
    const disabledHours = dynamic.disabledHours;
    const disabledMinutes = dynamic.disabledMinutes;
    const disabledSeconds = dynamic.disabledSeconds;
    const hours = timePickerOptions(
      24, config.hourStep, disabledHours?.(), config.hideDisabledOptions
    ).map(option => ({
        ...option,
        label: config.use12Hours
          ? String(Number(option.value) % 12 || 12).padStart(2, '0') : option.label
      }));
    const hour = selectedTimeUnit(hours, (value ? fields.getHour(value) : undefined));
    // In the case of an empty column of restrictions, an appropriate unit of reference time is obtained.
    const hourForRestrictions = hour ?? fields.getHour(reference);
    const minutes = timePickerOptions(
      60,
      config.minuteStep,
      disabledMinutes?.(hourForRestrictions),
      config.hideDisabledOptions
    );
    const minute = selectedTimeUnit(minutes, (value ? fields.getMinute(value) : undefined));
    const minuteForRestrictions = minute ?? fields.getMinute(reference);
    const seconds = timePickerOptions(
      60,
      config.secondStep,
      disabledSeconds?.(hourForRestrictions, minuteForRestrictions),
      config.hideDisabledOptions
    );
    const second = selectedTimeUnit(seconds, (value ? fields.getSecond(value) : undefined));
    const secondForRestrictions = second ?? fields.getSecond(reference);
    const milliseconds = timePickerOptions(
      1000,
      config.millisecondStep ?? 100,
      dynamic.disabledMilliseconds?.(hourForRestrictions, minuteForRestrictions, secondForRestrictions),
      config.hideDisabledOptions,
      3
    );
    const millisecond = selectedTimeUnit(milliseconds, (value ? fields.getMillisecond(value) : undefined));
    const am = value ? fields.getHour(value) < 12 : true;
    const meridiem: TimePickerOption<'am' | 'pm'>[] = config.use12Hours ? [
      { value: 'am', label: locale.cellMeridiemFormat
        ? adapter.locale.format(locale.locale ?? 'en_US', fields.setHour(now, 9), locale.cellMeridiemFormat) : 'AM',
      disabled: hours.every(option => option.disabled || Number(option.value) >= 12) },
      { value: 'pm', label: locale.cellMeridiemFormat
        ? adapter.locale.format(locale.locale ?? 'en_US', fields.setHour(now, 15), locale.cellMeridiemFormat)
        : 'PM',
      disabled: hours.every(option => option.disabled || Number(option.value) < 12) }
    ] : [];
    let template = reference;

    if (source) {
      template = pickerCalendarValue(template, source);
    }
    else if (hour !== undefined) {
      // Empty column preserves the Template time unit.
      template = fields.setHour(template, hour);
      if (minute !== undefined) {
        template = fields.setMinute(template, minute);
      }
      if (second !== undefined) {
        template = fields.setSecond(template, second);
      }
      if (millisecond !== undefined) {
        template = fields.setMillisecond(template, millisecond);
      }
    }

    return {
      template,
      // Aligns the new value with the same set of dynamic limitations that uses this panel shot.
      align: (candidate: DateType) => validPickerTime(candidate, config, () => dynamic),
      columns: [
        { type: 'hour' as const, shown: config.showHour, options: config.use12Hours
          ? hours.filter(option => (Number(option.value) < 12) === am) : hours },
        { type: 'minute' as const, shown: config.showMinute, options: minutes },
        { type: 'second' as const, shown: config.showSecond, options: seconds },
        { type: 'millisecond' as const, shown: config.showMillisecond, options: milliseconds },
        { type: 'meridiem' as const, shown: config.use12Hours, options: meridiem }
      ].filter(column => column.shown)
    };
  }

  // Converts the selected time into a column key. For meridiem it is always am or pm.
  function timePickerColumnValue(value: DateType | null | undefined, type: TimePickerColumnType) {
    if (!value) {
      return null;
    }
    return type === 'meridiem' ? fields.getHour(value) < 12 ? 'am' : 'pm' : dates.getTimeUnit(value, type);
  }

  // Replaces one unit of the template. The meridiem change preserves an hour inside the afternoon.
  function timePickerColumnDate(
    template: DateType,
    value: DateType | null,
    type: TimePickerColumnType,
    next: number | 'am' | 'pm'
  ): DateType {
    if (type !== 'meridiem') {
      return dates.setTimeUnit(template, type, Number(next));
    }

    // As getMeridiemTime: null hour participates in JS-comparison as 0.
    const hour = value ? fields.getHour(value) : 0;

    if (next === 'am' && hour >= 12) {
      return fields.setHour(template, hour - 12);
    }
    if (next === 'pm' && hour < 12) {
      return fields.setHour(template, hour + 12);
    }
    return template;
  }

  // Verifies disabledTime and steps regardless of the format displayed.
  function timePickerValidTime(value: DateType, props: TimePickerProps<'time', DateType>) {
    return validPickerTime(value, { ...props, format: undefined }, props.disabledTime);
  }

  /** Compares all fields, including milliseconds, to isSameTimestamp rc-picker. */
  function timePickerSameValue(a: DateType | null, b: DateType | null) {
    return dates.sameWallValue(a, b);
  }

  // Applies disabledDate and then date boundaries, allowing the match of time within a second.
  function timePickerDateDisabled(
    value: DateType,
    props: Pick<TimePickerProps<'time', DateType>, 'disabledDate' | 'minDate' | 'maxDate'>
  ) {
    return !!props.disabledDate?.(value, { type: 'time' })
      || !!(props.minDate && dates.isAfter(props.minDate, value) && !dates.sameTime(value, props.minDate))
      || !!(props.maxDate && dates.isAfter(value, props.maxDate) && !dates.sameTime(value, props.maxDate));
  }

  return {
    timePickerPanel, timePickerColumnValue, timePickerColumnDate, timePickerValidTime,
    timePickerSameValue, timePickerDateDisabled
  };
}

export const {
  timePickerPanel, timePickerColumnValue, timePickerColumnDate, timePickerValidTime,
  timePickerSameValue, timePickerDateDisabled
} = createTimePickerEngine(dayjsPickerDates);
