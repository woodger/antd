import type { Component, Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { MessageInstance, MessageOptions } from './message.types';
import type { NotificationInstance, NotificationOptions } from './notification.types';
import type { ModalInstance } from './modal-confirm.types';

export interface AppMessageConfig extends MessageOptions {
  /** Локальный prefix MessageHolder; иначе наследуется ConfigProvider. */
  prefixCls?: string;
  /** Вертикальный отступ поверхности MessageHolder; по умолчанию 8. */
  top?: number | string;
}

export interface AppNotificationConfig extends NotificationOptions {
  /** Локальный prefix NotificationHolder; иначе наследуется ConfigProvider. */
  prefixCls?: string;
  top?: number;
  bottom?: number;
}

/** Каждый record наследуется от ближайшего App и дополняется локальными полями. */
export interface AppOptions {
  message?: AppMessageConfig;
  notification?: AppNotificationConfig;
}

/** Общие class/style внешней обёртки App; record заменяет родительский целиком. */
export interface AppConfig {
  class?: string;
  style?: string;
}

export interface AppInstance {
  message: MessageInstance;
  notification: NotificationInstance;
  modal: ModalInstance;
}

/**
 * Атрибуты пользовательского корня App. Children включает holders и содержимое.
 * Для DOM-ref корень передаёт свой элемент через $bindable nativeElement.
 */
export interface AppRootProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'class'> {
  children?: Snippet;
  class?: string;
  nativeElement?: HTMLElement;
}

/** Контекст API и holders; component=false выводит только содержимое и holders. */
export interface AppProps<Props extends object = {}> extends AppOptions, Omit<
  HTMLAttributes<HTMLElement>,
  'children' | 'class' | 'style'
> {
  children?: Snippet;
  /** Нативный тег, Svelte-компонент или false. @defaultValue 'div' */
  component?: keyof HTMLElementTagNameMap | Component<Props> | false;
  /** Локальный CSS prefix; иначе ConfigProvider prefix + app. */
  prefixCls?: string;
  class?: string;
  rootClassName?: string;
  style?: string;
  /** Поддерживает bind; undefined при component=false и после unmount. */
  nativeElement?: HTMLElement;
}

/** Дополнительные параметры компонента корня передаются через App. */
export type AppComponentProps<Props extends object = {}> = AppProps<Props>
  & Omit<Props, 'children' | 'class' | 'style' | 'dir' | 'nativeElement'>;
