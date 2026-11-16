import type { Page } from '@playwright/test';
import type { SelectDataAction } from './fixtures/select-data-cases';

export async function drainSelectData(page: Page) {
  await page.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise(resolve => setTimeout(resolve));
    await new Promise(resolve => setTimeout(resolve));
  });
}
export async function prepareSelectData(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.mouse.move(0, 0);
  await drainSelectData(page);
}
export async function actSelectData(page: Page, action: SelectDataAction) {
  const owner = page.locator('[data-select-data-case]');
  const editor = owner.locator('input[role="combobox"],textarea[role="combobox"]').first();
  if (action.type === 'click') await editor.click();
  else if (action.type === 'outside') await page.locator('[data-select-data-outside]').click();
  else if (action.type === 'fill') await editor.fill(action.text);
  else if (action.type === 'caret') await editor.evaluate((node, action) => {
    const input = node as HTMLInputElement | HTMLTextAreaElement;
    input.focus(); input.setSelectionRange(action.start, action.end);
  }, action);
  else if (action.type === 'key') await editor.press(action.key);
  else if (action.type === 'clear') await owner.locator('.ant-select-clear').click();
  else if (action.type === 'remove') await owner.locator('.ant-select-selection-item')
    .filter({ hasText: action.text }).locator('.ant-select-selection-item-remove').click();
  else if (action.type === 'choose' || action.type === 'hover') {
    const row = page.locator('.ant-select-dropdown:visible').first().locator('.ant-select-item-option-content')
      .filter({ hasText: new RegExp(`^${action.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) });
    await row.scrollIntoViewIfNeeded();
    await drainSelectData(page);
    if (action.type === 'choose') await row.click(); else await row.hover();
  } else await page.evaluate(action => {
    document.querySelector('[data-select-data-command]')!
      .dispatchEvent(new CustomEvent('dataupdate', { detail: action }));
  }, action);
  await page.mouse.move(0, 0);
}
