<script lang="ts" generics="Row extends object">
  // Coordinates data, selection, and expansion. Headers, body, and summaries share a column grid.
  // The virtual window limits only body rows.
  import { untrack, type Snippet } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import { useConfig } from '../config-context';
  import { getTablePrefixCss, getTableSpinTheme } from './table-prefix.engine';
  import ThemeScopeStyle from '../ThemeScopeStyle.svelte';
  import { useComponentTheme } from '../theme-component.svelte';
  import { useDesignTokenContext } from '../theme-context.svelte';
  import { createBreakpoint } from '../grid/grid-breakpoint.model.svelte';
  import { getGridMediaQueries } from '../grid/grid.engine';
  import { getPaginationState } from '../pagination/pagination.engine';
  import {
    getTableColumnLayout, getTableColumnOrder, resolveTableColumns, type TableHeading, type TableLeaf,
    type TableServiceColumn
  } from './table-columns.engine';
  import {
    readTableCellValue, resolveTableCell, resolveTableCellDisplay, resolveTableVirtualCells,
    type TableCell, type TableMergedRow
  } from './table-cell.engine';
  import { observeTableLayout } from './table-layout.dom';
  import { getTableLayout } from './table-layout.engine';
  import { resolveTableLocale } from './table-locale.engine';
  import {
    getTablePageRows, getTablePagerPlacements, getTablePagerSize, getTablePagingTotal,
    type TablePagerAlignment
  } from './table-pagination.engine';
  import {
    getTableDomAttributes, getTablePaginationSemantics, getTableSemantics
  } from './table-semantic.engine';
  import {
    changeTableSorts, getControlledTableSorts, getInitialTableSorts, getTableColumnTitleSorts,
    isTableMultipleSorter, isTableSortable, tableSortDirections, type TableSortState
  } from './table-sorter.engine';
  import { createTableSelection } from './table-selection.model.svelte';
  import { createTableCustomBody } from './table-custom-body.model.svelte';
  import { observeTableSticky, type TableStickyBarLayout } from './table-sticky.dom';
  import { provideTableSummary, type TableFixedCell } from './table-summary-context';
  import { tableVirtualRowHeight } from './table-virtual.engine';
  import { createTableViewport } from './table-virtual.model.svelte';
  import {
    areTableFiltersEqual,
    getControlledTableFilters,
    getInitialTableFilters,
    getNextTableSorter,
    getTableData,
    getTableFilterOptions,
    getTableFilters
  } from './table.engine';
  import { flattenTableRows, type TableRow } from './table-tree.engine';
  import type { SpinSemanticInfo } from '../spin/spin.types';
  import type { RenderEmptyContent } from '../types';
  import type {
    TableChange,
    TableColumn,
    TableColumnTitleProps,
    TableElement,
    TableElementAttributes,
    TableElementTag,
    TableExpandIconInfo,
    TableFilters,
    TableFilterValue,
    TableKey,
    TableProps,
    TableRowProps,
    TableScrollConfig,
    TableSorter,
    TableSortOrder
  } from './table.types';
  import Icon from '../Icon.svelte';
  import Pagination from '../pagination/Pagination.svelte';
  import TableFilter from './TableFilter.svelte';
  import TableSortButton from './TableSortButton.svelte';
  import TableSelectionControl from './TableSelectionControl.svelte';
  import TableSelectionMenu from './TableSelectionMenu.svelte';
  import TableStickyScrollbar from './TableStickyScrollbar.svelte';
  import Spin from '../spin/Spin.svelte';
  import Empty from '../empty/Empty.svelte';
  import RenderContent from '../RenderContent.svelte';
  import RenderEmpty from '../empty/RenderEmpty.svelte';
  import ListyScrollbar from '../listy/ListyScrollbar.svelte';

  let {
    sorter = $bindable(),
    filters = $bindable(),
    filters: providedFilters,
    current = $bindable(),
    current: providedCurrent,
    pageSize = $bindable(),
    pageSize: providedPageSize,
    selectedRowKeys = $bindable(),
    nativeElement = $bindable(),
    ...rawProps
  }: TableProps<Row> = $props();

  let {
    id: ownerId,
    mode = 'client',
    total,
    dataSource: suppliedData,
    columns,
    column,
    rowKey: localRowKey,
    rowClassName,
    onRow,
    onHeaderRow,
    rowHoverable = true,
    showHeader = true,
    defaultSorter,
    sortDirections = tableSortDirections,
    showSorterTooltip = true,
    defaultFilters,
    defaultCurrent,
    defaultPageSize,
    pagination,
    rowSelection = false,
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
    getPopupContainer,
    locale,
    empty,
    components,
    scroll: localScroll,
    tableLayout,
    sticky,
    virtual = false,
    onScroll,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-busy': ariaBusy,
    'aria-rowcount': ariaRowCount,
    class: className = '',
    rootClassName
  } = $derived(rawProps);

  const emptyData: readonly Row[] = [];
  const dataSource = $derived(suppliedData ?? emptyData);
  const spinOptions = $derived(typeof loading === 'object' ? loading : undefined);
  const simpleLoading = $derived(loading === true);
  const loadingRequested = $derived(spinOptions ? spinOptions.spinning ?? true : simpleLoading);
  const hideEmpty = $derived(loadingRequested && (simpleLoading || suppliedData == null));
  const passiveSpin = { role: 'presentation' as const, 'aria-label': '' };

  const config = useConfig();
  const rowKey = $derived(localRowKey ?? config.table?.rowKey);
  const scroll = $derived(localScroll ?? config.table?.scroll);
  const horizontalWidth = $derived.by(() => {
    const width = scroll?.x;
    return width === true ? 'auto' : width;
  });
  let prefix = $derived(config.getPrefixCls('table', prefixCls));
  let rootPrefix = $derived(config.getPrefixCls());
  let dropdownPrefix = $derived(config.getPrefixCls('dropdown', dropdownPrefixCls));
  let prefixCss = $derived(getTablePrefixCss(prefix, rootPrefix));
  const componentTheme = useComponentTheme('Table');
  const designTheme = useDesignTokenContext();
  const breakpoint = createBreakpoint();
  const resolvedColumns = $derived(resolveTableColumns(columns, column));
  const hasResponsiveColumns = $derived(
    resolvedColumns.some(column => column.responsive !== undefined)
  );
  let mediaQueries = $derived(hasResponsiveColumns && designTheme.enabled
    ? getGridMediaQueries(designTheme.state.token) : undefined);
  untrack(() => mediaQueries);
  const id = $props.id();
  const captionId = `ant-table-caption-${id}`;
  const hasCaption = $derived(caption !== null && caption !== undefined);
  const captionText = $derived(
    typeof caption === 'string' || typeof caption === 'number' ? String(caption) : undefined
  );
  const captionReference = $derived(
    typeof caption === 'function' || (Array.isArray(caption) && hasHeadingLabel(caption))
      ? captionId : undefined
  );
  const hasNamedCaption = $derived(Boolean(captionReference || captionText));
  const { data: ownerAttributes, aria: tableAttributes } = $derived(
    getTableDomAttributes(rawProps)
  );
  const dataColumns = $derived(getTableColumnOrder(resolvedColumns));
  const columnIndices = $derived(new Map(dataColumns.map((entry, index) => [entry.key, index])));
  let localSorts = $state.raw(untrack(() => getInitialTableSorts(dataColumns, defaultSorter)));
  const controlledSorts = $derived(getControlledTableSorts(dataColumns, mode));
  const multipleSort = $derived(dataColumns.some(isTableMultipleSorter));
  const activeSorts = $derived.by(() => {
    if (controlledSorts.length) {
      return controlledSorts;
    }
    if (sorter !== undefined) {
      return sorter ? [sorter] : [];
    }
    return localSorts;
  });
  const pagerOptions = $derived(pagination || undefined);
  // Keeps the local query separate from props, including the pager placement object.
  let localPage = $state.raw(untrack(() => ({
    current: defaultCurrent ?? pagerOptions?.defaultCurrent ?? 1,
    pageSize: defaultPageSize ?? pagerOptions?.defaultPageSize ?? 10
  })));
  const requestedCurrent = $derived(
    (providedCurrent === undefined ? pagerOptions?.current : current) ?? localPage.current
  );
  const requestedPageSize = $derived(
    (providedPageSize === undefined ? pagerOptions?.pageSize : pageSize) ?? localPage.pageSize
  );
  const initialFilters = untrack(() => getInitialTableFilters(dataColumns, defaultFilters));
  let localColumnFilters = $state.raw<TableFilters>();
  const hasTableFilterDefaults = untrack(() => defaultFilters !== undefined);
  const usesTableFilterState = $derived(providedFilters !== undefined || hasTableFilterDefaults);
  const controlledFilters = $derived(getControlledTableFilters(dataColumns, mode));
  const storedFilters = $derived.by(() => {
    if (providedFilters === undefined && localColumnFilters !== undefined) {
      return localColumnFilters;
    }

    return filters ?? initialFilters;
  });
  const appliedFilters = $derived.by(() => {
    // When filteredValue is present, Ant Design mode uses criteria from controlled columns.
    if (controlledFilters && !usesTableFilterState) {
      return controlledFilters;
    }

    return controlledFilters ? { ...storedFilters, ...controlledFilters } : storedFilters;
  });
  let childrenColumnName = $derived(expandable?.childrenColumnName || 'children');
  let tableData = $derived(readTableData(activeSorts, appliedFilters));
  const columnTitleInfo: TableColumnTitleProps<Row> = $derived({
    sortColumns: getTableColumnTitleSorts(dataColumns, activeSorts, mode),
    filters: tableData.filters
  });
  const sortsByColumn = $derived(new Map(tableData.sorters.map(state => [state.columnKey, state])));
  let hasFilters = $derived(
    dataColumns.some(column => column.filterDropdown || getTableFilterOptions(column, mode)?.length)
  );
  const pagingTotal = $derived(getTablePagingTotal(
    mode,
    mode === 'server' ? dataSource.length : tableData.rows.length,
    total,
    pagerOptions?.total
  ));
  const paging = $derived(getPaginationState(pagingTotal, requestedCurrent, requestedPageSize));
  const pagerPlacements = $derived(
    pagination !== false && paging.total > 0 ? getTablePagerPlacements(pagerOptions?.placement) : {}
  );
  const pageRows = $derived(
    getTablePageRows(tableData.rows, paging, pagination !== false, mode)
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
  const bodyRenderer = $derived(!virtual && pinHeader && typeof components?.body === 'function'
    ? components.body : undefined);
  const headerElements = $derived(components?.header);
  const splitBands = $derived(pinHeader
    && Boolean(bodyRenderer || components?.table || headerElements?.table));
  // An empty or unpinned table uses a regular body even with virtual enabled.
  const useBodyWrapperSlot = $derived(!virtual || !pinHeader || pageRows.length === 0);
  let expandedRowRender = $derived(expandable?.expandedRowRender);
  const forceExpandedRows = $derived(expandable?.forceRender === true);
  const expandIcon = $derived(expandable?.expandIcon ?? config.table?.expandable?.expandIcon);
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
  type TableRowEntry = (typeof visibleRows)[number];

  interface TableCellContent {
    record: Row;
    index: number;
    render: TableColumn<Row>['render'];
    value: unknown;
    display: ReturnType<typeof resolveTableCellDisplay<Row>>;
  }

  const treeControlColumn = $derived(rowSelection ? 1 : 0);

  let resolvedDisabled = $derived((disabled ?? config.componentDisabled) || loadingRequested);
  const pagerDisabled = $derived(resolvedDisabled || Boolean(pagerOptions?.disabled));
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
  // An explicit column width overrides both the token and the previous unthemed size.
  const selectionWidth = $derived(selectionOptions?.columnWidth ?? (designTheme.enabled
    ? designTheme.state.token.Table?.selectionColumnWidth : 48));
  let resolvedSize = $derived(size ?? config.componentSize);
  const pagerSize = $derived(
    getTablePagerSize(pagerOptions?.size, size ?? config.explicitComponentSize)
  );
  const semanticProps: TableProps<Row> = $derived({
    ...rawProps,
    sorter, filters, current, pageSize, selectedRowKeys, nativeElement,
    size: size ?? config.explicitComponentSize,
    bordered
  });
  const semantics = $derived(getTableSemantics(config.table, semanticProps));
  const classes = $derived(semantics.classes);
  const slots = $derived(semantics.styles);
  const rootStyle = $derived(appendSemanticStyle(componentTheme.style || undefined, slots.root));
  const spinTheme = $derived(designTheme.enabled
    ? getTableSpinTheme(designTheme.state, rootStyle) : undefined);
  const themedRootStyle = $derived(appendSemanticStyle(rootStyle, spinTheme?.root));
  const spinStyles = $derived(spinTheme ? getLoadingStyles : spinOptions?.styles);
  const pagerSemantics = $derived(
    getTablePaginationSemantics(classes.pagination, slots.pagination, pagination)
  );
  const strings = $derived(resolveTableLocale(config.locale.table, locale));
  const regionLabelledBy = $derived(ariaLabelledBy ?? captionReference);
  const regionLabel = $derived(
    regionLabelledBy ? undefined : captionText ?? ariaLabel ?? strings.label
  );
  let captionElement = $state<HTMLTableCaptionElement>();
  let content = $state<HTMLDivElement>();
  let table = $state<HTMLTableElement>();
  let bodyElement = $state<HTMLElement>();
  let stickyBar = $state.raw<TableStickyBarLayout>();
  // The header layout and leaf order use the same visible columns.
  let columnLayout = $derived(getTableColumnLayout(
    resolvedColumns,
    breakpoint.connected ? breakpoint.screens : {},
    {
      selection: rowSelection ? {
        width: selectionWidth,
        align: selectionOptions?.align,
        fixed: selectionOptions?.fixed,
        onCell: selectionOptions?.onCell
      } : undefined,
      expansion: expandedRowRender ? {
        automatic: expandable?.showExpandColumn !== false,
        width: expandable?.columnWidth ?? (designTheme.enabled ? undefined : 48),
        fixed: expandable?.fixed
      } : undefined
    }
  ));
  let leaves = $derived(columnLayout.leaves);
  let headerRows = $derived(columnLayout.headings.length ? columnLayout.headings : [[]]);
  const headerRowProperties = $derived.by(() => {
    const configure = onHeaderRow;
    if (!showHeader || !configure) {
      return undefined;
    }

    return headerRows.map((row, index) => configure(columnsAtHeaderLevel(row), index) ?? undefined);
  });
  let headerCount = $derived(showHeader ? headerRows.length : 0);
  let hasCellProps = $derived(leaves.some(({ column }) => Boolean(column.onCell)));
  let hovered = $state<{ key: TableKey; leaf: number; first: number; last: number; }>();
  let hasHeaderProps = $derived(headerRows.some(row => row.some(({ column }) =>
    column.onHeaderCell || column.colSpan !== undefined || column.rowSpan !== undefined
  )));
  let columnWidths = $derived(leaves.map(({ column }) => column.width));
  let columnCount = $derived(Math.max(columnWidths.length, 1));
  let fixedColumns = $derived(leaves.map(leaf => leaf.fixed));
  let fixedCells = $derived(fixedColumns.map((fixed, index) => ({
    side: fixed === true ? 'start' : fixed || undefined,
    offset: `var(--ant-table-fixed-${index}, auto)`
  })));
  let tableSection = $state<HTMLDivElement>();
  type Band = 'header' | 'summary';
  let bandNodes = $state<Partial<Record<Band, HTMLDivElement>>>({});
  let bandTables = $state<Partial<Record<Band, HTMLTableElement>>>({});
  let summaryBandHeight = $state(0);
  let bodyLayout = $state.raw<{ widths: readonly number[]; width: number; }>();

  const customBody = createTableCustomBody({
    container: () => tableSection,
    bands: () => [bandNodes.header, bandNodes.summary],
    rows: () => pageRows,
    rtl: () => config.direction === 'rtl'
  });
  const customGutter = $derived(scroll?.y === undefined ? 0 : customBody.info.scrollbarSize);
  const fixedGutter = $derived(fixedColumns.at(-1) === 'end');
  const customWidths = $derived.by(() => {
    if (!bodyRenderer || !pageRows.length) {
      return undefined;
    }

    const widths = columnWidths.map((width, index) => {
      const measured = index === columnWidths.length - 1
        ? Number(width) - customBody.info.scrollbarSize : width;
      return typeof measured === 'number' && Number.isFinite(measured) ? Math.max(0, measured) : 0;
    });
    return widths.some(Boolean) ? widths : undefined;
  });
  const stickyOptions = $derived(typeof sticky === 'object' ? sticky : {});

  provideTableSummary({
    get prefix() { return prefix; },
    fixedSpan
  });

  $effect(() => {
    const owner = bodyRenderer ? tableSection : content;
    const view = owner?.ownerDocument.defaultView;
    if (view && hasResponsiveColumns) {
      // useBreakpoint attaches theme breakpoints for the current subscription's lifetime.
      return breakpoint.connect(view, untrack(() => mediaQueries));
    }
  });

  const scrollport = createTableViewport({
    rows: () => visibleRows,
    widths: () => columnWidths,
    minWidths: () => leaves.map(({ column }) => column.minWidth),
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
    body: () => bodyElement,
    element: () => content,
    customElement: () => bodyRenderer ? customBody.element ?? null : undefined,
    header: () => showHeader && !splitBands,
    caption: () => captionElement,
    summary: () => splitBands && summaryPlacement !== 'inline' ? undefined : summaryPlacement,
    rtl: () => config.direction === 'rtl'
  });
  // The built-in virtual body replaces the outer table entirely, as in React.
  const tableElement = $derived(scrollport.active ? undefined : components?.table);
  const bodyElements = $derived(typeof components?.body === 'object'
    && (!virtual || scrollport.active) ? components.body : undefined);
  const bandWidths = $derived(bodyRenderer ? customWidths : bodyLayout?.widths);
  const bandWidth = $derived(bodyRenderer || !bodyLayout ? horizontalWidth
    : bodyLayout.width + customGutter);
  const contentStyle = $derived.by(getContentStyle);
  const resolvedLayout = $derived.by(() => {
    if (scrollport.active) {
      // The header and virtual rows use the shared widths already computed.
      return 'fixed';
    }

    const x = horizontalWidth;
    const pinned = fixedColumns.some(Boolean);
    if (virtual && scroll?.y === undefined && pinned && tableLayout === undefined) {
      // With no row window, fixed layout retains the pinned column widths.
      return 'fixed';
    }

    const horizontal = x !== undefined || Boolean(expandable?.fixed);
    const fixed = horizontal && pinned;
    const ellipsis = leaves.some(({ column }) => Boolean(column.ellipsis));
    return getTableLayout(tableLayout, x, fixed, pinHeader, ellipsis);
  });

  let cellPlan = $derived.by(() => {
    if (!scrollport.active || !hasCellProps) {
      return undefined;
    }

    const start = scrollport.start;
    const end = start + scrollport.rows.length - 1;
    return resolveTableVirtualCells(visibleRows, leaves.map(leaf => leaf.column), start, end);
  });

  // Computes merged-cell position and size from the same virtual window's measurements.
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
  // A row and its span layer share one callback's attributes and the same index.
  const bodyRowProperties = $derived.by(() => {
    const configure = onRow;
    if (!configure) {
      return undefined;
    }

    const properties = new Map<TableKey, TableRowProps | undefined>();
    const start = scrollport.start;
    for (const [offset, { row }] of scrollport.rows.entries()) {
      properties.set(row.key, configure(row.record, start + offset) ?? undefined);
    }
    for (const { row, sourceIndex } of mergedRows) {
      if (!properties.has(row.key)) {
        properties.set(row.key, configure(row.record, sourceIndex) ?? undefined);
      }
    }

    return properties;
  });
  // Custom summary rows keep their native semantics and their own attributes.
  const virtualRowIndices = $derived(
    scrollport.active && !expandedRowRender && !mergedRows.length && !summaryRender
  );
  const inlineHeaderCount = $derived(splitBands ? 0 : headerCount);
  const emptyCell = resolveTableCell();

  function measureMergedRow({ index, cells }: TableMergedRow, offsets: readonly number[]) {
    const entry = visibleRows[index];
    const key = entry.row.key;
    const top = scrollport.getSize(key).top;
    const parts = [];
    let previousRight = 0;

    for (const origin of cells) {
      const first = origin.columnIndex;
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

  /** Scrolls the current page by absolute position, key, or index. */
  export function scrollTo(target: TableScrollConfig): void {
    if (bodyRenderer) {
      scrollport.cancelReset();
      customBody.scrollTo(target);
    }
    else {
      scrollport.scrollTo(target);
    }
  }

  function cssSize(value: string | number | undefined) {
    return typeof value === 'number' ? `${value}px` : value;
  }

  /** Passes the renderer the default table's size and layout algorithm. */
  function tableStyle(minWidth: string | undefined, width: number | string | undefined) {
    return [
      minWidth && `min-width: ${minWidth};`,
      width !== undefined && `width: ${cssSize(width)};`,
      `table-layout: ${resolvedLayout};`
    ].filter(Boolean).join(' ');
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

  /** Retains accepted content for the lifetime of the mounted cell. */
  function createCellContentReader() {
    let accepted: TableCellContent | undefined;

    /** Passes the original records to the predicate. A rejection preserves the previous render parameters. */
    return function readCellContent(leaf: TableLeaf<Row>, entry: TableRowEntry) {
      if (leaf.service) {
        return undefined;
      }

      const { row: { record }, index } = entry;
      const { dataIndex, render, shouldCellUpdate } = leaf.column;
      const previous = accepted;

      // State read by the owner's callback does not become a cell dependency.
      if (previous && shouldCellUpdate
        && !untrack(() => shouldCellUpdate(record, previous.record))) {
        return previous;
      }

      accepted = {
        record,
        index,
        render,
        value: render ? readTableCellValue(record, dataIndex) : undefined,
        display: render ? undefined : resolveTableCellDisplay(record, dataIndex)
      };
      return accepted;
    };
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

  // A node removed from the virtual window may never receive mouseleave.
  function detachHoveredCell(key: TableKey, leaf: number) {
    return () => clearHoveredCell(key, leaf);
  }

  function cellHoverEvents(cell: TableCell, key: TableKey, leaf: number, index: number) {
    if (!rowHoverable || !hasCellProps) {
      return undefined;
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

  /** Keeps the row or theme style and adds the configured semantic layer. */
  function appendSemanticStyle(base?: string | null, semantic?: string) {
    if (!semantic) {
      return base;
    }

    return base ? `${base};${semantic}` : semantic;
  }

  /** Retains slot properties when layout supplies no value for them. */
  function getContentStyle() {
    const dimensions = {
      'max-height': cssSize(scrollport.maxHeight ?? scroll?.y),
      'scroll-padding-top': cssSize(scrollport.topInset),
      'scroll-padding-bottom': cssSize(scrollport.bottomInset),
      '--ant-table-virtual-caption-height': cssSize(scrollport.captionHeight)
    };
    const declarations: string[] = [];
    for (const [property, value] of Object.entries(dimensions)) {
      if (value != null && value !== '') {
        declarations.push(`${property}: ${value};`);
      }
    }

    const layout = declarations.join(' ') || undefined;
    if (pinHeader) {
      return layout;
    }

    return appendSemanticStyle(layout, slots.content);
  }

  // Cell slots apply after layout CSS and attributes from the caller.
  function cellStyle(
    fixed: TableFixedCell | undefined,
    zIndex: number,
    align: TableColumn<Row>['align'],
    custom: TableCell['style'],
    semantic?: string
  ) {
    const side = fixed?.side;
    const inset = side && (
      `inset-inline-${side}: ${fixed.offset};`
      + ` z-index: ${zIndex}`
    );
    return [inset, align && `text-align: ${align}`, custom, semantic]
      .filter(Boolean).join('; ') || undefined;
  }

  // A merged cell is pinned according to the side of its outermost columns.
  function fixedSpan(index: number, span: number) {
    const first = fixedCells[index];
    const last = fixedCells[index + span - 1];
    if (!first?.side || first.side !== last?.side) {
      return undefined;
    }

    return first.side === 'start' ? first : last;
  }

  function isFixedBoundary(index: number, span: number): boolean {
    const side = fixedSpan(index, span)?.side;
    if (!side) {
      return false;
    }

    const neighbor = side === 'start' ? index + span : index - 1;
    return fixedCells[neighbor]?.side !== side;
  }

  function handleScroll(event: Event & { currentTarget: HTMLDivElement; }) {
    if (splitBands) {
      customBody.syncScroll(event);
    }
    if (scrollport.handleScroll(event.currentTarget)) {
      onScroll?.(event);
    }
  }

  /** Uses the element's own DOM window, including for tables inside an iframe. */
  function readTableElement(node: HTMLElement) {
    const TableElement = node.ownerDocument.defaultView?.HTMLTableElement;
    return TableElement && node instanceof TableElement ? node : undefined;
  }

  /** Retains the table used for scrolling and measuring the widths and heights of its parts. */
  function registerTable(node: HTMLElement) {
    const element = readTableElement(node);
    table = element;
    return () => {
      if (table === element) {
        table = undefined;
      }
    };
  }

  /** Connects the virtual window to the rendered body section. */
  function registerBody(node: HTMLElement) {
    bodyElement = node;
    return () => {
      if (bodyElement === node) {
        bodyElement = undefined;
      }
    };
  }

  /** Leaf elements also get a safe attachment when measurements are unavailable. */
  function ignoreElementRef() {}

  /** Adds overlay-cell dimensions after the default element's style. */
  function spanCellStyle(style: string | undefined, span?: {
    width: number; height: number; gap: number;
  }) {
    if (!span) {
      return style;
    }

    const { width, height, gap } = span;
    const geometry = (
      `--ant-table-span-width:${width}px;`
      + `--ant-table-span-height:${height}px;`
    )
      + `--ant-table-span-gap:${gap}px`;
    return appendSemanticStyle(style, geometry);
  }

  /** Registers the table for a specific strip independently of its renderer. */
  function registerBandTable(kind: Band, node: HTMLElement) {
    const element = readTableElement(node);
    bandTables[kind] = element;
    return () => {
      if (bandTables[kind] === element) {
        bandTables[kind] = undefined;
      }
    };
  }

  /** Pins the detached strip's columns using its own grid and scrollbar gutter. */
  function attachBand(kind: Band, band: HTMLDivElement) {
    bandNodes[kind] = band;
    const disconnect = customBody.attachBand(band);
    $effect(() => {
      const bandTable = bandTables[kind];
      return bandTable && observeTableLayout({
        table: bandTable,
        viewport: band,
        fixed: fixedColumns,
        stickyHeader: false,
        hasBodyRows: false,
        measureColumns: true,
        endGutter: customGutter,
        onMeasure: kind === 'summary' ? () => { summaryBandHeight = band.offsetHeight; } : undefined
      });
    });
    return () => {
      disconnect();
      if (bandNodes[kind] === band) {
        bandNodes[kind] = undefined;
        if (kind === 'summary') {
          summaryBandHeight = 0;
        }
      }
    };
  }

  /** Publishes body widths only when the layout changes. */
  function readBodyLayout(widths: readonly number[], width: number) {
    const previous = untrack(() => bodyLayout);
    if (previous?.width === width && previous.widths.length === widths.length
      && previous.widths.every((value, index) => value === widths[index])) {
      return;
    }

    bodyLayout = { widths, width };
  }

  /** Updates the strip on the current horizontal scroll owner. */
  function dragStickyScrollbar(offset: number) {
    if (splitBands) {
      scrollport.cancelReset();
      const scrollLeft = config.direction === 'rtl' ? -offset : offset;
      customBody.syncScroll({ scrollLeft });
    }
    else {
      scrollport.scrollHorizontal(offset);
    }
  }

  $effect(() => {
    const element = table;
    const viewport = content;
    const fixed = fixedColumns;
    const separate = splitBands;
    const stickyHeader = headerCount > 0 && pinHeader && !separate;
    const hasExpansion = Boolean(expandedRowRender);

    if (!element || !viewport
      || (!separate && !fixed.some(Boolean) && !stickyHeader && !hasExpansion)) {
      return;
    }

    if (stickyHeader) {
      // A change to inline row styles requires writing the measured header offsets again.
      void headerRowProperties;
    }

    const disconnect = observeTableLayout({
      table: element, viewport, fixed, stickyHeader,
      hasBodyRows: (!showHeader || separate) && scrollport.rows.length > 0,
      measureColumns: separate || (showHeader ? hasHeaderProps : hasCellProps || Boolean(summaryRender)),
      onMeasure: separate ? readBodyLayout : undefined
    });
    return () => {
      disconnect();
      if (separate) bodyLayout = undefined;
    };
  });

  $effect(() => {
    const viewport = content;
    if (splitBands && !bodyRenderer && viewport) {
      return customBody.info.ref(viewport);
    }
  });

  $effect(() => {
    const viewport = content;
    const element = table;
    if (!viewport || !element || !sticky) {
      return;
    }

    return observeTableSticky(viewport, element, stickyOptions, summaryPlacement, layout => {
      stickyBar = layout;
    }, splitBands ? tableSection : undefined);
  });

  $effect(() => {
    const viewport = customBody.element;
    const section = tableSection;
    if (!bodyRenderer || !sticky || !viewport || !section) {
      return;
    }

    return observeTableSticky(viewport, undefined, stickyOptions, undefined, layout => {
      stickyBar = layout;
    }, section);
  });

  /** Container settings in loading can override the restored tokens. */
  function getLoadingStyles(info: SpinSemanticInfo) {
    const options = spinOptions?.styles;
    const styles = typeof options === 'function' ? options(info) : options;
    const container = appendSemanticStyle(spinTheme?.content, styles?.container);
    return { ...styles, container: container ?? undefined };
  }

  function readTableData(sorts: readonly TableSortState[], selected: TableFilters) {
    return getTableData(dataSource, resolvedColumns, rowKey, sorts, selected, mode, childrenColumnName);
  }

  interface TableChangeRequest {
    sorts?: readonly TableSortState[];
    filters?: TableFilters;
    data?: ReturnType<typeof readTableData>;
    pagination?: TableChange<Row>['pagination'];
  }

  /** Controlled columns can request data that differs from what is displayed. */
  function getChangeData(requested?: TableChangeRequest) {
    if (requested?.sorts === undefined && requested?.filters === undefined) {
      return tableData;
    }

    return readTableData(requested.sorts ?? activeSorts, requested.filters ?? appliedFilters);
  }

  function notifyChange(action: TableChange<Row>['action'], requested?: TableChangeRequest) {
    scrollport.resetAfterChange();
    if (!onChange) {
      return;
    }

    const data = requested?.data ?? getChangeData(requested);
    const showSorters = multipleSort || data.sorters.length > 1;
    const page = requested?.pagination ?? paging;
    onChange({
      action,
      pagination: { current: page.current, pageSize: page.pageSize, total: page.total },
      sorter: data.sorter ? { ...data.sorter } : null,
      ...(showSorters ? { sorters: data.sorters.map(state => ({ ...state })) } : {}),
      ...(hasFilters ? { filters: getTableFilters(resolvedColumns, data.filters, mode) } : {}),
      currentDataSource: data.rows.map(row => row.record)
    });
  }

  function changeSort(column: TableColumn<Row>, next: TableSorter | null) {
    if (resolvedDisabled) {
      return;
    }

    if (!controlledSorts.length && (sorter !== undefined || !multipleSort)) {
      sorter = next;
      notifyChange('sort');
      return;
    }

    const requested = changeTableSorts(dataColumns, activeSorts, column, next?.order ?? null);
    localSorts = requested;
    // A controlled column displays the owner's order. Its event describes the requested order.
    notifyChange('sort', controlledSorts.length ? { sorts: requested } : undefined);
  }

  function changePage(page: number, size: number) {
    if (pagerDisabled) {
      return;
    }

    // A pager handler can replace rows and total synchronously.
    const request = {
      data: tableData,
      pagination: { current: page, pageSize: size, total: paging.total }
    };
    const options = pagerOptions;
    options?.onChange?.(page, size);
    current = page;
    pageSize = size;
    localPage = { current: page, pageSize: size };
    notifyChange('paginate', request);
  }

  // Pager changes go through onChange so both instances read the same page.
  function keepPageRequest() {}

  function changePagerSize(previous: number, size: number) {
    if (!pagerDisabled) {
      pagerOptions?.onShowSizeChange?.(previous, size);
    }
  }

  function changeFilter(columnKey: string, values: TableFilterValue[]) {
    if (resolvedDisabled) {
      return;
    }

    const request = { ...appliedFilters, [columnKey]: [...values] };
    const active = getTableFilters(resolvedColumns, request, mode);
    if (areTableFiltersEqual(active, tableData.filters)) {
      return;
    }

    const onlyColumnFilters = controlledFilters !== undefined && !usesTableFilterState;
    const reportRequested = onlyColumnFilters
      || (controlledFilters !== undefined && Object.hasOwn(controlledFilters, columnKey));
    const next = onlyColumnFilters ? request : { ...storedFilters };
    if (Object.hasOwn(active, columnKey)) {
      next[columnKey] = active[columnKey];
    }
    else {
      delete next[columnKey];
    }

    // Retains the query for local mode after filteredValue is removed.
    if (onlyColumnFilters || localColumnFilters !== undefined) {
      localColumnFilters = next;
    }

    filters = next;
    current = 1;
    localPage = { ...localPage, current: 1 };

    const options = pagerOptions;
    const requestedFilters = reportRequested ? active : undefined;
    const requestedPage = { current: 1, pageSize: paging.pageSize, total: paging.total };
    const data = onChange && options?.onChange
      ? getChangeData({ filters: requestedFilters }) : undefined;
    options?.onChange?.(requestedPage.current, requestedPage.pageSize);
    notifyChange('filter', { filters: requestedFilters, pagination: requestedPage, data });
  }

  /** Finds the name source in the array and lets the browser determine the snippet's accessible name. */
  function hasHeadingLabel(content: RenderEmptyContent): boolean {
    if (typeof content === 'function' || typeof content === 'number') {
      return true;
    }
    if (typeof content === 'string') {
      return content.trim() !== '';
    }

    return Array.isArray(content) && content.some(hasHeadingLabel);
  }

  function sortDescription(order: TableSortOrder | undefined): string {
    return order === 'ascend'
      ? strings.sortAscending
      : order === 'descend' ? strings.sortDescending : strings.cancelSort;
  }

  // rowExpandable governs detail panels. A child array identifies a branch.
  function canExpandRow(row: TableRow<Row>): boolean {
    return expandedRowRender ? expandable?.rowExpandable?.(row.record) ?? true
      : tree && row.children !== undefined;
  }

  function expandedRowClass(record: Row, index: number, indent: number): string | undefined {
    const className = expandable?.expandedRowClassName;
    return typeof className === 'function' ? className(record, index, indent) : className;
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

  // Built-in controls and cell editors handle their own clicks and keyboard events.
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

  // Built-in expansion finishes before the consumer's onclick, as upstream.
  function rowClick(
    row: TableRow<Row>, canExpand: boolean, listener: TableRowProps['onclick']
  ): TableRowProps['onclick'] {
    if (!expandable?.expandRowByClick || !canExpand) {
      return listener;
    }

    return event => {
      expandByRowClick(row, event);
      listener?.(event);
    };
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

  // Nested rows have their own tr. aria-controls connects the button to visible children.
  function expandedTargets(row: TableRow<Row>, nested: boolean): string | undefined {
    if (!nested) {
      return expansionId(row.key);
    }

    const targets = row.children?.map(child => {
      const properties = bodyRowProperties?.get(child.key);
      return properties?.id ?? expansionId(child.key, 'row');
    });
    return targets?.join(' ') || undefined;
  }

  // The custom toggle issues the same request as the default button.
  function expandIconInfo(
    row: TableRow<Row>, canExpand: boolean, expanded: boolean, ariaControls: string | undefined
  ): TableExpandIconInfo<Row> {
    return {
      prefixCls: prefix,
      record: row.record,
      expanded,
      expandable: canExpand,
      disabled: resolvedDisabled || !canExpand,
      ariaControls,
      onExpand(event) {
        event?.stopPropagation();
        if (!event?.defaultPrevented) {
          changeExpansion(row);
        }
      }
    };
  }

  function serviceCellClass(service: TableServiceColumn): string {
    return service === 'selection' ? `${prefix}-selection-column`
      : `${prefix}-row-expand-icon-cell`;
  }

  function columnsAtHeaderLevel(row: readonly TableHeading<Row>[]): TableColumn<Row>[] {
    if (!row.length) {
      return [{ key: '', title: '' }];
    }

    return row.map(({ service, visibleColumn }) => service
      ? { ...visibleColumn, className: serviceCellClass(service) } : visibleColumn);
  }
</script>

<style>
  [data-ant-table-part="wrapper"] {
    min-width: 0;
    max-width: 100%;
  }
  [data-ant-table-part="content"] {
    max-width: 100%;
    overflow-x: auto;
    overscroll-behavior-x: contain;
  }
  .table-sticky {
    isolation: isolate;
    scroll-padding-inline: var(--ant-table-fixed-start-width, 0px) var(--ant-table-fixed-end-width, 0px);
  }
  .table-scroll-y {
    overflow-y: auto;
    overscroll-behavior-y: contain;
    scroll-padding-top: var(--ant-table-header-height, 0px);
  }
  .table-virtual-container {
    position: relative;
    isolation: isolate;
  }
  .table-sticky-container { position: relative; }
  .table-custom-band {
    max-width: 100%;
    overflow: hidden;
  }
  .table-sticky-band {
    position: sticky;
    z-index: 3;
  }
  .table-custom-band :global(th[data-ant-table-scrollbar]) { padding: 0; }
  [data-ant-table-part="content"].table-virtual-scroll {
    scrollbar-width: none;
    overflow-anchor: none;
  }
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
  :global([data-ant-table-part="body"].table-span-body) { position: relative; }
  :global([data-ant-table-part="span-row"].table-span-row) {
    position: absolute;
    inset-inline: 0;
    display: flex;
    align-items: flex-start;
    pointer-events: none;
  }
  :global(.table-span-row > :is(td, th)) {
    display: block;
    box-sizing: border-box;
    flex: 0 0 var(--ant-table-span-width);
    width: var(--ant-table-span-width);
    height: var(--ant-table-span-height);
    margin-inline-start: var(--ant-table-span-gap);
    align-content: center;
    pointer-events: auto;
  }
  [data-ant-table-part="wrapper"] :global([data-ant-table-part="cell"].table-fixed-cell) {
    position: var(--ant-table-fixed-position, relative);
    background: var(--ant-color-bg-container);
  }
  [data-ant-table-part="wrapper"] :global([data-ant-table-part="body"] > tr > th.table-fixed-cell) { background: linear-gradient(var(--ant-table-header-bg), var(--ant-table-header-bg)) var(--ant-color-bg-container); }
  [data-ant-table-part="wrapper"] .table-pin-head :global([data-ant-table-part="head"] > tr > th) {
    position: sticky;
    top: calc(var(--ant-table-sticky-head-top, 0px)
      + var(--ant-table-virtual-caption-height, 0px) + var(--ant-table-header-row-offset, 0px));
    z-index: 2;
  }
  /* An opaque backing is also needed for theme tokens with alpha. */
  [data-ant-table-part="wrapper"] .table-pin-head :global([data-ant-table-part="head"] > tr > th),
  [data-ant-table-part="wrapper"] :global([data-ant-table-part="head"] > tr > .table-fixed-cell) { background: linear-gradient(var(--ant-table-header-bg), var(--ant-table-header-bg)) var(--ant-color-bg-container); }
  [data-ant-table-part="wrapper"] .table-pin-head :global([data-ant-table-part="head"] > tr > th[data-ant-table-sorted]),
  [data-ant-table-part="wrapper"] :global([data-ant-table-part="head"] > tr > .table-fixed-cell[data-ant-table-sorted]) { background: linear-gradient(var(--ant-table-header-sort-active-bg), var(--ant-table-header-sort-active-bg)) var(--ant-color-bg-container); }
  [data-ant-table-part="wrapper"] .table-pin-head :global([data-ant-table-part="head"] > tr > th[data-ant-table-sortable]:hover),
  [data-ant-table-part="wrapper"] :global([data-ant-table-part="head"] > tr > .table-fixed-cell[data-ant-table-sortable]:hover) { background: linear-gradient(var(--ant-table-header-sort-hover-bg), var(--ant-table-header-sort-hover-bg)) var(--ant-color-bg-container); }
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
  [data-ant-table-part="wrapper"] :global([data-ant-table-part="body"] > tr > :where(td).table-fixed-cell[data-ant-table-sorted]) { background: linear-gradient(var(--ant-table-body-sort-bg), var(--ant-table-body-sort-bg)) var(--ant-color-bg-container); }
  [data-ant-table-part="wrapper"] :global([data-ant-table-part="body"] > tr[data-ant-table-selected] > .table-fixed-cell) { background: linear-gradient(var(--ant-table-row-selected-bg), var(--ant-table-row-selected-bg)) var(--ant-color-bg-container); }
  .table-source-theme :global([data-ant-table-part="head"] th[data-ant-table-sortable]:hover [data-ant-table-part="sorter"]) { color: var(--ant-table-header-icon-hover-color); }
  [data-ant-table-part="wrapper"].table-source-theme :global([data-ant-table-part="head"] th[data-ant-table-sortable].table-fixed-cell:hover) { background: linear-gradient(var(--ant-table-fixed-header-sort-active-bg), var(--ant-table-fixed-header-sort-active-bg)) var(--ant-color-bg-container); }
  .table-source-theme:not(.table-hover-disabled) :global([data-ant-table-part="body"] > tr[data-ant-table-part="row"]:is(:hover, [data-ant-table-span-hovered]) > td) { background: var(--ant-table-row-hover-bg); }
  .table-source-theme:not(.table-hover-disabled) :global([data-ant-table-part="body"] > tr[data-ant-table-part="row"][data-ant-table-selected]:is(:hover, [data-ant-table-span-hovered]) > :is(th, td)) { background: var(--ant-table-row-selected-hover-bg); }
  .table-source-theme:not(.table-hover-disabled) :global([data-ant-table-part="body"] > tr[data-ant-table-part="row"]:is(:hover, [data-ant-table-span-hovered]) > td.table-fixed-cell) { background: linear-gradient(var(--ant-table-row-hover-bg), var(--ant-table-row-hover-bg)) var(--ant-color-bg-container); }
  .table-source-theme:not(.table-hover-disabled) :global([data-ant-table-part="body"] > tr[data-ant-table-part="row"][data-ant-table-selected]:is(:hover, [data-ant-table-span-hovered]) > :is(th, td).table-fixed-cell) { background: linear-gradient(var(--ant-table-row-selected-hover-bg), var(--ant-table-row-selected-hover-bg)) var(--ant-color-bg-container); }
  [data-ant-table-part="content"]:focus-visible {
    outline: var(--ant-line-width-focus) solid var(--ant-color-primary-border);
    outline-offset: 2px;
  }
  caption {
    padding: var(--ant-padding-sm);
    color: var(--ant-color-text-heading);
    text-align: start;
    font-weight: 600;
  }
  caption:empty { padding: 0; }
  .column-heading {
    display: flex;
    align-items: center;
    gap: var(--ant-margin-xxs);
  }
  .column-heading > :global(:first-child) { flex: 1; }
  .column-heading-ellipsis > :global(:first-child) { min-width: 0; }
  .table-ellipsis-content {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .loading-state {
    display: flex;
    align-items: center;
    gap: var(--ant-margin-xs);
    padding: var(--ant-padding-sm);
    color: var(--ant-color-primary);
  }
  /* Spin receives focus before the wrapper becomes inert and its style changes. */
  [data-ant-table-part="wrapper"] > :global([data-ant-table-passive-spin]) {
    position: static;
    color: inherit;
    font: inherit;
  }
  [data-ant-table-part="wrapper"] > :global([data-ant-table-passive-spin] > [data-ant-spin-part="container"]) {
    display: contents;
  }
  [data-ant-table-part="wrapper"] > :global([data-ant-table-passive-spin] > [data-ant-spin-part="container"]::after) {
    content: none;
  }
  [data-ant-table-part="wrapper"] [data-ant-table-part="expand-icon"]:disabled {
    color: var(--ant-color-text-disabled);
    border-color: var(--ant-table-border-color);
    cursor: not-allowed;
  }
  [data-ant-table-part="wrapper"] [data-ant-table-part="table"] :global([data-ant-table-part="body"] > tr[data-ant-table-part="expanded-row"] > td[data-ant-table-part="cell"]) { padding: 0; }
  .expanded-content {
    position: sticky;
    inset-inline-start: 0;
    box-sizing: border-box;
    width: var(--ant-table-viewport-width, 100%);
    max-width: 100%;
    padding: var(--ant-table-cell-padding-block) var(--ant-table-cell-padding-inline);
    overflow-wrap: anywhere;
  }
  [data-ant-table-size="medium"] .expanded-content { padding: var(--ant-table-cell-padding-block-md) var(--ant-table-cell-padding-inline-md); }
  [data-ant-table-size="small"] .expanded-content { padding: var(--ant-table-cell-padding-block-sm) var(--ant-table-cell-padding-inline-sm); }
</style>

{#snippet overrideElement<Tag extends TableElementTag>(
  renderer: TableElement<NoInfer<Tag>>,
  tag: Tag,
  attributes: TableElementAttributes<NoInfer<Tag>>,
  children: Snippet,
  ref?: Attachment<HTMLElement>
)}
  {#if typeof renderer === 'function'}
    {@render renderer({ tag, attributes, children, ref: ref ?? ignoreElementRef })}
  {:else}
    {@const forwarded: Record<string, unknown> = attributes}
    <svelte:element this={renderer} {...forwarded} {@attach ref}>
      {@render children()}
    </svelte:element>
  {/if}
{/snippet}

{#snippet headCell(attributes: TableElementAttributes<'th'>, children: Snippet)}
  {#if headerElements?.cell && headerElements.cell !== 'th'}
    {@render overrideElement(headerElements.cell, 'th', attributes, children)}
  {:else}
    <th {...attributes}>{@render children()}</th>
  {/if}
{/snippet}

{#snippet dataCell(
  tag: 'td' | 'th',
  attributes: TableElementAttributes<'td' | 'th'>,
  children: Snippet,
  ref?: Attachment<HTMLElement>
)}
  {@const renderer = bodyElements?.cell}
  {@const element = typeof renderer === 'string' && renderer ? renderer : tag}
  {#if typeof renderer === 'function'}
    {@render overrideElement(renderer, tag, attributes, children, ref)}
  {:else if element === 'th'}
    <!-- Static th and td preserve the editor during Svelte 5.57 hydration, including when the tag is replaced. -->
    <th {...attributes} {@attach ref}>{@render children()}</th>
  {:else if element === 'td'}
    <td {...attributes} {@attach ref}>{@render children()}</td>
  {:else if renderer}
    {@render overrideElement(renderer, tag, attributes, children, ref)}
  {/if}
{/snippet}

{#snippet dataRow(
  attributes: TableElementAttributes<'tr'>,
  children: Snippet,
  ref?: Attachment<HTMLElement>
)}
  {#if bodyElements?.row && bodyElements.row !== 'tr'}
    {@render overrideElement(bodyElements.row, 'tr', attributes, children, ref)}
  {:else}
    <tr {...attributes} {@attach ref}>{@render children()}</tr>
  {/if}
{/snippet}

{#snippet emptyElement()}{/snippet}

{#snippet expansionControl(row: TableRow<Row>, canExpand: boolean, expanded: boolean, depth?: number)}
  {@const nested = depth !== undefined}
  {@const controls = expanded && canExpand ? expandedTargets(row, nested) : undefined}
  {#if depth !== undefined}
    <span
      aria-hidden="true"
      class={`${prefix}-row-indent indent-level-${depth}`}
      style:padding-inline-start={`${depth * indentSize}px`}
    ></span>
  {/if}
  {#snippet origin()}
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
        aria-controls={controls}
        onclick={event => {
          event.stopPropagation();
          changeExpansion(row);
        }}
      ></button>
    {:else if nested}
      <span aria-hidden="true" class={`${prefix}-row-expand-icon ${prefix}-row-expand-icon-spaced`}></span>
    {/if}
  {/snippet}
  {#if expandIcon}
    {@render expandIcon(expandIconInfo(row, canExpand, expanded, controls), origin)}
  {:else}
    {@render origin()}
  {/if}
{/snippet}

{#snippet columnHeading(cell: TableHeading<Row>)}
  {@const column = cell.column}
  {@const fixed = fixedSpan(cell.start, cell.colSpan)}
  {@const props = resolveTableCell(column.onHeaderCell?.(column), cell.colSpan, cell.rowSpan)}
  {@const sortable = isTableSortable(column, mode)}
  {@const currentSort = sortsByColumn.get(column.key)}
  {@const order = currentSort?.order}
  {@const directions = column.sortDirections ?? sortDirections}
  {@const nextSort = sortable ? getNextTableSorter(column.key, currentSort ?? null, directions) : null}
  {@const tooltip = column.showSorterTooltip === undefined
    ? showSorterTooltip : column.showSorterTooltip}
  {@const filterOptions = getTableFilterOptions(column, mode)}
  {@const hasColumnFilter = Boolean(filterOptions || column.filterDropdown)}
  {@const title = column.title}
  {@const titleSnippet = typeof title === 'function' ? title : undefined}
  {@const titleParts = Array.isArray(title) ? title : undefined}
  {@const hasTitleContent = titleSnippet !== undefined || titleParts !== undefined}
  {@const titleText = typeof title === 'string' || typeof title === 'number'
    ? String(title) : undefined}
  {@const titleId = titleSnippet || hasHeadingLabel(titleParts)
    ? `ant-table-column-title-${id}-${columnIndices.get(column.key)}` : undefined}
  {@const headingLabel = props.attributes['aria-label']}
  {@const titleLabel = titleText ?? headingLabel ?? column.key}
  {@const titleReference = titleText === undefined
    ? props.attributes['aria-labelledby'] ?? (headingLabel === undefined ? titleId : undefined)
    : undefined}
  {#snippet renderTitle()}
    {#if titleSnippet}{@render titleSnippet(columnTitleInfo)}
    {:else}<RenderContent value={titleParts} />{/if}
  {/snippet}
  {#if props.colSpan !== 0 && props.rowSpan !== 0}
    {@const align = column.align ?? (props.colSpan > 1 ? 'center' : undefined)}
    {@const attributes: TableElementAttributes<'th'> = {
      ...props.attributes,
      title: props.attributes.title ?? (column.ellipsis ? titleText : undefined),
      'data-ant-table-part': 'cell',
      'data-ant-table-leaf': headerCount > 1 && !cell.group ? cell.leaf : undefined,
      'data-ant-table-sortable': sortable || undefined,
      'data-ant-table-sorted': order,
      scope: cell.colSpan > 1 ? 'colgroup' : 'col',
      colspan: props.colSpan !== 1 ? props.colSpan : undefined,
      rowspan: props.rowSpan !== 1 ? props.rowSpan : undefined,
      class: [
        `${prefix}-cell`,
        column.className,
        column.ellipsis && `${prefix}-cell-ellipsis`,
        fixed?.side && `table-fixed-cell ${prefix}-cell-fix ${prefix}-cell-fix-${fixed.side}`,
        sortable && `${prefix}-column-has-sorters`,
        order && `${prefix}-column-sort`,
        classes.header.cell,
        props.className
      ],
      style: cellStyle(fixed, 3, align, props.style, slots.header.cell),
      'aria-sort': order === 'ascend' ? 'ascending' : order === 'descend' ? 'descending' : undefined
    }}
    {#snippet headingContent()}
      <div class="column-heading" class:column-heading-ellipsis={Boolean(column.ellipsis)}>
        {#if sortable}
          <TableSortButton
            {prefix}
            label={titleText}
            accessibleLabel={titleText === undefined ? titleLabel : undefined}
            {titleId}
            labelledby={titleReference}
            titleContent={hasTitleContent ? renderTitle : undefined}
            {order}
            {directions}
            sortIcon={column.sortIcon}
            {tooltip}
            wholeCell={!hasColumnFilter}
            description={sortDescription(nextSort?.order)}
            disabled={resolvedDisabled}
            onSort={() => changeSort(column, nextSort)}
          />
        {:else if hasTitleContent}
          <div id={titleId} class={`${prefix}-column-title`}>{@render renderTitle()}</div>
        {:else}<span class={column.ellipsis ? `${prefix}-column-title` : undefined}>{titleText ?? ''}</span>{/if}
        {#if hasColumnFilter}
          {@const value = Object.hasOwn(tableData.filters, column.key)
            ? tableData.filters[column.key] : []}
          {@const resetValues = column.filterResetToDefaultFilteredValue
            ? column.defaultFilteredValue : undefined}
          <TableFilter
            prefixCls={prefix}
            {dropdownPrefix}
            {rootClassName}
            {strings}
            {getPopupContainer}
            title={titleLabel}
            titleReference={titleReference}
            options={filterOptions}
            {value}
            filtered={column.filtered}
            {resetValues}
            multiple={column.filterMultiple !== false}
            filterMode={column.filterMode}
            filterSearch={column.filterSearch}
            filterDropdown={column.filterDropdown}
            filterDropdownProps={column.filterDropdownProps}
            filterOnClose={column.filterOnClose}
            filterIcon={column.filterIcon}
            disabled={resolvedDisabled}
            onApply={values => changeFilter(column.key, values)}
          />
        {/if}
      </div>
    {/snippet}
    {@render headCell(attributes, headingContent)}
  {/if}
{/snippet}

{#snippet bodyCell(
  leaf: TableLeaf<Row>,
  columnIndex: number,
  entry: TableRowEntry,
  index: number,
  cell: TableCell,
  canExpand: boolean,
  expanded: boolean,
  overlay?: { width: number; height: number; gap: number; }
)}
  {@const key = entry.row.key}
  {@const { column, service } = leaf}
  {@const fixed = fixedCells[columnIndex]}
  {@const sorted = !service && sortsByColumn.has(column.key)}
  {@const readContent = createCellContentReader()}
  {@const content = readContent(leaf, entry)}
  {@const showTitle = column.ellipsis === true || (column.ellipsis && column.ellipsis.showTitle)}
  {@const wrapText = Boolean(column.ellipsis) && !content?.render
    && isFixedBoundary(columnIndex, cell.colSpan)}
  {@const attributes = {
    ...cell.attributes,
    ...cellHoverEvents(cell, key, columnIndex, index),
    'data-ant-table-part': 'cell',
    'data-ant-table-sorted': sorted || undefined,
    title: cell.attributes.title ?? (showTitle ? content?.display?.title : undefined),
    class: [
      `${prefix}-cell`, service ? serviceCellClass(service) : column.className,
      column.ellipsis && `${prefix}-cell-ellipsis`,
      fixed.side && `table-fixed-cell ${prefix}-cell-fix ${prefix}-cell-fix-${fixed.side}`,
      sorted && `${prefix}-column-sort`,
      inHoveredRows(index, index + Math.max(1, cell.rowSpan) - 1) && `${prefix}-cell-row-hover`,
      classes.body.cell,
      cell.className
    ],
    style: cellStyle(fixed, 1, column.align, cell.style, slots.body.cell),
    colspan: cell.colSpan !== 1 ? cell.colSpan : undefined,
    rowspan: cell.rowSpan !== 1 ? cell.rowSpan : undefined
  }}
  {#snippet body()}
    {@render bodyContent(leaf, columnIndex, entry, canExpand, expanded, content, wrapText)}
  {/snippet}
  {@render dataCell(column.rowScope ? 'th' : 'td', {
    ...attributes,
    scope: column.rowScope,
    style: spanCellStyle(attributes.style, overlay)
  }, body, hasCellProps ? () => detachHoveredCell(key, columnIndex) : undefined)}
{/snippet}

{#snippet bodyContent(
  leaf: TableLeaf<Row>,
  columnIndex: number,
  entry: TableRowEntry,
  canExpand: boolean,
  expanded: boolean,
  content: TableCellContent | undefined,
  wrapText: boolean
)}
  {@const { row, depth, index } = entry}
  {@const text = content?.display?.text ?? ''}
  {#if showTreeControls && columnIndex === treeControlColumn}
    {@render expansionControl(row, canExpand, expanded, depth)}
  {/if}{#if leaf.service === 'selection'}
    {@const checked = selectedKeys.has(row.key)}
    {@const renderCell = selectionOptions?.renderCell}
    {#snippet origin()}
      {@const control = selection.control(row.key)}
      <TableSelectionControl
        radio={selection.radio}
        {checked}
        mixed={selection.indeterminate(row.key, tree)}
        disabled={resolvedDisabled || Boolean(control?.disabled)}
        label={`${strings.selectRow} ${row.key}`}
        {control}
        onToggle={(_, event) => selection.toggleRow(row, event)}
      />
    {/snippet}
    {#if renderCell}
      {@render renderCell(checked, row.record, index, origin)}
    {:else}
      {@render origin()}
    {/if}
  {:else if leaf.service === 'expand'}
    {@render expansionControl(row, canExpand, expanded)}
  {:else if content?.render}{@render content.render(
    content.record,
    content.index,
    content.value
  )}{:else if wrapText}<span
    class={`${prefix}-cell-content table-ellipsis-content`}
  >{text}</span>{:else}{text}{/if}
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

{#snippet selectionHeading()}
  {@const title = selectionOptions?.columnTitle}
  {#if typeof title === 'function'}
    {@render title(selection.radio ? undefined : selectPageControl)}
  {:else if title}
    <RenderContent value={title} />
  {:else if !selection.hideHeader}
    {@const commands = selection.commands}
    {#if commands}
      <div class={`${prefix}-selection`}>
        {@render selectPageControl()}
        <TableSelectionMenu {prefix} {commands} {strings} {getPopupContainer}
          disabled={resolvedDisabled} onCommand={selection.runCommand} />
      </div>
    {:else}
      {@render selectPageControl()}
    {/if}
  {/if}
{/snippet}

{#snippet serviceHeading(cell: TableHeading<Row>, service: TableServiceColumn)}
  {@const fixed = fixedCells[cell.leaf]}
  {@const detailsTitle = expandable?.columnTitle}
  {@const detailsLabel = typeof detailsTitle === 'string' || typeof detailsTitle === 'number'
    ? String(detailsTitle) : strings.expandColumn}
  {@const detailsOwnName = typeof detailsTitle === 'function'
    || (Array.isArray(detailsTitle) && hasHeadingLabel(detailsTitle))}
  {@const attributes: TableElementAttributes<'th'> = {
    'data-ant-table-part': 'cell',
    scope: 'col',
    rowspan: cell.rowSpan > 1 ? cell.rowSpan : undefined,
    'data-ant-table-leaf': headerCount > 1 ? cell.leaf : undefined,
    'aria-label': service === 'expand' && !detailsOwnName ? detailsLabel : undefined,
    class: [
      `${prefix}-cell`, serviceCellClass(service),
      fixed.side && `table-fixed-cell ${prefix}-cell-fix ${prefix}-cell-fix-${fixed.side}`,
      classes.header.cell
    ],
    style: cellStyle(fixed, 3, cell.column.align, undefined, slots.header.cell)
  }}
  {#snippet contents()}
    {#if service === 'selection'}
      {@render selectionHeading()}
    {:else}
      <RenderContent value={detailsTitle} />
    {/if}
  {/snippet}
  {@render headCell(attributes, contents)}
{/snippet}

{#snippet tablePager(alignment: TablePagerAlignment)}
  <Pagination
    {...pagerOptions}
    {...pagerSemantics}
    total={paging.total}
    bind:current={() => paging.current, keepPageRequest}
    bind:pageSize={() => paging.pageSize, keepPageRequest}
    disabled={pagerDisabled}
    size={pagerSize}
    class={[`${prefix}-pagination ${prefix}-pagination-${alignment}`, pagerOptions?.class]
      .filter(Boolean).join(' ')}
    onChange={changePage}
    onShowSizeChange={changePagerSize}
  />
{/snippet}

{#snippet columnGroup(widths: readonly number[] | undefined, gutter: number)}
  {#if leaves.length || gutter}
    <colgroup>
      {#each leaves as leaf, columnIndex (leaf.key)}
        {@const width = widths ? cssSize(widths[columnIndex]) : columnWidth(columnIndex)}
        {#if leaf.service === 'selection'}
          <col class={[
            (designTheme.enabled || selection.commands) && `${prefix}-selection-col`,
            selection.commands && `${prefix}-selection-col-with-dropdown`
          ]} style:width={width} />
        {:else if leaf.service === 'expand'}
          <col class={designTheme.enabled ? `${prefix}-expand-icon-col` : undefined}
            style:width={width} />
        {:else}
          <col style:width={width}
            style:min-width={resolvedLayout === 'auto' ? cssSize(leaf.column.minWidth)
              : undefined} />
        {/if}
      {/each}
      {#if gutter}
        <col data-ant-table-scrollbar style:width={cssSize(gutter)} />
      {/if}
    </colgroup>
  {/if}
{/snippet}

{#snippet tableHeader(gutter: number)}
  {#if showHeader}
    {@const attributes: TableElementAttributes<'thead'> = {
      'data-ant-table-part': 'head',
      class: [`${prefix}-thead`, classes.header.wrapper],
      style: slots.header.wrapper
    }}
    {#snippet headings()}
      {#each headerRows as row, depth}
        {@const rowProperties = headerRowProperties?.[depth]}
        {@const rowAttributes: TableElementAttributes<'tr'> = {
          ...rowProperties,
          class: [rowProperties?.class, classes.header.row],
          style: appendSemanticStyle(rowProperties?.style, slots.header.row),
          'aria-rowindex': virtualRowIndices ? depth + 1 : rowProperties?.['aria-rowindex']
        }}
        {#snippet headerCells()}
          {#each row as cell (cell.key)}
            {#if cell.service}
              {@render serviceHeading(cell, cell.service)}
            {:else}
              {@render columnHeading(cell)}
            {/if}
          {:else}
            {@render headCell({
              'data-ant-table-part': 'cell',
              class: [`${prefix}-cell`, classes.header.cell],
              style: slots.header.cell
            }, emptyElement)}
          {/each}
          {#if gutter && depth === 0}
            {@render headCell({
              'data-ant-table-part': 'cell',
              'data-ant-table-scrollbar': true,
              class: [`${prefix}-cell ${prefix}-cell-scrollbar`, fixedGutter && 'table-fixed-cell'],
              style: fixedGutter ? 'inset-inline-end: 0' : undefined,
              rowspan: headerRows.length,
              'aria-hidden': true
            }, emptyElement)}
          {/if}
        {/snippet}
        {#if headerElements?.row && headerElements.row !== 'tr'}
          {@render overrideElement(headerElements.row, 'tr', rowAttributes, headerCells)}
        {:else}
          <tr {...rowAttributes}>{@render headerCells()}</tr>
        {/if}
      {/each}
    {/snippet}
    {#if headerElements?.wrapper && headerElements.wrapper !== 'thead'}
      {@render overrideElement(headerElements.wrapper, 'thead', attributes, headings)}
    {:else}
      <thead {...attributes}>{@render headings()}</thead>
    {/if}
  {/if}
{/snippet}

{#snippet tableSummary(fixed: 'top' | 'bottom' | undefined)}
  {#if summaryRender}
    <tfoot data-ant-table-part="summary" data-fixed={fixed} class={`${prefix}-summary`}>
      {@render summaryRender(panelData)}
    </tfoot>
  {/if}
{/snippet}

{#snippet tableCaption()}
  {#if typeof caption === 'function' || Array.isArray(caption)}
    <caption id={captionReference} class={`${prefix}-caption`}
      bind:this={captionElement}><RenderContent value={caption} /></caption>
  {:else if hasCaption}
    <caption class={`${prefix}-caption`} bind:this={captionElement}>{captionText ?? ''}</caption>
  {/if}
{/snippet}

{#snippet fixedBand(kind: Band)}
  {@const heading = kind === 'header'}
  {@const captionNamesHeader = bodyRenderer && hasNamedCaption}
  {@const label = heading && !ariaLabelledBy && !captionNamesHeader ? strings.label : undefined}
  {@const attributes: TableElementAttributes<'table'> = {
    ...tableAttributes,
    'aria-label': ariaLabel ?? label,
    'aria-busy': ariaBusy ?? (heading && loadingRequested || undefined)
  }}
  {@const ref = (node: HTMLElement) => registerBandTable(kind, node)}
  {#snippet bandContent()}
    {#if heading && bodyRenderer}{@render tableCaption()}{/if}
    {@render columnGroup(bandWidths, customGutter)}
    {#if heading}
      {@render tableHeader(customGutter)}
      {#if summaryPlacement === 'top'}{@render tableSummary('top')}{/if}
    {:else}
      {@render tableSummary('bottom')}
    {/if}
  {/snippet}
  <div data-ant-table-custom-band={kind}
    class={[`${prefix}-${kind} table-custom-band`, sticky && 'table-sticky-band']}
    style:inset-block-start={heading && sticky ? cssSize(stickyOptions.offsetHeader ?? 0) : undefined}
    style:inset-block-end={!heading && sticky ? cssSize(stickyOptions.offsetSummary ?? 0) : undefined}
    {@attach node => attachBand(kind, node)}>
    {#if headerElements?.table && headerElements.table !== 'table'}
      {@render overrideElement(headerElements.table, 'table', {
        ...attributes, style: tableStyle('100%', bandWidth)
      }, bandContent, ref)}
    {:else}
      <table {...attributes} style:min-width="100%" style:width={cssSize(bandWidth)}
        style:table-layout={resolvedLayout} {@attach ref}>{@render bandContent()}</table>
    {/if}
  </div>
{/snippet}

{#snippet expandedDetails(
  row: TableRow<Row>, index: number, depth: number, expanded: boolean, expansionClass?: string
)}
  {#snippet detail()}
    <div class="expanded-content" id={expansionId(row.key)}>
      {@render expandedRowRender?.(row.record, index, depth + 1, expanded)}
    </div>
  {/snippet}
  {#snippet cells()}
    {@render dataCell('td', {
      'data-ant-table-part': 'cell', class: `${prefix}-cell`, colspan: columnCount
    }, detail)}
  {/snippet}
  {@render dataRow({
    'data-ant-table-part': 'expanded-row',
    hidden: !expanded,
    class: [`${prefix}-expanded-row`, `${prefix}-expanded-row-level-${depth + 1}`, expansionClass]
  }, cells, scrollport.active && expanded ? scrollport.attachDetails : undefined)}
{/snippet}

{#snippet bodyPlaceholder()}
  {#snippet contents()}{#if !hideEmpty}
    {#snippet nativeEmpty()}<Empty image="simple" description={strings.emptyText} />{/snippet}
    <RenderEmpty componentName="Table" local={empty ?? locale?.emptyText} fallback={nativeEmpty} />
  {:else if simpleLoading}&nbsp;{/if}{/snippet}
  {#snippet cells()}
    {@render dataCell('td', {
      'data-ant-table-part': 'cell', class: `${prefix}-cell`, colspan: columnCount
    }, contents)}
  {/snippet}
  {@render dataRow({ class: `${prefix}-placeholder` }, cells)}
{/snippet}

{#snippet visibleBodyRow(entry: TableRowEntry, index: number)}
  {@const { row, depth } = entry}
  {@const properties = bodyRowProperties?.get(row.key)}
  {@const canExpand = canExpandRow(row)}
  {@const expanded = expandedKeys.has(row.key)}
  {@const hasDetails = expandedRowRender && canExpand && (expanded || forceExpandedRows)}
  {@const expansionClass = depth > 0 || hasDetails
    ? expandedRowClass(row.record, index, depth) : undefined}
  {@const selected = rowSelection && selectedKeys.has(row.key)}
  {@const attributes: TableElementAttributes<'tr'> = {
    ...properties,
    'data-ant-table-part': 'row',
    'data-ant-table-selected': selected || undefined,
    'data-ant-table-span-hovered': inHoveredRows(index) || undefined,
    class: [
      `${prefix}-row`,
      tree && `${prefix}-row-level-${depth}`,
      typeof rowClassName === 'function' ? rowClassName(row.record, index, depth) : rowClassName,
      depth > 0 && expansionClass,
      properties?.class,
      classes.body.row,
      selected && `${prefix}-row-selected`
    ],
    style: appendSemanticStyle(properties?.style, slots.body.row),
    'data-row-key': row.key,
    'aria-rowindex': virtualRowIndices ? index + inlineHeaderCount + 1 : properties?.['aria-rowindex'],
    id: properties?.id ?? (depth > 0 ? expansionId(row.key, 'row') : undefined),
    onclick: rowClick(row, canExpand, properties?.onclick)
  }}
  {#snippet cells()}
    {#each leaves as leaf, columnIndex (leaf.key)}
      {@const cell = bodyCellProps(leaf.column, row.record, index, columnIndex)}
      {@const placeholder = cellPlan?.placeholders.get(index)?.[columnIndex]}
      {#if placeholder !== undefined}
        {#if placeholder > 0}
          <!-- The grid retains the width while the span row contains the content. -->
          <td aria-hidden="true" class={`${prefix}-cell`}
            colspan={placeholder > 1 ? placeholder : undefined} style:visibility="hidden"></td>
        {/if}
      {:else if cell.colSpan !== 0 && cell.rowSpan !== 0}
        {@render bodyCell(leaf, columnIndex, entry, index, cell, canExpand, expanded)}
      {/if}
    {:else}
      {#snippet emptyCellContent()}
        {#if showTreeControls}
          {@render expansionControl(row, canExpand, expanded, depth)}
        {/if}
      {/snippet}
      {@render dataCell('td', {
        'data-ant-table-part': 'cell',
        class: [`${prefix}-cell`, classes.body.cell],
        style: slots.body.cell
      }, emptyCellContent)}
    {/each}
  {/snippet}
  {@render dataRow(attributes, cells, scrollport.active
    ? node => scrollport.attachRow(node, row.key) : undefined)}
  {#if hasDetails}
    {@render expandedDetails(row, index, depth, expanded, expansionClass)}
  {/if}
{/snippet}

{#snippet spanRow(entry: (typeof mergedRows)[number])}
  {@const { row, depth, sourceIndex, top, parts } = entry}
  {@const properties = bodyRowProperties?.get(row.key)}
  {@const primary = sourceIndex >= scrollport.start
    && sourceIndex < scrollport.start + scrollport.rows.length}
  {@const canExpand = canExpandRow(row)}
  {@const expanded = expandedKeys.has(row.key)}
  {@const selected = rowSelection && selectedKeys.has(row.key)}
  {@const attributes: TableElementAttributes<'tr'> = {
    ...properties,
    'data-ant-table-part': 'span-row',
    'data-row-key': row.key,
    id: primary ? undefined : properties?.id,
    tabindex: primary ? undefined : properties?.tabindex,
    'data-ant-table-selected': selected || undefined,
    class: [
      'table-span-row', `${prefix}-row ${prefix}-row-extra`,
      tree && `${prefix}-row-level-${depth}`,
      typeof rowClassName === 'function'
        ? rowClassName(row.record, sourceIndex, depth) : rowClassName,
      depth > 0 && expandedRowClass(row.record, sourceIndex, depth),
      properties?.class,
      classes.body.row,
      selected && `${prefix}-row-selected`
    ],
    style: appendSemanticStyle(
      appendSemanticStyle(properties?.style, slots.body.row), `top: ${cssSize(top)}`
    ),
    onclick: rowClick(row, canExpand, properties?.onclick)
  }}
  {#snippet cells()}
    {#each parts as part (part.columnIndex)}
      {@const leaf = leaves[part.columnIndex]}
      {@render bodyCell(leaf, part.columnIndex, entry, sourceIndex, part.cell, canExpand, expanded, part)}
    {/each}
  {/snippet}
  {@render dataRow(attributes, cells)}
{/snippet}

{#snippet tableBody()}
  {@const attributes: TableElementAttributes<'tbody'> = {
    'data-ant-table-part': 'body',
    class: [
      `${prefix}-tbody`, useBodyWrapperSlot && classes.body.wrapper,
      mergedRows.length > 0 && 'table-span-body'
    ],
    style: useBodyWrapperSlot ? slots.body.wrapper : undefined
  }}
  {#snippet rows()}
    {@render virtualSpacer(scrollport.before)}
    {#each scrollport.rows as entry, windowIndex (entry.row.key)}
      {@render visibleBodyRow(entry, scrollport.start + windowIndex)}
    {:else}
      {@render bodyPlaceholder()}
    {/each}
    {@render virtualSpacer(scrollport.after)}
    {#each mergedRows as entry (entry.row.key)}
      {@render spanRow(entry)}
    {/each}
  {/snippet}
  {#if bodyElements?.wrapper && bodyElements.wrapper !== 'tbody'}
    {@render overrideElement(bodyElements.wrapper, 'tbody', attributes, rows, registerBody)}
  {:else}
    <tbody {...attributes} bind:this={bodyElement}>{@render rows()}</tbody>
  {/if}
{/snippet}

{#snippet mainTable()}
  {@const attributes: TableElementAttributes<'table'> = {
    ...tableAttributes,
    'aria-label': ariaLabel ?? (ariaLabelledBy || hasNamedCaption ? undefined : strings.label),
    'aria-busy': ariaBusy ?? (loadingRequested || undefined),
    'aria-rowcount': ariaRowCount ?? (virtualRowIndices
      ? visibleRows.length + inlineHeaderCount : undefined)
  }}
  {@const autoWidth = scroll?.x === true}
  {@const minWidth = virtual || autoWidth ? '100%' : cssSize(horizontalWidth)}
  {@const width = !virtual && autoWidth ? 'auto' : scrollport.tableWidth}
  {#snippet parts()}
    {@render tableCaption()}
    {@render columnGroup(undefined, 0)}
    {#if !splitBands}
      {@render tableHeader(0)}
      {#if summaryPlacement === 'top'}{@render tableSummary('top')}{/if}
    {/if}
    {@render tableBody()}
    {#if summaryPlacement === 'inline' || !splitBands && summaryPlacement === 'bottom'}
      {@render tableSummary(summaryPlacement === 'bottom' ? 'bottom' : undefined)}
    {/if}
  {/snippet}
  {#if tableElement && tableElement !== 'table'}
    {@render overrideElement(tableElement, 'table', {
      ...attributes, style: tableStyle(minWidth, width)
    }, parts, registerTable)}
  {:else}
    <table {...attributes} bind:this={table} style:min-width={minWidth}
      style:width={cssSize(width)} style:table-layout={resolvedLayout}>{@render parts()}</table>
  {/if}
{/snippet}

{#snippet tableContent()}
  {#if pagerPlacements.top}{@render tablePager(pagerPlacements.top)}{/if}
  <div {...ownerAttributes} id={ownerId} data-ant-table-part="table" data-ant-table-prefix={prefix}
    data-ant-table-root-prefix={rootPrefix} data-ant-table-size={resolvedSize} class={[
      `${prefix}`,
      `${prefix}-${resolvedSize}`,
      bordered && `${prefix}-bordered`,
      tableLayout === 'fixed' && `${prefix}-layout-fixed`,
      showHeader === false && !title && `${prefix}-no-header`,
      !visibleRows.length && `${prefix}-empty`
    ]}>
    {#if title}<div class={[`${prefix}-title`, classes.title]}
      style={slots.title}>{@render title(panelData)}</div>{/if}
    <div bind:this={tableSection} class={[
      `${prefix}-container`,
      scrollport.active && 'table-virtual-container',
      sticky && 'table-sticky-container',
      classes.section
    ]} style={slots.section}>
      {#if splitBands && showHeader}{@render fixedBand('header')}{/if}
      {#if bodyRenderer}
        {@render bodyRenderer(panelData, customBody.info)}
      {:else}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex (Focus allows keyboard scrolling of the table.) -->
        <div bind:this={content}
          data-ant-table-part="content"
          data-ant-table-virtual={scrollport.active || undefined}
          data-ant-table-pin-summary={!splitBands
            && (summaryPlacement === 'top' || summaryPlacement === 'bottom')
            ? summaryPlacement : undefined}
          class={[
            `${prefix}-content`,
            (pinHeader || fixedColumns.some(Boolean)) && 'table-sticky',
            pinHeader && !splitBands && 'table-pin-head',
            scroll?.y !== undefined && 'table-scroll-y',
            scrollport.active && 'table-virtual-scroll',
            !pinHeader && classes.content
          ]}
          style={contentStyle}
          role="region"
          aria-label={regionLabel}
          aria-labelledby={regionLabelledBy}
          tabindex="0"
          onscroll={handleScroll}
        >
          {@render mainTable()}
        </div>
      {/if}
      {#if splitBands && summaryPlacement === 'bottom'}{@render fixedBand('summary')}{/if}
      {#if scrollport.active && scrollport.height > 0}
        <div class="table-virtual-bars"
          style:height={cssSize(scrollport.height)}
          style:bottom={cssSize(splitBands ? summaryBandHeight : scrollport.bottomInset)}
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
          onScroll={dragStickyScrollbar} onMoving={scrollport.dragScrollbar} />
      {/if}
    </div>
    {#if footer}<div class={[`${prefix}-footer`, classes.footer]}
      style={slots.footer}>{@render footer(panelData)}</div>{/if}
  </div>
  {#if pagerPlacements.bottom}{@render tablePager(pagerPlacements.bottom)}{/if}
{/snippet}

{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`table-prefix:${prefix}:${rootPrefix}`} />{/if}<div bind:this={nativeElement} data-ant-table-part="wrapper" data-ant-table-prefix={prefix} data-ant-table-root-prefix={rootPrefix} class={[
    `${prefix}-wrapper ant-table-css-var`,
    componentTheme.className,
    designTheme.enabled && 'table-source-theme',
    !rowHoverable && 'table-hover-disabled',
    config.direction === 'rtl' && `${prefix}-wrapper-rtl`,
    config.table?.class,
    className,
    rootClassName,
    classes.root
  ]} dir={config.direction} style={themedRootStyle}>
  {#if simpleLoading}
    <div class="loading-state" role="status"><Spin size="small" aria-hidden />{strings.loadingText}</div>
  {/if}
  <Spin {...(spinOptions ?? passiveSpin)} data-ant-table-passive-spin={spinOptions ? undefined : ''}
    spinning={Boolean(spinOptions) && loadingRequested} styles={spinStyles} children={tableContent} />
</div>
