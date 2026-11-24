import type { DatePickerProps } from './date-picker.types';
import type { TimePickerRuntimeProps } from './time-picker.types';

const timeOnly = new Set([
  'hourStep', 'minuteStep', 'secondStep', 'millisecondStep', 'showHour', 'showMinute',
  'showSecond', 'showMillisecond', 'use12Hours', 'hideDisabledOptions', 'defaultOpenValue',
  'changeOnScroll', 'previewValue',
  'suffixIcon', 'prefix', 'classNames', 'styles',
  'cellRender', 'panelRender', 'renderExtraFooter', 'presets', 'onPickerValueChange', 'onPanelChange',
  'disabledDate', 'onCalendarChange', 'onChange', 'onclick', 'onClick', 'onFocus', 'onBlur',
  'onKeyDown', 'allowClear', 'status', 'multiple', 'mode'
]);

/** Общие native/input props без утечки time-only callbacks и renderers в DOM. */
export function timePickerSharedProps<DateType extends object>(
  props: TimePickerRuntimeProps<DateType>
): DatePickerProps<DateType> {
  // После удаления time-only полей оставшаяся часть имеет общий контракт DatePickerProps.
  const shared = Object.fromEntries(
    Object.entries(props).filter(([key]) => !timeOnly.has(key))
  ) as DatePickerProps<DateType>;

  return {
    ...shared,
    showTime: true,
    allowClear: true,
    onfocus: props.onfocus ?? props.onFocus,
    onblur: props.onblur ?? props.onBlur,
    onkeydown: props.onkeydown ?? props.onKeyDown,
    onCalendarChange: (value, text) => {
      props.onCalendarChange?.(value, text, {});
    },
    onChange: (value, text) => props.onChange?.(value, value ? text : null)
  };
}
