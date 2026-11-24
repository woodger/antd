// Индексирует ветки Table и готовит их для отображения и выбора. Ключи принадлежат
// исходным записям, а сортировка и фильтры меняют только представление дерева.
import type { TableColumn, TableFilters, TableKey, TableRowKey } from './table.types';
import { conductTreeCheckByKey } from './tree.engine';

export interface TableRow<Row extends object> {
  key: TableKey;
  record: Row;
  sourceIndex: number;
  children?: TableRow<Row>[];
}

/** Проверяет уникальность ключей во всём дереве, включая свёрнутые ветки. */
export function indexTableRows<Row extends object>(
  data: readonly Row[], rowKey: TableRowKey<Row> | undefined, childrenColumnName: string
) {
  const keys = new Set<TableKey>();
  const allRows: TableRow<Row>[] = [];

  /** Сохраняет ссылку на исходную запись для событий выбора. */
  function createRow(record: Row, sourceIndex: number): TableRow<Row> {
    if (record === null || (typeof record !== 'object' && typeof record !== 'function')) {
      throw new Error('Table rows must be objects');
    }
    const key: unknown = typeof rowKey === 'function' ? rowKey(record)
      : Reflect.get(record, rowKey ?? 'key');
    if (typeof key !== 'string' && (typeof key !== 'number' || !Number.isFinite(key))) {
      throw new Error('Table rowKey must resolve to a string or finite number for every record');
    }
    if (keys.has(key)) {
      throw new Error(`Table row key "${key}" is not unique`);
    }

    keys.add(key);
    const row: TableRow<Row> = { key, record, sourceIndex };
    allRows.push(row);
    const children: unknown = Reflect.get(record, childrenColumnName);
    if (Array.isArray(children)) {
      // Поле потомков использует тот же тип записи и те же проверки, что dataSource.
      row.children = (children as readonly Row[]).map(createRow);
    }

    return row;
  }

  const roots = data.map(createRow);
  return { roots, allRows };
}

/** Индекс среди соседей нужен column.render, глубина нужна строке и отступу первой ячейки. */
export function flattenTableRows<Row extends object>(
  roots: readonly TableRow<Row>[], expandedKeys?: ReadonlySet<TableKey>
) {
  const result: { row: TableRow<Row>; index: number; depth: number; }[] = [];

  // Без набора раскрытия обходятся все строки, включая скрытые потомки для выбора.
  function walk(rows: readonly TableRow<Row>[], depth: number) {
    rows.forEach((row, index) => {
      result.push({ row, index, depth });

      if (row.children && (!expandedKeys || expandedKeys.has(row.key))) {
        walk(row.children, depth + 1);
      }
    });
  }

  walk(roots, 0);
  return result;
}

/** Проецирует потомков в запись для render и currentDataSource с сохранением ключа. */
function withChildren<Row extends object>(
  row: TableRow<Row>, children: TableRow<Row>[], childrenColumnName: string
): TableRow<Row> {
  const record = {
    ...row.record,
    [childrenColumnName]: children.map(child => child.record)
  };
  return { ...row, children, record };
}

/** Сортирует каждого родителя и его потомков на их собственном уровне. */
export function sortTableTree<Row extends object>(
  rows: readonly TableRow<Row>[],
  compare: (left: Row, right: Row) => number,
  direction: number,
  childrenColumnName: string
): TableRow<Row>[] {
  const sorted = [...rows].sort((left, right) =>
    compare(left.record, right.record) * direction || left.sourceIndex - right.sourceIndex);

  return sorted.map(row => {
    if (!row.children) {
      return row;
    }

    const children = sortTableTree(row.children, compare, direction, childrenColumnName);
    return withChildren(row, children, childrenColumnName);
  });
}

/** Фильтр Ant Design видит потомков, прошедших все активные фильтры. */
export function filterTableTree<Row extends object>(
  rows: TableRow<Row>[],
  columns: readonly TableColumn<Row>[],
  filters: TableFilters,
  childrenColumnName: string
): TableRow<Row>[] {
  let current = rows;

  for (const column of columns) {
    const next: TableRow<Row>[] = [];
    const values = filters[column.key];
    for (const row of current) {
      const children = row.children && filterTableTree(
        row.children, columns, filters, childrenColumnName
      );
      const candidate = children ? withChildren(row, children, childrenColumnName)
        : { ...row, record: { ...row.record } };

      if (values.some(value => column.onFilter?.(value, candidate.record))) {
        next.push(candidate);
      }
    }
    current = next;
  }

  return current;
}

interface TableCheckEntry {
  key: TableKey;
  level: number;
  parent?: TableCheckEntry;
  children: TableCheckEntry[];
  disabled: boolean;
}

/** Связывает доступные отметки по отфильтрованному дереву, сохраняя ключи вне него. */
export function getTableLinkedSelection<Row extends object>(
  roots: readonly TableRow<Row>[],
  keys: readonly TableKey[],
  isDisabled: (row: TableRow<Row>) => boolean
) {
  const indexed = new Set<TableKey>();
  const groups = new Map<string, TableCheckEntry[]>();

  // Source обходит числовые имена раньше строковых. Table сохраняет разные типы ключей.
  function visit(rows: readonly TableRow<Row>[], parent?: TableCheckEntry) {
    for (const row of rows) {
      const { key, children } = row;
      const entry: TableCheckEntry = {
        key, parent, children: [], level: parent ? parent.level + 1 : 0, disabled: isDisabled(row)
      };
      indexed.add(key);
      const name = String(key);
      const siblings = groups.get(name) ?? [];
      siblings.push(entry);
      groups.set(name, siblings);
      parent?.children.push(entry);
      if (children) {
        visit(children, entry);
      }
    }
  }
  visit(roots);

  const entries = Object.values(Object.fromEntries(groups)).flat();
  const preserved = keys.filter(key => !indexed.has(key));

  // Disabled checkbox разрывает связь, не исключая его доступных потомков из страницы.
  function conduct(checked: readonly TableKey[], half?: readonly TableKey[]) {
    return conductTreeCheckByKey(
      checked, entries, key => indexed.has(key), entry => entry.disabled, half
    );
  }

  const state = conduct(keys);

  // Перед снятием отметки заполняет связанные ключи, затем очищает зависимые отметки.
  function toggle(key: TableKey, checked: boolean) {
    const filled = conduct([...state.checked, key]);
    const next = checked ? filled.checked : conduct(
      filled.checked.filter(item => item !== key), filled.halfChecked
    ).checked;

    return [...new Set([...preserved, ...next])];
  }

  return {
    keys: [...new Set([...preserved, ...state.checked])],
    half: new Set(state.halfChecked),
    toggle
  };
}
