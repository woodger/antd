import type { createModal } from './modal.model.svelte.js';
import type { ModalContent, ModalFocusableConfig, ModalProps, ModalSurfaceProps } from './modal.types';

export type ModalConfirmType = 'info' | 'success' | 'error' | 'warning' | 'confirm';
/** Callback с аргументом close управляет закрытием вручную; Promise включает loading. */
export type ModalConfirmAction = (close: () => void) => unknown;

/** Управляет фокусом кнопок стандартного footer при открытии и после update. */
export interface ModalConfirmFocusableConfig extends ModalFocusableConfig {
  /** Null отключает явный autofocus обеих кнопок. @defaultValue 'ok' */
  autoFocusButton?: 'ok' | 'cancel' | null;
}

/** Контекстное подтверждение createModal, отображаемое единственным ModalHolder. */
export interface ModalConfirmConfig extends ModalSurfaceProps {
  /** Локальный namespace подтверждения; пустая строка наследует ConfigProvider держателя. */
  prefixCls?: string;
  /** Локальное направление подтверждения. Undefined наследует провайдера. */
  direction?: 'ltr' | 'rtl';
  /** Начальный тип задаёт вызванный метод. Update может сменить вариант. */
  type?: ModalConfirmType;
  title?: ModalContent;
  content?: ModalContent;
  /** Undefined выбирает иконку ConfigProvider по типу подтверждения. */
  icon?: ModalContent;
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
  okType?: ModalProps['okType'];
  okButtonProps?: ModalProps['okButtonProps'];
  cancelButtonProps?: ModalProps['cancelButtonProps'];
  /** @defaultValue false */
  closable?: ModalProps['closable'];
  closeIcon?: ModalProps['closeIcon'];
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
  /** Получает нативный dialog. Undefined освобождает ссылку и предыдущий обработчик. */
  panelRef?: (node: HTMLDialogElement | undefined) => void;
  class?: string;
  footer?: ModalProps['footer'];
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

export interface ModalStaticConfig extends ModalConfirmConfig {
  /** При вызове окно открывается. Update может скрыть и повторно показать его. */
  open?: boolean;
}

export interface ModalStaticHandle {
  /** Закрывает и освобождает отдельный корень окна. */
  destroy(): void;
  /** Объект дополняет конфигурацию, функция возвращает её новую версию целиком. */
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

/** Операции владельца, которые инициирует общая панель подтверждения. */
export interface ModalConfirmationRuntime {
  mounted(id: number, panel?: HTMLDialogElement): void;
  act(id: number, confirmed: boolean): boolean;
  dismiss(id: number): void;
  complete(id: number, notifyVisibility?: boolean): void;
}
