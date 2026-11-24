// Объединяет локальные и контекстные семантические стили TimeRangePicker. Callbacks получают
// итоговые size и disabled для обоих полей.
import type { RangePickerConfig } from './range-picker.types';
import type { TimePickerConfig, TimePickerProps, TimePickerSemantic } from './time-picker.types';
import type { TimeRangePickerProps, TimeRangePickerSemantic } from './time-range-picker.types';
import { mergePickerSlots } from './time-picker-semantic.engine';

// Ведёт классы и стили раздельно, помещая контекстный root style диапазона перед локальным слоем.
export function timeRangeSemantic<DateType extends object>(
  props: TimeRangePickerProps<'time', DateType>,
  context: TimePickerConfig | undefined,
  range: RangePickerConfig | undefined,
  resolved: Pick<TimeRangePickerProps, 'size' | 'disabled'>
) {
  const filled = { ...props, ...resolved };
  // Выполняет локальный callback с разрешёнными props диапазона или возвращает объект слотов.
  const resolve = (value: TimeRangePickerSemantic<DateType> | undefined) =>
    typeof value === 'function' ? value({ props: filled }) : value;
  // Использует те же разрешённые props для общего timePicker config, сохраняя исходный контракт
  // callback.
  const resolveContext = (value: TimePickerSemantic | undefined) => {
    // В upstream общий timePicker config типизирован single props, но получает range props.
    return typeof value === 'function'
      ? value({ props: filled as unknown as TimePickerProps }) : value;
  };
  return {
    classes: mergePickerSlots([
      resolveContext(context?.classNames), resolve(props.classNames)
    ], ' '),
    styles: mergePickerSlots([
      resolveContext(context?.styles), { root: range?.style }, resolve(props.styles)
    ], ';')
  };
}
