import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLInputAttributes, HTMLTdAttributes } from 'svelte/elements';
import type { PaginationProps } from './Pagination.svelte';
import type { CheckboxChangeEvent, CheckboxProps, CheckboxValue } from './checkbox.types';
import type { GridBreakpoint } from './grid.types';
import type { RadioChangeEvent } from './radio.types';
import type { ComponentSize } from './types';

export type TableKey = string | number;
export type TableRowKey<Row extends object> = keyof Row | ((record: Row) => TableKey);
export type TableSortOrder = 'ascend' | 'descend';
export type TableMode = 'client' | 'server';
export type TableFixed = boolean | 'start' | 'end';
export type TableFilterValue = TableKey | boolean;
export type TableFilters = Record<string, TableFilterValue[]>;

export interface TableFilterOption {
  text: string;
  value: TableFilterValue;
}

export interface TableSorter {
  columnKey: string;
  order: TableSortOrder;
}

/** Атрибуты и Svelte events отдельной ячейки. Нулевой span пропускает её. */
export interface TableCellProps extends Omit<HTMLTdAttributes, 'children' | 'colspan' | 'rowspan'> {
  colSpan?: number;
  rowSpan?: number;
}

/** DOM-атрибуты и Svelte events строки. Ячейки остаются у Table. */
export type TableRowProps = Omit<HTMLAttributes<HTMLTableRowElement>, 'children'>;

/** Колонка данных или заголовок группы колонок. Ключ уникален во всём дереве. */
export interface TableColumn<Row extends object> {
  key: string;
  title: string;
  dataIndex?: keyof Row;
  /** Index относится к соседним записям текущей страницы или ветки. */
  render?: Snippet<[record: Row, index: number]>;
  sorter?: true | ((left: Row, right: Row) => number);
  filters?: readonly TableFilterOption[];
  onFilter?: (value: TableFilterValue, record: Row) => boolean;
  filterMultiple?: boolean;
  align?: 'left' | 'center' | 'right';
  /** Дополняет классы заголовка и каждой ячейки данных этой колонки. */
  className?: string;
  /** Ячейки данных этой колонки становятся th с указанным scope. */
  rowScope?: 'row' | 'rowgroup';
  /** Переопределяет ширину заголовка в колонках. Ноль скрывает ячейку. */
  colSpan?: number;
  /** Переопределяет высоту заголовка в строках. Ноль скрывает ячейку. */
  rowSpan?: number;
  /** Атрибуты и spans ячейки данных. index — позиция в раскрытой странице. */
  onCell?: (record: Row, index: number) => TableCellProps | void;
  /** Атрибуты заголовка с приоритетом над spans колонки. */
  onHeaderCell?: (column: TableColumn<Row>) => TableCellProps | void;
  /** Убирает колонку из DOM, сохраняя её сортировку и фильтры данных. @defaultValue false */
  hidden?: boolean;
  /** Дочерние колонки образуют следующий уровень заголовка. */
  children?: TableColumnsType<Row>;
  /** Ограничивает видимость колонки верхнего уровня активными breakpoint Grid. */
  responsive?: readonly GridBreakpoint[];
  width?: number | string;
  /** Лист наследует закрепление группы. False явно отключает наследование. */
  fixed?: TableFixed;
}

export type TableColumnType<Row extends object> = TableColumn<Row>;
export type TableColumnsType<Row extends object> = readonly TableColumn<Row>[];

/** У группы собственный заголовок, а поля данных находятся у её дочерних колонок. */
export interface TableColumnGroupType<Row extends object>
  extends Omit<TableColumn<Row>, 'children' | 'dataIndex'> {
  children: TableColumnsType<Row>;
}

export type TableRowSelectMethod = 'all' | 'none' | 'invert' | 'single' | 'multiple';
export type TableRowSelectionType = 'checkbox' | 'radio';
export type TableSelectionPreset = 'SELECT_ALL' | 'SELECT_INVERT' | 'SELECT_NONE';

/** Команда меню получает доступные ключи текущей страницы. */
export interface TableSelectionItem {
  key: string;
  text: string | Snippet;
  onSelect?: (changeableRowKeys: TableKey[]) => void;
}

/** Атрибуты контрола. Проверенное и начальное состояние задаёт Table. */
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
  /** Режим одного или нескольких выбранных ключей. @defaultValue 'checkbox' */
  type?: TableRowSelectionType;
  /** Управляемые ключи внутри rowSelection. Новые значения принимает владелец. */
  selectedRowKeys?: readonly TableKey[];
  /** Начальная отметка до первого взаимодействия. */
  defaultSelectedRowKeys?: readonly TableKey[];
  /** Сохраняет выбранные записи после их удаления из dataSource. */
  preserveSelectedRowKeys?: boolean;
  onChange?: (keys: TableKey[], rows: Row[], info: { type: TableRowSelectMethod; }) => void;
  /** Вызывается до onChange при взаимодействии с одной строкой. */
  onSelect?: (row: Row, checked: boolean, rows: Row[], nativeEvent: Event) => void;
  /** True включает все штатные команды. Порядок массива задаёт порядок пунктов. */
  selections?: boolean | readonly (TableSelectionItem | TableSelectionPreset)[];
  /** Скрывает checkbox и меню в заголовке колонки. */
  hideSelectAll?: boolean;
  getTitleCheckboxProps?: () => TableSelectionControlProps;
  /** Заменяет шапку. Snippet получает исходный checkbox, у Radio он отсутствует. */
  columnTitle?: string | Snippet<[checkbox: Snippet | undefined]>;
  /** Snippet получает отметку, запись, индекс среди соседей и исходный контрол. */
  renderCell?: Snippet<[checked: boolean, record: Row, index: number, origin: Snippet]>;
  /** Атрибуты ячейки выбора. index относится ко всей раскрытой странице. */
  onCell?: TableColumn<Row>['onCell'];
  fixed?: TableFixed;
  columnWidth?: string | number;
  align?: TableColumn<Row>['align'];
  getCheckboxProps?: (record: Row) => TableSelectionControlProps;
  /** False связывает отметки родителей и потомков. @defaultValue true */
  checkStrictly?: boolean;
}

/** Состояние переключателя. onExpand привязан к этой строке. */
export interface TableExpandIconInfo<Row extends object = object> {
  prefixCls: string;
  record: Row;
  expanded: boolean;
  expandable: boolean;
  disabled: boolean;
  ariaControls?: string;
  /** Переданное событие прекращает всплытие к строке. */
  onExpand: (event?: Event) => void;
}

export interface TableExpandable<Row extends object> {
  /** Snippet подробностей. Без него раскрываются вложенные строки. */
  expandedRowRender?: Snippet<[record: Row, index: number, indent: number, expanded: boolean]>;
  /** Сохраняет скрытые подробности строк, находящихся в DOM. @defaultValue false */
  forceRender?: boolean;
  /** Классы строки подробностей и вложенных записей. */
  expandedRowClassName?: string | ((record: Row, index: number, indent: number) => string);
  /** Заменяет переключатель и получает штатную кнопку в origin. */
  expandIcon?: Snippet<[info: TableExpandIconInfo<Row>, origin: Snippet]>;
  /** Управляемые ключи; новое значение принимает владелец через onExpandedRowsChange. */
  expandedRowKeys?: readonly TableKey[];
  /** Начальные ключи; последующие изменения не переинициализируют состояние. */
  defaultExpandedRowKeys?: readonly TableKey[];
  /** Раскрывает записи начальной страницы, если defaultExpandedRowKeys не задан. */
  defaultExpandAllRows?: boolean;
  /** Поле вложенных записей. @defaultValue 'children' */
  childrenColumnName?: string;
  /** Отступ каждого уровня вложенности в пикселях. @defaultValue 15 */
  indentSize?: number;
  /** Переключает раскрытие нажатием на строку. */
  expandRowByClick?: boolean;
  /** Добавляет колонку автоматически и показывает переключатель дерева. @defaultValue true */
  showExpandColumn?: boolean;
  onExpand?: (expanded: boolean, record: Row) => void;
  onExpandedRowsChange?: (keys: TableKey[]) => void;
  rowExpandable?: (record: Row) => boolean;
  columnTitle?: string | Snippet;
  columnWidth?: number | string;
  fixed?: TableFixed;
}

/** Настройки переключателя раскрытия для дочерних таблиц. */
export interface TableConfig {
  expandable?: Pick<TableExpandable<object>, 'expandIcon'>;
}

/** Настройки Pagination, которыми управляет Table; total вычисляется по данным. */
export type TablePaginationConfig = Pick<
  PaginationProps,
  'showSizeChanger' | 'pageSizeOptions' | 'hideOnSinglePage' | 'showTotal' | 'aria-label'
>;

/** Размеры области прокрутки и сброс после пользовательского изменения данных. */
export interface TableScrollOptions {
  x?: number | string;
  y?: number | string;
  /** Сбрасывает вертикальную прокрутку после сортировки, фильтра и пагинации. */
  scrollToFirstRowOnChange?: boolean;
}

/** Смещения закреплённых частей относительно окна или заданной области прокрутки. */
export interface TableSticky {
  /** Верхний отступ шапки в пикселях. @defaultValue 0 */
  offsetHeader?: number;
  /** Нижний отступ закреплённого итога в пикселях. @defaultValue 0 */
  offsetSummary?: number;
  /** Нижний отступ дополнительной полосы в пикселях. @defaultValue 0 */
  offsetScroll?: number;
  /** Вызывается после появления DOM. По умолчанию используется окно таблицы. */
  getContainer?: () => HTMLElement | Window | null | undefined;
}

export interface TableSummaryProps {
  children?: Snippet;
}

export type TableSummaryRowProps = HTMLAttributes<HTMLTableRowElement>;

export interface TableSummaryCellProps extends Omit<TableCellProps, 'align'> {
  /** Индекс видимой колонки с учётом колонок выделения и раскрытия. */
  index: number;
  align?: 'start' | 'end' | 'left' | 'right' | 'center' | 'justify' | 'match-parent';
  children?: Snippet;
}

/** Группа итоговых строк. Размещение известно таблице и при SSR. */
export interface TableSummaryConfig<Row extends object> {
  /** При scroll.y или sticky закрепляет итог. True равнозначно 'bottom'. */
  fixed?: boolean | 'top' | 'bottom';
  render: Snippet<[data: readonly Row[]]>;
}

/** Абсолютная позиция или адрес строки текущей страницы. top имеет приоритет. */
export interface TableScrollConfig {
  top?: number;
  index?: number;
  key?: TableKey;
  align?: ScrollLogicalPosition;
  offset?: number;
}

/** Методы bind:this. Корневой DOM-узел доступен через bind:nativeElement. */
export interface TableRef {
  scrollTo(config: TableScrollConfig): void;
}

export interface TableChange<Row extends object> {
  action: 'sort' | 'paginate' | 'filter';
  pagination: { current: number; pageSize: number; total: number; };
  sorter: TableSorter | null;
  filters?: TableFilters;
  currentDataSource: Row[];
}

/** Типизированная таблица с columns, row identity, фильтрами, сортировкой и пагинацией. */
export interface TableProps<Row extends object> {
  /** Локальный Table owner перекрывает ConfigProvider.prefixCls. */
  prefixCls?: string;
  /** Локальный префикс списка фильтров; shell и controls наследуют общий prefix. */
  dropdownPrefixCls?: string;
  /** @defaultValue 'client' */
  mode?: TableMode;
  total?: number;
  dataSource: readonly Row[];
  columns: TableColumnsType<Row>;
  rowKey?: TableRowKey<Row>;
  /** Дополняет классы строки. index — позиция на странице, indent — глубина в дереве. */
  rowClassName?: string | ((record: Row, index: number, indent: number) => string);
  /** Атрибуты строки данных. index — позиция во всей раскрытой странице. */
  onRow?: (record: Row, index: number) => TableRowProps | void;
  /** Атрибуты строки шапки. index — уровень видимых колонок после их размещения. */
  onHeaderRow?: (columns: TableColumnsType<Row>, index: number) => TableRowProps | void;
  /** Подсветка строк при наведении; изменение сразу обновляет оформление. @defaultValue true */
  rowHoverable?: boolean;
  /** Отображает заголовок колонок, сохраняя данные, caption и панели. @defaultValue true */
  showHeader?: boolean;
  /** Поддерживает bind:sorter. */
  sorter?: TableSorter | null;
  /** Начальное локальное значение; последующие изменения prop не переинициализируют состояние. */
  defaultSorter?: TableSorter | null;
  /** Поддерживает bind:filters. */
  filters?: TableFilters;
  /** Начальное локальное значение; последующие изменения prop не переинициализируют состояние. */
  defaultFilters?: Readonly<Record<string, readonly TableFilterValue[]>>;
  /** Поддерживает bind:current. */
  current?: number;
  /** @defaultValue 1 */
  defaultCurrent?: number;
  /** Поддерживает bind:pageSize. */
  pageSize?: number;
  /** @defaultValue 10 */
  defaultPageSize?: number;
  pagination?: false | TablePaginationConfig;
  /** @defaultValue false */
  rowSelection?: boolean | TableRowSelection<Row>;
  /** Поддерживает bind:selectedRowKeys. */
  selectedRowKeys?: TableKey[];
  defaultSelectedRowKeys?: readonly TableKey[];
  onChange?: (change: TableChange<Row>) => void;
  onSelectionChange?: (keys: TableKey[], rows: Row[], info: { type: 'single' | 'all'; }) => void;
  expandable?: TableExpandable<Row>;
  /** @defaultValue false */
  loading?: boolean;
  disabled?: boolean;
  /** @defaultValue false */
  bordered?: boolean;
  size?: ComponentSize;
  /** Панель перед таблицей; получает отсортированные/отфильтрованные записи текущей страницы. */
  title?: Snippet<[data: readonly Row[]]>;
  /** Панель после таблицы; получает те же записи страницы, включая пустой массив. */
  footer?: Snippet<[data: readonly Row[]]>;
  /** Итоговые строки внутри таблицы; получают записи текущей страницы. */
  summary?: Snippet<[data: readonly Row[]]> | TableSummaryConfig<Row>;
  caption?: string;
  empty?: Snippet;
  scroll?: TableScrollOptions;
  sticky?: boolean | TableSticky;
  /** Ограничивает число строк в DOM при заданном scroll.y. @defaultValue false */
  virtual?: boolean;
  /** В виртуальном режиме уведомляет о вертикальной прокрутке. */
  onScroll?: (event: Event & { currentTarget: HTMLDivElement; }) => void;
  nativeElement?: HTMLDivElement;
  'aria-label'?: string;
  class?: string;
  style?: string;
}
