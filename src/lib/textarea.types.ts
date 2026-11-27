import type {
  InputCountFormatter as TextAreaCountFormatter,
  InputCountConfig as TextAreaCountConfig,
  InputAllowClear as TextAreaAllowClear
} from './input-count.types';
import type { HTMLTextareaAttributes } from 'svelte/elements';
import type { ComponentSize } from './types';

export type TextAreaVariant = 'outlined' | 'filled' | 'borderless' | 'underlined';
export type {
  InputCountInfo as TextAreaCountInfo,
  InputCountContent as TextAreaCountContent,
  InputCountFormatter as TextAreaCountFormatter,
  InputCountConfig as TextAreaCountConfig,
  InputAllowClear as TextAreaAllowClear
} from './input-count.types';
export type TextAreaSemanticSlots = Partial<Record<
  'root'
  | 'textarea'
  | 'clear'
  | 'count',
  string
>>;
export type TextAreaSemantic =
  TextAreaSemanticSlots
  | ((info: { props: TextAreaProps; }) => TextAreaSemanticSlots | undefined);
export type TextAreaChangeEvent = Event & {
  target: HTMLTextAreaElement;
  currentTarget: HTMLTextAreaElement;
  readonly nativeEvent: Event;
};
/**
 * Settings ConfigProvider.textArea; local props take precedence, nested config is replaced
 * entirely.
 */
export interface TextAreaConfig {
  allowClear?: boolean | TextAreaAllowClear;
  autoComplete?: HTMLTextareaAttributes['autocomplete'];
  variant?: TextAreaVariant;
  class?: string;
  style?: string;
  classNames?: TextAreaSemantic;
  styles?: TextAreaSemantic;
}

/** Multi-string native control from bind:value, autoSize, clear/count and FormItem. */
export interface TextAreaProps extends Omit<
  HTMLTextareaAttributes,
  'value' | 'defaultValue' | 'children' | 'class'
> {
  /** Maintenances bind:value. */
  value?: string;
  /** Initial local value. Later prop changes do not reinitialize state. */
  defaultValue?: string;
  size?: ComponentSize | 'medium';
  status?: 'error' | 'warning' | '';
  /** Priority: variant, Form, textArea config, global variant, */
  variant?: TextAreaVariant;
  /** Measures the contents or placeholder; minRows/maxRows limits the height. */
  autoSize?: boolean | { minRows?: number; maxRows?: number; };
  allowClear?: boolean | TextAreaAllowClear;
  showCount?: boolean | { formatter: TextAreaCountFormatter; };
  /** General with Input rules soft max, strategy and opt-in exceedFormatter. */
  count?: TextAreaCountConfig;
  maxLength?: number;
  readOnly?: boolean;
  autoComplete?: HTMLTextareaAttributes['autocomplete'];
  autoFocus?: boolean;
  classNames?: TextAreaSemantic;
  styles?: TextAreaSemantic;
  rootClassName?: string;
  /** Total from Input basic CSS prefix; empty/undefined inherits ConfigProvider. */
  prefixCls?: string;
  /** Is called before onChange and native oninput when entering or clearing. */
  onValueChange?: (value: string) => void;
  /** A stable copy of target/currentTarget, nativeEvent contains the original DOM Event. */
  onChange?: (event: TextAreaChangeEvent) => void;
  onClear?: () => void;
  onResize?: (size: { width: number; height: number; }) => void;
  onFocus?: HTMLTextareaAttributes['onfocus'];
  onBlur?: HTMLTextareaAttributes['onblur'];
  onKeyDown?: HTMLTextareaAttributes['onkeydown'];
  onMouseDown?: HTMLTextareaAttributes['onmousedown'];
  onCompositionStart?: HTMLTextareaAttributes['oncompositionstart'];
  onCompositionEnd?: HTMLTextareaAttributes['oncompositionend'];
  onPressEnter?: HTMLTextareaAttributes['onkeydown'];
  /** bind:nativeElement preserves real textarea, even if there's a wrapper. */
  nativeElement?: HTMLTextAreaElement;
  /** bind:rootElement gives an external textarea/span after mount. */
  rootElement?: HTMLElement;
  class?: string;
}
