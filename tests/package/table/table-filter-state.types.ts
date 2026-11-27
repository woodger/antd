import type { TableColumn, TableColumnDefaults, TableFilterValue } from '@woodger/antd';

interface Row { key: number; score: number; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Values = readonly TableFilterValue[] | null | undefined;

export type TableFilterStateContracts = [
  Assert<Equal<TableColumn<Row>['filteredValue'], Values>>,
  Assert<Equal<TableColumn<Row>['defaultFilteredValue'], Values>>,
  Assert<Equal<TableColumn<Row>['filtered'], boolean | undefined>>,
  Assert<Equal<TableColumn<Row>['filterResetToDefaultFilteredValue'], boolean | undefined>>,
  Assert<Equal<TableColumnDefaults<Row>['filteredValue'], Values>>
];
