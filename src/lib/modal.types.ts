import type { Snippet } from 'svelte';
import type { DrawerFocusableConfig, DrawerMask, DrawerMaskConfig } from './drawer.types';
import type { GridResponsive } from './grid.types';
import type { GetContainer } from './types';

export type ModalContent = string | number | boolean | null | Snippet;
export type ModalMask = DrawerMask;
export type ModalMaskConfig = DrawerMaskConfig;
export type ModalFocusableConfig = DrawerFocusableConfig;
export type ModalWidth = number | string | GridResponsive<number | string>;

/** Координаты страницы для начала масштабирования панели. */
export interface ModalMousePosition {
  x: number;
  y: number;
}

/** Унаследованные настройки маски, фокуса и размещения из ConfigProvider.modal. */
export interface ModalConfig {
  mask?: ModalMask;
  focusable?: ModalFocusableConfig;
  centered?: boolean;
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
  /** Пиксели, CSS-длина или значения по breakpoint Grid. @defaultValue 520 */
  width?: ModalWidth;
  /** Высота панели в пикселях или CSS-длина. */
  height?: number | string;
  /** False размещает панель сверху, true центрирует. Наследуется из ConfigProvider.modal. */
  centered?: boolean;
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
  /** Задаёт предварительный монтаж. Без обоих параметров lifecycle он включён. */
  forceRender?: boolean;
  /** Удаляет содержимое после закрытия. При forceRender=true содержимое сохраняется. */
  destroyOnHidden?: boolean;
  /** Имя CSS-перехода панели. Пустая строка отключает движение панели. */
  transitionName?: string;
  /** Имя независимого CSS-перехода маски. Пустая строка отключает движение маски. */
  maskTransitionName?: string;
  /** Null и undefined используют положение недавнего клика. */
  mousePosition?: ModalMousePosition | null;
  okText?: string;
  cancelText?: string;
  onOk?: () => void;
  onCancel?: () => void;
  /** Вызывается после закрытия, перед afterOpenChange(false). */
  afterClose?: () => void;
  /** Вызывается после завершения перехода к открытой или закрытой панели. */
  afterOpenChange?: (open: boolean) => void;
  /**
   * Undefined наследует ConfigProvider; false оставляет DOM на месте.
   * Global getter вызывается без trigger.
   */
  getContainer?: GetContainer;
  class?: string;
}
