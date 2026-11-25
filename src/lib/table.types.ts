import type { Snippet } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type {
  HTMLAttributes, HTMLInputAttributes, HTMLTableAttributes, HTMLTdAttributes, HTMLThAttributes
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
  text: string;
  value: TableFilterValue;
  children?: readonly TableFilterOption[];
}

/** Пользовательский поиск получает текущий запрос и исходный вариант. */
export type TableFilterSearch = boolean | ((input: string, option: TableFilterOption) => boolean);

export interface TableFilterConfirmOptions {
  closeDropdown: boolean;
}

export interface TableFilterResetOptions {
  confirm?: boolean;
  closeDropdown?: boolean;
}

/** Аргумент snippet пользовательского фильтра. Изменения остаются в черновике до confirm. */
export interface TableFilterDropdownProps {
  prefixCls: string;
  selectedKeys: readonly TableFilterValue[];
  setSelectedKeys: (keys: readonly TableFilterValue[]) => void;
  /** Подтверждает черновик. Вызов без аргумента закрывает панель. */
  confirm: (options?: TableFilterConfirmOptions) => void;
  /** Восстанавливает начальный черновик. Опции управляют очисткой и закрытием. */
  clearFilters: (options?: TableFilterResetOptions) => void;
  filters?: readonly TableFilterOption[];
  /** Закрывает панель без применения черновика. */
  close: () => void;
  visible: boolean;
}

/** Параметры Dropdown. Table предоставляет кнопку и содержимое панели. */
export interface TableFilterDropdownOptions extends Omit<
  DropdownProps, 'children' | 'ref' | 'defaultOpen' | 'popupRender'
> {
  popupRender?: Snippet<[origin: Snippet]>;
}

export interface TableSorter {
  columnKey: string;
  order: TableSortOrder;
}

/** Table передаёт активное направление до применения его знака к сравнению. */
export type TableSortCompare<Row extends object> = (
  left: Row, right: Row, order?: TableSortOrder | null
) => number;

export interface TableColumnSorter<Row extends object> {
  compare?: TableSortCompare<Row>;
  /** Большие числовые приоритеты сравниваются первыми. Ноль включает совмещение. */
  multiple?: number;
}

export type TableColumnTitle<Row extends object> =
  string | number | boolean | null | Snippet<[info: TableColumnTitleProps<Row>]>;

/** Значения, которые Table передаёт заголовкам листьев и групп. */
export interface TableColumnTitleProps<Row extends object> {
  /** Критерии в порядке состояния. order равен null для неактивного критерия. */
  readonly sortColumns: readonly { column: TableColumn<Row>; order: TableSortOrder | null; }[];
  /** Применённые фильтры, без черновика открытой панели и отклонённых запросов. */
  readonly filters: Readonly<Record<string, readonly TableFilterValue[]>>;
}

export type TableSorterTooltipTarget = 'full-header' | 'sorter-icon';

/** Встроенный Tooltip использует кнопку сортировки или её декоративную иконку. */
export interface TableSorterTooltipProps
  extends Omit<TooltipProps, 'children' | 'overlay' | 'class' | 'style'> {
  /** @defaultValue 'full-header' */
  target?: TableSorterTooltipTarget;
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
  /** Число или строка выводятся как текст. Snippet получает состояние Table. */
  title?: TableColumnTitle<Row>;
  /** Строка обозначает буквальный ключ. Массив задаёт путь, включая индексы массивов. */
  dataIndex?: TableDataIndex<Row>;
  /**
   * Index относится к соседним записям. Table передаёт исходное значение третьим
   * аргументом. Snippet можно вызвать и с двумя аргументами.
   */
  render?: Snippet<[record: Row, index: number, value?: unknown]>;
  /** Разрешает обновить содержимое ячейки относительно последней принятой записи. */
  shouldCellUpdate?: (record: Row, previousRecord: Row) => boolean;
  sorter?: boolean | TableSortCompare<Row> | TableColumnSorter<Row>;
  /** Явное null оставляет колонку без направления под управлением владельца. */
  sortOrder?: TableSortOrder | null;
  /** Читается при создании таблицы. */
  defaultSortOrder?: TableSortOrder | null;
  /** Заменяет цикл направлений таблицы для этой колонки. */
  sortDirections?: readonly (TableSortOrder | null)[];
  /** Заменяет декоративные стрелки. Snippet получает отображаемый порядок. */
  sortIcon?: Snippet<[info: { sortOrder: TableSortOrder | null; }]>;
  /** Перекрывает настройку таблицы для этой колонки, включая false. */
  showSorterTooltip?: boolean | TableSorterTooltipProps;
  filters?: readonly TableFilterOption[];
  /** Заменяет содержимое фильтра. Snippet получает черновик и операции над ним. */
  filterDropdown?: Snippet<[info: TableFilterDropdownProps]>;
  /** Настраивает размещение, триггеры, открытие и обёртку панели. */
  filterDropdownProps?: TableFilterDropdownOptions;
  /** Применяет встроенный фильтр при закрытии. @defaultValue false */
  filterOnClose?: boolean;
  /** Заменяет декоративную иконку. Snippet получает признак активного фильтра. */
  filterIcon?: Snippet<[filtered: boolean]>;
  onFilter?: (value: TableFilterValue, record: Row) => boolean;
  filterMultiple?: boolean;
  /** Выбирает представление фильтра. @defaultValue 'menu' */
  filterMode?: TableFilterMode;
  /** Показывает поле поиска. В дереве поиск выделяет совпадения. */
  filterSearch?: TableFilterSearch;
  /** Добавляет индикацию активного фильтра независимо от выбранных значений. */
  filtered?: boolean;
  /** Управляет значениями колонки. Значения null и [] задают пустой фильтр. */
  filteredValue?: readonly TableFilterValue[] | null;
  /** Начальные значения колонки. Читаются при создании таблицы. */
  defaultFilteredValue?: readonly TableFilterValue[] | null;
  /** Кнопка сброса восстанавливает defaultFilteredValue в черновике меню. */
  filterResetToDefaultFilteredValue?: boolean;
  align?: TableAlign;
  /** Обрезает строку. True включает нативный title для строк и чисел. */
  ellipsis?: boolean | { showTitle?: boolean; };
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
  /** Минимальная ширина в px при auto или для ширины виртуальной ячейки. */
  minWidth?: number;
  /** Лист наследует закрепление группы. False явно отключает наследование. */
  fixed?: TableFixed;
}

export type TableColumnType<Row extends object> = TableColumn<Row>;
export type TableColumnsType<Row extends object> = readonly TableColumn<Row>[];

/** Общие свойства колонок. Дочернее дерево задаётся в columns. */
export type TableColumnDefaults<Row extends object> = Partial<Omit<TableColumn<Row>, 'children'>>;

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

interface TableSemanticGroup {
  wrapper?: string;
  row?: string;
  cell?: string;
}

/** Семантические области таблицы. Значения styles записываются строками CSS. */
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

/** Строка группы оформляет wrapper шапки или тела либо корень пагинации. */
export interface TableClassNameSlots
  extends Omit<TableSemanticSlots, 'header' | 'body' | 'pagination'> {
  header?: string | TableSemanticGroup;
  body?: string | TableSemanticGroup;
  pagination?: string | PaginationSlots;
}

export type TableSemantic<Row extends object, Slots extends TableClassNameSlots = TableSemanticSlots>
  = Slots | ((info: { props: TableProps<Row>; }) => Slots | undefined);

/** Настройки провайдера подходят таблицам с разными типами записей. */
export type TableConfigSemantic<Slots extends TableClassNameSlots = TableSemanticSlots>
  = Slots | (<Row extends object>(info: { props: TableProps<Row>; }) => Slots | undefined);

/** Общие настройки ключей, прокрутки и оформления таблиц провайдера. */
export interface TableConfig {
  /** Поле или функция для записей таблиц, которые наследуют этот ключ. */
  rowKey?: PropertyKey | { resolve(record: object): TableKey; }['resolve'];
  /** Значение целиком используется при отсутствии локального Table.scroll. */
  scroll?: TableScrollOptions;
  expandable?: Pick<TableExpandable<object>, 'expandIcon'>;
  class?: string;
  style?: string;
  classNames?: TableConfigSemantic<TableClassNameSlots>;
  styles?: TableConfigSemantic;
}

/** Сторона по вертикали и логическое выравнивание пейджера относительно таблицы. */
export type TablePaginationPlacement = 'topStart' | 'topCenter' | 'topEnd'
  | 'bottomStart' | 'bottomCenter' | 'bottomEnd' | 'none';

/** Настройки общего состояния страницы и обоих экземпляров Pagination. */
export interface TablePaginationConfig extends PaginationProps {
  /** Первый вариант для каждой стороны. Пустой массив и ['none'] скрывают оба пейджера. */
  placement?: readonly TablePaginationPlacement[];
}

/** Размеры области прокрутки и сброс после пользовательского изменения данных. */
export interface TableScrollOptions {
  /** true задаёт автоматическую ширину по содержимому с минимумом 100%. */
  x?: number | string | true;
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
  align?: TableAlign;
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

/** Интерфейс пользовательского виртуализатора с собственной системой координат. */
export interface TableBodyScrollHandle {
  /** Физическая горизонтальная позиция, отрицательная в RTL. */
  scrollLeft: number;
  scrollTo?: (config: TableScrollConfig) => void;
}

/** Нативный scroll event или координата, сообщённая виртуализатором. */
export interface TableBodyScrollEvent {
  currentTarget?: HTMLElement;
  scrollLeft?: number;
}

/** Связывает собственное тело с шапкой, итогами и TableRef.scrollTo. */
export interface TableBodyRenderInfo {
  readonly scrollbarSize: number;
  /** Svelte attachment для DOM или регистрация handle с возвращаемым cleanup. */
  ref: (target: HTMLElement | TableBodyScrollHandle) => () => void;
  onScroll: (event: TableBodyScrollEvent) => void;
}

/** Snippet получает корневые записи обработанной страницы и владеет разметкой тела. */
export type TableBodyRender<Row extends object> =
  Snippet<[data: readonly Row[], info: TableBodyRenderInfo]>;

/** Семантический тег штатного элемента, в том числе внутри виртуального окна. */
export type TableElementTag = 'table' | 'thead' | 'tbody' | 'tr' | 'th' | 'td';

interface TableElementAttributeMap {
  table: Omit<HTMLTableAttributes, 'children'>;
  thead: Omit<HTMLAttributes<HTMLTableSectionElement>, 'children'>;
  tbody: Omit<HTMLAttributes<HTMLTableSectionElement>, 'children'>;
  tr: TableRowProps;
  td: Omit<HTMLTdAttributes, 'children'>;
  th: Omit<HTMLThAttributes, 'children'>;
}

export type TableElementAttributes<Tag extends TableElementTag> = TableElementAttributeMap[Tag]
  & { [name: `data-${string}`]: string | number | boolean | undefined; };

/** Передайте attributes, children и ref реальному элементу с семантикой этого места. */
export interface TableElementRenderInfo<Tag extends TableElementTag = TableElementTag> {
  tag: Tag;
  attributes: TableElementAttributes<Tag>;
  children: Snippet;
  ref: Attachment<HTMLElement>;
}

/** Имя HTML-элемента либо snippet с готовыми атрибутами и штатными дочерними узлами. */
export type TableElement<Tag extends TableElementTag> =
  string | Snippet<[info: TableElementRenderInfo<Tag>]>;

export interface TableHeaderComponents {
  /** Таблица отдельной шапки и закреплённых итогов при scroll.y или sticky. */
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
  /** Настраивает элементы тела или отдаёт прокрутку отдельному renderer. */
  body?: TableBodyComponents | TableBodyRender<Row>;
}

/** Методы bind:this. Корневой DOM-узел доступен через bind:nativeElement. */
export interface TableRef {
  scrollTo(config: TableScrollConfig): void;
}

export interface TableChange<Row extends object> {
  action: 'sort' | 'paginate' | 'filter';
  pagination: { current: number; pageSize: number; total: number; };
  sorter: TableSorter | null;
  /** Полный список активных критериев при совмещении сортировок. */
  sorters?: TableSorter[];
  filters?: TableFilters;
  currentDataSource: Row[];
}

type TableLocaleContentField = 'emptyText' | 'filterApply' | 'filterConfirm' | 'filterReset'
  | 'filterEmptyText' | 'filterCheckAll' | 'selectionAll' | 'selectInvert' | 'selectNone';

/** Локальный словарь Table со строками доступности и содержимым на основе Svelte snippets. */
export type TableLocaleOverrides =
  Partial<Omit<TableLocale, TableLocaleContentField>>
  & Partial<Record<TableLocaleContentField, RenderEmptyContent>>
  & {
    expand?: string;
    collapse?: string;
    triggerAsc?: string;
    triggerDesc?: string;
    /** Поле исходного словаря. Текст действия сортировки задают triggerAsc, triggerDesc и cancelSort. */
    sortTitle?: string;
  };

/** Типизированная таблица с columns, row identity, фильтрами, сортировкой и пагинацией. */
export interface TableProps<Row extends object> {
  /** Локальный Table owner перекрывает ConfigProvider.prefixCls. */
  prefixCls?: string;
  /** Локальный префикс списка фильтров; shell и controls наследуют общий prefix. */
  dropdownPrefixCls?: string;
  /** Задаёт контейнер панелей фильтра и меню команд выбора по их DOM-триггеру. */
  getPopupContainer?: DropdownProps['getPopupContainer'];
  /** @defaultValue 'client' */
  mode?: TableMode;
  total?: number;
  /** Пустой массив задаёт известный пустой результат. */
  dataSource?: readonly Row[] | null;
  columns: TableColumnsType<Row>;
  /** Заполняет отсутствующие или равные undefined свойства групп и листьев. */
  column?: TableColumnDefaults<Row>;
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
  /** Цикл направления для колонок без собственного списка. */
  sortDirections?: readonly (TableSortOrder | null)[];
  /** Штатная подсказка следующего направления для сортируемых колонок. */
  showSorterTooltip?: boolean | TableSorterTooltipProps;
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
  /** Объект настраивает вложенный Spin. При отсутствии spinning он запрошен сразу. */
  loading?: boolean | SpinProps;
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
  /** Локальные подписи таблицы и содержимое пустой ячейки. */
  locale?: TableLocaleOverrides;
  empty?: Snippet;
  components?: TableComponents<Row>;
  scroll?: TableScrollOptions;
  /** Задаёт алгоритм ширин обычной таблицы. Виртуальное окно использует общую сетку. */
  tableLayout?: TableLayout;
  sticky?: boolean | TableSticky;
  /** Ограничивает число строк в DOM при заданном scroll.y. @defaultValue false */
  virtual?: boolean;
  /** В виртуальном режиме уведомляет о вертикальной прокрутке. */
  onScroll?: (event: Event & { currentTarget: HTMLDivElement; }) => void;
  nativeElement?: HTMLDivElement;
  'aria-label'?: string;
  classNames?: TableSemantic<Row, TableClassNameSlots>;
  styles?: TableSemantic<Row>;
  /** Дополняет класс корня и панелей фильтров. */
  rootClassName?: string;
  class?: string;
  style?: string;
}
