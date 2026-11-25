import type { Snippet } from 'svelte';
import type { GetContainer } from './types';

export type DrawerPlacement = 'top' | 'right' | 'bottom' | 'left';
export type DrawerSize = 'default' | 'large' | number | (string & {});

export interface DrawerMaskConfig {
  enabled?: boolean;
  blur?: boolean;
  closable?: boolean;
}

export type DrawerMask = boolean | DrawerMaskConfig;

export interface DrawerFocusableConfig {
  /** Удерживает фокус в открытой панели. По умолчанию действует при включённой маске. */
  trap?: boolean;
  /** Возвращает фокус к исходному элементу после закрытия. @defaultValue true */
  focusTriggerAfterClose?: boolean;
}

/** Настройки маски и фокуса, передаваемые Drawer через ConfigProvider. */
export interface DrawerConfig {
  mask?: DrawerMask;
  focusable?: DrawerFocusableConfig;
}

export interface DrawerResizableConfig {
  /** Текущий размер в пикселях при захвате границы панели. */
  onResizeStart?: (size: number) => void;
  /** Предложенный размер. При заданном size его может принять владелец. */
  onResize?: (size: number) => void;
  /** Фактический размер панели в пикселях при отпускании указателя. */
  onResizeEnd?: (size: number) => void;
}

export interface DrawerPushConfig {
  /** Смещение панели в пикселях. Без distance наследуется смещение родительского Drawer. */
  distance?: number | string;
}

/** Выдвижная панель с управлением open, фокусом и жизненным циклом children. */
export interface DrawerProps {
  /** Локальный CSS-префикс Drawer и его частей; пустая строка наследует ConfigProvider. */
  prefixCls?: string;
  /** Поддерживает bind:open. */
  open?: boolean;
  title?: string | Snippet;
  children?: Snippet;
  extra?: Snippet;
  footer?: Snippet;
  /** @defaultValue 'right' */
  placement?: DrawerPlacement;
  /** @defaultValue 'default' */
  size?: DrawerSize;
  /** Размер без заданного size и до первого изменения размера. @defaultValue 378 */
  defaultSize?: DrawerSize;
  /** Максимальный предложенный размер при перетаскивании. */
  maxSize?: number;
  /** Показывает границу для изменения размера по оси placement. */
  resizable?: boolean | DrawerResizableConfig;
  /** Смещение при открытии вложенного Drawer. @defaultValue { distance: 180 } */
  push?: boolean | DrawerPushConfig;
  /** Числовой слой панели и база для вложенных popup. */
  zIndex?: number;
  /** @defaultValue true */
  closable?: boolean;
  /** @defaultValue true */
  keyboard?: boolean;
  /** Маска, размытие и закрытие при полном нажатии на фон. @defaultValue true */
  mask?: DrawerMask;
  focusable?: DrawerFocusableConfig;
  /** Передаёт фокус панели при открытии. @defaultValue true */
  autoFocus?: boolean;
  /** @defaultValue false */
  forceRender?: boolean;
  /** @defaultValue false */
  destroyOnHidden?: boolean;
  /**
   * Undefined наследует ConfigProvider; false оставляет DOM на месте.
   * Global getter получает document.body.
   */
  getContainer?: GetContainer;
  onClose?: (event: Event) => void;
  /** После завершения анимации видимости, перед удалением скрытого содержимого. */
  afterOpenChange?: (open: boolean) => void;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string;
  style?: string;
}
