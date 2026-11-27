import type { HTMLAttributes } from 'svelte/elements';
import type { TableColumnsType, TableProps, TableRowProps } from '@woodger/antd';

interface Person { key: number; name: string; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Events = HTMLAttributes<HTMLTableRowElement>;

export type TableRowAttributeContracts = [
  Assert<Equal<NonNullable<TableProps<Person>['onRow']>,
    (record: Person, index: number) => TableRowProps | void>>,
  Assert<Equal<NonNullable<TableProps<Person>['onHeaderRow']>,
    (columns: TableColumnsType<Person>, index: number) => TableRowProps | void>>,
  Assert<Equal<TableRowProps['onclick'], Events['onclick']>>,
  Assert<Equal<TableRowProps['onkeydown'], Events['onkeydown']>>,
  Assert<Equal<TableRowProps['style'], Events['style']>>
];
