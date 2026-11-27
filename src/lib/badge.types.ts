import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { TagPresetColor } from './tag.types';

export type BadgeStatus = 'success' | 'processing' | 'default' | 'error' | 'warning';
export type BadgeColor = TagPresetColor | (string & {});
/** Regular or small count. */
export type BadgeSize = 'medium' | 'small';
export type BadgeText = string | number | boolean | null | Snippet;
export type BadgeOffset = readonly [number | string, number | string];
/** Attributes for the upstream custom count. The Snippet applies them to its own root. */
export interface BadgeCountContext {
  class: string;
  style: string | undefined;
}

export type BadgeCount = number | string | boolean | null | Snippet<[BadgeCountContext]>;

export interface BadgeContext {
  /** Existing numeric contract. Strings and Snippets are not converted to numbers. */
  count: number | undefined;
  descriptionId: string | undefined;
}

export interface BadgeSlots {
  root?: string;
  indicator?: string;
}

/** CSS is supplied as strings. The callback gets props with resolved defaults. */
export type BadgeSemantic = BadgeSlots
  | ((info: { props: BadgeProps; }) => BadgeSlots | undefined);

export interface BadgeConfig {
  class?: string;
  style?: string;
  classNames?: BadgeSemantic;
  styles?: BadgeSemantic;
}

/** Count or status beside child content. Numeric value and displayed text are distinct. */
export interface BadgeProps extends Omit<
  HTMLAttributes<HTMLSpanElement>, 'children' | 'class' | 'style' | 'title' | 'color'
>, BadgeConfig {
  /** The Snippet receives class and style in place of React.cloneElement. Its own attributes take precedence. */
  count?: BadgeCount;
  /** @defaultValue 99 */
  overflowCount?: number;
  /** @defaultValue false */
  showZero?: boolean;
  /** @defaultValue false */
  dot?: boolean;
  status?: BadgeStatus;
  color?: BadgeColor;
  text?: BadgeText;
  /** @defaultValue 'medium' */
  size?: BadgeSize;
  /** X is parsed with parseFloat. A string Y retains its CSS units. */
  offset?: BadgeOffset;
  title?: string | false | null;
  children?: Snippet<[BadgeContext]>;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string;
  style?: string;
  rootClassName?: string;
  /** Local Badge prefix. Otherwise inherits ConfigProvider. CSS comes from the pinned template. */
  prefixCls?: string;
  /** Local ScrollNumber and digit classes. Otherwise inherits ConfigProvider. CSS follows the shared prefix. */
  scrollNumberPrefixCls?: string;
  /** Native onclick takes precedence over the React-compatible alias. */
  onClick?: HTMLAttributes<HTMLSpanElement>['onclick'];
  /** bind:nativeElement replaces the React ref and is cleared on unmount. */
  nativeElement?: HTMLSpanElement;
}
