import type { Component, Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { MessageInstance, MessageOptions } from './message.types';
import type { NotificationInstance, NotificationOptions } from './notification.types';
import type { ModalInstance } from './modal-confirm.types';

export interface AppMessageConfig extends MessageOptions {
  /** Local MessageHolder prefix. Otherwise inherits ConfigProvider. */
  prefixCls?: string;
  /** Vertical offset for the MessageHolder surface. Defaults to 8. */
  top?: number | string;
}

export interface AppNotificationConfig extends NotificationOptions {
  /** Local NotificationHolder prefix. Otherwise inherits ConfigProvider. */
  prefixCls?: string;
  top?: number;
  bottom?: number;
}

/** Each record inherits from the nearest App and adds local fields. */
export interface AppOptions {
  message?: AppMessageConfig;
  notification?: AppNotificationConfig;
}

/** Shared class and style for the App wrapper. An explicit record replaces the parent's record in full. */
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
 * Attributes for a custom App root. Children includes holders and content. To expose a DOM ref, the
 * root passes its element through $bindable nativeElement.
 */
export interface AppRootProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'class'> {
  children?: Snippet;
  class?: string;
  nativeElement?: HTMLElement;
}

/** Context for the APIs and holders. component=false renders only content and holders. */
export interface AppProps<Props extends object = {}> extends AppOptions, Omit<
  HTMLAttributes<HTMLElement>,
  'children' | 'class' | 'style'
> {
  children?: Snippet;
  /** Native tag, Svelte component, or false. @defaultValue 'div' */
  component?: keyof HTMLElementTagNameMap | Component<Props> | false;
  /** Local CSS prefix. Otherwise uses the ConfigProvider prefix plus app. */
  prefixCls?: string;
  class?: string;
  rootClassName?: string;
  style?: string;
  /** Supports binding. It is undefined with component=false and after unmount. */
  nativeElement?: HTMLElement;
}

/** App forwards additional parameters to the root component. */
export type AppComponentProps<Props extends object = {}> = AppProps<Props>
  & Omit<Props, 'children' | 'class' | 'style' | 'dir' | 'nativeElement'>;
