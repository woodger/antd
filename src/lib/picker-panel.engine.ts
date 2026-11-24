// Готовит данные пользовательской панели. Черновик и подтверждение остаются у поля.
import type { Dayjs } from 'dayjs';
import { samePickerPanelValue } from './date-picker.engine';
import type { DatePickerMode, DatePickerTimeConfig } from './date-picker.types';
import type { DatePickerPanelMode, DatePickerPanelTimeConfig } from './picker-components.types';
import { samePickerTime } from './time-range-picker.engine';

/** Для поля даты со временем используется единая панель datetime. */
export function pickerPanelSlot(mode: DatePickerMode, datetime: boolean): DatePickerPanelMode {
  return mode === 'date' && datetime ? 'datetime' : mode;
}

/** Сравнивает период ограничения либо единицы времени в режиме панели. */
export function samePickerPanelPeriod(a: Dayjs, b: Dayjs, mode: DatePickerMode, locale: string) {
  if (mode === 'decade') {
    return Math.floor(a.year() / 10) === Math.floor(b.year() / 10);
  }
  if (mode === 'time') {
    return samePickerTime(a, b);
  }
  return samePickerPanelValue(a, b, false, mode, locale);
}

/** Обе даты границы могут принадлежать одному разрешённому периоду. */
export function pickerPanelOutsideBounds(
  date: Dayjs,
  limits: { minDate?: Dayjs; maxDate?: Dayjs; },
  mode: DatePickerMode,
  locale: string
) {
  const { minDate, maxDate } = limits;
  return Boolean(
    minDate && minDate.isAfter(date) && !samePickerPanelPeriod(minDate, date, mode, locale)
    || maxDate && date.isAfter(maxDate) && !samePickerPanelPeriod(maxDate, date, mode, locale)
  );
}

/** В hoverRangeValue передаётся упорядоченная пара даже при одной границе. */
export function pickerPanelHoverRange(start: Dayjs | null, end: Dayjs | null) {
  const first = start ?? end;
  const last = end ?? start;
  if (!first || !last) {
    return null;
  }
  const pair: [Dayjs, Dayjs] = first.isAfter(last) ? [last, first] : [first, last];
  return pair;
}

/** Оставляет настройки часов, формат и ограничения, нужные производителю панели. */
export function pickerPanelClock(
  clock: DatePickerTimeConfig,
  extra: Pick<DatePickerPanelTimeConfig,
    'disabledTime' | 'defaultOpenValue' | 'changeOnScroll' | 'showNow'>
): DatePickerPanelTimeConfig {
  const { format, showHour, showMinute, showSecond, showMillisecond, use12Hours,
    hourStep, minuteStep, secondStep, millisecondStep, hideDisabledOptions } = clock;
  return { format, showHour, showMinute, showSecond, showMillisecond, use12Hours,
    hourStep, minuteStep, secondStep, millisecondStep, hideDisabledOptions, ...extra };
}
