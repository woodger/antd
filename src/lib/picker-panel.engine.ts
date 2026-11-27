// Prepares the data of the user panel. The draft and the confirmation remain at the field.
import type { Dayjs } from 'dayjs';
import { createDatePickerEngine } from './date-picker.engine';
import type { PickerDateOperations } from './picker-date-operations.engine';
import type { DatePickerMode, DatePickerTimeConfig } from './date-picker.types';
import type { DatePickerPanelMode, DatePickerPanelTimeConfig } from './picker-components.types';

/** A single datetime panel is used for the date field over time. */
export function pickerPanelSlot(mode: DatePickerMode, datetime: boolean): DatePickerPanelMode {
  return mode === 'date' && datetime ? 'datetime' : mode;
}

/** Leaves the settings of the clock, the format and restrictions required by the panel manufacturer. */
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

/** Prepares the boundaries and illumination of the replacement panel for the current adapter. */
export function createPickerPanelEngine<DateType extends object>(
  dates: PickerDateOperations<DateType>,
  calendar = createDatePickerEngine(dates)
) {
  const { fields } = dates;
  const { samePickerPanelValue } = calendar;

  /** Compares the limitation period or time units in panel mode. */
  function samePickerPanelPeriod(a: DateType, b: DateType, mode: DatePickerMode, locale: string) {
    if (mode === 'decade') {
      return Math.floor(fields.getYear(a) / 10) === Math.floor(fields.getYear(b) / 10);
    }
    if (mode === 'time') {
      return dates.sameTime(a, b);
    }
    return samePickerPanelValue(a, b, false, mode, locale);
  }

  /** Both dates of the border may belong to the same permitted period. */
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

  /** Passes an ordered pair to hoverRangeValue even when only one boundary is set. */
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
