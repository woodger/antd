import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { AffixProps } from './affix.types';
export type AnchorContainer = HTMLElement | Window;
export type AnchorContent = string | number | boolean | null | undefined | Snippet;
export type AnchorDirection = 'vertical' | 'horizontal';
export type AnchorSlots = Partial<Record<'root' | 'item' | 'itemTitle' | 'indicator', string>>;
/** Semantic callbacks receive current Props with resolved direction. */
export type AnchorSemantic = AnchorSlots | ((info: { props: AnchorProps; }) => AnchorSlots);
/** Shared Anchor styles. An explicit nested record replaces the parent's record in full. */
export interface AnchorConfig {
  class?: string;
  style?: string;
  classNames?: AnchorSemantic;
  styles?: AnchorSemantic;
}
export interface AnchorItem {
  /** undefined inherits the Anchor prefix. An explicit empty string uses the provider's shared prefix. */
  prefixCls?: string;
  key: string | number;
  href: string;
  title?: AnchorContent;
  target?: string;
  class?: string;
  replace?: boolean;
  targetOffset?: number;
  children?: readonly AnchorItem[];
}
/** Section navigation with scroll tracking, nested items, and Affix. */
export interface AnchorProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'class' | 'style' | 'onchange' | 'onclick'
> {
  /** Local CSS prefix. Empty and undefined values inherit ConfigProvider.prefixCls. */
  prefixCls?: string;
  items?: readonly AnchorItem[];
  offsetTop?: number;
  bounds?: number;
  /** @defaultValue true */
  affix?: boolean | Omit<AffixProps, 'offsetTop' | 'target' | 'children'>;
  /** @defaultValue false */
  showInkInFixed?: boolean;
  getContainer?: () => AnchorContainer;
  getCurrentAnchor?: (activeLink: string) => string;
  onClick?: (event: MouseEvent, link: { title?: AnchorContent; href: string; }) => void;
  onChange?: (activeLink: string) => void;
  targetOffset?: number;
  /** @defaultValue 'vertical' */
  direction?: AnchorDirection;
  replace?: boolean;
  classNames?: AnchorSemantic;
  /** Root: context semantic → context style → local semantic → local style. */
  styles?: AnchorSemantic;
  class?: string;
  rootClassName?: string;
  style?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLDivElement;
}
