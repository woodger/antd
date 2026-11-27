import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';
import type { ComponentSize } from './types';
import type { FormValidateStatus } from './form-error-list.types';

export type CascaderRawValue = string | number;
export type CascaderPath = readonly CascaderRawValue[];
export type CascaderValue<Multiple extends boolean = false> = Multiple extends true
  ? readonly CascaderPath[]
  : CascaderPath;
export type CascaderContent = string | number | boolean | null | Snippet;
export type CascaderStrategy = 'SHOW_PARENT' | 'SHOW_CHILD';

export interface CascaderOption {
  label?: CascaderContent;
  value?: CascaderRawValue;
  children?: readonly CascaderOption[];
  disabled?: boolean;
  disableCheckbox?: boolean;
  /** false keeps expansion and loadData enabled until children appear. */
  isLeaf?: boolean;
  title?: string;
  [property: string]: unknown;
}

export interface CascaderFieldNames {
  label?: string;
  value?: string;
  children?: string;
}

export interface CascaderRenderInfo<OptionType extends CascaderOption = CascaderOption> {
  path: readonly OptionType[];
  searchValue: string;
  /** Original row content, including highlighted search matches. */
  originNode: Snippet;
}

/** Searches full paths and manages the search text through showSearch. */
export interface CascaderSearchConfig<OptionType extends CascaderOption = CascaderOption> {
  filter?: (search: string, path: OptionType[], fields: CascaderFieldNames) => boolean;
  render?: Snippet<[string, OptionType[], string, Required<CascaderFieldNames>]>;
  sort?: (
    first: OptionType[],
    second: OptionType[],
    search: string,
    fields: Required<CascaderFieldNames>
  ) => number;
  /** @defaultValue true */
  matchInputWidth?: boolean;
  /** false and nonpositive numbers disable the limit. @defaultValue 50 */
  limit?: number | false;
  searchValue?: string;
  onSearch?: (search: string) => void;
  /** @defaultValue true */
  autoClearSearchValue?: boolean;
  searchIcon?: CascaderContent;
}

export type CascaderSlots<Value> = Partial<Record<
  'root' | 'prefix' | 'suffix' | 'input' | 'placeholder' | 'content'
  | 'item' | 'itemContent' | 'itemRemove',
  Value
>> & {
  popup?: Value | Partial<Record<'root' | 'list' | 'listItem', Value>>;
};

export interface CascaderSemantic {
  props: {
    multiple?: boolean;
    options?: readonly CascaderOption[];
    value?: CascaderValue<boolean>;
    open?: boolean;
    disabled: boolean;
    size: ComponentSize;
    variant: 'outlined' | 'borderless' | 'filled' | 'underlined';
    /** Resolved Form status. The local Cascader.status accepts error or warning. */
    status?: FormValidateStatus;
    /** The remaining source props pass through as provided. Narrow their types before use. */
    [property: string]: unknown;
  };
}

export type CascaderSemanticValue<Value> = CascaderSlots<Value>
  | ((info: CascaderSemantic) => CascaderSlots<Value> | undefined);

/** Inherited Cascader styling. Panel inherits only expandIcon and loadingIcon. */
export interface CascaderConfig {
  class?: string;
  style?: string;
  variant?: CascaderSemantic['props']['variant'];
  classNames?: CascaderSemanticValue<string>;
  styles?: CascaderSemanticValue<string>;
  expandIcon?: CascaderContent;
  loadingIcon?: CascaderContent;
  clearIcon?: CascaderContent;
  removeIcon?: CascaderContent;
  suffixIcon?: CascaderContent;
  searchIcon?: CascaderContent;
}

export interface CascaderTagInfo {
  label: Snippet;
  /** rc-cascader path key joined with __RC_CASCADER_SPLIT__. */
  value?: string;
  disabled: boolean;
  closable: boolean;
  index?: number;
  onClose?: (event?: Event) => void;
  /** true for the maxTagCount summary tag, which has no value, index, or onClose. */
  isMaxTag: boolean;
}

export interface CascaderOmittedTag<OptionType extends CascaderOption = CascaderOption> {
  /** Default label. A custom displayRender receives labels and options. */
  label: CascaderContent | undefined;
  labels: CascaderContent[];
  options: (OptionType | undefined)[];
  value: string;
  disabled: boolean;
}

export interface CascaderTriggerInfo {
  open: boolean;
  disabled: boolean;
  /** Svelte equivalent of cloning React children. Bind it to the native control. */
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onKeyUp: (event: KeyboardEvent) => void;
  'aria-expanded': boolean;
  'aria-controls': string;
}

/** Shared path selection contract for the popup and standalone Panel. */
export interface CascaderPanelProps<
  OptionType extends CascaderOption = CascaderOption,
  Multiple extends boolean = false
> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onchange' | 'onfocus' | 'onblur' | 'onkeydown' | 'onkeyup'
    | 'prefix' | 'placeholder'
> {
  /** Local Select/Cascader namespace. An empty string inherits ConfigProvider. */
  prefixCls?: string;
  options?: readonly OptionType[];
  /** Controlled paths. Passing undefined after a controlled value releases local state. */
  value?: CascaderValue<Multiple>;
  /** Read once when the instance is created. */
  defaultValue?: CascaderValue<Multiple>;
  /** @defaultValue false */
  multiple?: Multiple;
  /** Clearing yields undefined in single mode and an empty array in multiple mode. Missing options are preserved. */
  onChange?: (
    value: CascaderValue<Multiple> | (Multiple extends true ? never : undefined),
    options: Multiple extends true
      ? (OptionType | undefined)[][]
      : (OptionType | undefined)[] | undefined
  ) => void;
  fieldNames?: CascaderFieldNames;
  /** Allows selecting intermediate nodes in single mode. @defaultValue false */
  changeOnSelect?: boolean;
  /** @defaultValue 'SHOW_PARENT' */
  showCheckedStrategy?: CascaderStrategy;
  /** @defaultValue 'click' */
  expandTrigger?: 'click' | 'hover';
  /** The Promise is not awaited. Update options.children or isLeaf to clear the loading indicator. */
  loadData?: (selectedOptions: OptionType[]) => void;
  expandIcon?: CascaderContent;
  loadingIcon?: CascaderContent;
  /** The snippet receives the original option. originNode preserves search highlights. */
  optionRender?: Snippet<[OptionType, CascaderRenderInfo<OptionType>]>;
  notFoundContent?: CascaderContent;
  disabled?: boolean;
  direction?: 'ltr' | 'rtl';
  rootClassName?: string;
  /** The ref becomes available after mount and is cleared on unmount. */
  nativeElement?: HTMLDivElement;
}

/** Single or multiple cascader selection. value and open follow the controlled/default contract. */
export interface CascaderProps<
  OptionType extends CascaderOption = CascaderOption,
  Multiple extends boolean = false
> extends Omit<
  CascaderPanelProps<OptionType, Multiple>,
  'onkeydown' | 'onkeyup' | 'onfocus' | 'onblur'
> {
  /** @defaultValue false */
  showSearch?: boolean | CascaderSearchConfig<OptionType>;
  displayRender?: Snippet<[CascaderContent[], (OptionType | undefined)[]]>;
  open?: boolean;
  /** @defaultValue false */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Object form bypasses ConfigProvider.cascader.clearIcon. A falsy or missing icon uses the rc-select × fallback. @defaultValue true */
  allowClear?: boolean | { clearIcon?: CascaderContent; };
  onClear?: () => void;
  placeholder?: CascaderContent;
  prefix?: CascaderContent;
  suffixIcon?: CascaderContent;
  removeIcon?: CascaderContent;
  loading?: boolean;
  size?: ComponentSize;
  status?: 'error' | 'warning';
  variant?: CascaderSemantic['props']['variant'];
  classNames?: CascaderSemanticValue<string>;
  styles?: CascaderSemanticValue<string>;
  /** @defaultValue false */
  popupMatchSelectWidth?: boolean | number;
  /**
   * The local getter overrides ConfigProvider. Custom children provide their own DOM trigger.
   * CascaderPanel uses no popup container.
   */
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement | ShadowRoot;
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  popupRender?: Snippet<[Snippet]>;
  tagRender?: Snippet<[CascaderTagInfo]>;
  maxTagCount?: number | 'responsive';
  maxTagTextLength?: number;
  maxTagPlaceholder?: CascaderContent | Snippet<[CascaderOmittedTag<OptionType>[]]>;
  /** Svelte equivalent of React children. The native trigger receives handlers and ARIA attributes through the snippet. */
  children?: Snippet<[CascaderTriggerInfo]>;
  autoFocus?: boolean;
  showAction?: ('focus' | 'click')[];
  onInputKeyDown?: (event: KeyboardEvent) => void;
  tabIndex?: number;
  onkeydown?: (event: KeyboardEvent) => void;
  onkeyup?: (event: KeyboardEvent) => void;
  onfocus?: HTMLInputAttributes['onfocus'];
  onblur?: HTMLInputAttributes['onblur'];
  onPopupScroll?: HTMLAttributes<HTMLUListElement>['onscroll'];
  /** The input ref is unavailable with custom children. */
  inputElement?: HTMLInputElement;
}
