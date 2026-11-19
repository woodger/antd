import dayjs, { type Dayjs } from 'dayjs';
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import { DatePicker, RangePicker, enUS } from 'antd-svelte';

for (const kind of ['single', 'range'] as const) {
  it(`validates the closed ${kind} date field with the original model references`, () => {
    const start = dayjs('2020-12-31T16:37:59.456');
    const end = dayjs('2021-01-15T09:12:34.567');
    const model: [Dayjs, Dayjs] = [start, end];
    const calls: Array<{ value: Dayjs; keys: string[]; type: string; arity: number }> = [];
    function disabledDate(value: Dayjs, info: { type: string }) {
      calls.push({ value, keys: Object.keys(info), type: info.type, arity: arguments.length });
      return value !== start && (kind === 'single' || value !== end);
    }
    const common = { showWeek: true, locale: enUS.datePicker, disabledDate };
    const body = kind === 'single'
      ? render(DatePicker, { props: { ...common, value: start } }).body
      : render(RangePicker, { props: { ...common, value: model } }).body;

    expect(body).toContain('value="2020-12-31"');
    expect(body).not.toContain('aria-invalid="true"');
    expect(body).not.toContain('data-picker-popup');
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.every(call => call.value === start || kind === 'range' && call.value === end)).toBe(true);
    expect(calls.some(call => call.value === start)).toBe(true);
    if (kind === 'range') expect(calls.some(call => call.value === end)).toBe(true);
    for (const call of calls) {
      expect(call.keys).toEqual(['type']);
      expect(call.type).toBe('date');
      expect(call.arity).toBe(2);
    }
    expect(start.toISOString()).toBe('2020-12-31T16:37:59.456Z');
    expect(end.toISOString()).toBe('2021-01-15T09:12:34.567Z');
  });
}
