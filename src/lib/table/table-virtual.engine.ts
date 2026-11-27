// Calculations of the width of columns and estimates of the line virtual Table before the
// appearance of DOM. Ant Design 6.6.8 and rc-table 1.11.1/useWidthColumns. MIT,
// vendor/LICENSE.ant-design.
import type { AliasToken } from '../theme-token.types';
import type { TableScrollOptions } from './table.types';
import type { ComponentSize } from '../types';
import type { VirtualScrollAlign } from '../virtual-list.engine';

/** The virtual window uses numerical dimensions, the remaining values give fallback. */
export function tableVirtualDimension(value: TableScrollOptions['x'], fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : fallback;
}

/** An unmeasured string uses the height of the text string, padding and one border. */
export function tableVirtualRowHeight(token: AliasToken, size: ComponentSize) {
  const padding = size === 'small' ? token.paddingXS
    : size === 'medium' ? token.paddingSM : token.padding;
  const fontHeight = Math.floor(token.fontSize * token.lineHeight);

  return Math.max(1, padding * 2 + fontHeight + token.lineWidth);
}

/** After distributing the width applies the minimum to the total grid of the cap and body. */
export function tableVirtualColumns(
  widths: readonly (number | string | undefined)[],
  scrollWidth: number,
  clientWidth: number,
  cellPadding: number,
  minWidths: readonly (number | undefined)[]
) {
  const target = Math.max(scrollWidth, clientWidth);
  const declared = widths.map(width => {
    const parsed = typeof width === 'string' && width.endsWith('%')
      ? scrollWidth * Number.parseFloat(width) / 100 : width;

    return typeof parsed === 'number' && Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  });
  const declaredTotal = declared.reduce((sum, width) => sum + width, 0);
  let missing = declared.filter(width => width === 0).length;
  let remaining = Math.max(target - declaredTotal, missing);
  const average = Math.floor(remaining / (missing || 1));

  const filled = declared.map(width => {
    if (width > 0) {
      return width;
    }
    const next = missing === 1 ? remaining : average;
    remaining -= next;
    missing--;
    return next;
  });
  const total = filled.reduce((sum, width) => sum + width, 0);

  if (total && total < target) {
    const scale = target / total;
    let rest = target;
    for (const [index, width] of filled.entries()) {
      const next = index === filled.length - 1 ? rest : Math.floor(width * scale);
      filled[index] = next;
      rest -= next;
    }
  }

  // In Source, padding on the div cell and minWidth set the minimum outer width.
  const boxed = filled.map((width, index) => {
    const minimum = tableVirtualDimension(minWidths[index], 0);
    return Math.max(width, cellPadding, minimum);
  });
  const boxedTotal = boxed.reduce((sum, width) => sum + width, 0);
  return { widths: boxed, width: Math.max(target, boxedTotal) };
}

/** rc-table delegates the nearest visible position of the virtual list. */
export function tableVirtualAlign(
  align: ScrollLogicalPosition | undefined,
  offset: number
): VirtualScrollAlign {
  if (align === 'start') return 'top';
  if (align === 'end') return 'bottom';
  if (align === 'nearest') return 'auto';

  return offset ? 'top' : 'auto';
}
