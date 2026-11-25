import type { Snippet } from 'svelte';
import type { AriaAttributes, HTMLAttributes } from 'svelte/elements';
import type { GetContainer, RenderEmptyContent } from './types';

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

export type DrawerCloseIcon = Exclude<RenderEmptyContent, undefined>;

/** Кнопка закрытия и её доступное имя. Сторона учитывает направление текста. */
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

/** Настройки панели, маски и фокуса, передаваемые Drawer через ConfigProvider. */
export interface DrawerConfig extends Pick<
  DrawerProps, 'classNames' | 'styles' | 'closable' | 'closeIcon' | 'mask' | 'focusable'
> {
  /** Дополнительный класс секции внутри оболочки Drawer. */
  class?: string;
  /** Inline CSS секции, переопределяемый через styles.section. */
  style?: string;
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
  /** Подменяет тело панели анимированным Skeleton до готовности children. */
  loading?: boolean;
  /** Получает секцию с заголовком, телом и подвалом для обёртки или замены. */
  drawerRender?: Snippet<[section: Snippet]>;
  /** Bind:panelRef получает секцию после mount и очищается при её удалении. */
  panelRef?: HTMLDivElement;
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
  closable?: DrawerClosable;
  /** False и null скрывают кнопку без явного closable. */
  closeIcon?: DrawerCloseIcon;
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
  /** Класс корневого dialog. Для секции используйте classNames.section. */
  class?: string;
  /** Inline CSS корневого dialog. Для секции используйте styles.section. */
  style?: string;
  rootClassName?: string;
  /** Дополнительный слой inline CSS поверх styles.root и style. */
  rootStyle?: string;
  classNames?: DrawerSemantic;
  /** Каждый слот принимает строку CSS declarations. */
  styles?: DrawerSemantic;
}
