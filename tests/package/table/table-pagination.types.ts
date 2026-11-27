import type {
  PaginationProps, TablePaginationConfig, TablePaginationPlacement, TableProps
} from '@woodger/antd';

interface Row { key: number; name: string; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

export type TablePaginationContracts = [
  Assert<Equal<TableProps<Row>['pagination'], TablePaginationConfig | false | undefined>>,
  Assert<Equal<TablePaginationConfig['placement'], readonly TablePaginationPlacement[] | undefined>>,
  Assert<Equal<TablePaginationPlacement,
    'topStart' | 'topCenter' | 'topEnd' | 'bottomStart' | 'bottomCenter' | 'bottomEnd' | 'none'>>,
  Assert<Equal<TablePaginationConfig['onChange'], PaginationProps['onChange']>>,
  Assert<Equal<TablePaginationConfig['onShowSizeChange'], PaginationProps['onShowSizeChange']>>,
  Assert<Equal<TablePaginationConfig['itemRender'], PaginationProps['itemRender']>>,
  Assert<Equal<TablePaginationConfig['simple'], PaginationProps['simple']>>,
  Assert<Equal<'position' extends keyof TablePaginationConfig ? true : false, false>>
];
