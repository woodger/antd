// Готовит строки и активные настройки Table. В режиме server проверяет ключи
// и нормализует настройки, оставляя обработку данных вызывающему коду.
import type {
  TableColumn,
  TableColumnsType,
  TableFilters,
  TableFilterValue,
  TableKey,
  TableMode,
  TableRowKey,
  TableSorter
} from './table.types';
import { getTableColumnOrder } from './table-columns.engine';
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
  sorter?: TableSorter | null,
  filters?: Readonly<Record<string, readonly TableFilterValue[]>>,
  mode: TableMode = 'client',
  childrenColumnName = 'children'
): {
  rows: TableRow<Row>[];
  allRows: TableRow<Row>[];
  sorter: TableSorter | null;
  filters: TableFilters;
} {
  if (!columns.length) {
    throw new Error('Table requires at least one column');
  }

  const dataColumns = getTableColumnOrder(columns);
  const { roots, allRows } = indexTableRows(dataSource, rowKey, childrenColumnName);
  const activeFilters = getColumnFilters(dataColumns, filters, mode);

  const column = dataColumns.find(
    (item) => item.key === sorter?.columnKey
      && (typeof item.sorter === 'function'
        || (mode === 'server'
          && item.sorter === true))
  );
  const activeSorter = column && sorter && (sorter.order === 'ascend' || sorter.order === 'descend')
    ? { columnKey: column.key, order: sorter.order }
    : null;

  if (mode === 'server') {
    return { rows: roots, allRows, sorter: activeSorter, filters: activeFilters };
  }

  const filteredColumns = dataColumns.filter((item) => Object.hasOwn(activeFilters, item.key));
  if (roots.some(row => row.children !== undefined)) {
    const direction = activeSorter?.order === 'descend' ? -1 : 1;
    // В дереве Ant Design сначала сортирует каждый уровень. Фильтр родителя видит
    // отсортированные и отфильтрованные дочерние записи.
    const sorted = typeof column?.sorter === 'function' && activeSorter
      ? sortTableTree(roots, column.sorter, direction, childrenColumnName) : roots;
    const rows = filterTableTree(sorted, filteredColumns, activeFilters, childrenColumnName);

    return { rows, allRows, sorter: activeSorter, filters: activeFilters };
  }

  const rows = roots.filter(
    (row) => filteredColumns.every(
      (item) => activeFilters[item.key].some((value) => item.onFilter?.(value, row.record))
    )
  );

  if (typeof column?.sorter !== 'function' || !activeSorter) {
    return { rows, allRows, sorter: null, filters: activeFilters };
  }

  const compare = column.sorter;
  const direction = activeSorter.order === 'ascend' ? 1 : -1;
  rows.sort(
    (left, right) => (compare(left.record, right.record) * direction
      || left.sourceIndex - right.sourceIndex)
  );

  return { rows, allRows, sorter: activeSorter, filters: activeFilters };
}

// Нормализует значения для всего дерева колонок, независимо от видимости заголовков.
export function getTableFilters<Row extends object>(
  columns: TableColumnsType<Row>,
  filters: Readonly<Record<string, readonly TableFilterValue[]>> = {},
  mode: TableMode = 'client'
): TableFilters {
  return getColumnFilters(getTableColumnOrder(columns), filters, mode);
}

// Оставляет допустимые значения фильтров и соблюдает filterMultiple для каждого ключа.
function getColumnFilters<Row extends object>(
  columns: readonly TableColumn<Row>[],
  filters: Readonly<Record<string, readonly TableFilterValue[]>> = {},
  mode: TableMode = 'client'
): TableFilters {
  const entries: [string, TableFilterValue[]][] = [];

  for (const column of columns) {
    if (!column.filters?.length || (mode === 'client' && !column.onFilter)) {
      continue;
    }

    const available = new Set(column.filters.map((option) => option.value));
    const configured = Object.hasOwn(filters, column.key) ? filters[column.key] : [];
    const selected = [...new Set(configured ?? [])].filter((value) => available.has(value));
    const values = column.filterMultiple === false ? selected.slice(0, 1) : selected;

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

// Цикл сортировки начинается с ascend при выборе другого столбца.
export function getNextTableSorter(
  columnKey: string,
  sorter: TableSorter | null
): TableSorter | null {
  if (sorter?.columnKey !== columnKey) {
    return { columnKey, order: 'ascend' };
  }

  return sorter.order === 'ascend' ? { columnKey, order: 'descend' } : null;
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
