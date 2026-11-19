import dayjs from 'dayjs';
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import { DatePicker, RangePicker, enUS } from 'antd-svelte';

for (const picker of ['month', 'year'] as const) {
  const start = dayjs('2024-01-31T16:37:59.456');
  const end = dayjs('2026-11-20T09:12:34.567');
  const format = picker === 'month' ? 'YYYY-MM' : 'YYYY';

  it(`renders a closed ${picker} field with its period format and placeholder`, () => {
    const body = render(DatePicker, { props: { picker, value: start, name: 'period',
      locale: enUS.datePicker } }).body;

    expect(body).toContain(`value="${start.format(format)}"`);
    expect(body).toContain(`placeholder="Select ${picker}"`);
    expect(body).toContain('name="period"');
    expect(body).toContain('aria-expanded="false"');
    expect(body).not.toContain('role="dialog"');
    expect(start.format('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2024-01-31 16:37:59.456');
  });

  it(`renders a closed ${picker} range with both localized period placeholders`, () => {
    const body = render(RangePicker, { props: { picker, value: [start, end],
      locale: enUS.datePicker } }).body;

    expect(body).toContain(`value="${start.format(format)}"`);
    expect(body).toContain(`value="${end.format(format)}"`);
    expect(body).toContain(`placeholder="Start ${picker}"`);
    expect(body).toContain(`placeholder="End ${picker}"`);
    expect(body).not.toContain('role="dialog"');
  });

  it(`keeps an initially open ${picker} panel hidden and ignores showTime`, () => {
    const body = render(DatePicker, { props: { picker, value: start, defaultOpen: true, locale: enUS.datePicker,
      showTime: { format: 'HH:mm', defaultOpenValue: dayjs('2000-01-01T09:12:34.567') }
    } }).body;

    expect(body).toMatch(/role="dialog"[^>]*hidden/);
    expect(body).toContain(`ant-picker-${picker}-panel`);
    expect(body).not.toContain('ant-picker-time-panel');
    expect(body).not.toContain('class="ant-picker-ok"');
    expect(body).toContain(`value="${start.format(format)}"`);
  });

  it(`renders two ${picker} range panels without a time panel`, () => {
    const body = render(RangePicker, { props: { picker, value: [start, end],
      defaultOpen: true, showTime: true, locale: enUS.datePicker } }).body;

    expect(body).toMatch(/role="dialog"[^>]*hidden/);
    expect(body.match(new RegExp(`class="[^"]*\\bant-picker-${picker}-panel\\b`, 'g'))).toHaveLength(2);
    expect(body).not.toContain('ant-picker-time-panel');
    expect(body).not.toContain('class="ant-picker-ok"');
  });
}
