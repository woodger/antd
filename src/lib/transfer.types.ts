import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { RenderEmptyContent } from './types';

export type TransferKey = string | number | bigint;
export type TransferDirection = 'left' | 'right';
export type TransferStatus = 'warning' | 'error' | '' | 'success' | 'validating';
export type TransferContent<Args extends unknown[] = []> =
  string | number | boolean | null | undefined | Snippet<Args>;

export interface TransferItem {
  key?: TransferKey;
  title?: string;
  description?: string;
  disabled?: boolean;
}

/** Callback preserves text/metadata; ReactElement is replaced by the returned snippet. */
export type TransferRenderResult<RecordType extends object> = TransferContent<[RecordType]>
  | { label: TransferContent<[RecordType]>; value: string; };

export interface TransferRenderedItem<RecordType extends object> {
  item: RecordType;
  renderedEl: TransferContent<[RecordType]>;
  renderedText: string;
}

export type TransferSectionSlots<Value> = Partial<Record<
  'section' | 'header' | 'title' | 'body' | 'list' | 'item' | 'itemIcon' | 'itemContent' | 'footer',
  Value
>>;

export type TransferSlots<Value> = TransferSectionSlots<Value> & {
  root?: Value;
  actions?: Value;
  source?: TransferSectionSlots<Value>;
  target?: TransferSectionSlots<Value>;
};

export interface TransferSemantic {
  props: {
    disabled: boolean;
    dataSource?: readonly object[];
    targetKeys?: readonly TransferKey[];
    selectedKeys?: readonly TransferKey[];
    oneWay?: boolean;
    status?: TransferStatus;
    [property: string]: unknown;
  };
}

export type TransferSemanticValue<Value> = TransferSlots<Value>
  | ((info: TransferSemantic) => TransferSlots<Value> | undefined);

/** Settings are inherited entirely; local semantic slots overlaps context. */
export interface TransferConfig {
  class?: string;
  style?: string;
  classNames?: TransferSemanticValue<string>;
  styles?: TransferSemanticValue<string>;
  selectionsIcon?: TransferContent;
}

export interface TransferLocale {
  titles?: readonly TransferContent[];
  notFoundContent?: RenderEmptyContent;
  searchPlaceholder?: string;
  itemUnit?: string;
  itemsUnit?: string;
  remove?: string;
  selectAll?: string;
  deselectAll?: string;
  selectCurrent?: string;
  selectInvert?: string;
  removeAll?: string;
  removeCurrent?: string;
}

export interface TransferSearchOption {
  placeholder?: string;
  /** Read once when creating a list; the search at the lists is independent. */
  defaultValue?: string;
}

export type TransferPagination = boolean | {
  /** @defaultValue 10 */
  pageSize?: number;
  /** @defaultValue true */
  simple?: boolean;
  /** @defaultValue false */
  showSizeChanger?: boolean;
  /** @defaultValue false */
  showLessItems?: boolean;
};

export interface TransferActionInfo {
  disabled: boolean;
  direction: TransferDirection;
  /** Arrow that respects RTL. */
  icon: Snippet;
  /** Tie to onclick your own native control. */
  onClick: (event: MouseEvent) => void;
}

/** Your own action receives the information that upstream implements through cloneElement. */
export type TransferAction = TransferContent<[TransferActionInfo]> | {
  children: Snippet<[TransferActionInfo]>;
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
};

export type TransferSelectAllLabel = Exclude<TransferContent, Snippet>
  | ((info: { selectedCount: number; totalCount: number; }) => TransferContent);

/** Props passed to the custom body. direction is physical and flips in RTL. */
export interface TransferListBodyProps<RecordType extends object = TransferItem>
  extends TransferLocale {
  prefixCls: string;
  direction: TransferDirection;
  disabled: boolean;
  dataSource: readonly RecordType[];
  filteredItems: RecordType[];
  filteredRenderItems: TransferRenderedItem<RecordType>[];
  selectedKeys: readonly TransferKey[];
  classNames: TransferSectionSlots<string>;
  styles: TransferSectionSlots<string>;
  style?: string;
  titleText: TransferContent;
  showSearch?: boolean | TransferSearchOption;
  showSelectAll?: boolean;
  showRemove?: boolean;
  pagination?: TransferPagination;
  selectAllLabel?: TransferSelectAllLabel;
  selectionsIcon?: TransferContent;
  render?: (item: RecordType) => TransferRenderResult<RecordType>;
  renderList?: Snippet<[TransferListBodyProps<RecordType>]>;
  footer?: Snippet<[TransferListProps<RecordType>, { direction: TransferDirection; }]>;
  filterOption?: TransferProps<RecordType>['filterOption'];
  onItemSelect: (
    key: TransferKey,
    selected: boolean,
    event?: MouseEvent,
    filteredItems?: RecordType[]
  ) => void;
  onItemSelectAll: (keys: readonly TransferKey[], selected: boolean | 'replace') => void;
  onItemRemove?: (keys: readonly TransferKey[]) => void;
  onScroll: (event: Event) => void;
}

export interface TransferListProps<RecordType extends object = TransferItem>
  extends Omit<TransferListBodyProps<RecordType>,
  'filteredItems' | 'filteredRenderItems' | 'selectedKeys'> {
  checkedKeys: readonly TransferKey[];
  handleFilter: (event: Event & { currentTarget: HTMLInputElement; }) => void;
  handleClear: () => void;
}

/** Two lists; targetKeys is always set by the owner, selectedKeys can be left local. */
export interface TransferProps<RecordType extends object = TransferItem> extends Omit<
  HTMLAttributes<HTMLDivElement>, 'children' | 'onchange' | 'onscroll' | 'class'
> {
  dataSource?: readonly RecordType[];
  /** Controlled value. The component offers changes only through onChange. */
  targetKeys?: readonly TransferKey[];
  /** undefined releases local allocation; defaultSelectedKeys is missing upstream. */
  selectedKeys?: readonly TransferKey[];
  rowKey?: (record: RecordType) => TransferKey;
  render?: (record: RecordType) => TransferRenderResult<RecordType>;
  onChange?: (
    targetKeys: TransferKey[],
    direction: TransferDirection,
    moveKeys: TransferKey[]
  ) => void;
  onSelectChange?: (sourceSelectedKeys: TransferKey[], targetSelectedKeys: TransferKey[]) => void;
  onSearch?: (direction: TransferDirection, value: string) => void;
  onScroll?: (direction: TransferDirection, event: Event) => void;
  filterOption?: (value: string, record: RecordType, direction: TransferDirection) => boolean;
  /** @defaultValue false */
  showSearch?: boolean | TransferSearchOption;
  /** @defaultValue true */
  showSelectAll?: boolean;
  titles?: readonly TransferContent[];
  selectAllLabels?: readonly TransferSelectAllLabel[];
  locale?: TransferLocale;
  actions?: readonly TransferAction[];
  /** @defaultValue false */
  oneWay?: boolean;
  /** It doesn't work with children, as in Ant Design. @defaultValue false */
  pagination?: TransferPagination;
  children?: Snippet<[TransferListBodyProps<RecordType>]>;
  footer?: Snippet<[TransferListProps<RecordType>, { direction: TransferDirection; }]>;
  disabled?: boolean;
  /** Empty string inherits FormItem; success/validating is saved as source classes. */
  status?: TransferStatus;
  selectionsIcon?: TransferContent;
  classNames?: TransferSemanticValue<string>;
  styles?: TransferSemanticValue<string>;
  /** Local namespace Transfer; an empty line inherits ConfigProvider. */
  prefixCls?: string;
  rootClassName?: string;
  class?: string;
  /** Native root instead of React ref.nativeElement. Maintained bind:nativeElement. */
  nativeElement?: HTMLDivElement;
}
