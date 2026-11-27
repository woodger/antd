import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export type ProgressType = 'line' | 'circle' | 'dashboard';
export type ProgressStatus = 'normal' | 'active' | 'exception' | 'success';
export type ProgressCircleSize = 'small' | 'medium' | number
  | [number | string, number];
export type ProgressLineSize = ProgressCircleSize
  | { width?: number | string; height?: number; };
export type ProgressSize = ProgressLineSize;
export type ProgressContent = string | number | Snippet | null | boolean;
export type ProgressGradient = { direction?: string; }
  & (Record<string, string> | { from: string; to: string; });
export interface ProgressSuccess {
  percent?: number;
  strokeColor?: string;
}
export interface PercentPositionType {
  align?: 'start' | 'center' | 'end';
  type?: 'inner' | 'outer';
}
export type ProgressGapPlacement = 'top' | 'bottom' | 'start' | 'end';
export type ProgressSemanticSlots = Partial<Record<
  'root' | 'body' | 'rail' | 'track' | 'indicator', string
>>;
export interface ProgressSemanticInfo {
  props: ProgressProps & {
    type: ProgressType;
    percent: number;
    size: ProgressSize;
    showInfo: boolean;
  };
}

/** General parameters; values, names and finite normalization save native API. */
interface ProgressBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'style'
> {
  /** Local CSS prefix. Omission and an empty string inherit ConfigProvider. */
  prefixCls?: string;
  percent?: number;
  showInfo?: boolean;
  /** The former formatter with one argument is called once; the second is the percentage. */
  format?: (percent: number, successPercent?: number) => ProgressContent;
  railColor?: string;
  gapDegree?: number;
  gapPlacement?: ProgressGapPlacement;
  strokeLinecap?: 'round' | 'butt' | 'square';
  class?: string;
  rootClassName?: string;
  style?: string;
  classNames?: ProgressSemanticSlots
    | ((info: ProgressSemanticInfo) => ProgressSemanticSlots | undefined);
  styles?: ProgressSemanticSlots
    | ((info: ProgressSemanticInfo) => ProgressSemanticSlots | undefined);
  /** Native root after mount; cleared at unmount. */
  nativeElement?: HTMLDivElement;
  /** As an upstream, Progress draws its indicator instead of children. */
  children?: ProgressContent;
}

/** Line/steps and original circle/dashboard with saved finite normalization. */
export type ProgressProps = ProgressBaseProps & (
  | {
    type?: 'line';
    status?: ProgressStatus;
    size?: ProgressLineSize;
    strokeWidth?: never;
    strokeColor?: string | string[] | ProgressGradient;
    success?: ProgressSuccess;
    steps?: number | { count: number; gap: number; };
    rounding?: (step: number) => number;
    percentPosition?: PercentPositionType;
  }
  | {
    type: 'circle' | 'dashboard';
    status?: ProgressStatus;
    size?: ProgressCircleSize;
    strokeWidth?: number;
    strokeColor?: string | string[] | ProgressGradient;
    success?: ProgressSuccess;
    steps?: number | { count: number; gap: number; };
    rounding?: (step: number) => number;
    percentPosition?: PercentPositionType;
  }
);

/** Undefined inherits the record; the explicit object replaces it entirely. */
export type ProgressConfig = Pick<ProgressBaseProps, 'class' | 'style' | 'classNames' | 'styles'>;
