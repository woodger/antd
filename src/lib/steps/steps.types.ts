import type { HTMLAttributes } from 'svelte/elements';
import type { StepsDataItem, StepsSemanticSlots } from './steps-data.engine';
import type { StepsType, StepsIconRender } from './steps-expanded.types';
import type { Snippet } from 'svelte';

export type StepsStatus = 'wait' | 'process' | 'finish' | 'error';
export type StepsOrientation = 'horizontal' | 'vertical';
export type StepsSize = 'medium' | 'small';
export type StepsContent = string | Snippet;

export interface StepsItem {
  key: string;
  title: StepsContent;
  subTitle?: StepsContent;
  content?: StepsContent;
  icon?: Snippet;
  status?: StepsStatus;
  disabled?: boolean;
}

/** Managed steps with current items, statuses and accommodation options. */
export interface StepsProps extends Omit<
  HTMLAttributes<HTMLOListElement>,
  'children' | 'class' | 'style' | 'onchange'
> {
  /** Local CSS prefix; otherwise ConfigProvider. Ids and namespace tokens are saved. */
  prefixCls?: string;
  items?: readonly (StepsItem | StepsDataItem | false | null | undefined)[];
  /** @defaultValue 0 */
  initial?: number;
  /** @defaultValue 'filled' */
  variant?: 'filled' | 'outlined';
  type?: StepsType;
  titlePlacement?: StepsOrientation;
  percent?: number;
  maxCount?: number;
  ellipsis?: boolean;
  /** @defaultValue 0 */
  offset?: number;
  iconRender?: StepsIconRender;
  classNames?: StepsSemanticSlots | ((info: { props: StepsProps; }) => StepsSemanticSlots);
  styles?: StepsSemanticSlots | ((info: { props: StepsProps; }) => StepsSemanticSlots);
  rootClassName?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLOListElement;
  /** @defaultValue 0 */
  current?: number;
  /** @defaultValue 'process' */
  status?: StepsStatus;
  onChange?: (current: number) => void;
  orientation?: StepsOrientation;
  size?: StepsSize;
  /** @defaultValue true */
  responsive?: boolean;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string;
  style?: string;
}

/** General classes/styles; Timeline inherits only class/style as internal Steps in source. */
export type StepsConfig = Pick<StepsProps, 'class' | 'style' | 'classNames' | 'styles'>;
