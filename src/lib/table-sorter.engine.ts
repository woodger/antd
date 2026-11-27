// Defines manageable and local criteria. The list order for events is stored separately from the
// records comparison priorities.
import type {
  TableColumn, TableColumnTitleProps, TableMode, TableSortCompare, TableSorter, TableSortOrder
} from './table.types';

export interface TableSortState {
  columnKey: string;
  order: TableSortOrder | null;
}

export const tableSortDirections = ['ascend', 'descend'] as const;

/** Older boolean true leaves processing to the owner in server mode. */
export function isTableSortable<Row extends object>(column: TableColumn<Row>, mode: TableMode) {
  const sorter = column.sorter;
  return typeof sorter === 'function'
    || (sorter != null && typeof sorter === 'object')
    || (mode === 'server' && sorter === true);
}

/** Numerical multiple includes a combination, including a zero priority. */
function sortPriority<Row extends object>(column: TableColumn<Row> | undefined) {
  const sorter = column?.sorter;
  if (!sorter || typeof sorter !== 'object') {
    return undefined;
  }

  return typeof sorter.multiple === 'number' ? sorter.multiple : undefined;
}

/** Marks columns whose events carry the full list of criteria. */
export function isTableMultipleSorter<Row extends object>(column: TableColumn<Row>) {
  return sortPriority(column) !== undefined;
}

/** Removes the initial criteria from all leaves, including responsive. */
export function getInitialTableSorts<Row extends object>(
  columns: readonly TableColumn<Row>[], initial: TableSorter | null | undefined
): TableSortState[] {
  if (initial !== undefined) {
    return initial ? [{ ...initial }] : [];
  }

  const sorts: TableSortState[] = [];
  for (const column of columns) {
    if ('sortOrder' in column && (column.children || column.sorter)) {
      sorts.push({ columnKey: column.key, order: column.sortOrder ?? null });
      continue;
    }

    const order = column.defaultSortOrder;
    if (!column.children && column.sorter && order) {
      sorts.push({ columnKey: column.key, order });
    }
  }
  return sorts;
}

/** The managed list includes empty states and applies Source compatibility rules. */
export function getControlledTableSorts<Row extends object>(
  columns: readonly TableColumn<Row>[], mode: TableMode
): TableSortState[] {
  const sorts: TableSortState[] = [];
  let accepting: 'first' | 'multiple' | 'closed' = 'first';

  for (const column of columns) {
    if (!('sortOrder' in column) || (!column.children && !isTableSortable(column, mode))) {
      continue;
    }

    const multiple = isTableMultipleSorter(column);
    if (accepting === 'multiple' && !multiple) {
      accepting = 'closed';
    }

    const order = accepting === 'closed' ? null : column.sortOrder ?? null;
    sorts.push({ columnKey: column.key, order });

    if (accepting === 'first' && order) {
      accepting = multiple ? 'multiple' : 'closed';
    }
  }
  return sorts;
}

/** Returns header data with inactive criteria and live column definitions. */
export function getTableColumnTitleSorts<Row extends object>(
  columns: readonly TableColumn<Row>[], states: readonly TableSortState[], mode: TableMode
): TableColumnTitleProps<Row>['sortColumns'] {
  const byKey = new Map(columns.map(column => [column.key, column]));
  const sorts: { column: TableColumn<Row>; order: TableSortOrder | null; }[] = [];

  for (const { columnKey, order } of states) {
    const column = byKey.get(columnKey);
    if (column && (column.children || isTableSortable(column, mode))) {
      sorts.push({ column, order });
    }
  }

  return sorts;
}

/** The solitary column replaces the list, and the combination moves to its end. */
export function changeTableSorts<Row extends object>(
  columns: readonly TableColumn<Row>[],
  current: readonly TableSortState[],
  column: TableColumn<Row>,
  order: TableSortOrder | null
): TableSortState[] {
  const next = { columnKey: column.key, order };
  if (!isTableMultipleSorter(column)) {
    return [next];
  }

  const byKey = new Map(columns.map(item => [item.key, item]));
  const available = current.filter(state => byKey.has(state.columnKey));
  const first = available[0];
  if (!first || sortPriority(byKey.get(first.columnKey)) === undefined) {
    return [next];
  }

  return [...available.filter(state => state.columnKey !== column.key), next];
}

/** Takes live column comparators and maintains the order of criteria for onChange. */
export function createTableSortPlan<Row extends object>(
  columns: readonly TableColumn<Row>[], states: readonly TableSortState[], mode: TableMode
) {
  const byKey = new Map(columns.map(column => [column.key, column]));
  const sorters: TableSorter[] = [];
  const comparisons: {
    compare: TableSortCompare<Row>;
    order: TableSortOrder;
    priority: number;
  }[] = [];

  for (const { columnKey, order } of states) {
    const column = byKey.get(columnKey);
    if (!column || !isTableSortable(column, mode) || (order !== 'ascend' && order !== 'descend')) {
      continue;
    }

    sorters.push({ columnKey, order });
    if (mode === 'server') {
      continue;
    }

    const sorter = column.sorter;
    const compare = typeof sorter === 'function' ? sorter
      : typeof sorter === 'object' ? sorter?.compare : undefined;
    if (compare) {
      comparisons.push({ compare, order, priority: sortPriority(column) ?? 0 });
    }
  }
  comparisons.sort((left, right) => right.priority - left.priority);

  /** Verifies the following priority when equalizing on the current column. */
  function compareRows(left: Row, right: Row): number {
    for (const { compare, order } of comparisons) {
      const compared = compare(left, right, order);
      if (compared !== 0) {
        return order === 'descend' ? -compared : compared;
      }
    }
    return 0;
  }

  return { sorters, compare: comparisons.length ? compareRows : undefined };
}
