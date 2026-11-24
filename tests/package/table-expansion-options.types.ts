import type { Snippet } from 'svelte';
import type {
  ConfigProviderProps, TableConfig, TableExpandable, TableExpandIconInfo
} from '@woodger/antd';

interface Row { key: number; name: string; }

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Details = NonNullable<TableExpandable<Row>['expandedRowRender']>;

export type TableExpansionContracts = [
  Assert<Snippet<[Row, number]> extends Details ? true : false>,
  Assert<Equal<Parameters<Details>, [
    record: Row, index: number, indent: number, expanded: boolean
  ]>>,
  Assert<Equal<Parameters<NonNullable<TableExpandable<Row>['expandIcon']>>, [
    info: TableExpandIconInfo<Row>, origin: Snippet
  ]>>,
  Assert<Equal<TableExpandIconInfo<Row>['record'], Row>>,
  Assert<Equal<ConfigProviderProps['table'], TableConfig | undefined>>
];
