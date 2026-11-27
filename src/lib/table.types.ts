import type { Snippet } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type {
  AriaAttributes, HTMLAttributes, HTMLInputAttributes, HTMLTableAttributes, HTMLTdAttributes,
  HTMLThAttributes
} from 'svelte/elements';
import type { PaginationProps } from './Pagination.svelte';
import type { CheckboxChangeEvent, CheckboxProps, CheckboxValue } from './checkbox.types';
import type { DropdownProps } from './dropdown.types';
import type { SpinProps } from './spin.types';
import type { GridBreakpoint } from './grid.types';
import type { PaginationSlots } from './pagination.types';
import type { RadioChangeEvent } from './radio.types';
import type { TooltipProps } from './tooltip.types';
import type { ComponentSize, RenderEmptyContent, TableLocale } from './types';

export type TableKey = string | number;
export type TableRowKey<Row extends object> = keyof Row | ((record: Row) => TableKey);
export type TableSortOrder = 'ascend' | 'descend';
export type TableMode = 'client' | 'server';
export type TableFixed = boolean | 'start' | 'end';
export type TableLayout = 'auto' | 'fixed';
export type TableAlign = 'start' | 'end' | 'left' | 'right' | 'center' | 'justify' | 'match-parent';
export type TableDataIndex<Row extends object> = keyof Row | readonly (string | number)[];
export type TableFilterValue = TableKey | boolean;
export type TableFilters = Record<string, TableFilterValue[]>;
export type TableFilterMode = 'menu' | 'tree';

export interface TableFilterOption {
  /** The contents of the label. Built-in search composes strings and numbers. */
  text: RenderEmptyContent;
  value: TableFilterValue;
  children?: readonly TableFilterOption[];
}

/** Custom search gets the current query and the original option. */
export type TableFilterSearch = boolean | ((input: string, option: TableFilterOption) => boolean);

export interface TableFilterConfirmOptions {
  closeDropdown: boolean;
}

export interface TableFilterResetOptions {
  confirm?: boolean;
  closeDropdown?: boolean;
}

/** Argument snip of the custom filter. The changes remain in the draft until confirm. */
export interface TableFilterDropdownProps {
  prefixCls: string;
  selectedKeys: readonly TableFilterValue[];
  setSelectedKeys: (keys: readonly TableFilterValue[]) => void;
  /** Confirms the draft. A call without an argument closes the panel. */
  confirm: (options?: TableFilterConfirmOptions) => void;
  /** Restores the initial draft. Options manage clearing and closing. */
  clearFilters: (options?: TableFilterResetOptions) => void;
  filters?: readonly TableFilterOption[];
  /** Closes the panel without the use of a draft. */
  close: () => void;
  visible: boolean;
}

/** Dropdown parameters. Table provides a button and panel content. */
export interface TableFilterDropdownOptions extends Omit<
  DropdownProps, 'children' | 'ref' | 'defaultOpen' | 'popupRender' | 'onOpenChange'
> {
  popupRender?: Snippet<[origin: Snippet]>;
  onOpenChange?: (open: boolean) => void;
}

export interface TableSorter {
  columnKey: string;
  order: TableSortOrder;
}

/** Table passes the active sort direction before applying its sign to the comparison. */
export type TableSortCompare<Row extends object> = (
  left: Row, right: Row, order?: TableSortOrder | null
) => number;

export interface TableColumnSorter<Row extends object> {
  compare?: TableSortCompare<Row>;
  /** Large numerical priorities are compared first. Zero includes a combination. */
  multiple?: number;
}

export type TableColumnTitle<Row extends object> =
  Exclude<RenderEmptyContent, Snippet | undefined> | Snippet<[info: TableColumnTitleProps<Row>]>;

/** Values Table passes to leaf and group headers. */
export interface TableColumnTitleProps<Row extends object> {
  /** Criteria in the order of the order is null for an inactive criterion. */
  readonly sortColumns: readonly { column: TableColumn<Row>; order: TableSortOrder | null; }[];
  /** Applied filters, without a draft open panel and rejected requests. */
  readonly filters: Readonly<Record<string, readonly TableFilterValue[]>>;
}

export type TableSorterTooltipTarget = 'full-header' | 'sorter-icon';

/** Built-in Tooltip uses a sorting button or its decorative icon. */
export interface TableSorterTooltipProps
  extends Omit<TooltipProps, 'children' | 'overlay' | 'class' | 'style'> {
  /** @defaultValue 'full-header' */
  target?: TableSorterTooltipTarget;
}

/** Attributes and Svelte events of a separate cell. Zero span passes it. */
export interface TableCellProps extends Omit<HTMLTdAttributes, 'children' | 'colspan' | 'rowspan'> {
  colSpan?: number;
  rowSpan?: number;
}

/** DOM attributes and Svelte events lines. Cells remain at Table. */
export type TableRowProps = Omit<HTMLAttributes<HTMLTableRowElement>, 'children'>;

/** Column with permitted string key. The key is unique in the whole tree. */
export interface TableColumn<Row extends object> {
  key: string;
  /** Receives composite content. Snippet of the top level receives the status of Table. */
  title?: TableColumnTitle<Row>;
  /** The string denotes a literal key. An array sets the way, including array indices. */
  dataIndex?: TableDataIndex<Row>;
  /**
   * Index refers to adjacent rows. Table passes the original value as the third argument. The
   * snippet also accepts two arguments.
   */
  render?: Snippet<[record: Row, index: number, value?: unknown]>;
  /** Allows you to update the contents of the cell relative to the last received entry. */
  shouldCellUpdate?: (record: Row, previousRecord: Row) => boolean;
  sorter?: boolean | TableSortCompare<Row> | TableColumnSorter<Row>;
  /** Explicit null leaves a column without a direction under the control of the owner. */
  sortOrder?: TableSortOrder | null;
  /** Is read when creating a table. */
  defaultSortOrder?: TableSortOrder | null;
  /** Replaces the direction cycle of the table for this column. */
  sortDirections?: readonly (TableSortOrder | null)[];
  /** Replacing decorative arrows. Snippet receives the displayed order. */
  sortIcon?: Snippet<[info: { sortOrder: TableSortOrder | null; }]>;
  /** Overlaps the table setting for this column, including false. */
  showSorterTooltip?: boolean | TableSorterTooltipProps;
  filters?: readonly TableFilterOption[];
  /** Replaces the panel with contents. Snippet of the top level receives a draft and operations. */
  filterDropdown?: Exclude<RenderEmptyContent, Snippet> | Snippet<[info: TableFilterDropdownProps]>;
  /** Configures placement, triggers, opening and panel wrapping. */
  filterDropdownProps?: TableFilterDropdownOptions;
  /** Applies a built-in filter when closed. @defaultValue false */
  filterOnClose?: boolean;
  /** Replaces the decorative icon. Snippet of the top level receives the status of the filter. */
  filterIcon?: Exclude<RenderEmptyContent, Snippet> | Snippet<[filtered: boolean]>;
  onFilter?: (value: TableFilterValue, record: Row) => boolean;
  filterMultiple?: boolean;
  /** Choosing a filter view. @defaultValue 'menu' */
  filterMode?: TableFilterMode;
  /** Shows the search field. In the tree, the search highlights matches. */
  filterSearch?: TableFilterSearch;
  /** Adds an indication of the active filter regardless of the selected values. */
  filtered?: boolean;
  /** Manages column values. The values of null and [] set an empty filter. */
  filteredValue?: readonly TableFilterValue[] | null;
  /** Initial column values. Read when creating a table. */
  defaultFilteredValue?: readonly TableFilterValue[] | null;
  /** The reset button restores defaultFilteredValue in the draft menu. */
  filterResetToDefaultFilteredValue?: boolean;
  align?: TableAlign;
  /** Cuts the line. True includes a native title for strings and numbers. */
  ellipsis?: boolean | { showTitle?: boolean; };
  /** Complements the classes of the title and each data cell of this column. */
  className?: string;
  /** The data cells of this column become th with the specified scope. */
  rowScope?: 'row' | 'rowgroup';
  /** Overrides the width of the header in the columns. Zero hides the cell. */
  colSpan?: number;
  /** Redefines the height of the header in strings. Zero hides the cell. */
  rowSpan?: number;
  /** Attributes and spans of the data cell. index is the position in the disclosed page. */
  onCell?: (record: Row, index: number) => TableCellProps | void;
  /** Attributes of the header with priority over spans columns. */
  onHeaderCell?: (column: TableColumn<Row>) => TableCellProps | void;
  /** Removes the column from DOM, saving its sorting and data filters. @defaultValue false */
  hidden?: boolean;
  /** Subsidiary columns form the next level of the title. */
  children?: TableColumnsType<Row>;
  /** Limits the appearance of the top-level column to the active breakpoint Grid. */
  responsive?: readonly GridBreakpoint[];
  width?: number | string;
  /** Minimal width in px for auto or for the width of a virtual cell. */
  minWidth?: number;
  /** Sheet inherits the consolidation of the group. False is clearly disabling inheritance. */
  fixed?: TableFixed;
}

export type TableColumnType<Row extends object> = TableColumn<Row>;
export type TableColumnsType<Row extends object> = readonly TableColumn<Row>[];

/** The entrance definition. Table displays missing key from dataIndex or position. */
export interface TableColumnInput<Row extends object>
  extends Omit<TableColumn<Row>, 'key' | 'children'> {
  key?: TableKey;
  children?: readonly TableColumnInput<Row>[];
}

/** Common properties of columns. Subsidiary Tree is set in columns. */
export type TableColumnDefaults<Row extends object> = Partial<Omit<TableColumnInput<Row>, 'children'>>;

/** The group has its own title, and the data fields are at its child columns. */
export interface TableColumnGroupType<Row extends object>
  extends Omit<TableColumn<Row>, 'children' | 'dataIndex'> {
  children: TableColumnsType<Row>;
}

export type TableRowSelectMethod = 'all' | 'none' | 'invert' | 'single' | 'multiple';
export type TableRowSelectionType = 'checkbox' | 'radio';
export type TableSelectionPreset = 'SELECT_ALL' | 'SELECT_INVERT' | 'SELECT_NONE';

/** The menu command receives the available keys of the current page. */
export interface TableSelectionItem {
  key: string;
  /** Command label, including nested arrays and snippets. */
  text: RenderEmptyContent;
  onSelect?: (changeableRowKeys: TableKey[]) => void;
}

/** Attributes of control. Proven and initial condition sets Table. */
export interface TableSelectionControlProps extends Omit<
  HTMLInputAttributes,
  'type' | 'value' | 'checked' | 'defaultChecked' | 'children' | 'indeterminate' | 'size' | 'class'
> {
  class?: string;
  value?: CheckboxValue;
  indeterminate?: boolean;
  prefixCls?: string;
  autoFocus?: boolean;
  tabIndex?: number;
  onClick?: CheckboxProps['onClick'];
  onChange?: (event: CheckboxChangeEvent | RadioChangeEvent) => void;
}

export interface TableRowSelection<Row extends object> {
  /** Mode of one or more selected keys. @defaultValue 'checkbox' */
  type?: TableRowSelectionType;
  /** Managed keys inside rowSelection. New values are taken by the owner. */
  selectedRowKeys?: readonly TableKey[];
  /** Initial mark before the first interaction. */
  defaultSelectedRowKeys?: readonly TableKey[];
  /** Saves the selected records after they are deleted from dataSource. */
  preserveSelectedRowKeys?: boolean;
  onChange?: (keys: TableKey[], rows: Row[], info: { type: TableRowSelectMethod; }) => void;
  /** Is called up to onChange when interacting with one line. */
  onSelect?: (row: Row, checked: boolean, rows: Row[], nativeEvent: Event) => void;
  /** true enables all built-in commands. The array determines item order. */
  selections?: boolean | readonly (TableSelectionItem | TableSelectionPreset)[];
  /** Hide checkbox and menu in the column title. */
  hideSelectAll?: boolean;
  getTitleCheckboxProps?: () => TableSelectionControlProps;
  /** Replacing the hat. Snippet of the top level receives checkbox, Radio it is missing. */
  columnTitle?: Exclude<RenderEmptyContent, Snippet> | Snippet<[checkbox: Snippet | undefined]>;
  /** Snippet receives a mark, a record, an index among neighbors and initial control. */
  renderCell?: Snippet<[checked: boolean, record: Row, index: number, origin: Snippet]>;
  /** Attributes of the selection cell. The index refers to the entire opened page. */
  onCell?: TableColumn<Row>['onCell'];
  fixed?: TableFixed;
  columnWidth?: string | number;
  align?: TableColumn<Row>['align'];
  getCheckboxProps?: (record: Row) => TableSelectionControlProps;
  /** False binds the marks of parents and descendants. @defaultValue true */
  checkStrictly?: boolean;
}

/** The state of the switch. onExpand is tied to this line. */
export interface TableExpandIconInfo<Row extends object = object> {
  prefixCls: string;
  record: Row;
  expanded: boolean;
  expandable: boolean;
  disabled: boolean;
  ariaControls?: string;
  /** The supplied event stops bubbling to the row. */
  onExpand: (event?: Event) => void;
}

export interface TableExpandable<Row extends object> {
  /** Snippet details. Without it, nested lines are revealed. */
  expandedRowRender?: Snippet<[record: Row, index: number, indent: number, expanded: boolean]>;
  /** Saves the hidden details of the lines in DOM. @defaultValue false */
  forceRender?: boolean;
  /** Classes of details and nested entries. */
  expandedRowClassName?: string | ((record: Row, index: number, indent: number) => string);
  /** Replaces the toggle and receives the default button in origin. */
  expandIcon?: Snippet<[info: TableExpandIconInfo<Row>, origin: Snippet]>;
  /** Managed keys; the new value is taken by the owner through onExpandedRowsChange. */
  expandedRowKeys?: readonly TableKey[];
  /** Initial keys; subsequent changes do not reinitialize the state. */
  defaultExpandedRowKeys?: readonly TableKey[];
  /** Reveals the entry of the initial page if defaultExpandedRowKeys is not specified. */
  defaultExpandAllRows?: boolean;
  /** The field of nested records. @defaultValue 'children' */
  childrenColumnName?: string;
  /** Indentation of each level of nesting in pixels. @defaultValue 15 */
  indentSize?: number;
  /** Switches the opening by clicking on the line. */
  expandRowByClick?: boolean;
  /** Adds the column automatically and shows the tree switch. @defaultValue true */
  showExpandColumn?: boolean;
  onExpand?: (expanded: boolean, record: Row) => void;
  onExpandedRowsChange?: (keys: TableKey[]) => void;
  rowExpandable?: (record: Row) => boolean;
  /** Expand column header content. The number 0 renders as text. */
  columnTitle?: RenderEmptyContent;
  columnWidth?: number | string;
  fixed?: TableFixed;
}

interface TableSemanticGroup {
  wrapper?: string;
  row?: string;
  cell?: string;
}

/** Semantic areas of the table. The values of styles are written in rows CSS. */
export interface TableSemanticSlots {
  root?: string;
  section?: string;
  title?: string;
  footer?: string;
  content?: string;
  header?: TableSemanticGroup;
  body?: TableSemanticGroup;
  pagination?: PaginationSlots;
}

/** The string of the group draws up a wrapper of the hats or body or the root of pagination. */
export interface TableClassNameSlots
  extends Omit<TableSemanticSlots, 'header' | 'body' | 'pagination'> {
  header?: string | TableSemanticGroup;
  body?: string | TableSemanticGroup;
  pagination?: string | PaginationSlots;
}

export type TableSemantic<Row extends object, Slots extends TableClassNameSlots = TableSemanticSlots>
  = Slots | ((info: { props: TableProps<Row>; }) => Slots | undefined);

/** Provider settings are suitable for tables with different types of records. */
export type TableConfigSemantic<Slots extends TableClassNameSlots = TableSemanticSlots>
  = Slots | (<Row extends object>(info: { props: TableProps<Row>; }) => Slots | undefined);

/** General key settings, scrolling and registration of the provider's tables. */
export interface TableConfig {
  /** The field or function to record tables that inherit this key. */
  rowKey?: PropertyKey | { resolve(record: object): TableKey; }['resolve'];
  /** The value is used entirely in the absence of local Table.scroll. */
  scroll?: TableScrollOptions;
  expandable?: Pick<TableExpandable<object>, 'expandIcon'>;
  class?: string;
  style?: string;
  classNames?: TableConfigSemantic<TableClassNameSlots>;
  styles?: TableConfigSemantic;
}

/** Vertical side and logical alignment of the pager relative to the table. */
export type TablePaginationPlacement = 'topStart' | 'topCenter' | 'topEnd'
  | 'bottomStart' | 'bottomCenter' | 'bottomEnd' | 'none';

/** Configure the general status of the page and both instances of Pagination. */
export interface TablePaginationConfig extends PaginationProps {
  /** The first option for each side. An empty array and an ['none'] hide both pagers. */
  placement?: readonly TablePaginationPlacement[];
}

/** Scroll area dimensions and reset after custom data changes. */
export interface TableScrollOptions {
  /** true sets the automatic width by content with a minimum of 100%. */
  x?: number | string | true;
  y?: number | string;
  /** Resets vertical scrolling after sorting, filter and pagination. */
  scrollToFirstRowOnChange?: boolean;
}

/** Displacements of fixed parts relative to the window or a given scrolling area. */
export interface TableSticky {
  /** Upper indentation of the cap in the pixels. @defaultValue 0 */
  offsetHeader?: number;
  /** Bottom indentation of the fixed result in pixels. @defaultValue 0 */
  offsetSummary?: number;
  /** The lower indentation of an additional strip in the pixels. @defaultValue 0 */
  offsetScroll?: number;
  /** Is caused after the appearance of DOM. By default, the table window is used. */
  getContainer?: () => HTMLElement | Window | null | undefined;
}

export interface TableSummaryProps {
  children?: Snippet;
}

export type TableSummaryRowProps = HTMLAttributes<HTMLTableRowElement>;

export interface TableSummaryCellProps extends Omit<TableCellProps, 'align'> {
  /** Visible column index, including selection and expansion columns. */
  index: number;
  align?: TableAlign;
  children?: Snippet;
}

/** Group of final lines. Placement is known table and at SSR. */
export interface TableSummaryConfig<Row extends object> {
  /** At scroll.y or sticky fixes the outcome. True is equivalent to 'bottom'. */
  fixed?: boolean | 'top' | 'bottom';
  render: Snippet<[data: readonly Row[]]>;
}

/** The absolute position or address of the current page line. top has priority. */
export interface TableScrollConfig {
  top?: number;
  index?: number;
  key?: TableKey;
  align?: ScrollLogicalPosition;
  offset?: number;
}

/** The interface of a custom virtualizer with its own coordinate system. */
export interface TableBodyScrollHandle {
  /** Physical horizontal position, negative in RTL. */
  scrollLeft: number;
  scrollTo?: (config: TableScrollConfig) => void;
}

/** Native scroll event or coordinate communicated by the virtualizer. */
export interface TableBodyScrollEvent {
  currentTarget?: HTMLElement;
  scrollLeft?: number;
}

/** Connects your own body with a cap, results and TableRef.scrollTo. */
export interface TableBodyRenderInfo {
  readonly scrollbarSize: number;
  /** Svelte attachment for DOM or check-in with returned cleanup. */
  ref: (target: HTMLElement | TableBodyScrollHandle) => () => void;
  onScroll: (event: TableBodyScrollEvent) => void;
}

/** Snippet receives the root records of the processed page and owns body markings. */
export type TableBodyRender<Row extends object> =
  Snippet<[data: readonly Row[], info: TableBodyRenderInfo]>;

/** Semantic tag of the default element, including within the virtual window. */
export type TableElementTag = 'table' | 'thead' | 'tbody' | 'tr' | 'th' | 'td';

interface TableElementAttributeMap {
  table: Omit<HTMLTableAttributes, 'children'>;
  thead: Omit<HTMLAttributes<HTMLTableSectionElement>, 'children'>;
  tbody: Omit<HTMLAttributes<HTMLTableSectionElement>, 'children'>;
  tr: TableRowProps;
  td: Omit<HTMLTdAttributes, 'children'>;
  th: Omit<HTMLThAttributes, 'children'>;
}

type TableDataAttributes = {
  [name: `data-${string}`]: string | number | boolean | undefined;
};

export type TableElementAttributes<Tag extends TableElementTag> = TableElementAttributeMap[Tag]
  & TableDataAttributes;

/** Forward attributes, children, and ref to the actual element with the corresponding semantics. */
export interface TableElementRenderInfo<Tag extends TableElementTag = TableElementTag> {
  tag: Tag;
  attributes: TableElementAttributes<Tag>;
  children: Snippet;
  ref: Attachment<HTMLElement>;
}

/** HTML element name or a snippet with the supplied attributes and default child nodes. */
export type TableElement<Tag extends TableElementTag> =
  string | Snippet<[info: TableElementRenderInfo<Tag>]>;

export interface TableHeaderComponents {
  /** Table of a separate cap and fixed results at scroll.y or sticky. */
  table?: TableElement<'table'>;
  wrapper?: TableElement<'thead'>;
  row?: TableElement<'tr'>;
  cell?: TableElement<'th'>;
}

export interface TableBodyComponents {
  wrapper?: TableElement<'tbody'>;
  row?: TableElement<'tr'>;
  cell?: TableElement<'td' | 'th'>;
}

export interface TableComponents<Row extends object> {
  table?: TableElement<'table'>;
  header?: TableHeaderComponents;
  /** Configures the elements of the body or gives scroll to a separate renderer. */
  body?: TableBodyComponents | TableBodyRender<Row>;
}

/** Methods bind:this. Root DOM-knot is available via bind:nativeElement. */
export interface TableRef {
  scrollTo(config: TableScrollConfig): void;
}

export interface TableChange<Row extends object> {
  action: 'sort' | 'paginate' | 'filter';
  pagination: { current: number; pageSize: number; total: number; };
  sorter: TableSorter | null;
  /** A complete list of active criteria in the combination of sorts. */
  sorters?: TableSorter[];
  filters?: TableFilters;
  currentDataSource: Row[];
}

type TableLocaleContentField = 'emptyText' | 'filterApply' | 'filterConfirm' | 'filterReset'
  | 'filterEmptyText' | 'filterCheckAll' | 'selectionAll' | 'selectInvert' | 'selectNone';

/** Local dictionary Table with accessibility strings and content based on Svelte snippets. */
export type TableLocaleOverrides =
  Partial<Omit<TableLocale, TableLocaleContentField>>
  & Partial<Record<TableLocaleContentField, RenderEmptyContent>>
  & {
    expand?: string;
    collapse?: string;
    triggerAsc?: string;
    triggerDesc?: string;
    /** The field of the original dictionary. The text of the sorting action is set triggerAsc, triggerDesc and cancelSort. */
    sortTitle?: string;
  };

/** Typical table with columns, row identity, filters, sorting and pagination. */
export interface TableProps<Row extends object> extends AriaAttributes, TableDataAttributes {
  /** ID internal container of the table belonging to the current prefixCls. */
  id?: string;
  /** Passed to semantic tables along with ARIA attributes. */
  role?: HTMLTableAttributes['role'];
  /** Local Table owner overrides ConfigProvider.prefixCls. */
  prefixCls?: string;
  /** Local prefix of the list of filters; shell and tanks inherit general prefix. */
  dropdownPrefixCls?: string;
  /** Specifies the container of the filter panels and the selection command menu according to their DOM-trigger. */
  getPopupContainer?: DropdownProps['getPopupContainer'];
  /** @defaultValue 'client' */
  mode?: TableMode;
  total?: number;
  /** An empty array sets a well-known empty result. */
  dataSource?: readonly Row[] | null;
  columns: readonly TableColumnInput<Row>[];
  /** Fills missing or equal undefined properties of groups and leaves. */
  column?: TableColumnDefaults<Row>;
  rowKey?: TableRowKey<Row>;
  /** Complements line classes. index — position on the page, indent — depth in the tree. */
  rowClassName?: string | ((record: Row, index: number, indent: number) => string);
  /** Attributes of the data line. index is the position in the entire opened page. */
  onRow?: (record: Row, index: number) => TableRowProps | void;
  /** Attributes of the hat line. index - the level of the visible columns after their placement. */
  onHeaderRow?: (columns: TableColumnsType<Row>, index: number) => TableRowProps | void;
  /** Illumination of strings when hovering; the change immediately updates the design. @defaultValue true */
  rowHoverable?: boolean;
  /** Displays column header, saving data, caption and panels. @defaultValue true */
  showHeader?: boolean;
  /** Maintenances bind:sorter. */
  sorter?: TableSorter | null;
  /** Initial local value. Later prop changes do not reinitialize state. */
  defaultSorter?: TableSorter | null;
  /** Direction cycle for columns without its own list. */
  sortDirections?: readonly (TableSortOrder | null)[];
  /** Default tooltip for the next sort direction in sortable columns. */
  showSorterTooltip?: boolean | TableSorterTooltipProps;
  /** Maintenances bind:filters. */
  filters?: TableFilters;
  /** Initial local value. Later prop changes do not reinitialize state. */
  defaultFilters?: Readonly<Record<string, readonly TableFilterValue[]>>;
  /** Maintenances bind:current. */
  current?: number;
  /** @defaultValue 1 */
  defaultCurrent?: number;
  /** Maintenances bind:pageSize. */
  pageSize?: number;
  /** @defaultValue 10 */
  defaultPageSize?: number;
  pagination?: false | TablePaginationConfig;
  /** @defaultValue false */
  rowSelection?: boolean | TableRowSelection<Row>;
  /** Maintenances bind:selectedRowKeys. */
  selectedRowKeys?: TableKey[];
  defaultSelectedRowKeys?: readonly TableKey[];
  onChange?: (change: TableChange<Row>) => void;
  onSelectionChange?: (keys: TableKey[], rows: Row[], info: { type: 'single' | 'all'; }) => void;
  expandable?: TableExpandable<Row>;
  /** The object configures the nested Spin. If spinning is omitted, it is requested immediately. */
  loading?: boolean | SpinProps;
  disabled?: boolean;
  /** @defaultValue false */
  bordered?: boolean;
  size?: ComponentSize;
  /** Panel in front of the table; receives sorted/filtered entries of the current page. */
  title?: Snippet<[data: readonly Row[]]>;
  /** Panel after the table; receives the same page entries, including an empty array. */
  footer?: Snippet<[data: readonly Row[]]>;
  /** The final rows inside the table; get the records of the current page. */
  summary?: Snippet<[data: readonly Row[]]> | TableSummaryConfig<Row>;
  /** Composite label of the table. Null and undefined skip caption. */
  caption?: RenderEmptyContent;
  /** Local table labels and contents of an empty cell. */
  locale?: TableLocaleOverrides;
  empty?: Snippet;
  components?: TableComponents<Row>;
  scroll?: TableScrollOptions;
  /** Specifies the width algorithm of a regular table. The virtual window uses a common grid. */
  tableLayout?: TableLayout;
  sticky?: boolean | TableSticky;
  /** Limits the number of rows in DOM at a given scroll.y. @defaultValue false */
  virtual?: boolean;
  /** In virtual mode notifies about vertical scrolling. */
  onScroll?: (event: Event & { currentTarget: HTMLDivElement; }) => void;
  nativeElement?: HTMLDivElement;
  'aria-label'?: string;
  classNames?: TableSemantic<Row, TableClassNameSlots>;
  styles?: TableSemantic<Row>;
  /** Complements the root class and filter panels. */
  rootClassName?: string;
  class?: string;
  style?: string;
}
