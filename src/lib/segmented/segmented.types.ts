import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { ComponentSize } from '../types';
import type { TooltipProps } from '../tooltip/tooltip.types';

export type SegmentedValue = string | number;
export interface SegmentedOption<Value extends SegmentedValue = SegmentedValue> {
  value: Value;
  /** Next to the icon, an empty string doesn't create a text span; the numerical 0 is displayed. */
  label?: string | number | Snippet;
  icon?: Snippet;
  title?: string;
  'aria-label'?: string;
  disabled?: boolean;
  class?: string;
  tooltip?: string | Omit<TooltipProps, 'children'>;
}
export type SegmentedSemanticSlots = Partial<Record<'root' | 'item' | 'label' | 'icon', string>>;
/** Existing native props: generated name and defaults are saved, the size remains a local prop. */
export interface SegmentedSemanticInfo<Value extends SegmentedValue = SegmentedValue> {
  props: SegmentedProps<Value>;
}
export type SegmentedSemantic<Value extends SegmentedValue = SegmentedValue> = SegmentedSemanticSlots
  | ((info: SegmentedSemanticInfo<Value>) => SegmentedSemanticSlots | undefined);
type SegmentedConfigSemantic = SegmentedSemanticSlots
  | (<Value extends SegmentedValue>(info: SegmentedSemanticInfo<Value>) =>
    SegmentedSemanticSlots | undefined);

/** Inherited design; explicit record completely replaces the parent segmented. */
export interface SegmentedConfig {
  class?: string;
  /** Between context styles.root and local styles.root/style. */
  style?: string;
  /** Callback accepts the same native props as the local semantic callback. */
  classNames?: SegmentedConfigSemantic;
  styles?: SegmentedConfigSemantic;
}
/** Typical selection of one value through native radio in segmented control. */
export interface SegmentedProps<Value extends SegmentedValue = SegmentedValue> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'class' | 'style' | 'onchange'
> {
  options: readonly (Value | SegmentedOption<Value>)[];
  /** Maintenances bind:value. */
  value?: Value;
  /** Initial local value. Later prop changes do not reinitialize state. */
  defaultValue?: Value;
  onChange?: (value: Value) => void;
  /** @defaultValue false */
  disabled?: boolean;
  name?: string;
  /** @defaultValue false */
  block?: boolean;
  size?: ComponentSize | 'medium';
  orientation?: 'horizontal' | 'vertical';
  /** @defaultValue false */
  vertical?: boolean;
  /** @defaultValue 'default' */
  shape?: 'default' | 'round';
  /** Local CSS prefix for root, options and; empty string inherits ConfigProvider. */
  prefixCls?: string;
  class?: string;
  rootClassName?: string;
  style?: string;
  /** Context slots are supplemented with local; callback preserves native props/defaults. */
  classNames?: SegmentedSemantic<Value>;
  styles?: SegmentedSemantic<Value>;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLDivElement;
}
