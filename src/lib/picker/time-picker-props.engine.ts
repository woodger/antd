// Separates the clock settings from the field attributes. Semantic callbacks receive the original
// props owners before normalization.
import type { DatePickerProps, DatePickerTimeConfig } from './date-picker.types';
import type { TimePickerRuntimeProps } from './time-picker.types';

const timeOnly = new Set([
  'hourStep', 'minuteStep', 'secondStep', 'millisecondStep', 'showHour', 'showMinute',
  'showSecond', 'showMillisecond', 'use12Hours', 'hideDisabledOptions', 'defaultOpenValue',
  'changeOnScroll', 'previewValue',
  'suffixIcon', 'prefix', 'classNames', 'styles',
  'cellRender', 'panelRender', 'renderExtraFooter', 'presets', 'onPickerValueChange', 'onPanelChange',
  'disabledDate', 'onCalendarChange', 'onChange', 'onclick', 'onClick', 'onFocus', 'onBlur',
  'onKeyDown', 'allowClear', 'status', 'multiple', 'mode', 'picker'
]);

type ClockColumns = Omit<DatePickerTimeConfig, 'format' | 'defaultOpenValue'
  | 'disabledTime' | 'showNow'>;

/** Distinguish the parameters of the columns, common for a single field and both boundaries of the range. */
export function splitPickerClock<Props extends ClockColumns>(props: Props) {
  const {
    showHour, showMinute, showSecond, showMillisecond, use12Hours,
    hourStep, minuteStep, secondStep, millisecondStep, hideDisabledOptions, changeOnScroll,
    ...field
  } = props;

  return {
    field,
    clock: {
      showHour, showMinute, showSecond, showMillisecond, use12Hours,
      hourStep, minuteStep, secondStep, millisecondStep, hideDisabledOptions, changeOnScroll
    }
  };
}

/** Object showTime overlaps the field parameters, including its own undefined. */
export function mergeShowTime<Config extends object>(clock: Config, showTime?: boolean | Config) {
  if (!showTime) {
    return false;
  }

  return typeof showTime === 'object' ? { ...clock, ...showTime } : clock;
}

/** Shared native and input props. Time-only callbacks and renderers stay out of the DOM. */
export function timePickerSharedProps<DateType extends object>(
  props: TimePickerRuntimeProps<DateType>
): Omit<DatePickerProps<DateType>, 'picker'> {
  // After removing time-only fields, the remaining props follow the shared DatePickerProps contract.
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
