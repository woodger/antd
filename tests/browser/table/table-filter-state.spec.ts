import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import source from '../fixtures/ant-design-table-filter-state-reference.json' with { type: 'json' };

test.use({ viewport: source.reference.viewport, locale: 'en-US' });

const fixture = '/?fixture=table-filter-state';

/** Removes the visible criteria, the draft of the open menu and the events of the table. */
function snapshot() {
  const root = document.getElementById('table-filter-state-fixture');
  if (!root) {
    throw new Error('Missing Table filter state fixture');
  }

  const popup = root.querySelector('[role="dialog"]:popover-open');
  const headings = Array.from(root.querySelectorAll('thead th'), node => {
    const label = node.querySelector('.column-heading > :first-child');
    const trigger = node.querySelector('.ant-table-filter-trigger');
    return {
      text: label?.textContent?.trim() ?? '',
      trigger: Boolean(trigger),
      active: trigger?.classList.contains('active') ?? false
    };
  });
  const rows = Array.from(root.querySelectorAll<HTMLTableRowElement>('tbody tr[data-row-key]'),
    node => Number(node.dataset.rowKey));
  const draft = popup ? Array.from(popup.querySelectorAll('input'), input => ({
    text: input.labels?.[0]?.textContent?.trim() ?? '', checked: input.checked
  })) : null;
  const changes = JSON.parse(root.querySelector('[data-filter-state-changes]')?.textContent ?? '[]');
  return { headings, rows, draft, changes };
}

/** Opens the named filter and confirms the selected item. */
async function chooseFilter(page: Page, column: string, option: string) {
  await page.getByRole('button', { name: `Filter: ${column}`, exact: true }).click();
  const menu = page.getByRole('dialog', { name: `Filter: ${column}`, exact: true });
  await menu.getByRole('radio', { name: option, exact: true }).check();
  await menu.getByRole('button', { name: 'Apply', exact: true }).click();
}

/** Repeats the user or external action of the reference scenario. */
async function act(page: Page, action: string) {
  switch (action) {
    case 'update':
      await page.getByRole('button', { name: 'Update', exact: true }).click();
      return;
    case 'choose-odd':
      await chooseFilter(page, 'Score', 'Odd');
      return;
    case 'choose-even':
      await chooseFilter(page, 'Score', 'Even');
      return;
    case 'choose-region':
      await chooseFilter(page, 'Region', 'Region B');
      return;
    case 'open':
      await page.getByRole('button', { name: 'Filter: Score', exact: true }).click();
      return;
    case 'reset':
      await page.getByRole('button', { name: 'Reset', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Reset', exact: true })).toBeDisabled();
      return;
    case 'apply':
      await page.getByRole('button', { name: 'Apply', exact: true }).click();
      return;
    case 'wide':
      await page.setViewportSize({ width: 1100, height: source.reference.viewport.height });
      return;
    default:
      throw new Error(`Unknown Table filter state action ${action}`);
  }
}

for (const { profile, states } of source.cases) {
  test(`Table column filter state matches Ant Design for ${profile.id}`, async ({ page }) => {
    await page.goto(`${fixture}&profile=${profile.id}`);

    for (const [index, { action, state }] of states.entries()) {
      if (action) {
        await act(page, action);
      }

      // TableChange still transmits only active filters.
      const changes = state.changes.map(event => ({
        ...event,
        filters: Object.fromEntries(Object.entries(event.filters).filter(([, keys]) => keys?.length))
      }));
      await expect.poll(() => page.evaluate(snapshot), {
        message: `${profile.id} ${index} ${action ?? 'initial'}`
      }).toEqual({ ...state, changes });
    }
  });
}

test('Table combines column control with the bound filters map', async ({ page }) => {
  await page.goto(`${fixture}&profile=root-owner`);
  const owner = page.locator('[data-filter-state-owner]');
  await expect.poll(() => page.evaluate(snapshot)).toMatchObject({ rows: [2], changes: [] });

  await chooseFilter(page, 'Score', 'Odd');

  await expect.poll(() => page.evaluate(snapshot)).toMatchObject({
    rows: [2], changes: [{ action: 'filter', filters: { score: ['odd'], region: ['b'] }, rows: [1] }]
  });
  expect(JSON.parse(await owner.innerText())).toEqual({
    score: ['odd'], region: ['b'], retired: ['kept']
  });

  await act(page, 'update');

  await expect.poll(() => page.evaluate(snapshot)).toMatchObject({ rows: [1, 2] });
  await expect(page.getByRole('button', { name: 'Filter: Score' })).not.toHaveClass(/active/);

  await act(page, 'update');

  await expect.poll(() => page.evaluate(snapshot)).toMatchObject({ rows: [1] });
  const changes = page.locator('[data-filter-state-changes]');
  expect(JSON.parse(await changes.innerText())).toHaveLength(1);
});

test('Server Table reports controlled column filters with the supplied page', async ({ page }) => {
  await page.goto(`${fixture}&profile=server`);
  const score = page.getByRole('button', { name: 'Filter: Score' });
  await expect(score).toHaveClass(/active/);

  await chooseFilter(page, 'Score', 'Odd');

  await expect.poll(() => page.evaluate(snapshot)).toMatchObject({
    rows: [0, 1, 2], changes: [{ action: 'filter', filters: { score: ['odd'] }, rows: [0, 1, 2] }]
  });
});
