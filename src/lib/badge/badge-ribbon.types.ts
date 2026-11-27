import type { Snippet } from 'svelte';

export type BadgeRibbonPlacement = 'start' | 'end';
export type BadgeRibbonContent = string | number | boolean | null | Snippet;

export interface BadgeRibbonSlots {
  root?: string;
  content?: string;
  indicator?: string;
}

/** CSS is supplied as strings. The callback gets props with resolved placement. */
export type BadgeRibbonSemantic = BadgeRibbonSlots
  | ((info: { props: BadgeRibbonProps; }) => BadgeRibbonSlots | undefined);

/** class and style belong to the ribbon. The semantic root is the content wrapper. */
export interface BadgeRibbonConfig {
  class?: string;
  style?: string;
  classNames?: BadgeRibbonSemantic;
  styles?: BadgeRibbonSemantic;
}

/** Badge.Ribbon 6.6.8. start and end follow text direction. */
export interface BadgeRibbonProps extends BadgeRibbonConfig {
  text?: BadgeRibbonContent;
  children?: BadgeRibbonContent;
  color?: string;
  /** @defaultValue 'end' */
  placement?: BadgeRibbonPlacement;
  rootClassName?: string;
  /** Local DOM prefix. Otherwise inherits ConfigProvider. Markers and the variable namespace are preserved. */
  prefixCls?: string;
  /** bind:nativeElement replaces RibbonRef.nativeElement and is cleared on unmount. */
  nativeElement?: HTMLDivElement;
}
