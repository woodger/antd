import type {
  DatePickerMode, DatePickerPicker, DatePickerProps, RangePickerProps,
  TimePickerProps, TimeRangePickerProps
} from '@woodger/antd-svelte';

export const picker: DatePickerPicker = 'week';
export const mode: DatePickerMode = 'week';
export const single = { picker, showWeek: false } satisfies DatePickerProps;
export const range = { picker, showWeek: true, order: false } satisfies RangePickerProps;
export const dateWeekNumbers = { showWeek: true } satisfies DatePickerProps;
// Source Time-only props inherit showWeek; the clock ignores that date-panel option.
export const timeWeekNumbers = { showWeek: true } satisfies TimePickerProps;
export const timeRangeWeekNumbers = { showWeek: false } satisfies TimeRangePickerProps;
export const singleTime: TimePickerProps = {
  // @ts-expect-error TimePicker owns its picker type
  picker: 'week'
};
export const rangeTime: TimeRangePickerProps = {
  // @ts-expect-error TimeRangePicker owns its picker type
  picker: 'week'
};
