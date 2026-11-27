// Reads actual leaf column widths and header row heights. Publishes offsets only in the current
// scrollport and removes CSS variables on reattachment.
import { getTableFixedOffsets } from './table-layout.engine';
import type { TableFixed } from './table.types';

/** Aligns the line inside the scroll owner, taking into account the fixed strips. */
export function alignTableRow(
  element: HTMLElement,
  row: HTMLElement,
  insets: { top: number; bottom: number; },
  align: ScrollLogicalPosition,
  offset: number
) {
  const viewport = element.getBoundingClientRect();
  const rect = row.getBoundingClientRect();
  const start = rect.top - viewport.top - insets.top;
  const end = rect.bottom - viewport.bottom + insets.bottom;
  let delta: number;

  if (align === 'start') {
    delta = start;
  }
  else if (align === 'end') {
    delta = end;
  }
  else if (align === 'center') {
    delta = (start + end) / 2;
  }
  else {
    delta = start < 0 ? start : Math.max(0, end);
  }

  element.scrollTop += delta + offset;
}

/** Composite headings are measured by leaves in the order of data columns. */
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

/** Without thead measures ordinary cells, skipping virtual space and details. */
function findBodyCells(table: HTMLTableElement) {
  const body = table.tBodies[0];
  const row = body?.querySelector<HTMLTableRowElement>(':scope > tr[data-ant-table-part="row"]');
  return Array.from(row?.cells ?? []);
}

/** Fixes each line under the previous one, taking into account the different height of the titles. */
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

/** Considers the horizontal displacement, which opens control between fixed columns. */
export function getTableFocusOffset(
  viewport: HTMLDivElement,
  focused: Element,
  startWidth: number,
  endWidth: number,
  rtl: boolean
) {
  const viewportLeft = viewport.getBoundingClientRect().left + viewport.clientLeft;
  const left = viewportLeft + (rtl ? endWidth : startWidth);
  const right = viewportLeft + viewport.clientWidth - (rtl ? startWidth : endWidth);
  const rect = focused.getBoundingClientRect();
  if (rect.width <= 0 || rect.width > right - left) {
    return 0;
  }

  return rect.left < left ? rect.left - left : Math.max(0, rect.right - right);
}

/** When the columns are measured, it leaves an already focused outcome visible between them. */
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
  const offset = getTableFocusOffset(viewport, focused, startWidth, endWidth, rtl);
  if (offset) {
    viewport.scrollLeft += offset;
  }
}

/** Calculates the dimensions of the sticky areas and returns the cleanup of the observer and styles. */
export function observeTableLayout(options: {
  table: HTMLTableElement;
  viewport: HTMLDivElement;
  fixed: readonly (TableFixed | undefined)[];
  stickyHeader: boolean;
  hasBodyRows: boolean;
  measureColumns?: boolean;
  endGutter?: number;
  onMeasure?: (widths: readonly number[], tableWidth: number) => void;
}) {
  const {
    table, viewport, fixed, stickyHeader, hasBodyRows, measureColumns, endGutter = 0, onMeasure
  } = options;
  const head = table.tHead;
  // In spans, the number of cells and the number of physical columns may vary.
  const cells = measureColumns
    ? Array.from(table.querySelectorAll<HTMLElement>(
      ':scope > colgroup > col:not([data-ant-table-scrollbar])'
    ))
    : head ? measureCells(head) : hasBodyRows ? findBodyCells(table) : [];
  const rows = stickyHeader ? Array.from(head?.rows ?? []) : [];

  /** Updates offsets after resize without reinstalling markings or handlers. */
  function measure() {
    const widths = cells.map(cell => cell.getBoundingClientRect().width);
    onMeasure?.(widths, table.getBoundingClientRect().width);
    const headHeight = stickyHeader ? head?.getBoundingClientRect().height ?? 0 : 0;
    const viewportWidth = viewport.clientWidth;
    const offsets = getTableFixedOffsets(fixed, widths);
    const pinnedWidth = endGutter + widths.reduce(
      (sum, width, index) => sum + (fixed[index] ? width : 0),
      0
    );
    const enabled = cells.length === fixed.length && pinnedWidth < viewportWidth;
    let startWidth = 0;
    let endWidth = endGutter;

    for (const [index, offset] of offsets.entries()) {
      const property = `--ant-table-fixed-${index}`;
      if (!enabled || offset === undefined) {
        table.style.removeProperty(property);
        continue;
      }

      const inset = fixed[index] === 'end' ? offset + endGutter : offset;
      table.style.setProperty(property, `${inset}px`);
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

  // The values are based on the previous strings and are not transferred to the new structure of the columns.
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
