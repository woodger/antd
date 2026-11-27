import type { Snippet } from 'svelte';
import type { DOMAttributes, HTMLInputAttributes, HTMLAttributes } from 'svelte/elements';
import type { ComponentSize, Variant } from './types';
import type { FormValidateStatus } from './form-error-list.types';
import type { TreeEventNode, TreeExpandAction, TreeKey, TreeRef, TreeTitleContent } from './tree.types';
import type { SelectTagInfo } from './select.types';
import type { TreeSelectTokenSeparators } from './tree-select-token.engine';
import type { TreeSelectComponents, TreeSelectEditorElement } from './tree-select-components.types';
import type { PopupSourceAlign } from './popup-position.engine';
export type { TreeSelectTokenSeparators } from './tree-select-token.engine';
/** Methods bind:this. DOM-elements are provided through bindable props. */
export type TreeSelectRef = TreeRef;
/** Current AlignType without private experimental API; offsets save total Native string contract. */
export type TreeSelectPopupAlign = Omit<PopupSourceAlign, '_experimental'>;
export type TreeSelectRawValue = string | number;
export type TreeSelectLabel = string | number | boolean | null | undefined | Snippet
  | readonly TreeSelectLabel[];
type TreeSelectCheckableValue = TreeSelectLabel | bigint | Iterable<TreeSelectCheckableContent>;
/** The source contents of the checkbox are used only as a flag, without render/iteration/await. */
export type TreeSelectCheckableContent = TreeSelectCheckableValue | Promise<TreeSelectCheckableValue>;
export interface TreeSelectSuffixInfo {
  searchValue: string;
  open: boolean;
  focused: boolean;
  showSearch: boolean | undefined;
  loading: boolean | undefined;
}
export type TreeSelectSuffix = Exclude<TreeSelectLabel, Snippet> | Snippet<[TreeSelectSuffixInfo]>;
export interface TreeSelectAllowClear {
  clearIcon?: TreeSelectLabel;
  label?: string;
}
/** Empty names use standard fields; key is always taken from value field. */
export interface TreeSelectFieldNames {
  value?: string;
  label?: string;
  children?: string;
}
/** Flat list links: names id/pId fields and the value of the root parent. */
export interface TreeSelectSimpleModeConfig {
  id?: string | number;
  pId?: string | number;
  /** By default null: all nodes without a found parent become roots. */
  rootPId?: TreeSelectRawValue | null;
}
export type TreeSelectSimpleMode = boolean | TreeSelectSimpleModeConfig;
export interface TreeSelectLabeledValue {
  value: TreeSelectRawValue;
  label?: TreeSelectLabel;
  halfChecked?: boolean;
  disabled?: boolean;
}
export type TreeSelectTagInfo = SelectTagInfo<TreeSelectRawValue>;
/** Snippet receives complete omitted records without synthetic key; null/undefined choose + N... */
export type TreeSelectTagPlaceholder = string | number | boolean | null
  | readonly TreeSelectLabel[] | Snippet<[TreeSelectLabeledValue[]]>;
export type TreeSelectValue =
  TreeSelectRawValue
  | TreeSelectLabeledValue
  | readonly (TreeSelectRawValue | TreeSelectLabeledValue)[]
  | null
  | undefined;
export type TreeSelectNodeIcon<Data extends object = TreeSelectNode> = TreeTitleContent<TreeEventNode<Data>>;
interface TreeSelectBasicNode<Data extends object = TreeSelectNode> {
  value: TreeSelectRawValue;
  key?: TreeKey;
  title?: TreeSelectLabel;
  label?: TreeSelectLabel;
  disabled?: boolean;
  disableCheckbox?: boolean;
  checkable?: boolean;
  selectable?: boolean;
  isLeaf?: boolean;
  icon?: TreeSelectNodeIcon<Data>;
  switcherIcon?: TreeSelectNodeIcon<Data>;
  class?: string;
  className?: string;
  style?: string;
  [property: string]: unknown;
}
export interface TreeSelectNode extends TreeSelectBasicNode {
  children?: readonly TreeSelectNode[];
}
/** Declarative node TreeSelect.TreeNode; children contains nested ads. */
export interface TreeSelectTreeNodeProps<Data extends object = TreeSelectNode> extends TreeSelectBasicNode<Data> {
  children?: Snippet;
}
export type TreeSelectStrategy = 'SHOW_ALL' | 'SHOW_PARENT' | 'SHOW_CHILD';
/** Seeking and filtration of wood TreeSelect, including controlled searchValue. */
export interface TreeSelectSearchConfig<Data extends object = TreeSelectNode> {
  searchValue?: string;
  onSearch?: (value: string) => void;
  autoClearSearchValue?: boolean;
  filterTreeNode?: boolean | ((search: string, node: Data) => boolean);
  treeNodeFilterProp?: string;
}
export interface TreeSelectChangeInfo {
  triggerValue?: TreeSelectRawValue;
}
type TreeSelectControlSlots<Value> = Partial<Record<
  'root' | 'prefix' | 'input' | 'suffix' | 'clear' | 'content' | 'placeholder'
  | 'item' | 'itemContent' | 'itemRemove', Value
>>;
type TreeSelectPopupSlots<Value> = Partial<Record<'root' | 'item' | 'itemTitle' | 'itemSwitcher', Value>>;
export type TreeSelectClassNames = TreeSelectControlSlots<string> & {
  /** The line is assigned popup.root. */
  popup?: string | TreeSelectPopupSlots<string>;
};
export type TreeSelectStyles = TreeSelectControlSlots<string> & {
  popup?: TreeSelectPopupSlots<string>;
};
export interface TreeSelectSemanticInfo<
  ValueType extends TreeSelectValue = TreeSelectValue,
  Data extends object = TreeSelectNode,
  RootElement extends HTMLElement = HTMLDivElement,
  EditorElement extends TreeSelectEditorElement = HTMLInputElement
> {
  props: Omit<TreeSelectProps<ValueType, Data, RootElement, EditorElement>, 'disabled' | 'status' | 'variant' | 'onChange'> & {
    onChange?(
      value: ValueType,
      labels: TreeSelectLabel[] | null,
      extra: TreeSelectChangeInfo
    ): void;
    disabled: boolean;
    status?: FormValidateStatus;
    variant: Variant;
  };
}
export type TreeSelectSemanticValue<
  Slots, ValueType extends TreeSelectValue = TreeSelectValue, Data extends object = TreeSelectNode,
  RootElement extends HTMLElement = HTMLDivElement,
  EditorElement extends TreeSelectEditorElement = HTMLInputElement
> = Slots | ((info: TreeSelectSemanticInfo<ValueType, Data, RootElement, EditorElement>) => Slots | undefined);
export type TreeSelectSwitcherIcon = TreeTitleContent<TreeEventNode>;
/** Settings ConfigProvider.treeSelect. classNames and styles are used for registration. */
export interface TreeSelectConfig {
  class?: string;
  style?: string;
  variant?: Variant;
  classNames?: TreeSelectClassNames | (<ValueType extends TreeSelectValue, Data extends object,
    RootElement extends HTMLElement, EditorElement extends TreeSelectEditorElement>(
    info: TreeSelectSemanticInfo<ValueType, Data, RootElement, EditorElement>
  ) => TreeSelectClassNames | undefined);
  styles?: TreeSelectStyles | (<ValueType extends TreeSelectValue, Data extends object,
    RootElement extends HTMLElement, EditorElement extends TreeSelectEditorElement>(
    info: TreeSelectSemanticInfo<ValueType, Data, RootElement, EditorElement>
  ) => TreeSelectStyles | undefined);
  switcherIcon?: TreeSelectSwitcherIcon;
}
/** Single/multiple selection of tree knots with check strategies, search and lazy load. */
export interface TreeSelectProps<
  ValueType extends TreeSelectValue = TreeSelectValue,
  Data extends object = TreeSelectNode,
  RootElement extends HTMLElement = HTMLDivElement,
  EditorElement extends TreeSelectEditorElement = HTMLInputElement
> extends Omit<
  HTMLInputAttributes,
  keyof DOMAttributes<HTMLInputElement> | 'value' | 'defaultValue' | 'size' | 'type' | 'prefix' | 'placeholder'
>, Omit<DOMAttributes<EditorElement | HTMLInputElement>, 'children' | 'onchange' | 'oninput'> {
  /** Local namespace Select/TreeSelect; an empty line inherits ConfigProvider. */
  prefixCls?: string;
  /** Inherited prop: RTL and default placement is ConfigProvider; dir native remains a separate attribute. */
  direction?: 'ltr' | 'rtl';
  treeData?: readonly Data[];
  /** Used in the absence of treeData. */
  children?: Snippet;
  components?: TreeSelectComponents<RootElement, EditorElement>;
  fieldNames?: TreeSelectFieldNames;
  /** Flat list; false/undefined retain the nested structure. */
  treeDataSimpleMode?: TreeSelectSimpleMode;
  /** Managed value; the owner accepts the result via onChange. */
  value?: ValueType;
  /** Initial local value. Later prop changes do not reinitialize state. */
  defaultValue?: ValueType;
  /** @defaultValue false */
  multiple?: boolean;
  /** Truthy content enables standard checkboxes. The content and snippet are not rendered.
   * @defaultValue false
   */
  treeCheckable?: TreeSelectCheckableContent;
  /** Independent checkbox; also includes labelInValue. */
  treeCheckStrictly?: boolean;
  /** @defaultValue false */
  labelInValue?: boolean;
  /** The multiple limit; SHOW_PARENT and nonstrict SHOW_ALL disable the non-zero limit. */
  maxCount?: number;
  /** Truncation only string/number labels tags; callbacks and title retain full significance. */
  maxTagTextLength?: number;
  /** Visible tags; the remaining values are stored in callbacks and native FormData. */
  maxTagCount?: number | 'responsive';
  maxTagPlaceholder?: TreeSelectTagPlaceholder;
  /** Custom tag receives the label bound snippet and Source close/summary metadata. */
  tagRender?: Snippet<[TreeSelectTagInfo]>;
  /** Inherited prop is not used by current Source Overflow; does not include tag motion. */
  choiceTransitionName?: string;
  showCheckedStrategy?: TreeSelectStrategy;
  onChange?: (
    value: ValueType,
    labels: TreeSelectLabel[] | null,
    extra: TreeSelectChangeInfo
  ) => void;
  onSelect?: (value: TreeSelectRawValue, node: Data | undefined) => void;
  onDeselect?: (value: TreeSelectRawValue, node: Data | undefined) => void;
  showSearch?: boolean | TreeSelectSearchConfig<Data>;
  /** Purifies tokenized search and closes the popup without choosing the values of the tree. */
  tokenSeparators?: TreeSelectTokenSeparators;
  treeNodeLabelProp?: string;
  open?: boolean;
  /** @defaultValue false */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Ant Design 6.6.8 closes this inherited callback via onOpenChange. */
  onPopupVisibleChange?: (open: boolean) => void;
  /** Focus adds an opening to focus; click preserves the usual opening pointer. */
  showAction?: ('focus' | 'click')[];
  autoFocus?: boolean;
  tabIndex?: number;
  /** As in Source TreeSelect, does not limit search; native maxlength sets DOM-restriction. */
  maxLength?: number;
  /** Native onkeydown cancels internal processing; this hook follows the Order of Source. */
  onInputKeyDown?: DOMAttributes<EditorElement | HTMLInputElement>['onkeydown'];
  onKeyDown?: DOMAttributes<RootElement | HTMLDivElement>['onkeydown'];
  onKeyUp?: DOMAttributes<RootElement | HTMLDivElement>['onkeyup'];
  onFocus?: DOMAttributes<RootElement | HTMLDivElement>['onfocusin'];
  onBlur?: DOMAttributes<RootElement | HTMLDivElement>['onfocusout'];
  onMouseDown?: DOMAttributes<RootElement | HTMLDivElement>['onmousedown'];
  onMouseEnter?: DOMAttributes<RootElement | HTMLDivElement>['onmouseenter'];
  onMouseLeave?: DOMAttributes<RootElement | HTMLDivElement>['onmouseleave'];
  onClick?: DOMAttributes<RootElement | HTMLDivElement>['onclick'];
  placeholder?: TreeSelectLabel;
  prefix?: TreeSelectLabel;
  /** Content or snippet with field state. null/undefined use suffixIcon. */
  suffix?: TreeSelectSuffix;
  /** null hides the standard arrow. */
  suffixIcon?: TreeSelectLabel;
  /** @defaultValue false */
  allowClear?: boolean | TreeSelectAllowClear;
  onClear?: () => void;
  /** The icon of removal of the usual tag. Customary tagRender sets its content. */
  removeIcon?: TreeSelectLabel;
  /** Snippet receives the original content of the panel. */
  popupRender?: Snippet<[Snippet]>;
  notFoundContent?: TreeSelectLabel | null;
  /** @defaultValue false */
  loading?: boolean;
  treeExpandedKeys?: readonly TreeKey[];
  treeDefaultExpandedKeys?: readonly TreeKey[];
  /** @defaultValue false */
  treeDefaultExpandAll?: boolean;
  /** The title expands the node. With Ctrl, Meta, or Shift, it only selects. @defaultValue false */
  treeExpandAction?: TreeExpandAction;
  onTreeExpand?: (keys: TreeKey[]) => void;
  treeLoadedKeys?: readonly TreeKey[];
  onTreeLoad?: (keys: TreeKey[]) => void;
  /** Asynchronous download children; during the search does not start. */
  loadData?: (node: TreeEventNode<Data>) => PromiseLike<unknown>;
  /** @defaultValue false */
  treeLine?: boolean | { showLeafIcon: TreeSelectSwitcherIcon; };
  /** @defaultValue false */
  treeIcon?: TreeSelectNodeIcon;
  switcherIcon?: TreeSelectSwitcherIcon;
  /** For a known node, onChange and omitted records use a snippet with that node as the label. */
  treeTitleRender?: Snippet<[Data]>;
  /** @defaultValue 256 */
  listHeight?: number;
  /** Estimation of line height. The default is controlHeightSM + paddingXXS. */
  listItemHeight?: number;
  /** Additional indentation when scrolling to the active node. @defaultValue 0 */
  listItemScrollOffset?: number;
  /** The pinned rc-tree-select does not forward this inherited prop to Tree, so it has no effect. */
  showScrollBar?: boolean | 'optional';
  /** undefined inherits ConfigProvider.virtual. @defaultValue true */
  virtual?: boolean;
  /** False leaves the width on the content and disables virtualization. @defaultValue true */
  popupMatchSelectWidth?: boolean | number;
  /** Ant Design 6.6.8 overlaps inherited popupStyle; use styles.popup.root. */
  popupStyle?: string;
  /** Trusty animation uses `${selectPrefix}-dropdown-${animation}` instead of transitionName. */
  animation?: string;
  /** Undefined chooses `${rootPrefix}-slide-up`; an empty string disables the named motion. */
  transitionName?: string;
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  /** Shallow override selected placement; offset/overflow are replaced entirely. */
  popupAlign?: TreeSelectPopupAlign;
  /** Completely replaces the four original placements, including the apparently empty map. */
  builtinPlacements?: Readonly<Record<string, TreeSelectPopupAlign>>;
  onPopupScroll?: HTMLAttributes<HTMLDivElement>['onscroll'];
  /** Local getter receives root Select; undefined inherits ConfigProvider. */
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement | ShadowRoot;
  classNames?: TreeSelectSemanticValue<TreeSelectClassNames, ValueType, Data, RootElement, EditorElement>;
  styles?: TreeSelectSemanticValue<TreeSelectStyles, ValueType, Data, RootElement, EditorElement>;
  rootClassName?: string;
  size?: ComponentSize;
  status?: 'error' | 'warning';
  /** @defaultValue 'outlined' */
  /** Priority: variant, Form, treeSelect config, global variant, */
  variant?: Variant;
  /** Current Root; removing the custom slot returns the standard div. */
  nativeElement?: NoInfer<RootElement> | HTMLDivElement;
  /** Current editor; withdrawing the custom slot returns the standard input. */
  inputElement?: NoInfer<EditorElement> | HTMLInputElement;
}
