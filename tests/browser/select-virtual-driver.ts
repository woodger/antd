import type { Page } from '@playwright/test';
import type { SelectVirtualAction } from './fixtures/select-virtual-cases';

export async function drainSelectVirtual(page: Page) {
  await page.evaluate(async () => {
    document.querySelector('[data-select-virtual-command]')?.dispatchEvent(new CustomEvent('virtualstyles'));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise(resolve => setTimeout(resolve));
    await new Promise(resolve => setTimeout(resolve));
  });
}
export async function prepareSelectVirtual(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.mouse.move(0, 0);
  await drainSelectVirtual(page);
}
export async function actSelectVirtual(page: Page, action: SelectVirtualAction) {
  const owner = page.locator('[data-select-virtual-case]');
  const editor = owner.locator('input[role="combobox"],textarea[role="combobox"]').first();
  const popup = page.locator('.ant-select-dropdown:visible').first();
  const holder = popup.locator('[class$="-list-holder"]').first();
  if (action.type === 'click') await editor.click();
  else if (action.type === 'outside') await page.locator('[data-select-virtual-outside]').click();
  else if (action.type === 'fill') await editor.fill(action.text);
  else if (action.type === 'caret') await editor.evaluate((node, action) => {
    const input = node as HTMLInputElement | HTMLTextAreaElement;
    input.focus();
    input.setSelectionRange(action.start, action.end);
  }, action);
  else if (action.type === 'key') await editor.press(action.key);
  else if (action.type === 'hover') await popup.locator('.ant-select-item-option-content')
    .filter({ hasText: new RegExp(`^${action.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).hover();
  else if (action.type === 'wheel') { await holder.hover(); await page.mouse.wheel(0, action.delta); }
  else if (action.type === 'scroll') await holder.evaluate((node, top) => { node.scrollTop = top; }, action.top);
  else if (action.type === 'drag') {
    const thumb = popup.locator('[class$="-scrollbar-thumb"]').first();
    const bounds = await thumb.boundingBox();
    const track = await thumb.locator('..').boundingBox();
    if (!bounds || !track) throw Error('The public vertical scrollbar is not visible');
    const x = bounds.x + bounds.width / 2;
    await page.mouse.move(x, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(x, action.to === 'end' ? track.y + track.height - bounds.height / 2
      : track.y + track.height / 2, { steps: 6 });
    await page.mouse.up();
  } else if (action.type === 'wait') await page.waitForTimeout(action.time);
  else await page.evaluate(action => {
    document.querySelector('[data-select-virtual-command]')!
      .dispatchEvent(new CustomEvent('virtualupdate', { detail: action }));
  }, action);
  await page.mouse.move(0, 0);
}
