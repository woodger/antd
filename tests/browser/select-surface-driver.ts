import type { Page } from '@playwright/test';
import type { SelectSurfaceAction } from './fixtures/select-surface-cases';

export async function drainSelectSurface(page: Page) {
  await page.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise(resolve => setTimeout(resolve));
    await new Promise(resolve => setTimeout(resolve));
  });
}
export async function prepareSelectSurface(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.mouse.move(0, 0);
  await drainSelectSurface(page);
}
export async function actSelectSurface(page: Page, action: SelectSurfaceAction) {
  const owner = page.locator('[data-surface-case]');
  const input = owner.locator('input[role="combobox"]').first();
  const popup = page.locator('.ant-select-dropdown:visible').first();
  if (action.type === 'click') await owner.locator('.surface-control').click();
  else if (action.type === 'outside') await page.locator('[data-surface-outside]').click();
  else if (action.type === 'fill') await input.fill(action.text);
  else if (action.type === 'key') await input.press(action.key);
  else if (action.type === 'footer') await popup.locator('[data-surface-footer]').click();
  else if (action.type === 'footer-fill') await popup.locator('[data-surface-footer-input]').fill(action.text);
  else if (action.type === 'footer-key') await popup.locator('[data-surface-footer-input]').press(action.key);
  else if (action.type === 'clear') await owner.locator('.ant-select-clear').click();
  else if (action.type === 'remove') await owner.locator('.ant-select-selection-item').filter({ hasText: action.text })
    .locator('.ant-select-selection-item-remove').click();
  else if (action.type === 'choose') {
    const row = popup.locator('.ant-select-item-option-content')
      .filter({ hasText: new RegExp(`^${action.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) });
    await row.scrollIntoViewIfNeeded();
    await drainSelectSurface(page);
    await row.click();
  } else await page.evaluate(action => document.querySelector('[data-surface-command]')!
    .dispatchEvent(new CustomEvent('surfaceupdate', { detail: action })), action);
  await page.mouse.move(0, 0);
}
