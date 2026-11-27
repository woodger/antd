import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { ComponentSize } from './types';
import type { GridResponsive } from './grid/grid.types';

export type DescriptionsContent = string | number | boolean | null | Snippet;
export type DescriptionsCellSlots = Partial<Record<'label' | 'content', string>>;
export type DescriptionsSlots = Partial<
  Record<'root' | 'header' | 'title' | 'extra' | 'label' | 'content', string>
>;
/** The callback receives resolved column, items, and size along with the existing native defaults for other props. */
export type DescriptionsSemantic = DescriptionsSlots
  | ((info: { props: DescriptionsProps; }) => DescriptionsSlots);
/** Shared Descriptions styling. An explicit nested record replaces the whole parent record. */
export interface DescriptionsConfig {
  class?: string;
  style?: string;
  classNames?: DescriptionsSemantic;
  styles?: DescriptionsSemantic;
}
export interface DescriptionsItem {
  key?: string | number;
  label?: DescriptionsContent;
  children?: DescriptionsContent;
  span?: number | 'filled' | GridResponsive<number>;
  class?: string;
  style?: string;
  classNames?: DescriptionsCellSlots;
  styles?: DescriptionsCellSlots;
}
/** Description table with responsive columns, spans, and semantic cell styles. */
export interface DescriptionsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'title' | 'class' | 'style'
> {
  items?: readonly DescriptionsItem[];
  title?: DescriptionsContent;
  extra?: DescriptionsContent;
  column?: number | GridResponsive<number>;
  /** @defaultValue 'horizontal' */
  layout?: 'horizontal' | 'vertical';
  /** @defaultValue false */
  bordered?: boolean;
  /** @defaultValue true */
  colon?: boolean;
  size?: ComponentSize;
  /** A nonempty local prefix takes precedence. Otherwise uses ConfigProvider.prefixCls. */
  prefixCls?: string;
  classNames?: DescriptionsSemantic;
  /** Root: context semantic → context style → local semantic → local style. */
  styles?: DescriptionsSemantic;
  class?: string;
  rootClassName?: string;
  style?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLDivElement;
}
