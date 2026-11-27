// Retains one copy of the queue on holder. The registration of the record is calculated at open,
// while the surface settings can change together with the App.
import { untrack } from 'svelte';
import {
  createNoticeQueue,
  noticeQueueKey,
  type QueueNotice
} from '../notice/notice-queue.model.svelte.js';
import { resolveMessageSemantic } from './message-semantic.engine';
import type {
  MessageConfig, MessageContent, MessageOptions, MessageSemanticSlots, MessageType
} from './message.types';

export {
  noticeQueueKey as messageHolderKey,
  type NoticeClock as MessageClock
} from '../notice/notice-queue.model.svelte.js';
type ResolvedMessage = Omit<MessageConfig, 'classNames' | 'styles' | 'role'> & {
  role: 'status' | 'alert';
  classNames?: MessageSemanticSlots;
  styles?: MessageSemanticSlots;
};
export type MessageNotice = QueueNotice<ResolvedMessage>;

/**
 * Creates an isolated queue for one MessageHolder. Timers are switched on after connecting the
 * holder; its disconnection completes the handles with false without onClose.
 */
export function createMessage(initial: MessageOptions = {}) {
  let options = $state.raw(initial);
  const queue = createNoticeQueue<ResolvedMessage>(
    initial,
    'A message instance supports one mounted MessageHolder.'
  );
  const queueRuntime = queue[noticeQueueKey];
  const configureQueue = queueRuntime.configure;

  function open(config: MessageConfig) {
    const { classNames, styles, ...notice } = config;
    const props = { ...untrack(() => options), ...config };
    return queue.open({
      ...notice,
      type: config.type === undefined ? 'info' : config.type,
      role: config.role ?? 'status',
      classNames: resolveMessageSemantic(classNames, props),
      styles: resolveMessageSemantic(styles, props)
    });
  }

  function typed(type: MessageType) {
    return (
      content: MessageContent | Omit<MessageConfig, 'type'>,
      duration?: number | (() => void),
      onClose?: () => void
    ) => {
      const config = content !== null && typeof content === 'object' ? content : { content };
      return open({
        ...config,
        type,
        duration: typeof duration === 'number' ? duration : config.duration,
        onClose: typeof duration === 'function' ? duration : onClose ?? config.onClose
      });
    };
  }

  const runtime = Object.assign(queueRuntime, {
    configure(next: MessageOptions) {
      options = next;
      configureQueue(next);
    }
  });

  // Getter needs holder and App to read the updated settings of the same instance.
  const holder = Object.defineProperty(runtime, 'options', {
    get: () => options
  }) as typeof runtime & { readonly options: MessageOptions; };

  return {
    destroy: queue.destroy,
    [noticeQueueKey]: holder,
    open,
    info: typed('info'),
    success: typed('success'),
    warning: typed('warning'),
    error: typed('error'),
    loading: typed('loading')
  };
}
