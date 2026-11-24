// Итоговые ячейки используют текущий префикс и смещения той же сетки колонок.
import { getContext, setContext } from 'svelte';

export interface TableFixedCell {
  side: 'start' | 'end' | undefined;
  offset: string;
}

interface TableSummaryContext {
  readonly prefix: string;
  fixedSpan(index: number, span: number): TableFixedCell | undefined;
}

const summaryKey = Symbol('ant-table-summary');

/** Привязывает итоговые ячейки к колонкам ближайшей таблицы. */
export function provideTableSummary(context: TableSummaryContext) {
  setContext(summaryKey, context);
}

/** Возвращает владельца смещений, в том числе для ячеек в пользовательском snippet. */
export function useTableSummary(): TableSummaryContext {
  return getContext(summaryKey);
}
