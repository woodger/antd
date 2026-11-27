import type { Component, Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export type FlexAlign =
  'center'
  | 'start'
  | 'end'
  | 'flex-start'
  | 'flex-end'
  | 'self-start'
  | 'self-end'
  | 'baseline'
  | 'normal'
  | 'stretch';
export type FlexJustify =
  'flex-start'
  | 'flex-end'
  | 'start'
  | 'end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
  | 'stretch'
  | 'normal'
  | 'left'
  | 'right';
export type FlexGap = 'small' | 'medium' | 'large' | string | number;

/**
 * Custom root props. Class, style, dir, and children pass through without a wrapper. For a DOM ref,
 * declare nativeElement with $bindable() and bind it to the root with bind:this. Without
 * forwarding, Flex's nativeElement remains undefined.
 */
export interface FlexRootProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  children?: Snippet;
  nativeElement?: HTMLElement;
}

/** Flex-container with native or Svelte-root and inherited layout settings. */
export interface FlexProps<Props extends object = {}> extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
  | 'class'
  | 'style'
> {
  children?: Snippet;
  orientation?: 'horizontal' | 'vertical';
  /** @defaultValue false */
  vertical?: boolean;
  wrap?: boolean | 'wrap' | 'nowrap' | 'wrap-reverse';
  justify?: FlexJustify;
  align?: FlexAlign;
  flex?: string | number;
  gap?: FlexGap;
  /** Local BEM prefix. An empty string inherits the ConfigProvider prefix. */
  prefixCls?: string;
  /** Native tag or Svelte component receiving props roots. @defaultValue 'div' */
  component?: keyof HTMLElementTagNameMap | Component<Props>;
  class?: HTMLAttributes<HTMLElement>['class'];
  rootClassName?: string;
  style?: string;
  /**
   * The native ref is available after mount and cleared on unmount. A custom component must forward
   * it through a $bindable nativeElement, or the ref is undefined.
   */
  nativeElement?: HTMLElement;
}

/** Full set of props when transferring the custom component with additional parameters. */
export type FlexComponentProps<Props extends object = {}> = FlexProps<Props>
  & Omit<Props, 'class' | 'style' | 'dir' | 'nativeElement'>;

/**
 * Undefined inherits the record, the clear object replaces the parent. Local orientation/vertical
 * and style priority provider vertical/style. Flex and custom gap are used after style; preset gap
 * remains a class.
 */
export type FlexConfig = Pick<FlexProps, 'class' | 'style' | 'vertical'>;
