import dayjs from 'dayjs';
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import { DatePicker, RangePicker, enUS } from '@woodger/antd';

const start = dayjs('2024-01-31T16:37:59.456');
const end = dayjs('2026-11-20T09:12:34.567');

it('renders a closed quarter field with its default format and placeholder', () => {
  const body = render(DatePicker, { props: { picker: 'quarter', value: start,
    name: 'quarter', locale: enUS.datePicker } }).body;

  expect(body).toContain('value="2024-Q1"');
  expect(body).toContain('placeholder="Select quarter"');
  expect(body).toContain('name="quarter"');
  expect(body).toContain('aria-expanded="false"');
  expect(body).not.toContain('role="dialog"');
  expect(start.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2024-01-31 16:37:59.456');
});

it('renders a closed quarter range with both period placeholders', () => {
  const body = render(RangePicker, { props: { picker: 'quarter', value: [start, end],
    locale: enUS.datePicker } }).body;

  expect(body).toContain('value="2024-Q1"');
  expect(body).toContain('value="2026-Q4"');
  expect(body).toContain('placeholder="Start quarter"');
  expect(body).toContain('placeholder="End quarter"');
  expect(body).not.toContain('role="dialog"');
});

it('keeps an initially open four-cell quarter panel hidden and ignores showTime', () => {
  const body = render(DatePicker, { props: { picker: 'quarter', value: start,
    defaultOpen: true, locale: enUS.datePicker,
    showTime: { format: 'HH:mm', defaultOpenValue: dayjs('2000-01-01T09:12:34.567') }
  } }).body;

  expect(body).toMatch(/role="dialog"[^>]*hidden/);
  expect(body).toContain('ant-picker-quarter-panel');
  expect(body.match(/data-picker-date="2024-Q[1-4]"/g)).toHaveLength(4);
  expect(body).not.toContain('ant-picker-time-panel');
  expect(body).not.toContain('class="ant-picker-ok"');
  expect(body).toContain('value="2024-Q1"');
});

it('renders adjacent-year quarter range panels and follows quarter locale fields', () => {
  const body = render(RangePicker, { props: { picker: 'quarter', value: [start, end],
    defaultPickerValue: [start, start], defaultOpen: true, showTime: true,
    locale: { lang: { ...enUS.datePicker.lang, fieldQuarterFormat: 'YYYY/[Q]Q',
      cellQuarterFormat: '[Quarter ]Q', rangeQuarterPlaceholder: ['From quarter', 'To quarter'] } }
  } }).body;

  expect(body).toMatch(/role="dialog"[^>]*hidden/);
  expect(body.match(/class="[^"]*\bant-picker-quarter-panel\b/g)).toHaveLength(2);
  expect(body.match(/data-picker-date="202[45]\/Q[1-4]"/g)).toHaveLength(8);
  expect(body).toContain('Quarter 1');
  expect(body).toContain('value="2024/Q1"');
  expect(body).toContain('value="2026/Q4"');
  expect(body).toContain('placeholder="From quarter"');
  expect(body).toContain('placeholder="To quarter"');
  expect(body).not.toContain('ant-picker-time-panel');
  expect(body).not.toContain('class="ant-picker-ok"');
});
