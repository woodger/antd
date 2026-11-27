// Combines the public TimeRangePicker signatures without adding a DOM wrapper.
import type { Component } from 'svelte';
import TimeRangePickerControl from './TimeRangePicker.svelte';
import type { DatePickerMode } from './date-picker.types';
import type { TimePanelOptions } from './time-picker.component';
import type { TimeRangePickerProps } from './time-range-picker.types';

type TimeRangeHandle = ReturnType<typeof TimeRangePickerControl>;
type TimeRangeBindings = 'nativeElement' | 'startInput' | 'endInput';

/** Extraction ComponentProps retains the previous footer with time mode. */
const TimeRangePicker: Component<
  TimeRangePickerProps<DatePickerMode> & TimePanelOptions, TimeRangeHandle, TimeRangeBindings
> & Component<TimeRangePickerProps, TimeRangeHandle, TimeRangeBindings> = TimeRangePickerControl;

export default TimeRangePicker;
