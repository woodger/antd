import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export type AffixTarget = Window | HTMLElement;
export type AffixUpdatePosition = (() => void) & { cancel: () => void; };
/** Shared styles for the outer node. A nested record is replaced in full. */
export interface AffixConfig {
  class?: string;
  style?: string;
}
/** Pins content to an edge of the selected window or scroll container. */
export interface AffixProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'class' | 'style'
> {
  /** Local CSS prefix for the fixed node. An empty value inherits ConfigProvider. */
  prefixCls?: string;
  children?: Snippet;
  offsetTop?: number;
  offsetBottom?: number;
  target?: () => AffixTarget | null;
  onChange?: (affixed?: boolean) => void;
  class?: string;
  rootClassName?: string;
  style?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLDivElement;
}
export interface AffixPosition {
  edge: 'top' | 'bottom';
  offset: number;
  width: number;
  height: number;
}
