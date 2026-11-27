import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { VirtualScrollAlign } from './virtual-list.engine';
import type { VirtualScrollOffset, VirtualScrollOffsetInfo } from './virtual-list.types';
import type { TreeMotionConfig } from './tree-motion.types';
export type TreeKey = string | number | bigint;
export type TreeExpandAction = false | 'click' | 'doubleClick';
export type TreeDropPosition = -1 | 0 | 1;
export type TreeScrollAlign = VirtualScrollAlign;
export type TreeScrollOffsetInfo = VirtualScrollOffsetInfo<TreeKey>;
/** The function receives measured/estimated dimensions; NaN/Infinity is replaced by zero. */
export type TreeScrollOffset = VirtualScrollOffset<TreeKey>;
/** Position either key/index with alignment; autoExpand adds only the target key. */
export type TreeScrollConfig = number | { top?: number; left?: number; autoExpand?: never; }
  | ({ align?: TreeScrollAlign; offset?: TreeScrollOffset; } & (
    { key: TreeKey; autoExpand?: boolean; } | { index: number; autoExpand?: never; }
  ));
/** Methods bind:this; nativeElement is provided by a separate bindable prop. */
export interface TreeRef {
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  /** Null/undefined shows scrollbar; the missing key doesn't change position. */
  scrollTo: (config?: TreeScrollConfig | null) => void;
}
/** The names of data fields; the empty string uses the standard key/title/children. */
export interface TreeFieldNames {
  key?: string;
  title?: string;
  children?: string;
}

/** Data model settings createTree; change fieldNames is specified by a new object. */
export interface TreeModelConfig {
  fieldNames?: TreeFieldNames;
}

/** Entity data models: the original node and the way nodes from the root to it inclusive. */
export interface TreeDataEntity<Data extends object = TreeDataNode> {
  node: Data;
  nodes: Data[];
  index: number;
  key: TreeKey;
  pos: string;
  level: number;
  parent: TreeDataEntity<Data> | undefined;
  children?: TreeDataEntity<Data>[];
}

/** Data utilities Tree; methods DOM-component are described separately in TreeRef. */
export interface TreeInstance<Data extends object = TreeDataNode> {
  /** The stable function reads the current data/config; an unknown key returns an empty path. */
  getPath: (key: TreeKey) => TreeDataEntity<Data>[];
}

/** Common node attributes; Data preserves custom payload type in snippets. */
export interface TreeBasicDataNode<Data extends object = TreeDataNode> {
  disabled?: boolean;
  disableCheckbox?: boolean;
  checkable?: boolean;
  selectable?: boolean;
  isLeaf?: boolean;
  icon?: Snippet<[TreeEventNode<Data>]>;
  /** Own switcher overlaps general render and loading; isLeaf computed for the node. */
  switcherIcon?: Snippet<[TreeEventNode<Data>]>;
  class?: string;
  style?: string;
}

/** Text, nested content or Svelte snippet with the source node. */
export type TreeTitleContent<Data extends object = TreeDataNode> =
  string | number | boolean | null | undefined | Snippet<[Data]>
  | readonly TreeTitleContent<Data>[];

export interface TreeDataNode extends TreeBasicDataNode<TreeDataNode> {
  key: TreeKey;
  title?: TreeTitleContent<TreeDataNode>;
  children?: readonly TreeDataNode[];
}

/** Recursive data with arbitrary payload and daughter field name. */
export type TreeFieldDataNode<Payload extends object, ChildFieldName extends string = 'children'> =
  Payload & TreeBasicDataNode<TreeFieldDataNode<Payload, ChildFieldName>>
  & Partial<Record<ChildFieldName, readonly TreeFieldDataNode<Payload, ChildFieldName>[]>>;

interface TreeNodeState {
  key: TreeKey;
  expanded: boolean;
  selected: boolean;
  checked: boolean;
  halfChecked: boolean;
  loaded: boolean;
  loading: boolean;
  pos: string;
  active: boolean;
  dragOver: boolean;
  dragOverGapTop: boolean;
  dragOverGapBottom: boolean;
}

/** State and canonical key overlapping payload fields of the same name; the rest of the data is saved. */
export type TreeEventNode<Data extends object = TreeDataNode> = {
  [Key in keyof Data as Key extends keyof TreeNodeState ? never : Key]: Data[Key];
} & TreeNodeState & Omit<TreeBasicDataNode<Data>, 'icon' | 'switcherIcon'>;

/** Predicate receives the original data; false disables both drag and drop on the line like Source. */
export type TreeDraggableFn<Data extends object = TreeDataNode> = (node: Data) => boolean;
/** False hides; handle snippet replaces Holder icon, including blank content. */
export interface TreeDraggableConfig<Data extends object = TreeDataNode> {
  icon?: Snippet | false | null;
  nodeDraggable?: TreeDraggableFn<Data>;
}
export type TreeDraggable<Data extends object = TreeDataNode> =
  boolean | TreeDraggableFn<Data> | TreeDraggableConfig<Data>;
/** Drop position relative to dropNode; data is not replaced by event-state objects. */
export interface TreeAllowDropInfo<Data extends object = TreeDataNode> {
  dragNode: Data;
  dropNode: Data;
  dropPosition: TreeDropPosition;
}
export type TreeAllowDrop<Data extends object = TreeDataNode> =
  (info: TreeAllowDropInfo<Data>) => boolean;
/** Native DragEvent and canonical key/state nodes; window dragend retains source node. */
export interface TreeDragInfo<Data extends object = TreeDataNode> {
  event: DragEvent;
  node: TreeEventNode<Data>;
}
export interface TreeDragEnterInfo<Data extends object = TreeDataNode> extends TreeDragInfo<Data> {
  /** Keys before deferred expansion. onExpand reports the next set after 800 ms. */
  expandedKeys: TreeKey[];
}
export interface TreeDropInfo<Data extends object = TreeDataNode> extends TreeDragInfo<Data> {
  /** State start drag before the source is folded; the data is read from the original data-link. */
  dragNode: TreeEventNode<Data>;
  /** At the beginning of drag: source key, then all the descendants, including rolled-up branches. */
  dragNodesKeys: TreeKey[];
  /** Index dropNode among siblings plus relative position -1/0/1. */
  dropPosition: number;
  dropToGap: boolean;
}
export interface TreeCheckedKeys {
  checked: readonly TreeKey[];
  halfChecked: readonly TreeKey[];
}
export interface TreeCheckInfo<Data extends object = TreeDataNode> {
  event: 'check';
  node: TreeEventNode<Data>;
  checked: boolean;
  nativeEvent?: MouseEvent | KeyboardEvent;
  checkedNodes: Data[];
  checkedNodesPositions?: { node: Data; pos: string; }[];
  halfCheckedKeys?: TreeKey[];
}

export type TreeSemanticName = 'root' | 'item' | 'itemIcon' | 'itemTitle' | 'itemSwitcher';
export type TreeClassNames = Partial<Record<TreeSemanticName, string>>;
export type TreeStyles = Partial<Record<TreeSemanticName, string>>;
export type TreeSemanticValue<Value, Data extends object = TreeDataNode> = Value
  | ((info: { props: TreeProps<Data>; }) => Value | undefined);

/** The general provider does not limit the data to a specific diagram of one tree. */
export interface TreeConfig {
  class?: string;
  style?: string;
  classNames?: TreeClassNames
    | (<Data extends object>(info: { props: TreeProps<Data>; }) => TreeClassNames | undefined);
  styles?: TreeStyles
    | (<Data extends object>(info: { props: TreeProps<Data>; }) => TreeStyles | undefined);
}

/** Tree with stable keys, disclosures, choices, markings and lazy children. */
export interface TreeProps<Data extends object = TreeDataNode> extends Omit<
  HTMLAttributes<HTMLDivElement>, 'children' | 'onselect' | 'draggable'
> {
  /** Local namespace tree and nodes; an empty line inherits ConfigProvider. */
  prefixCls?: string;
  /** @internal The composite owner's theme replaces Tree defaults and precedes user style. */
  _themeStyle?: string;
  /** @internal TreeSelect uses its own component configuration as the composite owner. */
  _componentConfig?: boolean;
  /** @internal TreeSelect UI constraints that preserve raw data and conduction. */
  _nodeDisabled?: (node: Data) => boolean;
  /** @internal TreeSelect matches the reset of active state when the mouse moves over a row. */
  _clearActiveOnMouseMove?: boolean;
  /** CSS external root; the former native contract is preserved, React style refers to inner list. */
  style?: HTMLAttributes<HTMLDivElement>['style'];
  classNames?: TreeSemanticValue<TreeClassNames, Data>;
  styles?: TreeSemanticValue<TreeStyles, Data>;
  /** Canonical fields are also accepted when Svelte's renderer or component tooling erases the generic. */
  treeData?: readonly (Data & TreeBasicDataNode<Data> & {
    key?: unknown;
    title?: unknown;
    children?: unknown;
  })[];
  /** Names key/title/children; Scheme change preserves raw data to callbacks. */
  fieldNames?: TreeFieldNames;
  /** Controlled expanded keys. Expansion changes are requested through onExpand. */
  expandedKeys?: readonly TreeKey[];
  /** Initial local value. Later prop changes do not reinitialize state. */
  defaultExpandedKeys?: readonly TreeKey[];
  /** @defaultValue false */
  defaultExpandAll?: boolean;
  /** @defaultValue true */
  defaultExpandParent?: boolean;
  /** @defaultValue false */
  autoExpandParent?: boolean;
  /** The title expands the node. With Ctrl, Meta, or Shift, it only selects. @defaultValue false */
  expandAction?: TreeExpandAction;
  /** Managed selection keys; stable keys are mandatory. */
  selectedKeys?: readonly TreeKey[];
  /** Initial local value. Later prop changes do not reinitialize state. */
  defaultSelectedKeys?: readonly TreeKey[];
  /** @defaultValue true */
  selectable?: boolean;
  /** @defaultValue false */
  multiple?: boolean;
  /** @defaultValue false */
  checkable?: boolean;
  /** @defaultValue false */
  checkStrictly?: boolean;
  checkedKeys?: readonly TreeKey[] | TreeCheckedKeys;
  /** Initial local value. Later prop changes do not reinitialize state. */
  defaultCheckedKeys?: readonly TreeKey[];
  disabled?: boolean;
  /** HTML5 drag/drop; data rearranges the consumer in onDrop. @defaultValue false */
  draggable?: TreeDraggable<Data>;
  /** Collapse motion of the group of the changed branch; false disables it. */
  motion?: TreeMotionConfig | false | null;
  /** Is checked for candidates and again before drop; by default, all positions are allowed. */
  allowDrop?: TreeAllowDrop<Data>;
  onDragStart?: (info: TreeDragInfo<Data>) => void;
  onDragEnter?: (info: TreeDragEnterInfo<Data>) => void;
  onDragOver?: (info: TreeDragInfo<Data>) => void;
  onDragLeave?: (info: TreeDragInfo<Data>) => void;
  onDragEnd?: (info: TreeDragInfo<Data>) => void;
  onDrop?: (info: TreeDropInfo<Data>) => void;
  loadedKeys?: readonly TreeKey[];
  /** Promise children's downloads; update treeData remains with the consumer. */
  loadData?: (node: TreeEventNode<Data>) => PromiseLike<unknown>;
  onExpand?: (
    keys: TreeKey[],
    info: {
      expanded: boolean;
      node: TreeEventNode<Data>;
      nativeEvent?: MouseEvent | KeyboardEvent;
    }
  ) => void;
  onSelect?: (
    keys: TreeKey[],
    info: {
      event: 'select';
      selected: boolean;
      node: TreeEventNode<Data>;
      selectedNodes: Data[];
      nativeEvent?: MouseEvent | KeyboardEvent;
    }
  ) => void;
  onCheck?: (keys: TreeKey[] | TreeCheckedKeys, info: TreeCheckInfo<Data>) => void;
  onLoad?: (keys: TreeKey[], info: { event: 'load'; node: TreeEventNode<Data>; }) => void;
  onClick?: (event: MouseEvent, node: TreeEventNode<Data>) => void;
  onDoubleClick?: (event: MouseEvent, node: TreeEventNode<Data>) => void;
  onRightClick?: (info: { event: MouseEvent; node: TreeEventNode<Data>; }) => void;
  /** Hint to the contents of the line; disabled does not block the notification. */
  onMouseEnter?: (info: { event: MouseEvent; node: TreeEventNode<Data>; }) => void;
  /** Leaving the contents of the line; node reflects the current state. */
  onMouseLeave?: (info: { event: MouseEvent; node: TreeEventNode<Data>; }) => void;
  onActiveChange?: (key: TreeKey | null) => void;
  activeKey?: TreeKey | null;
  /** @defaultValue false */
  showIcon?: boolean;
  /** @defaultValue false */
  showLine?: boolean | { showLeafIcon: boolean | Snippet<[TreeEventNode<Data>]>; };
  /** @defaultValue false */
  blockNode?: boolean;
  icon?: Snippet<[TreeEventNode<Data>]>;
  /** Renderer branches; loading takes precedence. Argument contains the calculated isLeaf. */
  switcherIcon?: Snippet<[TreeEventNode<Data>]>;
  switcherLoadingIcon?: Snippet<[TreeEventNode<Data>]>;
  titleRender?: Snippet<[Data]>;
  filterTreeNode?: (node: TreeEventNode<Data>) => boolean;
  /** @defaultValue true */
  focusable?: boolean;
  /** Restriction viewport; undefined/0 render all disclosed strings without limiting the height. */
  height?: number;
  /** The new value redefines the score of Tree tokens; the actual strings are measured separately. */
  itemHeight?: number;
  /** Undefined inherits ConfigProvider.virtual; by default virtualization enabled. */
  virtual?: boolean;
  /** Width of content for horizontal scrolling. */
  scrollWidth?: number;
  /** Automatic scroll padding for the active node. @defaultValue 0 */
  itemScrollOffset?: number;
  onScroll?: HTMLAttributes<HTMLDivElement>['onscroll'];
  rootClassName?: string;
  /** The native ref is available after mount and cleared on unmount. */
  nativeElement?: HTMLDivElement;
}

/**
 * Folder Tree: Re-click preserves selection, Ctrl/Meta switches keys, Shift selects visible range.
 * OnSelect is always reported by selected=true; removing the controlled mode preserves the last
 * received keys.
 */
export interface DirectoryTreeProps<Data extends object = TreeDataNode> extends TreeProps<Data> {
  /** Expand by interacting with the title. @defaultValue 'click' */
  expandAction?: TreeExpandAction;
  /** @defaultValue true */
  showIcon?: boolean;
  /** @defaultValue true */
  blockNode?: boolean;
}
