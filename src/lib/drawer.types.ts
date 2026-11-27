import type { Snippet } from 'svelte';
import type { AriaAttributes, HTMLAttributes } from 'svelte/elements';
import type { GetContainer, RenderEmptyContent } from './types';
import type { CssMotionName } from './css-motion.engine';
import type { CssMotionConfig, CssMotionEvent, CssMotionStyle } from './css-motion.types';

export type DrawerPlacement = 'top' | 'right' | 'bottom' | 'left';
export type DrawerSize = 'default' | 'large' | number | (string & {});

export type DrawerMotionName = CssMotionName;
export type DrawerMotionEvent = CssMotionEvent;
export type DrawerMotionStyle = CssMotionStyle;

/** CSS-phases Drawer. The handlers get a panel section or a mask itself. */
export interface DrawerMotionConfig extends CssMotionConfig<HTMLDivElement> {
  /** For maskMotion prepares a hidden node at the mounted Drawer. */
  forceRender?: boolean;
  /** For maskMotion determines the removal of the node after hiding. @defaultValue true */
  removeOnLeave?: boolean;
  /** For maskMotion makes the remaining node after hiding. */
  leavedClassName?: string;
}

export interface DrawerMaskConfig {
  enabled?: boolean;
  blur?: boolean;
  closable?: boolean;
}

export type DrawerMask = boolean | DrawerMaskConfig;

export interface DrawerFocusableConfig {
  /** Keeps the focus in the open panel. By default it acts when the mask is included. */
  trap?: boolean;
  /** Restores focus to the original element after closing. @defaultValue true */
  focusTriggerAfterClose?: boolean;
}

export type DrawerContent = Exclude<RenderEmptyContent, undefined>;
export type DrawerCloseIcon = DrawerContent;

/** Closing button and its available name. The Party shall take into account the direction of the text. */
export interface DrawerClosableConfig extends AriaAttributes {
  closeIcon?: DrawerCloseIcon;
  disabled?: boolean;
  placement?: 'start' | 'end';
  role?: HTMLAttributes<HTMLButtonElement>['role'];
}

export type DrawerClosable = boolean | DrawerClosableConfig;

export interface DrawerSemanticSlots {
  root?: string;
  mask?: string;
  wrapper?: string;
  section?: string;
  header?: string;
  title?: string;
  extra?: string;
  body?: string;
  footer?: string;
  dragger?: string;
  close?: string;
}

export type DrawerSemantic = DrawerSemanticSlots
  | ((info: { props: DrawerProps; }) => DrawerSemanticSlots | undefined);

/** Drawer panel, mask, and focus settings supplied through ConfigProvider. */
export interface DrawerConfig extends Pick<
  DrawerProps, 'classNames' | 'styles' | 'closable' | 'closeIcon' | 'mask' | 'focusable'
> {
  /** Additional class of the section inside the shell Drawer. */
  class?: string;
  /** Inline CSS sections, redefined through styles.section. */
  style?: string;
}

export interface DrawerResizableConfig {
  /** Current size in pixels when capturing the panel boundary. */
  onResizeStart?: (size: number) => void;
  /** Suggested size. With a given size, it can be accepted by the owner. */
  onResize?: (size: number) => void;
  /** The actual size of the panel in the pixels when the pointer is released. */
  onResizeEnd?: (size: number) => void;
}

export interface DrawerPushConfig {
  /** Displacement of the panel in pixels. Disadvantage of the parent record Drawer is inherited. */
  distance?: number | string;
}

type DrawerPanelEvents = Pick<
  HTMLAttributes<HTMLDivElement>,
  'onclick' | 'onmouseenter' | 'onmouseover' | 'onmouseleave' | 'onkeydown' | 'onkeyup' | 'onfocusin'
>;

/** Sliding drawer with controlled open state, focus, and child lifecycle. */
export interface DrawerProps extends AriaAttributes, DrawerPanelEvents {
  /** Local CSS-prefix Drawer and parts thereof; empty line inherits ConfigProvider. */
  prefixCls?: string;
  /** Maintenances bind:open. */
  open?: boolean;
  title?: DrawerContent;
  children?: Snippet;
  extra?: DrawerContent;
  footer?: DrawerContent;
  /** Replacing the panel body with the animated Skeleton until the children are ready. */
  loading?: boolean;
  /** Receives a section with a header, body and basement for wrapping or replacement. */
  drawerRender?: Snippet<[section: Snippet]>;
  /** Bind:panelRef receives the section after mount and is cleaned when it is removed. */
  panelRef?: HTMLDivElement;
  /** @defaultValue 'right' */
  placement?: DrawerPlacement;
  /** @defaultValue 'default' */
  size?: DrawerSize;
  /** Size without a given size and until the first size change. @defaultValue 378 */
  defaultSize?: DrawerSize;
  /** The maximum size offered when dragging. */
  maxSize?: number;
  /** Showing the boundary to change the size on the placement axis. */
  resizable?: boolean | DrawerResizableConfig;
  /** Displacement at the opening of the invested Drawer. @defaultValue { distance: 180 } */
  push?: boolean | DrawerPushConfig;
  /** Numerical panel layer and base for nested popups. */
  zIndex?: number;
  /** @defaultValue true */
  closable?: DrawerClosable;
  /** False and null hide the button without explicit closable. */
  closeIcon?: DrawerCloseIcon;
  /** @defaultValue true */
  keyboard?: boolean;
  /** Mask, blush and closing with a full press on the background. @defaultValue true */
  mask?: DrawerMask;
  /** Additional mask class together with classNames.mask. */
  maskClassName?: string;
  focusable?: DrawerFocusableConfig;
  /** Moves focus into the panel when it opens. @defaultValue true */
  autoFocus?: boolean;
  /** @defaultValue false */
  forceRender?: boolean;
  /** @defaultValue false */
  destroyOnHidden?: boolean;
  /**
   * Undefined inherits ConfigProvider; false leaves DOM in place. Global getter gets document.body.
   */
  getContainer?: GetContainer;
  onClose?: (event: Event) => void;
  /** Upon completion of the visibility animation, before removing the hidden content. */
  afterOpenChange?: (open: boolean) => void;
  /** Replaces the panel's built-in transition. The factory receives the current placement. */
  motion?: DrawerMotionConfig | ((placement: DrawerPlacement) => DrawerMotionConfig);
  /** Independent CSS-transition of the mask. */
  maskMotion?: DrawerMotionConfig;
  id?: string;
  /** Briefly available description of the dialogue. */
  'aria-description'?: string | null;
  /** Role of native dialog. */
  role?: HTMLAttributes<HTMLDialogElement>['role'];
  /** Attributes of the retractable shell of the panel. */
  [attribute: `data-${string}`]: string | number | boolean | null | undefined;
  /** Root dialog class. For the section, use classNames.section. */
  class?: string;
  /** Inline CSS root dialog. For the section, use styles.section. */
  style?: string;
  rootClassName?: string;
  /** Extra layer inline CSS on top of styles.root and style. */
  rootStyle?: string;
  classNames?: DrawerSemantic;
  /** Each slot accepts string CSS declarations. */
  styles?: DrawerSemantic;
}
