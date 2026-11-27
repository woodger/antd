import type { Page } from '@playwright/test';
import { test, expect } from '../test';
import source from '../fixtures/ant-design-menu-item-icon-reference.json' with { type: 'json' };

const samplePicker = (page: Page) => page.getByRole('combobox', { name: 'Menu item icon sample' });
const leaf = (page: Page) => page.locator('.sample-leaf:visible');
const rowsSelector = '.sample-branch, .sample-root, .sample-leaf, .sample-other';

// Reads the contents of visible strings, including the snippet value and its position after the label.
async function readRows(page: Page) {
  return page.locator(rowsSelector).filter({ visible: true }).evaluateAll(rows => rows.flatMap(row => {
    if (row.closest('[aria-hidden="true"]')) {
      return [];
    }

    const key = [...row.classList].find(name => name.startsWith('sample-'));
    const element = row.matches('[role=menuitem]') ? row : row.querySelector(':scope > [role=menuitem]');
    if (!element || !key) {
      return [];
    }

    const marker = element.querySelector<HTMLElement>(':scope > [data-item-icon]');
    const last = Array.from(element.childNodes).findLast(node => node instanceof Element
      || node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
    const text = element.textContent;
    return [{
      key,
      // At the native header of the branch in front of the arrow there is a gap.
      text: key === 'sample-branch' ? text?.trimEnd() : text,
      last: last instanceof Element ? last.tagName : last?.textContent,
      custom: marker ? { ...marker.dataset } : null,
      primary: Boolean(element.querySelector('[data-main-icon]'))
    }];
  }).sort((a, b) => a.key.localeCompare(b.key)));
}

// Does not include aria-disabled from React: global disabled turns off all lines Native Menu.
function visibleContent(reference: typeof source.cases[number]['initial']) {
  return reference.map(({ ariaDisabled: _disabled, ...entry }) => entry)
    .sort((a, b) => a.key.localeCompare(b.key));
}

test.use({ viewport: { width: 1100, height: 700 }, reducedMotion: 'reduce' });
test.beforeEach(async ({ page }) => {
  await page.goto('/?fixture=menu-item-icon');
  await expect(samplePicker(page)).toBeVisible();
});

for (const sample of source.cases) {
  test(`renders the trailing item icon for ${sample.options.id}`, async ({ page }) => {
    await samplePicker(page).selectOption(sample.options.id);

    await expect.poll(() => readRows(page)).toEqual(visibleContent(sample.initial));
    const menu = page.getByRole('menu', { name: 'Menu with item icons' });
    await expect(menu).not.toHaveAttribute('itemicon');
    if (sample.options.disabled) {
      await expect(leaf(page)).toHaveAttribute('aria-disabled', 'true');
      await expect(page.locator('.sample-root')).toHaveAttribute('aria-disabled', 'true');
    }

    await page.getByRole('button', { name: 'Select Other' }).click();

    await expect.poll(() => readRows(page)).toEqual(visibleContent(sample.updated));
  });
}

test('keeps the same focused item when updating the inherited icon', async ({ page }) => {
  const item = leaf(page);
  await item.focus();
  const original = await item.elementHandle();
  await expect(item.locator(':scope > [data-item-icon]')).toHaveAttribute('data-item-icon', 'root');

  await page.getByRole('button', { name: 'Replace root item icon' }).evaluate(
    (button: HTMLButtonElement) => { button.click(); }
  );

  await expect(item.locator(':scope > [data-item-icon]'))
    .toHaveAttribute('data-item-icon', 'replacement');
  await expect(item).toBeFocused();
  expect(await item.evaluate((element, handle) => element === handle, original)).toBe(true);
});
