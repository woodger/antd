import type { Snippet } from 'svelte';
import type {
  HTMLButtonAttributes,
  HTMLAnchorAttributes,
  MouseEventHandler
} from 'svelte/elements';
import type { ComponentSize } from '../types';
export type ButtonType = 'default' | 'primary' | 'dashed' | 'text' | 'link';
export type ButtonVariant = 'outlined' | 'dashed' | 'solid' | 'filled' | 'text' | 'link';
export type ButtonColor =
  'default'
  | 'primary'
  | 'danger'
  | 'blue'
  | 'purple'
  | 'cyan'
  | 'green'
  | 'magenta'
  | 'pink'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'volcano'
  | 'geekblue'
  | 'lime'
  | 'gold';
export type ButtonShape = 'default' | 'circle' | 'round' | 'square';
export type ButtonContent = string | number | boolean | null | undefined | Snippet;
export type ButtonSlots = Partial<Record<'root' | 'icon' | 'content', string>>;
export type ButtonLoading = boolean | { delay?: number; icon?: ButtonContent; };
/** Ant Design button with native attributes, visual variants, and loading. */
export interface ButtonProps extends Omit<
  HTMLButtonAttributes,
  'type' | 'children' | 'class' | 'color' | 'style' | 'onclick'
> {
  children?: ButtonContent;
  icon?: ButtonContent;
  type?: ButtonType;
  /** Native button type. The type prop sets the Ant Design appearance. */
  htmlType?: 'button' | 'submit' | 'reset';
  color?: ButtonColor;
  variant?: ButtonVariant;
  size?: ComponentSize | 'medium';
  /** true enables loading. delay is in milliseconds, and icon replaces the indicator. */
  loading?: ButtonLoading;
  /** @defaultValue false */
  danger?: boolean;
  /** @defaultValue false */
  block?: boolean;
  /** @defaultValue false */
  ghost?: boolean;
  shape?: ButtonShape;
  /** Icon position relative to the text. */
  iconPlacement?: 'start' | 'end';
  target?: HTMLAnchorAttributes['target'];
  rel?: HTMLAnchorAttributes['rel'];
  download?: HTMLAnchorAttributes['download'];
  hreflang?: string;
  referrerpolicy?: HTMLAnchorAttributes['referrerpolicy'];
  /** Native handler. It takes precedence over the compatibility onClick alias. */
  onclick?: MouseEventHandler<HTMLButtonElement> | null;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  autoFocus?: boolean;
  autoInsertSpace?: boolean;
  /** Semantic slots or a callback receiving styling parameters, with click handlers omitted. */
  classNames?: ButtonSlots | ((info: { props: ButtonSemanticProps; }) => ButtonSlots | undefined);
  styles?: ButtonSlots | ((info: { props: ButtonSemanticProps; }) => ButtonSlots | undefined);
  class?: string;
  rootClassName?: string;
  /** Local class prefix. Inherits ConfigProvider.prefixCls by default. */
  prefixCls?: string;
  style?: HTMLButtonAttributes['style'];
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLButtonElement | HTMLAnchorElement;
  /** Internal FloatButton composition disables reapplying semantic styles. */
  _skipSemantic?: boolean;
  /** FloatButton provides styled content and Badge without another span. */
  _skipContentWrapper?: boolean;
  /** @internal Theme for a composite component, applied after Button tokens and before consumer styles. */
  _themeStyle?: string;
}
/** Button styling parameters for semantic callbacks, excluding click handlers. */
export type ButtonSemanticProps = Omit<ButtonProps, 'onclick' | 'onClick'>;
/** Button parameters with a click event type determined by the presence of href. */
export type ButtonElementProps<Href extends
  string
  | undefined = undefined> = Omit<
    ButtonProps,
    'onclick' | 'onClick'
  > & {
    href?: Href;
    onclick?: MouseEventHandler<Href extends string ? HTMLAnchorElement : HTMLButtonElement> | null;
    onClick?: MouseEventHandler<Href extends string ? HTMLAnchorElement : HTMLButtonElement>;
  };
/** Button variant with a required href and a native link event. */
export interface ButtonLinkProps extends Omit<ButtonProps, 'onclick' | 'onClick'> {
  href: string;
  onclick?: MouseEventHandler<HTMLAnchorElement> | null;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

/** ConfigProvider.button settings. Local Button props and styles take precedence. */
export interface ButtonConfig {
  autoInsertSpace?: boolean;
  color?: ButtonColor;
  variant?: ButtonVariant;
  shape?: ButtonShape;
  loadingIcon?: ButtonContent;
  class?: string;
  style?: string;
  classNames?: ButtonProps['classNames'];
  styles?: ButtonProps['styles'];
}
