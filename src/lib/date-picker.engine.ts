import type { Dayjs } from 'dayjs';
import { dayjsGenerateConfig as date } from './date-picker-dayjs.engine';
import { normalizePickerFieldFormat } from './picker-mask.engine';
import type {
  DatePickerFormat,
  DatePickerMode,
  DatePickerPicker,
  DatePickerProps,
  DatePickerTimeConfig,
  DatePickerDisabledTime
} from './date-picker.types';

export function pickerFormats(
  props: Pick<DatePickerProps, 'format' | 'showTime' | 'picker'>,
  locale: NonNullable<DatePickerProps['locale']>['lang'] = {}
): DatePickerFormat[] {
  if (props.format) return normalizePickerFieldFormat<Dayjs>(props.format, 'YYYY-MM-DD').formats;
  if (props.picker === 'week') return [locale.fieldWeekFormat || 'gggg-wo'];
  if (props.picker === 'quarter') return [locale.fieldQuarterFormat ?? 'YYYY-[Q]Q'];
  if (props.picker === 'month') return [locale.fieldMonthFormat ?? 'YYYY-MM'];
  if (props.picker === 'year') return [locale.fieldYearFormat ?? 'YYYY'];
  if (!props.showTime) return [locale.fieldDateFormat ?? 'YYYY-MM-DD'];
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
export function formatPicker(
  value: Dayjs | null | undefined,
  locale: string,
  formats: readonly DatePickerFormat[]
): string {
  if (!value || !value.isValid()) return '';
  return typeof formats[0] === 'function'
    ? formats[0](value)
    : date.locale.format(locale, value, formats[0] ?? 'YYYY-MM-DD');
}
export function parsePicker(text: string, locale: string, formats: readonly DatePickerFormat[]):
  Dayjs
  | null {
  return date.locale.parse(
    locale,
    text,
    formats.filter((format): format is string => typeof format === 'string')
  );
}
// useRangePickerValue/fillTime rc-picker: UI time belongs to the viewed calendar date.
export function pickerCalendarValue(value: Dayjs, template?: Dayjs): Dayjs {
  return value.hour(template?.hour() ?? 0).minute(template?.minute() ?? 0)
    .second(template?.second() ?? 0).millisecond(template?.millisecond() ?? 0);
}
export function samePickerQuarter(a: Dayjs, b: Dayjs): boolean {
  return a.year() === b.year() && Math.floor(a.month() / 3) === Math.floor(b.month() / 3);
}
export function samePickerWeek(a: Dayjs, b: Dayjs, locale: string): boolean {
  return date.locale.getWeekFirstDate(locale, a).year() === date.locale.getWeekFirstDate(locale, b).year()
    && date.locale.getWeek(locale, a) === date.locale.getWeek(locale, b);
}
// rc-picker compares date panels by Y/M/D and datetime panels by all wall fields.
export function samePickerPanelValue(
  a: Dayjs, b: Dayjs, datetime: boolean, picker: DatePickerPicker = 'date', locale = 'en_US'
): boolean {
  if (picker === 'week') return samePickerWeek(a, b, locale);
  if (picker === 'quarter') return samePickerQuarter(a, b);
  if (picker === 'year') return a.year() === b.year();
  if (picker === 'month') return a.year() === b.year() && a.month() === b.month();
  return a.year() === b.year() && a.month() === b.month() && a.date() === b.date()
    && (!datetime || a.hour() === b.hour() && a.minute() === b.minute()
      && a.second() === b.second() && a.millisecond() === b.millisecond());
}
export function offsetPickerPanel(value: Dayjs, picker: DatePickerPicker, amount: number): Dayjs {
  return picker === 'date' || picker === 'week' ? value.add(amount, 'month')
    : value.add(amount * (picker === 'year' ? 10 : 1), 'year');
}
export function samePickerPanel(a: Dayjs, b: Dayjs, picker: DatePickerPicker): boolean {
  return picker === 'year' ? Math.floor(a.year() / 10) === Math.floor(b.year() / 10)
    : a.isSame(b, picker === 'date' || picker === 'week' ? 'month' : 'year');
}
export function calendarCells(panel: Dayjs, mode: DatePickerMode, locale: string): Dayjs[] {
  if (mode === 'date' || mode === 'week') {
    const first = panel.date(1);
    const offset = (date.getWeekDay(first) - date.locale.getWeekFirstDay(locale) + 7) % 7;
    return Array.from({ length: 42 }, (_, index) => date.addDate(first, index - offset));
  }
  if (mode === 'quarter') {
    const first = panel.month(0);
    return Array.from({ length: 4 }, (_, index) => first.add(index * 3, 'month'));
  }
  if (mode === 'month') return Array.from({ length: 12 }, (_, index) => panel.month(index));
  const unit = mode === 'year' ? 1 : 10;
  const base = Math.floor(panel.year() / (unit * 10)) * unit * 10;
  const first = panel.year(base).add(-unit, 'year');
  return Array.from({ length: 12 }, (_, index) => first.add(index * unit, 'year'));
}
export function pickerDateDisabled(
  value: Dayjs,
  props: Pick<DatePickerProps, 'minDate' | 'maxDate' | 'disabledDate'>,
  mode: DatePickerMode = 'date',
  locale = 'en_US'
): boolean {
  if (mode === 'week') return Boolean(
    props.disabledDate?.(value, { type: mode })
    || props.minDate && props.minDate.isAfter(value) && !samePickerWeek(
      props.minDate,
      value,
      locale
    )
    || props.maxDate && value.isAfter(props.maxDate) && !samePickerWeek(
      props.maxDate,
      value,
      locale
    )
  );
  if (mode === 'quarter') return Boolean(
    props.disabledDate?.(value, { type: mode })
    || props.minDate && props.minDate.isAfter(value) && !samePickerQuarter(props.minDate, value)
    || props.maxDate && value.isAfter(props.maxDate) && !samePickerQuarter(props.maxDate, value)
  );
  const unit = mode === 'date' ? 'day' : mode === 'month' ? 'month' : 'year';
  const period = mode === 'decade' ? value.year(Math.floor(value.year() / 10) * 10) : value;
  const first = period.startOf(unit);
  const last = mode === 'decade' ? first.add(10, 'year').add(-1, 'millisecond')
    : period.endOf(unit);
  return Boolean(
    props.minDate
    && last.isBefore(props.minDate.startOf('day'))
    || props.maxDate
    && first.isAfter(
      props.maxDate.endOf('day')
    )
    || props.disabledDate?.(
      value,
      { type: mode }
    )
  );
}
export function pickerPanelDateDisabled(
  value: Dayjs,
  props: Pick<DatePickerProps, 'minDate' | 'maxDate' | 'disabledDate'>,
  mode: DatePickerMode,
  locale = 'en_US'
): boolean {
  if (mode === 'date' || mode === 'quarter' || mode === 'week') return pickerDateDisabled(
    value,
    props,
    mode,
    locale
  );
  const start = mode === 'month' ? value.date(1)
    : value.month(0).date(1).year(mode === 'decade'
      ? Math.floor(value.year() / 10) * 10 : value.year());
  const end = mode === 'month' ? start.add(1, 'month').add(-1, 'day')
    : start.add(mode === 'decade' ? 10 : 1, 'year').add(-1, 'day');
  return pickerDateDisabled(start, props, mode) && pickerDateDisabled(end, props, mode);
}
export function pickerTimeDisabled(
  value: Dayjs,
  props: Pick<DatePickerProps, 'showTime' | 'disabledTime'>
): boolean {
  if (!props.showTime) return false;
  const field: {
    disabledTime?: (
      date: Dayjs,
      range: 'start',
      info: { from: undefined; }
    ) => DatePickerDisabledTime;
  } = props;
  const config = field.disabledTime?.(value, 'start', { from: undefined }) ?? {};
  return Boolean(
    config.disabledHours?.().includes(value.hour())
    || config.disabledMinutes?.(value.hour()).includes(
      value.minute()
    )
    || config.disabledSeconds?.(value.hour(), value.minute()).includes(
      value.second()
    )
    || config.disabledMilliseconds?.(value.hour(), value.minute(), value.second()).includes(
      value.millisecond()
    )
  );
}
export function timeColumns(config: DatePickerTimeConfig, format: string) {
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
  return [
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
  ].filter(column => column.shown).map(
    column => ({
      ...column,
      step: Number.isInteger(column.step) && column.step! > 0
        ? column.step!
        : column.unit === 'millisecond' ? 100 : 1
    })
  );
}

// Как findValidateTime: ближайший разрешённый unit слева, иначе первый разрешённый.
// Выравниваются все четыре unit, включая скрытые секунды/миллисекунды.
export function validPickerTime(
  value: Dayjs,
  config: DatePickerTimeConfig = {},
  disabledTime?: DatePickerProps['disabledTime']
): Dayjs {
  const dynamic = disabledTime?.(value) ?? {};
  let next = value;
  for (const column of [
    {
      unit: 'hour' as const,
      count: 24,
      step: config.hourStep ?? 1,
      disabled: () => dynamic.disabledHours?.() ?? []
    },
    {
      unit: 'minute' as const,
      count: 60,
      step: config.minuteStep ?? 1,
      disabled: () => dynamic.disabledMinutes?.(next.hour()) ?? []
    },
    {
      unit: 'second' as const,
      count: 60,
      step: config.secondStep ?? 1,
      disabled: () => dynamic.disabledSeconds?.(
        next.hour(),
        next.minute()
      )
        ?? []
    },
    {
      unit: 'millisecond' as const,
      count: 1000,
      step: config.millisecondStep ?? 100,
      disabled: () => dynamic.disabledMilliseconds?.(next.hour(), next.minute(), next.second())
        ?? []
    }
  ]) {
    const step = column.step >= 1 ? column.step | 0 : 1;
    const forbidden = column.disabled();
    const allowed = Array
      .from({
        length: Math
          .ceil(column
            .count / step)
      }, (_, n) => n * step)
      .filter(
        n => !forbidden.includes(n)
      );
    const current = next.get(column.unit);
    const selected = allowed.findLast(n => n <= current) ?? allowed[0];
    if (selected !== undefined && selected !== current)
      next = next.set(column.unit, selected);
  }
  return next;
}
