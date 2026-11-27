// Owns a separate queue and captures defaults on open. Placement and surface styling may update
// independently of the timers.
import { untrack } from 'svelte';
import {
  createNoticeQueue,
  noticeQueueKey,
  type QueueNotice
} from '../notice-queue.model.svelte.js';
import { resolveNoticeSemantic } from '../notice-semantic.engine';
import type {
  NotificationConfig,
  NotificationOptions,
  NotificationPlacement,
  NotificationSemanticName,
  NotificationSemanticProps,
  NotificationSemanticSlots,
  NotificationType
} from './notification.types';

export const notificationPlacements: readonly NotificationPlacement[] = [
  'top',
  'topLeft',
  'topRight',
  'bottom',
  'bottomLeft',
  'bottomRight'
];
export const notificationOptionsKey = Symbol('ant-notification-options');
export {
  noticeQueueKey as notificationHolderKey
} from '../notice-queue.model.svelte.js';
type ResolvedNotification = Omit<NotificationConfig, 'duration' | 'classNames' | 'styles'> & {
  duration?: number;
  onDismiss?: () => void;
  placement: NotificationPlacement;
  role: 'alert' | 'status';
  classNames?: NotificationSemanticSlots;
  styles?: NotificationSemanticSlots;
};
export type NotificationNotice = QueueNotice<ResolvedNotification>;

function resolvePlacement(
  value: NotificationPlacement | undefined, fallback: NotificationPlacement = 'topRight'
) {
  return value !== undefined && notificationPlacements.includes(value) ? value : fallback;
}

/**
 * Creates an independent instance for one NotificationHolder. Without a connected holder, the
 * timers do not start; the disconnection clears the queue without onClose.
 */
export function createNotification(initial: NotificationOptions = {}) {
  let options = $state.raw(initial);
  let placement = resolvePlacement(initial.placement);
  const queue = createNoticeQueue<ResolvedNotification>(
    { ...initial, duration: initial.duration === false ? 0 : initial.duration },
    'A notification instance supports one mounted NotificationHolder.',
    4.5,
    notice => notice.placement
  );
  const runtime = queue[noticeQueueKey];
  // Getter preserves live settings with a stable App instance.
  const holder = Object.defineProperty(runtime, 'options', {
    get: () => options
  }) as typeof runtime & { readonly options: NotificationOptions; };

  function open(config: NotificationConfig): void {
    const { classNames, styles, ...notice } = config;
    const defaults = untrack(() => options);
    const close = typeof notice.closable === 'object' ? notice.closable : undefined;
    const closeIcon = close?.closeIcon !== undefined ? close.closeIcon : notice.closeIcon;
    queue.open({
      ...notice,
      duration: notice.duration === false ? 0 : notice.duration,
      placement: resolvePlacement(notice.placement, placement),
      role: notice.role ?? 'alert',
      showProgress: notice.showProgress ?? defaults.showProgress,
      onDismiss: closeIcon === false || closeIcon === null ? undefined : close?.onClose,
      classNames: resolveNoticeSemantic<NotificationSemanticName, NotificationSemanticProps>(
        classNames, config
      ),
      styles: resolveNoticeSemantic<NotificationSemanticName, NotificationSemanticProps>(
        styles, config
      )
    });
  }

  function typed(type: NotificationType) {
    return (config: Omit<NotificationConfig, 'type'>) => open({ ...config, type });
  }
  return {
    open,
    success: typed('success'),
    info: typed('info'),
    warning: typed('warning'),
    error: typed('error'),
    destroy: queue.destroy,
    [notificationOptionsKey](next: NotificationOptions) {
      options = next;
      placement = resolvePlacement(next.placement);
      runtime.configure({
        ...next,
        duration: next.duration === false ? 0 : next.duration
      });
    },
    [noticeQueueKey]: holder
  };
}
