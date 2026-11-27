import type { Page } from '@playwright/test';
import type { PopupOverflowAction, PopupOverflowSample, PopupOverflowSmokeSample } from './fixtures/popup-overflow-cases';

async function field(page: Page) {
  const family = await page.locator('[data-overflow-case]').getAttribute('data-overflow-family');
  if (family === 'color-picker') return page.locator('.ant-color-picker-format-select').first();
  if (family === 'calendar') return page.locator('.ant-picker-calendar-year-select').first();
  if (family === 'pagination') return page.locator('[data-overflow-case] .ant-select').first();
  const custom = page.locator('[data-overflow-anchor]');
  if (await custom.count()) return custom.first();
  const editor = page.locator('[data-overflow-case] input[role="combobox"],'
    + '[data-overflow-case] .popup-overflow-control input,[data-overflow-case] textarea');
  return await editor.count() ? editor.first() : page.locator('.popup-overflow-control').first();
}

/** Public initial environment; no component or private alignment calls. */
export async function preparePopupOverflow(page: Page, sample: PopupOverflowSample | PopupOverflowSmokeSample) {
  await page.evaluate(documentLayout => {
    window.scrollTo(0, documentLayout ? 400 : 0);
    const clip = document.querySelector('[data-overflow-clip]');
    if (clip) clip.scrollTo(0, 0);
    document.querySelector('[data-overflow-command]')?.dispatchEvent(new Event('overflowstyles'));
  }, sample.layout === 'document');
  await page.mouse.move(0, 0);
}

/** Identical real DOM actions for Source and Native. */
export async function actPopupOverflow(page: Page, action: PopupOverflowAction) {
  if (action.type === 'click') {
    const target = await field(page);
    if (await page.locator('[data-overflow-family="mentions"]').count()) {
      await target.click();
      await target.pressSequentially('@');
    }
    else await target.click();
  } else if (action.type === 'outside') await page.locator('[data-overflow-outside]').click();
  else if (action.type === 'context' || action.type === 'open') {
    await page.locator('[data-overflow-command]').evaluate((node, detail) => {
      node.dispatchEvent(new CustomEvent('overflowupdate', { detail }));
    }, action);
  } else if (action.type === 'viewport') await page.setViewportSize({ width: action.width, height: action.height });
  else if (action.type === 'scroll') await page.evaluate(detail => {
    const target = detail.target === 'window' ? window : document.querySelector('[data-overflow-clip]');
    if (!target) throw Error('Missing public fixture scroller');
    target.scrollTo(detail.left, detail.top);
  }, action);
  else if (action.type === 'fill') await (await field(page)).fill(action.text);
  else if (action.type === 'caret') await (await field(page)).evaluate((node, range) => {
    if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)) throw Error('Expected searchable editor');
    node.setSelectionRange(range.start, range.end);
  }, action);
  else if (action.type === 'expand' || action.type === 'choose') {
    const title = action.value === 'p' ? 'Parent' : 'Alpha';
    const item = page.locator('.ant-cascader-menu-item-content').filter({ hasText: new RegExp(`^${title}$`) }).last();
    await item.click();
  } else throw Error(`Unknown popup overflow action: ${JSON.stringify(action)}`);
  await page.mouse.move(0, 0);
}

/** Drain only public paint/task work; Source capture checks repeated complete projections. */
export async function drainPopupOverflow(page: Page) {
  await page.evaluate(async () => {
    document.querySelector('[data-overflow-command]')?.dispatchEvent(new Event('overflowstyles'));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}
