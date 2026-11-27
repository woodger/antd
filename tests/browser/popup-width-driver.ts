import type { Page } from '@playwright/test';
import type { PopupWidthAction } from './fixtures/popup-width-cases';

async function field(page: Page, target?: 'year' | 'month' | 'format') {
  const family = await page.locator('[data-width-case]').getAttribute('data-width-family');
  if (family === 'calendar') return page.locator(`.ant-picker-calendar-${target ?? 'year'}-select`).first();
  if (family === 'color-picker') return page.locator('.ant-color-picker-format-select').first();
  if (family === 'pagination') return page.locator('[data-width-case] .ant-select').first();
  const editor = page.locator('[data-width-case] input[role="combobox"]');
  return await editor.count() ? editor.first() : page.locator('.popup-width-control').first();
}

export async function preparePopupWidth(page: Page) {
  await page.evaluate(() => {
    scrollTo(0, 0);
    document.querySelector('[data-width-command]')?.dispatchEvent(new Event('widthstyles'));
  });
  await page.mouse.move(0, 0);
}

/** The same real owner-prop, DOM and wheel actions for both implementations. */
export async function actPopupWidth(page: Page, action: PopupWidthAction) {
  if (action.type === 'click') {
    await page.locator('[data-width-case]').evaluate((node, target) => {
      if (target) (node as HTMLElement).dataset.widthActive = target;
    }, action.target);
    await (await field(page, action.target)).click();
  } else if (action.type === 'outside') await page.locator('[data-width-outside]').click();
  else if (['width', 'anchor', 'open', 'outer'].includes(action.type)) await page.locator('[data-width-command]')
    .evaluate((node, detail) => node.dispatchEvent(new CustomEvent('widthupdate', { detail })), action);
  else if (action.type === 'fill') await (await field(page)).fill(action.text);
  else if (action.type === 'caret') await (await field(page)).evaluate((node, range) => {
    if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)) throw Error('Expected a searchable editor');
    node.setSelectionRange(range.start, range.end);
  }, action);
  else if (action.type === 'wheel') {
    await page.locator('.ant-select-dropdown:visible').first().hover();
    await page.mouse.wheel(0, action.delta);
  } else if (action.type === 'expand') await page.locator('.ant-cascader-menu-item-content')
    .filter({ hasText: /^Parent$/ }).first().click();
  else throw Error(`Unknown popup width action: ${JSON.stringify(action)}`);
  await page.mouse.move(0, 0);
}

export async function drainPopupWidth(page: Page) {
  await page.evaluate(async () => {
    document.querySelector('[data-width-command]')?.dispatchEvent(new Event('widthstyles'));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}
