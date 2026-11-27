// Normalizes pairs DateRangePicker and checks them before confirmation. Sorting and checking
// boundaries take into account order and disabled.
import type { Dayjs } from 'dayjs';
import type { RangePickerInputValue, RangePickerValue } from './range-picker.types';
import type { DatePickerPicker } from './date-picker.types';
import { createDatePickerEngine } from './date-picker.engine';
import { dayjsPickerDates, type PickerDateOperations } from './picker-date-operations.engine';
// Fills the missing ends of the range with a value of null, saving references to dates.
export function rangePair<DateType extends object = Dayjs>(
  value: RangePickerInputValue<DateType> | null | undefined
): RangePickerValue<DateType> {
  return [value?.[0] ?? null, value?.[1] ?? null];
}
// Applies a scalar flag to both fields. The array sets the first and second flag independently.
export function rangeFlags(
  value: boolean | readonly boolean[] | undefined,
  fallback = false
): [boolean, boolean] {
  return Array.isArray(value)
    ? [Boolean(value[0]), Boolean(value[1])]
    : [value ?? fallback, value ?? fallback] as [boolean, boolean];
}
// Chooses the first one filled out of already affected fields, if it differs from active.
export function rangeFrom<DateType extends object>(
  values: RangePickerValue<DateType>,
  triggered: readonly number[],
  active: number
): DateType | undefined {
  const first = triggered.find(index => values[index]);
  return first !== undefined && first !== active ? values[first] ?? undefined : undefined;
}

/** Verifies and adjusts the range values in the current adapter calendar. */
export function createRangePickerEngine<DateType extends object>(
  dates: PickerDateOperations<DateType>,
  calendar = createDatePickerEngine(dates)
) {
  const { samePickerQuarter, samePickerWeek } = calendar;

  // Compares timestamp of the corresponding boundaries and takes into account the missing values.
  function sameRange(a: RangePickerValue<DateType>, b: RangePickerValue<DateType>): boolean {
    return a.every((date, index) => dates.sameValue(date, b[index]));
  }
  // Bringing back a new pair. Changes the boundaries in places only with permitted sorting and two
  // available fields.
  function orderedRange(
    value: RangePickerValue<DateType>,
    order: boolean,
    disabled: readonly boolean[]
  ): RangePickerValue<DateType> {
    return order && !disabled.some(Boolean) && value[0] && value[1] && dates.isAfter(value[0], value[1])
      ? [value[1], value[0]]
      : [...value];
  }
  // Verifies the existence of boundaries and the permissible order of calendar periods before
  // calling invalid for available fields.
  function validRange(
    value: RangePickerValue<DateType>,
    allowEmpty: readonly boolean[],
    order: boolean,
    disabled: readonly boolean[],
    invalid: (date: DateType, index: number, from?: DateType) => boolean,
    picker: DatePickerPicker = 'date',
    locale = 'en_US'
  ): boolean {
    const [start, end] = value;
    return Boolean(
      (start
        || allowEmpty[0])
      && (end
        || allowEmpty[1])
      && (!order
        || !start
        || !end
        || (picker === 'week' ? samePickerWeek(start, end, locale)
          : picker === 'quarter' ? samePickerQuarter(start, end) : dates.samePeriod(start, end, picker === 'date' ? 'day' : picker))
        || dates.isAfter(end, start))
      && value.every(
        (date, index) => disabled[index]
          || !date
          || !invalid(
            date,
            index,
            index === 1 ? start ?? undefined : undefined
          )
      )
    );
  }

  return { sameRange, orderedRange, validRange };
}

export const { sameRange, orderedRange, validRange } = createRangePickerEngine(dayjsPickerDates);
