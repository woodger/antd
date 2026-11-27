import type { Snippet } from 'svelte';
import type {
  RenderEmptyContent, TableColumn, TableColumnDefaults, TableColumnTitle, TableColumnTitleProps,
  TableFilterValue, TableSortOrder
} from '@woodger/antd';

interface Row { key: number; score: number; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

export type TableColumnTitleContracts = [
  Assert<Equal<TableColumn<Row>['title'], TableColumnTitle<Row> | undefined>>,
  Assert<Equal<TableColumnDefaults<Row>['title'], TableColumn<Row>['title']>>,
  Assert<Equal<Extract<TableColumnTitle<Row>, Snippet<[TableColumnTitleProps<Row>]>>,
    Snippet<[info: TableColumnTitleProps<Row>]>>>,
  Assert<Equal<Exclude<TableColumnTitle<Row>, Snippet<[TableColumnTitleProps<Row>]>>,
    Exclude<RenderEmptyContent, Snippet | undefined>>>,
  Assert<Equal<keyof TableColumnTitleProps<Row>, 'sortColumns' | 'filters'>>,
  Assert<Equal<TableColumnTitleProps<Row>['sortColumns'][number]['column'], TableColumn<Row>>>,
  Assert<Equal<TableColumnTitleProps<Row>['sortColumns'][number]['order'], TableSortOrder | null>>,
  Assert<Equal<TableColumnTitleProps<Row>['filters'][string], readonly TableFilterValue[]>>
];
