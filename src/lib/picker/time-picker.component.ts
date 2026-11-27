// Overload retains the previous ComponentProps and allows the modes of the author's panel. Export
// values are the same Svelte components with previous ref and bindings.
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

/** Transition to the calendar mode is switched on by its time slot. */
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

/** Isomorphic signatures retain overloads in templates and in mount/render. */
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

/** Ties the time adapter. The last overload preserves the usual ComponentProps. */
export function createTimePickerComponent<DateType extends object>(
  dateOperations: PickerDateOperations<DateType>,
  standaloneTime = false
): GeneratedTimePickerComponent<DateType> {
  /** Forwards the owner's original getters and shared editor options. */
  function render(anchor: unknown, props: TimePickerRuntimeProps<DateType>
    | TimePickerMultipleProps<DateType>) {
    return TimePickerControl<DateType>(
      anchor, pickerAdapterProps(props, { dateOperations, standaloneTime })
    );
  }

  // Svelte uses new signatures to check the template. Runtime calls as a function.
  return render as unknown as GeneratedTimePickerComponent<DateType>;
}

const TimePicker: TimePickerComponent<Dayjs> = createTimePickerComponent(dayjsPickerDates, true);

export default TimePicker;
