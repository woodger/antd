import type { Page } from '@playwright/test';
import { expect, test } from './test';
import source from './fixtures/ant-design-table-spans-reference.json' with { type: 'json' };

test.use({ viewport: source.reference.viewport, locale: 'en-US' });

type Action = NonNullable<(typeof source.cases)[number]['states'][number]['action']>;

/** Снимает видимые ячейки, позиции объединений и результат DOM events. */
function snapshot({
  rtl, checkHover, checkPositions
}: { rtl: boolean; checkHover: boolean; checkPositions: boolean; }) {
  const root = document.getElementById('table-spans-fixture');
  const table = root?.querySelector('table');
  if (!root || !table) {
    throw new Error('Missing Table span fixture');
  }

  /** Учитывает атрибуты предоставленного onCell и установленную семантику th. */
  function readCell(cell: HTMLTableCellElement, virtualBody = false) {
    const key = [...cell.classList].find(name => name.startsWith('fixture-'))?.slice(8);
    const button = cell.querySelector<HTMLElement>('[data-render-index]');
    const headerStyle = cell.classList.contains('custom-heading');
    return {
      key,
      tag: virtualBody ? null : cell.tagName,
      text: cell.textContent.trim(),
      scope: key ? cell.getAttribute('scope') : null,
      colSpan: cell.getAttribute('colspan'),
      rowSpan: cell.getAttribute('rowspan'),
      index: cell.dataset.callbackIndex ?? null,
      renderIndex: button?.dataset.renderIndex ?? null,
      header: cell.dataset.headerKey ?? null,
      styled: headerStyle || cell.classList.contains('custom-owner'),
      align: headerStyle ? cell.style.textAlign : null,
      hovered: checkHover && cell.classList.contains('ant-table-cell-row-hover')
    };
  }

  const viewport = root.querySelector<HTMLDivElement>('[data-ant-table-virtual]');
  const clip = viewport?.getBoundingClientRect();
  const band = (table.tHead?.offsetHeight ?? 0) + (table.caption?.offsetHeight ?? 0);
  const top = clip ? clip.top + band : 0;
  const head = Array.from(table.tHead?.rows ?? [], row =>
    Array.from(row.cells, cell => readCell(cell)));
  const rendered = Array.from(table.querySelectorAll<HTMLTableRowElement>(
    ':scope > tbody > tr[data-ant-table-part="row"]'
  ));
  const rows = rendered.map(row => [row.dataset.rowKey, Array.from(row.cells)
    .filter(cell => getComputedStyle(cell).visibility === 'visible')
    .map(cell => readCell(cell, !!viewport))]);
  const overlay = Array.from(table.querySelectorAll<HTMLTableRowElement>(
    ':scope > tbody > tr[data-ant-table-part="span-row"]'
  )).flatMap(row => Array.from(row.cells, cell => {
    const rect = cell.getBoundingClientRect();
    const x = clip ? (rtl ? clip.right - rect.right : rect.left - clip.left) : 0;
    return {
      key: row.dataset.rowKey, top: Math.round(rect.top - top), height: Math.round(rect.height),
      x: Math.round(x), width: Math.round(rect.width), cell: readCell(cell, true)
    };
  }));
  const details = Array.from(table.querySelectorAll<HTMLElement>('[data-detail]'), node => {
    const rect = node.getBoundingClientRect();
    return [node.dataset.detail, Math.round(rect.top - top), Math.round(rect.height)];
  });
  const positions = checkPositions && clip ? rendered.map(row => {
    const cell = row.querySelector('.fixture-status');
    const rect = cell?.getBoundingClientRect();
    return rect ? [row.dataset.rowKey, Math.round(rect.left - clip.left), Math.round(rect.width)]
      : null;
  }) : [];
  return { head, rows, overlay, details, positions, scrollTop: viewport?.scrollTop ?? null,
    events: JSON.parse(document.getElementById('table-spans-events')?.textContent ?? '[]') };
}

/** Выполняет измеренные действия клавишами, мышью и через публичный scrollTo. */
async function act(page: Page, action: Action, index: number) {
  if ('scroll' in action && action.scroll) {
    await page.getByTestId(`spans-scroll-${index - 1}`).click();
  }
  else if ('wheel' in action && action.wheel) {
    const [x, y] = action.wheel;
    await page.locator('[data-ant-table-virtual]').hover();
    await page.mouse.wheel(x, y);
  }
  else if ('pick' in action && action.pick !== undefined) {
    await page.locator(`[data-pick-key="${action.pick}"]`).click();
  }
  else if ('hover' in action && action.hover !== undefined) {
    await page.locator(`[data-pick-key="${action.hover}"]`).hover();
  }
  else if ('leave' in action && action.leave) {
    await page.mouse.move(700, 450);
  }
  else if ('detail' in action && action.detail !== undefined) {
    await page.locator(`tr[data-row-key="${action.detail}"] button.ant-table-row-expand-icon`).click();
  }
  else if (('collapse' in action && action.collapse) || ('expand' in action && action.expand)) {
    await page.locator('[data-row-key="0"] button.ant-table-row-expand-icon').click();
  }
  else if ('sort' in action && action.sort) {
    await page.locator('thead .ant-table-column-sorters').click();
  }
}

type State = (typeof source.cases)[number]['states'][number]['state'];
type BodyCell = Exclude<State['rows'][number][number], string>[number];
type Cell = State['head'][number][number] | BodyCell | State['overlay'][number]['cell'];

/** Сравнивает интерактивные ячейки UMD с семантическими ячейками таблицы Svelte. */
function project(state: State, virtual: boolean, checkHover: boolean) {
  // Сопоставляет видимые ячейки при разных DOM тегах виртуального тела.
  function cellProps(cell: Cell, virtualBody = false) {
    const { visible: _visible, ...props } = cell;
    return { ...props, tag: virtualBody ? null : cell.tag, hovered: checkHover && cell.hovered,
      align: cell.styled ? cell.align : null };
  }

  return {
    ...state,
    head: state.head.map(row => row.map(cell => cellProps(cell))),
    rows: state.rows.map(([key, cells]) => [
      key, typeof cells === 'string' ? [] : cells.filter(cell => cell.visible)
        .map(cell => cellProps(cell, virtual))
    ]),
    overlay: state.overlay.map(item => ({
      ...item, x: Math.round(item.x), top: Math.round(item.top), height: Math.round(item.height),
      width: Math.round(item.width), cell: cellProps(item.cell, true)
    }))
  };
}

for (const { profile, states } of source.cases) {
  test(`Table cell spans match the independent ${profile.id} profile`, async ({ page }) => {
    await page.goto(`/?fixture=table-spans&profile=${profile.id}`);
    const table = page.locator('#table-spans-fixture table');
    await expect(table).toBeVisible();
    const checkHover = profile.id === 'normal';

    for (const [index, { action, state }] of states.entries()) {
      if (action) {
        await act(page, action, index);
      }

      const expected = project(state, !!profile.virtual, checkHover);
      await expect.poll(() => page.evaluate(snapshot, {
        rtl: !!profile.rtl, checkHover, checkPositions: !!profile.rectangle
      }), {
        message: `${profile.id} state ${index} ${JSON.stringify(action)}`
      }).toEqual(expected);
    }
  });
}
