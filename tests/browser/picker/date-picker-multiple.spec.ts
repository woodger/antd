import type { Page } from '@playwright/test';
import {
  comparableMultipleEvents, readMultipleBrowser, readMultipleInteractions, readMultipleMode,
  type MultipleBrowserProfile
} from '../date-picker-multiple-reference';
import type { MultiplePickerProfile } from '../fixtures/DatePickerMultipleFixtures.svelte';
import { expect, test } from '../test';

const rootSelector = '[data-date-owner] .ant-picker';
const visibleTags = '[data-picker-selection-tag]:not([inert]), [data-picker-selection-rest]:not([inert])';
const popupSelector = '[data-picker-popup]:not([hidden])';

test.use({ viewport: { width: 1280, height: 720 }, timezoneId: 'UTC', locale: 'en-US' });

/** Installs the assembled package from the props independent standard. */
async function mountProfile(page: Page, profile: MultiplePickerProfile) {
  await page.clock.setFixedTime(new Date('2024-06-19T16:00:00Z'));
  const search = new URLSearchParams({ fixture: 'date-picker-multiple', profile: JSON.stringify(profile) });
  await page.goto('/?' + search.toString());
  await expect(page.locator('[data-date-owner]')).toHaveAttribute('data-ref', 'true');
}

/** Performs the action through the real calendar or the control of the owner. */
async function applyChoice(page: Page, command: MultipleBrowserProfile['steps'][number]['command']) {
  const root = page.locator(rootSelector);
  if (Array.isArray(command)) {
    const [name, value] = command;
    if (name === 'day') {
      await page.locator(`${popupSelector} button[data-picker-date="${value}"]`).first().click();
    }
    else {
      await page.locator('#owner-width').fill(String(value));
    }
    return;
  }

  switch (command) {
    case 'blocked-click':
    case 'open':
      await root.click({ position: { x: 5, y: 12 } });
      return;
    case 'escape':
      await page.keyboard.press('Escape');
      return;
    case 'outside':
      await page.locator('#outside').click();
      return;
    case 'ok':
      await page.getByRole('button', { name: 'OK', exact: true }).click();
      return;
    case 'clear':
      await root.hover();
      await root.locator('[data-picker-clear]').click();
      return;
    case 'remove-first':
      await root.locator('[data-picker-tag-remove]').first().click();
      return;
    case 'remove-custom':
      await root.locator('[data-remove-custom]').first().click();
      return;
    case 'accept':
      await page.locator('#accept').evaluate((button: HTMLButtonElement) => button.click());
      return;
  }
}

for (const sample of readMultipleBrowser().passes[0]) {
  test(`DatePicker multiple uses Source events and tags for ${sample.profile.id}`, async ({ page }) => {
    const profile = { ...sample.profile, ordered: sample.profile.order };
    await mountProfile(page, profile);
    const input = page.getByRole('combobox', { name: 'Book dates' });
    await expect(input).toHaveValue(sample.initial.input.value);
    const original = await input.elementHandle();
    if (profile.disabled) {
      await expect(input).toBeDisabled();
    }

    for (const step of sample.steps) {
      await applyChoice(page, step.command);
      await expect(input).toHaveAttribute('aria-expanded', String(step.state.popup));
      await expect(input).toHaveValue(step.state.input.value);
      expect(await input.evaluate((element, original) => element === original, original)).toBe(true);

      const optionLabels = step.state.tags.filter(tag => !tag.hidden).map(tag => tag.text);
      // Two Dayjs one week has the same label. In React, after removal, there remains an extra tag,
      // although the callback has already ruled out both dates.
      const expectedTags = profile.id === 'week' && step.command === 'remove-first'
        ? step.state.input.value.split(',') : optionLabels;
      await expect(page.locator(visibleTags)).toHaveText(expectedTags);
      const expectedEvents = profile.disabled ? [] : comparableMultipleEvents(step.state.events);
      await expect.poll(async () => {
        const root = page.locator('#multiple-events');
        const events = JSON.parse(await root.textContent() ?? '[]') as unknown[][];

        return comparableMultipleEvents(events);
      }).toEqual(expectedEvents);
    }
  });
}

/** Compares the time and list from the additional initial measurement. */
function interactionEvents(events: unknown[][]) {
  function date(value: unknown) {
    const original = value && typeof value === 'object' && 'date' in value ? value.date : value;

    return typeof original === 'string' ? original.slice(0, 16).replace('T', ' ') : original;
  }

  return comparableMultipleEvents(events).map(([name, values, ...rest]) => [
    name, Array.isArray(values) ? values.map(date) : date(values), ...rest
  ].slice(0, name === 'clear' ? 1 : undefined));
}

const terminalPeriods = { month: '2024-08', year: '2026', quarter: '2024-Q3' };

for (const sample of readMultipleInteractions().passes[0].filter(item => item.id !== 'owner')) {
  test(`DatePicker multiple replays ${sample.id} through native controls`, async ({ page }) => {
    const picker = Object.hasOwn(terminalPeriods, sample.id)
      ? sample.id as keyof typeof terminalPeriods : undefined;
    await mountProfile(page, {
      id: sample.id, oneInitial: true, picker, needConfirm: sample.id.endsWith('-confirm')
    });
    const input = page.getByRole('combobox', { name: 'Book dates' });

    for (const step of sample.actions) {
      if (step.action === 'preset') {
        await page.getByRole('button', { name: 'Pick preset' }).click();
      }
      else if (step.action === picker) {
        await applyChoice(page, ['day', terminalPeriods[picker]]);
      }
      else if (step.action === 'remove') {
        await applyChoice(page, 'remove-first');
      }
      else if (step.action === 'open' || step.action === 'outside'
        || step.action === 'escape' || step.action === 'clear') {
        await applyChoice(page, step.action);
      }
      else {
        throw Error(`Unknown multiple interaction: ${step.action}`);
      }

      await expect(input).toHaveAttribute('aria-expanded', String(step.open));
      await expect(input).toHaveValue(step.input);
      await expect(page.locator(visibleTags)).toHaveText(step.tags);
      await expect.poll(async () => {
        const events = JSON.parse(await page.locator('#multiple-events').textContent() ?? '[]') as unknown[][];

        return interactionEvents(events);
      }).toEqual(interactionEvents(step.events));
    }
  });
}

test('controlled multiple retains accepted dates on rejection and publishes a later accepted choice', async ({
  page
}) => {
  const source = readMultipleInteractions().passes[0].find(sample => sample.id === 'owner');
  expect(source?.actions[2].tags).toEqual(['2024-06-10', '2024-06-13']);
  await mountProfile(page, { id: 'owner', oneInitial: true, controlled: true });
  const input = page.getByRole('combobox', { name: 'Book dates' });
  const initialInput = await input.elementHandle();

  await applyChoice(page, 'open');
  await applyChoice(page, ['day', '2024-06-13']);
  await expect(input).toHaveValue('2024-06-10,2024-06-13');
  await applyChoice(page, 'outside');
  await expect(input).toHaveValue('2024-06-10');
  await applyChoice(page, 'open');
  await applyChoice(page, 'accept');
  await applyChoice(page, ['day', '2024-06-13']);
  await applyChoice(page, 'outside');

  await expect(input).toHaveValue('2024-06-10,2024-06-13');
  expect(await input.evaluate((element, previous) => element === previous, initialInput)).toBe(true);
  const form = page.getByRole('form', { name: 'Date selection form' });
  expect(await form.evaluate((element: HTMLFormElement) => new FormData(element).get('multiple-date')))
    .toBe('2024-06-10,2024-06-13');
});

test('multiple supports a real label, keyboard entry, confirmation and tag removal', async ({ page }) => {
  await mountProfile(page, { id: 'keyboard', needConfirm: true, oneInitial: true, maxTagCount: 1 });
  const input = page.getByRole('combobox', { name: 'Book dates' });

  await page.locator('label[for="multiple-editor"]').click();
  await expect(input).toBeFocused();
  await input.press('ArrowDown');
  const selected = page.getByRole('button', { name: '2024-06-19', exact: true });
  await expect(selected).toBeFocused();
  await selected.press('Enter');
  await page.getByRole('button', { name: 'OK', exact: true }).press('Enter');

  await expect(input).toBeFocused();
  await expect(input).toHaveValue('2024-06-10,2024-06-19');
  await expect(page.locator(visibleTags)).toHaveText(['2024-06-10', '+ 1 ...']);
  await page.getByRole('button', { name: /clear.*2024-06-10/i }).press('Enter');
  await expect(input).toHaveValue('2024-06-19');
  await expect(input).toBeFocused();
});

test('DatePicker switches multiple without resetting its accepted list', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2024-06-19T16:00:00Z'));
  await page.goto('/?fixture=date-picker-multiple-mode');
  const root = page.locator(rootSelector);
  const input = root.locator('input');
  const original = await root.elementHandle();
  let previous = await input.elementHandle();

  try {
    for (const { action, state } of readMultipleMode().passes[0]) {
      if (action === 'toggle') {
        await page.locator('#toggle').evaluate((button: HTMLButtonElement) => button.click());
      }
      else if (action === 'open' && !state.multiple) {
        // A solitary Svelte picker opens with a click on the field.
        await input.click();
      }
      else if (action === 'open' || action === 'outside') {
        await applyChoice(page, action);
      }
      else if (action === 'choose-20' || action === 'choose-21') {
        await applyChoice(page, ['day', '2024-06-' + action.slice(-2)]);
      }

      await expect(input).toHaveValue(state.value);
      await expect(root.locator(visibleTags)).toHaveText(state.tags);
      expect(await root.evaluate((element, initial) => element === initial, original)).toBe(state.sameOwner);
      expect(await input.evaluate((element, old) => element === old, previous)).toBe(state.samePreviousInput);
      await expect(page.locator('#multiple-events')).toHaveText(JSON.stringify(state.events));
      await previous.dispose();
      previous = await input.elementHandle();
    }
  }
  finally {
    await original.dispose();
    await previous.dispose();
  }
});
