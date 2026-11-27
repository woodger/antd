import type { Snippet } from 'svelte';
import type { HTMLInputAttributes, HTMLAttributes, DOMAttributes } from 'svelte/elements';
import type { ComponentSize, RenderEmptyContent, SelectOption } from './types';
import type { VirtualScrollAlign } from './virtual-list.engine';
import type { VirtualScrollConfig, VirtualScrollOffset, VirtualScrollOffsetInfo } from './virtual-list.types';
import type { FormValidateStatus } from './form-error-list.types';
import type { SelectComponents } from './select-components.types';
import type { SelectOptionSnapshot } from './select-data.types';
import type { SelectAllowClear, SelectMenuItemIconInfo, SelectRenderNode, SelectSuffixInfo } from './select-icons.types';

export type { SelectAllowClear, SelectMenuItemIconInfo, SelectRenderNode, SelectSuffixInfo } from './select-icons.types';

type SelectCSSValue = string | number | null | undefined;
type SelectDOMStringStyleKey = {
  [Key in keyof CSSStyleDeclaration]-?: CSSStyleDeclaration[Key] extends string ? Key : never
}[keyof CSSStyleDeclaration];
type SelectDOMStyleKey = Exclude<Extract<SelectDOMStringStyleKey, string>, 'cssText' | 'cssFloat'> | 'float';
type SelectWebkitStyleKey = Extract<SelectDOMStyleKey, `webkit${string}`> extends `webkit${infer Tail}`
  ? `Webkit${Tail}` : never;
type SelectKnownCSSProperties = Readonly<Partial<Record<SelectDOMStyleKey | SelectWebkitStyleKey, SelectCSSValue>>>;
type SelectCustomStyleKey = `--${string}` | `Webkit${string}` | `Moz${string}` | `ms${string}` | `O${string}`;
/** A normal interface with CSS properties needs no index signature. A custom-property-only interface needs its own template literal index signature. */
export type SelectCSSProperties = SelectKnownCSSProperties
  | (SelectKnownCSSProperties & Readonly<Partial<Record<SelectCustomStyleKey, SelectCSSValue>>>);
export type SelectStyle = string | SelectCSSProperties | null;
export type SelectPopupContent = string | number | boolean | null | undefined
  | Snippet<[origin: Snippet]> | readonly SelectPopupContent[];
/** Pure producer is also called when closed popup; nullish result does not replace the menu. */
export type SelectPopupRender = (originMenu: Snippet) => SelectPopupContent;
type SelectControlSlots<Content> = Partial<Record<
  'root' | 'prefix' | 'suffix' | 'input' | 'placeholder' | 'content'
  | 'item' | 'itemContent' | 'itemRemove' | 'clear', Content
>>;
export type SelectPopupClassNames = Partial<Record<'root' | 'list' | 'listItem', string>>;
export type SelectPopupStyles = Partial<Record<'root' | 'list' | 'listItem', SelectStyle>>;
export type SelectClassNames = SelectControlSlots<string> & { popup?: string | SelectPopupClassNames };
export type SelectStyles = SelectControlSlots<SelectStyle> & { popup?: SelectPopupStyles };
export type SelectSemanticValue<Slots, Props> = Slots | ((info: { props: Props }) => Slots | undefined);
export interface SelectSemanticState {
  variant: NonNullable<SelectProps['variant']>;
  status: FormValidateStatus | undefined;
  disabled: boolean;
  size: ComponentSize | undefined;
}
export interface SelectSemanticInfo<
  Value extends string | number = string,
  Mode extends 'multiple' | 'tags' | undefined = undefined,
  OptionType extends object = SelectOption<Mode extends 'tags' ? Value | string : Value>,
  LabelInValue extends boolean = false,
  RootElement extends HTMLElement = HTMLDivElement,
  EditorElement extends HTMLElement = HTMLInputElement
> {
  props: Omit<SelectProps<Value, Mode, OptionType, LabelInValue, RootElement, EditorElement>,
    keyof SelectSemanticState | 'nativeElement' | 'inputElement'> & SelectSemanticState
    & Readonly<Record<string, unknown>>;
}
/** The common provider works with AutoComplete wrapper; its raw props remains opaque. */
export interface SelectConfigSemanticInfo {
  props: Readonly<Record<string, unknown>> & SelectSemanticState;
}

/** The original key of the string; differs from the value and includes React.Key bigint. */
export type SelectScrollKey = string | number | bigint;
export type SelectScrollAlign = VirtualScrollAlign;
/** The dimensions are taken from measurements and estimates of not yet drawn strings. */
export type SelectScrollOffsetInfo = VirtualScrollOffsetInfo<SelectScrollKey>;
export type SelectScrollOffset = VirtualScrollOffset<SelectScrollKey>;
/** A number means a string index; an object sets key/index or a position top/left. */
export type SelectScrollConfig = VirtualScrollConfig<SelectScrollKey>;
/** Techniques bind:this; nativeElement/inputElement are provided separately bindable props. */
export interface SelectRef {
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  /** Null/undefined shows scrollbar without changing position. */
  scrollTo: (config?: SelectScrollConfig | null) => void;
}

/** Separators multiple/tags or custom parsing of the whole line. */
export type SelectTokenSeparators = readonly string[]
  | ((input: string) => readonly string[]);

/** Metadata of the current issuance point; the usual raw option preserves the owner's identity. */
export interface SelectFlattenOption<
  Value extends string | number = string,
  OptionType extends object = SelectOption<Value>
> {
  key: string | number | bigint;
  value: Value;
  /** The reference value of the mapped label; fieldNames can point to any field. */
  label: unknown;
  data: OptionType & Readonly<Record<string, unknown>>;
  groupOption?: boolean;
  group?: boolean;
}

/** The names of the original options fields; empty strings use standard names. */
export interface SelectFieldNames {
  value?: string;
  label?: string;
  options?: string;
  /** The default coincides with the final label field. */
  groupLabel?: string;
}

/** Labeled payload preserves raw label, including supplied/mapped custom fields. */
export interface SelectLabelValue<Value extends string | number = string> {
  value: Value;
  label?: unknown;
  /** Entrance key does not replace internal key=value. */
  key?: SelectScrollKey;
}

/** Label renderer gets metadata to nullish fallback; raw option is not added here. */
export interface SelectLabelRenderInfo<Value extends string | number = string> {
  label: unknown;
  value: Value;
  key: Value;
  disabled: boolean | undefined;
  title: unknown;
}

export type SelectValueElement<Value extends string | number, LabelInValue extends boolean> =
  LabelInValue extends true ? SelectLabelValue<Value> : Value;
export type SelectValueModel<Value extends string | number, Mode extends 'multiple' | 'tags' | undefined,
  LabelInValue extends boolean> = Mode extends 'tags' ? SelectValueElement<Value | string, LabelInValue>[]
    : Mode extends 'multiple' ? SelectValueElement<Value, LabelInValue>[] : SelectValueElement<Value, LabelInValue>;

/** Hidden tag after labelRender; label is not crossed, key coincides with typed value. */
export interface SelectOmittedTag<Value extends string | number = string, Label = unknown> {
  value: Value;
  label: Label;
  disabled?: boolean;
  title?: unknown;
  key: Value;
}

/** Snippet receives hidden selected values; null/undefined choose the original + N... */
export type SelectTagPlaceholder<Value extends string | number = string> = string | number
  | boolean | null | Snippet<[SelectOmittedTag<Value>[]]>;

/** Label – Snippet with final text; contains value/index/onClose: undefined. */
export type SelectTagInfo<Value extends string | number = string> = { label: Snippet } & ({
  isMaxTag: false;
  value: Value;
  index: number;
  disabled?: boolean;
  closable: boolean;
  onClose: (event?: Event) => void;
} | {
  isMaxTag: true;
  value?: undefined;
  index?: undefined;
  disabled: false;
  closable: false;
  onClose?: undefined;
});

/** General record Select and AutoComplete; its own record replaces parental. */
export interface SelectConfig {
  class?: string;
  style?: SelectStyle;
  variant?: SelectProps['variant'];
  classNames?: SelectSemanticValue<SelectClassNames, SelectConfigSemanticInfo['props']>;
  styles?: SelectSemanticValue<SelectStyles, SelectConfigSemanticInfo['props']>;
  showSearch?: boolean | SelectSearchConfig<string | number, object>;
  allowClear?: boolean | SelectAllowClear;
  suffixIcon?: RenderEmptyContent;
  loadingIcon?: RenderEmptyContent;
  menuItemSelectedIcon?: SelectRenderNode<SelectMenuItemIconInfo<string | number>>;
  removeIcon?: SelectRenderNode<undefined>;
}

/** Configurations controlled search and local filtration Select without network transport. */
export interface SelectSearchConfig<
  Value extends string | number = string,
  OptionType extends object = SelectOption<Value>
> {
  searchIcon?: RenderEmptyContent;
  /** Managed search string; undefined leaves a local state. */
  searchValue?: string;
  /**
   * Notifies about user search; queries and protection against old answers is made by the consumer.
   */
  onSearch?: (value: string) => void;
  /** false disables filtering; predicate obtains a surface copy of the original option/group. */
  filterOption?: boolean | ((search: string, option: OptionType) => boolean);
  /** Explicit Source search fields; several fields are combined through OR. */
  optionFilterProp?: string | readonly string[];
  /** Sorts filtered options and synthetic tags; receives the current searchValue. */
  filterSort?: (optionA: OptionType, optionB: OptionType, info: { searchValue: string }) => number;
  /** Purifies local search when choosing multiple/tags; controlled query changes the owner. */
  autoClearSearchValue?: boolean;
}

type SelectEventOption<Mode, Data extends object> = Mode extends 'tags'
  ? SelectOptionSnapshot<Data>
  : Data;

/** Single/multiple/tags with native FormData; free tags add string values. */
export interface SelectProps<
  Value extends string | number = string,
  Mode extends 'multiple' | 'tags' | undefined = undefined,
  OptionType extends object = SelectOption<Mode extends 'tags' ? Value | string : Value>,
  LabelInValue extends boolean = false,
  RootElement extends HTMLElement = HTMLDivElement,
  EditorElement extends HTMLElement = HTMLInputElement
> extends Omit<
  HTMLInputAttributes,
  'value' | 'size' | 'class' | 'style' | 'prefix' | 'onchange' | 'oninput' | 'type' | keyof DOMAttributes<HTMLInputElement>
>, Omit<DOMAttributes<EditorElement | HTMLInputElement>, 'children' | 'onchange' | 'oninput'> {
  /** Root replaces the entire field, the input is an editor inside the standard field. */
  components?: SelectComponents<RootElement, EditorElement>;
  /** Local Select namespace. An empty string inherits ConfigProvider. */
  prefixCls?: string;
  /** Affix content; Source doesn't create it for a falsy scalar, including 0. */
  prefix?: RenderEmptyContent;
  /** Static template is transmitted by an array; the function receives a state of Select. */
  suffix?: SelectRenderNode<SelectSuffixInfo>;
  suffixIcon?: RenderEmptyContent;
  loadingIcon?: RenderEmptyContent;
  menuItemSelectedIcon?: SelectRenderNode<SelectMenuItemIconInfo<Mode extends 'tags' ? Value | string : Value>>;
  removeIcon?: SelectRenderNode<undefined>;
  /** Semantic root and popup; the previous class remains at Native outer container. */
  rootClassName?: string;
  classNames?: SelectSemanticValue<SelectClassNames, SelectSemanticInfo<Value, Mode, OptionType, LabelInValue, RootElement, EditorElement>['props']>;
  styles?: SelectSemanticValue<SelectStyles, SelectSemanticInfo<Value, Mode, OptionType, LabelInValue, RootElement, EditorElement>['props']>;
  /** CSS object paints the public control; the previous CSS line remains on the outer container. */
  style?: SelectStyle;
  popupRender?: SelectPopupRender;
  /** @internal Intrinsic width for a readonly single selection in a composite owner, with the public default unchanged. */
  _autoWidth?: boolean;
  /** Blank list by default; tags can create values without options. */
  options?: readonly OptionType[];
  /** Displays the original fields value/label/options/groupLabel; the groups have one level. */
  fieldNames?: SelectFieldNames;
  /** The selected label from the raw option; an empty line uses the final fieldNames.label. */
  optionLabelProp?: string;
  /** Changes the value/defaultValue and outgoing callbacks selection to { label, value }. */
  labelInValue?: LabelInValue;
  /** Pure display renderer; returned Snippet render as Svelte content. */
  labelRender?: (info: SelectLabelRenderInfo<Mode extends 'tags' ? Value | string : Value>) => RenderEmptyContent;
  /** Passive content of the item; the selected label and native option button are saved. */
  optionRender?: Snippet<[
    SelectFlattenOption<Mode extends 'tags' ? Value | string : Value, OptionType>,
    { index: number }
  ]>;
  mode?: Mode;
  /** Manageable visibility; onOpenChange provides request. Maintained bind:open. */
  open?: boolean;
  /** Initial un controlled visibility; SSR remains closed. @defaultValue false */
  defaultOpen?: boolean;
  /** The physical angle of the popup; by default bottomLeft, in RTL – bottomRight. */
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  /** Local ?? ConfigProvider ?? true. false and numeric values keep the field width as the minimum. */
  popupMatchSelectWidth?: boolean | number;
  /** An omitted prop inherits ConfigProvider. An explicit undefined enables the upstream default. */
  virtual?: boolean;
  /** Height of internal viewport; 0 removes the restriction. @defaultValue 256 */
  listHeight?: number;
  /** Score prior to line measurement; default token.controlHeight. */
  listItemHeight?: number;
  /** True/false is specified when creating a scrollbar; optional hides it after 3 seconds. */
  showScrollBar?: boolean | 'optional';
  /** The last active value for microtask; null means the absence of an available string. */
  onActive?: (value: (Mode extends 'tags' ? Value | string : Value) | null) => void;
  /** Initial active line; the selected single value can set it when opened. */
  defaultActiveFirstOption?: boolean;
  /** Disassembly of lines in multiple/tags; the function receives the current input, including the restored paste. */
  tokenSeparators?: SelectTokenSeparators;
  /** Maximum of selected values in multiple/tags; existing/default values are not circumcised. */
  maxCount?: number;
  /** Limits the displayed text to multiple/tags; the title and the full label are saved. */
  maxTagTextLength?: number;
  /** Numerical limit or responsive measurement of visible tags; hidden values are saved. */
  maxTagCount?: number | 'responsive';
  /** Content of the summary tag without the remove button; o addicted labels remain full. */
  maxTagPlaceholder?: SelectTagPlaceholder<Mode extends 'tags' ? Value | string : Value>;
  /** Render of ordinary and consolidated tags in multiple/tags; single ignores Snippet. */
  tagRender?: Snippet<[SelectTagInfo<Mode extends 'tags' ? Value | string : Value>]>;
  /** Bind:value; multiple preserves Value[], tags also allows new string values. */
  value?: SelectValueModel<Value, Mode, LabelInValue> | null;
  /** Initial local value. Later prop changes do not reinitialize state. */
  defaultValue?: (Mode extends 'tags' ? readonly SelectValueElement<Value | string, LabelInValue>[]
    : Mode extends 'multiple' ? readonly SelectValueElement<Value, LabelInValue>[]
      : SelectValueElement<Value, LabelInValue>) | null;
  size?: ComponentSize;
  /** Priority: variant, Form, Select config, global variant, */
  variant?: 'outlined' | 'filled' | 'borderless' | 'underlined';
  /** The object specifies the search settings; the boolean turns it on or off. */
  showSearch?: boolean | SelectSearchConfig<
    Mode extends 'tags' ? Value | string : Value, OptionType
  >;
  /** @defaultValue false */
  loading?: boolean;
  notFoundContent?: RenderEmptyContent;
  onPopupScroll?: HTMLAttributes<HTMLDivElement>['onscroll'];
  /**
   * Getter gets root Select; undefined inherit ConfigProvider. Without getter saved DOM parent,
   * popup is displayed as a fixed manual.
   */
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement | ShadowRoot;
  /** @defaultValue false */
  allowClear?: boolean | SelectAllowClear;
  status?: 'error' | 'warning';
  onValueChange?: (value: SelectValueModel<Value, Mode, LabelInValue>
    | (Mode extends 'multiple' | 'tags' ? never : undefined)) => void;
  /** Receives the selected option copies. A free tag without a source option contributes {}. */
  onChange?: (
    value: SelectValueModel<Value, Mode, LabelInValue> | (Mode extends 'multiple' | 'tags' ? never : undefined),
    option: Mode extends 'multiple' | 'tags'
      ? SelectEventOption<Mode, OptionType>[]
      : OptionType | undefined
  ) => void;
  /** Fires on selection, including repeated single selection. A free tag can have an empty option. */
  onSelect?: (
    value: SelectValueElement<Mode extends 'tags' ? Value | string : Value, LabelInValue>,
    option: SelectEventOption<Mode, OptionType>
  ) => void;
  /** Removing a choice in multiple/tags; clearing all values does not cause a callback. */
  onDeselect?: (
    value: SelectValueElement<Mode extends 'tags' ? Value | string : Value, LabelInValue>,
    option: SelectEventOption<Mode, OptionType>
  ) => void;
  /** Custom clearing; called up to onChange. */
  onClear?: () => void;
  onInputKeyDown?: (event: KeyboardEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onClick?: (event: MouseEvent) => void;
  onMouseDown?: (event: MouseEvent) => void;
  onOpenChange?: (open: boolean) => void;
  class?: string;
  /** Root Select after mount; ref is purified at unmount. */
  nativeElement?: NoInfer<RootElement> | HTMLDivElement;
  /** Native editor after mount; ref is cleared at unmount. */
  inputElement?: NoInfer<EditorElement> | HTMLInputElement;
}
