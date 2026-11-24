// Определяет алгоритм Table и смещения закрепления в логическом направлении.
import type { TableFixed, TableLayout } from './table.types';

/** Явный layout перекрывает закрепление и ellipsis у видимых листьев. */
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

/** Смещения start/end включают соседние закреплённые колонки и их фактические ширины. */
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
