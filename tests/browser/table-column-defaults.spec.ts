import type { Page } from '@playwright/test';
import { expect, test } from './test';
import source from './fixtures/ant-design-table-column-defaults-reference.json' with { type: 'json' };

test.use({ viewport: source.reference.viewport, locale: 'en-US' });

const fixture = '/?fixture=table-column-defaults';

/** Reads the marking of inherited properties and the result of record processing. */
function snapshot() {
  const root = document.getElementById('table-column-defaults-fixture');
  const table = root?.querySelector('table');
  if (!root || !table) {
    throw new Error('Missing Table column defaults fixture');
  }

  /** Takes into account only the visible text. Closed filter remains in DOM Svelte. */
  function cell(node: HTMLTableCellElement) {
    return {
      text: node.innerText.trim(),
      align: node.style.textAlign || null,
      inherited: node.classList.contains('shared-default'),
      updated: node.classList.contains('updated-default'),
      ellipsis: node.classList.contains('ant-table-cell-ellipsis'),
      sort: node.getAttribute('aria-sort'),
      sorter: Boolean(node.querySelector('.ant-table-column-sorters')),
      filter: Boolean(node.querySelector('.ant-table-filter-trigger')),
      owner: node.getAttribute('data-owner'),
      type: node.querySelector('input[type=checkbox]') ? 'selection'
        : node.querySelector('.ant-table-row-expand-icon') ? 'expand' : null
    };
  }

  return {
    headings: Array.from(table.querySelectorAll<HTMLTableCellElement>('thead th'), cell),
    cols: Array.from(table.querySelectorAll<HTMLTableColElement>('colgroup col'),
      column => column.style.width || null),
    rows: Array.from(table.querySelectorAll<HTMLTableRowElement>('tbody tr[data-row-key]'),
      row => ({ key: Number(row.dataset.rowKey), cells: Array.from(row.cells, cell) })),
    changes: JSON.parse(root.querySelector('[data-column-defaults-changes]')?.textContent ?? '[]')
  };
}

/** Performs an action from the reference scenario on native controls. */
async function act(page: Page, action: string) {
  switch (action) {
    case 'update':
      await page.getByRole('button', { name: 'Update defaults' }).click();
      return;
    case 'sort':
      await page.locator('thead .ant-table-column-sorters').click();
      return;
    case 'filter':
      await page.getByRole('button', { name: 'Filter: Name' }).click();
      await page.getByRole('radio', { name: 'Even score' }).check();
      await page.getByRole('button', { name: 'Apply', exact: true }).click();
      return;
    case 'wide':
      await page.setViewportSize({ width: 1100, height: source.reference.viewport.height });
      return;
    default:
      throw new Error(`Unknown column defaults action ${action}`);
  }
}

for (const { profile, states } of source.cases) {
  test(`Table column defaults match Ant Design for ${profile.id}`, async ({ page }) => {
    await page.goto(`${fixture}&profile=${profile.id}`);

    for (const { action, state } of states) {
      if (action) {
        await act(page, action);
      }

      // Table Svelte displays col for each sheet, including a clear width of 0.
      const cols = profile.id === 'inheritance' ? [...state.cols, '0px'] : state.cols;
      await expect.poll(() => page.evaluate(snapshot), {
        message: `${profile.id} ${action ?? 'initial'}`
      }).toEqual({ ...state, cols });
    }
  });
}
