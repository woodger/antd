// Перегрузки сохраняют прежние ComponentProps и разрешают режимы авторской панели.
// Значения экспорта — те же Svelte-компоненты с прежними ref и bindings.
import type { Component } from 'svelte';
import TimePickerControl from './TimePicker.svelte';
import type { DatePickerMode } from './date-picker.types';
import type { DatePickerComponents, DatePickerPanel } from './picker-components.types';
import type { TimePickerProps } from './time-picker.types';

/** Переход в календарный режим включается своим слотом времени. */
export type TimePanelOptions = { components: DatePickerComponents & { time: DatePickerPanel; }; };
type TimePickerHandle = ReturnType<typeof TimePickerControl>;

/** Последняя перегрузка задаёт обычный контракт при извлечении ComponentProps. */
const TimePicker: Component<
  TimePickerProps<DatePickerMode> & TimePanelOptions, TimePickerHandle, 'nativeElement'
> & Component<TimePickerProps, TimePickerHandle, 'nativeElement'> = TimePickerControl;

export default TimePicker;
