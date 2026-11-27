import type {
  PaginationSemantic, PaginationSlots, TableClassNameSlots, TableConfig, TableConfigSemantic,
  TablePaginationConfig, TableProps, TableSemantic, TableSemanticSlots
} from '@woodger/antd';

interface Row { key: number; name: string; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type RowSemanticCallback = Exclude<TableSemantic<Row>, TableSemanticSlots>;

export type TableSemanticContracts = [
  Assert<Equal<TableProps<Row>['classNames'], TableSemantic<Row, TableClassNameSlots> | undefined>>,
  Assert<Equal<TableProps<Row>['styles'], TableSemantic<Row> | undefined>>,
  Assert<Equal<Parameters<RowSemanticCallback>[0]['props'], TableProps<Row>>>,
  Assert<Equal<TableProps<Row>['rootClassName'], string | undefined>>,
  Assert<Equal<TableConfig['classNames'], TableConfigSemantic<TableClassNameSlots> | undefined>>,
  Assert<Equal<TableConfig['styles'], TableConfigSemantic | undefined>>,
  Assert<Equal<TableSemanticSlots['pagination'], PaginationSlots | undefined>>,
  Assert<Equal<TableClassNameSlots['pagination'], PaginationSlots | string | undefined>>,
  Assert<Equal<TablePaginationConfig['classNames'], PaginationSemantic | undefined>>,
  Assert<Equal<TablePaginationConfig['styles'], PaginationSemantic | undefined>>
];
