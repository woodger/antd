// Разрешает ввод, настройки и проверки времени для двух концов диапазона. Контекст from
// передаётся для зависимых ограничений конца.
// Range time paths rc-picker 1.12.2; MIT, vendor/LICENSE.rc-picker.
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

// Распознаёт форматы часов, пропуская литералы в квадратных скобках.
function isTimeOnlyFormat(format: string): boolean {
  const remainingFormat = format.replace(/\[[^\]]*\]|LTS?|[HhmsSAa]/g, '');
  return !/[A-Za-z]/.test(remainingFormat);
}

// Проверяет время на дате границы. Форматы с явной датой, смещением или timestamp
// разбираются напрямую, поскольку значения этих полей задаёт сам текст.
function parseTimeRangeFormat(text: string, format: string, boundary: Dayjs): Dayjs | null {
  if (!isTimeOnlyFormat(format)) {
    return dayjs(text, format, true);
  }

  const date = boundary.locale('en').format(calendarFormat);
  const input = `${date} ${text}`;
  const inputFormat = `${calendarFormat} ${format}`;

  // Если потребитель подключил UTC, извлекаем поля времени независимо от зоны браузера.
  const parsed = typeof dayjs.utc === 'function'
    ? dayjs.utc(input, inputFormat, true) : dayjs(input, inputFormat, true);
  if (!parsed.isValid()) {
    return null;
  }

  // Перенос сохраняет режим Dayjs границы. Переход на летнее время может сдвинуть
  // часы при установке, поэтому сверяем итоговые поля с разобранным вводом.
  const value = pickerCalendarValue(boundary, parsed);
  return timePickerSameValue(value, parsed) ? value : null;
}

// Ввод только времени наследует дату и режим Dayjs редактируемой границы.
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

  // Использует исходный порядок форматов, подставляя дату только при разборе времени.
  const parseFormat = (input: string, format: string) =>
    parseTimeRangeFormat(input, format, currentBoundary);
  return parseDayjsInput(locale, text, stringFormats, parseFormat);
}

// Подставляет defaultOpenValue выбранного поля в профиль TimePicker. Одиночное значение относится
// к началу.
export function timeRangeClock<DateType extends object = Dayjs>(
  props: TimeRangePickerProps<'time', DateType>, locale: PickerLocale, index: number
) {
  const { disabledTime: _disabledTime, defaultOpenValue, ...clock } = props;
  const defaults = Array.isArray(defaultOpenValue) ? defaultOpenValue : [defaultOpenValue];
  return timePickerClock({ ...clock, defaultOpenValue: defaults[index] }, locale);
}

/** Сверяет пару временных значений с правилами владельца и адаптера. */
export function createTimeRangePickerEngine<DateType extends object>(
  dates: PickerDateOperations<DateType>,
  calendar = createDatePickerEngine(dates),
  timePicker = createTimePickerEngine(dates, calendar)
) {
  const { generateConfig: adapter, fields } = dates;
  const { parsePicker, pickerCalendarValue, pickerTimeDisabled } = calendar;
  const { timePickerSameValue, timePickerDateDisabled } = timePicker;

  // После переноса отклоняет время, которое адаптер сдвинул из-за смены смещения.
  function applyParsedTime(boundary: DateType, parsed: DateType): DateType | null {
    const value = pickerCalendarValue(boundary, parsed);
    const sameClock = dates.sameTime(value, parsed)
      && fields.getMillisecond(value) === fields.getMillisecond(parsed);

    return sameClock && dates.samePeriod(value, boundary, 'day') ? value : null;
  }

  // Разбирает ввод через адаптер. Только формат часов наследует дату границы.
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

  // Сравнивает соответствующие даты по календарным полям времени с точностью до миллисекунд.
  function sameTimeRange(a: RangePickerValue<DateType>, b: RangePickerValue<DateType>) {
    return timePickerSameValue(a[0], b[0]) && timePickerSameValue(a[1], b[1]);
  }

  // Проверяет дату, общие ограничения и затем disabledTime с правильным endpoint и откуда начат
  // диапазон.
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
      // Передаёт пользовательскому disabledDate тип time и контекст проверки.
      disabledDate: value => !!props.disabledDate?.(value, { type: 'time', ...info })
    }) || pickerTimeDisabled(date, {
      showTime: clock,
      // Преобразует индекс поля в start/end для исходного callback. Отсутствующая настройка даёт
      // пустые ограничения.
      disabledTime: value => props.disabledTime?.(value, index === 1 ? 'end' : 'start', {
        from: info?.from
      }) ?? {}
    });
  }

  // Проверяет разрешённые пустые поля и порядок. Для проверки доступного конца передаёт начало
  // диапазона.
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
