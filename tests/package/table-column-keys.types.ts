import type { ComponentProps } from 'svelte';
import type {
  Table, TableColumn, TableColumnDefaults, TableColumnInput, TableColumnGroupType, TableColumnsType,
  TableKey, TableSorter
} from '@woodger/antd';

interface Row { key: string; score: number; data: { label: string; }; }
type Props = ComponentProps<typeof Table<Row>>;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

export const implicitColumns = [
  {
    title: 'Group', children: [
      { dataIndex: ['data', 'label'], onHeaderCell: column => ({ title: column.key.toUpperCase() }) },
      { key: 0, dataIndex: 'score', sorter: (left, right) => left.score - right.score }
    ]
  }
] satisfies Props['columns'];

export type TableColumnKeyContracts = [
  Assert<Equal<Props['columns'], readonly TableColumnInput<Row>[]>>,
  Assert<Equal<TableColumnInput<Row>['key'], TableKey | undefined>>,
  Assert<Equal<TableColumnDefaults<Row>['key'], TableKey | undefined>>,
  Assert<Equal<TableColumn<Row>['key'], string>>,
  Assert<Equal<TableColumnGroupType<Row>['children'], TableColumnsType<Row>>>,
  Assert<Equal<TableColumnInput<Row>['onHeaderCell'], TableColumn<Row>['onHeaderCell']>>,
  Assert<Equal<TableSorter['columnKey'], string>>
];
