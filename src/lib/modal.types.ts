import type { Snippet } from 'svelte';
import type { AriaAttributes, AriaRole, HTMLAttributes } from 'svelte/elements';
import type { ButtonElementProps, ButtonType } from './button/button.types';
import type { DrawerFocusableConfig, DrawerMask, DrawerMaskConfig } from './drawer.types';
import type { GridResponsive } from './grid.types';
import type { GetContainer } from './types';

export type ModalContent = string | number | boolean | null | Snippet;
export type ModalMask = DrawerMask;
export type ModalMaskConfig = DrawerMaskConfig;
export type ModalFocusableConfig = DrawerFocusableConfig;
export type ModalWidth = number | string | GridResponsive<number | string>;
export type ModalButtonProps = Omit<ButtonElementProps<string | undefined>, 'nativeElement'>;
export type ModalOkType = ButtonType | 'danger';

export type ModalSemanticName =
  'root' | 'wrapper' | 'mask' | 'container' | 'close' | 'header' | 'title' | 'body' | 'footer';
export type ModalSemanticSlots = Partial<Record<ModalSemanticName, string>>;

/** Map of classes or CSS-declarations and version with current props. */
export type ModalSemantic = ModalSemanticSlots
  | ((info: { props: ModalProps; }) => ModalSemanticSlots | undefined);

/** Attributes of the native shell. The state of modalities and lifecycle belongs to Modal. */
export type ModalWrapProps = Omit<HTMLAttributes<HTMLDialogElement>,
  'children' | 'inert' | 'aria-hidden' | 'aria-modal' | 'oncancel' | 'onclose'>;
export type ModalPartProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

/** Registration and expansion DOM of the usual Modal and confirmations. */
export interface ModalSurfaceProps {
  rootClassName?: string;
  rootStyle?: string;
  wrapClassName?: string;
  /** Inline CSS panels inside the native shell. */
  style?: string;
  classNames?: ModalSemantic;
  /** CSS-declarations of each slot are given by the line. */
  styles?: ModalSemantic;
  wrapProps?: ModalWrapProps;
  bodyProps?: ModalPartProps;
  maskProps?: ModalPartProps;
  /** Receives the default container to wrap or replace it. */
  modalRender?: Snippet<[content: Snippet]>;
}

/** Configured footer buttons with the same actions as with standard drawing. */
export interface ModalFooterButtons {
  OkBtn: Snippet;
  CancelBtn: Snippet;
}

/** The footer can use the built-in group or place buttons individually. */
export type ModalFooter = Snippet<[defaultFooter: Snippet, buttons: ModalFooterButtons]>;

/** Close button settings. Callbacks come from local closable. */
export interface ModalClosableConfig extends AriaAttributes {
  closeIcon?: ModalContent;
  disabled?: boolean;
  role?: AriaRole | null;
  /** The usual Modal causes a colback after onOk or onCancel. */
  onClose?: () => void;
  /** Is called after closing the window in front of its afterClose. */
  afterClose?: () => void;
}

export type ModalClosable = boolean | ModalClosableConfig;

/** Page coordinates to start scaling the panel. */
export interface ModalMousePosition {
  x: number;
  y: number;
}

/** Inherited settings of Modal and contextual confirmations from ConfigProvider. */
export interface ModalConfig {
  mask?: ModalMask;
  focusable?: ModalFocusableConfig;
  centered?: boolean;
  closable?: ModalClosable;
  closeIcon?: ModalContent;
  okButtonProps?: ModalButtonProps;
  cancelButtonProps?: ModalButtonProps;
  infoIcon?: ModalContent;
  successIcon?: ModalContent;
  errorIcon?: ModalContent;
  warningIcon?: ModalContent;
  class?: string;
  style?: string;
  classNames?: ModalSemantic;
  styles?: ModalSemantic;
}

/** Modal native dialog with open and snippets of content/footer. */
export interface ModalProps extends ModalSurfaceProps {
  /** Local prefix Modal and parts; an empty line inherits ConfigProvider. */
  prefixCls?: string;
  /** Maintenances bind:open. */
  open?: boolean;
  /** Obligatory title; scalar or Snippet. Zero remains visible. */
  title?: ModalContent;
  children?: Snippet;
  /** The non-empty explicit name overlaps the automatically linked title. */
  'aria-label'?: string;
  /** Explicit id overlaps the automatically linked title. */
  'aria-labelledby'?: string;
  footer?: ModalFooter | null;
  /** Pixels, CSS-length or breakpoint Grid values. @defaultValue 520 */
  width?: ModalWidth;
  /** Panel Height in pixels or CSS-Length. */
  height?: number | string;
  /** False places the panel from above, true centers. Inherited from ConfigProvider.modal. */
  centered?: boolean;
  /** Numerical layer of dialogue and base for nested popup. */
  zIndex?: number;
  /** @defaultValue true */
  closable?: ModalClosable;
  /** Null and false hide the button if the closable is not explicitly turned on. */
  closeIcon?: ModalContent;
  /** @defaultValue true */
  keyboard?: boolean;
  /** Manages the visible mask, its blurring and closing on the background. */
  mask?: ModalMask;
  focusable?: ModalFocusableConfig;
  /** Block the scrolling page while the dialog is open. @defaultValue true */
  scrollLock?: boolean;
  /** @defaultValue false */
  confirmLoading?: boolean;
  /** Shows Skeleton bodies and hides footer. */
  loading?: boolean;
  /** Specifies the preliminary installation. Without both parameters, lifecycle it is included. */
  forceRender?: boolean;
  /** Removes content after closing. At forceRender = true the content is stored. */
  destroyOnHidden?: boolean;
  /** Name CSS-transition panel. An empty line disables panel movement. */
  transitionName?: string;
  /** Name of independent CSS-transition of the mask. An empty string disables the movement of the mask. */
  maskTransitionName?: string;
  /** Null and undefined use the position of a recent click. */
  mousePosition?: ModalMousePosition | null;
  okText?: ModalContent;
  cancelText?: ModalContent;
  /** @defaultValue 'primary' */
  okType?: ModalOkType;
  okButtonProps?: ModalButtonProps;
  cancelButtonProps?: ModalButtonProps;
  onOk?: () => void;
  onCancel?: () => void;
  /** Called after closure, before afterOpenChange(false). */
  afterClose?: () => void;
  /** Is called after completing the transition to an open or closed panel. */
  afterOpenChange?: (open: boolean) => void;
  /**
   * Undefined inherits ConfigProvider; false leaves DOM in place. Global getter is called out
   * without triggering.
   */
  getContainer?: GetContainer;
  /** Bind:panelRef receives native dialog for the life of the panel. */
  panelRef?: HTMLDialogElement;
  class?: string;
}
