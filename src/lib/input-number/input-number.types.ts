import type { Snippet } from 'svelte';
import type { HTMLInputAttributes } from 'svelte/elements';
import type { ComponentSize } from '../types';
import type { InputVariant } from '../input/input.types';

export type InputNumberValue = number | string;
export type InputNumberContent = string | number | null | undefined | Snippet;
export interface InputNumberFocusOptions extends FocusOptions {
  cursor?: 'start' | 'end' | 'all';
}

/** Proxy native input; nativeElement refers to the control root, including prefix/suffix. */
export interface InputNumberRef extends HTMLInputElement {
  focus(options?: InputNumberFocusOptions): void;
  nativeElement: HTMLElement;
}

export interface InputNumberStepInfo {
  offset: InputNumberValue;
  type: 'up' | 'down';
  emitter: 'handler' | 'keyboard' | 'wheel';
}

export interface InputNumberSlots {
  root?: string;
  prefix?: string;
  suffix?: string;
  input?: string;
  actions?: string;
  action?: string;
}

export type InputNumberSemantic = InputNumberSlots | ((info: {
  props: InputNumberProps<InputNumberValue>;
}) => InputNumberSlots);

type InputNumberEvent<EventType extends Event> = EventType & {
  currentTarget: EventTarget & HTMLInputElement;
};

/** Number/null by default; stringMode preserves decimal strings without Number conversion. */
export interface InputNumberProps<Value extends InputNumberValue = number> extends Omit<
  HTMLInputAttributes,
  'value' | 'defaultValue' | 'min' | 'max' | 'step' | 'size' | 'class' | 'type'
  | 'children' | 'prefix' | 'style'
> {
  /** Maintains bind:value; function binding allows you to reject changes by the owner. */
  value?: Value | null;
  /** Read when created; native reset restores this value without callbacks. */
  defaultValue?: Value | null;
  /** In stringMode callbacks return string/null; use InputNumberProps<string>. */
  stringMode?: boolean;
  min?: InputNumberValue;
  max?: InputNumberValue;
  step?: InputNumberValue;
  precision?: number;
  decimalSeparator?: string;
  /** Formatter receives string number and source input; precision does not trim input when typing. */
  formatter?: (
    value: InputNumberValue | undefined,
    info: { userTyping: boolean; input: string; }
  ) => string;
  parser?: (value: string | undefined) => InputNumberValue;
  controls?: boolean | { upIcon?: InputNumberContent; downIcon?: InputNumberContent; };
  keyboard?: boolean;
  /** The wheel changes the value only at the field with the focal point; by default false. */
  changeOnWheel?: boolean;
  /** By default true; false preserves a draft at blur, Enter still confirms it. */
  changeOnBlur?: boolean;
  mode?: 'input' | 'spinner';
  size?: ComponentSize | 'medium';
  status?: 'error' | 'warning';
  variant?: InputVariant;
  readOnly?: boolean;
  prefix?: InputNumberContent;
  suffix?: InputNumberContent;
  rootClassName?: string;
  /** CSS prefix control and its parts; empty/undefined inherited ConfigProvider. */
  prefixCls?: string;
  class?: string;
  style?: string;
  classNames?: InputNumberSemantic;
  styles?: InputNumberSemantic;
  type?: HTMLInputAttributes['type'];
  autoFocus?: boolean;
  autoComplete?: HTMLInputAttributes['autocomplete'];
  tabIndex?: number;
  maxLength?: number;
  onValueChange?: (value: Value | null) => void;
  onChange?: (value: Value | null) => void;
  /** Called after onChange with the original input string. */
  onInput?: (text: string) => void;
  onStep?: (value: Value, info: InputNumberStepInfo) => void;
  onPressEnter?: (event: InputNumberEvent<KeyboardEvent>) => void;
  onFocus?: (event: InputNumberEvent<FocusEvent>) => void;
  onBlur?: (event: InputNumberEvent<FocusEvent>) => void;
  onKeyDown?: (event: InputNumberEvent<KeyboardEvent>) => void;
  onKeyUp?: (event: InputNumberEvent<KeyboardEvent>) => void;
  onMouseDown?: (event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement; }) => void;
  onClick?: (event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement; }) => void;
  onMouseUp?: (event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement; }) => void;
  onMouseLeave?: (event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement; }) => void;
  onMouseMove?: (event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement; }) => void;
  onMouseEnter?: (event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement; }) => void;
  onMouseOut?: (event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement; }) => void;
  /** Bindable native input, root control and proxy ref; SSR does not create DOM. */
  inputElement?: HTMLInputElement;
  nativeElement?: HTMLDivElement;
  ref?: InputNumberRef;
}

/** Local semantic styles overlap config; config variant is inherited without local. */
export interface InputNumberConfig {
  class?: string;
  style?: string;
  variant?: InputVariant;
  classNames?: InputNumberSemantic;
  styles?: InputNumberSemantic;
}
