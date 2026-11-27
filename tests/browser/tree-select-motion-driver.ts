// Performs DOM actions and clear time steps to compare motion TreeSelect. Actions use the current
// editor after root replacement.
import type { Page } from '@playwright/test';
import type { TreeSelectMotionRootSwapAction } from './fixtures/tree-select-motion-root-swap-cases';
import { advanceTreeSelectMotionFrames, setTreeSelectMotionTime } from './tree-select-motion-metrics';

// Seeking an editor for every action. If it is not available, uses the current root.
async function findMotionField(page: Page) {
  const editor = page.locator('[data-motion-case] [data-motion-editor],'
    + '[data-motion-case] input[role="combobox"],'
    + '[data-motion-case] textarea[role="combobox"]');
  const editorCount = await editor.count();
  return editorCount ? editor.first() : page.locator('[data-motion-root]').first();
}

/** Starts a single action without promoting time other than the specified frame and clock steps. */
export async function actTreeSelectMotion(page: Page, action: TreeSelectMotionRootSwapAction) {
  if (action.type === 'click') {
    const editor = await findMotionField(page);
    await editor.click();
  }
  else if (action.type === 'focus') {
    const editor = await findMotionField(page);
    await editor.focus();
  }
  else if (action.type === 'outside') {
    await page.locator('[data-motion-outside]').click();
  }
  else if (action.type === 'escape') {
    const editor = await findMotionField(page);
    await editor.press('Escape');
  }
  else if (action.type === 'fill') {
    const editor = await findMotionField(page);
    await editor.fill(action.text);
  }
  else if (action.type === 'caret') {
    const editor = await findMotionField(page);
    // Set the selection on the current editor inside the browser realm.
    await editor.evaluate((node, range) => {
      if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)) {
        throw Error('Expected an editable motion field');
      }
      node.setSelectionRange(range.start, range.end);
    }, action);
  }
  else if (action.type === 'draft') {
    // The total motion panel preserves both values: text and caret position.
    await page.locator('[data-motion-draft]').evaluate((node, draft) => {
      if (!(node instanceof HTMLInputElement)) {
        throw Error('Expected a motion panel draft');
      }
      node.value = draft.text;
      node.setSelectionRange(draft.start, draft.end);
    }, action);
  }
  else if (action.type === 'choose') {
    await page
      .getByText(action.value === 'a' ? 'Alpha' : 'Beta', { exact: true }).last().click();
  }
  else if (action.type === 'open' || action.type === 'label'
    || action.type === 'left' || action.type === 'props' || action.type === 'root-swap') {
    await page
    .locator('[data-motion-command]').evaluate((node, update) => {
      node.dispatchEvent(new CustomEvent('motionupdate', { detail: update }));
    }, action);
  }
  else if (action.type === 'viewport') {
    await page
      .setViewportSize({ width: action.width, height: action.height });
  }
  else if (action.type === 'frame') {
    await page.evaluate(advanceTreeSelectMotionFrames, action.count);
  }
  else if (action.type === 'clock') {
    await page.evaluate(setTreeSelectMotionTime, action.time);
  }
  else if (action.type === 'end') {
    // Sends an event from the selected purpose to check the motion event filter.
    await page.locator('.motion-audit-popup').evaluate((popup, end) => {
      const node = end.target === 'child' ? popup.querySelector('[data-motion-panel]') : popup;
      if (!node) {
        throw Error('Missing TreeSelect motion end target');
      }
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
  }
  else {
    throw Error(`Unexpected TreeSelect motion action: ${JSON.stringify(action)}`);
  }
}
