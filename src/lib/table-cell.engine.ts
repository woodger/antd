// Читает значения и атрибуты ячеек и определяет строки, нужные для spans
// вокруг виртуального окна. Невидимые начала объединённых ячеек измеряет viewport.
import type { TableCellProps, TableColumn, TableDataIndex } from './table.types';

/** Распознаёт также readonly путь из определения колонки. */
function isDataPath(index: PropertyKey | readonly (string | number)[]): index is
  readonly (string | number)[] {
  return Array.isArray(index);
}

/** Читает буквальный ключ или путь, оставляя значение для render до форматирования. */
export function readTableCellValue<Row extends object>(
  record: Row, dataIndex: TableDataIndex<Row> | undefined
): unknown {
  if (dataIndex === undefined) {
    return record;
  }
  if (!isDataPath(dataIndex)) {
    return record[dataIndex];
  }

  let value: unknown = record;
  for (const segment of dataIndex) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = Reflect.get(Object(value), segment);
  }
  return value;
}

/** Нативный title выводится из строки или числа. У snippet свой title через onCell. */
export function resolveTableCellDisplay<Row extends object>(record: Row, column: TableColumn<Row>) {
  const { dataIndex, render, ellipsis } = column;
  if (render || dataIndex === undefined || (isDataPath(dataIndex) && !dataIndex.length)) {
    return undefined;
  }

  const value = readTableCellValue(record, dataIndex);
  if (value === null || value === undefined) {
    return undefined;
  }

  const text = String(value);
  const showTitle = ellipsis === true || (ellipsis && ellipsis.showTitle);
  const title = showTitle && (typeof value === 'string' || typeof value === 'number')
    ? text : undefined;
  return { text, title };
}

/** Отделяет параметры размещения от DOM attributes и обработчиков владельца. */
export function resolveTableCell(properties?: TableCellProps | void, col = 1, row = 1) {
  // Scope определяется типом колонки и разметкой шапки.
  const { colSpan, rowSpan, scope: _scope, class: className, style, ...attributes } = properties ?? {};
  return { colSpan: colSpan ?? col, rowSpan: rowSpan ?? row, className, style, attributes };
}

export type TableCell = ReturnType<typeof resolveTableCell>;

export interface TableMergedCell {
  columnIndex: number;
  lastIndex: number;
  cell: TableCell;
}

export interface TableMergedRow {
  index: number;
  cells: TableMergedCell[];
}

/** Запрашивает onCell вокруг окна и собирает начала объединённых ячеек по порядку. */
export function resolveTableVirtualCells<Row extends object>(
  rows: readonly { row: { record: Row; }; }[],
  columns: readonly TableColumn<Row>[],
  start: number,
  end: number
) {
  const cells = new Map<number, TableCell[]>();
  const placeholders = new Map<number, number[]>();
  const merged: TableMergedRow[] = [];
  if (start > end || !rows[end]) {
    return { cells, placeholders, merged };
  }

  const activeColumns = columns.flatMap((column, index) => column.onCell ? [index] : []);
  // В одном расчёте начало, конец и рендер строки используют один результат колбэка.
  function readCell(index: number, columnIndex: number) {
    let cached = cells.get(index);
    if (!cached) {
      cached = [];
      cells.set(index, cached);
    }

    const column = columns[columnIndex];
    const record = rows[index].row.record;
    return cached[columnIndex] ??= resolveTableCell(column.onCell?.(record, index));
  }

  // Идёт к ближайшему началу, которым закрыты все нулевые spans верхней строки.
  function findStart() {
    let pending = activeColumns;
    for (let index = start; index >= 0; index--) {
      pending = pending.filter(leaf => readCell(index, leaf).rowSpan === 0);
      if (!pending.length) {
        return index;
      }
    }
    return start;
  }

  // Если spans продолжаются до конца данных, Source оставляет исходный конец окна.
  function findEnd() {
    let pending = activeColumns;
    for (let index = end; index < rows.length; index++) {
      pending = pending.filter(leaf => readCell(index, leaf).rowSpan !== 1);
      if (!pending.length) {
        return Math.max(end, index - 1);
      }
    }
    return end;
  }

  const first = findStart();
  const last = findEnd();
  for (let index = first; index <= last; index++) {
    const origins: TableMergedCell[] = [];
    for (const columnIndex of activeColumns) {
      const cell = readCell(index, columnIndex);
      if (cell.colSpan !== 0 && cell.rowSpan > 1) {
        const lastIndex = Math.min(index + Math.floor(cell.rowSpan) - 1, rows.length - 1);
        origins.push({ columnIndex, lastIndex, cell });
      }
    }
    if (origins.length) {
      merged.push({ index, cells: origins });
    }
  }

  // Нулевая ячейка сохраняет своё место, если colspan слева его ещё не занял.
  for (let index = start; index <= end; index++) {
    const row: number[] = [];
    let nextColumn = 0;
    for (const leaf of activeColumns) {
      const cell = readCell(index, leaf);
      const skipped = cell.colSpan === 0 || cell.rowSpan === 0;
      if (skipped && leaf < nextColumn) {
        row[leaf] = 0;
        continue;
      }

      const width = Math.max(1, Math.min(columns.length - leaf, Math.floor(cell.colSpan) || 1));
      nextColumn = Math.max(nextColumn, leaf + width);
      if (skipped || cell.rowSpan > 1) {
        row[leaf] = width;
      }
    }
    placeholders.set(index, row);
  }

  return { cells, placeholders, merged };
}
