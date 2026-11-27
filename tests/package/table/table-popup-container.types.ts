import type { DropdownProps, TableFilterDropdownOptions, TableProps } from '@woodger/antd';

interface Row { key: number; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Container = ((trigger: HTMLElement) => HTMLElement) | undefined;

export type TablePopupContainerContracts = [
  Assert<Equal<TableProps<Row>['getPopupContainer'], Container>>,
  Assert<Equal<TableProps<Row>['getPopupContainer'], DropdownProps['getPopupContainer']>>,
  Assert<Equal<TableFilterDropdownOptions['getPopupContainer'], Container>>
];
