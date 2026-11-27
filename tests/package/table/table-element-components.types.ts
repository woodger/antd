import type { Snippet } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type {
  TableBodyComponents, TableComponents, TableElement, TableElementAttributes, TableElementRenderInfo,
  TableHeaderComponents, TableProps
} from '@woodger/antd';

interface Row { key: number; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

export type TableElementContracts = [
  Assert<Equal<TableProps<Row>['components'], TableComponents<Row> | undefined>>,
  Assert<Equal<TableHeaderComponents['table'], TableElement<'table'> | undefined>>,
  Assert<Equal<TableBodyComponents['cell'], TableElement<'td' | 'th'> | undefined>>,
  Assert<Equal<TableElement<'tr'>, string | Snippet<[TableElementRenderInfo<'tr'>]>>>,
  Assert<Equal<TableElementRenderInfo<'tr'>['tag'], 'tr'>>,
  Assert<Equal<TableElementRenderInfo<'tr'>['attributes'], TableElementAttributes<'tr'>>>,
  Assert<Equal<TableElementRenderInfo<'tbody'>['ref'], Attachment<HTMLElement>>>
];
