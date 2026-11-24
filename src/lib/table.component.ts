import TableRoot from './Table.svelte';
import SummaryRoot from './TableSummary.svelte';
import Row from './TableSummaryRow.svelte';
import Cell from './TableSummaryCell.svelte';
import { EXPAND_COLUMN, SELECTION_COLUMN } from './table-columns.engine';
import { SELECTION_ALL, SELECTION_INVERT, SELECTION_NONE } from './table-selection.constants';

const Summary: typeof SummaryRoot & { Row: typeof Row; Cell: typeof Cell; } =
  Object.assign(SummaryRoot, { Row, Cell });
const Table: typeof TableRoot & {
  Summary: typeof Summary;
  SELECTION_COLUMN: typeof SELECTION_COLUMN;
  EXPAND_COLUMN: typeof EXPAND_COLUMN;
  SELECTION_ALL: typeof SELECTION_ALL;
  SELECTION_INVERT: typeof SELECTION_INVERT;
  SELECTION_NONE: typeof SELECTION_NONE;
} = Object.assign(TableRoot, {
  Summary, SELECTION_COLUMN, EXPAND_COLUMN, SELECTION_ALL, SELECTION_INVERT, SELECTION_NONE
} as const);
// Имя компонента остаётся одновременно типом экземпляра, как у Table.svelte.
type Table<Row extends object> = TableRoot<Row>;

export default Table;
