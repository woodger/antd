import type { Snippet } from 'svelte';
import type { HTMLTextareaAttributes, HTMLAttributes } from 'svelte/elements';
import type { ComponentSize, RenderEmptyContent } from '../types';
import type { InputAllowClear, InputCountConfig } from '../input/input-count.types';
import type { FormValidateStatus } from '../form/form-error-list.types';

export interface MentionsOption {
  /** Text to search and insert. In the absence, an empty line is used. */
  value?: string;
  /** Contents of the point of prompts. */
  label?: RenderEmptyContent;
  key?: string | number;
  disabled?: boolean;
  class?: string;
  style?: string;
}

/** Default list data available in popupRender. */
export interface MentionsPopupRenderInfo {
  /** CSS-prefix of the list to suffix `-menu`. */
  readonly prefixCls: string;
  /** Options after filtering, in order of navigation from textarea. */
  readonly options: readonly MentionsOption[];
  /** Positioning and opening phase completed. Manages scrolling an active item. */
  readonly opened: boolean;
}

/** Renders the built-in list and allows its options to be changed. */
export type MentionsPopupMenu = Snippet<[overrides?: Partial<MentionsPopupRenderInfo>]>;

/** Wraps, configures or replaces the contents of the pop-up panel. */
export type MentionsPopupRender = Snippet<[menu: MentionsPopupMenu, info: MentionsPopupRenderInfo]>;

/** Extract mentions on prefix and literal divider split. */
export interface MentionsConfig {
  prefix?: string | readonly string[];
  split?: string;
}
/** Slots of wrappers, fields, prompt panels and suffix Mentions. */
export type MentionsSlots = Partial<Record<'root' | 'textarea' | 'popup' | 'suffix', string>>;
/** Empty status denotes pristine FormItem; outside FormItem possible undefined. */
export interface MentionsSemanticProps extends Omit<MentionsProps, 'status'> {
  status?: FormValidateStatus;
}
/** Callback receives the parameters of an instance with disabled and status allowed. */
export type MentionsSemantic = MentionsSlots
  | ((info: { props: MentionsSemanticProps; }) => MentionsSlots | undefined);

/** Settings ConfigProvider.mentions, separate from parameters getMentions. */
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
/** Textarea looking for mentions from the carriage and inserting the selected option. */
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
  /** CSS prefix; does not change text triggers prefix. Empty/undefined inherit ConfigProvider. */
  prefixCls?: string;
  /** The full textarea string; offset offsets are measured at UTF-16. */
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
  /** Selects the popup binding side to the prefix. The textarea direction sets the dir. */
  direction?: 'ltr' | 'rtl';
  /** The name CSSMotion for the appearance of clues. An empty line disables the movement. */
  transitionName?: string;
  /** With an open list, you block the selection with the Enter key. By default, loading is followed. */
  silent?: boolean;
  /** Autofocus when the editor appears. Native autofocus has priority. */
  autoFocus?: boolean;
  /** Configures the calculation, the soft limit and the conversion of the ultra-limit input. */
  count?: InputCountConfig;
  /** Native limit of input. Overlaps maxlength and operates independently of count.max. */
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
  /** Search text and found prefix; network queries remain with the consumer. */
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
  /** Local Container; ConfigProvider.getPopupContainer is not used as upstream. */
  getPopupContainer?: () => HTMLElement | ShadowRoot;
  /** Receives the default list and its options. Content is created each time the popup opens. */
  popupRender?: MentionsPopupRender;
  classNames?: MentionsSemantic;
  /** CSS-declarations on slots. */
  styles?: MentionsSemantic;
  class?: string;
  rootClassName?: string;
  /** @defaultValue '' */
  popupClassName?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLDivElement;
}
