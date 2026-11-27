// Indexes the branches Table and prepares them for display and selection. The keys belong to the
// original records, and the sorting and filters change only the representation of the tree.
import type { TableColumn, TableFilters, TableKey, TableRowKey } from './table.types';
import { conductTreeCheckByKey } from './tree.engine';

export interface TableRow<Row extends object> {
  key: TableKey;
  record: Row;
  sourceIndex: number;
  children?: TableRow<Row>[];
}

/** Checking the uniqueness of the keys in the whole tree, including curtailed branches. */
export function indexTableRows<Row extends object>(
  data: readonly Row[],
  rowKey: TableRowKey<Row> | PropertyKey | undefined,
  childrenColumnName: string
) {
  const keys = new Set<TableKey>();
  const allRows: TableRow<Row>[] = [];

  /** Saves a link to the original record for selection events. */
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
      // The offspring field uses the same type of recording and the same checks as dataSource.
      row.children = (children as readonly Row[]).map(createRow);
    }

    return row;
  }

  const roots = data.map(createRow);
  return { roots, allRows };
}

/** The index among the neighbors needs column.render, the depth is needed by the line and the retreat of the first cell. */
export function flattenTableRows<Row extends object>(
  roots: readonly TableRow<Row>[], expandedKeys?: ReadonlySet<TableKey>
) {
  const result: { row: TableRow<Row>; index: number; depth: number; }[] = [];

  // Without an opening set, all lines, including hidden descendants to choose.
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

/** Protects the descendants into the entry for render and currentDataSource while saving the key. */
function withChildren<Row extends object>(
  row: TableRow<Row>, children: TableRow<Row>[], childrenColumnName: string
): TableRow<Row> {
  const record = {
    ...row.record,
    [childrenColumnName]: children.map(child => child.record)
  };
  return { ...row, children, record };
}

/** Sorts every parent and their descendants at their own level. */
export function sortTableTree<Row extends object>(
  rows: readonly TableRow<Row>[],
  compare: (left: Row, right: Row) => number,
  childrenColumnName: string
): TableRow<Row>[] {
  const sorted = [...rows].sort((left, right) =>
    compare(left.record, right.record) || left.sourceIndex - right.sourceIndex);

  return sorted.map(row => {
    if (!row.children) {
      return row;
    }

    const children = sortTableTree(row.children, compare, childrenColumnName);
    return withChildren(row, children, childrenColumnName);
  });
}

/** The parent's predicate receives descendants after the use of all active filters. */
export function filterTableTree<Row extends object>(
  rows: TableRow<Row>[],
  columns: readonly TableColumn<Row>[],
  filters: TableFilters,
  childrenColumnName: string
): TableRow<Row>[] {
  let current = rows;

  for (const [filterIndex, column] of columns.entries()) {
    const next: TableRow<Row>[] = [];
    const values = filters[column.key];
    for (const row of current) {
      let children = row.children;
      // After the first criterion, the string already keeps the filtered branch.
      if (filterIndex === 0 && children) {
        children = filterTableTree(children, columns, filters, childrenColumnName);
      }

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

/** Binds the available marks to the filtered tree, keeping the keys outside it. */
export function getTableLinkedSelection<Row extends object>(
  roots: readonly TableRow<Row>[],
  keys: readonly TableKey[],
  isDisabled: (row: TableRow<Row>) => boolean
) {
  const indexed = new Set<TableKey>();
  const groups = new Map<string, TableCheckEntry[]>();

  // Source bypasses numerical names before string names. Table preserves different types of keys.
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

  // Disabled checkbox breaks the connection, not excluding its available descendants from the page.
  function conduct(checked: readonly TableKey[], half?: readonly TableKey[]) {
    return conductTreeCheckByKey(
      checked, entries, key => indexed.has(key), entry => entry.disabled, half
    );
  }

  const state = conduct(keys);

  // Fills in related keys before unchecking and then clears dependent checks.
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
