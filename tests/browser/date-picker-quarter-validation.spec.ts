import { test, expect } from './test';

interface DateSnapshot { fields: number[]; iso: string; epoch: number; sameAsStart: boolean; sameAsEnd: boolean }
interface ValidationSnapshot {
  calls: Array<{ actualArgumentCount: number; value: DateSnapshot; infoKeys: string[];
    type: string; hasFrom: boolean; from: DateSnapshot | null; rejected: boolean }>;
  changes: unknown[]; model: DateSnapshot | DateSnapshot[];
}
for (const kind of ['single', 'range'] as const) {
  test(`quarter ${kind} validation retains controlled date references and distinguishes typed text`, async ({ page }) => {
    await page.goto('/date-picker-quarter-validation.html?kind=' + kind);
    const input = page.locator('#quarter-validation');

    await expect(input).toHaveValue('2024-Q1');
    const read = async (): Promise<ValidationSnapshot> => {
      await page.locator('[data-quarter-validation-read]').evaluate(button => (button as HTMLButtonElement).click());
      return JSON.parse((await page.locator('[data-quarter-validation-snapshot]').textContent())!);
    };
    const initial = await read();

    expect(initial.calls.length).toBeGreaterThan(0);
    for (const call of initial.calls) {
      expect(call.actualArgumentCount).toBe(2);
      expect(call.type).toBe('quarter');
      expect(call.infoKeys).toEqual(['type']);
      expect(call.value.sameAsStart || kind === 'range' && call.value.sameAsEnd).toBe(true);
      expect(call.rejected).toBe(false);
    }
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    if (kind === 'range') {
      await expect(page.locator('#quarter-validation-end'))
        .not.toHaveAttribute('aria-invalid', 'true');
    }
    await expect(input).not.toHaveAttribute('readonly');
    const original = await input.elementHandle();
    await input.click();
    const popup = page.locator('[data-picker-popup]:visible');

    await expect(popup.locator('.ant-picker-quarter-panel')).toHaveCount(kind === 'range' ? 2 : 1);
    await expect(popup.locator('td[aria-disabled="true"]')).toHaveCount(kind === 'range' ? 8 : 4);
    const opened = await read();
    if (kind === 'range') expect(opened.calls.some(call => call.hasFrom && call.from === null)).toBe(true);
    // Та же строка квартала разбирается в новый Jan1: identity predicate должен отклонить реальный ввод.
    await input.press('Control+A');
    await page.keyboard.type('2024-Q1');

    await expect(input).toHaveValue('2024-Q1');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await input.press('Escape');

    await expect(popup).toHaveCount(0);
    await expect(input).toHaveValue('2024-Q1');
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    expect(await input.evaluate((node, previous) => node === previous, original)).toBe(true);
    await input.click();
    await input.press('Control+A');
    await page.keyboard.type('not-a-quarter');

    await expect(input).toHaveAttribute('aria-invalid', 'true');
    if (kind === 'single') {
      await input.press('Enter');
      await expect(popup).toHaveCount(1);
      await expect(input).toHaveValue('not-a-quarter');
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      const malformed = await read();
      expect(malformed.model).toEqual(initial.model);
      expect(malformed.changes).toEqual([]);
    }
    await input.press('Escape');

    await expect(input).toHaveValue('2024-Q1');
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    const after = await read();

    expect(after.model).toEqual(initial.model);
    expect(after.changes).toEqual([]);
  });
}
