// Determines the algorithm Table and the displacement of anchoring in the logical direction.
import type { TableFixed, TableLayout } from './table.types';

/** The obvious layout overlaps the anchoring and ellipsis of the visible leaves. */
export function getTableLayout(
  requested: TableLayout | undefined,
  horizontal: number | string | undefined,
  fixed: boolean,
  pinHeader: boolean,
  ellipsis: boolean
): TableLayout {
  if (requested) {
    return requested;
  }
  if (fixed) {
    return horizontal === 'max-content' ? 'auto' : 'fixed';
  }
  return pinHeader || ellipsis ? 'fixed' : 'auto';
}

/** Displacements of start/end include adjacent fixed columns and their actual widths. */
export function getTableFixedOffsets(
  fixed: readonly (TableFixed | undefined)[],
  widths: readonly number[]
): (number | undefined)[] {
  const offsets: (number | undefined)[] = Array.from({ length: fixed.length }, () => undefined);
  let start = 0;
  let end = 0;

  for (let index = 0; index < fixed.length; index++) {
    const width = Number.isFinite(widths[index]) ? Math.max(0, widths[index]) : 0;

    if (fixed[index] === true || fixed[index] === 'start') {
      offsets[index] = start;
      start += width;
    }

    const reverse = fixed.length - index - 1;

    if (fixed[reverse] === 'end') {
      offsets[reverse] = end;
      end += Number.isFinite(widths[reverse]) ? Math.max(0, widths[reverse]) : 0;
    }
  }

  return offsets;
}
