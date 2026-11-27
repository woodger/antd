import type { Snippet } from 'svelte';
import type { HTMLInputAttributes, HTMLAttributes } from 'svelte/elements';
import type { ComponentSize, RenderEmptyContent } from '../types';
import type { SelectAllowClear, SelectMenuItemIconInfo, SelectRenderNode, SelectSuffixInfo } from '../select/select-icons.types';
import type { SelectComponents } from '../select/select-components.types';
import type {
  SelectClassNames, SelectFieldNames, SelectFlattenOption, SelectLabelRenderInfo, SelectPopupRender, SelectRef,
  SelectSemanticValue, SelectStyle, SelectStyles, SelectTagInfo
} from '../select/select.types';

/** Shared Select methods. nativeElement and inputElement remain separate bindable props. */
export type AutoCompleteRef = SelectRef;

export type AutoCompleteClassNames = Pick<SelectClassNames,
  'root' | 'prefix' | 'input' | 'placeholder' | 'content' | 'clear' | 'popup'>;
export type AutoCompleteStyles = Pick<SelectStyles,
  'root' | 'prefix' | 'input' | 'placeholder' | 'content' | 'clear' | 'popup'>;
/** Own raw props and three normalized wrapper fields, without defaults or context applied. */
export interface AutoCompleteSemanticInfo<
  OptionType extends object = AutoCompleteItem, RootElement extends HTMLElement = HTMLDivElement,
  EditorElement extends HTMLElement = HTMLInputElement | HTMLTextAreaElement
> {
  props: Omit<AutoCompleteProps<OptionType, RootElement, EditorElement>, 'nativeElement' | 'inputElement'> & {
    popupRender: SelectPopupRender | undefined;
    onOpenChange: AutoCompleteProps<OptionType, RootElement, EditorElement>['onOpenChange'];
    popupMatchSelectWidth: AutoCompleteProps<OptionType, RootElement, EditorElement>['popupMatchSelectWidth'];
  };
}

export interface AutoCompleteOption {
  value: string;
  label?: string | number | Snippet;
  key?: string | number | bigint;
  disabled?: boolean;
  title?: string;
  class?: string;
  style?: string;
}
export interface AutoCompleteGroup {
  label?: string | number | Snippet;
  key?: string | number | bigint;
  options: readonly AutoCompleteOption[];
}
export type AutoCompleteItem = AutoCompleteOption | AutoCompleteGroup;
/** Controls the query and filtering of AutoComplete suggestions. */
export interface AutoCompleteSearchConfig<OptionType extends object = AutoCompleteItem> {
  searchIcon?: RenderEmptyContent;
  /** The predicate receives a shallow copy of the original option or group. */
  filterOption?: boolean | ((text: string, option: OptionType) => boolean);
  onSearch?: (text: string) => void;
}
export interface AutoCompleteInput {
  attributes: Pick<
    HTMLInputAttributes,
    'id'
    | 'value'
    | 'name'
    | 'placeholder'
    | 'disabled'
    | 'required'
    | 'readonly'
    | 'dir'
    | 'autocomplete'
    | 'role'
    | 'aria-expanded'
    | 'aria-controls'
    | 'aria-activedescendant'
    | 'aria-autocomplete'
    | 'aria-invalid'
    | 'aria-describedby'
    | 'aria-label'
  > & {
    class?: string;
    style?: string;
    oninput: (event: Event) => void;
    onkeydown: (event: KeyboardEvent) => void;
    onkeyup: (event: KeyboardEvent) => void;
    onclick: (event: MouseEvent) => void;
    onfocus: (event: FocusEvent) => void;
    onblur: (event: FocusEvent) => void;
  };
  register: (element: HTMLInputElement | HTMLTextAreaElement) => { destroy: () => void; };
}
/** Free text with options, suggestion selection, and a custom input snippet. */
export interface AutoCompleteProps<
  OptionType extends object = AutoCompleteItem, RootElement extends HTMLElement = HTMLDivElement,
  EditorElement extends HTMLElement = HTMLInputElement | HTMLTextAreaElement
> extends Omit<
  HTMLInputAttributes,
  'value'
  | 'defaultValue'
  | 'size'
  | 'children'
  | 'onchange'
  | 'onselect'
  | 'oninput'
  | 'onfocus'
  | 'onblur'
  | 'onkeydown'
  | 'onkeyup'
  | 'onclick'
  | 'prefix'
  | 'style'
> {
  /** Local Select namespace. An empty string inherits ConfigProvider. */
  prefixCls?: string;
  /** Replaces the entire field or just the editor. children takes precedence over components.input. */
  components?: SelectComponents<RootElement, EditorElement>;
  /** Affix content. Falsy scalars, including 0, produce no node. */
  prefix?: RenderEmptyContent;
  suffix?: SelectRenderNode<SelectSuffixInfo>;
  suffixIcon?: RenderEmptyContent;
  loadingIcon?: RenderEmptyContent;
  menuItemSelectedIcon?: SelectRenderNode<SelectMenuItemIconInfo<string>>;
  removeIcon?: SelectRenderNode<undefined>;
  loading?: boolean;
  options?: readonly OptionType[];
  /** Field names for original options and one level of groups. */
  fieldNames?: SelectFieldNames;
  /** Passive leaf content. Metadata and absolute index reflect the current flattened list. */
  optionRender?: Snippet<[SelectFlattenOption<string, OptionType>, { index: number }]>;
  /** Pure display producer. The editor retains the original string value. */
  labelRender?: (info: SelectLabelRenderInfo<string>) => RenderEmptyContent;
  /** Passed to semantic metadata. Combobox mode does not call the tag renderer. */
  tagRender?: Snippet<[SelectTagInfo<string>]>;
  /** Arbitrary string. It does not have to match an option. */
  value?: string;
  /** Initial local value. Later prop changes do not reinitialize state. */
  defaultValue?: string;
  open?: boolean;
  /** @defaultValue false */
  defaultOpen?: boolean;
  /** Inherits ConfigProvider.select. The combobox stays editable when false. */
  showSearch?: boolean | AutoCompleteSearchConfig<OptionType>;
  /** Free typing and selection. Clearing can emit undefined followed by an empty string. */
  onChange?: (value: string | undefined, option: Partial<OptionType> | undefined) => void;
  /** Reselecting also notifies the owner. The option retains its raw fields. */
  onSelect?: (value: string, option: OptionType) => void;
  onDeselect?: (value: string, option: OptionType) => void;
  onOpenChange?: (open: boolean) => void;
  onClear?: () => void;
  onInputKeyDown?: (event: KeyboardEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;
  onClick?: (event: MouseEvent) => void;
  onMouseDown?: (event: MouseEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onPopupScroll?: HTMLAttributes<HTMLDivElement>['onscroll'];
  /**
   * The local getter receives the Select root and overrides ConfigProvider. undefined inherits the
   * provider. Without a shared getter, positioning stays native.
   */
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement | ShadowRoot;
  /** @defaultValue false */
  backfill?: boolean;
  /** @defaultValue false */
  defaultActiveFirstOption?: boolean;
  /** @defaultValue false */
  allowClear?: boolean | SelectAllowClear;
  notFoundContent?: string | number | Snippet | null;
  /** @defaultValue true */
  popupMatchSelectWidth?: boolean | number;
  /** @defaultValue 256 */
  listHeight?: number;
  /** An omitted prop inherits ConfigProvider. An explicit undefined enables the upstream default. */
  virtual?: boolean;
  /** Estimated height before measurement. Defaults to token.controlHeight, and 0 disables windowing. */
  listItemHeight?: number;
  showScrollBar?: boolean | 'optional';
  /** Most recent active value in a microtask. null means no active row. */
  onActive?: (value: string | null) => void;
  size?: ComponentSize;
  status?: 'error' | 'warning';
  /** @defaultValue 'outlined' */
  /** Reads Select config. A local variant overrides Form and the provider. */
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  /** For a custom control, apply attributes and register from the snippet context. */
  children?: Snippet<[AutoCompleteInput]>;
  class?: string;
  /** The root and popup receive the same class. */
  rootClassName?: string;
  classNames?: SelectSemanticValue<AutoCompleteClassNames, AutoCompleteSemanticInfo<OptionType, RootElement, EditorElement>['props']>;
  styles?: SelectSemanticValue<AutoCompleteStyles, AutoCompleteSemanticInfo<OptionType, RootElement, EditorElement>['props']>;
  /**
   * A CSS object and the existing CSS string style the single public root. Class and CSS string
   * preserve the input's inherited color. Control semantics set independent colors.
   */
  style?: SelectStyle | null;
  /** The pure producer also runs while closed and during SSR. A nullish result leaves the popup empty. */
  popupRender?: SelectPopupRender;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: NoInfer<RootElement> | HTMLDivElement;
  /** The native ref is available after mount and cleared on unmount. */
  inputElement?: NoInfer<EditorElement> | HTMLInputElement | HTMLTextAreaElement;
}
