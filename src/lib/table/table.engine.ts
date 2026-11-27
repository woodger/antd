// Prepares strings and active settings Table. In the server mode, check the keys and normalize the
// settings, leaving the processing of data to the calling code.
import type {
  TableColumn,
  TableColumnsType,
  TableFilters,
  TableFilterOption,
  TableFilterValue,
  TableKey,
  TableMode,
  TableRowKey,
  TableSorter,
  TableSortOrder
} from './table.types';
import { getTableColumnOrder } from './table-columns.engine';
import { walkTableFilterOptions } from './table-filter-options.engine';
import { createTableSortPlan, tableSortDirections, type TableSortState } from './table-sorter.engine';
import { filterTableTree, indexTableRows, sortTableTree, type TableRow } from './table-tree.engine';

/**
 * Filters and steadily sorts the data without the mutation of the original records. Row keys must
 * be unique strings or end numbers; incorrect keys/columns cause Error. In server mode, data
 * processing remains with the consumer.
 */
export function getTableData<Row extends object>(
  dataSource: readonly Row[],
  columns: TableColumnsType<Row>,
  rowKey?: TableRowKey<Row> | PropertyKey,
  sorting?: TableSorter | readonly TableSortState[] | null,
  filters?: Readonly<Record<string, readonly TableFilterValue[]>>,
  mode: TableMode = 'client',
  childrenColumnName = 'children'
): {
  rows: TableRow<Row>[];
  allRows: TableRow<Row>[];
  sorter: TableSorter | null;
  sorters: TableSorter[];
  filters: TableFilters;
} {
  if (!columns.length) {
    throw new Error('Table requires at least one column');
  }

  const dataColumns = getTableColumnOrder(columns);
  const { roots, allRows } = indexTableRows(dataSource, rowKey, childrenColumnName);
  const activeFilters = getColumnFilters(dataColumns, filters, mode);
  const requested = sorting ? ('columnKey' in sorting ? [sorting] : sorting) : [];
  const { sorters, compare } = createTableSortPlan(dataColumns, requested, mode);
  const state = { allRows, sorter: sorters[0] ?? null, sorters, filters: activeFilters };

  if (mode === 'server') {
    return { ...state, rows: roots };
  }

  const filteredColumns = dataColumns.filter(column =>
    column.onFilter && Object.hasOwn(activeFilters, column.key));
  if (roots.some(row => row.children !== undefined)) {
    // In the Ant Design tree, each level is sorted first. The parent’s filter sees sorted and
    // filtered children.
    const sorted = compare ? sortTableTree(roots, compare, childrenColumnName) : roots;
    const rows = filterTableTree(sorted, filteredColumns, activeFilters, childrenColumnName);

    return { ...state, rows };
  }

  const rows = roots.filter(
    (row) => filteredColumns.every(
      (item) => activeFilters[item.key].some((value) => item.onFilter?.(value, row.record))
    )
  );

  if (compare) {
    rows.sort((left, right) =>
      compare(left.record, right.record) || left.sourceIndex - right.sourceIndex);
  }

  return { ...state, rows };
}

// Normalizes values for the entire column tree, regardless of the visibility of the headings.
export function getTableFilters<Row extends object>(
  columns: TableColumnsType<Row>,
  filters: Readonly<Record<string, readonly TableFilterValue[]>> = {},
  mode: TableMode = 'client'
): TableFilters {
  return getColumnFilters(getTableColumnOrder(columns), filters, mode);
}

/** Returns the filter options available in the current data processing mode. */
export function getTableFilterOptions<Row extends object>(
  column: TableColumn<Row>, mode: TableMode
) {
  return mode === 'server' || column.onFilter || column.filterDropdown
    ? column.filters : undefined;
}

/** Memories the initial values of the columns. Explicit keys defaultFilters set the table. */
export function getInitialTableFilters<Row extends object>(
  columns: readonly TableColumn<Row>[],
  defaults: Readonly<Record<string, readonly TableFilterValue[]>> = {}
): TableFilters {
  const entries: [string, TableFilterValue[]][] = [];

  for (const column of columns) {
    const values = 'filteredValue' in column ? column.filteredValue : column.defaultFilteredValue;
    if (values?.length) {
      entries.push([column.key, [...values]]);
    }
  }

  for (const [key, values] of Object.entries(defaults)) {
    entries.push([key, [...values]]);
  }

  return Object.fromEntries(entries);
}

/** Collects the values of the owner, including the empty criteria of managed columns. */
export function getControlledTableFilters<Row extends object>(
  columns: readonly TableColumn<Row>[], mode: TableMode
): TableFilters | undefined {
  const entries: [string, TableFilterValue[]][] = [];

  for (const column of columns) {
    const values = column.filteredValue;
    if (values !== undefined && (column.filterDropdown || getTableFilterOptions(column, mode))) {
      entries.push([column.key, [...(values ?? [])]]);
    }
  }

  return entries.length ? Object.fromEntries(entries) : undefined;
}

/** Removes repeats and takes into account the limitations of the built-in panel, if they are specified. */
export function normalizeTableFilter(
  options: readonly TableFilterOption[] | undefined,
  values?: readonly TableFilterValue[] | null,
  multiple?: boolean
): TableFilterValue[] {
  if (!values?.length) {
    return [];
  }

  let selected = [...new Set(values)];
  if (options) {
    const available = new Set(Array.from(walkTableFilterOptions(options), option => option.value));
    selected = selected.filter(value => available.has(value));
  }

  return multiple === false ? selected.slice(0, 1) : selected;
}

// The user panel itself sets the allowable values and selection rules.
function getColumnFilters<Row extends object>(
  columns: readonly TableColumn<Row>[],
  filters: Readonly<Record<string, readonly TableFilterValue[]>> = {},
  mode: TableMode = 'client'
): TableFilters {
  const entries: [string, TableFilterValue[]][] = [];

  for (const column of columns) {
    const custom = Boolean(column.filterDropdown);
    const options = custom ? undefined : getTableFilterOptions(column, mode);
    if (!custom && !options?.length) {
      continue;
    }

    const configured = Object.hasOwn(filters, column.key) ? filters[column.key] : undefined;
    const multiple = custom ? undefined : column.filterMultiple;
    const values = normalizeTableFilter(options, configured, multiple);

    if (values.length) {
      entries.push([column.key, values]);
    }
  }

  return Object.fromEntries(entries);
}

// Compares sets of filter values without taking into account order and repetitions.
export function areTableFiltersEqual(left: TableFilters, right: TableFilters): boolean {
  const keys = Object.keys(left);

  return keys.length === Object.keys(right).length && keys.every((key) => {
    if (!Object.hasOwn(right, key)) {
      return false;
    }

    const first = new Set(left[key]);
    const second = new Set(right[key]);

    return first.size === second.size && [...first].every((value) => second.has(value));
  });
}

/** The next step is taken from the column cycle, and the end of the list clears the direction. */
export function getNextTableSorter(
  columnKey: string,
  sorter: TableSorter | null,
  directions: readonly (TableSortOrder | null)[] = tableSortDirections
): TableSorter | null {
  const index = sorter?.columnKey === columnKey ? directions.indexOf(sorter.order) + 1 : 0;
  const order = directions[index];
  return order ? { columnKey, order } : null;
}

// The title aggregates the selection only for the transferred page lines.
export function getTableSelection(
  pageKeys: readonly TableKey[],
  selectedKeys: readonly TableKey[]
) {
  const selected = new Set(selectedKeys);
  const count = pageKeys.filter((key) => selected.has(key)).length;

  return {
    all: pageKeys.length > 0 && count === pageKeys.length,
    some: count > 0 && count < pageKeys.length,
    disabled: pageKeys.length === 0
  };
}

// Upgrades the transferred keys, keeping a selection on the rest of the pages.
export function changeTableSelection(
  selectedKeys: readonly TableKey[],
  changedKeys: readonly TableKey[],
  checked: boolean
): TableKey[] {
  const selected = new Set(selectedKeys);

  for (const key of changedKeys) {
    if (checked) {
      selected.add(key);
    }
    else {
      selected.delete(key);
    }
  }

  return [...selected];
}
