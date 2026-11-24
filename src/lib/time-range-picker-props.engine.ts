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

/** Общие поля RangePicker без time-only callbacks и renderers в native attributes. */
export function timeRangeSharedProps<DateType extends object>(
  props: TimeRangePickerRuntimeProps<DateType>
): RangePickerProps<DateType> {
  // Типы callback payload сохраняются на time boundary, остальные поля общие для RangePicker.
  const shared = Object.fromEntries(
    Object.entries(props).filter(([key]) => !timeOnly.has(key))
  ) as RangePickerProps<DateType>;
  return { ...shared, showTime: true };
}
