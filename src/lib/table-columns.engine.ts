// Prepares tree columns for data processing and for markup. Hiding and media queries do not change
// sorting keys and filters. Service columns occupy a physical sheet of the mesh only in the modes
// of selection and disclosure of details. Ant Design 6.6.8, rc-table 1.11.1. MIT,
// vendor/LICENSE.ant-design.
import type { GridScreenMap } from './grid.types';
import type {
  TableColumn, TableColumnDefaults, TableColumnInput, TableColumnsType, TableFixed, TableKey
} from './table.types';

const serviceRole = Symbol('Table column role');
export type TableServiceColumn = 'selection' | 'expand';

/** The marker retains its role when transferring the column through state proxy Svelte. */
function serviceMarker<Role extends TableServiceColumn>(role: Role) {
  return Object.freeze({ key: role, title: '', [serviceRole]: role });
}

export const SELECTION_COLUMN = serviceMarker('selection');
export const EXPAND_COLUMN = serviceMarker('expand');

/** Distinguishes the marker from the custom column even when the key coincides. */
function getServiceRole(column: object | undefined): TableServiceColumn | undefined {
  const role = column && serviceRole in column ? column[serviceRole] : undefined;
  return role === 'selection' || role === 'expand' ? role : undefined;
}

/** Copies only the specified values according to the rules mergeProps in Source. */
function getDefinedColumnProps(column: object) {
  return Object.fromEntries(Object.entries(column).filter(([, value]) => value !== undefined));
}

/** Fills groups and leaves with one set of props, keeping service markers. */
function fillColumnDefaults<Row extends object>(
  columns: readonly TableColumnInput<Row>[],
  defaults: Partial<TableColumnInput<Row>> | undefined
): readonly TableColumnInput<Row>[] {
  if (!defaults) {
    return columns;
  }

  const { children: _children, ...defaultsWithoutChildren } = defaults;
  const shared = getDefinedColumnProps(defaultsWithoutChildren);

  /** Redefines the total props local and bypasses its own group tree. */
  function fillColumn(column: TableColumnInput<Row>): TableColumnInput<Row> {
    if (getServiceRole(column)) {
      return column;
    }

    const own = getDefinedColumnProps(column);
    // Object.entries loses the key types and properties of the original column.
    const filled = { ...shared, ...own } as TableColumnInput<Row>;
    const children = column.children;
    if (Array.isArray(children)) {
      filled.children = children.map(fillColumn);
    }

    return filled;
  }

  return columns.map(fillColumn);
}

/** Saves the object of the column if its key and descendants keys are already string. */
function hasStringColumnKeys<Row extends object>(
  column: TableColumnInput<Row>
): column is TableColumn<Row> {
  return typeof column.key === 'string' && (column.children?.every(hasStringColumnKeys) ?? true);
}

/** Converts an explicit numeric key to a string state key, preserving 0 and ''. */
function readExplicitKey(key: TableKey | null | undefined): string | undefined {
  if (key === null || key === undefined) {
    return undefined;
  }
  if (typeof key === 'string' || (typeof key === 'number' && Number.isFinite(key))) {
    return String(key);
  }

  throw new Error('Table column key must be a string or finite number');
}

/** Verifies the global uniqueness of the key among groups and leaves. */
function reserveColumnKey(keys: Set<string>, key: string) {
  if (keys.has(key)) {
    throw new Error(`Table column key "${key}" is not unique`);
  }
  keys.add(key);
}

/** Reserves explicit keys before calculating keys from dataIndex and positions. */
function collectExplicitKeys<Row extends object>(
  columns: readonly TableColumnInput<Row>[],
  keys: Set<string>
) {
  for (const column of columns) {
    if (getServiceRole(column)) {
      continue;
    }

    const key = readExplicitKey(column.key);
    if (key !== undefined) {
      reserveColumnKey(keys, key);
    }
    if (column.children?.length) {
      collectExplicitKeys(column.children, keys);
    }
  }
}

/** Uses the path or field for the state. For dataIndex 0 and '' Source takes a position. */
function getInferredColumnKey(
  dataIndex: PropertyKey | readonly (string | number)[] | undefined,
  position: string
) {
  if (Array.isArray(dataIndex)) {
    return dataIndex.join('.');
  }
  if (dataIndex && (typeof dataIndex === 'string' || typeof dataIndex === 'number')) {
    return String(dataIndex);
  }

  return position;
}

/** Retains the independent states of the columns, even when the output keys coincide. */
function reserveInferredColumnKey(
  keys: Set<string>,
  dataIndex: PropertyKey | readonly (string | number)[] | undefined,
  position: string
) {
  let key = getInferredColumnKey(dataIndex, position);
  while (keys.has(key)) {
    key += '_next';
  }
  keys.add(key);
  return key;
}

/** Allows the keys of the full tree before sorting, hiding and placing service columns. */
export function resolveTableColumns<Row extends object>(
  columns: readonly TableColumnInput<Row>[],
  defaults: TableColumnDefaults<Row> | undefined
): TableColumnsType<Row> {
  const configured = fillColumnDefaults(columns, defaults);
  if (configured.every(hasStringColumnKeys)) {
    return configured;
  }

  const keys = new Set<string>();
  collectExplicitKeys(configured, keys);

  /** Retains the position of the group during the recursive processing of its descendants. */
  function resolve(
    items: readonly TableColumnInput<Row>[],
    parent?: string
  ): TableColumnsType<Row> {
    return items.map((column, index) => {
      if (hasStringColumnKeys(column)) {
        return column;
      }

      const position = parent === undefined ? String(index) : `${parent}-${index}`;
      const { children, ...props } = column;
      const explicitKey = readExplicitKey(column.key);
      const key = explicitKey ?? getServiceRole(column)
        ?? reserveInferredColumnKey(keys, props.dataIndex, position);
      if (children) {
        return { ...props, key, children: resolve(children, position) };
      }

      return { ...props, key };
    });
  }

  return resolve(configured);
}

interface TableColumnServices<Row extends object> {
  selection?: Pick<TableColumn<Row>, 'align' | 'fixed' | 'width' | 'onCell'>;
  expansion?: { automatic: boolean; fixed?: TableFixed; width?: number | string; };
}

export interface TableLeaf<Row extends object> {
  key: string;
  column: TableColumn<Row>;
  service: TableServiceColumn | undefined;
  fixed: TableFixed | undefined;
}

export interface TableHeading<Row extends object> {
  key: string;
  column: TableColumn<Row>;
  visibleColumn: TableColumn<Row>;
  service: TableServiceColumn | undefined;
  start: number;
  leaf: number;
  colSpan: number;
  rowSpan: number;
  group: boolean;
}

/** Bypasses both groups and leaves, including hidden definitions. */
export function getTableColumnOrder<Row extends object>(columns: TableColumnsType<Row>) {
  const ordered: TableColumn<Row>[] = [];
  const keys = new Set<string>();

  // The key is governed by sort/filter and DOM identity regardless of depth.
  function visit(items: TableColumnsType<Row>) {
    for (const column of items) {
      if (getServiceRole(column)) {
        continue;
      }

      reserveColumnKey(keys, column.key);
      ordered.push(column);
      if (column.children?.length) {
        visit(column.children);
      }
    }
  }

  visit(columns);
  return ordered;
}

/** Substitutes a column of details in the marker or in its standard position. */
function placeExpansion<Row extends object>(
  columns: TableColumn<Row>[], options: NonNullable<TableColumnServices<Row>['expansion']>
) {
  const slot = columns.findIndex(column => getServiceRole(column) === 'expand');
  if (slot === -1 && !options.automatic) {
    return;
  }

  const defaultIndex = options.fixed === 'end' ? columns.length : 0;
  const index = slot === -1 ? defaultIndex : slot;
  const column = {
    ...EXPAND_COLUMN,
    width: options.width,
    fixed: options.fixed ?? columns[index]?.fixed
  };
  columns.splice(index, slot === -1 ? 0 : 1, column);
}

/** Places the choice after the initial update and inherits the neighboring columns. */
function placeSelection<Row extends object>(
  columns: TableColumn<Row>[], options: NonNullable<TableColumnServices<Row>['selection']>
) {
  const slot = columns.findIndex(column => getServiceRole(column) === 'selection');
  const defaultIndex = getServiceRole(columns[0]) === 'expand' ? 1 : 0;
  const index = slot === -1 ? defaultIndex : slot;
  const previous = columns[index - 1];
  const next = columns[index + (slot === -1 ? 0 : 1)];
  const fixed = options.fixed ?? next?.fixed ?? previous?.fixed;

  if (fixed && getServiceRole(previous) === 'expand' && previous.fixed === undefined) {
    columns[index - 1] = { ...previous, fixed };
  }

  columns.splice(index, slot === -1 ? 0 : 1, { ...SELECTION_COLUMN, ...options, fixed });
}

/** Handles the upper level in order of Source, starting with visible definitions. */
function prepareColumns<Row extends object>(
  columns: TableColumnsType<Row>, screens: GridScreenMap, services: TableColumnServices<Row>
) {
  const seen = new Set<TableServiceColumn>();
  const prepared: TableColumn<Row>[] = [];
  for (const column of columns) {
    if (column.hidden || (column.responsive && !column.responsive.some(point => screens[point]))) {
      continue;
    }

    const role = getServiceRole(column);
    if (role) {
      const enabled = role === 'selection' ? services.selection : services.expansion;
      if (!enabled || seen.has(role)) {
        continue;
      }
      seen.add(role);
    }
    prepared.push(column);
  }

  if (services.expansion) placeExpansion(prepared, services.expansion);
  if (services.selection) placeSelection(prepared, services.selection);

  return prepared;
}

/** Returns the levels of the hat and the order of the cells of the body after hiding the columns. */
export function getTableColumnLayout<Row extends object>(
  columns: TableColumnsType<Row>, screens: GridScreenMap, services: TableColumnServices<Row> = {}
) {
  const leaves: TableLeaf<Row>[] = [];
  const headings: TableHeading<Row>[][] = [];

  // rc-table leaves the group title as a separate column after hiding all the children.
  function visit(
    column: TableColumn<Row>,
    depth: number,
    start: number,
    inheritedFixed?: TableFixed
  ): TableHeading<Row> | undefined {
    const service = getServiceRole(column);
    if (column.hidden || (depth > 0 && service)) {
      return undefined;
    }

    const key = service ?? `data:${column.key}`;
    const fixed = column.fixed ?? inheritedFixed;
    const heading: TableHeading<Row> = {
      key, column, visibleColumn: column, service, start,
      leaf: leaves.length, colSpan: 1, rowSpan: 1, group: false
    };
    const row = headings[depth] ??= [];
    row.push(heading);

    let childWidth = 0;
    if (column.children?.length) {
      const visibleChildren: TableColumn<Row>[] = [];
      let changed = false;
      for (const child of column.children) {
        const childHeading = visit(child, depth + 1, start + childWidth, fixed);
        if (childHeading) {
          childWidth += childHeading.colSpan;
          visibleChildren.push(childHeading.visibleColumn);
          changed ||= childHeading.visibleColumn !== child;
        }
        else {
          changed = true;
        }
      }
      // onHeaderRow sees the remaining descendants; onHeaderCell preserves the original column.
      if (changed) {
        heading.visibleColumn = { ...column, children: visibleChildren };
      }
    }

    heading.group = leaves.length > heading.leaf;
    if (!heading.group) {
      leaves.push({ key, column, service, fixed });
    }
    heading.colSpan = column.colSpan ?? (heading.group ? childWidth : 1);
    return heading;
  }

  let start = 0;
  for (const column of prepareColumns(columns, screens, services)) {
    const heading = visit(column, 0, start);
    start += heading?.colSpan ?? 0;
  }

  for (const [depth, row] of headings.entries()) {
    for (const cell of row) {
      cell.rowSpan = cell.column.rowSpan ?? (cell.group ? 1 : headings.length - depth);
    }
  }

  return { leaves, headings };
}
