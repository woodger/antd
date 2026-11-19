import type {
  DatePickerMode, DatePickerPicker, DatePickerProps, RangePickerProps,
  TimePickerProps, TimeRangePickerProps
} from 'antd-svelte';

export const pickers: DatePickerPicker[] = ['date', 'month', 'year'];
export const singleMonth = { picker: 'month', needConfirm: true } satisfies DatePickerProps;
export const singleYear = { picker: 'year', showTime: true } satisfies DatePickerProps;
export const rangeMonth = { picker: 'month', order: false } satisfies RangePickerProps;
export const rangeYear = { picker: 'year', disabled: [true, false] } satisfies RangePickerProps;
export const navigationMode: DatePickerMode = 'decade';
export const invalidTerminal: DatePickerProps = {
  // @ts-expect-error decade is a panel navigation mode
  picker: 'decade'
};
export const singleTime: TimePickerProps = {
  // @ts-expect-error TimePicker owns its picker type
  picker: 'month'
};
export const rangeTime: TimeRangePickerProps = {
  // @ts-expect-error TimeRangePicker owns its picker type
  picker: 'year'
};
