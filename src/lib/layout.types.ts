import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { GridBreakpoint } from './grid.types';

/** Native Layout section with additional HTML attributes. */
export interface LayoutSectionProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children' | 'class' | 'style'
> {
  /** Local CSS prefix; the empty string uses prefix of the nearest ConfigProvider. */
  prefixCls?: string;
  children?: Snippet;
  class?: string;
  rootClassName?: string;
  style?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLElement;
}
/** Layout Container; hasSider allows you to clearly specify the structure at SSR. */
export interface LayoutProps extends LayoutSectionProps {
  hasSider?: boolean;
}
/** The total class/style applies only to Layout containers, without its sections and Sider. */
export type LayoutConfig = Pick<LayoutProps, 'class' | 'style'>;

export type LayoutCollapseType = 'clickTrigger' | 'responsive';
export type LayoutSiderSemanticSlots = Partial<Record<'root' | 'body', string>>;
/** Side section Layout with collapse, chopping breakpoint and trigger. */
export interface LayoutSiderProps extends LayoutSectionProps {
  /** Maintenances bind:collapsed. */
  collapsed?: boolean;
  /** @defaultValue false */
  defaultCollapsed?: boolean;
  /** @defaultValue false */
  collapsible?: boolean;
  /** @defaultValue false */
  reverseArrow?: boolean;
  /** @defaultValue 200 */
  width?: number | string;
  /** @defaultValue 80 */
  collapsedWidth?: number | string;
  breakpoint?: GridBreakpoint;
  /** @defaultValue 'dark' */
  theme?: 'light' | 'dark';
  trigger?: Snippet | string | number | null | false;
  zeroWidthTriggerStyle?: string;
  expandLabel?: string;
  collapseLabel?: string;
  onCollapse?: (collapsed: boolean, type: LayoutCollapseType) => void;
  onBreakpoint?: (broken: boolean) => void;
  classNames?:
  LayoutSiderSemanticSlots
  | ((info: { props: LayoutSiderProps; }) => LayoutSiderSemanticSlots);
  styles?:
  LayoutSiderSemanticSlots
  | ((info: { props: LayoutSiderProps; }) => LayoutSiderSemanticSlots);
}
