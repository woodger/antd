import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { GridResponsive } from './grid/grid.types';

export type AvatarShape = 'circle' | 'square';
/** The map uses the largest matching breakpoint. With no match, CSS defaults apply. */
export type AvatarSize = 'small' | 'medium' | 'large' | number | GridResponsive<number>;

/** Shared Avatar class and style. An explicit record replaces the parent's record in full. */
export interface AvatarConfig {
  class?: string;
  style?: string;
}

/** Avatar with image, icon, and text precedence and a fallback on image load failure. */
export interface AvatarProps extends Omit<
  HTMLAttributes<HTMLSpanElement>, 'children' | 'class' | 'style'
> {
  /** Avatar controls a string. A supplied Snippet keeps its attributes, events, and interactivity. */
  src?: string | Snippet;
  srcSet?: string;
  alt?: string;
  crossOrigin?: '' | 'anonymous' | 'use-credentials';
  draggable?: boolean | 'true' | 'false';
  /** @defaultValue 'circle' */
  shape?: AvatarShape;
  /** Local size takes precedence over context. The responsive map applies after mount. */
  size?: AvatarSize;
  /** @defaultValue 4 */
  gap?: number;
  icon?: Snippet;
  children?: Snippet;
  /** Local component prefix. Omission and the empty string inherit ConfigProvider. */
  prefixCls?: string;
  onError?: () => boolean | void;
  /**
   * Click on the root span. The owner handles keyboard behavior. Explicit onclick takes precedence.
   */
  onClick?: HTMLAttributes<HTMLSpanElement>['onclick'];
  /** Bindable span. Retained across content changes and cleared on unmount. */
  nativeElement?: HTMLSpanElement;
  id?: string;
  title?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** @defaultValue false */
  'aria-hidden'?: boolean;
  class?: string;
  rootClassName?: string;
  style?: string;
  [key: `data-${string}`]: unknown;
}
