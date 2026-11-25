// Определяет стороны пейджеров и строки страницы. Состояние и события остаются в Table.
import type { PaginationState } from './pagination.engine';
import type { PaginationProps } from './pagination.types';
import type { TableMode, TablePaginationPlacement } from './table.types';
import type { ComponentSize } from './types';

export type TablePagerAlignment = NonNullable<PaginationProps['align']>;
type TablePagerEdge = 'top' | 'bottom';

const placementAlignments: Record<Exclude<TablePaginationPlacement, 'none'>, TablePagerAlignment> = {
  topStart: 'start',
  topCenter: 'center',
  topEnd: 'end',
  bottomStart: 'start',
  bottomCenter: 'center',
  bottomEnd: 'end'
};

/** По умолчанию пейджер снизу. Каждый край использует первое заданное положение. */
export function getTablePagerPlacements(placements?: readonly TablePaginationPlacement[]) {
  const positions: Partial<Record<TablePagerEdge, TablePagerAlignment>> = {};
  if (placements === undefined) {
    return { bottom: 'end' as const };
  }

  for (const placement of placements) {
    if (placement === 'none') {
      continue;
    }

    const edge = placement.startsWith('top') ? 'top' : 'bottom';
    positions[edge] ??= placementAlignments[placement];
  }

  return positions;
}

/** При среднем или малом размере таблицы Pagination использует компактный вид. */
export function getTablePagerSize(pagerSize?: ComponentSize, tableSize?: ComponentSize) {
  if (pagerSize !== undefined) {
    return pagerSize;
  }

  return tableSize === 'small' || tableSize === 'medium' ? 'small' : undefined;
}

/** Явный серверный total принадлежит владельцу, включая нулевое значение. */
export function getTablePagingTotal(
  mode: TableMode,
  loadedCount: number,
  serverTotal: number | undefined,
  paginationTotal: number | undefined
) {
  const providedTotal = paginationTotal !== undefined && paginationTotal > 0
    ? paginationTotal : loadedCount;

  return mode === 'server' ? serverTotal ?? providedTotal : providedTotal;
}

/** Сохраняет готовую страницу и разрезает только набор, который ещё требует пагинации. */
export function getTablePageRows<Row>(
  rows: readonly Row[],
  paging: PaginationState,
  enabled: boolean,
  mode: TableMode
) {
  if (!enabled || mode === 'server' || rows.length < paging.total && rows.length <= paging.pageSize) {
    return rows;
  }

  const start = (paging.current - 1) * paging.pageSize;
  return rows.slice(start, start + paging.pageSize);
}
