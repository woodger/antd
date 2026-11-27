import type { Page } from '@playwright/test';
import { expect, test } from './test';
import source from './fixtures/ant-design-table-filter-options-reference.json' with { type: 'json' };

test.use({ viewport: source.reference.viewport, locale: 'en-US' });

const fixture = '/?fixture=table-filter-options';

/** Removes the options visible even when transferring the submenu to the child popup. */
function snapshot() {
  const root = document.getElementById('table-filter-options-fixture');
  if (!root) {
    throw new Error('Missing Table filter options fixture');
  }

  const popup = root.querySelector('[role="dialog"]:popover-open');
  const search = popup?.querySelector<HTMLInputElement>('[data-ant-table-filter-search] input');
  const all = popup?.querySelector<HTMLInputElement>('.ant-table-filter-dropdown-checkall input');

  /** Excludes the hidden items of the previously visited menu. */
  function visible(node: Element) {
    return node.getClientRects().length > 0;
  }

  const list = Array.from(root.querySelectorAll<HTMLInputElement>('.filter-options input'))
    .filter(visible).map(node => ({
      label: node.labels?.[0]?.textContent?.trim() ?? '', checked: node.checked
    }));
  const nested = Array.from(root.querySelectorAll('[role="menuitemcheckbox"],[role="menuitemradio"]'))
    .filter(visible).map(node => ({
      label: node.textContent?.trim() ?? '', checked: node.getAttribute('aria-checked') === 'true'
    }));
  const groups = Array.from(root.querySelectorAll('[data-ant-menu-submenu-title]'))
    .filter(visible).map(node => ({
      label: node.textContent?.trim() ?? '', expanded: node.getAttribute('aria-expanded')
    }));
  const tree = Array.from(root.querySelectorAll('[role="treeitem"]'))
    .filter(visible).map(node => ({
      label: node.querySelector('[data-ant-tree-content]')?.textContent?.trim() ?? '',
      checked: node.getAttribute('aria-checked') === 'true',
      mixed: node.getAttribute('aria-checked') === 'mixed',
      expanded: node.getAttribute('aria-expanded'),
      match: node.classList.contains('filter-node')
    }));
  const rows = Array.from(root.querySelectorAll<HTMLTableRowElement>('tbody tr[data-row-key]'),
    node => Number(node.dataset.rowKey));
  const changes = JSON.parse(root.querySelector('[data-filter-options-changes]')?.textContent ?? '[]');
  return {
    open: Boolean(popup), search: search?.value ?? null, empty: Boolean(popup?.querySelector('.ant-empty')),
    active: Boolean(root.querySelector('.ant-table-filter-trigger.active')),
    all: all ? { checked: all.checked, mixed: all.indeterminate } : null,
    menu: [...list, ...nested], groups, tree, rows, changes
  };
}

/** Repeats the action from the Ant Design run on elements Svelte. */
async function act(page: Page, action: string) {
  const [kind, label] = action.split(':', 2);
  switch (kind) {
    case 'open':
      await page.getByRole('button', { name: 'Filter: Category', exact: true }).click();
      return;
    case 'query':
      await page.getByRole('textbox', { name: 'Search in filters', exact: true }).fill(label);
      return;
    case 'choose':
      await page.getByText(label, { exact: true }).click();
      return;
    case 'submenu':
      await page.getByRole('menuitem', { name: label, exact: true }).hover();
      return;
    case 'switch':
      await page.getByRole('treeitem', { name: label, exact: true })
        .locator('[data-ant-tree-switcher]').click();
      return;
    case 'check':
      await page.getByRole('checkbox', { name: label, exact: true }).click();
      return;
    case 'all':
      await page.getByRole('checkbox', { name: 'Select all items', exact: true }).click();
      return;
    case 'apply':
      await page.getByRole('button', { name: 'Apply', exact: true }).click();
      return;
    default:
      throw new Error(`Unknown filter options action ${action}`);
  }
}

for (const { profile, states } of source.cases) {
  test(`Table filter options match Ant Design for ${profile.id}`, async ({ page }) => {
    await page.goto(`${fixture}&profile=${profile.id}`);

    for (const { action, state } of states) {
      if (action) {
        await act(page, action);
      }
      await expect.poll(() => page.evaluate(snapshot), {
        message: `${profile.id} ${action ?? 'initial'}`
      }).toEqual(state);
    }
  });
}

test('Table distinguishes numeric zero, string zero and false below a branch', async ({ page }) => {
  await page.goto(`${fixture}&profile=tree-types`);
  await expect.poll(() => page.evaluate(snapshot)).toMatchObject({ rows: [2], active: true });

  await act(page, 'open');
  await act(page, 'check:Numeric zero');
  await act(page, 'apply');

  await expect.poll(() => page.evaluate(snapshot)).toMatchObject({
    rows: [0, 2], changes: [{ filters: { category: [0, false] }, rows: [0, 2] }]
  });
});

test('Table closes a draft when an option inside a branch is removed', async ({ page }) => {
  await page.goto(`${fixture}&profile=owner-updates`);
  await act(page, 'open');
  await act(page, 'check:Apple');

  await page.getByRole('button', { name: 'Change filter options' }).dispatchEvent('click');

  await expect(page.getByRole('dialog', { name: 'Filter: Category' })).toBeHidden();
  await expect(page.locator('[data-filter-options-changes]')).toHaveText('[]');
  await act(page, 'open');
  await expect(page.getByRole('treeitem', { name: 'Apple', exact: true })).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: 'Banana', exact: true })).not.toBeChecked();
});

test('Enter in filter search keeps the menu and the outer form unchanged', async ({ page }) => {
  await page.goto(fixture);
  const trigger = page.getByRole('button', { name: 'Filter: Category', exact: true });
  await trigger.press('Enter');
  const search = page.getByRole('textbox', { name: 'Search in filters', exact: true });
  await expect(search).toBeFocused();
  await search.fill('Pear');

  await search.press('Enter');

  await expect(search).toBeFocused();
  await expect(page.locator('[data-filter-options-submissions]')).toHaveText('0');
  await expect(page.locator('[data-filter-options-changes]')).toHaveText('[]');
  await search.press('Escape');
  await expect(trigger).toBeFocused();
});

test('Nested filter menu exposes checked state and restores focus on Escape', async ({ page }) => {
  await page.goto(`${fixture}&profile=menu-groups`);
  const trigger = page.getByRole('button', { name: 'Filter: Category', exact: true });
  const dialog = page.getByRole('dialog', { name: 'Filter: Category', exact: true });
  await trigger.press('Enter');
  const menu = dialog.getByRole('menu', { name: 'Filter: Category', exact: true });
  const group = dialog.getByRole('menuitem', { name: 'Produce', exact: true });
  await expect(menu).toBeFocused();

  await menu.press('Home');
  await expect(group).toBeFocused();
  await group.press('ArrowRight');
  const apple = dialog.getByRole('menuitemcheckbox', { name: 'Apple', exact: true });
  await expect(apple).toBeFocused();
  await apple.press('Space');

  await expect(apple).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-filter-options-changes]')).toHaveText('[]');
  await apple.press('Escape');
  await expect(group).toBeFocused();
  await expect(dialog).toBeVisible();
  await group.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-filter-options-submissions]')).toHaveText('0');
});
