import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import source from '../fixtures/ant-design-table-tree-reference.json' with { type: 'json' };

test.use({ viewport: source.reference.viewport });

/** Reads the states of the cells and callbacks in the same fields as an independent browser run. */
function snapshot(prefix: string) {
  const table = document.querySelector<HTMLTableElement>('#table-tree-fixture table');
  if (!table) {
    throw new Error('Missing tree table');
  }

  /** DOM property and class fix the condition of the semi-selected checkbox. */
  function selection(parent: Element | null) {
    const cell = parent?.querySelector(`.${prefix}-selection-column`);
    const input = cell?.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (!input) {
      return null;
    }

    return {
      checked: input.checked,
      disabled: input.disabled,
      mixed: input.indeterminate || !!cell?.querySelector('.ant-checkbox-indeterminate')
    };
  }

  const rows = Array.from(table.querySelectorAll<HTMLTableRowElement>(
    `tbody tr.${prefix}-row`
  ), row => {
    const name = row.querySelector<HTMLElement>('[data-name]');
    const indent = row.querySelector(`.${prefix}-row-indent`);
    const button = row.querySelector(`.${prefix}-row-expand-icon`);
    const glyph = button?.classList.contains(`${prefix}-row-expand-icon-spaced`) ? 'spacer'
      : button?.getAttribute('aria-expanded') === 'true' ? 'open' : button ? 'closed' : null;
    const style = indent && getComputedStyle(indent);

    return {
      key: row.dataset.rowKey,
      name: name?.textContent,
      rowClass: [...row.classList].find(name => name.startsWith('row-')),
      renderIndex: Number(name?.dataset.renderIndex),
      indent: style ? parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) : null,
      glyph,
      checked: selection(row),
      selected: row.classList.contains(`${prefix}-row-selected`),
      cells: row.cells.length
    };
  });

  return {
    rows,
    header: selection(table.tHead),
    page: JSON.parse(document.getElementById('page-data')?.textContent ?? 'null'),
    pager: document.querySelector('.ant-pagination-item-active')?.textContent?.trim() ?? null,
    data: JSON.parse(document.getElementById('tree-events')?.textContent ?? 'null')
  };
}

/** Performs a single profile action through public interface elements. */
async function act(page: Page, action: string, prefix: string) {
  const [type, key] = action.split(':');
  const row = page.locator(`tbody tr[data-row-key="${key}"]`);

  switch (type) {
    case 'expand':
      await row.locator(`button.${prefix}-row-expand-icon`).click();
      break;
    case 'row':
      await row.locator('[data-name]').click();
      break;
    case 'select':
      await row.getByRole('checkbox').click();
      break;
    case 'select-all':
      await page.locator('thead').getByRole('checkbox').click();
      break;
    case 'accept':
      await page.locator('#accept').click();
      break;
    case 'next':
      await page.locator('.ant-pagination-next button').click();
      break;
    case 'prev':
      await page.locator('.ant-pagination-prev button').click();
      break;
    case 'sort':
      await page.getByRole('button', { name: 'Rank', exact: true }).click();
      break;
    case 'filter':
      await page.locator(`.${prefix}-filter-trigger`).click();
      await page.getByRole('checkbox', { name: 'Keep', exact: true }).check();
      await page.getByRole('button', { name: 'Apply', exact: true }).click();
      break;
    default:
      throw new Error(`Unexpected table tree action ${action}`);
  }
}

for (const { profile, states } of source.cases) {
  test(`Table tree renders the independent ${profile.id} profile`, async ({ page }) => {
    await page.goto(`/?fixture=table-tree&profile=${profile.id}`);
    await expect(page.locator('#table-tree-fixture table')).toBeVisible();
    const prefix = profile.prefix ?? 'ant-table';

    for (const [index, { action, values }] of states.entries()) {
      if (action !== 'initial') {
        await act(page, action, prefix);
      }

      let events: unknown[] = values.data;
      if (action === 'row:leaf') {
        // Source adds the sheet key to the click in the line, although there's nothing to display
        // there. Native preserves the previous keys and callbacks at the line without a field of
        // descendants.
        expect(values.data.slice(-2)).toEqual([['expand', true, 'leaf'],
          ['keys', ['branch', 0, 'leaf']]]);
        events = states[index - 1].values.data;
      }
      await expect.poll(() => page.evaluate(snapshot, prefix), {
        message: `${profile.id} — ${action}`
      }).toEqual({ ...values, data: events });
    }
  });
}

test('Table tree keeps the first data cell, focus and editor while toggling and sorting a branch',
  async ({ page }) => {
    await page.goto('/?fixture=table-tree&profile=named&editor');
    const branch = page.locator('tr[data-row-key="branch"]');
    const editor = branch.getByRole('textbox', { name: 'Branch draft' });
    const button = branch.locator('td').nth(1).getByRole('button');
    const original = await editor.elementHandle();

    await editor.fill('Retained branch draft');
    await editor.evaluate((input: HTMLInputElement) => input.setSelectionRange(2, 8, 'backward'));
    await page.getByRole('button', { name: 'Rank', exact: true }).dispatchEvent('click');

    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('Retained branch draft');
    expect(await editor.evaluate((node, old) => node === old, original)).toBe(true);
    expect(await editor.evaluate((input: HTMLInputElement) => [
      input.selectionStart, input.selectionEnd, input.selectionDirection
    ])).toEqual([2, 8, 'backward']);

    await button.press('Enter');

    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    const targets = (await button.getAttribute('aria-controls'))?.split(' ') ?? [];
    expect(targets).toHaveLength(2);
    for (const target of targets) {
      await expect(page.locator(`[id="${target}"]`)).toBeVisible();
    }
    await expect(page.locator('tr[data-row-key="leaf"] .tree-table-row-indent'))
      .toHaveCSS('float', 'right');

    await page.getByRole('button', { name: 'Toggle disabled' }).click();

    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
  });
