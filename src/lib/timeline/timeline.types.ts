import type { HTMLAttributes } from 'svelte/elements';
import type { StepsDataContent, StepsItemSlots, StepsSemanticSlots } from '../steps/steps-data.engine';
export type TimelineContent = StepsDataContent;
export type TimelinePlacement = 'start' | 'end';
export type TimelineMode = TimelinePlacement | 'alternate';
export type TimelineSlots = Omit<StepsSemanticSlots, 'itemSubtitle'>;
export interface TimelineItem {
  key?: string | number;
  title?: TimelineContent;
  content?: TimelineContent;
  color?: string;
  placement?: TimelinePlacement;
  loading?: boolean;
  icon?: TimelineContent;
  class?: string;
  style?: string;
  classNames?: StepsItemSlots;
  styles?: StepsItemSlots;
}
/** Event tape with loading items, reverse and placement title/content. */
export interface TimelineProps extends Omit<
  HTMLAttributes<HTMLOListElement>,
  'children' | 'class' | 'style'
> {
  /** Local CSS prefix; otherwise ConfigProvider. Steps has an independent prefix. */
  prefixCls?: string;
  items?: readonly TimelineItem[];
  /** @defaultValue 'outlined' */
  variant?: 'filled' | 'outlined';
  mode?: TimelineMode;
  /** @defaultValue 'vertical' */
  orientation?: 'horizontal' | 'vertical';
  titleSpan?: number | string;
  /** @defaultValue false */
  reverse?: boolean;
  classNames?: TimelineSlots | ((info: { props: TimelineProps; }) => TimelineSlots);
  styles?: TimelineSlots | ((info: { props: TimelineProps; }) => TimelineSlots);
  class?: string;
  rootClassName?: string;
  style?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLOListElement;
}

/** General Timeline classes/styles; local and item-specific settings are more priority. */
export type TimelineConfig = Pick<TimelineProps, 'class' | 'style' | 'classNames' | 'styles'>;
