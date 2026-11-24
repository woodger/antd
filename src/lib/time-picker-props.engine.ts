// Отделяет настройки часов от атрибутов поля. Семантические callbacks получают
// исходные props владельца до нормализации.
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

/** Выделяет параметры колонок, общие для одиночного поля и обеих границ диапазона. */
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

/** Объект showTime перекрывает параметры поля, в том числе собственным undefined. */
export function mergeShowTime<Config extends object>(clock: Config, showTime?: boolean | Config) {
  if (!showTime) {
    return false;
  }

  return typeof showTime === 'object' ? { ...clock, ...showTime } : clock;
}

/** Общие native/input props без утечки time-only callbacks и renderers в DOM. */
export function timePickerSharedProps<DateType extends object>(
  props: TimePickerRuntimeProps<DateType>
): Omit<DatePickerProps<DateType>, 'picker'> {
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
