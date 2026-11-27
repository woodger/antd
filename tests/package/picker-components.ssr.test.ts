import {
  type DatePickerComponents, type DatePickerProps, type RangePickerProps, type TimePickerProps,
  type TimeRangePickerProps
} from '@woodger/antd';
import registry from '../porting-registry';
import { render } from 'svelte/server';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import PickerComponentsFixtures from '../browser/fixtures/PickerComponentsFixtures.svelte';
import { readPickerComponentsBrowser, readPickerComponentsServer }
  from '../browser/picker-components-reference';

const reference = readPickerComponentsServer();

/** Finds native fields by id and excludes buttons and calendar inputs. */
function editors(html: string) {
  const fields = html.matchAll(/<input\b[^>]+\bid="(?:start|end)"[^>]*>/g);

  return Array.from(fields, ([field]) => ({
    id: field.match(/\bid="([^"]*)"/)?.[1],
    name: field.match(/\bname="([^"]*)"/)?.[1],
    placeholder: field.match(/\bplaceholder="([^"]*)"/)?.[1],
    value: field.match(/\bvalue="([^"]*)"/)?.[1]
  }));
}

describe('Picker component customization package SSR', () => {
  it('exports shared slot types and retains the native input bindings', () => {
    type Components = DatePickerComponents | undefined;
    expectTypeOf<DatePickerProps['components']>().toEqualTypeOf<Components>();
    expectTypeOf<RangePickerProps['components']>().toEqualTypeOf<Components>();
    expectTypeOf<TimePickerProps['components']>().toEqualTypeOf<Components>();
    expectTypeOf<TimeRangePickerProps['components']>().toEqualTypeOf<Components>();
    expectTypeOf<RangePickerProps['startInput']>().toEqualTypeOf<HTMLInputElement | undefined>();
    expectTypeOf<TimeRangePickerProps['endInput']>().toEqualTypeOf<HTMLInputElement | undefined>();

    const sources = [
      reference, readPickerComponentsBrowser('browser'), readPickerComponentsBrowser('editors')
    ];
    for (const source of sources) {
      expect(source.revision).toBe(registry.upstream.revision);
      expect(source.archiveSha256).toBe(registry.upstream.archiveSha256);
    }
    expect(reference.passes[1]).toEqual(reference.passes[0]);
    expect(reference.passes[0].diagnostics).toEqual([]);
  });

  it.each(reference.passes[0].packets)('renders the custom editors for $profile.id', packet => {
    const timer = vi.spyOn(globalThis, 'setTimeout');
    try {
      const { body } = render(PickerComponentsFixtures, {
        props: { profile: { ...packet.profile, input: true }, server: true }
      });
      expect(editors(body)).toEqual(editors(packet.html));
      const customEditors = body.match(/data-editor=/g);
      expect(customEditors).toHaveLength(packet.profile.range ? 2 : 1);
      expect(packet.lifecycle).toEqual([]);
      expect(timer).not.toHaveBeenCalled();
    }
    finally {
      timer.mockRestore();
    }
  });

  it.each([false, true])('serializes textarea content with nativeSlot=%s', nativeSlot => {
    const { body } = render(PickerComponentsFixtures, {
      props: {
        profile: {
          id: 'open-time-range-textarea', range: true, time: true, input: true,
          editor: 'textarea', nativeSlot, open: true, button: true
        },
        server: true
      }
    });

    expect(body).toMatch(/<textarea\b[^>]*\bid="start"[^>]*>13:10:18<\/textarea>/);
    expect(body).toMatch(/<textarea\b[^>]*\bid="end"[^>]*>14:26:40<\/textarea>/);
    expect(body).toMatch(/<button\b[^>]*type="button"[^>]*data-custom-confirm[^>]*>OK<\/button>/);
  });
});
