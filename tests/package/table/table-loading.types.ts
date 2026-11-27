import type { ComponentProps } from 'svelte';
import type { SpinProps, Table, TableProps } from '@woodger/antd';

interface Row { key: string; name: string; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

export type TableLoadingContracts = [
  Assert<Equal<TableProps<Row>['loading'], boolean | SpinProps | undefined>>,
  Assert<Equal<ComponentProps<typeof Table<Row>>['loading'], boolean | SpinProps | undefined>>,
  Assert<Equal<TableProps<Row>['dataSource'], readonly Row[] | null | undefined>>
];
