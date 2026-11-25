import type { Snippet } from 'svelte';
import type {
  TableBodyRender, TableBodyRenderInfo, TableBodyScrollEvent, TableBodyScrollHandle,
  TableComponents, TableProps, TableScrollConfig
} from '@woodger/antd';

interface Row { key: number; name: string; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

export type TableCustomBodyContracts = [
  Assert<Equal<TableProps<Row>['components'], TableComponents<Row> | undefined>>,
  Assert<Equal<TableComponents<Row>['body'], TableBodyRender<Row> | undefined>>,
  Assert<Equal<TableBodyRender<Row>, Snippet<[readonly Row[], TableBodyRenderInfo]>>>,
  Assert<Equal<TableBodyRenderInfo['ref'],
    (target: HTMLElement | TableBodyScrollHandle) => () => void>>,
  Assert<Equal<TableBodyRenderInfo['onScroll'], (event: TableBodyScrollEvent) => void>>,
  Assert<Equal<TableBodyScrollHandle['scrollTo'], ((config: TableScrollConfig) => void) | undefined>>
];
