import type { Snippet } from 'svelte';
import type { HTMLInputAttributes } from 'svelte/elements';
import type { SliderTooltipConfig } from '../tooltip/tooltip.types';
import type { SliderSingleProps } from './slider.types';

/** The starting settings of several points; editable takes precedence over draggableTrack. */
export interface SliderRangeConfig {
  editable?: boolean;
  draggableTrack?: boolean;
  minCount?: number;
  maxCount?: number;
}

export type SliderMarkContent = string | number | boolean | null | undefined | Snippet;
export type SliderMarks = Readonly<Record<string | number,
  SliderMarkContent | { label?: SliderMarkContent; style?: string; }
>>;
export type SliderSemanticName = 'root' | 'tracks' | 'track' | 'rail' | 'handle';
export type SliderClassNames = Partial<Record<SliderSemanticName, string>>;
export type SliderStyles = Partial<Record<SliderSemanticName, string>>;
export type SliderSemanticValue<Value, Props = SliderRangeProps> = Value
  | ((info: { props: Props; }) => Value);

/** Common Styles Slider; callbacks distinguish between scalar/range on props.range. */
export interface SliderConfig {
  class?: string;
  style?: string;
  classNames?: SliderSemanticValue<SliderClassNames, SliderSingleProps | SliderRangeProps>;
  styles?: SliderSemanticValue<SliderStyles, SliderSingleProps | SliderRangeProps>;
}

/** Techniques are available after mount; nativeElement indicates Slider root. */
export interface SliderRef {
  readonly nativeElement: HTMLDivElement | undefined;
  focus: () => void;
  blur: () => void;
}

/**
 * Range API Ant Design. Bind:value – Svelte; callbacks receive a sorted copy. Name/form belongs to
 * native range inputs; each included handle sends one field.
 */
export interface SliderRangeProps extends Omit<
  HTMLInputAttributes,
  'value' | 'defaultValue' | 'type' | 'min' | 'max' | 'step' | 'size' | 'class'
    | 'children' | 'readonly' | 'disabled'
> {
  range: true | SliderRangeConfig;
  value?: number[] | null;
  /** Fixed when creating. Undefined creates two points at min, null/[] – empty Slider. */
  defaultValue?: number[] | null;
  min?: number;
  max?: number;
  /** Null aligns the values only to marks/min/max. @defaultValue 1 */
  step?: number | null;
  marks?: SliderMarks;
  dots?: boolean;
  /** @defaultValue true */
  included?: boolean;
  track?: boolean;
  /** @defaultValue true */
  allowCross?: boolean;
  /** True uses step; at step=null, the points are pushed out to the neighboring marks. */
  pushable?: boolean | number;
  /** Anyone shut-off point blocks editable and draggableTrack. */
  disabled?: boolean | readonly boolean[] | null;
  orientation?: 'horizontal' | 'vertical';
  reverse?: boolean;
  keyboard?: boolean;
  autoFocus?: boolean;
  /** Svelte callback after change bind:value. */
  onValueChange?: (value: number[]) => void;
  /** The initial callback; is not called for an unchanged sorted set. */
  onChange?: (value: number[]) => void;
  /** Is also called for actions without changing the value, as in rc-slider. */
  /** Mouse/pointer release, navigation keyup and click; Delete does not terminate. */
  onChangeComplete?: (value: number[]) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  tabIndex?: number | readonly number[];
  ariaLabelForHandle?: string | readonly string[];
  ariaLabelledByForHandle?: string | readonly string[];
  ariaRequired?: boolean;
  ariaValueTextFormatterForHandle?: ((value: number) => string)
    | readonly ((value: number) => string)[];
  tooltip?: false | SliderTooltipConfig;
  prefixCls?: string;
  rootClassName?: string;
  class?: string;
  classNames?: SliderSemanticValue<SliderClassNames>;
  styles?: SliderSemanticValue<SliderStyles>;
  dotStyle?: string | ((value: number) => string);
  activeDotStyle?: string | ((value: number) => string);
  ref?: SliderRef;
  nativeElement?: HTMLDivElement;
}
