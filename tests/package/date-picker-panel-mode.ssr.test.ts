import dayjs, { type Dayjs } from 'dayjs';
import {
  DatePicker, RangePicker, type DatePickerMode, type DatePickerProps,
  type DatePickerMultipleProps, type RangePickerMode, type RangePickerProps
} from '@woodger/antd';
import registry from '../porting-registry';
import { render } from 'svelte/server';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { readPickerModeServer } from '../browser/date-picker-panel-mode-reference';
import DatePickerPanelModeFixtures from '../browser/fixtures/DatePickerPanelModeFixtures.svelte';

const reference = readPickerModeServer();

/** Извлекает поля по id или по классу React multiple editor без id. */
function inputValues(html: string) {
  const inputs = html.matchAll(/<input\b[^>]*>/g);
  return Array.from(inputs, ([tag]) => tag)
    .filter(tag => /\bid="mode-(?:start|end)"|\bant-picker-multiple-input\b/.test(tag))
    .map(tag => tag.match(/\bvalue="([^"]*)"/)?.[1] ?? '');
}

describe('DatePicker panel mode package SSR', () => {
  it('supports one mode on DatePicker and a readonly tuple on RangePicker', () => {
    expectTypeOf<DatePickerProps['mode']>().toEqualTypeOf<DatePickerMode | undefined>();
    expectTypeOf<DatePickerMultipleProps['mode']>().toEqualTypeOf<DatePickerMode | undefined>();
    expectTypeOf<RangePickerProps['mode']>().toEqualTypeOf<Readonly<RangePickerMode> | undefined>();
    expectTypeOf<DatePickerProps['onPanelChange']>()
      .toEqualTypeOf<((value: Dayjs, mode: DatePickerMode) => void) | undefined>();
    expect(reference.revision).toBe(registry.upstream.revision);
    expect(reference.archiveSha256).toBe(registry.upstream.archiveSha256);
    expect(reference.passes[1]).toEqual(reference.passes[0]);
    expect(reference.passes[0].diagnostics).toEqual([]);
  });

  it.each(reference.passes[0].packets)('renders public input values for $profile.id', packet => {
    const timer = vi.spyOn(globalThis, 'setTimeout');
    try {
      const { body } = render(DatePickerPanelModeFixtures, {
        props: { profile: packet.profile, server: true }
      });
      expect(inputValues(body)).toEqual(inputValues(packet.html));
      expect(packet.lifecycle).toEqual([]);
      expect(packet.footer).toEqual([]);
      expect(body).not.toMatch(/<input\b[^>]*\bmode=/);
      expect(timer).not.toHaveBeenCalled();
      if (packet.profile.open) {
        const mode = Array.isArray(packet.profile.mode)
          ? packet.profile.mode[0] : packet.profile.mode;
        expect(body).toContain('data-picker-popup');
        expect(body).toContain(`ant-picker-${mode}-panel`);
      }
      else {
        expect(body).not.toContain('data-picker-popup');
      }
    }
    finally {
      timer.mockRestore();
    }
  });

  it('uses an initial mode without replacing the selected value', () => {
    const selected = dayjs('2024-02-04');
    const onPanelChange = vi.fn();
    const onChange = vi.fn();
    const { body } = render(DatePicker, {
      props: { id: 'mode-start', defaultValue: selected, mode: 'year', open: true,
        onPanelChange, onChange }
    });
    expect(inputValues(body)).toEqual(['2024-02-04']);
    expect(body).toContain('ant-picker-year-panel');
    expect(onPanelChange).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('renders a range with a readonly mode tuple directly from the package', () => {
    const mode = ['time', 'year'] as const;
    const { body } = render(RangePicker, { props: { mode, open: true, showTime: true } });
    expect(body).toContain('ant-picker-time-panel-column');
    expect(body).not.toContain('ant-picker-year-panel');
  });
});
