import type { Snippet } from 'svelte';
import type {
  MenuItem, MenuItemType, RenderEmptyContent, TableColumn, TableFilterDropdownProps, TableFilterOption
} from '@woodger/antd';

interface Row { key: string; value: string; }
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

/** Использует значение критерия отдельно от числового или составного содержимого. */
export function tableContentColumn(label: Snippet): TableColumn<Row> {
  return {
    key: 'value', dataIndex: 'value',
    filters: [{ text: 0, value: 'zero' }, { text: [label, [null, ' suffix']], value: 'rich' }],
    filterSearch: (query, option) => option.text === label || option.value === query
  };
}

/** Позволяет передать ту же подпись группе и пункту Menu. */
export function menuContentItems(label: Snippet): MenuItemType[] {
  return [{ key: 'group', type: 'group', label: ['Group ', label],
    children: [{ key: 'item', label: [0, false, label] }] }];
}

export type TableFilterContentContracts = [
  Assert<Equal<TableFilterOption['text'], RenderEmptyContent>>,
  Assert<Equal<MenuItem['label'], RenderEmptyContent>>,
  Assert<Equal<TableFilterDropdownProps['filters'], readonly TableFilterOption[] | undefined>>
];
