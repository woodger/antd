import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { createNotification } from './notification.model.svelte.js';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';
export type NotificationPlacement =
  'top'
  | 'topLeft'
  | 'topRight'
  | 'bottom'
  | 'bottomLeft'
  | 'bottomRight';
export type NotificationKey = string | number;
export type NotificationContent = string | number | boolean | null | Snippet;

export type NotificationSemanticName = 'list' | 'listContent' | 'root' | 'wrapper' | 'icon'
  | 'section' | 'title' | 'description' | 'actions' | 'close' | 'progress';
export type NotificationSemanticSlots = Partial<Record<NotificationSemanticName, string>>;
export type NotificationSemanticProps = NotificationOptions & Partial<NotificationConfig>;
export type NotificationSemantic = NotificationSemanticSlots
  | ((info: { props: NotificationSemanticProps; }) => NotificationSemanticSlots | undefined);

/** Registration of slots. Obvious inline style records are used after semantics. */
export interface NotificationAppearance {
  class?: string;
  style?: string;
  classNames?: NotificationSemantic;
  styles?: NotificationSemantic;
}

/** Registration and standard closing button under ConfigProvider. */
export interface NotificationProviderConfig extends NotificationAppearance {
  closeIcon?: NotificationContent;
}

export type NotificationRootAttributes = Omit<HTMLAttributes<HTMLDivElement>,
  'children' | 'class' | 'style' | 'onclick' | 'onpointerenter' | 'onpointerleave'
    | 'onfocusin' | 'onfocusout'
> & { [key: `data-${string}`]: string | number | boolean | null | undefined; };

/** Threshold of the number of active cards in one placement. */
export interface NotificationStackConfig {
  threshold?: number;
}

export interface NotificationClosable {
  disabled?: boolean;
  closeIcon?: NotificationContent;
  /** Triggers before onClose cards when closed with a button or timer. */
  onClose?: () => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

/** The content, position and life cycle of a single notification. */
export interface NotificationConfig extends NotificationAppearance {
  title?: NotificationContent;
  description?: NotificationContent;
  actions?: NotificationContent;
  icon?: NotificationContent;
  type?: NotificationType;
  /** The matching key updates the notification, keeping its place in the queue. */
  key?: NotificationKey;
  placement?: NotificationPlacement;
  /** Time in seconds; 0 or false disables automatic closure. */
  duration?: number | false;
  pauseOnHover?: boolean;
  /** The progress is visible only at the card with a positive duration. */
  showProgress?: boolean;
  closable?: boolean | NotificationClosable;
  closeIcon?: NotificationContent;
  role?: 'alert' | 'status';
  /** Additional attributes of div, including data-* and ARIA. */
  props?: NotificationRootAttributes;
  onClick?: HTMLAttributes<HTMLDivElement>['onclick'];
  /** Called when closing starts; disengagement holder does not cause callback. */
  onClose?: () => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

/** Settings createNotification; local notification configuration takes precedence. */
export interface NotificationOptions {
  placement?: NotificationPlacement;
  /** Default duration in seconds; without setting — 4.5. */
  duration?: number | false;
  pauseOnHover?: boolean;
  showProgress?: boolean;
  /** The overall limit for all placements. */
  maxCount?: number;
  /** Root prefix of all lists. Empty line inherits ConfigProvider. */
  prefixCls?: string;
  /** @defaultValue 24 */
  top?: number;
  /** @defaultValue 24 */
  bottom?: number;
  /** In the absence of a value, the direction ConfigProvider is used. */
  rtl?: boolean;
  /** Browser getter is called without arguments. */
  getContainer?: () => HTMLElement | ShadowRoot | null | undefined;
  /** By default, the list is folded with the number of cards more than three. */
  stack?: boolean | NotificationStackConfig;
  closeIcon?: NotificationContent;
  classNames?: NotificationSemantic;
  styles?: NotificationSemantic;
  /** Is called after the removal of the last DOM-node of the queue. */
  onAllRemoved?: () => void;
}

export type NotificationInstance = ReturnType<typeof createNotification>;

/** The createNotification instance uses one surface across all placements. */
export interface NotificationHolderProps extends Omit<NotificationOptions,
  'duration' | 'placement' | 'maxCount' | 'pauseOnHover' | 'showProgress'
> {
  notification: NotificationInstance;
  id?: string;
  class?: string;
  style?: string;
}
