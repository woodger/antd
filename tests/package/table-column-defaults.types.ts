import type { TableColumn, TableColumnDefaults, TableColumnsType, TableProps } from '@woodger/antd';

interface Row { key: number; label: string; nested: { score: number; }; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Defaults = TableColumnDefaults<Row>;

export type TableColumnDefaultsContracts = [
  Assert<Equal<TableProps<Row>['column'], Defaults | undefined>>,
  Assert<Equal<TableProps<Row>['columns'], TableColumnsType<Row>>>,
  Assert<Equal<Defaults, Partial<Omit<TableColumn<Row>, 'children'>>>>,
  Assert<Equal<Defaults['dataIndex'], TableColumn<Row>['dataIndex']>>,
  Assert<Equal<Defaults['render'], TableColumn<Row>['render']>>
];
