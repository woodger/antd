import { test, expect } from './test';

for (const kind of ['single', 'range'] as const) {
  test(`live ${kind} picker changes reset panel mode without replacing the field or model`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2024-06-10T08:23:45.678Z'));
    await page.goto('/date-picker-period-mode.html');
    const input = page.locator('#period-mode-' + kind);
    const original = await input.elementHandle();
    const popup = page.locator('[data-picker-popup]:visible');
    await input.click();
    await expect(popup.locator('.ant-picker-month-panel')).toHaveCount(kind === 'range' ? 2 : 1);
    await popup.locator('.ant-picker-header-view button').first().click();
    await popup.locator('.ant-picker-header-view button').first().click();
    await expect(popup.locator('.ant-picker-decade-panel')).toHaveCount(1);
    const before = await page.locator('[data-period-mode-calls]').textContent();
    const switchMode = () => page.locator('[data-period-mode-switch]')
      .evaluate(button => (button as HTMLButtonElement).click());
    await switchMode();
    await expect(popup.locator('.ant-picker-year-panel')).toHaveCount(kind === 'range' ? 2 : 1);
    await expect(input).toHaveValue('2024');
    await expect(input).toBeFocused();
    expect(await input.evaluate((node, previous) => node === previous, original)).toBe(true);
    await expect(page.locator('[data-period-mode-calls]')).toHaveText(before!);
    await switchMode();
    await expect(popup.locator('.ant-picker-month-panel')).toHaveCount(kind === 'range' ? 2 : 1);
    await expect(input).toHaveValue('2024-01');
    await expect(input).toBeFocused();
    await expect(page.locator('[data-period-mode-calls]')).toHaveText(before!);
  });
}

for (const kind of ['single', 'range'] as const) {
  for (const initialPicker of ['month', 'year', 'quarter'] as const) {
    test(`live ${kind} ${initialPicker} to date restores date and clock panels without replacing the owner`, async ({ page }) => {
      await page.clock.setFixedTime(new Date('2024-06-10T08:23:45.678Z'));
      await page.goto('/date-picker-period-mode.html');
      // Настоящие owner-кнопки меняют props без переноса фокуса в другой элемент.
      if (initialPicker === 'year') await page.locator('[data-period-mode-switch]')
        .evaluate(button => (button as HTMLButtonElement).click());
      if (initialPicker === 'quarter') await page.locator('[data-period-mode-quarter]')
        .evaluate(button => (button as HTMLButtonElement).click());
      await page.locator('[data-period-mode-time]')
        .evaluate(button => (button as HTMLButtonElement).click());
      const input = page.locator('#period-mode-' + kind);
      await input.click();
      const popup = page.locator('[data-picker-popup]:visible');
      await expect(popup.locator(`.ant-picker-${initialPicker}-panel`))
        .toHaveCount(kind === 'range' ? 2 : 1);
      await expect(popup.locator('.ant-picker-time-panel')).toHaveCount(0);
      const originalInput = await input.elementHandle();
      const originalRoot = await input.evaluateHandle(node => node.closest('[data-ant-picker-prefix]'));
      const originalPopup = await popup.elementHandle();
      expect(originalInput).not.toBeNull();
      expect(originalRoot.asElement()).not.toBeNull();
      expect(originalPopup).not.toBeNull();
      const ledgerBefore = await page.locator('[data-period-mode-calls]').textContent();
      const modelBefore = await page.locator('[data-period-mode-model]').textContent();
      await page.locator('[data-period-mode-date]')
        .evaluate(button => (button as HTMLButtonElement).click());
      await expect(popup.locator('.ant-picker-date-panel')).toHaveCount(1);
      await expect(popup.locator('.ant-picker-time-panel')).toHaveCount(1);
      await expect(popup.locator('.ant-picker-month-panel, .ant-picker-year-panel, .ant-picker-decade-panel'))
        .toHaveCount(0);
      await expect(input).toHaveValue('2024-01-31 16:37:59');
      if (kind === 'range') await expect(page.locator('#period-mode-end'))
        .toHaveValue('2025-01-31 16:37:59');
      await expect(input).toBeFocused();
      await expect(input).toHaveAttribute('aria-expanded', 'true');
      expect(await input.evaluate((node, previous) => node === previous, originalInput)).toBe(true);
      expect(await input.evaluate((node, previous) => node.closest('[data-ant-picker-prefix]') === previous,
        originalRoot)).toBe(true);
      expect(await popup.evaluate((node, previous) => node === previous, originalPopup)).toBe(true);
      await expect(page.locator('[data-period-mode-model]')).toHaveText(modelBefore!);
      await expect(page.locator('[data-period-mode-calls]')).toHaveText(ledgerBefore!);
    });
  }
}
