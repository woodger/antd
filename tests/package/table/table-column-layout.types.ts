import type { Snippet } from 'svelte';
import type { TableColumn, TableDataIndex, TableLayout, TableProps } from '@woodger/antd';

interface Row { key: number; person: { name: string; }; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Render = NonNullable<TableColumn<Row>['render']>;

export type TableColumnLayoutContracts = [
  Assert<readonly ['person', 'name'] extends TableDataIndex<Row> ? true : false>,
  Assert<readonly (string | number)[] extends TableDataIndex<Row> ? true : false>,
  Assert<'unknown-field' extends TableDataIndex<Row> ? false : true>,
  Assert<Snippet<[Row, number]> extends Render ? true : false>,
  Assert<Render extends Snippet<[Row, number]> ? true : false>,
  Assert<Snippet<[Row, number, unknown]> extends Render ? true : false>,
  Assert<Equal<Parameters<Render>, [record: Row, index: number, value?: unknown]>>,
  Assert<Equal<TableProps<Row>['tableLayout'], TableLayout | undefined>>,
  Assert<Equal<TableColumn<Row>['minWidth'], number | undefined>>
];
