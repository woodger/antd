import type { Locator, Page } from '@playwright/test';
import { expect, test } from './test';
import {
  comparablePanelModeEvents, readPickerModeReference, type PickerModeAction, type PickerModeState
} from './date-picker-panel-mode-reference';
import type { PickerModeProfile } from './fixtures/DatePickerPanelModeFixtures.svelte';

const popupSelector = '[data-picker-popup]';
const rootSelector = '[data-mode-owner] > .ant-picker';

/** Mounts the same initial dates with public props and fixed local time. */
async function openFixture(page: Page, profile: PickerModeProfile) {
  await page.clock.setFixedTime(new Date('2024-06-19T16:00:00Z'));
  await page.goto(`/?fixture=date-picker-panel-mode&profile=${encodeURIComponent(JSON.stringify(profile))}`);

  const owner = page.locator(rootSelector);
  await expect(owner).toBeVisible();
  return owner;
}

/** An external mode change doesn’t translate the focus into the test control. */
async function setOwnerValue(control: Locator, value: string) {
  await control.evaluate((element: HTMLInputElement, next) => {
    element.value = next;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

/** Repeats actions on the visible panel and two native fields. */
async function perform(page: Page, owner: Locator, action: PickerModeAction, multiple = false) {
  const popup = page.locator(popupSelector);
  if (Array.isArray(action)) {
    if (action[0] === 'mode') {
      await setOwnerValue(page.locator('#owner-mode'), JSON.stringify(action[1]));
    }
    else {
      await setOwnerValue(page.locator('#owner-view'), action[1]);
    }
  }
  else if (action === 'start' || action === 'end') {
    if (multiple) {
      await owner.click({ position: { x: 5, y: 8 } });
    }
    else {
      await owner.locator('input').nth(action === 'end' ? 1 : 0).click();
    }
  }
  else if (action === 'cell' || action === 'first-cell') {
    const cells = popup.locator('td.ant-picker-cell-in-view button[data-picker-date]:enabled');
    await cells.nth(action === 'first-cell' ? 0 : 3).click();
  }
  else if (action === 'year-header') {
    await popup.locator('.ant-picker-header-view button').last().click();
  }
  else if (action === 'second-month-header') {
    await popup.locator('.ant-picker-panel').nth(1).locator('.ant-picker-month-btn').click();
  }
  else if (action === 'advance') {
    await popup.locator('.ant-picker-header-super-next-btn').last().click();
  }
  else if (action === 'hour') {
    await popup.getByRole('button', { name: 'hour 15', exact: true }).click();
  }
  else if (action === 'ok') {
    await popup.getByRole('button', { name: 'OK', exact: true }).click();
  }
  else {
    await page.locator('#outside').click();
  }
}

/** Checks the mode, header, number of panels and time columns. */
async function assertPanels(popup: Locator, expected: PickerModeState['panels']) {
  if (!expected.length) {
    await expect(popup).toBeHidden();
    return;
  }
  await expect(popup).toBeVisible();
  const panels = popup.locator('.ant-picker-panel');
  await expect(panels).toHaveCount(expected.length);
  for (const [index, state] of expected.entries()) {
    const panel = panels.nth(index);
    const panelClasses = state.class.trim().split(/\s+/).join('.');
    await expect(panel.locator(`.${panelClasses}`)).toBeVisible();
    const header = panel.locator('.ant-picker-header-view').first();
    await expect(header).toHaveText(state.header ?? '');
    if (state.navigation) {
      const directions = panel.locator('button[class*="-header-"]');
      await expect(panel.locator('td.ant-picker-cell-disabled')).toHaveCount(state.disabled);
      expect(await directions.evaluateAll(buttons => buttons.map(button => [
        button.getAttribute('aria-label'), (button as HTMLButtonElement).disabled
      ]))).toEqual(state.navigation);
    }
    if (state.columns) {
      const columns = panel.locator('.ant-picker-time-panel-column');
      await expect(columns).toHaveCount(state.columns.length);
      for (const [unit, column] of state.columns.entries()) {
        const rendered = columns.nth(unit);
        await expect(rendered.locator('li')).toHaveCount(column.length);
        if (column.text) {
          await expect(rendered.locator('.ant-picker-time-panel-cell-selected')).toHaveText(column.text);
        }
      }
    }
  }
}

/** Compares the order of events and the full values of Dayjs of both borders. */
async function assertEvents(page: Page, expected: unknown[][], range: boolean | undefined) {
  await expect.poll(async () => {
    const serialized = await page.locator('#mode-events').textContent() ?? '[]';
    return comparablePanelModeEvents(JSON.parse(serialized), range);
  }).toEqual(comparablePanelModeEvents(expected, range));
}

for (const group of ['browser', 'supplement', 'bounds'] as const) {
  const [original, repeat] = readPickerModeReference(group);
  test(`Ant Design repeats the ${group} mode capture`, () => {
    expect(repeat).toEqual(original);
  });

  for (const { profile, steps } of original) {
    test(`DatePicker mode matches Source for ${profile.id}`, async ({ page }) => {
      const owner = await openFixture(page, { ...profile, withoutPreview: group !== 'browser' });
      const inputs = owner.locator('input');
      const originalFields = await inputs.elementHandles();
      const popup = page.locator(popupSelector);
      let releasedEvents: unknown[][] | undefined;
      try {
        for (const { action, state } of steps) {
          await perform(page, owner, action, profile.multiple);
          if (profile.id === 'release-mode' && action === 'cell'
            && state.events.at(-1)?.[2] === 'decade') {
            // Source after removing the mode displays the date, but processes it as undefined.
            // Native will agree the panel and choice with the picker and immediately confirm the
            // day.
            await expect(popup).toBeHidden();
            await expect(inputs.first()).toHaveValue('2023-06-04');
            const previous = state.events.slice(0, -4);
            releasedEvents = [...previous,
              ['calendar', '2023-06-04T00:00:00.000+00:00', '2023-06-04', {}],
              ['change', '2023-06-04T00:00:00.000+00:00', '2023-06-04'],
              ['open', false],
              ['picker', '2023-06-04T00:00:00.000+00:00', { source: 'panel', mode: 'date' }]
            ];
            await assertEvents(page, releasedEvents, false);
            continue;
          }
          await assertPanels(popup, state.panels);
          await assertEvents(page, releasedEvents ?? state.events, profile.range);

          // The basic shot includes a hover preview under the pointer after the mode is replaced.
          if (group !== 'browser' || !state.panels.length || action === 'start') {
            for (const [index, field] of state.fields.entries()) {
              await expect(inputs.nth(index)).toHaveValue(field);
            }
          }
          if (profile.multiple && state.tags) {
            const tags = owner.locator('[data-picker-selection-tag]:not([inert])');
            await expect(tags).toHaveText(state.tags);
          }
          for (const [index, field] of originalFields.entries()) {
            expect(await inputs.nth(index).evaluate((element, original) => element === original,
              field)).toBe(state.inputsRetained);
          }
        }
      }
      finally {
        await Promise.all(originalFields.map(field => field.dispose()));
      }
    });
  }
}

test('controlled panel mode keeps keyboard focus in the same popup', async ({ page }) => {
  const owner = await openFixture(page, { id: 'keyboard-mode', mode: 'year', accept: true });
  const input = owner.locator('input');
  const popup = page.locator(popupSelector);
  await input.click();
  await input.press('ArrowDown');
  const active = popup.locator('button[data-picker-date]:focus');
  await expect(active).toBeFocused();

  const originalPopup = await popup.elementHandle();
  try {
    await active.press('Enter');
    await expect(popup.locator('.ant-picker-month-panel button[data-picker-date]:focus')).toBeFocused();
    expect(await popup.evaluate((current, original) => current === original, originalPopup)).toBe(true);
    await setOwnerValue(page.locator('#owner-mode'), JSON.stringify('date'));
    await expect(popup.locator('.ant-picker-date-panel button[data-picker-date]:focus')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(input).toBeFocused();
    await expect(popup).toBeHidden();
  }
  finally {
    await originalPopup.dispose();
  }
});

test('RangePicker releases both controlled modes without replacing either editor', async ({ page }) => {
  const owner = await openFixture(page, { id: 'range-release-mode', range: true, mode: ['month', 'year'] });
  const start = owner.locator('input').first();
  const end = owner.locator('input').last();
  const originals = await owner.locator('input').elementHandles();
  const popup = page.locator(popupSelector);
  try {
    await start.click();
    await expect(popup.locator('.ant-picker-month-panel')).toBeVisible();
    await setOwnerValue(page.locator('#owner-mode'), 'null');
    await expect(popup.locator('.ant-picker-date-panel')).toHaveCount(2);
    await expect(start).toBeFocused();
    await end.click();
    await expect(popup.locator('.ant-picker-date-panel')).toHaveCount(2);
    await expect(end).toBeFocused();
    expect(await start.evaluate((input, old) => input === old, originals[0])).toBe(true);
    expect(await end.evaluate((input, old) => input === old, originals[1])).toBe(true);
    await expect(start).toHaveValue('2024-06-15');
    await expect(end).toHaveValue('2024-06-23');
    await assertEvents(page, [['open', true]], true);
  }
  finally {
    await Promise.all(originals.map(input => input.dispose()));
  }
});
