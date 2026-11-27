import {
  DatePicker, generatePicker, RangePicker, TimePicker,
  type DatePickerMode, type DatePickerPanelContext,
  type DatePickerTimeProps, type TimePickerMultipleProps, type TimeRangePickerProps
} from '@woodger/antd';
import registry from '../porting-registry';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it, vi } from 'vitest';
import type { ComponentProps } from 'svelte';
import GeneratedPickerFixtures from '../browser/fixtures/GeneratedPickerFixtures.svelte';
import {
  opaqueDate, opaquePickerAdapter, type OpaquePickerDate
} from '../browser/fixtures/opaque-picker-date-adapter';
import { readPickerGeneratorServer } from '../browser/date-picker-generator-reference';

/** Reads values of same-named fields independently of HTML attribute order. */
function submittedValues(html: string) {
  return [...html.matchAll(/<input\b[^>]*\bname="opaque"[^>]*>/g)]
    .map(match => /\bvalue="([^"]*)"/.exec(match[0])?.[1] ?? '');
}

it('exports an adapter-bound picker family with opaque values at every public boundary', () => {
  const Picker = DatePicker.generatePicker(opaquePickerAdapter);

  expect(DatePicker.generatePicker).toBe(generatePicker);
  expect(DatePicker.RangePicker).toBe(RangePicker);
  expect(typeof Picker.WeekPicker).toBe('function');
  expect(typeof Picker.MonthPicker).toBe('function');
  expect(typeof Picker.YearPicker).toBe('function');
  expect(typeof Picker.TimePicker).toBe('function');
  expect(typeof Picker.RangePicker).toBe('function');
  expect('QuarterPicker' in Picker).toBe(false);

  expectTypeOf<ComponentProps<typeof Picker>['value']>()
    .toEqualTypeOf<OpaquePickerDate | null | undefined>();
  expectTypeOf<ComponentProps<typeof Picker<true>>['value']>()
    .toEqualTypeOf<readonly OpaquePickerDate[] | null | undefined>();
  expectTypeOf<ComponentProps<typeof Picker>['picker']>().toEqualTypeOf<
    DatePickerTimeProps['picker'] | 'date' | 'week' | 'month' | 'quarter' | 'year' | undefined
  >();
  expectTypeOf<ComponentProps<typeof Picker.TimePicker>['value']>()
    .toEqualTypeOf<OpaquePickerDate | null | undefined>();
  expectTypeOf<ComponentProps<typeof TimePicker>['multiple']>().toEqualTypeOf<false | undefined>();
  expectTypeOf<ComponentProps<typeof Picker.TimePicker<true>>['value']>()
    .toEqualTypeOf<readonly OpaquePickerDate[] | null | undefined>();
  expectTypeOf<ComponentProps<typeof Picker.RangePicker>['value']>()
    .toEqualTypeOf<[OpaquePickerDate | null | undefined, OpaquePickerDate | null | undefined]
      | null | undefined>();
  expectTypeOf<DatePickerPanelContext<OpaquePickerDate>['generateConfig']>()
    .toEqualTypeOf<typeof opaquePickerAdapter>();
});

it('renders the generated week, year and time range panels from opaque values', () => {
  const Picker = generatePicker(opaquePickerAdapter);
  const date = opaqueDate('2024-06-15T13:10:18Z');
  const end = opaqueDate('2024-06-23T14:26:40Z');
  const props = { defaultValue: date, open: true, format: 'YYYY-MM-DD' };

  const week = render(Picker.WeekPicker, { props }).body;
  const year = render(Picker.YearPicker, { props }).body;
  const quarter = render(Picker, { props: { ...props, picker: 'quarter' } }).body;
  const RangePicker = Picker.RangePicker;
  const timeProps: TimeRangePickerProps<'time', OpaquePickerDate> & { picker: 'time'; } = {
    picker: 'time', name: 'opaque', defaultValue: [date, end], open: true, format: 'HH:mm:ss'
  };
  const time = render<typeof RangePicker, typeof timeProps>(RangePicker, { props: timeProps }).body;

  expect(week).toContain('ant-picker-week-panel');
  expect(year).toContain('ant-picker-year-panel');
  expect(quarter).toContain('ant-picker-quarter-panel');
  expect(time).toContain('ant-picker-time-panel');
  expect(submittedValues(time)).toEqual(['13:10:18', '14:26:40']);
});

it('renders the clock of a generated DatePicker with its field format and calendar footer', () => {
  const Picker = generatePicker(opaquePickerAdapter);
  const renderExtraFooter = createRawSnippet<[DatePickerMode]>(mode => ({
    render: () => `<strong data-footer-mode>${mode()}</strong>`
  }));
  const props: DatePickerTimeProps<OpaquePickerDate> = {
    picker: 'time', open: true, name: 'opaque',
    defaultValue: opaqueDate('2024-06-15T13:10:18Z'),
    format: 'HH:mm:ss', showTime: { format: 'HH:mm' }, renderExtraFooter
  };
  const { body } = render(Picker, { props });

  expect(submittedValues(body)).toEqual(['13:10:18']);
  expect(body).toContain('data-footer-mode>time</strong>');
  expect(body.match(/class="ant-picker-time-panel-column\b/g)).toHaveLength(2);
});

it('renders the same multiple clock form value through both generated entrypoints', () => {
  const Picker = generatePicker(opaquePickerAdapter);
  const props: TimePickerMultipleProps<OpaquePickerDate> = {
    multiple: true,
    name: 'opaque',
    defaultValue: [opaqueDate('2024-06-15T13:10:18Z'), opaqueDate('2024-06-23T14:26:40Z')],
    defaultOpen: true
  };
  const clock = render(Picker.TimePicker<true>, { props }).body;
  const root = render(Picker<true>, { props: {
    multiple: true, picker: 'time', name: props.name,
    defaultValue: props.defaultValue, defaultOpen: props.defaultOpen
  } }).body;

  for (const body of [root, clock]) {
    expect(submittedValues(body)).toEqual(['13:10:18,14:26:40']);
    expect(body.match(/data-picker-selection-tag\b/g)).toHaveLength(2);
    expect(body).toContain('ant-picker-time-panel');
    expect(body).toContain('ant-picker-ok');
    expect(body).not.toContain('data-picker-current');
  }
});

const ssr = readPickerGeneratorServer();
const original = ssr.passes[0];

it('preserves the pinned source SSR passes with their complete HTML and diagnostics', () => {
  expect(ssr.revision).toBe(registry.upstream.revision);
  expect(ssr.archiveSha256).toBe(registry.upstream.archiveSha256);
  expect(ssr.passes).toEqual([original, original]);
  expect(original.packets).toHaveLength(7);
  expect(original.diagnostics).toEqual([]);
});

it.each(original.packets)('renders $profile.id through the generated public picker without timers',
  ({ profile, html, events, producers }) => {
    const timer = vi.spyOn(globalThis, 'setTimeout');

    try {
      const { body } = render(GeneratedPickerFixtures, {
        props: { profile: profile.id === 'date' ? 'editor' : profile.id }
      });

      expect(events).toEqual([]);
      expect(body).toContain('id="generated-events">[]</output>');
      expect(timer).not.toHaveBeenCalled();
      if (profile.id === 'multiple') {
        expect(body).toContain('data-picker-selection-tag');
        expect(submittedValues(body)).toEqual(['2024-06-15,2024-06-23']);
        expect(html).toContain('2024-06-15');
        expect(html).toContain('2024-06-23');
      }
      else {
        expect(submittedValues(body)).toEqual(producers.map(([, , value]) => value));
        expect(submittedValues(body)).toEqual(submittedValues(html));
      }
      if (profile.id === 'open-range') {
        expect(body).toContain('data-opaque-panel');
        expect(body).toContain('data-adapter-same="true"');
        expect(html).not.toContain('data-opaque-panel');
      }
    }
    finally {
      timer.mockRestore();
    }
  }
);
