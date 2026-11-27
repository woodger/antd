// Creates a DatePicker family for one adapter. The pickers share Svelte components and pass adapter
// values through without wrapping them.
import type { Component, ComponentConstructorOptions, SvelteComponent } from 'svelte';
import DatePickerRoot from './DatePicker.svelte';
import RangePickerRoot from './RangePicker.svelte';
import {
  createTimePickerComponent, type GeneratedTimePickerComponent, type TimePanelOptions
} from './time-picker.component';
import { pickerAdapterProps } from './picker-adapter-props.engine';
import {
  createPickerDateOperations, type PickerDateOperations
} from './picker-date-operations.engine';
import type {
  DatePickerMode, DatePickerPicker, DatePickerSelectionProps
} from './date-picker.types';
import type { GenerateConfig } from './date-generate.types';
import type { RangePickerProps } from './range-picker.types';
import type { TimeRangeInputParser } from './time-range-picker.engine';
import type { TimeRangePickerModeOptions, TimeRangePickerProps } from './time-range-picker.types';

type DatePickerHandle = ReturnType<typeof DatePickerRoot>;
type RangePickerHandle = ReturnType<typeof RangePickerRoot>;
type RangePickerBindings = 'nativeElement' | 'startInput' | 'endInput';
type TimeRangeModeProps<DateType extends object> = TimeRangePickerProps<'time', DateType>
  & TimeRangePickerModeOptions<DateType>;

interface CustomTimeRangeModeProps<DateType extends object> extends
  Omit<TimeRangePickerProps<DatePickerMode, DateType>, 'components'>, TimePanelOptions<DateType>,
  TimeRangePickerModeOptions<DateType> {}

type RangePickerFamilyProps<DateType extends object> = RangePickerProps<DateType>
  | TimeRangeModeProps<DateType> | CustomTimeRangeModeProps<DateType>;

/** The component call and internal $set use the same props type for template inference. */
interface RangePickerComponent<DateType extends object> {
  (anchor: unknown, props: RangePickerFamilyProps<DateType>): RangePickerHandle & {
    $on?: ReturnType<Component>['$on'];
    $set?: (props: Partial<RangePickerFamilyProps<DateType>>) => void;
  };
  z_$$bindings?: RangePickerBindings;
}

type PickerSelectionProps<
  Multiple extends boolean, DateType extends object, DefaultPicker extends DatePickerPicker | undefined
> = DefaultPicker extends DatePickerPicker
  ? Omit<DatePickerSelectionProps<Multiple, DateType>, 'picker'>
  : DatePickerSelectionProps<Multiple, DateType>;

/** Retains inference of multiple in templates through Svelte's isomorphic declaration. */
export interface PickerSelectionComponent<
  DateType extends object, DefaultPicker extends DatePickerPicker | undefined
> {
  new <Multiple extends boolean = false>(
    options: ComponentConstructorOptions<PickerSelectionProps<Multiple, DateType, DefaultPicker>>
  ): SvelteComponent<PickerSelectionProps<Multiple, DateType, DefaultPicker>, {}, {}>
    & DatePickerHandle & { $$bindings?: 'nativeElement'; };
  <Multiple extends boolean = false>(
    anchor: unknown, props: PickerSelectionProps<Multiple, DateType, DefaultPicker>
  ): DatePickerHandle;
  z_$$bindings?: 'nativeElement';
}

/** Binds the shared field to the adapter. The default mount signature selects a single date. */
function createDatePickerComponent<
  DateType extends object, DefaultPicker extends DatePickerPicker | undefined = undefined
>(
  dateOperations: PickerDateOperations<DateType>,
  defaultPicker?: DefaultPicker
) {
  /** Forwards the original getters, mode settings, and adapter to the internal field. */
  function render<Multiple extends boolean = false>(
    anchor: unknown, props: DatePickerSelectionProps<Multiple, DateType>
  ) {
    return DatePickerRoot<Multiple, DateType>(
      anchor, pickerAdapterProps(props, { dateOperations, defaultPicker })
    );
  }

  // The call supplies all internal DatePickerRoot props. The public declaration retains the owner
  // props and the same ref and binding types.
  const component = render as unknown as PickerSelectionComponent<DateType, DefaultPicker>;
  const scalar = component<false>;
  const picker: typeof component & typeof scalar = component;
  return picker;
}

/** Fixes the configuration for the whole family and its three calendar variants. */
export function createPickerFamily<DateType extends object>(
  dateOperations: PickerDateOperations<DateType>,
  parseTimeInput?: TimeRangeInputParser<DateType>
) {
  const WeekPicker = createDatePickerComponent(dateOperations, 'week');
  const MonthPicker = createDatePickerComponent(dateOperations, 'month');
  const YearPicker = createDatePickerComponent(dateOperations, 'year');
  const TimePicker: GeneratedTimePickerComponent<DateType> = createTimePickerComponent(dateOperations);
  const RangePicker: RangePickerComponent<DateType> = (anchor, props) => RangePickerRoot<DateType>(
    anchor, pickerAdapterProps(props, { dateOperations, parseTimeInput })
  );
  const DatePicker = createDatePickerComponent(dateOperations);

  return Object.assign(DatePicker, {
    WeekPicker, MonthPicker, YearPicker, TimePicker, RangePicker
  });
}

/** Creates DatePicker and its variants for the date type supported by generateConfig. */
export function generatePicker<DateType extends object>(generateConfig: GenerateConfig<DateType>) {
  return createPickerFamily(createPickerDateOperations(generateConfig));
}
