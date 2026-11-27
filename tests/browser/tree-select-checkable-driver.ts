import type { Page } from '@playwright/test';
import type { TreeSelectCheckableAction } from './fixtures/tree-select-checkable-cases';

async function field(page: Page) {
  const editor = page.locator('[data-checkable-case] [data-checkable-editor],'
    + '[data-checkable-case] input[role="combobox"]');
  return await editor.count() ? editor.first() : page.locator('[data-checkable-root]').first();
}

/** Same real public DOM actions for Source and Native; no production implementation imports. */
export async function actTreeSelectCheckable(page: Page, action: TreeSelectCheckableAction) {
  if (action.type === 'click') await (await field(page)).click();
  else if (action.type === 'choose') {
    const target = await field(page);
    if (!await page.locator('.checkable-audit-popup:visible').count()) await target.click();
    const title = { p: 'Parent', a: 'Alpha', b: 'Beta', c: 'Gamma' }[action.value];
    const row = page.locator('.checkable-audit-popup [role="treeitem"]')
      .filter({ has: page.getByText(title, { exact: true }) }).last();
    const checkbox = row.locator('.ant-select-tree-checkbox,.ant-tree-checkbox');
    const content = row.locator('.ant-select-tree-node-content-wrapper,.ant-tree-node-content-wrapper');
    // Source uses disabled spans, while Native uses real disabled buttons; both receive the same physical probe.
    await (await checkbox.count() ? checkbox : content).click({ force: true });
  } else if (action.type === 'value' || action.type === 'props' || action.type === 'open') {
    await page.locator('[data-checkable-command]').evaluate((node, detail) => {
      node.dispatchEvent(new CustomEvent('checkableupdate', { detail }));
    }, action);
  } else if (action.type === 'fill') await (await field(page)).fill(action.text);
  else if (action.type === 'caret') await (await field(page)).evaluate((node, range) => {
    if (!(node instanceof HTMLInputElement)) throw Error('Expected a searchable TreeSelect editor');
    node.setSelectionRange(range.start, range.end);
  }, action);
  else if (action.type === 'clear') {
    await page.locator('.checkable-audit-root,[data-checkable-root]').first().hover();
    await page.locator('.checkable-audit-root .ant-select-clear,[data-checkable-root] .ant-select-clear').click();
  } else throw Error(`Unexpected TreeSelect checkable action: ${JSON.stringify(action)}`);
  // A mode update can replace rows under the pointer; leave them before observing the next public state.
  await page.mouse.move(0, 0);
}
