import type {
  TableChange, TableColumn, TableColumnSorter, TableProps, TableSortCompare, TableSorter
} from '@woodger/antd';

interface Row { key: number; score: number; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

export type TableSorterContracts = [
  Assert<Equal<TableProps<Row>['sorter'], TableSorter | null | undefined>>,
  Assert<Equal<TableChange<Row>['sorter'], TableSorter | null>>,
  Assert<Equal<TableChange<Row>['sorters'], TableSorter[] | undefined>>,
  Assert<((left: Row, right: Row) => number) extends TableSortCompare<Row> ? true : false>,
  Assert<TableColumnSorter<Row> extends NonNullable<TableColumn<Row>['sorter']> ? true : false>
];
