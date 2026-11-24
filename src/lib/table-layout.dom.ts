// Читает фактические ширины листовых колонок и высоты строк шапки. Публикует
// смещения только в текущем scrollport и удаляет CSS variables при переподключении.
import { getTableFixedOffsets } from './table-layout.engine';
import type { TableFixed } from './table.types';

/** Составные заголовки измеряются по листьям в порядке колонок данных. */
function measureCells(header: HTMLTableSectionElement) {
  if (header.rows.length < 2) {
    return Array.from(header.rows[0]?.cells ?? []);
  }

  const cells = Array.from(header.querySelectorAll<HTMLTableCellElement>(
    ':scope > tr > th[data-ant-table-leaf]'
  ));
  return cells.sort((left, right) => Number(left.dataset.antTableLeaf)
    - Number(right.dataset.antTableLeaf));
}

/** Без thead измеряет обычные ячейки, пропуская virtual spacers и details. */
function findBodyCells(table: HTMLTableElement) {
  const body = table.tBodies[0];
  const row = body?.querySelector<HTMLTableRowElement>(':scope > tr[data-ant-table-part="row"]');
  return Array.from(row?.cells ?? []);
}

/** Фиксирует каждую строку под предыдущей с учётом разной высоты заголовков. */
function placeHeaderRows(rows: readonly HTMLTableRowElement[]) {
  if (rows.length < 2) {
    return;
  }

  let top = 0;
  const heights = rows.map(row => row.getBoundingClientRect().height);
  for (const [index, row] of rows.entries()) {
    row.style.setProperty('--ant-table-header-row-offset', `${top}px`);
    top += heights[index];
  }
}

/** При измерении колонок оставляет уже сфокусированный итог видимым между ними. */
function revealSummaryFocus(
  table: HTMLTableElement,
  viewport: HTMLDivElement,
  startWidth: number,
  endWidth: number
) {
  const foot = table.tFoot;
  const focused = table.ownerDocument.activeElement;
  if (!foot || !focused || !foot.contains(focused)) {
    return;
  }

  const cell = focused.closest('td, th');
  if (cell?.closest('table') !== table || cell.classList.contains('table-summary-fixed-cell')) {
    return;
  }

  const view = viewport.ownerDocument.defaultView;
  const rtl = view?.getComputedStyle(viewport).direction === 'rtl';
  const viewportLeft = viewport.getBoundingClientRect().left + viewport.clientLeft;
  const left = viewportLeft + (rtl ? endWidth : startWidth);
  const right = viewportLeft + viewport.clientWidth - (rtl ? startWidth : endWidth);
  const rect = focused.getBoundingClientRect();
  if (rect.width <= 0 || rect.width > right - left) {
    return;
  }

  if (rect.left < left) {
    viewport.scrollLeft += rect.left - left;
  }
  else if (rect.right > right) {
    viewport.scrollLeft += rect.right - right;
  }
}

/** Вычисляет размеры sticky областей и возвращает cleanup наблюдателя и стилей. */
export function observeTableLayout(options: {
  table: HTMLTableElement;
  viewport: HTMLDivElement;
  fixed: readonly (TableFixed | undefined)[];
  stickyHeader: boolean;
  hasBodyRows: boolean;
  measureColumns?: boolean;
}) {
  const { table, viewport, fixed, stickyHeader, hasBodyRows, measureColumns } = options;
  const head = table.tHead;
  // При spans число ячеек и число физических колонок могут различаться.
  const cells = measureColumns
    ? Array.from(table.querySelectorAll<HTMLElement>(':scope > colgroup > col'))
    : head ? measureCells(head) : hasBodyRows ? findBodyCells(table) : [];
  const rows = stickyHeader ? Array.from(head?.rows ?? []) : [];

  /** Обновляет offsets после resize без переустановки разметки или обработчиков. */
  function measure() {
    const widths = cells.map(cell => cell.getBoundingClientRect().width);
    const headHeight = stickyHeader ? head?.getBoundingClientRect().height ?? 0 : 0;
    const viewportWidth = viewport.clientWidth;
    const offsets = getTableFixedOffsets(fixed, widths);
    const pinnedWidth = widths.reduce(
      (sum, width, index) => sum + (fixed[index] ? width : 0),
      0
    );
    const enabled = cells.length === fixed.length && pinnedWidth < viewportWidth;
    let startWidth = 0;
    let endWidth = 0;

    for (const [index, offset] of offsets.entries()) {
      const property = `--ant-table-fixed-${index}`;
      if (!enabled || offset === undefined) {
        table.style.removeProperty(property);
        continue;
      }

      table.style.setProperty(property, `${offset}px`);
      if (fixed[index] === 'end') {
        endWidth += widths[index];
      }
      else {
        startWidth += widths[index];
      }
    }
    table.style.setProperty('--ant-table-fixed-position', enabled ? 'sticky' : 'relative');
    viewport.style.setProperty('--ant-table-fixed-start-width', `${startWidth}px`);
    viewport.style.setProperty('--ant-table-fixed-end-width', `${endWidth}px`);
    viewport.style.setProperty('--ant-table-header-height', `${headHeight}px`);
    viewport.style.setProperty('--ant-table-viewport-width', `${viewportWidth}px`);
    placeHeaderRows(rows);
    if (startWidth || endWidth) revealSummaryFocus(table, viewport, startWidth, endWidth);
  }

  measure();
  const Observer = viewport.ownerDocument.defaultView?.ResizeObserver;
  const observer = Observer && new Observer(measure);
  observer?.observe(viewport);
  if (measureColumns) observer?.observe(table);
  for (const cell of cells) observer?.observe(cell);
  for (const row of rows) observer?.observe(row);

  // Значения опираются на прежние строки и не переносятся на новую структуру колонок.
  return () => {
    observer?.disconnect();
    for (const row of rows) row.style.removeProperty('--ant-table-header-row-offset');
    for (const index of fixed.keys()) table.style.removeProperty(`--ant-table-fixed-${index}`);
    table.style.removeProperty('--ant-table-fixed-position');
    for (const property of [
      '--ant-table-fixed-start-width', '--ant-table-fixed-end-width',
      '--ant-table-header-height', '--ant-table-viewport-width'
    ]) {
      viewport.style.removeProperty(property);
    }
  };
}
