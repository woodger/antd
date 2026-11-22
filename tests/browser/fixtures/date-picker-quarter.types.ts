import type {
  DatePickerMode, DatePickerPicker, DatePickerProps, RangePickerProps,
  TimePickerProps, TimeRangePickerProps
} from '@woodger/antd-svelte';

export const picker: DatePickerPicker = 'quarter';
export const mode: DatePickerMode = 'quarter';
export const single = { picker, needConfirm: true, showTime: true } satisfies DatePickerProps;
export const range = { picker, order: false, disabled: [true, false] } satisfies RangePickerProps;
export const singleTime: TimePickerProps = {
  // @ts-expect-error TimePicker owns its picker type
  picker: 'quarter'
};
export const rangeTime: TimeRangePickerProps = {
  // @ts-expect-error TimeRangePicker owns its picker type
  picker: 'quarter'
};
