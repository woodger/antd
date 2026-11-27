import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { ComponentSize } from './types';
import type { SpaceOrientation, SpaceProps } from './space.types';

export type SpaceCompactSize = ComponentSize | 'medium';
/** Knocks the boundaries and controls gives them a total size through the context of Compact. */
export interface SpaceCompactProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'class' | 'style'
> {
  /** Local CSS prefix; does not change its own prefixes of daughter numbers. */
  prefixCls?: string;
  items?: SpaceProps['items'];
  children?: Snippet;
  size?: SpaceCompactSize;
  orientation?: SpaceOrientation;
  vertical?: boolean;
  /** @defaultValue false */
  block?: boolean;
  class?: string;
  rootClassName?: string;
  style?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLDivElement;
}
/** Native addon for the composition in SpaceCompact. */
export interface SpaceAddonProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'class' | 'style'
> {
  /** Local CSS prefix; namespace of service variables sets the general provider prefix. */
  prefixCls?: string;
  children?: Snippet;
  /** @defaultValue 'outlined' */
  variant?: 'outlined' | 'filled' | 'borderless' | 'underlined';
  disabled?: boolean;
  status?: 'error' | 'warning';
  class?: string;
  style?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLDivElement;
}
