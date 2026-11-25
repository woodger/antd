import type { Snippet } from 'svelte';
import type { createModal } from './modal.model.svelte.js';
import type { ModalContent, ModalFocusableConfig, ModalProps } from './modal.types';

export type ModalConfirmType = 'info' | 'success' | 'error' | 'warning' | 'confirm';
/** Callback с аргументом close управляет закрытием вручную; Promise включает loading. */
export type ModalConfirmAction = (close: () => void) => unknown;

/** Управляет фокусом кнопок стандартного footer при открытии и после update. */
export interface ModalConfirmFocusableConfig extends ModalFocusableConfig {
  /** Null отключает явный autofocus обеих кнопок. @defaultValue 'ok' */
  autoFocusButton?: 'ok' | 'cancel' | null;
}

/** Контекстное подтверждение createModal, отображаемое единственным ModalHolder. */
export interface ModalConfirmConfig {
  /** Локальный namespace подтверждения; пустая строка наследует ConfigProvider держателя. */
  prefixCls?: string;
  title?: ModalContent;
  content?: ModalContent;
  icon?: Snippet | null | false;
  /** @defaultValue 416 */
  width?: number | string;
  height?: ModalProps['height'];
  centered?: ModalProps['centered'];
  /** По умолчанию zIndexPopupBase + 1000. Потомки наследуют этот слой. */
  zIndex?: ModalProps['zIndex'];
  /** Только confirm показывает Cancel по умолчанию. */
  okCancel?: boolean;
  okText?: ModalContent;
  cancelText?: ModalContent;
  /** @defaultValue false */
  closable?: boolean;
  /** @defaultValue true */
  keyboard?: boolean;
  /** По умолчанию закрытие по фону запрещено. */
  mask?: ModalProps['mask'];
  focusable?: ModalConfirmFocusableConfig;
  scrollLock?: ModalProps['scrollLock'];
  forceRender?: ModalProps['forceRender'];
  destroyOnHidden?: ModalProps['destroyOnHidden'];
  transitionName?: ModalProps['transitionName'];
  maskTransitionName?: ModalProps['maskTransitionName'];
  mousePosition?: ModalProps['mousePosition'];
  getContainer?: ModalProps['getContainer'];
  class?: string;
  footer?: Snippet | null;
  onOk?: ModalConfirmAction;
  onCancel?: ModalConfirmAction;
  afterClose?: () => void;
  afterOpenChange?: ModalProps['afterOpenChange'];
}

export interface ModalConfirmHandle extends PromiseLike<boolean> {
  /** Закрывает без onCancel; await завершается с false. */
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
