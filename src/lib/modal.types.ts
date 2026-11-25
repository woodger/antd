import type { Snippet } from 'svelte';
import type { DrawerFocusableConfig, DrawerMask, DrawerMaskConfig } from './drawer.types';
import type { GetContainer } from './types';

export type ModalContent = string | number | boolean | null | Snippet;
export type ModalMask = DrawerMask;
export type ModalMaskConfig = DrawerMaskConfig;
export type ModalFocusableConfig = DrawerFocusableConfig;

/** Унаследованные настройки маски и фокуса из ConfigProvider.modal. */
export interface ModalConfig {
  mask?: ModalMask;
  focusable?: ModalFocusableConfig;
}

/** Модальный native dialog с управлением open и snippets содержимого/footer. */
export interface ModalProps {
  /** Локальный префикс Modal и частей; пустая строка наследует ConfigProvider. */
  prefixCls?: string;
  /** Поддерживает bind:open. */
  open?: boolean;
  /** Необязательный заголовок; scalar или Snippet. Zero остаётся видимым. */
  title?: ModalContent;
  children?: Snippet;
  /** Непустое явное имя перекрывает автоматически связанный title. */
  'aria-label'?: string;
  /** Явный id перекрывает автоматически связанный title. */
  'aria-labelledby'?: string;
  footer?: Snippet | null;
  /** @defaultValue 520 */
  width?: number;
  /** Числовой слой диалога и база для вложенных popup. */
  zIndex?: number;
  /** @defaultValue true */
  closable?: boolean;
  /** @defaultValue true */
  keyboard?: boolean;
  /** Управляет видимой маской, её размытием и закрытием по фону. */
  mask?: ModalMask;
  focusable?: ModalFocusableConfig;
  /** Блокирует прокрутку страницы, пока открыт диалог. @defaultValue true */
  scrollLock?: boolean;
  /** @defaultValue false */
  confirmLoading?: boolean;
  /** Показывает Skeleton тела и скрывает footer. */
  loading?: boolean;
  okText?: string;
  cancelText?: string;
  onOk?: () => void;
  onCancel?: () => void;
  /** Вызывается после фактического закрытия native dialog. */
  afterClose?: () => void;
  /**
   * Undefined наследует ConfigProvider; false оставляет DOM на месте.
   * Global getter вызывается без trigger.
   */
  getContainer?: GetContainer;
  class?: string;
}
