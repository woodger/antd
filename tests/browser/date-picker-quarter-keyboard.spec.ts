import { test, expect } from './test';

test('quarter native buttons preserve keyboard focus when the model is in the middle month', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2024-06-10T08:23:45.678Z'));
  await page.goto('/date-picker-quarter-keyboard.html');
  const input = page.locator('#quarter-keyboard');
  const originalInput = await input.elementHandle();
  await input.click();
  const popup = page.locator('[data-picker-popup]:visible');
  const originalPopup = await popup.elementHandle();
  const cells = popup.locator('button[data-picker-date]');
  const q2 = popup.locator('button[data-picker-date="2024-Q2"]');
  const q3 = popup.locator('button[data-picker-date="2024-Q3"]');

  await expect(cells).toHaveCount(4);
  await expect(popup.locator('button[data-picker-date][tabindex="0"]')).toHaveCount(1);
  await expect(q2).toHaveAttribute('tabindex', '0');
  const before = await page.evaluate(() => window.readQuarterKeyboard());

  await page.keyboard.press('Tab');

  await expect(q2).toBeFocused();
  await page.keyboard.press('ArrowRight');

  await expect(q3).toBeFocused();
  await expect(q3).toHaveAttribute('tabindex', '0');
  await expect(q2).toHaveAttribute('tabindex', '-1');
  await expect(input).toHaveValue('2024-Q2');
  expect(await input.evaluate((node, previous) => node === previous, originalInput)).toBe(true);
  expect(await popup.evaluate((node, previous) => node === previous, originalPopup)).toBe(true);
  const after = await page.evaluate(() => window.readQuarterKeyboard());

  expect(after.modelISO).toBe('2024-05-20T16:37:59.456Z');
  expect(after.selectionEvents).toEqual(before.selectionEvents);
  expect(after.navigationEvents).toEqual([...before.navigationEvents, 'picker-value', 'panel']);
});
