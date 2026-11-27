import type { Component } from 'svelte';
import DatePicker from './date-picker.component';
import type { RangePickerProps } from './range-picker.types';

const RangePicker: Component<
  RangePickerProps, ReturnType<typeof DatePicker.RangePicker>, 'nativeElement' | 'startInput' | 'endInput'
> = DatePicker.RangePicker;

export default RangePicker;
