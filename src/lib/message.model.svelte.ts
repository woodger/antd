// Сохраняет один экземпляр очереди на holder. Оформление записи вычисляется при open,
// тогда как настройки поверхности могут меняться вместе с App.
import { untrack } from 'svelte';
import {
  createNoticeQueue,
  noticeQueueKey,
  type QueueNotice
} from './notice-queue.model.svelte.js';
import { resolveMessageSemantic } from './message-semantic.engine';
import type {
  MessageConfig, MessageContent, MessageOptions, MessageSemanticSlots, MessageType
} from './message.types';

export {
  noticeQueueKey as messageHolderKey,
  type NoticeClock as MessageClock
} from './notice-queue.model.svelte.js';
type ResolvedMessage = Omit<MessageConfig, 'classNames' | 'styles' | 'role'> & {
  role: 'status' | 'alert';
  classNames?: MessageSemanticSlots;
  styles?: MessageSemanticSlots;
};
export type MessageNotice = QueueNotice<ResolvedMessage>;

/**
 * Создаёт изолированную очередь для одного MessageHolder. Таймеры включаются после
 * подключения holder; его отсоединение завершает handles с false без onClose.
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

  // Getter нужен, чтобы holder и App читали обновлённые настройки того же экземпляра.
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
