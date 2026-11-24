// Нормализует пары DateRangePicker и проверяет их перед подтверждением. Сортировка и проверка
// границ учитывают order и disabled.
import type { Dayjs } from 'dayjs';
import type { RangePickerInputValue, RangePickerValue } from './range-picker.types';
import type { DatePickerPicker } from './date-picker.types';
import { createDatePickerEngine } from './date-picker.engine';
import { dayjsPickerDates, type PickerDateOperations } from './picker-date-operations.engine';
// Заполняет отсутствующие концы диапазона значением null, сохраняя ссылки на даты.
export function rangePair<DateType extends object = Dayjs>(
  value: RangePickerInputValue<DateType> | null | undefined
): RangePickerValue<DateType> {
  return [value?.[0] ?? null, value?.[1] ?? null];
}
// Применяет скалярный флаг к обоим полям. Массив задаёт первый и второй флаг независимо.
export function rangeFlags(
  value: boolean | readonly boolean[] | undefined,
  fallback = false
): [boolean, boolean] {
  return Array.isArray(value)
    ? [Boolean(value[0]), Boolean(value[1])]
    : [value ?? fallback, value ?? fallback] as [boolean, boolean];
}
// Выбирает первое заполненное из уже затронутых полей, если оно отличается от активного.
export function rangeFrom<DateType extends object>(
  values: RangePickerValue<DateType>,
  triggered: readonly number[],
  active: number
): DateType | undefined {
  const first = triggered.find(index => values[index]);
  return first !== undefined && first !== active ? values[first] ?? undefined : undefined;
}

/** Проверяет и упорядочивает значения диапазона в календаре текущего адаптера. */
export function createRangePickerEngine<DateType extends object>(
  dates: PickerDateOperations<DateType>,
  calendar = createDatePickerEngine(dates)
) {
  const { samePickerQuarter, samePickerWeek } = calendar;

  // Сравнивает timestamp соответствующих границ и учитывает отсутствующие значения.
  function sameRange(a: RangePickerValue<DateType>, b: RangePickerValue<DateType>): boolean {
    return a.every((date, index) => dates.sameValue(date, b[index]));
  }
  // Возвращает новую пару. Меняет границы местами только при разрешённой сортировке и двух
  // доступных полях.
  function orderedRange(
    value: RangePickerValue<DateType>,
    order: boolean,
    disabled: readonly boolean[]
  ): RangePickerValue<DateType> {
    return order && !disabled.some(Boolean) && value[0] && value[1] && dates.isAfter(value[0], value[1])
      ? [value[1], value[0]]
      : [...value];
  }
  // Проверяет наличие границ и допустимый порядок календарных периодов до вызова invalid для
  // доступных полей.
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
