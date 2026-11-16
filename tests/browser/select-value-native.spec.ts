import { test, expect } from './test';
import { actSelectValue, prepareSelectValue } from './select-value-driver';
import { settleSelectValue } from './select-value-assertions';

for (const scenario of ['render-text', 'supplied-rich', 'single-omitted', 'mixed']) {
  test(`Native required follows raw selection through rich labels for ${scenario}`, async ({ page }) => {
    await page.goto('/?fixture=select-value&required=1');
    await page.getByRole('combobox', { name: 'Select value sample', exact: true }).selectOption(`select-value-${scenario}`);
    await prepareSelectValue(page);
    const editor = page.locator('#value-field');
    const form = page.locator('[data-select-value-native-form]');
    const valid = () => form.evaluate((node: HTMLFormElement) => node.checkValidity());
    const values = () => form.evaluate((node: HTMLFormElement) => [...new FormData(node)]);
    const identity = await editor.elementHandle();
    try {
      if (scenario === 'single-omitted') {
        expect(await valid()).toBe(false);
        await actSelectValue(page, { type: 'click' });
        await actSelectValue(page, { type: 'choose', text: 'Alpha' });
        await actSelectValue(page, { type: 'props', set: { dataset: 'rich' } });
      }
      await settleSelectValue(page);
      expect(await valid()).toBe(true);
      expect(await values()).toEqual([['value-selection', scenario === 'mixed' ? '0' : 'a']]);
      await expect(editor).toHaveAttribute('aria-required', 'true');
      if (scenario === 'supplied-rich' || scenario === 'single-omitted') await expect(editor).toHaveValue('');
      for (const renderer of ['false', 'empty', 'rich', 'array'] as const) {
        await actSelectValue(page, { type: 'props', set: { renderer } });
        const actual = await settleSelectValue(page);
        await expect(editor).toHaveValue('');
        expect(await valid()).toBe(true);
        expect(await values()).toEqual([['value-selection', scenario === 'mixed' ? '0' : 'a']]);
        expect(actual.view.events.some((event: unknown) => Array.isArray(event) && event[0] === 'clear')).toBe(false);
        expect(await identity!.evaluate(node => node === document.getElementById('value-field'))).toBe(true);
      }
      await actSelectValue(page, { type: 'clear' });
      await settleSelectValue(page);
      expect(await values()).toEqual([['value-selection', '']]);
      expect(await valid()).toBe(false);
      expect(await editor.evaluate((node: HTMLInputElement) => node.validity.valueMissing)).toBe(true);
      await expect(editor).toHaveAttribute('aria-required', 'true');
    } finally { await identity?.dispose(); }
  });
}
