import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import registry from '../porting-registry';
import reference from '../browser/fixtures/ant-design-datetime-config-reference.json';
import layered from '../browser/fixtures/ant-design-picker-clock-options-reference.json';
import DatetimeConfigFixtures from '../browser/fixtures/DatetimeConfigFixtures.svelte';
import PickerClockOptionsFixtures from '../browser/fixtures/PickerClockOptionsFixtures.svelte';

/** Читает значения полей пикера по id без браузерного DOM. */
function pickerFields(html: string) {
  const values: string[][] = [];
  for (const [element] of html.matchAll(/<input\b[^>]*>/g)) {
    const id = /\bid="(start|end)"/.exec(element)?.[1];
    if (id) {
      const value = /\bvalue="([^"]*)"/.exec(element)?.[1] ?? '';
      values.push([id, value]);
    }
  }
  return values;
}

describe('datetime configuration public package SSR', () => {
  it('pins the official source revision and archive', () => {
    expect(reference.reference).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256
    });
  });

  for (const sample of reference.cases) {
    it(`renders the ${sample.name} format and columns without browser effects`, () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(reference.reference.now));
      try {
        const { body } = render(DatetimeConfigFixtures, { props: { preset: sample.name } });
        const columns = body.match(/class="ant-picker-time-panel-column"/g) ?? [];
        const literal = sample.name === 'literal' || sample.name === 'literal-range';

        for (const value of sample.metrics.inputs) expect(body).toContain(`value="${value}"`);
        expect(columns).toHaveLength(literal ? 3 : sample.metrics.columns.length);
        expect(body).toContain('ant-picker-time-panel');
        expect(body).not.toContain('[object Object]');
        expect(vi.getTimerCount()).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });
  }
});

describe('merged clock settings in the public package', () => {
  it('pins the independent layered clock capture to the upstream archive', () => {
    expect(layered.reference).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256,
      repeated: 2
    });
  });

  for (const sample of layered.cases) {
    it(`renders ${sample.profile.id} with resolved clock settings and no browser effects`, () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(layered.reference.now));
      try {
        const { body } = render(PickerClockOptionsFixtures, {
          props: { preset: sample.profile.id, defaultOpen: true }
        });
        const initial = sample.steps[0].state;
        const opened = sample.steps[1].state;
        const columns = body.match(/class="ant-picker-time-panel-column"/g) ?? [];

        expect(pickerFields(body)).toEqual(initial.fields);
        expect(columns).toHaveLength(opened.columns.length);
        expect(body).not.toMatch(/\b(showHour|showMinute|hourStep|minuteStep|changeOnScroll)=/i);
        expect(vi.getTimerCount()).toBe(0);
      }
      finally {
        vi.useRealTimers();
      }
    });
  }
});
