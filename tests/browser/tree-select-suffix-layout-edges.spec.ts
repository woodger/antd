import { test, expect } from './test';
import reference from './fixtures/ant-design-tree-select-suffix-layout-edges-reference.json' with { type: 'json' };
import type { TreeSelectSuffixLayoutEdgeAction } from './fixtures/tree-select-suffix-layout-edge-cases';
import { readTreeSelectSuffixLayoutEdges } from './tree-select-suffix-layout-edges-metrics';
import { settleTreeSelectSuffixLayout } from './tree-select-suffix-layout-settle';

test.use({ viewport: reference.reference.viewport });

for (const entry of reference.cases) {
  test(`TreeSelect custom responsive suffix matches Source static-renderer and containing-block history for ${entry.id}`, async ({ page }) => {
    await page.goto('/?fixture=tree-select-suffix-layout-edges');
    await page.getByRole('combobox', { name: 'TreeSelect suffix edge sample', exact: true }).selectOption(entry.id);
    await page.mouse.move(0, 0);

    await expect(page.locator('[data-suffix-edge-host]')).toHaveAttribute(
      'data-suffix-edge-bound',
      'true'
    );
    const read = () => page.evaluate(readTreeSelectSuffixLayoutEdges);

    expect(await settleTreeSelectSuffixLayout(page, read)).toEqual(entry.initial);
    const previous = await page.evaluateHandle(() => {
      const root = document.querySelector('[data-suffix-edge-host] .ant-select')!;
      const editor = root.querySelector('[data-suffix-edge-editor]')!;
      return { root, editor, parent: editor.parentNode, popup: null as Element | null };
    });
    try {
      for (const step of entry.steps) {
        const action = step.action as TreeSelectSuffixLayoutEdgeAction;
        if (action.type === 'click-editor') {
          await page.locator('[data-suffix-edge-editor]').click();
        }
        else if (action.type === 'fill') {
          await page.locator('[data-suffix-edge-editor]').fill(action.text);
        }
        else {
          await page.locator('[data-suffix-edge-command]').evaluate((node, detail) => {
            node.dispatchEvent(new CustomEvent('suffixedgeupdate', { detail }));
          }, action);
        }
        expect(await settleTreeSelectSuffixLayout(page, read), JSON.stringify(action)).toEqual(step.view);
        expect(await previous.evaluate(old => {
          const root = document.querySelector('[data-suffix-edge-host] .ant-select')!;
          const editor = root.querySelector('[data-suffix-edge-editor]')!;
          const popup = document.querySelector('.ant-tree-select-dropdown');
          const samePopup = !old.popup || old.popup === popup;
          old.popup ??= popup;
          return root === old.root && editor === old.editor && editor.parentNode === old.parent && samePopup;
        })).toBe(true);
      }
    } finally { await previous.dispose(); }
  });
}
