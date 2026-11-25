import type { Snippet } from 'svelte';
import type { AriaAttributes, AriaRole } from 'svelte/elements';
import type { ButtonElementProps, ButtonType } from './button.types';
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

/** Настроенные кнопки футера с теми же действиями, что и при стандартной отрисовке. */
export interface ModalFooterButtons {
  OkBtn: Snippet;
  CancelBtn: Snippet;
}

/** Футер может использовать штатную группу или разместить кнопки по отдельности. */
export type ModalFooter = Snippet<[defaultFooter: Snippet, buttons: ModalFooterButtons]>;

/** Настройки кнопки закрытия. Колбэки берутся из локального closable. */
export interface ModalClosableConfig extends AriaAttributes {
  closeIcon?: ModalContent;
  disabled?: boolean;
  role?: AriaRole | null;
  /** Обычный Modal вызывает колбэк после onOk или onCancel. */
  onClose?: () => void;
  /** Вызывается после закрытия окна перед его afterClose. */
  afterClose?: () => void;
}

export type ModalClosable = boolean | ModalClosableConfig;

/** Координаты страницы для начала масштабирования панели. */
export interface ModalMousePosition {
  x: number;
  y: number;
}

/** Унаследованные настройки Modal и контекстных подтверждений из ConfigProvider. */
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
  footer?: ModalFooter | null;
  /** Пиксели, CSS-длина или значения по breakpoint Grid. @defaultValue 520 */
  width?: ModalWidth;
  /** Высота панели в пикселях или CSS-длина. */
  height?: number | string;
  /** False размещает панель сверху, true центрирует. Наследуется из ConfigProvider.modal. */
  centered?: boolean;
  /** Числовой слой диалога и база для вложенных popup. */
  zIndex?: number;
  /** @defaultValue true */
  closable?: ModalClosable;
  /** Null и false скрывают кнопку, если closable явно не включён. */
  closeIcon?: ModalContent;
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
  okText?: ModalContent;
  cancelText?: ModalContent;
  /** @defaultValue 'primary' */
  okType?: ModalOkType;
  okButtonProps?: ModalButtonProps;
  cancelButtonProps?: ModalButtonProps;
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
