import type { ComponentProps, Snippet } from 'svelte';
import type { HTMLTableAttributes } from 'svelte/elements';
import type { Table, TableProps } from '@woodger/antd';

interface Row { key: number; value: string; }
type Props = ComponentProps<typeof Table<Row>>;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

const tableDomAttributes = {
  columns: [{ key: 'value', dataIndex: 'value' }],
  id: 'report', role: 'grid', 'aria-describedby': 'report-description', 'aria-rowcount': 0,
  'data-owner': 'report', 'data-status': false
} satisfies Props;

/** Использует caption в выведенном generic Table вместе с прежней схемой колонок. */
export function tableWithCaption(caption: Snippet): TableProps<Row> {
  return { ...tableDomAttributes, caption };
}

export type TableDomContracts = [
  Assert<Equal<Props['id'], string | undefined>>,
  Assert<Equal<Props['role'], HTMLTableAttributes['role']>>,
  Assert<Equal<Props['aria-label'], string | undefined>>,
  Assert<Equal<Props['aria-labelledby'], HTMLTableAttributes['aria-labelledby']>>,
  Assert<Equal<Props['aria-rowcount'], HTMLTableAttributes['aria-rowcount']>>,
  Assert<Equal<Props['data-report'], string | number | boolean | undefined>>,
  Assert<Equal<Props['caption'], string | number | boolean | Snippet | null | undefined>>,
  Assert<Equal<Props['nativeElement'], HTMLDivElement | undefined>>
];
