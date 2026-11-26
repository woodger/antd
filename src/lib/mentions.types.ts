import type { Snippet } from 'svelte';
import type { HTMLTextareaAttributes, HTMLAttributes } from 'svelte/elements';
import type { ComponentSize, RenderEmptyContent } from './types';
import type { InputAllowClear, InputCountConfig } from './input-count.types';
import type { FormValidateStatus } from './form-error-list.types';

export interface MentionsOption {
  /** Текст для поиска и вставки. При отсутствии используется пустая строка. */
  value?: string;
  /** Содержимое пункта подсказок. */
  label?: RenderEmptyContent;
  key?: string | number;
  disabled?: boolean;
  class?: string;
  style?: string;
}
/** Извлечение упоминаний по prefix и буквальному разделителю split. */
export interface MentionsConfig {
  prefix?: string | readonly string[];
  split?: string;
}
/** Слоты обёртки, поля, панели подсказок и суффикса Mentions. */
export type MentionsSlots = Partial<Record<'root' | 'textarea' | 'popup' | 'suffix', string>>;
/** Пустой status обозначает pristine FormItem; вне FormItem возможен undefined. */
export interface MentionsSemanticProps extends Omit<MentionsProps, 'status'> {
  status?: FormValidateStatus;
}
/** Callback получает параметры экземпляра с разрешёнными disabled и status. */
export type MentionsSemantic = MentionsSlots
  | ((info: { props: MentionsSemanticProps; }) => MentionsSlots | undefined);

/** Настройки ConfigProvider.mentions, отдельно от параметров getMentions. */
export interface MentionsComponentConfig {
  variant?: MentionsProps['variant'];
  allowClear?: MentionsProps['allowClear'];
  class?: string;
  style?: string;
  classNames?: MentionsSemantic;
  styles?: MentionsSemantic;
}
export interface MentionsEntity {
  prefix: string;
  value: string;
}
/** Textarea с поиском упоминаний у каретки и вставкой выбранного option. */
export interface MentionsProps extends Omit<
  HTMLTextareaAttributes,
  'value'
  | 'defaultValue'
  | 'children'
  | 'prefix'
  | 'onchange'
  | 'onselect'
  | 'onfocus'
  | 'onblur'
  | 'onresize'
>, MentionsConfig {
  /** CSS prefix; не меняет текстовые triggers prefix. Empty/undefined наследуют ConfigProvider. */
  prefixCls?: string;
  /** Полная строка textarea; offsets выделения измеряются в UTF-16. */
  value?: string;
  /** @defaultValue '' */
  defaultValue?: string;
  options?: readonly MentionsOption[];
  filterOption?: false | ((text: string, option: MentionsOption) => boolean);
  validateSearch?: (text: string, split?: string) => boolean;
  /** @defaultValue false */
  loading?: boolean;
  notFoundContent?: string | number | Snippet | null;
  /** @defaultValue 'bottom' */
  placement?: 'top' | 'bottom';
  /** Выбирает сторону привязки popup к префиксу. Направление textarea задаёт dir. */
  direction?: 'ltr' | 'rtl';
  /** Имя CSSMotion для появления подсказок. Пустая строка отключает движение. */
  transitionName?: string;
  /** При открытом списке блокирует выбор клавишей Enter. По умолчанию следует loading. */
  silent?: boolean;
  /** Автофокус при появлении редактора. Нативный autofocus имеет приоритет. */
  autoFocus?: boolean;
  /** Настраивает подсчёт, мягкий предел и преобразование сверхлимитного ввода. */
  count?: InputCountConfig;
  /** Нативный предел ввода. Перекрывает maxlength и действует независимо от count.max. */
  maxLength?: number;
  /** @defaultValue false */
  autoSize?: boolean | { minRows?: number; maxRows?: number; };
  /** @defaultValue false */
  allowClear?: boolean | InputAllowClear;
  size?: ComponentSize;
  status?: 'error' | 'warning' | 'success' | 'validating';
  /** @defaultValue 'outlined' */
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  onChange?: (text: string) => void;
  /** Поисковый текст и найденный prefix; сетевые запросы остаются у потребителя. */
  onSearch?: (text: string, prefix: string) => void;
  onSelect?: (option: MentionsOption, prefix: string) => void;
  onClear?: () => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;
  onCompositionStart?: HTMLTextareaAttributes['oncompositionstart'];
  onCompositionEnd?: HTMLTextareaAttributes['oncompositionend'];
  onPressEnter?: (event: KeyboardEvent) => void;
  onResize?: (size: { width: number; height: number; }) => void;
  onPopupScroll?: HTMLAttributes<HTMLDivElement>['onscroll'];
  /** Локальный контейнер; ConfigProvider.getPopupContainer не используется, как upstream. */
  getPopupContainer?: () => HTMLElement | ShadowRoot;
  /** Получает стандартный menu Snippet; содержимое создаётся заново при каждом открытии. */
  popupRender?: Snippet<[Snippet]>;
  classNames?: MentionsSemantic;
  /** CSS-декларации по слотам. */
  styles?: MentionsSemantic;
  class?: string;
  rootClassName?: string;
  /** @defaultValue '' */
  popupClassName?: string;
  /** Нативный ref доступен после mount и очищается при unmount. */
  nativeElement?: HTMLDivElement;
}
