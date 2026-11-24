import type { Page } from '@playwright/test';
import { expect, test } from './test';
import source from './fixtures/ant-design-table-column-layout-reference.json' with { type: 'json' };

type ColumnCase = (typeof source.cases)[number];
type Snapshot = ColumnCase['states'][number]['state'];

test.use({ viewport: source.reference.viewport, locale: 'en-US' });

const root = '#table-column-layout-fixture';
const fixture = '/?fixture=table-column-layout';

/** Измеряет физическую сетку и область, в которой отсекается текст. */
function snapshot(prefix: string) {
  const area = document.querySelector<HTMLElement>('#table-column-layout-fixture');
  const table = area?.querySelector<HTMLTableElement>('table');
  if (!area || !table) throw new Error('Missing Table column layout fixture');

  /** Читает layout самой ячейки, включая содержимое заголовка с сортировкой. */
  function cell(element: HTMLTableCellElement) {
    const wrapper = element.querySelector(`.${prefix}-cell-content`);
    const scope = wrapper ?? element.querySelector(`.${prefix}-column-title`) ?? element;
    const style = getComputedStyle(scope);
    const key = [...element.classList].find(name => name.startsWith('fixture-col-'))
      ?.slice('fixture-col-'.length) ?? null;
    const ellipsis = element.classList.contains(`${prefix}-cell-ellipsis`);

    return {
      key, text: element.textContent.trim(), title: element.getAttribute('title'),
      ellipsis, titleSort: element.getAttribute('aria-sort'),
      fixed: element.classList.contains(`${prefix}-cell-fix-start`),
      textAlign: getComputedStyle(element).textAlign,
      clip: ellipsis ? [style.overflowX, style.textOverflow, style.whiteSpace] : null,
      wrapped: wrapper !== null, clipped: ellipsis && scope.scrollWidth > scope.clientWidth,
      width: Math.round(element.getBoundingClientRect().width)
    };
  }

  return {
    layout: table.style.tableLayout,
    layoutClass: !!area.querySelector(`.${prefix}-layout-fixed`),
    tableWidth: Math.round(table.getBoundingClientRect().width),
    virtual: !!area.querySelector('[data-ant-table-virtual]'),
    cols: Array.from(table.querySelectorAll<HTMLTableColElement>('colgroup col'), column => [
      column.style.width, column.style.minWidth
    ]),
    headings: Array.from(table.querySelectorAll<HTMLTableCellElement>('thead th'), cell),
    rows: Array.from(table.querySelectorAll<HTMLTableRowElement>(
      'tbody tr[data-ant-table-part="row"]'
    ), row => ({
      key: Number(row.dataset.rowKey), cells: Array.from(row.cells, cell)
    }))
  };
}

/** Переключает параметры через DOM, как в независимом сценарии. */
async function act(page: Page, action: string) {
  switch (action) {
    case 'sort':
      await page.locator('th.fixture-col-name button').click();
      return;
    case 'hide':
    case 'show':
      await page.getByRole('button', { name: action === 'hide'
        ? 'Hide ellipsis column' : 'Show ellipsis column' }).click();
      return;
    case 'scroll':
      await page.locator(`${root} [data-ant-table-part="content"]`).evaluate(node => {
        node.scrollLeft = -160;
      });
      return;
    default:
      throw new Error(`Unknown column layout action ${action}`);
  }
}

/** Учитывает общую виртуальную сетку Native и действующий контракт вывода значений. */
function expected(profile: ColumnCase['profile'], state: Snapshot) {
  const virtualWidths = state.virtual ? state.rows[0].cells.map(cell => cell.width) : undefined;
  const rows = state.rows.map(row => ({
    ...row,
    cells: row.cells.map(cell => {
      let text = cell.text;
      if (profile.id === 'paths' && cell.key === 'flag' && row.key === 0) text = 'false';
      if (profile.id === 'paths' && cell.key === 'empty-key') text = `Empty key ${row.key}`;
      return { ...cell, text };
    })
  }));

  return {
    ...state,
    layout: state.virtual ? 'fixed' : state.layout,
    tableWidth: virtualWidths?.reduce((sum, width) => sum + width, 0) ?? state.tableWidth,
    cols: virtualWidths?.map(width => [`${width}px`, '']) ?? state.cols,
    headings: state.headings.map((cell, index) => ({
      ...cell, wrapped: false, width: virtualWidths?.[index] ?? cell.width
    })),
    rows: state.virtual ? rows.filter(row => row.key < 3) : rows
  };
}

for (const { profile, states } of source.cases) {
  test(`Table column layout matches Ant Design for ${profile.id}`, async ({ page }) => {
    await page.goto(`${fixture}&profile=${profile.id}`);
    const table = page.locator(`${root} table`);
    await expect(table).toBeVisible();

    for (const { action, state } of states) {
      if (action) await act(page, action);

      await expect.poll(async () => {
        const current = await page.evaluate(snapshot, profile.prefix ?? 'ant-table');
        if (state.virtual) current.rows = current.rows.filter(row => row.key < 3);
        return current;
      }, { message: `${profile.id} after ${action ?? 'mount'}` }).toEqual(expected(profile, state));
    }
  });
}

test('Table preserves the editor and focus while changing ellipsis and layout', async ({ page }) => {
  await page.goto(`${fixture}&profile=fixed-rtl&editor`);
  const table = page.locator(`${root} table`);
  const cell = table.locator('tbody tr[data-row-key="0"] .fixture-col-name');
  const editor = page.getByRole('textbox', { name: 'Column editor' });
  const original = await editor.elementHandle();

  await expect(cell).toHaveClass(/sample-table-cell-ellipsis/);
  await expect(cell).not.toHaveAttribute('title');
  await editor.fill('Draft stays in pinned cell');
  await editor.evaluate((input: HTMLInputElement) => input.setSelectionRange(2, 8));

  await page.getByRole('button', { name: 'Toggle ellipsis' }).dispatchEvent('click');
  await page.getByRole('button', { name: 'Use auto layout' }).dispatchEvent('click');

  await expect(cell).not.toHaveClass(/sample-table-cell-ellipsis/);
  await expect(table).toHaveCSS('table-layout', 'auto');
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue('Draft stays in pinned cell');
  expect(await editor.evaluate((node, previous) => node === previous, original)).toBe(true);
  expect(await editor.evaluate((node: HTMLInputElement) => [
    node.selectionStart, node.selectionEnd
  ])).toEqual([2, 8]);
});
