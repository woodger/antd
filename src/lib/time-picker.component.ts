// Перегрузки сохраняют прежние ComponentProps и разрешают режимы авторской панели.
// Значения экспорта — те же Svelte-компоненты с прежними ref и bindings.
import type { Component, ComponentConstructorOptions, SvelteComponent } from 'svelte';
import TimePickerControl from './TimePicker.svelte';
import { pickerAdapterProps } from './picker-adapter-props.engine';
import { dayjsPickerDates, type PickerDateOperations } from './picker-date-operations.engine';
import type { Dayjs } from 'dayjs';
import type { DatePickerMode } from './date-picker.types';
import type { DatePickerComponents, DatePickerPanel } from './picker-components.types';
import type {
  TimePickerMultipleProps, TimePickerProps, TimePickerRuntimeProps
} from './time-picker.types';

/** Переход в календарный режим включается своим слотом времени. */
export type TimePanelOptions<DateType extends object = Dayjs> = {
  components: DatePickerComponents<DateType> & { time: DatePickerPanel<DateType>; };
};
type TimePickerHandle = ReturnType<typeof TimePickerControl>;
type TimePickerInstance<Props extends object> = SvelteComponent<Props, {}, {}>
  & TimePickerHandle & { $$bindings?: 'nativeElement'; };

type TimePickerComponent<DateType extends object> = Component<
  TimePickerProps<DatePickerMode, DateType> & TimePanelOptions<DateType>,
  TimePickerHandle, 'nativeElement'
> & Component<TimePickerProps<'time', DateType>, TimePickerHandle, 'nativeElement'>;

/** Изоморфные сигнатуры сохраняют перегрузки в шаблонах и в mount/render. */
export interface GeneratedTimeSelection<DateType extends object> {
  new <Multiple extends true>(
    options: ComponentConstructorOptions<TimePickerMultipleProps<DateType> & { multiple: Multiple; }>
  ): TimePickerInstance<TimePickerMultipleProps<DateType>>;
  new (
    options: ComponentConstructorOptions<TimePickerProps<DatePickerMode, DateType>
      & TimePanelOptions<DateType>>
  ): TimePickerInstance<TimePickerProps<DatePickerMode, DateType> & TimePanelOptions<DateType>>;
  new (
    options: ComponentConstructorOptions<TimePickerProps<'time', DateType>>
  ): TimePickerInstance<TimePickerProps<'time', DateType>>;
  <Multiple extends true>(
    anchor: unknown, props: TimePickerMultipleProps<DateType> & { multiple: Multiple; }
  ): ReturnType<Component<TimePickerMultipleProps<DateType>, TimePickerHandle, 'nativeElement'>>;
  z_$$bindings?: 'nativeElement';
}

export type GeneratedTimePickerComponent<DateType extends object> =
  GeneratedTimeSelection<DateType> & TimePickerComponent<DateType>;

/** Привязывает адаптер времени. Последняя перегрузка сохраняет обычный ComponentProps. */
export function createTimePickerComponent<DateType extends object>(
  dateOperations: PickerDateOperations<DateType>,
  standaloneTime = false
): GeneratedTimePickerComponent<DateType> {
  /** Передаёт исходные getter'ы владельца и настройки общего редактора. */
  function render(anchor: unknown, props: TimePickerRuntimeProps<DateType>
    | TimePickerMultipleProps<DateType>) {
    return TimePickerControl<DateType>(
      anchor, pickerAdapterProps(props, { dateOperations, standaloneTime })
    );
  }

  // Svelte использует сигнатуры new для проверки шаблона. Runtime вызывает render как функцию.
  return render as unknown as GeneratedTimePickerComponent<DateType>;
}

const TimePicker: TimePickerComponent<Dayjs> = createTimePickerComponent(dayjsPickerDates, true);

export default TimePicker;
