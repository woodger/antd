import dayjs from 'dayjs';
import 'dayjs/locale/en-gb.js';
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import { DatePicker, RangePicker, enUS } from 'antd-svelte';

const start = dayjs('2020-12-31T16:37:59.456');
const end = dayjs('2021-01-15T09:12:34.567');
const profiles = [
  { locale: enUS.datePicker, start: '2021-1st', end: '2021-3rd',
    placeholder: 'Select week', rangePlaceholder: ['Start week', 'End week'] },
  { locale: { lang: { ...enUS.datePicker.lang, locale: 'en_GB',
    weekPlaceholder: 'Choose authored week',
    rangeWeekPlaceholder: ['Authored start week', 'Authored end week'] as [string, string] } },
    start: '2020-53rd', end: '2021-2nd', placeholder: 'Choose authored week',
    rangePlaceholder: ['Authored start week', 'Authored end week'] }
] as const;

for (const [index, profile] of profiles.entries()) {
  it(`renders closed week field with Source locale profile ${index}`, () => {
    const body = render(DatePicker, { props: { picker: 'week', value: start,
      locale: profile.locale } }).body;

    expect(body).toContain(`value="${profile.start}"`);
    expect(body).toContain(`placeholder="${profile.placeholder}"`);
    expect(body).not.toContain('role="dialog"');
    expect(start.toISOString()).toBe('2020-12-31T16:37:59.456Z');
  });

  it(`renders closed week range with Source locale profile ${index}`, () => {
    const body = render(RangePicker, { props: { picker: 'week', value: [start, end],
      locale: profile.locale } }).body;

    expect(body).toContain(`value="${profile.start}"`);
    expect(body).toContain(`value="${profile.end}"`);
    for (const placeholder of profile.rangePlaceholder)
      expect(body).toContain(`placeholder="${placeholder}"`);
    expect(body).not.toContain('role="dialog"');
  });
}

for (const showWeek of [undefined, false] as const) {
  it(`renders initially open hidden week grid with showWeek=${showWeek}`, () => {
    const body = render(DatePicker, { props: { picker: 'week', value: start,
      defaultPickerValue: start, defaultOpen: true, showWeek, showTime: true,
      locale: enUS.datePicker } }).body;

    expect(body).toMatch(/role="dialog"[^>]*hidden/);
    expect(body).toContain('ant-picker-week-panel');
    expect(body.match(/data-picker-date="\d{4}-\d{2}-\d{2}"/g)).toHaveLength(42);
    expect(body.match(/class="[^"]*\bant-picker-cell-week\b/g) ?? [])
      .toHaveLength(showWeek === false ? 0 : 6);
    expect(body).not.toContain('ant-picker-week-panel-show-week');
    expect(body).not.toContain('ant-picker-time-panel');
    expect(body).not.toContain('class="ant-picker-ok"');
  });

  it(`renders adjacent month range grids with showWeek=${showWeek}`, () => {
    const body = render(RangePicker, { props: { picker: 'week', value: [start, end],
      defaultPickerValue: [start, start], defaultOpen: true, showWeek,
      locale: enUS.datePicker } }).body;

    expect(body).toMatch(/role="dialog"[^>]*hidden/);
    expect(body.match(/class="[^"]*\bant-picker-week-panel(?=["\s])/g)).toHaveLength(2);
    expect(body.match(/data-picker-date="\d{4}-\d{2}-\d{2}"/g)).toHaveLength(84);
    expect(body.match(/class="[^"]*\bant-picker-cell-week\b/g) ?? [])
      .toHaveLength(showWeek === false ? 0 : 12);
    expect(body).toContain('2020-12-31');
    expect(body).toContain('2021-01-31');
  });
}

it('adds show-week modifier only for explicit true and supports date week numbers', () => {
  const week = render(DatePicker, { props: { picker: 'week', value: start,
    defaultOpen: true, showWeek: true, locale: enUS.datePicker } }).body;
  const date = render(DatePicker, { props: { value: start,
    defaultOpen: true, showWeek: true, locale: enUS.datePicker } }).body;

  expect(week).toContain('ant-picker-week-panel-show-week');
  expect(date).toContain('ant-picker-date-panel-show-week');
  expect(date.match(/class="[^"]*\bant-picker-cell-week\b/g)).toHaveLength(6);
});

it('checks date-panel week prefixes with week type and the identical first-day candidate', () => {
  const calls: Array<{ value: typeof start; type: string }> = [];
  const body = render(DatePicker, { props: { value: start, defaultPickerValue: start,
    defaultOpen: true, showWeek: true, locale: enUS.datePicker,
    disabledDate(value, info) {
      calls.push({ value, type: info.type });
      return false;
    }
  } }).body;
  const prefixes = calls.filter(call => call.type === 'week');

  expect(body).toContain('ant-picker-date-panel-show-week');
  expect(prefixes).toHaveLength(6);
  for (const prefix of prefixes) {
    expect(calls.some(call => call.type === 'date' && call.value === prefix.value)).toBe(true);
    expect(prefix.value.hour()).toBe(0);
  }
  expect(start.toISOString()).toBe('2020-12-31T16:37:59.456Z');
});
