// Готовит данные пользовательской панели. Черновик и подтверждение остаются у поля.
import type { Dayjs } from 'dayjs';
import { createDatePickerEngine } from './date-picker.engine';
import type { PickerDateOperations } from './picker-date-operations.engine';
import type { DatePickerMode, DatePickerTimeConfig } from './date-picker.types';
import type { DatePickerPanelMode, DatePickerPanelTimeConfig } from './picker-components.types';

/** Для поля даты со временем используется единая панель datetime. */
export function pickerPanelSlot(mode: DatePickerMode, datetime: boolean): DatePickerPanelMode {
  return mode === 'date' && datetime ? 'datetime' : mode;
}

/** Оставляет настройки часов, формат и ограничения, нужные производителю панели. */
export function pickerPanelClock<DateType extends object = Dayjs>(
  clock: DatePickerTimeConfig<DateType>,
  extra: Pick<DatePickerPanelTimeConfig<DateType>,
    'disabledTime' | 'defaultOpenValue' | 'changeOnScroll' | 'showNow'>
): DatePickerPanelTimeConfig<DateType> {
  const { format, showHour, showMinute, showSecond, showMillisecond, use12Hours,
    hourStep, minuteStep, secondStep, millisecondStep, hideDisabledOptions } = clock;
  return { format, showHour, showMinute, showSecond, showMillisecond, use12Hours,
    hourStep, minuteStep, secondStep, millisecondStep, hideDisabledOptions, ...extra };
}

/** Готовит границы и подсветку подменённой панели для текущего адаптера. */
export function createPickerPanelEngine<DateType extends object>(
  dates: PickerDateOperations<DateType>,
  calendar = createDatePickerEngine(dates)
) {
  const { fields } = dates;
  const { samePickerPanelValue } = calendar;

  /** Сравнивает период ограничения либо единицы времени в режиме панели. */
  function samePickerPanelPeriod(a: DateType, b: DateType, mode: DatePickerMode, locale: string) {
    if (mode === 'decade') {
      return Math.floor(fields.getYear(a) / 10) === Math.floor(fields.getYear(b) / 10);
    }
    if (mode === 'time') {
      return dates.sameTime(a, b);
    }
    return samePickerPanelValue(a, b, false, mode, locale);
  }

  /** Обе даты границы могут принадлежать одному разрешённому периоду. */
  function pickerPanelOutsideBounds(
    date: DateType,
    limits: { minDate?: DateType; maxDate?: DateType; },
    mode: DatePickerMode,
    locale: string
  ) {
    const { minDate, maxDate } = limits;
    return Boolean(
      minDate && dates.isAfter(minDate, date) && !samePickerPanelPeriod(minDate, date, mode, locale)
      || maxDate && dates.isAfter(date, maxDate) && !samePickerPanelPeriod(maxDate, date, mode, locale)
    );
  }

  /** В hoverRangeValue передаётся упорядоченная пара даже при одной границе. */
  function pickerPanelHoverRange(start: DateType | null, end: DateType | null) {
    const first = start ?? end;
    const last = end ?? start;
    if (!first || !last) {
      return null;
    }
    const pair: [DateType, DateType] = dates.isAfter(first, last) ? [last, first] : [first, last];
    return pair;
  }

  return { samePickerPanelPeriod, pickerPanelOutsideBounds, pickerPanelHoverRange };
}
