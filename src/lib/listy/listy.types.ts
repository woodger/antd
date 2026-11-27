import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export type ListyKey = string | number | bigint;
export type ScrollAlign = 'top' | 'bottom' | 'auto';
export type ListyScrollAlign = ScrollAlign;
export type ListySemanticName = 'root' | 'item' | 'groupHeader';
export type ListyClassNames = Partial<Record<ListySemanticName, string>>;
/** Semantic styles values are recorded as CSS declaration strings. */
export type ListyStyles = Partial<Record<ListySemanticName, string>>;

/** RAW props prior to defaults and ConfigProvider; generic callbacks remain unknown. */
export interface ListySemanticProps {
  items?: readonly unknown[];
  sticky?: boolean;
  height?: number;
  virtual?: boolean;
  prefixCls?: string;
  class?: string;
  rootClassName?: string;
  style?: string;
  [name: string]: unknown;
}

export type ListySemantic = ListyClassNames | ((info: {
  props: ListySemanticProps;
}) => ListyClassNames);

/** Groups gather all over items, keeping the order of the first appearance of the key. */
export interface ListyGroup<T, K extends ListyKey = ListyKey> {
  key: (item: T) => K;
  /** Snippet receives the key and source objects of the group; index itemRender does not change. */
  title: Snippet<[groupKey: K, items: T[]]>;
}

/** Align by default auto; group target - section in raw mode, header row in virtual mode. */
export type ListyScrollToConfig = number | null | {
  key: ListyKey;
  align?: ListyScrollAlign;
  offset?: number;
} | {
  groupKey: ListyKey;
  align?: ListyScrollAlign;
  offset?: number;
} | {
  top?: number;
  left?: number;
};

/** Available via bind:ref after mount; when unmount binding is cleaned. */
export interface ListyRef {
  /** No argument: no-op in raw mode, show scrollbar in virtual mode. */
  scrollTo: (config?: ListyScrollToConfig) => void;
}

/** Listy settings; local class/styles complement and overlap inherited. */
export interface ListyConfig {
  class?: string;
  style?: string;
  classNames?: ListySemantic;
  styles?: ListySemantic;
}

/** List of Ant Design with grouping, sticky headers and measured virtual lines. */
export interface ListyProps<T = unknown, K extends ListyKey = ListyKey> {
  items?: readonly T[];
  /** Required stable key; fallback on index is missing. */
  rowKey: keyof T | ((item: T) => ListyKey);
  /** Straight Svelte snippet instead of ReactNode callback; index - in the original items. */
  itemRender: Snippet<[item: T, index: number]>;
  group?: ListyGroup<T, K>;
  /** @defaultValue false */
  sticky?: boolean;
  height?: number;
  /** local ?? ConfigProvider.virtual ?? false. Virtualization also requires a nonzero height. */
  virtual?: boolean;
  /** Native scroll event: currentTarget – root in raw mode, holder in virtual mode. */
  onScroll?: HTMLAttributes<HTMLDivElement>['onscroll'];
  onscroll?: HTMLAttributes<HTMLDivElement>['onscroll'];
  classNames?: ListySemantic;
  styles?: ListySemantic;
  /** Local CSS prefix; empty/undefined inherited ConfigProvider. */
  prefixCls?: string;
  class?: string;
  rootClassName?: string;
  style?: string;
  /** Maintains bind:ref; the object contains only scrollTo. */
  ref?: ListyRef;
  /** Root div; supports bind:nativeElement and is cleaned at unmount. */
  nativeElement?: HTMLDivElement;
  id?: string;
  role?: HTMLAttributes<HTMLDivElement>['role'];
  tabindex?: number;
  [attribute: `aria-${string}`]: unknown;
  [attribute: `data-${string}`]: unknown;
}

export interface ListyViewProps<T, K extends ListyKey> {
  items: readonly T[];
  rowKey: ListyProps<T, K>['rowKey'];
  itemRender: ListyProps<T, K>['itemRender'];
  group?: ListyGroup<T, K>;
  sticky?: boolean;
  height?: number;
  itemHeight: number;
  prefixCls: string;
  direction: 'ltr' | 'rtl';
  classNames: ListyClassNames;
  styles: ListyStyles;
  onScroll?: ListyProps<T, K>['onScroll'];
  ref?: ListyRef;
  nativeElement?: HTMLDivElement;
  attributes: Record<string, unknown>;
}
