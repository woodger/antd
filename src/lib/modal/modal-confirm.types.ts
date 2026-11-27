import type { createModal } from './modal.model.svelte.js';
import type { ModalContent, ModalFocusableConfig, ModalProps, ModalSurfaceProps } from './modal.types';

export type ModalConfirmType = 'info' | 'success' | 'error' | 'warning' | 'confirm';
/** Callback with an argument close manually manages closure; Promise includes loading. */
export type ModalConfirmAction = (close: () => void) => unknown;

/** Manages the focus of standard footer buttons when opening and after update. */
export interface ModalConfirmFocusableConfig extends ModalFocusableConfig {
  /** Null disables the explicit autofocus of both buttons. @defaultValue 'ok' */
  autoFocusButton?: 'ok' | 'cancel' | null;
}

/** Context confirmation of createModal, displayed by a single ModalHolder. */
export interface ModalConfirmConfig extends ModalSurfaceProps {
  /** Local namespace confirmations; empty string inherits ConfigProvider holder. */
  prefixCls?: string;
  /** Local direction of confirmation. Undefined inherits the provider. */
  direction?: 'ltr' | 'rtl';
  /** The initial type sets the called method. Update can change the option. */
  type?: ModalConfirmType;
  title?: ModalContent;
  content?: ModalContent;
  /** Undefined selects icon ConfigProvider by confirmation type. */
  icon?: ModalContent;
  /** @defaultValue 416 */
  width?: number | string;
  height?: ModalProps['height'];
  centered?: ModalProps['centered'];
  /** The default is zIndexPopupBase + 1000. Descendants inherit this layer. */
  zIndex?: ModalProps['zIndex'];
  /** Only confirm shows Cancel by default. */
  okCancel?: boolean;
  okText?: ModalContent;
  cancelText?: ModalContent;
  okType?: ModalProps['okType'];
  okButtonProps?: ModalProps['okButtonProps'];
  cancelButtonProps?: ModalProps['cancelButtonProps'];
  /** @defaultValue false */
  closable?: ModalProps['closable'];
  closeIcon?: ModalProps['closeIcon'];
  /** @defaultValue true */
  keyboard?: boolean;
  /** By default, closing on the background is prohibited. */
  mask?: ModalProps['mask'];
  focusable?: ModalConfirmFocusableConfig;
  scrollLock?: ModalProps['scrollLock'];
  forceRender?: ModalProps['forceRender'];
  destroyOnHidden?: ModalProps['destroyOnHidden'];
  transitionName?: ModalProps['transitionName'];
  maskTransitionName?: ModalProps['maskTransitionName'];
  mousePosition?: ModalProps['mousePosition'];
  getContainer?: ModalProps['getContainer'];
  /** Receives a native dialog. Undefined releases the link and the previous handler. */
  panelRef?: (node: HTMLDialogElement | undefined) => void;
  class?: string;
  footer?: ModalProps['footer'];
  onOk?: ModalConfirmAction;
  onCancel?: ModalConfirmAction;
  afterClose?: () => void;
  afterOpenChange?: ModalProps['afterOpenChange'];
}

export interface ModalConfirmHandle extends PromiseLike<boolean> {
  /** Closes without onCancel; await concludes with false. */
  destroy(): void;
  update(
    patch: Partial<ModalConfirmConfig>
      | ((previous: Readonly<ModalConfirmConfig>) => Partial<ModalConfirmConfig>)
  ): void;
}

export type ModalInstance = ReturnType<typeof createModal>;

export interface ModalHolderProps {
  modal: ModalInstance;
}

export interface ModalStaticConfig extends ModalConfirmConfig {
  /** When you call, the window opens. The Update can hide and reshow it. */
  open?: boolean;
}

export interface ModalStaticHandle {
  /** Closes and frees a separate root of the window. */
  destroy(): void;
  /** The object complements the configuration, the function returns its new version entirely. */
  update(
    config: ModalStaticConfig
      | ((previous: Readonly<ModalStaticConfig & { close: () => void; }>) => ModalStaticConfig)
  ): void;
}

export interface ModalConfirmation {
  readonly id: number;
  readonly type?: ModalConfirmType;
  readonly config: Readonly<ModalConfirmConfig>;
  readonly open: boolean;
  readonly pendingOk: boolean;
  readonly pendingCancel: boolean;
}

/** Owner operations invoked by the shared confirmation panel. */
export interface ModalConfirmationRuntime {
  mounted(id: number, panel?: HTMLDialogElement): void;
  act(id: number, confirmed: boolean): boolean;
  dismiss(id: number): void;
  complete(id: number, notifyVisibility?: boolean): void;
}
