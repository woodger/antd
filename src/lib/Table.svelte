<script lang="ts" generics="Row extends object">
  // Координирует данные, выбор и раскрытие. Шапка, тело и итоги используют
  // одну сетку колонок, а виртуальное окно ограничивает только строки тела.
  import { untrack, type Snippet } from 'svelte';
  import { useConfig } from './config-context';
  import { getTablePrefixCss } from './table-prefix.engine';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import { useComponentTheme } from './theme-component.svelte';
  import { useDesignTokenContext } from './theme-context.svelte';
  import { createBreakpoint } from './grid-breakpoint.model.svelte';
  import { getGridMediaQueries } from './grid.engine';
  import { getPaginationState } from './pagination.engine';
  import { getTableColumnLayout, getTableColumnOrder, type TableHeading }
    from './table-columns.engine';
  import { resolveTableCell, resolveTableVirtualCells, type TableCell, type TableMergedRow }
    from './table-cell.engine';
  import { observeTableLayout } from './table-layout.dom';
  import { createTableSelection } from './table-selection.model.svelte';
  import { observeTableSticky, type TableStickyBarLayout } from './table-sticky.dom';
  import { provideTableSummary, type TableFixedCell } from './table-summary-context';
  import { tableVirtualRowHeight } from './table-virtual.engine';
  import { createTableViewport } from './table-virtual.model.svelte';
  import {
    areTableFiltersEqual,
    getNextTableSorter,
    getTableData,
    getTableFilters
  } from './table.engine';
  import { flattenTableRows, type TableRow } from './table-tree.engine';
  import type {
    TableChange,
    TableColumn,
    TableFilters,
    TableFilterValue,
    TableKey,
    TableProps,
    TableScrollConfig,
    TableSorter
  } from './table.types';
  import { ruRU } from './types';
  import Icon from './Icon.svelte';
  import Pagination from './Pagination.svelte';
  import TableFilter from './TableFilter.svelte';
  import TableSelectionControl from './TableSelectionControl.svelte';
  import TableSelectionMenu from './TableSelectionMenu.svelte';
  import TableStickyScrollbar from './TableStickyScrollbar.svelte';
  import Spin from './Spin.svelte';
  import Empty from './Empty.svelte';
  import RenderEmpty from './RenderEmpty.svelte';
  import ListyScrollbar from './ListyScrollbar.svelte';

  let {
    mode = 'client',
    total,
    dataSource,
    columns,
    rowKey,
    rowClassName,
    rowHoverable = true,
    showHeader = true,
    sorter = $bindable(),
    defaultSorter = null,
    filters = $bindable(),
    defaultFilters = {},
    current = $bindable(),
    defaultCurrent = 1,
    pageSize = $bindable(),
    defaultPageSize = 10,
    pagination,
    rowSelection = false,
    selectedRowKeys = $bindable(),
    defaultSelectedRowKeys,
    onChange,
    onSelectionChange,
    expandable,
    loading = false,
    disabled,
    bordered = false,
    size,
    title,
    footer,
    summary,
    caption,
    prefixCls,
    dropdownPrefixCls,
    empty,
    scroll,
    sticky,
    virtual = false,
    onScroll,
    nativeElement = $bindable(),
    'aria-label': ariaLabel,
    class: className = '',
    style
  }: TableProps<Row> = $props();

  const config = useConfig();
  let prefix = $derived(config.getPrefixCls('table', prefixCls));
  let rootPrefix = $derived(config.getPrefixCls());
  let dropdownPrefix = $derived(config.getPrefixCls('dropdown', dropdownPrefixCls));
  let prefixCss = $derived(getTablePrefixCss(prefix, rootPrefix));
  const componentTheme = useComponentTheme('Table');
  const designTheme = useDesignTokenContext();
  const breakpoint = createBreakpoint();
  const hasResponsiveColumns = $derived(columns.some(column => column.responsive !== undefined));
  let mediaQueries = $derived(hasResponsiveColumns && designTheme.enabled
    ? getGridMediaQueries(designTheme.state.token) : undefined);
  untrack(() => mediaQueries);
  let rootStyle = $derived([componentTheme.style, style].filter(Boolean).join(';') || undefined);
  const id = $props.id();
  const initialSorter = untrack(() => defaultSorter ? { ...defaultSorter } : null);
  const initialCurrent = untrack(() => defaultCurrent);
  const initialSize = untrack(() => defaultPageSize);
  let pageRequest = $state.raw(untrack(readPageRequest));
  $effect.pre(syncPageRequest);
  const initialFilters: TableFilters = untrack(
    () => Object.fromEntries(
      Object.entries(defaultFilters).map(([key, values]) => [key, [...values]])
    )
  );
  let childrenColumnName = $derived(expandable?.childrenColumnName || 'children');
  let tableData = $derived(
    getTableData(
      dataSource,
      columns,
      rowKey,
      sorter === undefined ? initialSorter : sorter,
      filters ?? initialFilters,
      mode,
      childrenColumnName
    )
  );
  let hasFilters = $derived(
    getTableColumnOrder(columns).some(
      column => column.filters?.length && (mode === 'server' || column.onFilter)
    )
  );
  let paging = $derived(
    getPaginationState(
      mode === 'server' ? total ?? dataSource.length : tableData.rows.length,
      pageRequest.current,
      pageRequest.pageSize
    )
  );
  let pageRows = $derived(
    mode === 'server' || pagination === false
      ? tableData.rows
      : tableData.rows.slice(
        (paging.current - 1) * paging.pageSize,
        paging.current * paging.pageSize
      )
  );
  let panelData = $derived(pageRows.map(row => row.record));
  const summaryRender = $derived(typeof summary === 'function' ? summary : summary?.render);
  const summaryPlacement = $derived.by(() => {
    if (!summaryRender) {
      return undefined;
    }

    const fixed = typeof summary === 'object' && summary.fixed;
    if (fixed && (sticky || scroll?.y !== undefined)) {
      return fixed === 'top' ? 'top' : 'bottom';
    }

    return 'inline';
  });
  const pinHeader = $derived(Boolean(sticky) || scroll?.y !== undefined);
  let expandedRowRender = $derived(expandable?.expandedRowRender);
  let tree = $derived(!expandedRowRender && pageRows.some(row => row.children !== undefined));
  let showTreeControls = $derived(tree && expandable?.showExpandColumn !== false);
  let indentSize = $derived(expandable?.indentSize ?? 15);
  let internalExpansion = $state(untrack(() => {
    const initialKeys = expandable?.defaultExpandedRowKeys;
    if (initialKeys) {
      return [...initialKeys];
    }

    return expandable?.defaultExpandAllRows
      ? flattenTableRows(pageRows).map(({ row }) => row.key) : [];
  }));
  let expandedKeys = $derived(new Set(expandable?.expandedRowKeys ?? internalExpansion));
  const collapsed = new Set<TableKey>();
  let visibleRows = $derived(flattenTableRows(pageRows, tree ? expandedKeys : collapsed));

  let resolvedDisabled = $derived((disabled ?? config.componentDisabled) || loading);
  let selectionOptions = $derived(typeof rowSelection === 'object' ? rowSelection : undefined);
  const selection = createTableSelection({
    enabled: () => Boolean(rowSelection),
    disabled: () => resolvedDisabled,
    options: () => selectionOptions,
    rootKeys: () => selectedRowKeys,
    rootDefaults: () => defaultSelectedRowKeys,
    setRootKeys: keys => { selectedRowKeys = keys; },
    rootChange: () => onSelectionChange,
    page: () => pageRows,
    data: () => tableData.rows,
    records: () => tableData.allRows
  });
  const selectedKeys = $derived(selection.checked);
  // Явная ширина колонки перекрывает token и прежний размер без темы.
  const selectionWidth = $derived(selectionOptions?.columnWidth ?? (designTheme.enabled
    ? designTheme.state.token.Table?.selectionColumnWidth : 48));
  let resolvedSize = $derived(size ?? config.componentSize);
  let strings = $derived({ ...ruRU.table, ...config.locale.table });
  let content = $state<HTMLDivElement>();
  let table = $state<HTMLTableElement>();
  let stickyBar = $state.raw<TableStickyBarLayout>();
  let expansionColumn = $derived(
    expandedRowRender && expandable?.showExpandColumn !== false ? expandable : undefined
  );
  let expansionOffset = $derived(expansionColumn ? 1 : 0);
  let dataOffset = $derived(expansionOffset + (rowSelection ? 1 : 0));
  // План шапки и порядок листьев используют одни и те же видимые колонки.
  let columnLayout = $derived(getTableColumnLayout(
    columns, breakpoint.connected ? breakpoint.screens : {}
  ));
  let visibleColumns = $derived(columnLayout.leaves.map(leaf => leaf.column));
  let headerRows = $derived(columnLayout.headings.length ? columnLayout.headings : [[]]);
  let headerCount = $derived(showHeader ? headerRows.length : 0);
  let hasCellProps = $derived(visibleColumns.some(column => Boolean(column.onCell)));
  let hovered = $state<{ key: TableKey; leaf: number; first: number; last: number; }>();
  let hasHeaderProps = $derived(headerRows.some(row => row.some(({ column }) =>
    column.onHeaderCell || column.colSpan !== undefined || column.rowSpan !== undefined
  )));
  let columnWidths = $derived([
    ...(expansionColumn
      ? [expansionColumn.columnWidth ?? (designTheme.enabled ? undefined : 48)] : []),
    ...(rowSelection ? [selectionWidth] : []),
    ...visibleColumns.map(column => column.width)
  ]);
  let columnCount = $derived(Math.max(columnWidths.length, 1));
  let fixedColumns = $derived(
    [
      ...(expansionColumn ? [expansionColumn.fixed ?? false] : []),
      ...(rowSelection ? [selectionOptions?.fixed ?? false] : []),
      ...columnLayout.leaves.map(leaf => leaf.fixed)
    ]
  );
  let fixedCells = $derived(fixedColumns.map((fixed, index) => ({
    side: fixed === true ? 'start' : fixed || undefined,
    offset: `var(--ant-table-fixed-${index}, auto)`
  })));
  const selectionFixed = $derived(fixedCells[expansionOffset]);

  provideTableSummary({
    get prefix() { return prefix; },
    fixedSpan
  });

  $effect(() => {
    const view = content?.ownerDocument.defaultView;
    if (view && hasResponsiveColumns) {
      // useBreakpoint подключает пороги темы на время текущей подписки.
      return breakpoint.connect(view, untrack(() => mediaQueries));
    }
  });

  const scrollport = createTableViewport({
    rows: () => visibleRows,
    widths: () => columnWidths,
    estimate: () => tableVirtualRowHeight(designTheme.state.token, resolvedSize),
    cellPadding: () => {
      const token = designTheme.state.token;
      const component = token.Table;
      if (resolvedSize === 'small') return 2 * (component?.cellPaddingInlineSM ?? token.paddingXS);
      if (resolvedSize === 'medium') return 2 * (component?.cellPaddingInlineMD ?? token.paddingXS);
      return 2 * (component?.cellPaddingInline ?? token.padding);
    },
    virtual: () => virtual,
    scroll: () => scroll,
    table: () => table,
    element: () => content,
    header: () => showHeader,
    caption: () => Boolean(caption),
    summary: () => summaryPlacement,
    rtl: () => config.direction === 'rtl'
  });

  let cellPlan = $derived.by(() => {
    if (!scrollport.active || !hasCellProps) {
      return undefined;
    }

    const start = scrollport.start;
    const end = start + scrollport.rows.length - 1;
    return resolveTableVirtualCells(visibleRows, visibleColumns, start, end);
  });

  // Вычисляет начало и размер merged cells через измерения того же виртуального окна.
  let mergedRows = $derived.by(() => {
    const spans = cellPlan?.merged;
    const layout = scrollport.layout;
    if (!spans?.length || !layout) {
      return [];
    }

    const widths = layout.widths;
    const offsets = [0];
    for (const width of widths) offsets.push(offsets[offsets.length - 1] + width);

    return spans.map(row => measureMergedRow(row, offsets));
  });
  // Произвольные итоговые строки сохраняют нативную семантику и свои атрибуты.
  const virtualRowIndices = $derived(
    scrollport.active && !expandedRowRender && !mergedRows.length && !summaryRender
  );
  const emptyCell = resolveTableCell();

  function measureMergedRow({ index, cells }: TableMergedRow, offsets: readonly number[]) {
    const entry = visibleRows[index];
    const key = entry.row.key;
    const top = scrollport.getSize(key).top;
    const parts = [];
    let previousRight = 0;

    for (const origin of cells) {
      const first = origin.columnIndex + dataOffset;
      const span = Math.max(1, Math.floor(origin.cell.colSpan));
      const end = Math.min(offsets.length - 1, first + span);
      const left = offsets[first];
      const width = offsets[end] - left;
      const gap = left - previousRight;

      const last = visibleRows[origin.lastIndex];
      const bottom = scrollport.getSize(key, last.row.key).bottom ?? top;
      parts.push({ ...origin, width, gap, height: bottom - top });
      previousRight = offsets[end];
    }

    return { ...entry, sourceIndex: index, top, parts };
  }

  /** Прокручивает текущую страницу по абсолютной позиции, ключу или индексу. */
  export function scrollTo(target: TableScrollConfig): void {
    scrollport.scrollTo(target);
  }

  function cssSize(value: string | number | undefined) {
    return typeof value === 'number' ? `${value}px` : value;
  }

  function columnWidth(index: number) {
    const virtualWidth = scrollport.layout?.widths[index];
    return cssSize(virtualWidth ?? columnWidths[index]);
  }

  function bodyCellProps(column: TableColumn<Row>, record: Row, index: number, leaf: number) {
    if (cellPlan) {
      return cellPlan.cells.get(index)?.[leaf] ?? emptyCell;
    }

    return column.onCell ? resolveTableCell(column.onCell(record, index)) : emptyCell;
  }

  function inHoveredRows(first: number, last = first) {
    const current = hovered;
    return rowHoverable && current !== undefined && current.first <= last && current.last >= first
      && visibleRows[current.first]?.row.key === current.key;
  }

  function clearHoveredCell(key: TableKey, leaf: number) {
    if (hovered?.key === key && hovered.leaf === leaf) {
      hovered = undefined;
    }
  }

  // Удалённый из виртуального окна узел может не получить mouseleave.
  function detachHoveredCell(key: TableKey, leaf: number) {
    return () => clearHoveredCell(key, leaf);
  }

  function cellHoverEvents(cell: TableCell, key: TableKey, leaf: number, index: number) {
    if (!rowHoverable || !hasCellProps) {
      return { onmouseenter: undefined, onmouseleave: undefined };
    }

    return {
      onmouseenter: (event: MouseEvent & { currentTarget: HTMLTableCellElement; }) => {
        const last = Math.min(visibleRows.length - 1, index + Math.max(1, cell.rowSpan) - 1);
        hovered = { key, leaf, first: index, last };
        cell.attributes.onmouseenter?.(event);
      },
      onmouseleave: (event: MouseEvent & { currentTarget: HTMLTableCellElement; }) => {
        clearHoveredCell(key, leaf);
        cell.attributes.onmouseleave?.(event);
      }
    };
  }

  // Пользовательский стиль имеет приоритет над выравниванием и закреплением ячейки.
  function cellStyle(
    fixed: TableFixedCell | undefined,
    zIndex: number,
    align: TableColumn<Row>['align'],
    custom: TableCell['style']
  ) {
    const side = fixed?.side;
    const inset = side && `inset-inline-${side}: ${fixed.offset}; z-index: ${zIndex}`;
    return [inset, align && `text-align: ${align}`, custom]
      .filter(Boolean).join('; ') || undefined;
  }

  // Закрепление объединённой ячейки зависит от стороны её крайних колонок.
  function fixedSpan(index: number, span: number) {
    const first = fixedCells[index];
    const last = fixedCells[index + span - 1];
    if (!first?.side || first.side !== last?.side) {
      return undefined;
    }

    return first.side === 'start' ? first : last;
  }

  function handleScroll(event: Event & { currentTarget: HTMLDivElement; }) {
    if (scrollport.handleScroll(event.currentTarget)) {
      onScroll?.(event);
    }
  }

  $effect(() => {
    const element = table;
    const viewport = content;
    const fixed = fixedColumns;
    const stickyHeader = headerCount > 0 && pinHeader;
    const hasExpansion = Boolean(expandedRowRender);

    if (!element || !viewport || (!fixed.some(Boolean) && !stickyHeader && !hasExpansion)) {
      return;
    }

    return observeTableLayout({
      table: element, viewport, fixed, stickyHeader,
      hasBodyRows: !showHeader && scrollport.rows.length > 0,
      measureColumns: showHeader ? hasHeaderProps : hasCellProps || Boolean(summaryRender)
    });
  });

  $effect(() => {
    const viewport = content;
    const element = table;
    if (!viewport || !element || !sticky) {
      return;
    }

    const options = typeof sticky === 'object' ? sticky : {};
    return observeTableSticky(viewport, element, options, summaryPlacement, layout => {
      stickyBar = layout;
    });
  });

  function notifyChange(action: TableChange<Row>['action']) {
    scrollport.resetAfterChange();
    onChange?.({
      action,
      pagination: { current: paging.current, pageSize: paging.pageSize, total: paging.total },
      sorter: tableData.sorter ? { ...tableData.sorter } : null,
      ...(hasFilters ? { filters: getTableFilters(columns, tableData.filters, mode) } : {}),
      currentDataSource: tableData.rows.map((row) => row.record)
    });
  }

  function changeSort(columnKey: string) {
    if (resolvedDisabled) {
      return;
    }

    sorter = getNextTableSorter(columnKey, tableData.sorter);
    notifyChange('sort');
  }

  function readPageRequest() {
    return { current: current ?? initialCurrent, pageSize: pageSize ?? initialSize };
  }

  // Управляемые props обновляют тот же запрос до рендера, действия Table — до onChange.
  function syncPageRequest() {
    const next = readPageRequest();
    const previous = untrack(() => pageRequest);
    if (next.current !== previous.current || next.pageSize !== previous.pageSize) {
      pageRequest = next;
    }
  }

  function changePage(page: number, size: number) {
    if (resolvedDisabled) {
      return;
    }

    current = page;
    pageSize = size;
    syncPageRequest();
    notifyChange('paginate');
  }

  function changeFilter(columnKey: string, values: TableFilterValue[]) {
    if (resolvedDisabled) {
      return;
    }

    const next = { ...(filters ?? initialFilters), [columnKey]: [...values] };
    const active = getTableFilters(columns, next, mode);

    if (areTableFiltersEqual(active, tableData.filters)) {
      return;
    }

    if (Object.hasOwn(active, columnKey)) {
      next[columnKey] = active[columnKey];
    }
    else {
      delete next[columnKey];
    }

    filters = next;
    current = 1;
    syncPageRequest();
    notifyChange('filter');
  }

  function sortDescription(columnKey: string, active: TableSorter | null): string {
    const next = getNextTableSorter(columnKey, active);

    return next?.order === 'ascend'
      ? strings.sortAscending
      : next?.order === 'descend' ? strings.sortDescending : strings.cancelSort;
  }

  // rowExpandable относится к подробностям; ветка определяется массивом потомков.
  function canExpandRow(row: TableRow<Row>): boolean {
    return expandedRowRender ? expandable?.rowExpandable?.(row.record) ?? true
      : tree && row.children !== undefined;
  }

  function changeExpansion(row: TableRow<Row>) {
    if (resolvedDisabled || !canExpandRow(row)) {
      return;
    }

    const { key, record } = row;
    const next = new Set(expandedKeys);
    const expanded = !next.has(key);

    if (expanded) {
      next.add(key);
    }
    else {
      next.delete(key);
    }

    internalExpansion = [...next];
    const { onExpand, onExpandedRowsChange } = expandable ?? {};
    onExpand?.(expanded, record);
    onExpandedRowsChange?.([...next]);
  }

  // Встроенные controls и редакторы ячеек используют свои click и keyboard handlers.
  function expandByRowClick(row: TableRow<Row>, event: MouseEvent) {
    if (event.defaultPrevented) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Element) || target.closest('tr') !== event.currentTarget) {
      return;
    }
    const editor = target.closest(
      'button, input, select, textarea, a[href], label, summary, [contenteditable], [role="button"]'
    );
    if (editor?.closest('tr') === event.currentTarget) {
      return;
    }

    changeExpansion(row);
  }

  function expansionId(key: TableKey, part: 'details' | 'row' = 'details'): string {
    const value = `${typeof key}:${key}`;

    return `ant-table-${part}-${id}-${Array.from(
      { length: value.length },
      (_, index) => value.charCodeAt(index).toString(16)
    ).join(
      '-'
    )}`;
  }

  // У вложенных строк отдельные tr; aria-controls связывает кнопку с видимыми детьми.
  function expandedTargets(row: TableRow<Row>, nested: boolean): string | undefined {
    if (!nested) {
      return expansionId(row.key);
    }

    return row.children?.map(child => expansionId(child.key, 'row')).join(' ') || undefined;
  }

  function cellValue(record: Row, key: keyof Row | undefined): string {
    const value = key === undefined ? undefined : record[key];

    return value === null || value === undefined ? '' : String(value);
  }
</script>

<style>
  [data-ant-table-part="wrapper"] { min-width: 0; max-width: 100%; }
  [data-ant-table-part="content"] { max-width: 100%; overflow-x: auto; overscroll-behavior-x: contain; }
  .table-sticky { isolation: isolate; scroll-padding-inline: var(--ant-table-fixed-start-width, 0px) var(--ant-table-fixed-end-width, 0px); }
  .table-scroll-y { overflow-y: auto; overscroll-behavior-y: contain; scroll-padding-top: var(--ant-table-header-height, 0px); }
  .table-virtual-container { position: relative; isolation: isolate; }
  .table-sticky-container { position: relative; }
  [data-ant-table-part="content"].table-virtual-scroll { scrollbar-width: none; overflow-anchor: none; }
  .table-virtual-scroll::-webkit-scrollbar { display: none; }
  .table-virtual-scroll caption, [data-ant-table-pin-summary] caption {
    position: sticky;
    inset-block-start: var(--ant-table-sticky-head-top, 0px);
    z-index: 4;
    background: var(--ant-color-bg-container);
  }
  .table-virtual-bars {
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    pointer-events: none;
    z-index: 5;
  }
  .table-virtual-bars > :global(div) { pointer-events: auto; }
  .table-span-body { position: relative; }
  .table-span-row {
    position: absolute;
    inset-inline: 0;
    display: flex;
    align-items: flex-start;
    pointer-events: none;
  }
  .table-span-row > :is(td, th) {
    display: block;
    box-sizing: border-box;
    flex: 0 0 var(--ant-table-span-width);
    width: var(--ant-table-span-width);
    height: var(--ant-table-span-height);
    margin-inline-start: var(--ant-table-span-gap);
    align-content: center;
    pointer-events: auto;
  }
  [data-ant-table-part="wrapper"] [data-ant-table-part="cell"].table-fixed-cell { position: var(--ant-table-fixed-position, relative); background: var(--ant-color-bg-container); }
  [data-ant-table-part="wrapper"] [data-ant-table-part="body"] > tr > th.table-fixed-cell { background: linear-gradient(var(--ant-table-header-bg), var(--ant-table-header-bg)) var(--ant-color-bg-container); }
  [data-ant-table-part="wrapper"] .table-pin-head [data-ant-table-part="head"] > tr > th {
    position: sticky;
    top: calc(var(--ant-table-sticky-head-top, 0px)
      + var(--ant-table-virtual-caption-height, 0px) + var(--ant-table-header-row-offset, 0px));
    z-index: 2;
  }
  /* Непрозрачная подложка нужна и для токенов темы с alpha. */
  [data-ant-table-part="wrapper"] .table-pin-head [data-ant-table-part="head"] > tr > th,
  [data-ant-table-part="wrapper"] [data-ant-table-part="head"] > tr > .table-fixed-cell { background: linear-gradient(var(--ant-table-header-bg), var(--ant-table-header-bg)) var(--ant-color-bg-container); }
  [data-ant-table-part="wrapper"] .table-pin-head [data-ant-table-part="head"] > tr > th[data-ant-table-sorted],
  [data-ant-table-part="wrapper"] [data-ant-table-part="head"] > tr > .table-fixed-cell[data-ant-table-sorted] { background: linear-gradient(var(--ant-table-header-sort-active-bg), var(--ant-table-header-sort-active-bg)) var(--ant-color-bg-container); }
  [data-ant-table-part="wrapper"] .table-pin-head [data-ant-table-part="head"] > tr > th[data-ant-table-sortable]:hover,
  [data-ant-table-part="wrapper"] [data-ant-table-part="head"] > tr > .table-fixed-cell[data-ant-table-sortable]:hover { background: linear-gradient(var(--ant-table-header-sort-hover-bg), var(--ant-table-header-sort-hover-bg)) var(--ant-color-bg-container); }
  [data-ant-table-part="wrapper"] [data-ant-table-part="summary"][data-fixed] {
    position: sticky;
    z-index: 3;
  }
  [data-ant-table-part="summary"][data-fixed="top"] {
    display: table-row-group;
    top: calc(var(--ant-table-sticky-head-top, 0px)
      + var(--ant-table-virtual-caption-height, 0px) + var(--ant-table-header-height, 0px));
  }
  [data-ant-table-part="summary"][data-fixed="bottom"] {
    bottom: var(--ant-table-sticky-summary-bottom, 0px);
  }
  [data-ant-table-part="summary"] :global(.table-summary-fixed-cell) {
    position: var(--ant-table-fixed-position, relative);
    background: var(--ant-color-bg-container);
    z-index: 1;
  }
  [data-ant-table-part="wrapper"] [data-ant-table-part="body"] > tr > :where(td).table-fixed-cell[data-ant-table-sorted] { background: linear-gradient(var(--ant-table-body-sort-bg), var(--ant-table-body-sort-bg)) var(--ant-color-bg-container); }
  [data-ant-table-part="wrapper"] [data-ant-table-part="body"] > tr[data-ant-table-selected] > .table-fixed-cell { background: linear-gradient(var(--ant-table-row-selected-bg), var(--ant-table-row-selected-bg)) var(--ant-color-bg-container); }
  .table-source-theme [data-ant-table-part="head"] th[data-ant-table-sortable]:hover [data-ant-table-part="sorter"] { color: var(--ant-table-header-icon-hover-color); }
  [data-ant-table-part="wrapper"].table-source-theme [data-ant-table-part="head"] th[data-ant-table-sortable].table-fixed-cell:hover { background: linear-gradient(var(--ant-table-fixed-header-sort-active-bg), var(--ant-table-fixed-header-sort-active-bg)) var(--ant-color-bg-container); }
  .table-source-theme:not(.table-hover-disabled) [data-ant-table-part="body"] > tr[data-ant-table-part="row"]:is(:hover, [data-ant-table-span-hovered]) > td { background: var(--ant-table-row-hover-bg); }
  .table-source-theme:not(.table-hover-disabled) [data-ant-table-part="body"] > tr[data-ant-table-part="row"][data-ant-table-selected]:is(:hover, [data-ant-table-span-hovered]) > :is(th, td) { background: var(--ant-table-row-selected-hover-bg); }
  .table-source-theme:not(.table-hover-disabled) [data-ant-table-part="body"] > tr[data-ant-table-part="row"]:is(:hover, [data-ant-table-span-hovered]) > td.table-fixed-cell { background: linear-gradient(var(--ant-table-row-hover-bg), var(--ant-table-row-hover-bg)) var(--ant-color-bg-container); }
  .table-source-theme:not(.table-hover-disabled) [data-ant-table-part="body"] > tr[data-ant-table-part="row"][data-ant-table-selected]:is(:hover, [data-ant-table-span-hovered]) > :is(th, td).table-fixed-cell { background: linear-gradient(var(--ant-table-row-selected-hover-bg), var(--ant-table-row-selected-hover-bg)) var(--ant-color-bg-container); }
  [data-ant-table-part="content"]:focus-visible, .sort-button:focus-visible { outline: var(--ant-line-width-focus) solid var(--ant-color-primary-border); outline-offset: 2px; }
  caption { padding: var(--ant-padding-sm); color: var(--ant-color-text-heading); text-align: start; font-weight: 600; }
  .sort-button { width: 100%; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; text-align: inherit; cursor: pointer; }
  .sort-button:disabled { cursor: not-allowed; }
  .sort-button::after { content: none; }
  .column-heading { display: flex; align-items: center; gap: var(--ant-margin-xxs); }
  .column-heading > :first-child { flex: 1; }
  .sort-arrow { display: block; width: 0; height: 0; border-inline: 4px solid transparent; }
  .sort-arrow.active { color: var(--ant-color-primary); }
  .sort-up { margin-bottom: 2px; border-bottom: 5px solid currentColor; }
  .sort-down { border-top: 5px solid currentColor; }
  .loading-state { display: flex; align-items: center; gap: var(--ant-margin-xs); padding: var(--ant-padding-sm); color: var(--ant-color-primary); }
  [data-ant-table-part="wrapper"] [data-ant-table-part="expand-icon"]:disabled { color: var(--ant-color-text-disabled); border-color: var(--ant-table-border-color); cursor: not-allowed; }
  [data-ant-table-part="wrapper"] [data-ant-table-part="table"] [data-ant-table-part="body"] > tr[data-ant-table-part="expanded-row"] > td[data-ant-table-part="cell"] { padding: 0; }
  .expanded-content { position: sticky; inset-inline-start: 0; box-sizing: border-box; width: var(--ant-table-viewport-width, 100%); max-width: 100%; padding: var(--ant-table-cell-padding-block) var(--ant-table-cell-padding-inline); overflow-wrap: anywhere; }
  [data-ant-table-size="medium"] .expanded-content { padding: var(--ant-table-cell-padding-block-md) var(--ant-table-cell-padding-inline-md); }
  [data-ant-table-size="small"] .expanded-content { padding: var(--ant-table-cell-padding-block-sm) var(--ant-table-cell-padding-inline-sm); }
</style>

{#snippet expansionControl(row: TableRow<Row>, canExpand: boolean, expanded: boolean, depth?: number)}
  {@const nested = depth !== undefined}
  {#if depth !== undefined}
    <span
      aria-hidden="true"
      class={`${prefix}-row-indent indent-level-${depth}`}
      style:padding-inline-start={`${depth * indentSize}px`}
    ></span>
  {/if}
  {#if canExpand}
    <button
      type="button"
      data-ant-table-part="expand-icon"
      class={[
        `${prefix}-row-expand-icon`,
        `${prefix}-row-expand-icon-${expanded ? 'expanded' : 'collapsed'}`
      ]}
      disabled={resolvedDisabled}
      aria-label={`${expanded ? strings.collapseRow : strings.expandRow} ${row.key}`}
      aria-expanded={expanded}
      aria-controls={expanded ? expandedTargets(row, nested) : undefined}
      onclick={event => {
        if (nested) {
          event.stopPropagation();
        }
        changeExpansion(row);
      }}
    ></button>
  {:else if nested}
    <span aria-hidden="true" class={`${prefix}-row-expand-icon ${prefix}-row-expand-icon-spaced`}></span>
  {/if}
{/snippet}

{#snippet columnHeading(cell: TableHeading<Row>)}
  {@const column = cell.column}
  {@const index = cell.start + dataOffset}
  {@const fixed = fixedSpan(index, cell.colSpan)}
  {@const props = resolveTableCell(column.onHeaderCell?.(column), cell.colSpan, cell.rowSpan)}
  {@const sortable = typeof column.sorter === 'function'
    || (mode === 'server' && column.sorter === true)}
  {@const order = tableData.sorter?.columnKey === column.key ? tableData.sorter.order : undefined}
  {#if props.colSpan !== 0 && props.rowSpan !== 0}
    <th
      {...props.attributes}
      data-ant-table-part="cell"
      data-ant-table-leaf={headerCount > 1 && !cell.group ? cell.leaf + dataOffset : undefined}
      data-ant-table-sortable={sortable || undefined}
      data-ant-table-sorted={order || undefined}
      scope={cell.colSpan > 1 ? 'colgroup' : 'col'}
      colspan={props.colSpan !== 1 ? props.colSpan : undefined}
      rowspan={props.rowSpan !== 1 ? props.rowSpan : undefined}
      class={[
        `${prefix}-cell`,
        column.className,
        fixed?.side && `table-fixed-cell ${prefix}-cell-fix ${prefix}-cell-fix-${fixed.side}`,
        sortable && `${prefix}-column-has-sorters`,
        order && `${prefix}-column-sort`,
        props.className
      ]}
      style={cellStyle(fixed, 3, column.align ?? (props.colSpan > 1 ? 'center' : undefined), props.style)}
      aria-sort={order === 'ascend' ? 'ascending' : order === 'descend' ? 'descending' : undefined}
    >
      <div class="column-heading">
        {#if sortable}
          <button type="button" class={`sort-button ${prefix}-column-sorters`} disabled={resolvedDisabled} title={sortDescription(column.key, tableData.sorter)} onclick={() => changeSort(column.key)}>
            <span class={`${prefix}-column-title`}>{column.title}</span>
            <span data-ant-table-part="sorter" class={`${prefix}-column-sorter`} aria-hidden="true"><span class={`${prefix}-column-sorter-inner`}>{#if designTheme.enabled}<span class={[
                `anticon anticon-caret-up ${prefix}-column-sorter-up`,
                order === 'ascend' && 'active'
              ]}><svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor" focusable="false"><path d="M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z" /></svg></span><span class={[
                  `anticon anticon-caret-down ${prefix}-column-sorter-down`,
                  order === 'descend' && 'active'
                ]}><svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor" focusable="false"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z" /></svg></span>{:else}<span class={[
                'sort-arrow sort-up',
                order === 'ascend' && 'active'
              ]}></span><span class={[
                  'sort-arrow sort-down',
                  order === 'descend' && 'active'
                ]}></span>{/if}</span></span>
          </button>
        {:else}<span>{column.title}</span>{/if}
        {#if column.filters && (mode === 'server' || column.onFilter)}
          <TableFilter prefixCls={prefix} {dropdownPrefix} title={column.title} options={column.filters} value={Object.hasOwn(tableData.filters, column.key)
              ? tableData.filters[column.key]
              : []} multiple={column.filterMultiple !== false} disabled={resolvedDisabled} onApply={(values) => changeFilter(column.key, values)} />
        {/if}
      </div>
    </th>
  {/if}
{/snippet}

{#snippet dataCell(
  column: TableColumn<Row>,
  leaf: number,
  key: TableKey,
  index: number,
  cell: TableCell,
  body: Snippet,
  overlay?: { width: number; height: number; gap: number; }
)}
  {@const fixed = fixedCells[leaf + dataOffset]}
  {@const sorted = tableData.sorter?.columnKey === column.key}
  {@const attributes = {
    ...cell.attributes,
    ...cellHoverEvents(cell, key, leaf, index),
    'data-ant-table-part': 'cell',
    'data-ant-table-sorted': sorted || undefined,
    class: [
      `${prefix}-cell`, column.className,
      fixed.side && `table-fixed-cell ${prefix}-cell-fix ${prefix}-cell-fix-${fixed.side}`,
      sorted && `${prefix}-column-sort`,
      inHoveredRows(index, index + Math.max(1, cell.rowSpan) - 1) && `${prefix}-cell-row-hover`,
      cell.className
    ],
    style: cellStyle(fixed, 1, column.align, cell.style),
    colspan: cell.colSpan !== 1 ? cell.colSpan : undefined,
    rowspan: cell.rowSpan !== 1 ? cell.rowSpan : undefined
  }}
  <!-- Нативные th и td сохраняют редактор при гидратации Svelte 5.57. -->
  {#if column.rowScope}
    <th {...attributes} scope={column.rowScope}
      {@attach hasCellProps ? () => detachHoveredCell(key, leaf) : undefined}
      style:--ant-table-span-width={cssSize(overlay?.width)}
      style:--ant-table-span-height={cssSize(overlay?.height)}
      style:--ant-table-span-gap={cssSize(overlay?.gap)}>{@render body()}</th>
  {:else}
    <td {...attributes}
      {@attach hasCellProps ? () => detachHoveredCell(key, leaf) : undefined}
      style:--ant-table-span-width={cssSize(overlay?.width)}
      style:--ant-table-span-height={cssSize(overlay?.height)}
      style:--ant-table-span-gap={cssSize(overlay?.gap)}>{@render body()}</td>
  {/if}
{/snippet}

{#snippet virtualSpacer(height: number)}
  {#if height > 0}
    <tr aria-hidden="true">
      <td colspan={columnCount} style:height={cssSize(height)} style:padding="0"
        style:border="0" style:line-height="0"></td>
    </tr>
  {/if}
{/snippet}

{#snippet selectPageControl()}
  <TableSelectionControl
    checked={selection.header.all}
    mixed={selection.header.some}
    disabled={resolvedDisabled || selection.header.disabled}
    label={strings.selectAll}
    control={selection.title}
    onToggle={selection.togglePage}
  />
{/snippet}

{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`table-prefix:${prefix}:${rootPrefix}`} />{/if}<div bind:this={nativeElement} data-ant-table-part="wrapper" data-ant-table-prefix={prefix} data-ant-table-root-prefix={rootPrefix} class={[
    `${prefix}-wrapper ant-table-css-var`,
    componentTheme.className,
    designTheme.enabled && 'table-source-theme',
    !rowHoverable && 'table-hover-disabled',
    config.direction === 'rtl' && `${prefix}-wrapper-rtl`,
    className
  ]} dir={config.direction} style={rootStyle}>
  {#if loading}<div class="loading-state" role="status"><Spin size="small" aria-hidden />{strings.loadingText}</div>{/if}
  <div data-ant-table-part="table" data-ant-table-prefix={prefix} data-ant-table-root-prefix={rootPrefix} data-ant-table-size={resolvedSize} class={[
      `${prefix}`,
      `${prefix}-${resolvedSize}`,
      bordered && `${prefix}-bordered`,
      showHeader === false && !title && `${prefix}-no-header`,
      !visibleRows.length && `${prefix}-empty`
    ]}>
    {#if title}<div class={`${prefix}-title`}>{@render title(panelData)}</div>{/if}
    <div class={[
      `${prefix}-container`,
      scrollport.active && 'table-virtual-container',
      sticky && 'table-sticky-container'
    ]}>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Фокус нужен для прокрутки таблицы с клавиатуры.) -->
      <div bind:this={content}
        data-ant-table-part="content"
        data-ant-table-virtual={scrollport.active || undefined}
        data-ant-table-pin-summary={summaryPlacement === 'top' || summaryPlacement === 'bottom'
          ? summaryPlacement : undefined}
        class={[
          `${prefix}-content`,
          (pinHeader || fixedColumns.some(Boolean)) && 'table-sticky',
          pinHeader && 'table-pin-head',
          scroll?.y !== undefined && 'table-scroll-y',
          scrollport.active && 'table-virtual-scroll'
        ]}
        style:max-height={cssSize(scrollport.maxHeight ?? scroll?.y)}
        style:scroll-padding-top={cssSize(scrollport.topInset)}
        style:scroll-padding-bottom={cssSize(scrollport.bottomInset)}
        style:--ant-table-virtual-caption-height={cssSize(scrollport.captionHeight)}
        role="region"
        aria-label={caption ?? ariaLabel ?? strings.label}
        tabindex="0"
        onscroll={handleScroll}
      >
        <table bind:this={table}
          aria-label={ariaLabel ?? (caption ? undefined : strings.label)}
          aria-busy={loading || undefined}
          aria-rowcount={virtualRowIndices
            ? visibleRows.length + headerCount : undefined}
          style:min-width={virtual ? '100%' : cssSize(scroll?.x)}
          style:width={cssSize(scrollport.tableWidth)}
          style:table-layout={virtual && (scroll?.y !== undefined || fixedColumns.some(Boolean))
            ? 'fixed' : undefined}
        >
          {#if caption}<caption>{caption}</caption>{/if}
          {#if visibleColumns.length || dataOffset}<colgroup>
            {#if expansionColumn}<col class={designTheme.enabled ? `${prefix}-expand-icon-col` : undefined}
              style:width={columnWidth(0)} />{/if}
            {#if rowSelection}<col class={[
              (designTheme.enabled || selection.commands) && `${prefix}-selection-col`,
              selection.commands && `${prefix}-selection-col-with-dropdown`
            ]} style:width={columnWidth(expansionOffset)} />{/if}
            {#each visibleColumns as column, columnIndex (column.key)}
              <col style:width={columnWidth(columnIndex + dataOffset)} />
            {/each}
          </colgroup>{/if}
          {#if showHeader}
            <thead data-ant-table-part="head" class={`${prefix}-thead`}>
              {#each headerRows as row, depth}
                <tr aria-rowindex={virtualRowIndices ? depth + 1 : undefined}>
                  {#if depth === 0}
                    {#if expansionColumn}
                      <th data-ant-table-part="cell" scope="col"
                        rowspan={headerCount > 1 ? headerCount : undefined}
                        data-ant-table-leaf={headerCount > 1 ? 0 : undefined}
                        aria-label={expansionColumn.columnTitle ?? strings.expandColumn} class={[
                          `${prefix}-cell ${prefix}-row-expand-icon-cell`,
                          expansionColumn.fixed
                          && `table-fixed-cell ${prefix}-cell-fix ${prefix}-cell-fix-start`
                        ]} style:inset-inline-start={expansionColumn.fixed ? fixedCells[0].offset : undefined} style:z-index={expansionColumn.fixed ? 3 : undefined}>{expansionColumn.columnTitle ?? ''}</th>
                    {/if}
                    {#if rowSelection}
                      <th data-ant-table-part="cell" scope="col"
                        rowspan={headerCount > 1 ? headerCount : undefined}
                        data-ant-table-leaf={headerCount > 1 ? expansionOffset : undefined}
                        class={[
                          `${prefix}-cell ${prefix}-selection-column`,
                          selectionFixed?.side
                          && `table-fixed-cell ${prefix}-cell-fix ${prefix}-cell-fix-${selectionFixed.side}`
                        ]} style={cellStyle(selectionFixed, 3, selectionOptions?.align, undefined)}>
                        {#if !selection.hideHeader}
                          {@const commands = selection.commands}
                          {#if commands}
                            <div class={`${prefix}-selection`}>
                              {@render selectPageControl()}
                              <TableSelectionMenu {prefix} {commands} {strings}
                                disabled={resolvedDisabled} onCommand={selection.runCommand} />
                            </div>
                          {:else}
                            {@render selectPageControl()}
                          {/if}
                        {/if}
                      </th>
                    {/if}
                  {/if}
                  {#each row as cell (cell.column.key)}
                    {@render columnHeading(cell)}
                  {:else}
                    {#if !dataOffset}
                      <th data-ant-table-part="cell" class={`${prefix}-cell`}></th>
                    {/if}
                  {/each}
                </tr>
              {/each}
            </thead>
          {/if}
          {#if summaryPlacement === 'top' && summaryRender}
            <tfoot data-ant-table-part="summary" data-fixed="top" class={`${prefix}-summary`}>
              {@render summaryRender(panelData)}
            </tfoot>
          {/if}
          <tbody data-ant-table-part="body" class={`${prefix}-tbody`}
            class:table-span-body={mergedRows.length > 0}>
            {@render virtualSpacer(scrollport.before)}
            {#each scrollport.rows as { row, depth, index: renderIndex }, windowIndex (row.key)}
              {@const index = scrollport.start + windowIndex}
              {@const canExpand = canExpandRow(row)}
              {@const expanded = canExpand && expandedKeys.has(row.key)}
              {@const checkControl = selection.control(row.key)}
              <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions (Клавиатурой управляет кнопка раскрытия.) -->
              <tr data-ant-table-part="row" data-ant-table-selected={rowSelection && selectedKeys.has(row.key) || undefined}
                data-ant-table-span-hovered={inHoveredRows(index) || undefined} class={[
                  `${prefix}-row`,
                  tree && `${prefix}-row-level-${depth}`,
                  typeof rowClassName === 'function'
                    ? rowClassName(row.record, index, depth) : rowClassName,
                  rowSelection && selectedKeys.has(row.key) && `${prefix}-row-selected`
                ]}
                data-row-key={row.key}
                aria-rowindex={virtualRowIndices
                  ? index + headerCount + 1 : undefined}
                id={depth > 0 ? expansionId(row.key, 'row') : undefined}
                onclick={expandable?.expandRowByClick && canExpand
                  ? event => expandByRowClick(row, event) : undefined}
                {@attach scrollport.active ? element => scrollport.attachRow(element, row.key)
                  : undefined}
              >
                {#if expansionColumn}
                  <td data-ant-table-part="cell" class={[
                      `${prefix}-cell ${prefix}-row-expand-icon-cell`,
                      expansionColumn.fixed
                      && `table-fixed-cell ${prefix}-cell-fix ${prefix}-cell-fix-start`
                    ]} style:inset-inline-start={expansionColumn.fixed ? fixedCells[0].offset : undefined} style:z-index={expansionColumn.fixed ? 1 : undefined}>
                    {@render expansionControl(row, canExpand, expanded)}
                  </td>
                {/if}
                {#if rowSelection}
                  <td data-ant-table-part="cell" class={[
                      `${prefix}-cell ${prefix}-selection-column`,
                      selectionFixed?.side
                      && `table-fixed-cell ${prefix}-cell-fix ${prefix}-cell-fix-${selectionFixed.side}`
                    ]} style={cellStyle(selectionFixed, 1, selectionOptions?.align, undefined)}>
                    <TableSelectionControl
                      radio={selection.radio}
                      checked={selectedKeys.has(row.key)}
                      mixed={selection.indeterminate(row.key, tree)}
                      disabled={resolvedDisabled || Boolean(checkControl?.disabled)}
                      label={`${strings.selectRow} ${row.key}`}
                      control={checkControl}
                      onToggle={(_, event) => selection.toggleRow(row, event)}
                    />
                  </td>
                {/if}
                {#each visibleColumns as column, columnIndex (column.key)}
                  {@const cell = bodyCellProps(column, row.record, index, columnIndex)}
                  {@const placeholder = cellPlan?.placeholders.get(index)?.[columnIndex]}
                  {#snippet cellContent()}
                    {#if showTreeControls && columnIndex === 0}
                      {@render expansionControl(row, canExpand, expanded, depth)}
                    {/if}{#if column.render}{@render column.render(row.record, renderIndex)}{:else}{cellValue(row.record, column.dataIndex)}{/if}
                  {/snippet}
                  {#if placeholder !== undefined}
                    {#if placeholder > 0}
                      <!-- Ширина остаётся в сетке, содержимое находится в строке span. -->
                      <td aria-hidden="true" class={`${prefix}-cell`}
                        colspan={placeholder > 1 ? placeholder : undefined}
                        style:visibility="hidden"></td>
                    {/if}
                  {:else if cell.colSpan !== 0 && cell.rowSpan !== 0}
                    {@render dataCell(column, columnIndex, row.key, index, cell, cellContent)}
                  {/if}
                {:else}
                  {#if !dataOffset}
                    <td data-ant-table-part="cell" class={`${prefix}-cell`}>
                      {#if showTreeControls}
                        {@render expansionControl(row, canExpand, expanded, depth)}
                      {/if}
                    </td>
                  {/if}
                {/each}
              </tr>
              {#if expanded && expandedRowRender}
                <tr data-ant-table-part="expanded-row" class={`${prefix}-expanded-row`}
                  {@attach scrollport.active ? scrollport.attachDetails : undefined}>
                  <td data-ant-table-part="cell" class={`${prefix}-cell`} colspan={columnCount}>
                    <div class="expanded-content" id={expansionId(row.key)}>{@render expandedRowRender(row.record, index)}</div>
                  </td>
                </tr>
              {/if}
            {:else}
              <tr class={`${prefix}-placeholder`}><td data-ant-table-part="cell" class={`${prefix}-cell`} colspan={columnCount}>{#if !loading}
                {#snippet nativeEmpty()}<Empty image="simple" description={strings.emptyText} />{/snippet}
                <RenderEmpty componentName="Table" local={empty} fallback={nativeEmpty} />
              {:else}&nbsp;{/if}</td></tr>
            {/each}
            {@render virtualSpacer(scrollport.after)}
            {#each mergedRows as { row, depth, index, sourceIndex, top, parts } (row.key)}
              {@const canExpand = canExpandRow(row)}
              {@const expanded = canExpand && expandedKeys.has(row.key)}
              <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions (Клавиатурой управляет кнопка раскрытия.) -->
              <tr data-ant-table-part="span-row" data-row-key={row.key}
                data-ant-table-selected={rowSelection && selectedKeys.has(row.key) || undefined}
                class={[
                  'table-span-row', `${prefix}-row ${prefix}-row-extra`,
                  tree && `${prefix}-row-level-${depth}`,
                  typeof rowClassName === 'function'
                    ? rowClassName(row.record, sourceIndex, depth) : rowClassName,
                  rowSelection && selectedKeys.has(row.key) && `${prefix}-row-selected`
                ]}
                style:top={cssSize(top)}
                onclick={expandable?.expandRowByClick && canExpand
                  ? event => expandByRowClick(row, event) : undefined}
              >
                {#each parts as part (part.columnIndex)}
                  {@const column = visibleColumns[part.columnIndex]}
                  {#snippet spanContent()}
                    {#if showTreeControls && part.columnIndex === 0}
                      {@render expansionControl(row, canExpand, expanded, depth)}
                    {/if}{#if column.render}{@render column.render(row.record, index)}{:else}{cellValue(row.record, column.dataIndex)}{/if}
                  {/snippet}
                  {@render dataCell(
                    column, part.columnIndex, row.key, sourceIndex, part.cell, spanContent, part
                  )}
                {/each}
              </tr>
            {/each}
          </tbody>
          {#if summaryRender && summaryPlacement !== 'top'}
            <tfoot data-ant-table-part="summary" data-fixed={summaryPlacement === 'bottom'
              ? 'bottom' : undefined} class={`${prefix}-summary`}>
              {@render summaryRender(panelData)}
            </tfoot>
          {/if}
        </table>
      </div>
      {#if scrollport.active && scrollport.height > 0}
        <div class="table-virtual-bars"
          style:height={cssSize(scrollport.height)}
          style:bottom={cssSize(scrollport.bottomInset)}
        >
          {#if scrollport.contentHeight > scrollport.height}
            <ListyScrollbar prefixCls={`${prefix}-tbody-virtual`}
              rtl={config.direction === 'rtl'}
              offset={scrollport.top} range={scrollport.contentHeight} size={scrollport.height}
              flash={scrollport.flash} onScroll={scrollport.scrollVertical}
              onMoving={scrollport.dragScrollbar}
            />
          {/if}
          {#if scrollport.layout && scrollport.layout.width > scrollport.width}
            <ListyScrollbar prefixCls={`${prefix}-tbody-virtual`} horizontal
              rtl={config.direction === 'rtl'}
              offset={scrollport.left} range={scrollport.layout.width} size={scrollport.width}
              flash={scrollport.flash} onScroll={scrollport.scrollHorizontal}
              onMoving={scrollport.dragScrollbar}
            />
          {/if}
        </div>
      {/if}
      {#if stickyBar}
        <TableStickyScrollbar {prefix} layout={stickyBar} rtl={config.direction === 'rtl'}
          onScroll={scrollport.scrollHorizontal} onMoving={scrollport.dragScrollbar} />
      {/if}
    </div>
    {#if footer}<div class={`${prefix}-footer`}>{@render footer(panelData)}</div>{/if}
  </div>
  {#if pagination !== false}
    <Pagination {...pagination} total={paging.total} current={paging.current} pageSize={paging.pageSize} disabled={resolvedDisabled} size={resolvedSize} class={`${prefix}-pagination ${prefix}-pagination-end`} onChange={changePage} />
  {/if}
</div>
