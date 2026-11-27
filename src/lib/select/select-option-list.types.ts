import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { VirtualScrollConfig } from '../virtual-list.types';
import type { createSelectOptionList } from './select-option-list.model.svelte';
import type { SelectStyle } from './select.types';

export type SelectOptionListKey = string | number | bigint;
export type SelectOptionListScrollConfig = VirtualScrollConfig<SelectOptionListKey>;

/** Parent preserves the original item, key and absolute index of the current flattened list. */
export interface SelectOptionListItem<Item> {
  key: SelectOptionListKey;
  originalIndex: number;
  item: Item;
  group?: boolean;
  ariaLabel?: string;
  ariaValue?: string | number;
  ariaSelected: boolean;
  /** Source flag for srlist; count restrictions only change the physical string. */
  ariaDisabled?: boolean;
  disabled?: boolean;
  ariaAttributes?: Readonly<Record<string, string | number | boolean | null | undefined>>;
}

export interface SelectOptionListRenderInfo {
  index: number;
  virtual: boolean;
  attach: (node: HTMLElement) => () => void;
  attributes: {
    id?: string;
    role?: 'option' | 'presentation';
    'aria-selected'?: boolean;
    'aria-disabled'?: boolean;
  };
}

export interface SelectOptionListProps<Item> {
  model: ReturnType<typeof createSelectOptionList<Item>>;
  renderItem: Snippet<[Item, SelectOptionListRenderInfo]>;
  id: string;
  getItemId?: (index: number) => string;
  prefixCls: string;
  class?: string;
  style?: SelectStyle;
  direction?: 'ltr' | 'rtl';
  showScrollBar?: boolean | 'optional';
  activeIndex?: number;
  ariaLabel?: string;
  multiple?: boolean;
  busy?: boolean;
  onScroll?: HTMLAttributes<HTMLDivElement>['onscroll'];
  holderElement?: HTMLDivElement;
  listElement?: HTMLDivElement;
}
