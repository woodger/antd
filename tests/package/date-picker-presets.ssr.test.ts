import dayjs, { type Dayjs } from 'dayjs';
import { render } from 'svelte/server';
import type { Snippet } from 'svelte';
import { expect, expectTypeOf, it, vi } from 'vitest';
import type {
  DatePickerPreset, DatePickerProps, RangePickerPreset, RangePickerProps,
  TimePickerPreset, TimePickerProps
} from 'antd-svelte';
import Case from '../browser/fixtures/DatePickerPresetsCase.svelte';
import { datePickerPresetSamples } from '../browser/date-picker-presets-cases.mjs';
import type { DatePickerPresetCapture } from '../browser/date-picker-presets-metrics.mjs';

for (const sample of datePickerPresetSamples) {
  it(`keeps closed preset SSR definitions lazy and browser-free ${sample.id}`, () => {
    vi.useFakeTimers();
    const resource = vi.fn(() => {
      throw Error('Closed DatePicker presets SSR must remain DOM-free');
    });
    for (const name of ['getComputedStyle', 'requestAnimationFrame', 'queueMicrotask']) {
      vi.stubGlobal(name, resource);
    }
    for (const name of ['ResizeObserver', 'MutationObserver', 'MessageChannel']) {
      vi.stubGlobal(name, class { constructor() { resource(); } });
    }
    const timeout = vi.spyOn(globalThis, 'setTimeout');
    const interval = vi.spyOn(globalThis, 'setInterval');
    const warn = vi.spyOn(console, 'warn');
    const error = vi.spyOn(console, 'error');
    try {
      expect(typeof window).toBe('undefined');
      expect(typeof document).toBe('undefined');
      const capture: DatePickerPresetCapture = {};
      const rendered = render(Case, { props: { sample, capture } });
      const input = /<input\b[^>]*>/.exec(rendered.body)?.[0];
      expect(input).toBeTruthy();
      expect(input).toContain('id="preset-field"');
      expect(input).toContain('aria-expanded="false"');
      expect(input).toContain('value="' + (sample.initialValue ? dayjs(sample.initialValue).format(sample.format) : '') + '"');
      expect(input).not.toMatch(/\s(?:presets|previewValue)(?:=|\s|>)/i);
      expect(rendered.body).not.toMatch(/<div\b[^>]*\bdata-picker-popup(?:[\s=>])/);
      expect(rendered.body).not.toMatch(/<div\b[^>]*\bdata-picker-presets(?:[\s=>])/);
      expect(rendered.body).not.toContain('data-preset-label=');
      expect(typeof rendered.head).toBe('string');
      expect(capture.read).toBeTypeOf('function');
      expect(capture.readRefs).toBeTypeOf('function');
      const owner = capture.read!();
      expect(owner.alive).toBe(false);
      expect(owner.open).toBe(false);
      expect(owner.preview).toBe(sample.preview);
      expect(owner.value.temporal?.iso ?? null)
        .toBe(sample.initialValue ? dayjs(sample.initialValue).toISOString() : null);
      expect(owner.lazyCalls).toEqual([]);
      expect(owner.callbackInvocations).toEqual([]);
      expect(owner.events).toEqual([]);
      expect(owner.rawEvents).toEqual([]);
      expect(owner.callbackDates).toEqual([]);
      expect(owner.lifecycle).toEqual([]);
      expect(owner.bodyActivity).toEqual([]);
      // disabledDate остаётся настоящим pure producer; его render multiplicity не подменяется.
      expect(owner.calls.every(call => (call as { kind: string }).kind === 'disabledDate')).toBe(true);
      expect(capture.readRefs!()).toEqual({ control: null, root: null, owner: null });
      expect(resource).not.toHaveBeenCalled();
      expect(timeout).not.toHaveBeenCalled();
      expect(interval).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
      expect(warn).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    } finally {
      timeout.mockRestore();
      interval.mockRestore();
      warn.mockRestore();
      error.mockRestore();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });
}

it('keeps single preset types distinct from range tuples and compatible with time presets', () => {
  expectTypeOf<DatePickerProps['presets']>()
    .toEqualTypeOf<readonly DatePickerPreset[] | undefined>();
  expectTypeOf<DatePickerPreset['label']>().toEqualTypeOf<string | Snippet>();
  expectTypeOf<DatePickerPreset['value']>().toEqualTypeOf<Dayjs | (() => Dayjs)>();
  expectTypeOf<RangePickerProps['presets']>()
    .toEqualTypeOf<readonly RangePickerPreset[] | undefined>();
  expectTypeOf<TimePickerProps['presets']>()
    .toEqualTypeOf<readonly TimePickerPreset[] | undefined>();
  expectTypeOf<DatePickerProps['previewValue']>().toEqualTypeOf<false | 'hover' | undefined>();
  const single: DatePickerPreset = { label: 'Single', value: dayjs('2024-06-12') };
  const lazy: DatePickerPreset = { label: 'Lazy', value: () => dayjs('2024-06-13') };
  const pair: RangePickerPreset = {
    label: 'Pair', value: [dayjs('2024-06-12'), dayjs('2024-06-13')]
  };
  const invalidTuple: DatePickerPreset = {
    label: 'Wrong tuple',
    // @ts-expect-error single DatePicker presets do not accept range tuples
    value: [dayjs('2024-06-12'), dayjs('2024-06-13')]
  };
  const invalidLazy: DatePickerPreset = {
    label: 'Wrong factory',
    // @ts-expect-error a single preset factory returns one Dayjs, not a tuple
    value: () => [dayjs('2024-06-12'), dayjs('2024-06-13')]
  };

  expect(dayjs.isDayjs(single.value)).toBe(true);
  expect(typeof lazy.value).toBe('function');
  expect(Array.isArray(pair.value)).toBe(true);
  expect(invalidTuple.label).toBe('Wrong tuple');
  expect(invalidLazy.label).toBe('Wrong factory');
});
