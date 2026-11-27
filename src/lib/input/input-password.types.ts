import type { InputContent, InputProps, InputSemanticSlots, InputVariant } from './input.types';

/** Switch settings; without visible visibility is stored inside the component. */
export interface InputPasswordVisibilityToggle {
  /** By default 0; disabled always eliminates the switch from Tab order. */
  tabIndex?: number;
  /** Controlled visibility. Without updating this field, the user action does not change it. */
  visible?: boolean;
  /** Requests new visibility only after the user's actions. */
  onVisibleChange?: (visible: boolean) => void;
}

/** Returns a scalar or Snippet without arguments; the falsy result leaves an empty button. */
export type InputPasswordIconRender = (visible: boolean) => InputContent | undefined;

/** Callback receives Props with allowed disabled and variants. */
export type InputPasswordSemantic =
  | InputSemanticSlots
  | ((info: { props: InputPasswordProps; }) => InputSemanticSlots | undefined);

/**
 * Settings ConfigProvider.inputPassword. Local Props take precedence; nested inputPassword replaces
 * the object in its entirety. General settings Input are inherited separately.
 */
export interface InputPasswordConfig {
  iconRender?: InputPasswordIconRender;
  variant?: InputVariant;
  class?: string;
  style?: string;
  classNames?: InputPasswordSemantic;
  styles?: InputPasswordSemantic;
}

/**
 * Svelte-export React Input.Password. Saves string bind:value, events and refs Input; type is
 * determined by visibility. bind:this provides focus and selection methods Input.
 */
export interface InputPasswordProps extends Omit<InputProps, 'classNames' | 'styles'> {
  /** CSS prefix Password and toggle icon; empty/undefined inherits ConfigProvider. */
  prefixCls?: string;
  /** Independent CSS prefix nested Input; by default total prefix input. */
  readonly inputPrefixCls?: string;
  /** By default click; hover switches to mouseover, without hiding on mouseleave. */
  action?: 'click' | 'hover';
  /** The default is true. false hides the button while maintaining current visibility and suffix wrapper. */
  visibilityToggle?: boolean | InputPasswordVisibilityToggle;
  /** Local render covers ConfigProvider.inputPassword.iconRender. */
  iconRender?: InputPasswordIconRender;
  /** Priority: variant, Form, inputPassword, input, global variant, */
  variant?: InputVariant;
  classNames?: InputPasswordSemantic;
  /** Root: context styles.root → context style → local styles.root → local style. */
  styles?: InputPasswordSemantic;
}
