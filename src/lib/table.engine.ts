// Готовит строки и активные настройки Table. В режиме server проверяет ключи
// и нормализует настройки, оставляя обработку данных вызывающему коду.
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
 * Фильтрует и стабильно сортирует данные без мутации исходных records. Row keys должны
 * быть уникальными строками или конечными числами; некорректные keys/columns вызывают Error.
 * В server mode обработка данных остаётся у потребителя.
 */
export function getTableData<Row extends object>(
  dataSource: readonly Row[],
  columns: TableColumnsType<Row>,
  rowKey?: TableRowKey<Row>,
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

  const filteredColumns = dataColumns.filter((item) => Object.hasOwn(activeFilters, item.key));
  if (roots.some(row => row.children !== undefined)) {
    // В дереве Ant Design сначала сортирует каждый уровень. Фильтр родителя видит
    // отсортированные и отфильтрованные дочерние записи.
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

// Нормализует значения для всего дерева колонок, независимо от видимости заголовков.
export function getTableFilters<Row extends object>(
  columns: TableColumnsType<Row>,
  filters: Readonly<Record<string, readonly TableFilterValue[]>> = {},
  mode: TableMode = 'client'
): TableFilters {
  return getColumnFilters(getTableColumnOrder(columns), filters, mode);
}

/** Возвращает варианты фильтра, доступные в текущем режиме обработки данных. */
export function getTableFilterOptions<Row extends object>(
  column: TableColumn<Row>, mode: TableMode
) {
  return mode === 'server' || column.onFilter || column.filterDropdown
    ? column.filters : undefined;
}

/** Запоминает начальные значения колонок. Явные ключи defaultFilters задаёт таблица. */
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

/** Собирает значения владельца, включая пустые критерии управляемых колонок. */
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

/** Убирает повторы и учитывает ограничения встроенной панели, если они заданы. */
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

// Пользовательская панель сама задаёт допустимые значения и правила выбора.
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

// Сравнивает наборы значений фильтра без учёта порядка и повторов.
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

/** Следующий шаг берётся из цикла колонки, а конец списка очищает направление. */
export function getNextTableSorter(
  columnKey: string,
  sorter: TableSorter | null,
  directions: readonly (TableSortOrder | null)[] = tableSortDirections
): TableSorter | null {
  const index = sorter?.columnKey === columnKey ? directions.indexOf(sorter.order) + 1 : 0;
  const order = directions[index];
  return order ? { columnKey, order } : null;
}

// Заголовок агрегирует выбор только для переданных строк страницы.
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

// Обновляет переданные ключи, сохраняя выбор на остальных страницах.
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
