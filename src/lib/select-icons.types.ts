import type { Snippet } from 'svelte';
import type { RenderEmptyContent } from './types';

/** Function — чистый producer; статический template передаётся внутри массива. */
export type SelectRenderNode<Info> = Exclude<RenderEmptyContent, Snippet>
  | ((info: Info) => RenderEmptyContent);

/** Пять собственных полей BaseSelect; loading сохраняет явный undefined. */
export interface SelectSuffixInfo {
  searchValue: string;
  open: boolean;
  focused: boolean;
  showSearch: boolean;
  loading: boolean | undefined;
}

/** Value соответствует flattened option и учитывает fieldNames. */
export interface SelectMenuItemIconInfo<Value extends string | number = string> {
  value: Value | undefined;
  disabled: boolean;
  isSelected: boolean;
}

export interface SelectAllowClear {
  clearIcon?: RenderEmptyContent;
  /** Пустая строка сохраняется; null/undefined используют доступное имя по умолчанию. */
  label?: string | null;
}
