import type { Snippet } from 'svelte';

export type EmptyContent = string | number | boolean | null | Snippet;
/** default/simple – previous aliases of built-in images; other lines – URL. */
export type EmptyImage = EmptyContent;
export type EmptyDescription = EmptyContent;
export interface EmptySemanticSlots {
  root?: string;
  image?: string;
  description?: string;
  footer?: string;
}
export interface EmptySemanticInfo {
  props: EmptyProps;
}
export type EmptySemantic = EmptySemanticSlots
  | ((info: EmptySemanticInfo) => EmptySemanticSlots | undefined);
export interface EmptyRef {
  readonly nativeElement: HTMLDivElement;
}
export type EmptyConfig = Pick<EmptyProps, 'image' | 'class' | 'style' | 'classNames' | 'styles'>;

/** Empty state with illustration, description and additional action. */
export interface EmptyProps {
  /** @defaultValue 'default' */
  image?: EmptyImage;
  description?: EmptyDescription;
  children?: EmptyContent;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string;
  style?: string;
  /** Local CSS prefix. Omission and an empty string inherit ConfigProvider. */
  prefixCls?: string;
  rootClassName?: string;
  classNames?: EmptySemantic;
  styles?: EmptySemantic;
  /** Assigned after mount and cleaned at unmount. */
  nativeElement?: HTMLDivElement;
  ref?: EmptyRef;
}
