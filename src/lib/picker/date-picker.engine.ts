// Prepares DatePicker formats, calendar periods, and time selection rules. Follows the date
// adapter's locale and preserves the order of disabledDate and disabledTime calls.
import type { Dayjs } from 'dayjs';
import { dayjsPickerDates, type PickerDateOperations } from './picker-date-operations.engine';
import { normalizePickerFieldFormat } from './picker-mask.engine';
import type {
  DatePickerFormat,
  DatePickerCalendarMode,
  DatePickerMode,
  DatePickerPicker,
  DatePickerProps,
  DatePickerTimeConfig,
  DatePickerDisabledTime
} from './date-picker.types';

const yearAndMonth = ['decade', 'year', 'month'] as const;
const panelDescent: Record<DatePickerPicker | 'time', readonly DatePickerMode[]> = {
  date: [...yearAndMonth, 'date'],
  week: [...yearAndMonth, 'week'],
  month: yearAndMonth,
  quarter: ['decade', 'year', 'quarter'],
  year: yearAndMonth,
  time: yearAndMonth
};

/** The next level depends on picker even when the owner controls the visible panel. */
export function nextPickerPanelMode(
  picker: DatePickerPicker | 'time',
  mode: DatePickerMode
): DatePickerMode | undefined {
  if (mode === picker) {
    return undefined;
  }
  const levels = panelDescent[picker];
  const index = levels.indexOf(mode);

  return levels[index + 1];
}

// Chooses the format from explicit settings, then the locale and picker type. Dates with time also
// account for visible columns.
export function pickerFormats<DateType extends object = Dayjs>(
  props: Pick<DatePickerProps<DateType>, 'format' | 'showTime' | 'picker'>,
  locale: NonNullable<DatePickerProps['locale']>['lang'] = {}
): DatePickerFormat<DateType>[] {
  if (props.format) {
    return normalizePickerFieldFormat<DateType>(props.format, 'YYYY-MM-DD').formats;
  }
  if (props.picker === 'week') {
    return [locale.fieldWeekFormat || 'gggg-wo'];
  }
  if (props.picker === 'quarter') {
    return [locale.fieldQuarterFormat ?? 'YYYY-[Q]Q'];
  }
  if (props.picker === 'month') {
    return [locale.fieldMonthFormat ?? 'YYYY-MM'];
  }
  if (props.picker === 'year') {
    return [locale.fieldYearFormat ?? 'YYYY'];
  }
  if (!props.showTime) {
    return [locale.fieldDateFormat ?? 'YYYY-MM-DD'];
  }
  const config = typeof props.showTime === 'object' ? props.showTime : {};
  const columns = timeColumns(config, 'HH:mm:ss');
  const units = columns.filter(column => column.unit !== 'millisecond').map(
    column => column.unit === 'hour'
      ? config.use12Hours ? 'hh' : 'HH'
      : column.unit === 'minute' ? 'mm' : 'ss'
  );
  const time = units.join(':') + (columns.some(column => column.unit === 'millisecond')
    ? '.SSS'
    : '') + (config.use12Hours
      ? ' A'
      : '');
  return [locale.fieldDateTimeFormat ?? `YYYY-MM-DD ${time}`];
}

// Resolves explicit column flags before analyzing the format with escaped literals excluded.
// Normalizes steps for visible columns.
export function timeColumns(
  config: Omit<DatePickerTimeConfig, 'defaultOpenValue' | 'disabledTime'>, format: string
) {
  const explicit = [
    config.showHour,
    config.showMinute,
    config.showSecond,
    config.showMillisecond
  ]
    .some(
      value => value !== undefined
    );
  const clean = format.replace(/\[[^\]]*\]/g, '');
  const existFalse = [config.showHour, config.showMinute, config.showSecond].some(
    value => value === false
  );
  const existTrue = [config.showHour, config.showMinute, config.showSecond].some(
    value => value === true
  );
  const fallback = existFalse || !existTrue;
  const columns = [
    {
      unit: 'hour' as const,
      shown: config.showHour ?? (explicit ? fallback : /[Hh]/.test(clean)),
      count: 24,
      step: config.hourStep
    },
    {
      unit: 'minute' as const,
      shown: config.showMinute ?? (explicit ? fallback : /m/.test(clean)),
      count: 60,
      step: config.minuteStep
    },
    {
      unit: 'second' as const,
      shown: config.showSecond ?? (explicit ? fallback : /s/.test(clean)),
      count: 60,
      step: config.secondStep
    },
    {
      unit: 'millisecond' as const,
      shown: config.showMillisecond ?? (!explicit && /S/.test(clean)),
      count: 1000,
      step: config.millisecondStep
    }
  ];
  const visibleColumns = columns.filter(column => column.shown);

  return visibleColumns.map(column => {
    const { step, unit } = column;
    const validStep = step !== undefined && Number.isInteger(step) && step > 0;
    const defaultStep = unit === 'millisecond' ? 100 : 1;

    return { ...column, step: validStep ? step : defaultStep };
  });
}

/** Applies selection rules to values from a single date adapter. */
export function createDatePickerEngine<DateType extends object>(
  dates: PickerDateOperations<DateType>
) {
  const { generateConfig: adapter, fields } = dates;

  // Formats a valid date with the first configured format, including a custom function.
  function formatPicker(
    value: DateType | null | undefined,
    locale: string,
    formats: readonly DatePickerFormat<DateType>[]
  ): string {
    if (!value || !fields.isValidate(value)) {
      return '';
    }
    return typeof formats[0] === 'function'
      ? formats[0](value)
      : adapter.locale.format(locale, value, formats[0] ?? 'YYYY-MM-DD');
  }
  // Passes only string formats to the parser. A custom formatter supplies no inverse conversion.
  function parsePicker(
    text: string,
    locale: string,
    formats: readonly DatePickerFormat<DateType>[]
  ): DateType | null {
    return adapter.locale.parse(
      locale,
      text,
      formats.filter((format): format is string => typeof format === 'string')
    );
  }
  // Copies the time onto the panel date, matching fillTime in rc-picker.
  function pickerCalendarValue(value: DateType, template?: DateType): DateType {
    const hours = fields.setHour(value, template ? fields.getHour(template) : 0);
    const minutes = fields.setMinute(hours, template ? fields.getMinute(template) : 0);
    const seconds = fields.setSecond(minutes, template ? fields.getSecond(template) : 0);

    return fields.setMillisecond(seconds, template ? fields.getMillisecond(template) : 0);
  }
  // Copies the calendar date while retaining the original value's time and mode.
  function pickerDateWithCalendar(value: DateType, date: DateType): DateType {
    const withYear = fields.setYear(value, fields.getYear(date));
    const withMonth = fields.setMonth(withYear, fields.getMonth(date));

    return fields.setDate(withMonth, fields.getDate(date));
  }

  // Compares the year and calendar quarter number.
  function samePickerQuarter(a: DateType, b: DateType): boolean {
    return fields.getYear(a) === fields.getYear(b)
      && Math.floor(fields.getMonth(a) / 3) === Math.floor(fields.getMonth(b) / 3);
  }
  // Compares the dates of week starts in the field's locale to day precision.
  function samePickerWeek(a: DateType, b: DateType, locale: string): boolean {
    const firstWeekStart = adapter.locale.getWeekFirstDate(locale, a);
    const secondWeekStart = adapter.locale.getWeekFirstDate(locale, b);

    return fields.getYear(firstWeekStart) === fields.getYear(secondWeekStart)
      && fields.getMonth(firstWeekStart) === fields.getMonth(secondWeekStart)
      && fields.getDate(firstWeekStart) === fields.getDate(secondWeekStart);
  }
  // Compares the calendar period. datetime also compares all time fields.
  function samePickerPanelValue(
    a: DateType,
    b: DateType,
    datetime: boolean,
    picker: DatePickerPicker = 'date',
    locale = 'en_US'
  ): boolean {
    if (picker === 'week') {
      return samePickerWeek(a, b, locale);
    }
    if (picker === 'quarter') {
      return samePickerQuarter(a, b);
    }
    if (picker === 'year') {
      return fields.getYear(a) === fields.getYear(b);
    }
    if (picker === 'month') {
      return fields.getYear(a) === fields.getYear(b) && fields.getMonth(a) === fields.getMonth(b);
    }
    return fields.getYear(a) === fields.getYear(b) && fields.getMonth(a) === fields.getMonth(b)
      && fields.getDate(a) === fields.getDate(b)
      && (!datetime || dates.sameTime(a, b)
        && fields.getMillisecond(a) === fields.getMillisecond(b));
  }
  // Shifts the panel by a month, year, or decade according to the current picker level.
  function offsetPickerPanel(value: DateType, picker: DatePickerPicker, amount: number): DateType {
    return picker === 'date' || picker === 'week' ? fields.addMonth(value, amount)
      : fields.addYear(value, amount * (picker === 'year' ? 10 : 1));
  }
  // Compares the visible panel period, including the decade for a year picker.
  function samePickerPanel(a: DateType, b: DateType, picker: DatePickerPicker): boolean {
    return picker === 'year' ? Math.floor(fields.getYear(a) / 10) === Math.floor(fields.getYear(b) / 10)
      : dates.samePeriod(a, b, picker === 'date' || picker === 'week' ? 'month' : 'year');
  }
  // Builds calendar cells for the picker level. Day cells include adjacent months, and the outer
  // year and decade cells extend beyond the period.
  function calendarCells(panel: DateType, mode: DatePickerCalendarMode, locale: string): DateType[] {
    if (mode === 'date' || mode === 'week') {
      const first = fields.setDate(panel, 1);
      const offset = (adapter.getWeekDay(first) - adapter.locale.getWeekFirstDay(locale) + 7) % 7;
      return Array.from({ length: 42 }, (_, index) => adapter.addDate(first, index - offset));
    }
    if (mode === 'quarter') {
      const first = fields.setMonth(panel, 0);
      return Array.from({ length: 4 }, (_, index) => fields.addMonth(first, index * 3));
    }
    if (mode === 'month') {
      const firstMonth = fields.setMonth(panel, 0);
      return Array.from({ length: 12 }, (_, index) => fields.addMonth(firstMonth, index));
    }
    const unit = mode === 'year' ? 1 : 10;
    const base = Math.floor(fields.getYear(panel) / (unit * 10)) * unit * 10;
    const first = fields.addYear(fields.setYear(panel, base), -unit);
    return Array.from({ length: 12 }, (_, index) => fields.addYear(first, index * unit));
  }
  // Checks period bounds and disabledDate. Week and quarter preserve their own callback order.
  function pickerDateDisabled(
    value: DateType,
    props: Pick<DatePickerProps<DateType>, 'minDate' | 'maxDate' | 'disabledDate'>,
    mode: DatePickerCalendarMode = 'date',
    locale = 'en_US'
  ): boolean {
    if (mode === 'week') {
      return Boolean(
        props.disabledDate?.(value, { type: mode })
        || props.minDate && dates.isAfter(props.minDate, value) && !samePickerWeek(
          props.minDate,
          value,
          locale
        )
        || props.maxDate && dates.isAfter(value, props.maxDate) && !samePickerWeek(
          props.maxDate,
          value,
          locale
        )
      );
    }
    if (mode === 'quarter') {
      return Boolean(
        props.disabledDate?.(value, { type: mode })
        || props.minDate && dates.isAfter(props.minDate, value) && !samePickerQuarter(props.minDate, value)
        || props.maxDate && dates.isAfter(value, props.maxDate) && !samePickerQuarter(props.maxDate, value)
      );
    }
    const unit = mode === 'date' ? 'day' : mode === 'month' ? 'month' : 'year';
    const period = mode === 'decade'
      ? fields.setYear(value, Math.floor(fields.getYear(value) / 10) * 10) : value;
    const first = dates.startOf(period, unit);
    const last = mode === 'decade'
      ? dates.add(fields.addYear(first, 10), -1, 'millisecond')
      : dates.endOf(period, unit);
    return Boolean(
      props.minDate
      && dates.isBefore(last, dates.startOf(props.minDate, 'day'))
      || props.maxDate
      && dates.isAfter(first, dates.endOf(props.maxDate, 'day'))
      || props.disabledDate?.(
        value,
        { type: mode }
      )
    );
  }
  // Checks both ends of larger periods, stopping at the first allowed boundary.
  function pickerPanelDateDisabled(
    value: DateType,
    props: Pick<DatePickerProps<DateType>, 'minDate' | 'maxDate' | 'disabledDate'>,
    mode: DatePickerCalendarMode,
    locale = 'en_US'
  ): boolean {
    if (mode === 'date' || mode === 'quarter' || mode === 'week') {
      return pickerDateDisabled(
        value,
        props,
        mode,
        locale
      );
    }
    const year = fields.getYear(value);
    const periodStart = mode === 'month' ? value : fields.setMonth(value, 0);
    let start = fields.setDate(periodStart, 1);
    if (mode !== 'month') {
      start = fields.setYear(start, mode === 'decade' ? Math.floor(year / 10) * 10 : year);
    }

    const nextPeriod = mode === 'month' ? fields.addMonth(start, 1)
      : fields.addYear(start, mode === 'decade' ? 10 : 1);
    const end = fields.addDate(nextPeriod, -1);
    return pickerDateDisabled(start, props, mode) && pickerDateDisabled(end, props, mode);
  }
  // Checks time units from hours through milliseconds. Dependent callbacks are skipped after the
  // first blocked unit.
  function pickerTimeDisabled(
    value: DateType,
    props: Pick<DatePickerProps<DateType>, 'showTime' | 'disabledTime'>
  ): boolean {
    if (!props.showTime) {
      return false;
    }
    const field: {
      disabledTime?: (
        date: DateType,
        range: 'start',
        info: { from: undefined; }
      ) => DatePickerDisabledTime;
    } = props;
    const config = field.disabledTime?.(value, 'start', { from: undefined }) ?? {};

    if (config.disabledHours?.().includes(fields.getHour(value))) {
      return true;
    }
    if (config.disabledMinutes?.(fields.getHour(value)).includes(fields.getMinute(value))) {
      return true;
    }
    if (config.disabledSeconds?.(fields.getHour(value), fields.getMinute(value)).includes(fields.getSecond(value))) {
      return true;
    }

    const disabledMillisecond = config.disabledMilliseconds?.(
      fields.getHour(value),
      fields.getMinute(value),
      fields.getSecond(value)
    ).includes(fields.getMillisecond(value));
    return Boolean(disabledMillisecond);
  }

  // Matches findValidateTime by taking the closest allowed unit to the left or the first allowed
  // unit. Adjusts all four units, including hidden seconds and milliseconds.
  function validPickerTime(
    value: DateType,
    config: DatePickerTimeConfig<DateType> = {},
    disabledTime?: DatePickerProps<DateType>['disabledTime']
  ): DateType {
    const dynamic = disabledTime?.(value) ?? {};
    let next = value;
    for (const column of [
      {
        unit: 'hour' as const,
        count: 24,
        step: config.hourStep ?? 1,
        // Reads disabled hours before updating the dependent time units.
        disabled: () => dynamic.disabledHours?.() ?? []
      },
      {
        unit: 'minute' as const,
        count: 60,
        step: config.minuteStep ?? 1,
        // Reads disabled minutes for the selected hour.
        disabled: () => dynamic.disabledMinutes?.(fields.getHour(next)) ?? []
      },
      {
        unit: 'second' as const,
        count: 60,
        step: config.secondStep ?? 1,
        // Reads disabled seconds for the adjusted hour and minute.
        disabled: () => dynamic.disabledSeconds?.(
          fields.getHour(next),
          fields.getMinute(next)
        )
          ?? []
      },
      {
        unit: 'millisecond' as const,
        count: 1000,
        step: config.millisecondStep ?? 100,
        // Reads disabled milliseconds for the adjusted larger units.
        disabled: () => dynamic.disabledMilliseconds?.(fields.getHour(next), fields.getMinute(next), fields.getSecond(next))
          ?? []
      }
    ]) {
      const step = column.step >= 1 ? column.step | 0 : 1;
      const forbidden = column.disabled();
      const valueCount = Math.ceil(column.count / step);
      const values = Array.from({ length: valueCount }, (_, index) => index * step);
      const allowedValues = values.filter(unitValue => !forbidden.includes(unitValue));

      const current = dates.getTimeUnit(next, column.unit);
      const selected = allowedValues.findLast(unitValue => unitValue <= current) ?? allowedValues[0];
      if (selected !== undefined && selected !== current) {
        next = dates.setTimeUnit(next, column.unit, selected);
      }
    }
    return next;
  }

  return {
    formatPicker, parsePicker, pickerCalendarValue, pickerDateWithCalendar, samePickerQuarter,
    samePickerWeek, samePickerPanelValue, offsetPickerPanel, samePickerPanel, calendarCells,
    pickerDateDisabled, pickerPanelDateDisabled, pickerTimeDisabled, validPickerTime
  };
}

export const {
  formatPicker, parsePicker, pickerCalendarValue, pickerDateWithCalendar, samePickerQuarter,
  samePickerWeek, samePickerPanelValue, offsetPickerPanel, samePickerPanel, calendarCells,
  pickerDateDisabled, pickerPanelDateDisabled, pickerTimeDisabled, validPickerTime
} = createDatePickerEngine(dayjsPickerDates);
