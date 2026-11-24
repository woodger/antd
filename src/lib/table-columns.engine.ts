// Готовит дерево колонок для обработки данных и для разметки. Скрытие и media
// queries не меняют список ключей, которыми владеет сортировка и фильтры.
// Ant Design 6.6.8, rc-table 1.11.1. MIT, vendor/LICENSE.ant-design.
import type { GridScreenMap } from './grid.types';
import type { TableColumn, TableColumnsType, TableFixed } from './table.types';

export interface TableHeading<Row extends object> {
  column: TableColumn<Row>;
  start: number;
  colSpan: number;
  rowSpan: number;
  group: boolean;
}

/** Обходит и группы, и листья, включая скрытые определения. */
export function getTableColumnOrder<Row extends object>(columns: TableColumnsType<Row>) {
  const ordered: TableColumn<Row>[] = [];
  const keys = new Set<string>();

  // Ключ управляет sort/filter и DOM identity независимо от глубины.
  function visit(items: TableColumnsType<Row>) {
    for (const column of items) {
      if (keys.has(column.key)) {
        throw new Error(`Table column key "${column.key}" is not unique`);
      }

      keys.add(column.key);
      ordered.push(column);
      if (column.children?.length) {
        visit(column.children);
      }
    }
  }

  visit(columns);
  return ordered;
}

/** Возвращает уровни шапки и порядок ячеек тела после скрытия колонок. */
export function getTableColumnLayout<Row extends object>(
  columns: TableColumnsType<Row>, screens: GridScreenMap
) {
  const leaves: { column: TableColumn<Row>; fixed: TableFixed | undefined; }[] = [];
  const headings: TableHeading<Row>[][] = [];

  // rc-table оставляет заголовок группы как отдельную колонку после скрытия всех детей.
  function visit(column: TableColumn<Row>, depth: number, inheritedFixed?: TableFixed) {
    if (column.hidden) {
      return;
    }

    const fixed = column.fixed ?? inheritedFixed;
    const heading: TableHeading<Row> = {
      column, start: leaves.length, colSpan: 1, rowSpan: 1, group: false
    };
    const row = headings[depth] ??= [];
    row.push(heading);

    for (const child of column.children ?? []) {
      visit(child, depth + 1, fixed);
    }

    const childSpan = leaves.length - heading.start;
    if (childSpan === 0) {
      leaves.push({ column, fixed });
    }
    else {
      heading.colSpan = childSpan;
      heading.group = true;
    }
  }

  // InternalTable проверяет responsive у верхнего уровня до обхода групп в rc-table.
  for (const column of columns) {
    if (!column.responsive || column.responsive.some(point => screens[point])) {
      visit(column, 0);
    }
  }

  for (const [depth, row] of headings.entries()) {
    for (const cell of row) {
      if (!cell.group) {
        cell.rowSpan = headings.length - depth;
      }
    }
  }

  return { leaves, headings };
}
