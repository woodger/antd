import type { Snippet } from 'svelte';
import type { HTMLFieldsetAttributes, HTMLInputAttributes } from 'svelte/elements';
import type { ComponentSize } from '../types';

export type RadioValue = string | number | boolean;
export type RadioContent = string | number | null | undefined | Snippet;

export interface RadioSemanticSlots {
  root?: string;
  icon?: string;
  label?: string;
}

/** The function receives actual Svelte checked/disabled/value/name, including the local state. */
export type RadioSemantic = RadioSemanticSlots | ((info: { props: RadioProps; }) => RadioSemanticSlots);

/** Event Ant Design with the original value type; nativeEvent — this DOM change. */
export interface RadioChangeEvent<Value extends RadioValue = RadioValue> {
  target: Omit<RadioProps, 'value'> & { value: Value; checked: boolean; type: 'radio'; };
  nativeEvent: Event;
  stopPropagation(): void;
  preventDefault(): void;
}

/** Ref rc-checkbox: links are cleared at unmount; methods use native input. */
export interface RadioRef {
  input: HTMLInputElement;
  nativeElement: HTMLSpanElement;
  focus(options?: FocusOptions): void;
  blur(): void;
}

/** Native radio with typical value and bind:checked outside RadioGroup. */
export interface RadioProps extends Omit<
  HTMLInputAttributes,
  'type' | 'value' | 'checked' | 'children' | 'class' | 'size'
> {
  /** @defaultValue 'on' */
  value?: RadioValue;
  /** Maintenances bind:checked. */
  checked?: boolean | undefined;
  /** @defaultValue false */
  defaultChecked?: boolean;
  children?: Snippet;
  onCheckedChange?: (checked: boolean) => void;
  /** Is called up to onChange groups; native onchange receives a separate DOM-event. */
  onChange?: (event: RadioChangeEvent) => void;
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
  /** Base prefix without -button; empty/undefined inherit ConfigProvider. */
  prefixCls?: string;
  classNames?: RadioSemantic;
  styles?: RadioSemantic;
  class?: string;
  rootClassName?: string;
  /** Bindable internal span; coincides with ref.nativeElement and purifies at unmount. */
  nativeElement?: HTMLSpanElement;
  /** Bindable native input; coincides with ref.input and is cleared at unmount. */
  inputElement?: HTMLInputElement;
  ref?: RadioRef;
}

/** Radio with button design; uses condition, native input and refs Radio. */
export type RadioButtonProps = RadioProps;

export interface RadioOption<Value extends RadioValue = string> {
  value: Value;
  label: RadioContent;
  disabled?: boolean;
  id?: string;
  title?: string;
  style?: string;
  className?: string;
  required?: boolean;
  onChange?: (event: RadioChangeEvent) => void;
}

/** A single choice of typical value through an independent native radio group. */
export interface RadioGroupProps<Value extends RadioValue = string> extends Omit<
  HTMLFieldsetAttributes,
  'children' | 'class' | 'onchange'
> {
  /** Non-empty options take precedence over children; an empty array leaves a snippet. */
  options?: readonly (Value | RadioOption<Value>)[];
  children?: Snippet;
  /** Maintenances bind:value. */
  value?: Value | undefined;
  /** Initial local value. Later prop changes do not reinitialize state. */
  defaultValue?: Value;
  required?: boolean;
  /** @defaultValue 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /** Alias vertical arrangement; clear orientation has priority. */
  vertical?: boolean;
  /** Button changes the design of Radio; the specified group optionType covers RadioButton. */
  optionType?: 'default' | 'button';
  /** Only appearance; inherit ConfigProvider.componentSize. */
  size?: ComponentSize;
  /** Button mode style, by the default outline. */
  buttonStyle?: 'outline' | 'solid';
  /** By default false; stretches the group and distributes the options evenly. */
  block?: boolean;
  onValueChange?: (value: Value) => void;
  /** Is called only when the value is changed, before onValueChange. */
  onChange?: (event: RadioChangeEvent<Value>) => void;
  /** Receive pop-uppouring focusin/focusout child native input. */
  onFocus?: HTMLFieldsetAttributes['onfocusin'];
  onBlur?: HTMLFieldsetAttributes['onfocusout'];
  onMouseEnter?: HTMLFieldsetAttributes['onmouseenter'];
  onMouseLeave?: HTMLFieldsetAttributes['onmouseleave'];
  /** Basic prefix groups and Radio from options; children choose their prefix separately. */
  prefixCls?: string;
  /** Bindable fieldset; preserves native disabled, validation and form association. */
  nativeElement?: HTMLFieldSetElement;
  class?: string;
  rootClassName?: string;
}

/**
 * Settings of the individual Radio/RadioButton, including variants inside RadioGroup.
 * Root style: config.styles.root, config.style, local styles.root, local style.
 */
export interface RadioConfig {
  class?: string;
  style?: string;
  classNames?: RadioSemantic;
  styles?: RadioSemantic;
}
