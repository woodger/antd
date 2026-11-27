import type { HTMLInputAttributes } from 'svelte/elements';
import type { SliderTooltipConfig } from '../tooltip/tooltip.types';
import type {
  SliderClassNames,
  SliderMarks,
  SliderRangeConfig,
  SliderRangeProps,
  SliderRef,
  SliderSemanticValue,
  SliderStyles
} from './slider-range.types';

/** A single numerical value with pointer/keyboard interaction and bind:value. */
export interface SliderSingleProps extends Omit<
  HTMLInputAttributes,
  'value'
  | 'defaultValue'
  | 'type'
  | 'min'
  | 'max'
  | 'step'
  | 'size'
  | 'class'
  | 'children'
  | 'readonly'
  | 'disabled'
> {
  /** Maintenances bind:value. */
  value?: number | undefined;
  range?: false;
  ref?: SliderRef;
  nativeElement?: HTMLDivElement;
  /** @defaultValue 0 */
  defaultValue?: number;
  min?: number;
  max?: number;
  /** Null chooses only marks/min/max. */
  step?: number | null;
  marks?: SliderMarks;
  dots?: boolean;
  /** @defaultValue true */
  included?: boolean;
  track?: boolean;
  disabled?: boolean | readonly boolean[] | null;
  /** @defaultValue 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  autoFocus?: boolean;
  /** @defaultValue false */
  reverse?: boolean;
  /** @defaultValue true */
  keyboard?: boolean;
  tooltip?: false | SliderTooltipConfig;
  /** The original callback before update bind:value; onValueChange is called after. */
  onChange?: (value: number) => void;
  onValueChange?: (value: number) => void;
  /** One callback after the completed change; the cancelled interaction is not published. */
  onChangeComplete?: (value: number) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  tabIndex?: number | readonly number[];
  ariaLabelForHandle?: string | readonly string[];
  ariaLabelledByForHandle?: string | readonly string[];
  ariaRequired?: boolean;
  ariaValueTextFormatterForHandle?: ((value: number) => string)
    | readonly ((value: number) => string)[];
  rootClassName?: string;
  /** Local BEM prefix; otherwise ConfigProvider. CSS variables retain Slider space. */
  prefixCls?: string;
  classNames?: SliderSemanticValue<SliderClassNames, SliderSingleProps>;
  styles?: SliderSemanticValue<SliderStyles, SliderSingleProps>;
  dotStyle?: string | ((value: number) => string);
  activeDotStyle?: string | ((value: number) => string);
  class?: string;
}

type SliderRangeExtraKeys = Exclude<keyof SliderRangeProps, keyof SliderSingleProps>;
type SliderRangeExtras<Range> = {
  [Key in SliderRangeExtraKeys]?: Range extends false ? never : SliderRangeProps[Key];
};

type SliderNativeProps = Omit<SliderSingleProps,
  'range' | 'value' | 'defaultValue' | 'onValueChange' | 'onChangeComplete' | 'onChange'
    | 'disabled' | 'step' | 'classNames' | 'styles'
>;
export type SliderValue<Range> = Range extends false ? number : number[] | null;
type SliderChangeValue<Range> = Range extends false ? number : number[];

interface SliderValueProps<Range extends boolean | SliderRangeConfig> extends SliderNativeProps {
  value?: SliderValue<Range>;
  defaultValue?: SliderValue<Range>;
  onValueChange?: (value: SliderChangeValue<Range>) => void;
  onChange?: (value: SliderChangeValue<Range>) => void;
  onChangeComplete?: (value: SliderChangeValue<Range>) => void;
  disabled?: SliderSingleProps['disabled'] | (Range extends false ? never : readonly boolean[]);
  step?: number | null;
  classNames?: SliderSemanticValue<SliderClassNames,
    Range extends false ? SliderSingleProps : SliderRangeProps>;
  styles?: SliderSemanticValue<SliderStyles,
    Range extends false ? SliderSingleProps : SliderRangeProps>;
}

/** Range=true/config selects the array; default generic preserves the previous scalar callbacks. */
export type SliderProps<Range extends boolean | SliderRangeConfig = false> =
  SliderValueProps<Range> & SliderRangeExtras<Range>
    & (Range extends false ? { range?: false; } : { range: Range; });
