import type { Snippet } from 'svelte';
import type { HTMLInputAttributes } from 'svelte/elements';
import type { ComponentSize, Variant } from '../types';
import type { InputAllowClear, InputCountConfig, InputShowCount } from './input-count.types';

export type {
  InputAllowClear,
  InputCountConfig,
  InputCountInfo,
  InputCountFormatter,
  InputCountContent
} from './input-count.types';

export type InputVariant = Variant;
export type InputContent = string | number | boolean | null | Snippet;
export type InputSemanticSlots = Partial<
  Record<'root' | 'input' | 'prefix' | 'suffix' | 'clear' | 'count', string>
>;

/** Callback receives Props with permitted size and disabled size; root is an external wrapper. */
export type InputSemantic =
  | InputSemanticSlots
  | ((info: { props: InputProps; }) => InputSemanticSlots | undefined);

/**
 * Adaptation DOM Event for onChange. target and currentTarget — a copy of input with the value at
 * the time of the call; nativeEvent is the original event. For input type is replaced with change;
 * clearing preserves click. The methods of the event work with the original DOM Event.
 */
export type InputChangeEvent = Event & {
  target: HTMLInputElement;
  currentTarget: HTMLInputElement;
  readonly nativeEvent: Event;
};

/**
 * General settings ConfigProvider.input. Local Props take precedency; nested ConfigProvider with
 * input replaces this object entirely.
 */
export interface InputConfig {
  allowClear?: boolean | InputAllowClear;
  autoComplete?: HTMLInputAttributes['autocomplete'];
  variant?: InputVariant;
  class?: string;
  style?: string;
  classNames?: InputSemantic;
  styles?: InputSemantic;
}

/** Input with bind:value, native HTML attributes and compatible callbacks Ant Design. */
export interface InputProps extends Omit<
  HTMLInputAttributes,
  'value' | 'defaultValue' | 'children' | 'size' | 'class' | 'prefix'
> {
  /** Maintenances bind:value. The external value is not trimmed through count.exceedFormatter. */
  value?: string;
  /** Initial value in missing value; subsequent changes do not apply. */
  defaultValue?: string;
  /** Priority: local size, SpaceCompact, ConfigProvider.componentSize. */
  size?: ComponentSize | 'medium';
  /** Native attribute size; the visual size is set through size. */
  htmlSize?: number;
  status?: 'error' | 'warning' | '';
  /** Priority: variant, Form, component config, global variant, */
  variant?: InputVariant;
  prefix?: InputContent;
  /** Basic CSS prefix; empty/undefined inherited ConfigProvider.prefixCls. */
  prefixCls?: string;
  suffix?: InputContent;
  /** false disables clearing; otherwise the missing fields are inherited from ConfigProvider.input. */
  allowClear?: boolean | InputAllowClear;
  /** The default is hidden; count.show takes priority. */
  showCount?: InputShowCount;
  count?: InputCountConfig;
  /** Rigid native maxlength; also the maximum counter, if count.max is not specified. */
  maxLength?: number;
  readOnly?: boolean;
  autoComplete?: HTMLInputAttributes['autocomplete'];
  autoFocus?: boolean;
  class?: string;
  rootClassName?: string;
  classNames?: InputSemantic;
  /** Inline CSS on semantic slots; local styles go after settings ConfigProvider.input. */
  styles?: InputSemantic;
  /** bind:inputElement returns native input. */
  inputElement?: HTMLInputElement;
  /** bind:nativeElement returns external root: input or span at affixes. */
  nativeElement?: HTMLElement;
  /** Is called when entering and clearing before onChange; bind:value has been updated to this point. */
  onValueChange?: (value: string) => void;
  /** Adapted input/clearing event. Native oninput and onchange are saved separately. */
  onChange?: (event: InputChangeEvent) => void;
  /** Is called after onValueChange and onChange when clearing with a button. */
  onClear?: () => void;
  /** One call on Enter before keyup/blur/disabled; composing Enter is skipped. */
  onPressEnter?: HTMLInputAttributes['onkeydown'];
  onFocus?: HTMLInputAttributes['onfocus'];
  onBlur?: HTMLInputAttributes['onblur'];
  onKeyDown?: HTMLInputAttributes['onkeydown'];
  onKeyUp?: HTMLInputAttributes['onkeyup'];
  onCompositionStart?: HTMLInputAttributes['oncompositionstart'];
  onCompositionEnd?: HTMLInputAttributes['oncompositionend'];
  [key: `data-${string}`]: string | undefined;
}
