// Вычисляет форматы и колонки времени Picker. Ограничения каждой следующей
// колонки получают значения предыдущих единиц в порядке часы, минуты, секунды.
// TimePanelBody/useTimeInfo из rc-picker 1.12.2; MIT, vendor/LICENSE.rc-picker.
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

// Заполняет неявные флаги показа, учитывая явные true и false в props.
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

// Строит формат времени из видимых единиц и режима 12 часов.
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

// Явный format имеет приоритет над форматом locale и настройками колонок.
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

// Добавляет недостающие форматы в locale для временного редактора.
export function timePickerLang<DateType extends object = Dayjs>(
  props: Pick<TimePickerProps<'time', DateType>,
    'showHour' | 'showMinute' | 'showSecond' | 'showMillisecond' | 'use12Hours' | 'format'>,
  locale: PickerLocale
) {
  return fillPickerLocale(locale, timeFormat(props));
}

// Определяет видимость колонок из формата, пока её не задают явные show-флаги.
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

  // При явных show flags rc-picker заполняет незаданные units общим fallback.
  const show = fillShow(explicit ? props : config);

  if (!explicit && !show.showHour && !show.showMinute
    && !show.showSecond && !show.showMillisecond) {
    show.showHour = true;
    show.showMinute = true;
    show.showSecond = true;
  }

  return { ...config, ...show };
}

// Читает настройки времени DatePicker отдельно от даты и литералов в формате.
export function datePickerClock<DateType extends object = Dayjs>(
  props: Pick<DatePickerProps<DateType>, 'format' | 'showTime'>,
  locale: NonNullable<DatePickerProps['locale']>['lang'] = {}
): DatePickerTimeConfig<DateType> {
  const config = typeof props.showTime === 'object' ? props.showTime : {};
  const first = config.format
    || normalizePickerFieldFormat<DateType>(props.format, '').formats[0];
  const format = typeof first === 'string' && first
    ? first : locale.fieldDateTimeFormat || `YYYY-MM-DD ${timeFormat(config)}`;
  // Буквы в [literal] не включают units; исходная ошибка зафиксирована в реестре.
  const baseline = format.replace(/\[[^\]]*\]/g, '');
  const filled = timePickerClock({ ...config, format: baseline });

  return { ...filled, format: config.format || timeFormat(filled) };
}

// Строит доступные единицы с заданным шагом. При hideDisabled убирает заблокированные.
export function timePickerOptions(
  count: number,
  step = 1,
  disabled: readonly number[] = [],
  hideDisabled = false,
  pad = 2
): TimePickerOption<number>[] {
  const increment = step >= 1 ? step | 0 : 1;

  // Переполнение битового шага в upstream зацикливает for; не запускаем бесконечный цикл.
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

// Сохраняет текущее значение, включая 0. До выбора берёт первую доступную строку.
function selectedTimeUnit(options: TimePickerOption<number>[], current: number | undefined) {
  if (current != null) {
    return current;
  }

  const firstEnabled = options.find(option => !option.disabled);
  return firstEnabled?.value;
}

/** Подготавливает список единиц и действия с датой для одного адаптера. */
export function createTimePickerEngine<DateType extends object>(
  dates: PickerDateOperations<DateType>,
  calendar = createDatePickerEngine(dates)
) {
  const { generateConfig: adapter, fields } = dates;
  const { pickerCalendarValue, validPickerTime } = calendar;

  // Собирает состояние колонок и шаблон времени для выбора новой единицы.
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
    // При пустой колонке ограничения получают соответствующую единицу опорного времени.
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
      // Пустая колонка сохраняет единицу времени шаблона.
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
      // Выравнивает новое значение тем же набором динамических ограничений, что использует этот
      // снимок панели.
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

  // Преобразует выбранное время в ключ колонки. Для meridiem он всегда am или pm.
  function timePickerColumnValue(value: DateType | null | undefined, type: TimePickerColumnType) {
    if (!value) {
      return null;
    }
    return type === 'meridiem' ? fields.getHour(value) < 12 ? 'am' : 'pm' : dates.getTimeUnit(value, type);
  }

  // Заменяет одну единицу шаблона. Изменение meridiem сохраняет час внутри половины дня.
  function timePickerColumnDate(
    template: DateType,
    value: DateType | null,
    type: TimePickerColumnType,
    next: number | 'am' | 'pm'
  ): DateType {
    if (type !== 'meridiem') {
      return dates.setTimeUnit(template, type, Number(next));
    }

    // Как getMeridiemTime: null hour участвует в JS-сравнении как 0.
    const hour = value ? fields.getHour(value) : 0;

    if (next === 'am' && hour >= 12) {
      return fields.setHour(template, hour - 12);
    }
    if (next === 'pm' && hour < 12) {
      return fields.setHour(template, hour + 12);
    }
    return template;
  }

  // Проверяет disabledTime и шаги независимо от отображаемого формата.
  function timePickerValidTime(value: DateType, props: TimePickerProps<'time', DateType>) {
    return validPickerTime(value, { ...props, format: undefined }, props.disabledTime);
  }

  /** Сравнивает все поля, включая миллисекунды, по isSameTimestamp rc-picker. */
  function timePickerSameValue(a: DateType | null, b: DateType | null) {
    return dates.sameWallValue(a, b);
  }

  // Применяет disabledDate и затем границы дат, разрешая совпадение времени в пределах секунды.
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
