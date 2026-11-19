import type { Page } from '@playwright/test';
import type { TreeSelectMotionRootSwapAction } from './fixtures/tree-select-motion-root-swap-cases';
import { advanceTreeSelectMotionFrames, setTreeSelectMotionTime } from './tree-select-motion-metrics';

async function field(page: Page) {
  const editor = page.locator('[data-motion-case] [data-motion-editor],'
    + '[data-motion-case] input[role="combobox"],'
    + '[data-motion-case] textarea[role="combobox"]');
  return await editor.count() ? editor.first() : page.locator('[data-motion-root]').first();
}

/** The Source and Native captures run the same public DOM actions and explicit phase steps. */
export async function actTreeSelectMotion(page: Page, action: TreeSelectMotionRootSwapAction) {
  if (action.type === 'click') await (await field(page)).click();
  else if (action.type === 'focus') await (await field(page)).focus();
  else if (action.type === 'outside') await page.locator('[data-motion-outside]').click();
  else if (action.type === 'escape') await (await field(page)).press('Escape');
  else if (action.type === 'fill') await (await field(page)).fill(action.text);
  else if (action.type === 'caret') await (await field(page)).evaluate((node, range) => {
    if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement))
      throw Error('Expected an editable motion field');
    node.setSelectionRange(range.start, range.end);
  }, action);
  else if (action.type === 'draft') await page.locator('[data-motion-draft]').evaluate((node, draft) => {
    if (!(node instanceof HTMLInputElement)) throw Error('Expected a motion panel draft');
    node.value = draft.text;
    node.setSelectionRange(draft.start, draft.end);
  }, action);
  else if (action.type === 'choose') await page
    .getByText(action.value === 'a' ? 'Alpha' : 'Beta', { exact: true }).last().click();
  else if (action.type === 'open' || action.type === 'label'
    || action.type === 'left' || action.type === 'props' || action.type === 'root-swap') await page
    .locator('[data-motion-command]').evaluate((node, update) => {
      node.dispatchEvent(new CustomEvent('motionupdate', { detail: update }));
    }, action);
  else if (action.type === 'viewport') await page
    .setViewportSize({ width: action.width, height: action.height });
  else if (action.type === 'frame') await page.evaluate(advanceTreeSelectMotionFrames, action.count);
  else if (action.type === 'clock') await page.evaluate(setTreeSelectMotionTime, action.time);
  else if (action.type === 'end') await page.locator('.motion-audit-popup').evaluate((popup, end) => {
    const node = end.target === 'child' ? popup.querySelector('[data-motion-panel]') : popup;
    if (!node) throw Error('Missing TreeSelect motion end target');
    const event = end.event === 'animationend'
      ? new AnimationEvent(
        'animationend',
        { bubbles: true, animationName: end.name ?? 'consumer-motion' }
      )
      : new TransitionEvent(
        'transitionend',
        { bubbles: true, propertyName: end.name ?? 'transform' }
      );
    node.dispatchEvent(event);
  }, action);
  else throw Error(`Unexpected TreeSelect motion action: ${JSON.stringify(action)}`);
}
