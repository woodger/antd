import { test, expect } from './test';

interface DateSnapshot { fields: number[]; iso: string; epoch: number; sameAsStart: boolean; sameAsEnd: boolean }
interface ValidationSnapshot {
  calls: Array<{ actualArgumentCount: number; value: DateSnapshot; infoKeys: string[];
    type: string; hasFrom: boolean; from: DateSnapshot | null; rejected: boolean }>;
  changes: unknown[]; model: DateSnapshot | DateSnapshot[];
}
for (const picker of ['week', 'date'] as const) for (const kind of ['single', 'range'] as const) {
  test(`${picker} ${kind} validation retains controlled date references and distinguishes typed text`, async ({ page }) => {
    await page.goto('/date-picker-week-validation.html?kind=' + kind + '&picker=' + picker);
    const text = picker === 'week' ? '2024-5th' : '2024-01-31';
    const malformedText = 'not-a-' + picker;
    const input = page.locator('#week-validation');

    await expect(input).toHaveValue(text);
    const read = async (): Promise<ValidationSnapshot> => {
      await page.locator('[data-week-validation-read]').evaluate(button => (button as HTMLButtonElement).click());
      return JSON.parse((await page.locator('[data-week-validation-snapshot]').textContent())!);
    };
    const initial = await read();

    expect(initial.calls.length).toBeGreaterThan(0);
    for (const call of initial.calls) {
      expect(call.actualArgumentCount).toBe(2);
      expect(call.type).toBe(picker);
      expect(call.infoKeys).toEqual(['type']);
      expect(call.value.sameAsStart || kind === 'range' && call.value.sameAsEnd).toBe(true);
      expect(call.rejected).toBe(false);
    }
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    if (kind === 'range') {
      await expect(page.locator('#week-validation-end'))
        .not.toHaveAttribute('aria-invalid', 'true');
    }
    await expect(input).not.toHaveAttribute('readonly');
    const original = await input.elementHandle();
    await input.click();
    const popup = page.locator('[data-picker-popup]:visible');

    await expect(popup.locator(`.ant-picker-${picker}-panel`)).toHaveCount(kind === 'range' ? 2 : 1);
    await expect(popup.locator('td[aria-disabled="true"]')).toHaveCount(kind === 'range' ? 96 : 48);
    const opened = await read();
    if (kind === 'range') expect(opened.calls.some(call => call.hasFrom && call.from === null)).toBe(true);
    // Реальный ввод той же строки создаёт новый Dayjs; predicate проверяет ссылку.
    await input.press('Control+A');
    await page.keyboard.type(text);

    await expect(input).toHaveValue(text);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await input.press('Escape');

    await expect(popup).toHaveCount(0);
    await expect(input).toHaveValue(text);
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    expect(await input.evaluate((node, previous) => node === previous, original)).toBe(true);
    await input.click();
    await input.press('Control+A');
    await page.keyboard.type(malformedText);

    await expect(input).toHaveAttribute('aria-invalid', 'true');
    if (kind === 'single') {
      await input.press('Enter');
      await expect(popup).toHaveCount(1);
      await expect(input).toHaveValue(malformedText);
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      const malformed = await read();
      expect(malformed.model).toEqual(initial.model);
      expect(malformed.changes).toEqual([]);
    }
    await input.press('Escape');

    await expect(input).toHaveValue(text);
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    const after = await read();

    expect(after.model).toEqual(initial.model);
    expect(after.changes).toEqual([]);
  });
}
