import type { Snippet } from 'svelte';
import type {
  TableColumn, TableColumnDefaults, TableFilterConfirmOptions, TableFilterDropdownOptions,
  TableFilterDropdownProps, TableFilterOption, TableFilterResetOptions, TableFilterValue
} from '@woodger/antd';

interface Row { key: number; score: number; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

export type TableFilterDropdownContracts = [
  Assert<Equal<TableColumn<Row>['filterIcon'], Snippet<[filtered: boolean]> | undefined>>,
  Assert<Equal<TableColumn<Row>['filterDropdown'], Snippet<[TableFilterDropdownProps]> | undefined>>,
  Assert<Equal<TableColumn<Row>['filterOnClose'], boolean | undefined>>,
  Assert<Equal<TableColumnDefaults<Row>['filterDropdownProps'], TableFilterDropdownOptions | undefined>>,
  Assert<Equal<TableFilterDropdownOptions['popupRender'], Snippet<[origin: Snippet]> | undefined>>,
  Assert<Equal<TableFilterDropdownOptions['onOpenChange'], ((open: boolean) => void) | undefined>>,
  Assert<Equal<TableFilterDropdownProps['selectedKeys'], readonly TableFilterValue[]>>,
  Assert<Equal<TableFilterDropdownProps['filters'], readonly TableFilterOption[] | undefined>>,
  Assert<Equal<TableFilterDropdownProps['confirm'], (options?: TableFilterConfirmOptions) => void>>,
  Assert<Equal<TableFilterDropdownProps['clearFilters'], (options?: TableFilterResetOptions) => void>>
];
