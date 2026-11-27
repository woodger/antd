import type { Snippet } from 'svelte';
import type { HTMLInputAttributes } from 'svelte/elements';

export type CheckboxValue = HTMLInputAttributes['value'] | boolean;
export type CheckboxContent = string | number | null | undefined | Snippet;

export interface CheckboxSemanticSlots {
  root?: string;
  icon?: string;
  label?: string;
}

export type CheckboxSemantic = CheckboxSemanticSlots | ((info: {
  props: CheckboxProps;
}) => CheckboxSemanticSlots);

/** Ant Design event. checked and value retain their types, and nativeEvent is the DOM change event. */
export interface CheckboxChangeEvent {
  target: Omit<CheckboxProps, 'value'> & {
    value: CheckboxValue;
    checked: boolean;
    type: 'checkbox';
  };
  nativeEvent: Event;
  stopPropagation(): void;
  preventDefault(): void;
}

/** Native refs are cleared on unmount. focus and blur use the actual input. */
export interface CheckboxRef {
  input: HTMLInputElement;
  nativeElement: HTMLSpanElement;
  focus(options?: FocusOptions): void;
  blur(): void;
}

/** Native checkbox with bind:checked and indeterminate support and CheckboxGroup participation. */
export interface CheckboxProps extends Omit<
  HTMLInputAttributes,
  'type' | 'checked' | 'indeterminate' | 'children' | 'class' | 'size' | 'value'
> {
  /** Supports bind:checked outside CheckboxGroup. */
  checked?: boolean;
  /** Read at creation. Defaults to false and follows native reset without callbacks. */
  defaultChecked?: boolean;
  /** Bindable mixed state. User toggles reset it, matching the existing API. */
  indeterminate?: boolean;
  value?: CheckboxValue;
  children?: Snippet;
  /** Excludes the value from the group. An outer fieldset's disabled state still applies. */
  skipGroup?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Invoked before Group.onChange. Native onchange receives a separate DOM event. */
  onChange?: (event: CheckboxChangeEvent) => void;
  onClick?: HTMLInputAttributes['onclick'];
  onFocus?: HTMLInputAttributes['onfocus'];
  onBlur?: HTMLInputAttributes['onblur'];
  onKeyDown?: HTMLInputAttributes['onkeydown'];
  onKeyPress?: HTMLInputAttributes['onkeypress'];
  onMouseEnter?: (event: MouseEvent & { currentTarget: EventTarget & HTMLLabelElement; }) => void;
  onMouseLeave?: (event: MouseEvent & { currentTarget: EventTarget & HTMLLabelElement; }) => void;
  /** Focuses once on mount. Lowercase autofocus retains native HTML behavior. */
  autoFocus?: boolean;
  tabIndex?: number;
  /** Local prefix. An empty string or undefined inherits ConfigProvider.prefixCls. */
  prefixCls?: string;
  classNames?: CheckboxSemantic;
  styles?: CheckboxSemantic;
  class?: string;
  rootClassName?: string;
  /** Bindable inner span, matching ref.nativeElement. */
  nativeElement?: HTMLSpanElement;
  /** Bindable native input, matching ref.input. */
  inputElement?: HTMLInputElement;
  ref?: CheckboxRef;
}

/**
 * Settings for individual checkboxes, including CheckboxGroup options. Root style order:
 * config.styles.root, config.style, local styles.root, local style.
 */
export interface CheckboxConfig {
  class?: string;
  style?: string;
  classNames?: CheckboxSemantic;
  styles?: CheckboxSemantic;
}
