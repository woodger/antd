import type { RangePickerProps } from './range-picker.types';
import type { TimeRangePickerRuntimeProps } from './time-range-picker.types';

const timeOnly = new Set([
  'hourStep', 'minuteStep', 'secondStep', 'millisecondStep', 'showHour', 'showMinute',
  'showSecond', 'showMillisecond', 'use12Hours', 'hideDisabledOptions', 'defaultOpenValue',
  'changeOnScroll', 'suffixIcon', 'prefix', 'classNames', 'styles',
  'cellRender', 'panelRender', 'onPickerValueChange', 'onPanelChange', 'disabledDate',
  'onclick', 'onClick', 'onFocus', 'onBlur', 'onKeyDown', 'onfocus', 'onblur',
  'allowClear', 'status', 'placeholder', 'renderExtraFooter', 'disabledTime', 'mode', 'picker'
]);

/** Shared RangePicker fields. Time-only callbacks and renderers stay out of native attributes. */
export function timeRangeSharedProps<DateType extends object>(
  props: TimeRangePickerRuntimeProps<DateType>
): RangePickerProps<DateType> {
  // Callback payload types are saved to time boundary, the remaining fields are common for RangePicker.
  const shared = Object.fromEntries(
    Object.entries(props).filter(([key]) => !timeOnly.has(key))
  ) as RangePickerProps<DateType>;
  return { ...shared, showTime: true };
}
