import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerTitlePlacement = 'start' | 'end' | 'center' | 'left' | 'right';
export type DividerSize = 'small' | 'medium' | 'large';
export type DividerSemanticSlots = Partial<Record<'root' | 'rail' | 'content', string>>;
export interface DividerSemanticInfo {
  props: DividerProps & {
    orientation: DividerOrientation;
    titlePlacement: 'start' | 'end' | 'center';
    size: DividerSize | undefined;
  };
}

/** Divider with a label, direction, size, and line variants. */
export interface DividerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'class' | 'style'
> {
  /** Local BEM prefix. An empty string inherits the ConfigProvider prefix. */
  prefixCls?: string;
  children?: Snippet | string | number | null | false;
  orientation?: DividerOrientation;
  vertical?: boolean;
  titlePlacement?: DividerTitlePlacement;
  /** @defaultValue false */
  dashed?: boolean;
  /** @defaultValue 'solid' */
  variant?: 'solid' | 'dashed' | 'dotted';
  size?: DividerSize;
  /** @defaultValue false */
  plain?: boolean;
  class?: string;
  rootClassName?: string;
  style?: string;
  classNames?: DividerSemanticSlots
    | ((info: DividerSemanticInfo) => DividerSemanticSlots | undefined);
  styles?: DividerSemanticSlots
    | ((info: DividerSemanticInfo) => DividerSemanticSlots | undefined);
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLDivElement;
}

/**
 * Inherited record. An explicit object, including {}, replaces the parent record.
 * Root style: provider styles.root → provider style → local styles.root → local style.
 * Callbacks receive the same normalized props as local semantic callbacks.
 */
export type DividerConfig = Pick<DividerProps, 'class' | 'style' | 'classNames' | 'styles'>;
