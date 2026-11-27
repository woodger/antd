import type {
  TableColumn, TableColumnDefaults, TableFilterMode, TableFilterOption, TableFilterSearch
} from '@woodger/antd';

interface Row { key: number; category: string; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

export type TableFilterOptionsContracts = [
  Assert<Equal<TableFilterMode, 'menu' | 'tree'>>,
  Assert<Equal<TableColumn<Row>['filterMode'], TableFilterMode | undefined>>,
  Assert<Equal<TableColumnDefaults<Row>['filterSearch'], TableFilterSearch | undefined>>,
  Assert<Equal<TableFilterOption['children'], readonly TableFilterOption[] | undefined>>,
  Assert<Equal<Exclude<TableFilterSearch, boolean>, (input: string, option: TableFilterOption) => boolean>>
];
