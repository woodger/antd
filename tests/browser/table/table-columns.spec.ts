import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import source from '../fixtures/ant-design-table-columns-reference.json' with { type: 'json' };

test.use({ viewport: source.reference.viewport, locale: 'en-US' });

type Action = NonNullable<(typeof source.cases)[number]['states'][number]['action']>;

/** Reads visible lines, headings, spans and shifts from the logical beginning of scrollport. */
function snapshot(rtl: boolean) {
  const root = document.getElementById('table-columns-fixture');
  const table = root?.querySelector('table');
  if (!root || !table) {
    throw new Error('Missing table column fixture');
  }

  /** Service cells and custom columns vary in public classes. */
  function columnKey(cell: Element) {
    const className = [...cell.classList].find(name => name.startsWith('fixture-column-'));
    if (className) return className.replace('fixture-column-', '');
    if (cell.classList.contains('ant-table-selection-column')) return '$select';
    if (cell.classList.contains('ant-table-row-expand-icon-cell')) return '$expand';
    return '$empty';
  }

  /** Checks how groups and leaves inherit the fixed side. */
  function fixed(cell: Element) {
    if (cell.classList.contains('ant-table-cell-fix-start')) return 'start';
    if (cell.classList.contains('ant-table-cell-fix-end')) return 'end';
    return null;
  }

  const headers = Array.from(table.tHead?.rows ?? [], row => Array.from(row.cells, cell => {
    const key = columnKey(cell);
    const service = key.startsWith('$');
    return {
      key, text: cell.innerText.trim(), span: [cell.colSpan, cell.rowSpan],
      scope: service ? null : cell.getAttribute('scope'), fixed: fixed(cell),
      align: service ? null : getComputedStyle(cell).textAlign
    };
  }));
  const rows = table.tBodies[0]?.querySelectorAll<HTMLTableRowElement>(
    ':scope > tr[data-ant-table-part="row"]'
  );
  const body = Array.from(rows ?? [], row => ({
    key: row.dataset.rowKey,
    cells: Array.from(row.cells, cell => ({
      key: columnKey(cell), text: cell.innerText.trim(), fixed: fixed(cell)
    })),
    selected: row.classList.contains('ant-table-row-selected')
  }));
  const details = Array.from(table.querySelectorAll<HTMLElement>('[data-detail]'), node => ({
    key: node.dataset.detail, colSpan: node.closest('td')?.colSpan
  }));
  const viewport = root.querySelector<HTMLDivElement>('[data-ant-table-virtual]');
  const clip = viewport?.getBoundingClientRect();
  const first = rows?.[0];

  /** Whole pixels compare the total colgroup and fractional layout of a separate source cap. */
  function coordinate(cell: HTMLTableCellElement) {
    const rect = cell.getBoundingClientRect();
    const logical = clip ? (rtl ? clip.right - rect.right : rect.left - clip.left) : 0;
    return [columnKey(cell), Math.round(logical), Math.round(rect.width)];
  }

  const geometry = viewport && first ? {
    top: viewport.scrollTop,
    head: Array.from(table.tHead?.querySelectorAll<HTMLTableCellElement>(
      'th[class*="fixture-column-"]'
    ) ?? [], coordinate),
    body: Array.from(first.cells, coordinate)
  } : null;

  return {
    headers, body, details, geometry,
    emptySpan: table.querySelector<HTMLTableCellElement>('.ant-table-placeholder td')?.colSpan
      ?? null,
    events: JSON.parse(document.getElementById('table-columns-events')?.textContent ?? '[]')
  };
}

/** Performs the same command via props, DOM-control or public bind:this. */
async function act(page: Page, action: Action, index: number) {
  if ('hide' in action && action.hide) {
    await page.getByTestId(`hide-columns-${index - 1}`).click();
  }
  else if ('width' in action && action.width) {
    await page.setViewportSize({ width: action.width, height: source.reference.viewport.height });
  }
  else if ('scroll' in action && action.scroll) {
    await page.getByTestId(`scroll-columns-${index - 1}`).click();
  }
  else if ('wheel' in action && action.wheel) {
    const [x, y] = action.wheel;
    await page.locator('[data-ant-table-virtual]').hover();
    await page.mouse.wheel(x, y);
  }
  else if ('expand' in action && action.expand !== undefined) {
    await page.locator(`tr[data-row-key="${action.expand}"] button.ant-table-row-expand-icon`).click();
  }
  else if ('select' in action && action.select !== undefined) {
    await page.locator(`tr[data-row-key="${action.select}"]`).getByRole('checkbox').click();
  }
  else if ('sort' in action && action.sort) {
    const heading = page.locator(`thead th.fixture-column-${action.sort}`);
    await heading.getByRole('button').click();
  }
  else if ('filter' in action && action.filter) {
    const heading = page.locator(`thead th.fixture-column-${action.filter}`);
    await heading.getByRole('button').click();
    const popup = page.getByRole('dialog');
    await popup.getByRole('checkbox', { name: 'Even', exact: true }).check();
    await popup.getByRole('button', { name: 'Apply', exact: true }).click();
  }
}

/** Applies the same measurement accuracy to retained fractional coordinates UMD. */
function pixelCoordinates(items: readonly (readonly (string | number)[])[]) {
  return items.map(item => item.map(value => typeof value === 'number' ? Math.round(value) : value));
}

for (const { profile, states } of source.cases) {
  test(`Table column tree matches the independent ${profile.id} profile`, async ({ page }) => {
    if (profile.width) {
      await page.setViewportSize({ ...source.reference.viewport, width: profile.width });
    }
    await page.goto(`/?fixture=table-columns&profile=${profile.id}`);
    await expect(page.locator('#table-columns-fixture table')).toBeVisible();

    for (const [index, { action, state }] of states.entries()) {
      if (action) {
        await act(page, action, index);
      }

      const geometry = state.geometry && { top: state.geometry.top,
        head: pixelCoordinates(state.geometry.head), body: pixelCoordinates(state.geometry.body) };
      await expect.poll(() => page.evaluate(snapshot, !!profile.rtl), {
        message: `${profile.id} state ${index} ${JSON.stringify(action)}`
      }).toEqual({ ...state, geometry });
    }
  });
}

test('Table keeps a focused editor while showing and hiding a responsive column group', async ({ page }) => {
  await page.setViewportSize({ width: 560, height: 950 });
  await page.goto('/?fixture=table-columns&profile=responsive&editor');
  const draft = page.getByRole('textbox', { name: 'Draft 4' });
  const original = await draft.elementHandle();
  await draft.fill('Draft across breakpoints');
  await draft.evaluate((node: HTMLInputElement) => node.setSelectionRange(2, 6));
  await expect(page.getByRole('columnheader', { name: 'Compact' })).toBeVisible();

  await page.setViewportSize({ width: 950, height: 950 });

  await expect(page.getByRole('columnheader', { name: 'Measurements' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Compact' })).toHaveCount(0);
  await expect(draft).toBeFocused();
  expect(await draft.evaluate((node, before) => node === before, original)).toBe(true);
  expect(await draft.evaluate((node: HTMLInputElement) => [
    node.selectionStart, node.selectionEnd
  ])).toEqual([2, 6]);
  await expect(draft).toHaveValue('Draft across breakpoints');
  await expect(page.locator('#table-columns-events')).toHaveText('[]');
});

test('Table pins grouped header rows after resizing their content and scrolling vertically', async ({ page }) => {
  await page.goto('/?fixture=table-columns&profile=fixed');
  const table = page.locator('#table-columns-fixture table');
  const head = table.locator('thead');
  const group = head.locator('.fixture-column-person');
  const leaf = head.locator('.fixture-column-name');
  await expect(table).toHaveAttribute('aria-rowcount', '72');
  await expect(head.locator('tr').nth(1)).toHaveAttribute('aria-rowindex', '2');

  await group.evaluate(node => { node.style.height = '76px'; });
  await page.getByTestId('scroll-columns-1').click();

  await expect(table.locator('tr[data-row-key="25"]')).toHaveAttribute('aria-rowindex', '28');
  await expect.poll(() => head.evaluate(element => {
    const root = element.closest('[data-ant-table-virtual]');
    const viewportTop = root?.getBoundingClientRect().top ?? 0;
    const first = element.querySelector('.fixture-column-person')?.getBoundingClientRect();
    const next = element.querySelector('.fixture-column-name')?.getBoundingClientRect();
    return first && next && Math.abs(first.top - viewportTop) < 1
      && Math.abs(next.top - first.bottom) < 1;
  })).toBe(true);
  await expect(group).toBeInViewport();
  await expect(leaf).toBeInViewport();
});
