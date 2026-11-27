import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export type SpinSize = 'small' | 'medium' | 'large';
export type SpinContent = string | number | Snippet | null | boolean;
export type SpinSemanticSlots = Partial<Record<
  'root' | 'section' | 'indicator' | 'description' | 'container', string
>>;
export interface SpinSemanticInfo {
  props: SpinProps & { spinning: boolean; fullscreen: boolean; percent?: number; };
}
export interface SpinIndicatorInfo {
  percent?: number;
  prefixCls: string;
  class: string;
  style?: string;
}
/** Passive snippet; previous snippets without arguments are also supported. */
export type SpinIndicator = Snippet<[SpinIndicatorInfo]>;
export interface SpinRef {
  nativeElement: HTMLDivElement;
}

/** Separate, nested or full-screen indicator while saving busy children. */
export interface SpinProps extends Omit<
  HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'style' | 'aria-hidden'
> {
  /** Local CSS prefix. Omission and an empty string inherit ConfigProvider. */
  prefixCls?: string;
  /** @defaultValue true */
  spinning?: boolean;
  /** @defaultValue 0 */
  delay?: number;
  /** Medium keeps the usual size. */
  size?: SpinSize;
  description?: SpinContent;
  indicator?: SpinIndicator | null;
  children?: SpinContent;
  /** Fixed layer in the current DOM branch, without portal or focus trap. */
  fullscreen?: boolean;
  percent?: number | 'auto';
  'aria-hidden'?: boolean;
  class?: string;
  rootClassName?: string;
  style?: string;
  classNames?: SpinSemanticSlots
    | ((info: SpinSemanticInfo) => SpinSemanticSlots | undefined);
  styles?: SpinSemanticSlots
    | ((info: SpinSemanticInfo) => SpinSemanticSlots | undefined);
  nativeElement?: HTMLDivElement;
  ref?: SpinRef;
}

/** An obvious record replaces the parent record; undefined inherits it entirely. */
export type SpinConfig = Pick<SpinProps, 'class' | 'style' | 'indicator' | 'classNames' | 'styles'>;
