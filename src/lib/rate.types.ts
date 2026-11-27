import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { ComponentSize } from './types';
import type { TooltipProps } from './tooltip.types';

export interface RateCharacterInfo {
  index: number;
  count: number;
  value?: number;
  allowHalf: boolean;
  disabled: boolean;
  focused: boolean;
  prefixCls: string;
  onHover: (event: MouseEvent, index: number) => void;
  onClick: (event: MouseEvent | KeyboardEvent, index: number) => void;
}

/** Styles ConfigProvider.rate; class and component style complement provider settings. */
export interface RateConfig {
  class?: string;
  style?: string;
}

/** Estimation with stars, halves of choice, hover and controlled or local value. */
export interface RateProps extends Omit<
  HTMLAttributes<HTMLUListElement>,
  'children' | 'class' | 'style' | 'onchange'
> {
  /** Local CSS prefix; empty/undefined inherited ConfigProvider. */
  prefixCls?: string;
  /** Managed value; the owner accepts a new choice through onChange. */
  value?: number;
  /** Initial local assessment in the absence of value; default 0. */
  defaultValue?: number;
  /** @defaultValue 5 */
  count?: number;
  /** @defaultValue false */
  allowHalf?: boolean;
  /** @defaultValue true */
  allowClear?: boolean;
  /** @defaultValue true */
  keyboard?: boolean;
  disabled?: boolean;
  size?: ComponentSize | 'medium';
  character?: string | number | Snippet<[RateCharacterInfo]>;
  /** Snippet receives the original character snippet and the context of the current star. */
  characterRender?: Snippet<[Snippet, RateCharacterInfo]>;
  tooltips?: readonly (string | Omit<TooltipProps, 'children'>)[];
  /** @defaultValue false */
  autoFocus?: boolean;
  tabIndex?: number;
  onChange?: (value: number) => void;
  /** Hover-evaluation; undefined means the departure of the pointer with control. */
  onHoverChange?: (value: number | undefined) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  class?: string;
  rootClassName?: string;
  style?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLUListElement;
}
