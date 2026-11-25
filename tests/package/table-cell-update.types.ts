import type { ComponentProps } from 'svelte';
import type { Table, TableColumn, TableColumnDefaults } from '@woodger/antd';

interface Row { key: string; value: string; revision: number; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

type Predicate = (record: Row, previousRecord: Row) => boolean;
type Columns = NonNullable<ComponentProps<typeof Table<Row>>['columns']>;

export const conditionalColumn = {
  key: 'value', dataIndex: 'value',
  shouldCellUpdate: (record, previous) => record.revision !== previous.revision
} satisfies TableColumn<Row>;

export type ConditionalCellContracts = [
  Assert<Equal<TableColumn<Row>['shouldCellUpdate'], Predicate | undefined>>,
  Assert<Equal<TableColumnDefaults<Row>['shouldCellUpdate'], Predicate | undefined>>,
  Assert<Equal<Columns[number]['shouldCellUpdate'], Predicate | undefined>>
];
