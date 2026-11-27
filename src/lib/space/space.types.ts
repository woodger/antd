import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { ComponentSize } from '../types';

export type SpaceOrientation = 'horizontal' | 'vertical';
export type SpaceSize = ComponentSize | 'medium' | number;
export type SpaceContent = string | number | boolean | null | undefined | Snippet;
export interface SpaceItem {
  key: string | number;
  children?: SpaceContent;
}
export type SpaceSlots = Partial<Record<'root' | 'item' | 'separator', string>>;
/** Size/orientation/align allowed; nodes and CSS save native Svelte contracts. */
export interface SpaceSemanticInfo {
  props: SpaceProps;
}
export type SpaceSemantic = SpaceSlots
  | ((info: SpaceSemanticInfo) => SpaceSlots | undefined);
/** Inherited Space settings; clear record completely replaces the parent space. */
export interface SpaceConfig {
  /** Used when local size is absent; componentSize is not involved. */
  size?: SpaceSize | readonly [SpaceSize, SpaceSize];
  class?: string;
  /** Between context styles.root and local styles.root/style. */
  style?: string;
  classNames?: SpaceSemantic;
  styles?: SpaceSemantic;
}
/** Intervals, wrappers and separators between keyed items or one children snippet. */
export interface SpaceProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'class' | 'style'
> {
  /** Local CSS prefix. Empty and undefined values inherit ConfigProvider.prefixCls. */
  prefixCls?: string;
  items?: readonly (SpaceContent | SpaceItem)[];
  children?: Snippet;
  /** Local value → ConfigProvider.space.size → small. */
  size?: SpaceSize | readonly [SpaceSize, SpaceSize];
  orientation?: SpaceOrientation;
  vertical?: boolean;
  align?: 'start' | 'end' | 'center' | 'baseline';
  separator?: SpaceContent;
  wrap?: boolean;
  classNames?: SpaceSemantic;
  styles?: SpaceSemantic;
  class?: string;
  rootClassName?: string;
  style?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLDivElement;
}
