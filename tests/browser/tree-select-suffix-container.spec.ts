import type { Page } from '@playwright/test';
import { test, expect } from './test';
import reference from './fixtures/ant-design-tree-select-suffix-container-reference.json' with { type: 'json' };
import type { TreeSelectSuffixContainerAction } from './fixtures/tree-select-suffix-container-cases';
import { treeSelectSuffixContainerSamples, treeSelectSuffixContainerViewport } from './fixtures/tree-select-suffix-container-cases';
import { readTreeSelectSuffixLayout, treeSelectSuffixLayoutPoint } from './tree-select-suffix-layout-metrics';
import { projectTreeSelectSuffixContainer, readTreeSelectSuffixContainer } from './tree-select-suffix-container-metrics';
import { settleTreeSelectSuffixLayout } from './tree-select-suffix-layout-settle';

test.use({ viewport: treeSelectSuffixContainerViewport });

async function act(page: Page, action: TreeSelectSuffixContainerAction) {
  if (action.type === 'click') {
    const point = await page.evaluate(treeSelectSuffixLayoutPoint, action.point);
    await page.mouse.click(point.x, point.y);
    return { point: action.point, hit: point.hit };
  }
  if (action.type === 'fill') await page.locator('[data-suffix-layout-editor]').fill(action.text);
  else if (action.type === 'move-host') await page.locator('[data-suffix-layout-case]').evaluate((node, update) => {
    node.style.setProperty('--source-host-top', `${update.top}px`);
    node.style.setProperty('--source-host-left', `${update.left}px`);
  }, action);
  else if (action.type === 'window-resize') await page.setViewportSize({ width: action.width, height: action.height });
  else await page.locator('[data-suffix-container-scroller]').evaluate((node, update) => {
    node.scrollTop = update.top;
    node.scrollLeft = update.left;
  }, action);
  return null;
}

for (const entry of reference.cases) {
  test(`TreeSelect custom suffix follows Source positioned popup container for ${entry.id}`, async ({ page }) => {
    expect(reference.reference.sourcePortalDOM).toEqual([{ position: 'absolute', offsetParent: 'case-host' }]);
    await page.goto('/?fixture=tree-select-suffix-container');
    await page.getByRole('combobox', { name: 'TreeSelect suffix container sample', exact: true }).selectOption(entry.id);
    await page.mouse.move(0, 0);
    await expect(page.locator('[data-suffix-layout-case]')).toHaveAttribute('data-suffix-layout-bound', 'true');
    const sample = treeSelectSuffixContainerSamples.find(sample => sample.id === entry.id)!;
    await page.locator('[data-suffix-layout-command]').evaluate((node, width) => {
      node.dispatchEvent(new CustomEvent('suffixlayoutupdate', { detail: { width } }));
    }, sample.width);
    const read = async () => ({
      view: await page.evaluate(readTreeSelectSuffixLayout),
      portal: projectTreeSelectSuffixContainer(await page.evaluate(readTreeSelectSuffixContainer))
    });
    expect(await settleTreeSelectSuffixLayout(page, read)).toEqual(entry.initial);
    const identity = await page.evaluateHandle(() => {
      const root = document.querySelector<HTMLElement>('[data-suffix-layout-case] .ant-select')!;
      const editor = root.querySelector<HTMLElement>('[data-suffix-layout-editor]')!;
      return { root, editor, parent: editor.parentElement,
        suffix: editor.closest('.ant-select-content-item-suffix,[data-ant-tree-choice-input-suffix]'),
        prefix: root.querySelector('[data-suffix-layout-prefix]'), popup: null as HTMLElement | null };
    });
    try {
      for (const step of entry.steps) {
        expect(await act(page, step.action as TreeSelectSuffixContainerAction)).toEqual(step.pointer);
        expect(await settleTreeSelectSuffixLayout(page, read), JSON.stringify(step.action)).toEqual({ view: step.view, portal: step.portal });
        // Native top-layer popup сохраняет fixed/null; Source absolute/case-host записан отдельно от общей геометрии.
        expect(await page.locator('.ant-tree-select-dropdown').evaluate(node => {
          if (!(node instanceof HTMLElement)) throw new TypeError('TreeSelect popup must be an HTML element');
          return { position: getComputedStyle(node).position, offsetParent: node.offsetParent === null ? 'none' : 'element' };
        })).toEqual({ position: 'fixed', offsetParent: 'none' });
        expect(await identity.evaluate(old => {
          const root = document.querySelector<HTMLElement>('[data-suffix-layout-case] .ant-select')!;
          const editor = root.querySelector<HTMLElement>('[data-suffix-layout-editor]')!;
          const popup = document.querySelector<HTMLElement>('.ant-tree-select-dropdown');
          const samePopup = !old.popup || old.popup === popup;
          old.popup ??= popup;
          return { root: old.root === root, editor: old.editor === editor, parent: old.parent === editor.parentElement,
            suffix: old.suffix === editor.closest('.ant-select-content-item-suffix,[data-ant-tree-choice-input-suffix]'),
            prefix: old.prefix === root.querySelector('[data-suffix-layout-prefix]'), popup: samePopup };
        })).toEqual({ root: true, editor: true, parent: true, suffix: true, prefix: true, popup: true });
      }
    } finally { await identity.dispose(); }
  });
}
