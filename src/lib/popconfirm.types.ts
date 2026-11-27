import type { Snippet } from 'svelte';
import type { ButtonContent, ButtonElementProps, ButtonLinkProps, ButtonType } from './button/button.types';
import type {
  PopoverContent,
  PopoverPlacement,
  PopoverSlots,
  PopoverTrigger
} from './popover.types';
import type { AdjustOverflow, TooltipArrow, TooltipColor, TooltipProps } from './tooltip.types';

export interface PopconfirmSlots extends PopoverSlots {
  icon?: string;
}

type Semantic<Props> = PopconfirmSlots | ((info: { props: Props }) => PopconfirmSlots);

/** Title/content refers to the text of the confirmation and the description, the icon - to the wrapper of the icon. */
export type PopconfirmSemantic<
  OkHref extends string | undefined = undefined,
  CancelHref extends string | undefined = undefined
> = Semantic<PopconfirmSemanticProps<OkHref, CancelHref>>;

export interface PopconfirmSemanticProps<
  OkHref extends string | undefined = undefined,
  CancelHref extends string | undefined = undefined
> extends PopconfirmProps<OkHref, CancelHref> {
  /** The owner's input prop; the internal uncontrolled open does not replace it. */
  open?: boolean;
  placement: PopoverPlacement;
  trigger: PopoverTrigger | readonly PopoverTrigger[];
  mouseEnterDelay: number;
  mouseLeaveDelay: number;
  okType: NonNullable<PopconfirmProps['okType']>;
}

interface PopconfirmContextProps extends Omit<
  PopconfirmSemanticProps, 'okButtonProps' | 'cancelButtonProps' | 'classNames' | 'styles'
> {
  okButtonProps?: PopconfirmActionOptions;
  cancelButtonProps?: PopconfirmActionOptions;
  /** Local callbacks are designed for specific props copies. */
  classNames?: Semantic<never>;
  styles?: Semantic<never>;
}

/** Popconfirm's own defaults. Local props take precedence over context. */
export interface PopconfirmConfig {
  class?: string;
  style?: string;
  classNames?: Semantic<PopconfirmContextProps>;
  styles?: Semantic<PopconfirmContextProps>;
  arrow?: TooltipArrow;
  trigger?: PopoverTrigger | readonly PopoverTrigger[];
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
}

type ManagedButtonProp = 'children' | 'htmlType' | 'loading';
type NativeButtonProps = Omit<ButtonElementProps, ManagedButtonProp>;
type LinkButtonProps = Omit<ButtonLinkProps, ManagedButtonProp>;
type DynamicButtonProps = Omit<ButtonElementProps<string | undefined>, ManagedButtonProp>;
export type PopconfirmActionOptions = NativeButtonProps | LinkButtonProps | DynamicButtonProps;

type ButtonVariantProps<Href extends string | undefined> = [Href] extends [undefined]
  ? NativeButtonProps
  : undefined extends Href ? DynamicButtonProps : LinkButtonProps;

/** An explicit href infers the anchor type. A conditional href exposes both DOM types to the handler. */
type PopconfirmButtonProps<Href extends string | undefined> =
  | ({ href: Href } & ButtonVariantProps<Href>)
  | ([Href] extends [undefined] ? NativeButtonProps : never);

/** Confirmation of action with Promise, state of expectation and protection from late result. */
export interface PopconfirmProps<
  OkHref extends string | undefined = undefined,
  CancelHref extends string | undefined = undefined
> {
  children: Snippet;
  /** Forwarded to the outer Popover. The hidden ID follows fresh. */
  id?: string;
  /** Forwarded to the outer Popover. Semantic colors of the confirmation text take precedence. */
  color?: TooltipColor;
  /** Local prefix of confirmation; otherwise ConfigProvider. Prefix Popover is independent. */
  prefixCls?: string;
  /** Forwarded to the outer Popover. Defaults to its prefix plus -open. */
  openClassName?: string;
  title: Exclude<PopoverContent, boolean>;
  description?: Exclude<PopoverContent, boolean> | null;
  /** Decorative content. undefined leaves a standard icon. */
  icon?: ButtonContent;
  /** Maintenances bind:open. */
  open?: boolean | undefined;
  /** @defaultValue false */
  defaultOpen?: boolean;
  /** Removes confirmation content when closed. @defaultValue false */
  destroyOnHidden?: boolean;
  /** Mount hidden confirmation and portal after hydration, including destroyOnHidden. */
  forceRender?: boolean;
  /** Updates hidden content and semantic styles; by default false. */
  fresh?: boolean;
  /** Forwarded to Popover before semantic root styles. */
  zIndex?: number;
  disabled?: boolean;
  /** @defaultValue true */
  showCancel?: boolean;
  /** Button label. null and undefined use the locale dictionary. */
  okText?: ButtonContent;
  /** Button label. null and undefined use the locale dictionary. */
  cancelText?: ButtonContent;
  /** danger sets the palette without a mandatory option. @defaultValue 'primary' */
  okType?: ButtonType | 'danger';
  okButtonProps?: PopconfirmButtonProps<OkHref>;
  cancelButtonProps?: PopconfirmButtonProps<CancelHref>;
  /** @defaultValue 'top' */
  placement?: PopoverPlacement;
  /** Forwarded to Popover as an override for the selected placements entry. */
  align?: TooltipProps['align'];
  /** Replaces the entire placements Popover map, including an empty object. */
  builtinPlacements?: TooltipProps['builtinPlacements'];
  /** Receives external Popover DOM and the final align to the application of new coordinates. */
  onPopupAlign?: TooltipProps['onPopupAlign'];
  /** @defaultValue true */
  arrow?: TooltipArrow;
  /** Local trigger → ConfigProvider.popconfirm → click; [] leaves the software control. */
  trigger?: PopoverTrigger | readonly PopoverTrigger[];
  /** Replacing only opening events; undefined uses trigger, [] disables them. */
  showAction?: readonly PopoverTrigger[];
  /** Replacing trigger/outside- closure; [] preserves Escape and confirmation buttons. */
  hideAction?: readonly PopoverTrigger[];
  /** Delay focus in seconds; default 0 regardless of hover delays. */
  focusDelay?: number;
  /** Delay blur in seconds; default 0 regardless of hover delays. */
  blurDelay?: number;
  /** Hover delays in seconds, by default 0.1. */
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  /** @defaultValue true */
  autoAdjustOverflow?: boolean | AdjustOverflow;
  /** Forwarded to Popover. The local function takes precedence over ConfigProvider. */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  onOpenChange?: (open: boolean) => void;
  /** Is called after the completion of the change in the visibility of external Popover. */
  afterOpenChange?: TooltipProps['afterOpenChange'];
  /** Name CSSMotion external Popover. */
  motion?: TooltipProps['motion'];
  /** Explicit true includes confirmation in the nearest group Tooltip.UniqueProvider. @defaultValue false */
  unique?: TooltipProps['unique'];
  /** Promise holds loading; keeps the possibility of a repeat. */
  onConfirm?: (event: MouseEvent) => void | PromiseLike<unknown>;
  onCancel?: (event: MouseEvent) => void;
  /** Is called when the click surfaces to the root of the panel after the handlers of its contents. */
  onPopupClick?: (event: MouseEvent) => void;
  onError?: (error: unknown) => void;
  class?: string;
  style?: string;
  rootClassName?: string;
  classNames?: PopconfirmSemantic<OkHref, CancelHref>;
  styles?: PopconfirmSemantic<OkHref, CancelHref>;
}
