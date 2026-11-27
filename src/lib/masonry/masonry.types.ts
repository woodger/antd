import type { Snippet } from 'svelte';
import type { GridGutter, GridResponsive } from '../grid/grid.types';

export type MasonryKey = string | number;
export type MasonryContent = string | number | boolean | null | Snippet;

/** The data of one cell; the key should be unique after converting into a string. */
export interface MasonryItemType<Data = unknown> {
  key: MasonryKey;
  /** Preferred column; the upper boundary is limited to columns - 1. */
  column?: number;
  /** Reference field API; the layout uses the measured DOM-height, not that value. */
  height?: number;
  /**
   * Any value other than null/undefined overlaps itemRender, including 0/false/empty string.
   */
  children?: MasonryContent;
  data: Data;
}

export type MasonryRenderInfo<Data = unknown> = MasonryItemType<Data> & {
  index: number;
  column: number;
};

export type MasonrySemanticSlots = Partial<Record<'root' | 'item', string>>;
/** Semantic callbacks get Props with a permitted number of columns. */
export type MasonrySemantic<Data = unknown> = MasonrySemanticSlots
  | ((info: { props: MasonryProps<Data>; }) => MasonrySemanticSlots | undefined);

/** Layer settings root/item; nested config is replaced entirely. */
export interface MasonryConfig {
  class?: string;
  style?: string;
  // The data type of the instance is unknown to the total ConfigProvider, as in upstream MasonryProps<any>.
  classNames?: MasonrySemantic<any>;
  styles?: MasonrySemantic<any>;
}

/** Measurable layout of elements of different heights in the shortest columns. */
export interface MasonryProps<Data = unknown> {
  /** Local CSS prefix; otherwise ConfigProvider. Namespace item width sets a general prefix. */
  prefixCls?: string;
  /** As in React PropsWithChildren, it is accepted but not used to display cells. */
  children?: MasonryContent;
  /** Elements appear after mount, as in React useEffect; on SSR root empty. */
  items?: MasonryItemType<Data>[];
  /** Svelte snippet instead of React renderer; called when item does not have children. */
  itemRender?: Snippet<[MasonryRenderInfo<Data>]>;
  /**
   * Positive integer or responsive map. By default 3; for map without a match is taken xs, then 1.
   * The number is not rounded.
   */
  columns?: number | GridResponsive<number>;
  /** By default 0; the solitary value applies to both axes. */
  gutter?: GridGutter | [GridGutter, GridGutter];
  /** Additionally observes cell sizes; by default only root and image load/error. */
  fresh?: boolean;
  /**
   * Distribution Change: elements in the original order with the computed column. Contains the
   * original item fields; the same data does not generate a repeated callback.
   */
  onLayoutChange?: (items: (MasonryItemType<Data> & { column: number; })[]) => void;
  class?: string;
  rootClassName?: string;
  /** The local root style comes after semantic root, context and calculated height. */
  style?: string;
  classNames?: MasonrySemantic<Data>;
  /** Geometry of the cells comes after semantic item styles. */
  styles?: MasonrySemantic<Data>;
  /** bind:nativeElement returns root div and is purified at unmount. */
  nativeElement?: HTMLDivElement;
}
