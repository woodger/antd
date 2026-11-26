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

/** Оформление слотов. Явный inline style записи применяется после семантики. */
export interface NotificationAppearance {
  class?: string;
  style?: string;
  classNames?: NotificationSemantic;
  styles?: NotificationSemantic;
}

/** Оформление и стандартная кнопка закрытия под ConfigProvider. */
export interface NotificationProviderConfig extends NotificationAppearance {
  closeIcon?: NotificationContent;
}

export type NotificationRootAttributes = Omit<HTMLAttributes<HTMLDivElement>,
  'children' | 'class' | 'style' | 'onclick' | 'onpointerenter' | 'onpointerleave'
    | 'onfocusin' | 'onfocusout'
> & { [key: `data-${string}`]: string | number | boolean | null | undefined; };

/** Порог числа активных карточек в одном placement. */
export interface NotificationStackConfig {
  threshold?: number;
}

export interface NotificationClosable {
  disabled?: boolean;
  closeIcon?: NotificationContent;
  /** Срабатывает перед onClose карточки при закрытии кнопкой или таймером. */
  onClose?: () => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

/** Содержимое, положение и жизненный цикл одного уведомления. */
export interface NotificationConfig extends NotificationAppearance {
  title?: NotificationContent;
  description?: NotificationContent;
  actions?: NotificationContent;
  icon?: NotificationContent;
  type?: NotificationType;
  /** Совпадающий key обновляет уведомление, сохраняя его место в очереди. */
  key?: NotificationKey;
  placement?: NotificationPlacement;
  /** Время в секундах; 0 или false отключает автоматическое закрытие. */
  duration?: number | false;
  pauseOnHover?: boolean;
  /** Прогресс виден только у карточки с положительной длительностью. */
  showProgress?: boolean;
  closable?: boolean | NotificationClosable;
  closeIcon?: NotificationContent;
  role?: 'alert' | 'status';
  /** Дополнительные атрибуты div, включая data-* и ARIA. */
  props?: NotificationRootAttributes;
  onClick?: HTMLAttributes<HTMLDivElement>['onclick'];
  /** Вызывается при начале закрытия; отсоединение holder не вызывает callback. */
  onClose?: () => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

/** Настройки очереди createNotification; локальная конфигурация уведомления имеет приоритет. */
export interface NotificationOptions {
  placement?: NotificationPlacement;
  /** Продолжительность по умолчанию в секундах; без настройки — 4.5. */
  duration?: number | false;
  pauseOnHover?: boolean;
  showProgress?: boolean;
  /** Общий лимит для всех placements. */
  maxCount?: number;
  /** Корневой prefix всех списков. Пустая строка наследует ConfigProvider. */
  prefixCls?: string;
  /** @defaultValue 24 */
  top?: number;
  /** @defaultValue 24 */
  bottom?: number;
  /** При отсутствии значения используется направление ConfigProvider. */
  rtl?: boolean;
  /** Браузерный getter вызывается без аргументов. */
  getContainer?: () => HTMLElement | ShadowRoot | null | undefined;
  /** По умолчанию список сворачивается при числе карточек больше трёх. */
  stack?: boolean | NotificationStackConfig;
  closeIcon?: NotificationContent;
  classNames?: NotificationSemantic;
  styles?: NotificationSemantic;
  /** Вызывается после удаления последнего DOM-узла очереди. */
  onAllRemoved?: () => void;
}

export type NotificationInstance = ReturnType<typeof createNotification>;

/** Единственная поверхность экземпляра createNotification для всех placements. */
export interface NotificationHolderProps extends Omit<NotificationOptions,
  'duration' | 'placement' | 'maxCount' | 'pauseOnHover' | 'showProgress'
> {
  notification: NotificationInstance;
  id?: string;
  class?: string;
  style?: string;
}
