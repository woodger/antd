import type { Snippet } from 'svelte';
import type {
  RenderEmptyContent, TableColumn, TableColumnDefaults, TableFilterConfirmOptions,
  TableFilterDropdownOptions, TableFilterDropdownProps, TableFilterOption, TableFilterResetOptions,
  TableFilterValue
} from '@woodger/antd';

interface Row { key: number; score: number; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type StaticContent = Exclude<RenderEmptyContent, Snippet>;

export type TableFilterDropdownContracts = [
  Assert<Equal<TableColumn<Row>['filterIcon'], StaticContent | Snippet<[filtered: boolean]>>>,
  Assert<Equal<TableColumn<Row>['filterDropdown'],
    StaticContent | Snippet<[info: TableFilterDropdownProps]>>>,
  Assert<Equal<TableColumnDefaults<Row>['filterIcon'], TableColumn<Row>['filterIcon']>>,
  Assert<Equal<TableColumnDefaults<Row>['filterDropdown'], TableColumn<Row>['filterDropdown']>>,
  Assert<Equal<TableColumn<Row>['filterOnClose'], boolean | undefined>>,
  Assert<Equal<TableColumnDefaults<Row>['filterDropdownProps'], TableFilterDropdownOptions | undefined>>,
  Assert<Equal<TableFilterDropdownOptions['popupRender'], Snippet<[origin: Snippet]> | undefined>>,
  Assert<Equal<TableFilterDropdownOptions['onOpenChange'], ((open: boolean) => void) | undefined>>,
  Assert<Equal<TableFilterDropdownProps['selectedKeys'], readonly TableFilterValue[]>>,
  Assert<Equal<TableFilterDropdownProps['filters'], readonly TableFilterOption[] | undefined>>,
  Assert<Equal<TableFilterDropdownProps['confirm'], (options?: TableFilterConfirmOptions) => void>>,
  Assert<Equal<TableFilterDropdownProps['clearFilters'], (options?: TableFilterResetOptions) => void>>
];
