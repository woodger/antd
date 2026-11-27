import dayjs, { type Dayjs } from 'dayjs';
import { DatePicker, type DatePickerMultipleProps, type DatePickerProps } from '@woodger/antd';
import registry from '../../porting-registry';
import { render } from 'svelte/server';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  readMultipleBrowser, readMultipleInteractions, readMultipleMode, readMultipleServer
} from '../../browser/date-picker-multiple-reference';
import DatePickerMultipleFixtures, {
  type MultiplePickerProfile
} from '../../browser/fixtures/DatePickerMultipleFixtures.svelte';

const reference = readMultipleServer();
const customProfiles = ['render-tags', 'disabled-tags', 'same-label', 'renamed'];

/** Finds the readonly field and its value in both implementations' server HTML. */
function readEditor(body: string) {
  const input = Array.from(body.matchAll(/<input\s[^>]*>/g), ([tag]) => tag)
    .find(tag => tag.includes('-multiple-input'));
  if (!input) {
    throw Error('No SSR multiple picker editor');
  }

  return input;
}

/** Preserves the original label order, including the count for multiple dates. */
function readLabels(body: string) {
  return Array.from(body.matchAll(
    /<span[^>]+class="[^"]*-selection-item-content[^"]*"[^>]*>([^<]*)<\/span>/g
  ), ([, label]) => label);
}

/** React temporarily measures the count even with the complete list visible. The SSR check compares date tags. */
function datesOnly(labels: string[]) {
  return labels.filter(label => !label.startsWith('+'));
}

describe('DatePicker multiple package SSR', () => {
  it('pins all independent captures and preserves scalar and array prop contracts', () => {
    for (const record of [reference, readMultipleBrowser(), readMultipleInteractions(), readMultipleMode()]) {
      expect(record.revision).toBe(registry.upstream.revision);
      expect(record.archiveSha256).toBe(registry.upstream.archiveSha256);
      expect(record.passes[0]).toEqual(record.passes[1]);
    }
    expectTypeOf<DatePickerProps['value']>().toEqualTypeOf<Dayjs | null | undefined>();
    expectTypeOf<DatePickerMultipleProps['value']>().toEqualTypeOf<readonly Dayjs[] | null | undefined>();
    expectTypeOf<DatePickerMultipleProps['showTime']>().toEqualTypeOf<false | undefined>();
  });

  it('renders the public multiple component directly with array callback types', () => {
    const change = vi.fn((value: Dayjs[] | null, text: string[] | null) => [value, text]);
    const { body } = render(DatePicker<true>, {
      props: { multiple: true, defaultValue: [dayjs('2024-06-15')], onChange: change }
    });

    expect(readEditor(body)).toContain('value="2024-06-15"');
    expect(change).not.toHaveBeenCalled();
  });

  it('initializes a controlled empty single picker panel independently of its default value', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-06-19T12:00:00Z'));
      const { body } = render(DatePicker, {
        props: { open: true, value: null, defaultValue: dayjs('2001-02-03') }
      });

      expect(body).toContain('data-picker-date="2026-06-19"');
      expect(body).not.toContain('data-picker-date="2001-02-03"');
    }
    finally {
      vi.useRealTimers();
    }
  });

  const cases = reference.passes[0].packets.filter(packet =>
    packet.id !== 'datetime-runtime' && packet.id !== 'time-runtime');

  it.each(cases)('keeps SSR dates, labels and shell for $id', sample => {
    const profile: MultiplePickerProfile = {
      ...sample.options, id: sample.id, custom: customProfiles.includes(sample.id),
      empty: sample.id === 'controlled-empty' || sample.id === 'empty',
      nullable: sample.id === 'controlled-null',
      controlled: sample.id.startsWith('controlled-'),
      formatAll: sample.id === 'same-label'
    };
    const timer = vi.spyOn(globalThis, 'setTimeout');
    try {
      const { body } = render(DatePickerMultipleFixtures, { props: { profile, server: true } });
      const input = readEditor(body);
      const sourceInput = readEditor(sample.html);
      expect(input.match(/\bvalue="([^"]*)"/)?.[1]).toBe(sourceInput.match(/\bvalue="([^"]*)"/)?.[1]);
      expect(input).toContain('id="multiple-editor"');
      expect(input).toContain('name="multiple-date"');
      expect(input).toContain('aria-label="Book dates"');
      expect(input).toContain('book-editor');
      expect(input).toMatch(/\breadonly\b/i);
      expect(body).not.toContain('data-picker-popup');
      expect(timer).not.toHaveBeenCalled();
      expect(sample.lifecycle).toEqual([]);

      if (profile.custom) {
        const aliases = [...body.matchAll(/data-alias="(\d+)"/g)].map(match => Number(match[1]));
        expect(aliases).toEqual(sample.producers.map(producer => producer.valueIndex));
        expect([...body.matchAll(/data-closable="(true|false)"/g)].map(match => match[1] === 'true'))
          .toEqual(sample.producers.map(producer => producer.closable));
      }
      else if (profile.maxTagCount === 'responsive') {
        expect(datesOnly(readLabels(body))).toEqual(datesOnly(readLabels(sample.html)));
      }
      else {
        expect(readLabels(body)).toEqual(readLabels(sample.html));
      }
    }
    finally {
      timer.mockRestore();
    }
  });
});
