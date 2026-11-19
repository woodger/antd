import type { Page } from '@playwright/test';
import { test, expect } from './test';
import reference from './fixtures/ant-design-tree-select-suffix-layout-reference.json' with { type: 'json' };
import type { TreeSelectSuffixLayoutAction } from './fixtures/tree-select-suffix-layout-cases';
import { treeSelectSuffixLayoutSamples } from './fixtures/tree-select-suffix-layout-cases';
import { readTreeSelectSuffixLayout, treeSelectSuffixLayoutPoint } from './tree-select-suffix-layout-metrics';
import { settleTreeSelectSuffixLayout } from './tree-select-suffix-layout-settle';

test.use({ viewport: reference.reference.viewport });

async function command(page: Page, action: TreeSelectSuffixLayoutAction) {
  await page.locator('[data-suffix-layout-command]').evaluate((node, detail) => {
    node.dispatchEvent(new CustomEvent('fixtureupdate', { detail }));
  }, action);
}
async function act(page: Page, action: TreeSelectSuffixLayoutAction) {
  const field = page.locator('[data-suffix-layout-editor]');
  if (action.type === 'resize' || action.type === 'prefix-resize' || action.type === 'rest-resize' || action.type === 'value') {
    await command(page, action);
  }
  else if (action.type === 'fill') await field.fill(action.text);
  else if (action.type === 'focus') await field.focus();
  else if (action.type === 'caret') {
    await field.evaluate((node, range) => {
      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
        node.setSelectionRange(
          range.start,
          range.end
        );
      }
      else throw new TypeError('Suffix layout editor must be an input or textarea');
    }, action);
  }
  else if (action.type === 'outside') {
    await page.getByRole(
      'button',
      { name: 'Outside suffix layout', exact: true }
    ).click();
  }
  else if (action.type === 'click') {
    const point = await page.evaluate(treeSelectSuffixLayoutPoint, action.point);
    await page.mouse.click(point.x, point.y);
    return { point: action.point, hit: point.hit };
  }
  return null;
}

for (const entry of reference.cases) {
  test(`TreeSelect custom responsive suffix preserves Source geometry and physical hit areas for ${entry.id}`, async ({ page }) => {
    await page.goto('/?fixture=tree-select-suffix-layout');
    await page.getByRole('combobox', { name: 'TreeSelect suffix layout sample', exact: true }).selectOption(entry.id);
    await page.mouse.move(0, 0);

    await expect(page.locator('[data-suffix-layout-case]')).toHaveAttribute(
      'data-suffix-layout-bound',
      'true'
    );
    const sample = treeSelectSuffixLayoutSamples.find(sample => sample.id === entry.id)!;
    await command(page, { type: 'resize', width: sample.width });
    const read = () => page.evaluate(readTreeSelectSuffixLayout);

    expect(await settleTreeSelectSuffixLayout(page, read)).toEqual(entry.initial);

    const previous = await page.evaluateHandle(() => {
      const root = document.querySelector<HTMLElement>('[data-suffix-layout-case] .ant-select')!;
      const editor = root.querySelector<HTMLElement>('[data-suffix-layout-editor]')!;
      return { root, editor, suffix: editor.closest<HTMLElement>('.ant-select-content-item-suffix,[data-ant-tree-choice-input-suffix]')!,
        prefix: root.querySelector<HTMLElement>('[data-suffix-layout-prefix]'), popup: null as HTMLElement | null };
    });
    try {
      for (const step of entry.steps) {
        const pointer = await act(page, step.action as TreeSelectSuffixLayoutAction);
        expect(pointer).toEqual(step.pointer);
        expect(await settleTreeSelectSuffixLayout(page, read), JSON.stringify(step.action)).toEqual(step.view);
        expect(await previous.evaluate(old => {
          const root = document.querySelector<HTMLElement>('[data-suffix-layout-case] .ant-select')!;
          const editor = root.querySelector<HTMLElement>('[data-suffix-layout-editor]')!;
          const popup = document.querySelector<HTMLElement>('.ant-tree-select-dropdown');
          const samePopup = !old.popup || !popup || old.popup === popup;
          if (popup && !old.popup) old.popup = popup;
          return { root: root === old.root, editor: editor === old.editor,
            suffix: editor.closest('.ant-select-content-item-suffix,[data-ant-tree-choice-input-suffix]') === old.suffix,
            prefix: root.querySelector('[data-suffix-layout-prefix]') === old.prefix, popup: samePopup };
        })).toEqual(step.identity);
      }
    } finally { await previous.dispose(); }
  });
}
