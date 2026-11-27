import { expect, test } from './test';
import './date-picker-presets-metrics.mjs';

// Separate public-method counter by Source onSelectorKeyDown; not part 58 pointer actions.
test('DatePicker public focus and closed Escape reset a retained rejected preset without reopening', async ({ page }) => {
  await page.goto('/date-picker-presets.html?sample=controlled-rejection');
  await page.waitForFunction(() => window.datePickerPresetsNative?.ready === true);
  await page.evaluate(() => document.fonts.ready);
  const input = page.locator('#preset-field');
  await input.click();
  await page.locator('.ant-picker-presets li').first().click();

  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).toHaveValue('2024-06-12');
  const before = await page.evaluate(() => window.datePickerPresetsNative.read());

  expect(before.value.temporal?.iso).toBe('2024-06-10T00:00:00.000Z');
  await page.evaluate(() => {
    const control = window.datePickerPresetsNative.readRefs().control;
    if (!control) {
      throw Error('Actual public DatePicker control is required');
    }
    control.focus();
  });

  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  const afterFocus = await page.evaluate(() => window.datePickerPresetsNative.read().callbackInvocations.length);
  await input.press('Escape');

  await expect(input).toHaveValue('2024-06-10');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).toBeFocused();
  const after = await page.evaluate(() => window.datePickerPresetsNative.read());

  expect(after.callbackInvocations.slice(afterFocus).map(call => call.name)).toEqual(['calendar']);
  expect(after.callbackDates.slice(before.callbackDates.length)).toMatchObject([
    { name: 'calendar', value: { temporal: { iso: '2024-06-10T00:00:00.000Z' } } }
  ]);
  expect(after.value.temporal?.iso).toBe('2024-06-10T00:00:00.000Z');
  await page.evaluate(() => window.datePickerPresetsNative.dispose());

  await expect(page.locator('[data-picker-presets-owner]')).toHaveCount(0);
});
