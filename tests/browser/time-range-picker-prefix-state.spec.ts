import type { Locator, Page } from '@playwright/test';
import { test, expect } from './test';

const control = (page: Page, name: string) => page.getByLabel(name, { exact: true });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const root = (page: Page) => page.locator('.fixture-time-range');
const start = (page: Page) => control(page, 'Interval start');
const end = (page: Page) => control(page, 'Interval end');
const popup = (page: Page) => page.locator('[data-picker-popup]');
const unit = (page: Page, name: string) => popup(page).getByRole('button', { name, exact: true });
const selection = (input: Locator) => input.evaluate((node: HTMLInputElement) =>
  [node.selectionStart, node.selectionEnd, node.selectionDirection]);

async function prepare(page: Page, controlled: boolean) {
  await page.goto('/?fixture=time-range-picker');
  if (!controlled) {
    await control(page, 'Controlled interval value').uncheck();
    // The new instance checks defaultValue separately from deleting the controlled value.
    await control(page, 'Mount interval').uncheck();
    await control(page, 'Mount interval').check();
  }
  await control(page, 'Interval format').selectOption('short');
  await button(page, 'Toggle interval prefix').click();
  await expect(root(page)).toHaveClass(/\bproject-picker\b/);
  await expect(start(page)).toHaveValue('10:23');
  await expect(end(page)).toHaveValue('17:45');
  await expect(control(page, 'Interval value refs')).toHaveText('true,true,true');
  await start(page).click();
  await expect(popup(page)).toBeVisible();
}

async function retain(page: Page) {
  const retained = {
    root: await root(page).elementHandle(), input: await start(page).elementHandle(),
    end: await end(page).elementHandle(), popup: await popup(page).elementHandle(),
    id: await start(page).getAttribute('id'), controls: await start(page).getAttribute('aria-controls'),
    controlRefs: await control(page, 'Interval control refs').textContent()
  };
  expect(retained.controlRefs).toMatch(/^\d+,\d+,\d+$/);
  return retained;
}
type Retained = Awaited<ReturnType<typeof retain>>;

async function expectRetained(page: Page, prior: Retained) {
  expect(await root(page).evaluate((node, old) => node === old, prior.root)).toBe(true);
  expect(await start(page).evaluate((node, old) => node === old, prior.input)).toBe(true);
  expect(await end(page).evaluate((node, old) => node === old, prior.end)).toBe(true);
  expect(await popup(page).evaluate((node, old) => node === old, prior.popup)).toBe(true);
  await expect(control(page, 'Interval control refs')).toHaveText(prior.controlRefs!);
  await expect(start(page)).toHaveAttribute('id', prior.id!);
  await expect(start(page)).toHaveAttribute('aria-controls', prior.controls!);
  await expect(start(page)).toBeFocused();
  await expect(popup(page)).toBeVisible();
}

async function release(prior: Retained) {
  for (const handle of [prior.root, prior.input, prior.end, prior.popup]) await handle?.dispose();
}

test.use({ viewport: { width: 1280, height: 900 } });
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2024-09-15T12:34:56.789Z'));
});

for (const controlled of [true, false]) {
  const mode = controlled ? 'controlled value' : 'defaultValue';
  for (const draft of ['invalid input', 'minute 35'] as const) {
    test(`TimeRangePicker ${mode} keeps ${draft} across a local prefix change`, async ({ page }) => {
      await prepare(page, controlled);
      if (draft === 'invalid input') {
        await start(page).fill('draft');
        await start(page).evaluate((input: HTMLInputElement) => input.setSelectionRange(
          1,
          4,
          'backward'
        ));
        expect(await selection(start(page))).toEqual([1, 4, 'backward']);
      }
      else {
        await unit(page, 'minute 35').click();
        await page.mouse.move(1270, 890);
        await expect(start(page)).toHaveValue('10:35');
        await expect(unit(page, 'minute 35')).toHaveAttribute('aria-pressed', 'true');
      }
      const prior = await retain(page), caret = await selection(start(page));
      const beforeEvents = await control(page, 'Interval events').textContent();
      const beforeFocus = await control(page, 'Interval focus').textContent();
      try {
        // The button changes the prop without pointerdown outside and transferring the focus.
        await button(page, 'Toggle interval prefix').evaluate((node: HTMLButtonElement) => node.click());

        await expect(root(page)).toHaveClass(/\bsuite-picker\b/);
        await expect(popup(page)).toHaveClass(/\bsuite-picker-dropdown\b/);
        await expect(start(page)).toHaveValue(draft === 'invalid input' ? 'draft' : '10:35');
        await expect(end(page)).toHaveValue('17:45');
        await expectRetained(page, prior);
        expect(await selection(start(page))).toEqual(caret);
        if (draft === 'minute 35')
          await expect(unit(page, 'minute 35')).toHaveAttribute('aria-pressed', 'true');
        await expect(control(page, 'Interval value refs')).toHaveText('true,true,true');
        await expect(control(page, 'Interval events')).toHaveText(beforeEvents!);
        await expect(control(page, 'Interval focus')).toHaveText(beforeFocus!);
        await expect(control(page, 'Interval events')).not.toContainText('change:');
        await expect(control(page, 'Interval events')).not.toContainText('ok:');
      } finally { await release(prior); }
    });
  }
}

test('TimeRangePicker resyncs a valid draft when the owner supplies a new array with the same Dayjs values', async ({ page }) => {
  await prepare(page, true);
  await start(page).fill('12:35');
  await page.mouse.move(1270, 890);

  await expect(start(page)).toHaveValue('12:35');
  await expect(unit(page, 'hour 12')).toHaveAttribute('aria-pressed', 'true');
  await expect(unit(page, 'minute 35')).toHaveAttribute('aria-pressed', 'true');
  const prior = await retain(page);
  const beforeEvents = await control(page, 'Interval events').textContent();
  try {
    await button(page, 'Replace interval array').evaluate((node: HTMLButtonElement) => node.click());

    // A reference to an array is changed; both Dayjs source objects are saved.
    await expect(control(page, 'Interval value refs')).toHaveText('false,true,true');
    await expect(start(page)).toHaveValue('10:23');
    await expect(end(page)).toHaveValue('17:45');
    await expect(unit(page, 'hour 10')).toHaveAttribute('aria-pressed', 'true');
    await expect(unit(page, 'minute 23')).toHaveAttribute('aria-pressed', 'true');
    await expectRetained(page, prior);
    await expect(control(page, 'Interval events')).toHaveText(beforeEvents!);
    await expect(control(page, 'Interval events')).not.toContainText('change:');
  } finally { await release(prior); }
});
