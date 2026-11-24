import TableRoot from './Table.svelte';
import SummaryRoot from './TableSummary.svelte';
import Row from './TableSummaryRow.svelte';
import Cell from './TableSummaryCell.svelte';

const Summary: typeof SummaryRoot & { Row: typeof Row; Cell: typeof Cell; } =
  Object.assign(SummaryRoot, { Row, Cell });
const Table: typeof TableRoot & { Summary: typeof Summary; } = Object.assign(TableRoot, { Summary });
// Имя компонента остаётся одновременно типом экземпляра, как у Table.svelte.
type Table<Row extends object> = TableRoot<Row>;

export default Table;
