import type { TableColumn, TableProps, TableSorterTooltipProps, TooltipProps } from '@woodger/antd';

interface Row { key: number; score: number; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

export type TableSorterTooltipContracts = [
  Assert<Equal<TableProps<Row>['showSorterTooltip'], boolean | TableSorterTooltipProps | undefined>>,
  Assert<Equal<TableColumn<Row>['showSorterTooltip'], TableProps<Row>['showSorterTooltip']>>,
  Assert<Equal<TableSorterTooltipProps['title'], TooltipProps['title']>>,
  Assert<Equal<TableSorterTooltipProps['getPopupContainer'], TooltipProps['getPopupContainer']>>
];
