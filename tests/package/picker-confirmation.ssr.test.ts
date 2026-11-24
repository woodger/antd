import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import registry from '@woodger/antd/porting/registry.json';
import PickerConfirmationFixtures from '../browser/fixtures/PickerConfirmationFixtures.svelte';
import reference from '../browser/fixtures/ant-design-picker-confirmation-reference.json';

it('uses the pinned Ant Design archive for the recorded confirmation sequences', () => {
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    repeated: 2
  });
});

for (const sample of reference.cases) {
  const opened = sample.steps[1];
  // SSR открывает начальную границу; сценарии с фокусом end проверяются в Chromium.
  if (opened.action !== 'start') continue;

  it(`renders the initial OK state for ${sample.profile.id} without browser effects`, () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(reference.reference.now));
    try {
      const { body } = render(PickerConfirmationFixtures, {
        props: { preset: sample.profile.id, open: true }
      });
      const ok = /<li class="ant-picker-ok">\s*(?:<!--.*?-->\s*)*<button\b([^>]*)>/s.exec(body);

      expect(ok).toBeTruthy();
      expect(/\bdisabled(?:[\s=]|$)/.test(ok?.[1] ?? '')).toBe(opened.state.okDisabled);
      expect(body).toMatch(/aria-label="Picker confirmation events">(?:<!--.*?-->)*\[\]/s);
      expect(vi.getTimerCount()).toBe(0);
    }
    finally {
      vi.useRealTimers();
    }
  });
}
