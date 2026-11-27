import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { createMessage } from './message.model.svelte.js';

export type MessageType = 'info' | 'success' | 'warning' | 'error' | 'loading';
export type MessageKey = string | number;
export type MessageContent = string | number | boolean | null | Snippet;

export type MessageSemanticName = 'list' | 'listContent' | 'root' | 'wrapper' | 'icon' | 'title';
export type MessageSemanticSlots = Partial<Record<MessageSemanticName, string>>;
/** Setting the list and, for the semantics of a separate record, its fields. */
export type MessageSemanticProps = MessageOptions
  & Partial<Omit<MessageConfig, 'classNames' | 'styles'>>;
export type MessageSemantic = MessageSemanticSlots
  | ((info: { props: MessageSemanticProps; }) => MessageSemanticSlots | undefined);

/** Registration of messages inside ConfigProvider and in the configuration of a separate entry. */
export interface MessageAppearance {
  class?: string;
  style?: string;
  classNames?: MessageSemantic;
  /** Inline CSS every slot. */
  styles?: MessageSemantic;
}

/** How many cards can be shown before the list is folded. */
export interface MessageStackConfig {
  threshold?: number;
}

/** The content and life cycle of one message createMessage. */
export interface MessageConfig extends MessageAppearance {
  content: MessageContent;
  /** The default info. Explicit null leaves a message without a status icon. */
  type?: MessageType | null;
  /** The matching key updates an existing message. */
  key?: MessageKey;
  /** Time in seconds; 0 disables automatic closure. */
  duration?: number;
  pauseOnHover?: boolean;
  icon?: MessageContent;
  role?: 'status' | 'alert';
  /** Called when closing starts; disengagement holder does not cause callback. */
  onClose?: () => void;
  onClick?: HTMLAttributes<HTMLDivElement>['onclick'];
}

/** Configurations of independent queue createMessage; message values have prioritization. */
export interface MessageOptions {
  /** Default duration in seconds; no set-up – 3. */
  duration?: number;
  /** Limit of the queue; the new records displace the oldest. */
  maxCount?: number;
  pauseOnHover?: boolean;
  prefixCls?: string;
  /** @defaultValue 8 */
  top?: number | string;
  /** Otherwise the direction of the nearest ConfigProvider. */
  rtl?: boolean;
  /** Objective portal; with an empty result, the nearest getPopupContainer is used. */
  getContainer?: () => HTMLElement | null | undefined;
  /** Name CSS-junction; an empty string disables movement. */
  transitionName?: string;
  /** Folds the list above the threshold, which by default is equal to three. */
  stack?: boolean | MessageStackConfig;
  classNames?: MessageSemantic;
  styles?: MessageSemantic;
}

/** The call closes the message; await gives true after completion, false when disconnecting the holder. */
export interface MessageHandle extends PromiseLike<boolean> {
  (): void;
}

export type MessageInstance = ReturnType<typeof createMessage>;

/** Single visual surface for the selected createMessage instance. */
export interface MessageHolderProps extends Omit<MessageOptions, 'duration' | 'pauseOnHover' | 'maxCount'> {
  message: MessageInstance;
  id?: string;
  class?: string;
  style?: string;
}
