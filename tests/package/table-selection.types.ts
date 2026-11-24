import type { ComponentProps } from 'svelte';
import type {
  Table, TableKey, TableRowSelectMethod, TableRowSelection, TableSelectionPreset
} from '@woodger/antd';

interface Row { key: number; name: string; }
type Props = ComponentProps<typeof Table<Row>>;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

export type TableSelectionContracts = [
  Assert<Equal<Props['rowSelection'], boolean | TableRowSelection<Row> | undefined>>,
  Assert<Equal<Parameters<NonNullable<Props['onSelectionChange']>>, [
    keys: TableKey[], rows: Row[], info: { type: 'single' | 'all'; }
  ]>>,
  Assert<Equal<Parameters<NonNullable<TableRowSelection<Row>['onChange']>>, [
    keys: TableKey[], rows: Row[], info: { type: TableRowSelectMethod; }
  ]>>,
  Assert<Equal<typeof Table.SELECTION_ALL, 'SELECT_ALL'>>,
  Assert<Equal<typeof Table.SELECTION_ALL | typeof Table.SELECTION_INVERT
    | typeof Table.SELECTION_NONE, TableSelectionPreset>>
];
