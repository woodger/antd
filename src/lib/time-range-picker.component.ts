// Объединяет публичные сигнатуры TimeRangePicker без дополнительной обёртки в DOM.
import type { Component } from 'svelte';
import TimeRangePickerControl from './TimeRangePicker.svelte';
import type { DatePickerMode } from './date-picker.types';
import type { TimePanelOptions } from './time-picker.component';
import type { TimeRangePickerProps } from './time-range-picker.types';

type TimeRangeHandle = ReturnType<typeof TimeRangePickerControl>;
type TimeRangeBindings = 'nativeElement' | 'startInput' | 'endInput';

/** Извлечение ComponentProps сохраняет прежний footer с режимом time. */
const TimeRangePicker: Component<
  TimeRangePickerProps<DatePickerMode> & TimePanelOptions, TimeRangeHandle, TimeRangeBindings
> & Component<TimeRangePickerProps, TimeRangeHandle, TimeRangeBindings> = TimeRangePickerControl;

export default TimeRangePicker;
