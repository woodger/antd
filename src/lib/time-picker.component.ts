// Перегрузки сохраняют прежние ComponentProps и разрешают режимы авторской панели.
// Значения экспорта — те же Svelte-компоненты с прежними ref и bindings.
import type { Component } from 'svelte';
import TimePickerControl from './TimePicker.svelte';
import { pickerAdapterProps } from './picker-adapter-props.engine';
import { dayjsPickerDates, type PickerDateOperations } from './picker-date-operations.engine';
import type { Dayjs } from 'dayjs';
import type { DatePickerMode } from './date-picker.types';
import type { DatePickerComponents, DatePickerPanel } from './picker-components.types';
import type { TimePickerProps } from './time-picker.types';

/** Переход в календарный режим включается своим слотом времени. */
export type TimePanelOptions<DateType extends object = Dayjs> = {
  components: DatePickerComponents<DateType> & { time: DatePickerPanel<DateType>; };
};
type TimePickerHandle = ReturnType<typeof TimePickerControl>;

type TimePickerComponent<DateType extends object> = Component<
  TimePickerProps<DatePickerMode, DateType> & TimePanelOptions<DateType>,
  TimePickerHandle, 'nativeElement'
> & Component<TimePickerProps<'time', DateType>, TimePickerHandle, 'nativeElement'>;

/** Привязывает адаптер времени. Последняя перегрузка сохраняет обычный ComponentProps. */
export function createTimePickerComponent<DateType extends object>(
  dateOperations: PickerDateOperations<DateType>,
  standaloneTime = false
): TimePickerComponent<DateType> {
  return (anchor, props) => TimePickerControl<DateType>(
    anchor, pickerAdapterProps(props, { dateOperations, standaloneTime })
  );
}

const TimePicker = createTimePickerComponent(dayjsPickerDates, true);

export default TimePicker;
