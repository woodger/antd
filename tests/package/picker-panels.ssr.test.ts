import type { Dayjs } from 'dayjs';
import { TimePicker, TimeRangePicker } from '@woodger/antd';
import type {
  DatePickerComponents, DatePickerMode, DatePickerPanel, TimePickerProps, TimeRangePickerProps
} from '@woodger/antd';
import registry from '@woodger/antd/porting/registry.json';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import PickerPanelFixtures, { type PickerPanelProfile } from '../browser/fixtures/PickerPanelFixtures.svelte';
import { readPickerComponentsServer, readPickerPanelsReference }
  from '../browser/picker-components-reference';

const openProfiles: PickerPanelProfile[] = [
  { id: 'datetime', slots: ['datetime'], datetime: true, open: true },
  { id: 'range', slots: ['date'], range: true, open: true },
  { id: 'time', slots: ['time'], time: true, open: true },
  { id: 'time-range', slots: ['time'], time: true, range: true, open: true }
];

describe('Custom picker panels package SSR', () => {
  it('publishes all eight replacement keys and retains time-only callback types by default', () => {
    type Slot = DatePickerPanel | undefined;
    expectTypeOf<DatePickerComponents['date']>().toEqualTypeOf<Slot>();
    expectTypeOf<DatePickerComponents['week']>().toEqualTypeOf<Slot>();
    expectTypeOf<DatePickerComponents['month']>().toEqualTypeOf<Slot>();
    expectTypeOf<DatePickerComponents['quarter']>().toEqualTypeOf<Slot>();
    expectTypeOf<DatePickerComponents['year']>().toEqualTypeOf<Slot>();
    expectTypeOf<DatePickerComponents['decade']>().toEqualTypeOf<Slot>();
    expectTypeOf<DatePickerComponents['time']>().toEqualTypeOf<Slot>();
    expectTypeOf<DatePickerComponents['datetime']>().toEqualTypeOf<Slot>();
    expectTypeOf<TimePickerProps['onPanelChange']>()
      .toEqualTypeOf<((value: Dayjs, mode: 'time') => void) | undefined>();
    expectTypeOf<TimeRangePickerProps<DatePickerMode>['onPanelChange']>().toEqualTypeOf<
      ((value: [Dayjs | null, Dayjs | null], modes: [DatePickerMode, DatePickerMode]) => void) | undefined
    >();
    const sources = [readPickerPanelsReference(), readPickerPanelsReference('panels-supplement')];
    for (const reference of sources) {
      expect(reference.revision).toBe(registry.upstream.revision);
      expect(reference.archiveSha256).toBe(registry.upstream.archiveSha256);
    }
  });

  it('renders the closed editor at SSR and leaves the replacement unmounted', () => {
    const { body } = render(PickerPanelFixtures, {
      props: { profile: { id: 'closed', slots: ['date'] }, server: true }
    });
    expect(body).toMatch(/<input\b[^>]*\bid="start"[^>]*\bvalue="2024-06-15"/);
    expect(body).not.toContain('data-custom-panel');
    const source = readPickerComponentsServer().passes[0];
    const openSource = source.packets.filter(packet => packet.profile.open);
    expect(openSource).toHaveLength(2);
    for (const packet of openSource) {
      const inputProducers = packet.profile.range ? ['input', 'input'] : ['input'];
      expect(packet.producers.map(([kind]) => kind)).toEqual(inputProducers);
      expect(packet.html).not.toContain('data-custom-panel');
      expect(packet.lifecycle).toEqual([]);
    }
  });

  it('keeps the original footer arguments when using the built-in time panel', () => {
    const single = createRawSnippet<[]>((...args) => ({
      render: () => `<span data-time-footer="${args.length}"></span>`
    }));
    const range = createRawSnippet<['time']>((mode) => ({
      render: () => `<span data-range-footer="${mode()}"></span>`
    }));

    const singleBody = render(TimePicker, { props: { open: true, renderExtraFooter: single } }).body;
    const rangeBody = render(TimeRangePicker, { props: { open: true, renderExtraFooter: range } }).body;
    expect(singleBody).toContain('data-time-footer="0"');
    expect(rangeBody).toContain('data-range-footer="time"');
  });

  it.each(openProfiles)('renders the open shell of $id without starting resources', profile => {
    const timer = vi.spyOn(globalThis, 'setTimeout');
    try {
      const { body } = render(PickerPanelFixtures, { props: { profile, server: true } });
      const panels = body.match(new RegExp(`data-custom-panel="${profile.slots[0]}"`, 'g'));
      expect(panels).toHaveLength(profile.range && !profile.time ? 2 : 1);
      expect(body).toContain('data-picker-popup');
      expect(body).not.toMatch(/<input\b[^>]*\b(components|nexticon)=/);
      expect(timer).not.toHaveBeenCalled();
    }
    finally {
      timer.mockRestore();
    }
  });
});
