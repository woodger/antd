import type { ComponentProps } from 'svelte';
import type { ConfigProvider, Table, TableConfig, TableProps, TableScrollOptions } from '@woodger/antd';

interface Row { id: number; label: string; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

export const tableConfig = {
  rowKey: (record: Row) => record.id,
  scroll: { x: true, y: 108, scrollToFirstRowOnChange: false }
} satisfies TableConfig;

export type TableConfigContracts = [
  Assert<Equal<ComponentProps<typeof ConfigProvider>['table'], TableConfig | undefined>>,
  Assert<Equal<TableConfig['scroll'], TableScrollOptions | undefined>>,
  Assert<Equal<ComponentProps<typeof Table<Row>>['scroll'], TableScrollOptions | undefined>>,
  Assert<Equal<TableProps<Row>['rowKey'], keyof Row | ((record: Row) => string | number) | undefined>>,
  Assert<Equal<TableScrollOptions['x'], number | string | true | undefined>>
];
