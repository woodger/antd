import dayjs from 'dayjs';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it } from 'vitest';
import {
  DatePicker, RangePicker, TimePicker, TimeRangePicker, enUS,
  type DatePickerFormatConfig, type DatePickerProps, type RangePickerProps,
  type TimePickerProps, type TimeRangePickerProps
} from '@woodger/antd-svelte';

for (const profile of ['string', 'object', 'mask'] as const) {
  const fieldFormat = (format: string) => profile === 'string' ? format
    : { format, ...(profile === 'mask' ? { type: 'mask' as const } : {}) };

  it(`renders closed date and range fields with ${profile} format without browser globals`, () => {
    expectTypeOf<DatePickerFormatConfig>().toEqualTypeOf<{ format: string; type?: 'mask' }>();
    expectTypeOf<DatePickerFormatConfig>().toExtend<NonNullable<DatePickerProps['format']>>();
    expectTypeOf<DatePickerFormatConfig>().toExtend<NonNullable<RangePickerProps['format']>>();
    expectTypeOf<DatePickerFormatConfig>().toExtend<NonNullable<TimePickerProps['format']>>();
    expectTypeOf<DatePickerFormatConfig>().toExtend<NonNullable<TimeRangePickerProps['format']>>();
    const start = dayjs('2020-12-31T16:37:59.456');
    const end = dayjs('2021-01-15T19:41:23.789');
    const format = fieldFormat('YYYY-MM-DD');
    const single = render(DatePicker, { props: { value: start, format, locale: enUS.datePicker } }).body;
    const range = render(
      RangePicker,
      { props: { value: [start, end], format, locale: enUS.datePicker } }
    ).body;

    expect(single).toContain('value="2020-12-31"');
    expect(range).toContain('value="2020-12-31"');
    expect(range).toContain('value="2021-01-15"');
    expect(single + range).not.toContain('role="dialog"');
    expect(start.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2020-12-31 16:37:59.456');
    expect(end.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2021-01-15 19:41:23.789');
  });

  it(`renders closed datetime and time fields with ${profile} format and exact milliseconds`, () => {
    const start = dayjs('2020-12-31T16:37:59.456');
    const end = dayjs('2021-01-15T19:41:23.789');
    const clock = { showSecond: true, showMillisecond: true };
    const datetime = render(DatePicker, { props: { value: start,
      showTime: true, format: fieldFormat('YYYY-MM-DD HH:mm:ss.SSS'), locale: enUS.datePicker } }).body;
    const time = render(TimePicker, { props: { value: start, ...clock,
      format: fieldFormat('HH:mm:ss.SSS'), locale: enUS.datePicker } }).body;
    const range = render(TimeRangePicker, { props: { value: [start, end], ...clock,
      format: fieldFormat('HH:mm:ss.SSS'), locale: enUS.datePicker } }).body;

    expect(datetime).toContain('value="2020-12-31 16:37:59.456"');
    expect(time).toContain('value="16:37:59.456"');
    expect(range).toContain('value="16:37:59.456"');
    expect(range).toContain('value="19:41:23.789"');
    expect(datetime + time + range).not.toContain('role="dialog"');
    expect(start.millisecond()).toBe(456);
    expect(end.millisecond()).toBe(789);
  });
}
