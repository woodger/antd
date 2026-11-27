import type { Locator, Page } from '@playwright/test';
import { readPickerPanelsReference } from './picker-components-reference';
import type { PickerPanelProfile } from './fixtures/PickerPanelFixtures.svelte';
import { expect, test } from './test';

test.use({ timezoneId: 'UTC' });
const references = [readPickerPanelsReference(), readPickerPanelsReference('panels-supplement')];

async function openFixture(page: Page, profile: PickerPanelProfile) {
  const query = new URLSearchParams({ fixture: 'picker-panels', profile: JSON.stringify(profile) });
  await page.clock.setFixedTime(new Date('2024-06-19T16:00:00Z'));
  await page.goto(`/?${query}`);
}

async function act(page: Page, popup: Locator, action: string, multiple?: boolean) {
  if (action === 'start' || action === 'end' || action === 'outside') {
    const target = action === 'start' && multiple ? '[data-panel-owner] > .ant-picker' : `#${action}`;
    await page.locator(target).click();
    return;
  }
  if (action === 'accept' || action === 'toggle') {
    await page.locator(`#${action}`).evaluate((control: HTMLButtonElement) => control.click());
    return;
  }
  if (action === 'confirm') {
    await popup.getByRole('button', { name: 'OK', exact: true }).click();
    return;
  }
  if (action === 'mode-keyboard') {
    await popup.locator('[data-action="mode"]').first().press('Enter');
    return;
  }
  if (action === 'hover-year') {
    await popup.locator('.ant-picker-year-panel td').nth(5).hover();
    return;
  }
  const second = action.endsWith('-second');
  const key = second ? action.slice(0, -7) : action;
  await popup.locator(`[data-action="${key}"]`).nth(second ? 1 : 0).click();
}

/** A solitary Native callback additionally reports calendar change source. */
function comparableEvents(events: unknown[][], profile: PickerPanelProfile) {
  return events.filter(([name]) => name !== 'restriction').map(event => {
    return !profile.range && event[0] === 'calendar' ? event.slice(0, 3) : event;
  });
}

async function readEvents(page: Page): Promise<unknown[][]> {
  const text = await page.locator('#panel-events').textContent();
  return JSON.parse(text ?? '[]');
}

/** Compares only the limitations that the custom panel itself has requested. */
function explicitRestrictions(events: unknown[][]) {
  return events.flatMap(([name], index) => name === 'check' ? events.slice(index - 2, index) : []);
}

test('the two official custom panel captures agree', () => {
  for (const reference of references) {
    expect(reference.passes[1]).toEqual(reference.passes[0]);
  }
});

for (const { profile, steps, unmounted, errors } of references.flatMap(item => item.passes[0])) {
  test(`matches the official replacement panel flow for ${profile.id}`, async ({ page }) => {
    expect(errors).toEqual([]);
    expect(unmounted.panels).toEqual([]);
    await openFixture(page, profile);
    const popup = page.locator('[data-picker-popup]:visible');
    const editors = page.locator('[data-panel-owner] input');
    await expect(editors).toHaveCount(profile.range ? 2 : 1);
    const originals = await editors.elementHandles();

    try {
      for (const { action, state } of steps) {
        await test.step(action, async () => {
          if (action !== 'initial') {
            await act(page, popup, action, profile.multiple);
          }
          await expect(popup).toHaveCount(state.popup ? 1 : 0);
          const panels = popup.locator('[data-panel-state]');
          const expected = state.panels.map(({ keys: _keys, ...panel }) => panel);
          await expect.poll(() => panels.evaluateAll(nodes => nodes.map(node => ({
            ...JSON.parse(node.getAttribute('data-panel-state') ?? '{}'),
            parent: [...(node.parentElement?.classList ?? [])]
              .filter(name => !name.startsWith('s-') && !name.startsWith('svelte-')).join(' ')
          })))).toEqual(expected);
          if (state.footer) {
            await expect(popup.locator('[data-footer-mode]')).toHaveText(state.footer);
          }
          for (const fallback of state.fallback) {
            const [className] = fallback.split(' ');
            await expect(popup.locator(`.${className}`).first()).toBeVisible();
          }
          for (let index = 0; index < originals.length; index += 1) {
            const input = editors.nth(index);
            await expect(input).toHaveValue(state.editors[index].value);
            expect(await input.evaluate((node, original) => node === original, originals[index]))
              .toBe(state.editors[index].same);
          }
          const events = comparableEvents(state.events, profile);
          await expect.poll(async () => comparableEvents(await readEvents(page), profile))
            .toEqual(events);
          if (action === 'inspect') {
            expect(explicitRestrictions(await readEvents(page)))
              .toEqual(explicitRestrictions(state.events));
          }
        });
      }
    }
    finally {
      for (const original of originals) await original.dispose();
    }
  });
}

test('supports pointer and keyboard focus with live snippets and navigation icons', async ({ page }) => {
  await openFixture(page, { id: 'keyboard', slots: ['date'], icons: true });
  const start = page.getByRole('combobox', { name: 'Start' });
  const popup = page.locator('[data-picker-popup]:visible');
  const arrow = popup.getByRole('button', { name: 'Navigate' });
  const initial = await start.elementHandle();

  try {
    await start.press('ArrowDown');
    await expect(arrow).toBeFocused();
    await expect(popup.locator('[data-origin-cell]')).toHaveText('Origin');
    await expect(popup.locator('[data-custom-nav]')).toHaveText('›');
    const panel = popup.locator('[data-custom-panel]');
    const dom = await panel.elementHandle();
    try {
      await arrow.press('Enter');
      expect(await panel.evaluate((node, original) => node === original, dom)).toBe(true);
      await expect(arrow).toBeFocused();
      await arrow.press('Escape');
      await expect(start).toBeFocused();
      await expect(popup).toHaveCount(0);
    }
    finally {
      await dom.dispose();
    }

    await start.click();
    await page.locator('#toggle').evaluate((button: HTMLButtonElement) => button.click());
    await expect(popup.getByRole('button', { name: 'Next month' })
      .locator('[data-custom-nav]')).toHaveText('›');
    const previous = popup.getByRole('button', { name: 'Previous month' });
    await expect(previous.locator('span')).toHaveCount(0);
    expect(await start.evaluate((node, original) => node === original, initial)).toBe(true);
  }
  finally {
    await initial.dispose();
  }
});

for (const range of [false, true]) {
  test(`keeps disabled dates in the built-in calendar after a time slot transition range=${range}`,
    async ({ page }) => {
      await openFixture(page, { id: 'time-fallback-limits', time: true, range,
        slots: ['time'], blockedYear: 2025 });
      await page.locator('#start').click();
      const popup = page.locator('[data-picker-popup]:visible');
      await popup.getByRole('button', { name: 'Year', exact: true }).press('Enter');

      const calendar = popup.locator('.ant-picker-year-panel');
      await expect(calendar.getByRole('button', { name: '2025', exact: true })).toBeDisabled();
      await expect(calendar.getByRole('button', { name: '2024', exact: true })).toBeEnabled();
    });
}
