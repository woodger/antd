import type { Page } from '@playwright/test';
import { expect, test } from './test';
import source from './fixtures/ant-design-table-filter-content-reference.json' with { type: 'json' };

const fixture = '/?fixture=table-filter-content&profile=';
const filterName = 'Filter menu: Value';
test.use({ viewport: { width: 880, height: 550 }, reducedMotion: 'reduce' });

/** Reads labels from an open panel, including the submenu placed in the popup. */
function snapshot({ mode, nested }: { mode: string; nested?: boolean; }) {
  const root = document.getElementById('table-filter-content-fixture');
  if (!root) {
    throw new Error('Missing Table filter content fixture');
  }
  const panel = root.querySelector('[role="dialog"]:popover-open');
  const selector = mode === 'tree' ? '.ant-tree-title'
    : nested ? '.ant-dropdown-menu-title-content' : '.filter-options label';
  const labels = Array.from(panel?.querySelectorAll(selector) ?? []);
  const texts = labels.filter(node => node.getClientRects().length > 0).map(node => ({
    text: node.textContent?.trim() ?? '',
    marker: node.querySelector('[data-probe-label]')?.localName ?? null
  }));
  const matches = Array.from(panel?.querySelectorAll('.filter-node .ant-tree-title') ?? [],
    node => node.textContent?.trim() ?? '');
  const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-row-key]'),
    row => row.dataset.rowKey);
  return {
    texts, matches, rows,
    searches: JSON.parse(root.querySelector('[data-probe-searches]')?.textContent ?? '[]'),
    changes: JSON.parse(root.querySelector('[data-probe-changes]')?.textContent ?? '[]')
  };
}

/** Opens a full-time panel through an accessible trigger. */
async function openFilter(page: Page) {
  await page.getByRole('button', { name: filterName, exact: true }).click();
  const panel = page.getByRole('dialog', { name: filterName, exact: true });
  await expect(panel).toBeVisible();
  return panel;
}

for (const { profile, states, rows, changes } of source.cases) {
  test(`Table renders and searches Source filter labels for ${profile.id}`, async ({ page }) => {
    await page.goto(fixture + profile.id);
    const panel = await openFilter(page);
    const search = panel.getByRole('textbox', { name: 'Search in filters', exact: true });

    for (const { action, state } of states) {
      if (action === 'open-branch') {
        await panel.getByRole('menuitem', { name: 'Group label', exact: true }).hover();
      }
      else if (action !== 'open') {
        await search.fill(action);
      }

      await expect.poll(() => page.evaluate(snapshot, profile), { message: JSON.stringify(action) })
        .toEqual(state);
    }

    const role = profile.nested ? 'menuitemcheckbox' : profile.single ? 'radio' : 'checkbox';
    await panel.getByRole(role, { name: 'Rich label', exact: true }).click();
    await panel.getByRole('button', { name: 'OK', exact: true }).click();

    await expect(panel).toBeHidden();
    await expect.poll(async () => {
      const applied = await page.evaluate(snapshot, profile);
      return { rows: applied.rows, changes: applied.changes };
    }).toEqual({ rows, changes });
  });
}

test('Table keeps a live snippet draft and closes a panel with changed array content', async ({
  page
}) => {
  await page.goto(fixture + 'menu');
  const panel = await openFilter(page);
  const rich = panel.getByRole('checkbox', { name: 'Rich label', exact: true });
  const original = await rich.elementHandle();
  await rich.focus();
  await rich.press('Space');
  await expect(rich).toBeChecked();

  await page.getByRole('button', { name: 'Update snippet text', exact: true }).dispatchEvent('click');

  const updated = panel.getByRole('checkbox', { name: 'Updated label', exact: true });
  await expect(updated).toBeChecked();
  await expect(updated).toBeFocused();
  expect(await updated.evaluate((node, before) => node === before, original)).toBe(true);

  await page.getByRole('button', { name: 'Remove array text', exact: true }).dispatchEvent('click');

  await expect(panel).toBeHidden();
  await openFilter(page);
  await expect(panel.getByRole('checkbox', { name: 'A', exact: true })).toBeVisible();
  await expect(updated).not.toBeChecked();
  await expect(page.locator('[data-probe-changes]')).toHaveText('[]');
});
