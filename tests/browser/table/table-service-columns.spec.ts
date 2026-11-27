import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import source from '../fixtures/ant-design-table-service-columns-reference.json'
  with { type: 'json' };

test.use({ viewport: source.reference.viewport, locale: 'en-US' });

const root = '#table-service-columns-fixture';
const events = '#table-service-column-events';

/** It only counts physical cells. Measuring lines belong to implementation. */
function snapshot() {
  const table = document.querySelector<HTMLTableElement>('#table-service-columns-fixture table');
  if (!table) {
    throw new Error('Missing service columns fixture');
  }

  /** Classes allocate service columns, even when data keys coincide. */
  function key(cell: Element) {
    const field = [...cell.classList].find(name => name.startsWith('fixture-col-'));
    if (field) return field.slice('fixture-col-'.length);
    if (cell.classList.contains('ant-table-selection-column')) return '$select';
    if (cell.classList.contains('ant-table-row-expand-icon-cell')) return '$expand';
    return '$empty';
  }

  /** Fixation is expressed by the logical side regardless of dir. */
  function pin(cell: Element) {
    if (cell.classList.contains('ant-table-cell-fix-start')) return 'start';
    if (cell.classList.contains('ant-table-cell-fix-end')) return 'end';
    return null;
  }

  const headers = Array.from(table.tHead?.rows ?? [], row => Array.from(row.cells, cell => [
    key(cell), cell.textContent.trim(), cell.colSpan, cell.rowSpan, pin(cell),
    cell.querySelector<HTMLElement>('[data-title]')?.dataset.title ?? null,
    cell.querySelector('input') ? 1 : 0,
    cell.querySelector('.ant-table-selection-extra') ? 1 : 0
  ]));
  const rows = Array.from(table.querySelectorAll<HTMLTableRowElement>(
    ':scope > tbody > .ant-table-row[data-row-key]'
  ), row => ({
    key: row.dataset.rowKey,
    cells: Array.from(row.cells, cell => [
      key(cell), cell.textContent.trim(),
      cell.getAttribute('colspan') ?? '1', cell.getAttribute('rowspan') ?? '1',
      pin(cell), cell.getAttribute('data-choice'),
      cell.querySelector<HTMLElement>('[data-render]')?.dataset.render ?? null,
      cell.querySelector('input')?.checked ?? null,
      cell.querySelector('button.ant-table-row-expand-icon')?.getAttribute('aria-expanded') ?? null
    ]),
    overlay: row.classList.contains('ant-table-row-extra')
  }));
  const details = Array.from(table.querySelectorAll<HTMLElement>('[data-detail]'), node => [
    node.dataset.detail, node.closest('td')?.colSpan ?? null
  ]);
  const events = JSON.parse(document.getElementById('table-service-column-events')?.textContent
    ?? '[]');

  return { headers, rows, details, events };
}

/** Performs the same step through a keyboard, cell or public ref. */
async function act(page: Page, action: string) {
  const [kind, key] = action.split('-');
  switch (kind) {
    case 'select':
      await page.getByLabel(`Choose ${key}`, { exact: true }).press('Space');
      return;
    case 'title':
      await page.getByLabel('Choose page', { exact: true }).click();
      return;
    case 'expand':
      await page.locator(`[data-row-key="${key}"] button.ant-table-row-expand-icon`).click();
      return;
    case 'cell':
      await page.locator(`[data-row-key="${key}"] [data-choice]`).click({
        position: { x: 2, y: 2 }
      });
      return;
    case 'scroll':
      if (key === 'row') {
        await page.getByRole('button', { name: 'Scroll to row 12' }).click();
      }
      else {
        await page.locator(`${root} [data-ant-table-part="content"]`).evaluate(node => {
          node.scrollLeft = getComputedStyle(node).direction === 'rtl' ? -300 : 300;
        });
      }
      return;
    default:
      throw new Error(`Unknown service column action ${action}`);
  }
}

for (const { profile, states } of source.cases) {
  if (profile.virtual) continue;

  test(`Table service columns match Ant Design for ${profile.id}`, async ({ page }) => {
    await page.goto(`/?fixture=table-service-columns&profile=${profile.id}`);
    await expect(page.locator(`${root} table`)).toBeVisible();

    for (const { action, state } of states) {
      if (action) await act(page, action);

      await expect.poll(() => page.evaluate(snapshot), {
        message: `${profile.id} after ${action ?? 'mount'}`
      }).toEqual(state);
    }
  });
}

test('Table keeps the source selection span and its events in a virtual window', async ({ page }) => {
  const reference = source.cases.find(sample => sample.profile.id === 'virtual-span');
  if (!reference) throw new Error('Missing virtual selection corpus');
  const [initial, toggled, scrolled] = reference.states.map(sample => sample.state);

  await page.goto('/?fixture=table-service-columns&profile=virtual-span');
  const anchor = page.locator('[data-ant-table-part="span-row"] [data-choice="0:0"]');
  const control = anchor.getByRole('checkbox', { name: 'Choose 0' });
  const end = page.locator('tr[data-row-key="2"] [data-choice="2:2"]');

  await expect(anchor).toHaveAttribute('rowspan', '2');
  await expect(end).toHaveAttribute('colspan', '2');
  await expect(page.getByRole('checkbox', { name: 'Choose 1', exact: true })).toHaveCount(0);
  await expect(control).toBeInViewport();
  expect((await page.evaluate(snapshot)).headers).toEqual(initial.headers);

  await act(page, 'select-0');

  await expect(control).toBeFocused();
  await expect(control).toBeChecked();
  await expect(page.locator(events)).toHaveText(JSON.stringify(toggled.events));
  const overlay = toggled.rows.find(row => row.overlay && row.key === '0');
  const sourceCell = overlay?.cells.find(cell => cell[0] === '$select');
  const nativeOverlay = (await page.evaluate(snapshot)).rows.find(row => row.overlay);
  expect(nativeOverlay?.cells).toEqual([sourceCell]);

  await act(page, 'scroll-row');

  await expect(page.locator('tr[data-row-key="12"] [data-choice="12:12"]')).toBeVisible();
  await expect(anchor).toHaveCount(0);
  const row = (await page.evaluate(snapshot)).rows.find(row => row.key === '12');
  expect(row).toEqual(scrolled.rows.find(row => row.key === '12'));

  await page.getByRole('button', { name: 'Scroll to row 0' }).click();

  await expect(control).toBeChecked();
  await expect(page.locator(events)).toHaveText(JSON.stringify(scrolled.events));
});

test('Table updates service offsets and physical summary indices in RTL', async ({ page }) => {
  await page.goto('/?fixture=table-service-columns&profile=grouped-rtl&layout');
  const table = page.locator(`${root} table`);
  const header = table.locator('thead .ant-table-selection-column');
  const selection = table.locator('tbody [data-choice="0:0"]');
  const expand = table.locator('tbody tr[data-row-key="0"] .ant-table-row-expand-icon-cell');
  const summary = table.locator('tfoot td', { hasText: 'Selection total' });

  await expect(header).toHaveAttribute('rowspan', '2');
  await expect(selection).toHaveCSS('position', 'sticky');
  await expect(expand).toHaveCSS('position', 'sticky');
  await expect(summary).toHaveClass(/ant-table-cell-fix-end/);
  await expect(summary).toHaveCSS('inset-inline-end', '0px');
  await selection.hover({ position: { x: 2, y: 2 } });
  await expect(page.locator(events)).toHaveText('[["enter",0,0]]');

  await page.getByRole('button', { name: 'Toggle selection pin' }).click();

  await expect(selection).not.toHaveClass(/ant-table-cell-fix-end/);
  await expect(expand).not.toHaveClass(/ant-table-cell-fix-end/);
  await expect(summary).not.toHaveClass(/ant-table-cell-fix-end/);

  await page.getByRole('button', { name: 'Toggle header' }).click();
  await page.getByRole('button', { name: 'Toggle selection pin' }).click();

  await expect(table.locator('thead')).toHaveCount(0);
  await expect(selection).toHaveCSS('position', 'sticky');
  await expect(summary).toHaveCSS('inset-inline-end', '0px');
  await expect.poll(async () => parseFloat(await selection.evaluate(node =>
    getComputedStyle(node).insetInlineEnd))).toBeGreaterThan(90);
});
