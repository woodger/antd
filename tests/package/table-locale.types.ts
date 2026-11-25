import type {
  AntDesignLocale, RenderEmptyContent, TableLocale, TableLocaleOverrides, TableProps
} from '@woodger/antd';

interface Row { key: number; name: string; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

export type TableLocaleContracts = [
  Assert<Equal<TableProps<Row>['locale'], TableLocaleOverrides | undefined>>,
  Assert<Equal<TableLocaleOverrides['emptyText'], RenderEmptyContent>>,
  Assert<Equal<TableLocaleOverrides['filterConfirm'], RenderEmptyContent>>,
  Assert<Equal<TableLocaleOverrides['filterCheckAll'], RenderEmptyContent>>,
  Assert<Equal<TableLocaleOverrides['selectInvert'], RenderEmptyContent>>,
  Assert<Equal<TableLocale['emptyText'], string>>,
  Assert<Equal<TableLocaleOverrides['triggerAsc'], string | undefined>>,
  Assert<Equal<'filterCheckall' extends keyof TableLocaleOverrides ? true : false, false>>,
  Assert<NonNullable<AntDesignLocale['Table']> extends TableLocaleOverrides ? true : false>
];
