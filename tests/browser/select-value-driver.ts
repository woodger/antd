import type { Page } from '@playwright/test';
import type { SelectValueAction } from './fixtures/select-value-cases';

export async function drainSelectValue(page: Page) {
  await page.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise(resolve => setTimeout(resolve));
    await new Promise(resolve => setTimeout(resolve));
  });
}
export async function prepareSelectValue(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.mouse.move(0, 0);
  await drainSelectValue(page);
}
export async function actSelectValue(page: Page, action: SelectValueAction) {
  const owner = page.locator('[data-select-value-case]');
  const input = owner.locator('input[role="combobox"]').first();
  if (action.type === 'click') await owner.locator('.select-value-control').click();
  else if (action.type === 'outside') await page.locator('[data-select-value-outside]').click();
  else if (action.type === 'fill') await input.fill(action.text);
  else if (action.type === 'key') await input.press(action.key);
  else if (action.type === 'caret') await input.evaluate((node, action) => {
    const element = node as HTMLInputElement;
    element.focus(); element.setSelectionRange(action.start, action.end);
  }, action);
  else if (action.type === 'clear') await owner.locator('.ant-select-clear').click();
  else if (action.type === 'remove') await owner.locator('.ant-select-selection-item')
    .filter({ hasText: action.text }).locator('.ant-select-selection-item-remove').click();
  else if (action.type === 'choose') {
    const row = page.locator('.ant-select-dropdown:visible').first().locator('.ant-select-item-option-content')
      .filter({ hasText: new RegExp(`^${action.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) });
    await row.scrollIntoViewIfNeeded();
    await drainSelectValue(page);
    await row.click();
  } else await page.evaluate(action => document.querySelector('[data-select-value-command]')!
    .dispatchEvent(new CustomEvent('valueupdate', { detail: action })), action);
  await page.mouse.move(0, 0);
}
