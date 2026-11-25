import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { createMessage } from './message.model.svelte.js';

export type MessageType = 'info' | 'success' | 'warning' | 'error' | 'loading';
export type MessageKey = string | number;
export type MessageContent = string | number | boolean | null | Snippet;

export type MessageSemanticName = 'list' | 'listContent' | 'root' | 'wrapper' | 'icon' | 'title';
export type MessageSemanticSlots = Partial<Record<MessageSemanticName, string>>;
/** Настройки списка и, для семантики отдельной записи, её поля. */
export type MessageSemanticProps = MessageOptions
  & Partial<Omit<MessageConfig, 'classNames' | 'styles'>>;
export type MessageSemantic = MessageSemanticSlots
  | ((info: { props: MessageSemanticProps; }) => MessageSemanticSlots | undefined);

/** Оформление сообщений внутри ConfigProvider и в конфигурации отдельной записи. */
export interface MessageAppearance {
  class?: string;
  style?: string;
  classNames?: MessageSemantic;
  /** Inline CSS каждого слота. */
  styles?: MessageSemantic;
}

/** Сколько карточек можно показать до сворачивания списка. */
export interface MessageStackConfig {
  threshold?: number;
}

/** Содержимое и жизненный цикл одного сообщения createMessage. */
export interface MessageConfig extends MessageAppearance {
  content: MessageContent;
  /** По умолчанию info. Явный null оставляет сообщение без статусной иконки. */
  type?: MessageType | null;
  /** Совпадающий key обновляет существующее сообщение. */
  key?: MessageKey;
  /** Время в секундах; 0 отключает автоматическое закрытие. */
  duration?: number;
  pauseOnHover?: boolean;
  icon?: MessageContent;
  role?: 'status' | 'alert';
  /** Вызывается при начале закрытия; отсоединение holder не вызывает callback. */
  onClose?: () => void;
  onClick?: HTMLAttributes<HTMLDivElement>['onclick'];
}

/** Настройки независимой очереди createMessage; значения сообщения имеют приоритет. */
export interface MessageOptions {
  /** Продолжительность по умолчанию в секундах; без настройки — 3. */
  duration?: number;
  /** Лимит очереди; новые записи вытесняют наиболее старые. */
  maxCount?: number;
  pauseOnHover?: boolean;
  prefixCls?: string;
  /** @defaultValue 8 */
  top?: number | string;
  /** Иначе направление ближайшего ConfigProvider. */
  rtl?: boolean;
  /** Цель portal; при пустом результате используется ближайший getPopupContainer. */
  getContainer?: () => HTMLElement | null | undefined;
  /** Имя CSS-перехода; пустая строка отключает движение. */
  transitionName?: string;
  /** Сворачивает список выше порога, который по умолчанию равен трём. */
  stack?: boolean | MessageStackConfig;
  classNames?: MessageSemantic;
  styles?: MessageSemantic;
}

/** Вызов закрывает сообщение; await даёт true после завершения, false при отсоединении holder. */
export interface MessageHandle extends PromiseLike<boolean> {
  (): void;
}

export type MessageInstance = ReturnType<typeof createMessage>;

/** Единственная визуальная поверхность выбранного экземпляра createMessage. */
export interface MessageHolderProps extends Omit<MessageOptions, 'duration' | 'pauseOnHover' | 'maxCount'> {
  message: MessageInstance;
  id?: string;
  class?: string;
  style?: string;
}
