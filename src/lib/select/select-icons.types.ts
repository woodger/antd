import type { Snippet } from 'svelte';
import type { RenderEmptyContent } from '../types';

/** Function – pure producer; the static template is transmitted inside the array. */
export type SelectRenderNode<Info> = Exclude<RenderEmptyContent, Snippet>
  | ((info: Info) => RenderEmptyContent);

/** Five own fields BaseSelect; loading keeps an apparent undefined. */
export interface SelectSuffixInfo {
  searchValue: string;
  open: boolean;
  focused: boolean;
  showSearch: boolean;
  loading: boolean | undefined;
}

/** Value corresponds to flattened option and takes into account fieldNames. */
export interface SelectMenuItemIconInfo<Value extends string | number = string> {
  value: Value | undefined;
  disabled: boolean;
  isSelected: boolean;
}

export interface SelectAllowClear {
  clearIcon?: RenderEmptyContent;
  /** Empty string is saved; null/undefined uses the available name by default. */
  label?: string | null;
}
