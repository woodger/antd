// The final cells use the current prefix and displacements of the same column grid.
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

/** Ties the final cells to the columns of the nearest table. */
export function provideTableSummary(context: TableSummaryContext) {
  setContext(summaryKey, context);
}

/** Returns the owner of the displacements, including for the cells in the user snippet. */
export function useTableSummary(): TableSummaryContext {
  return getContext(summaryKey);
}
