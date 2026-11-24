import type { ComponentProps, Snippet } from 'svelte';
import type {
  Table, TableChange, TableRef, TableSummaryCellProps, TableSummaryConfig, TableSummaryRowProps
} from '@woodger/antd';

interface Row { key: number; rank: number; }
type Props = ComponentProps<typeof Table<Row>>;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<Value extends true> = Value;

export type TableSummaryContracts = [
  Assert<Equal<Props['dataSource'], readonly Row[]>>,
  Assert<Equal<Props['onChange'], ((change: TableChange<Row>) => void) | undefined>>,
  Assert<Equal<Props['summary'], Snippet<[readonly Row[]]> | TableSummaryConfig<Row> | undefined>>,
  Assert<Equal<ComponentProps<typeof Table.Summary.Cell>, TableSummaryCellProps>>,
  Assert<Equal<ComponentProps<typeof Table.Summary.Row>, TableSummaryRowProps>>,
  Assert<Equal<ReturnType<typeof Table<Row>>['scrollTo'], TableRef['scrollTo']>>,
  Assert<Equal<Table<Row>['scrollTo'], TableRef['scrollTo']>>
];
