import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';

export type SwitchSize = 'small' | 'medium';
export type SwitchContent = string | number | null | undefined | Snippet;
export type SwitchEvent = (MouseEvent | KeyboardEvent) & {
  currentTarget: EventTarget & HTMLButtonElement;
};
export type SwitchChangeEventHandler = (checked: boolean, event: SwitchEvent) => void;
export type SwitchClickEventHandler = SwitchChangeEventHandler;

export interface SwitchSemanticSlots {
  root?: string;
  content?: string;
  indicator?: string;
}

export type SwitchSemantic = SwitchSemanticSlots | ((info: {
  props: Omit<SwitchProps, 'size'> & { size?: SwitchSize | 'large'; };
}) => SwitchSemanticSlots);

/** Native Switch button with Svelte bindings, source callbacks and previous form/reset contracts. */
export interface SwitchProps extends Omit<
  HTMLButtonAttributes,
  'type' | 'value' | 'children' | 'class' | 'onchange'
> {
  /** Bindable; a certain checked takes precedence over value. */
  checked?: boolean | undefined;
  /** Bindable alias versed; checked is used in joint transmission. */
  value?: boolean | undefined;
  /** Fixed when created; takes precedence over defaultValue. The default is false. */
  defaultChecked?: boolean;
  defaultValue?: boolean;
  /** Blocks the button and native FormData even with disabled = false. */
  loading?: boolean;
  /** Medium is the usual size; without prop inherited componentSize. */
  size?: SwitchSize;
  checkedChildren?: SwitchContent;
  unCheckedChildren?: SwitchContent;
  onCheckedChange?: (checked: boolean) => void;
  /** Click and ArrowLeft/Right; the repeated arrow also causes a callback as rc-switch. */
  onChange?: SwitchChangeEventHandler;
  /** Receives the following value after onChange; the arrows do not cause it. */
  onClick?: SwitchClickEventHandler;
  onKeyDown?: HTMLButtonAttributes['onkeydown'];
  onFocus?: HTMLButtonAttributes['onfocus'];
  onBlur?: HTMLButtonAttributes['onblur'];
  /** One time causes native focus at mount;case lower autofocus is saved. */
  autoFocus?: boolean;
  tabIndex?: number;
  /** Local prefix. An empty string or undefined inherits ConfigProvider.prefixCls. */
  prefixCls?: string;
  rootClassName?: string;
  classNames?: SwitchSemantic;
  styles?: SwitchSemantic;
  /** Bindable native button; focus/blur is also available via bind:this. */
  nativeElement?: HTMLButtonElement;
  ref?: HTMLButtonElement;
  class?: string;
}

/**
 * Inherited Switch design. Root style: config.styles.root, config.style, local styles.root, local
 * style; content applies to both status labels.
 */
export interface SwitchConfig {
  class?: string;
  style?: string;
  classNames?: SwitchSemantic;
  styles?: SwitchSemantic;
}
