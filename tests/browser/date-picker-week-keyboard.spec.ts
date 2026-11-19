import { test, expect } from './test';

test('week native buttons keep a seven-day keyboard grid across the GB week-year boundary', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2024-06-10T08:23:45.678Z'));
  await page.goto('/date-picker-week-keyboard.html');
  const input = page.locator('#week-keyboard');
  const originalInput = await input.elementHandle();

  await expect(input).toHaveValue('2020-53rd');
  await input.click();
  const popup = page.locator('[data-picker-popup]:visible');
  const originalPopup = await popup.elementHandle();

  await expect(popup.locator('button[data-picker-date]')).toHaveCount(42);
  await expect(popup.locator('td.ant-picker-cell-week')).toHaveCount(6);
  await expect(popup.locator('button[data-picker-date][tabindex="0"]')).toHaveCount(1);
  const before = await page.evaluate(() => window.readWeekKeyboard());

  await page.keyboard.press('Tab');

  await expect(popup.locator('button[data-picker-date="2020-12-31"]')).toBeFocused();
  await page.keyboard.press('ArrowRight');

  await expect(popup.locator('button[data-picker-date="2021-01-01"]')).toBeFocused();
  const sameWeek = await page.evaluate(() => window.readWeekKeyboard());

  expect(sameWeek.navigationEvents).toEqual([...before.navigationEvents, 'panel']);
  await page.keyboard.press('ArrowUp');

  await expect(popup.locator('button[data-picker-date="2020-12-25"]')).toBeFocused();
  await expect(input).toHaveValue('2020-53rd');
  expect(await input.evaluate((node, previous) => node === previous, originalInput)).toBe(true);
  expect(await popup.evaluate((node, previous) => node === previous, originalPopup)).toBe(true);
  const after = await page.evaluate(() => window.readWeekKeyboard());

  expect(after.modelISO).toBe('2020-12-31T16:37:59.456Z');
  expect(after.selectionEvents).toEqual(before.selectionEvents);
  expect(after.navigationEvents).toEqual([...sameWeek.navigationEvents, 'picker-value', 'panel']);
});


test('week controlled pickerValue rejection restores the original focused day', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2024-06-10T08:23:45.678Z'));
  await page.goto('/date-picker-week-keyboard.html?controlled');
  const input = page.locator('#week-keyboard');
  const originalInput = await input.elementHandle();

  await expect(input).toHaveValue('2020-53rd');
  await input.click();
  const popup = page.locator('[data-picker-popup]:visible');
  const originalPopup = await popup.elementHandle();
  const day = popup.locator('button[data-picker-date="2020-12-31"]');
  const originalDay = await day.elementHandle();

  await expect(popup.locator('button[data-picker-date="2021-01-31"]')).toHaveCount(0);
  await page.keyboard.press('Tab');

  await expect(day).toBeFocused();
  const before = await page.evaluate(() => window.readWeekKeyboard());

  await page.keyboard.press('PageDown');

  await expect(day).toBeFocused();
  await expect(popup.locator('button[data-picker-date="2021-01-31"]')).toHaveCount(0);
  await expect(input).toHaveValue('2020-53rd');
  expect(await day.evaluate((node, previous) => node === previous, originalDay)).toBe(true);
  expect(await input.evaluate((node, previous) => node === previous, originalInput)).toBe(true);
  expect(await popup.evaluate((node, previous) => node === previous, originalPopup)).toBe(true);
  const after = await page.evaluate(() => window.readWeekKeyboard());

  expect(after.modelISO).toBe('2020-12-31T16:37:59.456Z');
  expect(after.selectionEvents).toEqual(before.selectionEvents);
  expect(after.navigationEvents).toEqual([...before.navigationEvents, 'picker-value', 'panel']);
});
