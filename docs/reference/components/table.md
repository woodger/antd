# Table

```svelte
<script lang="ts">
  import { Table, type TableColumn, type TableKey, type TableSorter } from '@woodger/antd';

  interface Person { id: number; name: string; score: number }

  const people: Person[] = [
    { id: 0, name: 'Anna', score: 30 },
    { id: 1, name: 'Boris', score: 10 }
  ];
  const columns: TableColumn<Person>[] = [
    { key: 'name', title: 'Name', render: personName },
    { key: 'score', title: 'Score', dataIndex: 'score', sorter: (left, right) => left.score - right.score }
  ];
  let current = $state(1);
  let pageSize = $state(10);
  let sorter = $state<TableSorter | null>(null);
  let selectedRowKeys = $state<TableKey[]>([]);
</script>

{#snippet personName(person: Person)}<strong>{person.name}</strong>{/snippet}

<Table
  dataSource={people}
  {columns}
  rowKey="id"
  caption="Members"
  bind:current
  bind:pageSize
  bind:sorter
  bind:selectedRowKeys
  rowSelection
  scroll={{ x: 600 }}
/>
```

`mode="client"` is the default. Filtering, sorting, and pagination
run locally, and a supplied `total` is ignored in this mode.
`dataSource` and `columns` accept readonly arrays. A data column can
have an explicit `key` and `title`. `dataIndex` accepts a `keyof Row`
or an array of path segments. `null` and `undefined` give an empty
cell, and other values render as text. `render(record, index, value)`
replaces cell content with a typed Snippet. The index starts at 0
among siblings on the current page or branch.

Columns accept `width`, `align`, and `className`. The class supplements
the header and data cells of that column. Service columns for
selection and expansion are independent. Sorting, selected and
fixed classes, and native semantics are preserved. Class changes
retain cell and Snippet editor DOM. Browser tests compare eight
official UMD states at `?fixture=table-column-classes`. SSR tests
cover the server markup. [Browser tests](../../../tests/browser/table/table-column-classes.spec.ts) · [SSR tests](../../../tests/package/table/table-column-classes.ssr.test.ts)

`rowKey` supplies a key field or function and defaults to `key`.
Keys must be unique strings or finite numbers, including 0.
Missing or duplicate row keys, duplicate explicit column keys,
and an empty column list raise explicit errors. Row position is
independent of selection identity.

`ConfigProvider.table` supplies shared `rowKey` and `scroll`. Local
`rowKey` takes precedence. Local `scroll` replaces the full provider
object, including `{}`. A nested provider uses the parent `table`
object until it supplies its own.

```svelte
<ConfigProvider table={{ rowKey: 'id', scroll: { x: true, y: 320 } }}>
  <Table {dataSource} {columns} />
</ConfigProvider>
```

[Reference](../../../tests/browser/fixtures/ant-design-table-config-reference.json) · [Chromium](../../../tests/browser/table/table-config.spec.ts) · [SSR](../../../tests/package/table/table-config.ssr.test.ts)

Single-column sorting uses `sorter: { columnKey, order } | null`
and supports binding. A header click defaults to cycling through
`ascend → descend → null`. Flat data is filtered before sorting,
and the current page is retained. Equal records keep source order.
[Sort directions and priorities](#sort-directions-and-priorities)

The pager defaults to the bottom at the logical end. Pages start
at 1 and the page size defaults to 10. `current` and `pageSize`
support binding. `pagination={false}` shows all records.
[Pagination settings](#pagination-settings)

`rowSelection` enables the Checkbox column. Use
`{ getCheckboxProps: (record) => ({ disabled, 'aria-label': ... }) }`
to disable individual rows or change their accessible names.
`selectedRowKeys` supports binding. Select all affects only enabled
rows on the current page and retains keys from other pages.
The header excludes disabled rows from checked and indeterminate
calculations and is disabled when no row is enabled. Without
pagination, select all covers the entire set. Selected keys
survive record replacement or removal until the owner or user
updates selection.

`onChange({ action, pagination, sorter, currentDataSource, filters })`
runs on user sorting, filtering, or page and size changes.
`action` is `sort`, `filter`, or `paginate`, and `pagination` contains
`{ current, pageSize, total }`. Client-mode `currentDataSource`
is the entire filtered and sorted set before pagination.
`filters` is present with filterable columns.

`onSelectionChange(keys, records, { type })` runs separately.
`type` is `single` or `all`. By default, `records` contains only
known current `dataSource` records in selected-key order, including
records hidden by filters. The full selection method set is
available through `rowSelection.onChange`. External props, data,
and column updates leave these callbacks uncalled.

Standalone tables support `defaultCurrent`, `defaultPageSize`,
`defaultSorter`, and `defaultSelectedRowKeys`, read once. With
bindings, initialize the owner. To reset, assign `sorter=null`,
`selectedRowKeys=[]`, and the desired page.

`disabled` inherits from ConfigProvider and can be overridden.
The `empty` Snippet replaces empty-state text. Size inherits
`componentSize`. `bordered`, `class`, and `style` are available.
A number or CSS string in `scroll.x` sets the table's minimum
width. `scroll.x: true` uses automatic width with a minimum
of 100% of the container. Horizontal scrolling stays inside the
focusable region.

## Caption and DOM attributes

`id` and `data-*` apply to the inner `ant-table` container or
its configured `prefixCls`. `bind:nativeElement` exposes the outer
wrapper. `role` and `aria-*` pass to semantic `table` elements,
including separate header and fixed summary tables. `0`, `false`,
and `''` are preserved. Explicit `aria-rowcount` and `aria-busy`
override calculated row count and loading state.

`caption` accepts a string, number, Snippet, or nested array and
creates a `<caption>` with class `${prefixCls}-caption`. An empty
string, empty array, or boolean gives an empty caption without
padding. `null` and `undefined` omit the element. The scrolling
region's name comes from `aria-labelledby`, caption, then
`aria-label`. If all are omitted, it uses a localized name. For a
Snippet or array caption, the region references its ID, which
persists on hydration. The built-in virtual window keeps the
caption in the semantic table and measures its height for the
fixed header. With a custom scroll body, the caption renders
in the separate visible header. [Reference](../../../tests/browser/fixtures/ant-design-table-dom-attributes-reference.json) ·
[Chromium](../../../tests/browser/table/table-dom-attributes.spec.ts) · [SSR](../../../tests/package/table/table-dom-attributes.ssr.test.ts) · [Hydration](../../../tests/browser/table/table-virtual-hydration.spec.ts)

## Loading

`loading={true}` sets `aria-busy`, displays a separate localized
status, and blocks sorting, selection, and pagination. The owner
disables interactive content in its own Snippets.

An object in `loading` passes options to nested Spin, including
`delay`, `description`, `indicator`, `percent`, `size`, `fullscreen`,
`classNames`, and `styles`. `spinning` defaults on. While spinning,
the table and pagers inside Spin become `inert`. `delay` defers the
indicator. When loading ends, Spin restores editor focus if the user
left focus on Spin. Pagers and the table remain siblings in the
same Spin container in every loading mode. Table theme tokens and
`styles.root` apply within the container. [Spin](./spin.md)

With object `loading` and omitted or `null` `dataSource`, the empty
cell has no label until loading completes. An explicit empty array
retains its empty state under the indicator. `loading={true}` also
hides the empty cell label for an empty array.

```svelte
<Table {columns} {dataSource}
  loading={{ spinning: pending, delay: 150, description: 'Loading data…' }} />
```

[Ant Design snapshots](../../../tests/browser/fixtures/ant-design-table-loading-reference.json) · [Chromium](../../../tests/browser/table/table-loading.spec.ts) · [SSR](../../../tests/package/table/table-loading.ssr.test.ts)

## Table locale

`locale` sets labels for one table. Omitted fields inherit from
`ConfigProvider.locale`.

| Purpose | Fields |
| --- | --- |
| Filter actions and state | `filterConfirm`, `filterReset`, `filterEmptyText`, `filterCheckAll`, `filterSearchPlaceholder` |
| Next sort action | `triggerAsc`, `triggerDesc`, `cancelSort` |
| Expansion button labels | `expand`, `collapse` |
| Selection commands | `selectionAll`, `selectInvert`, `selectNone` |
| Native labels and accessible names | `label`, `loadingText`, `filterTitle`, `selectAll`, `selectRow`, `selectionMenu`, `expandColumn` |

Native names `filterApply`, `sortAscending`, `sortDescending`,
`expandRow`, and `collapseRow` also work. When both forms are
supplied, Ant Design fields take precedence. Filter button and
selection command labels accept strings, numbers, Snippets, and
nested content arrays. Explicit empty values allow buttons or
commands without text. `filterEmptyText` supplies the description
inside Empty. `undefined` uses the Empty dictionary.

Empty cell content resolves from the `empty` Snippet, then
`locale.emptyText`, then `ConfigProvider.renderEmpty('Table')` and
simple Empty. Local `emptyText` replaces the full cell contents
and can be a string, number, Snippet, or nested array. `0` renders
as text. `null`, `false`, `''`, and `[]` leave the cell empty.
`undefined` falls through. Empty cell display while waiting
depends on loading mode and whether `dataSource` is supplied.
[Loading](#loading)

```svelte
{#snippet emptyRows()}<span>No records match these criteria.</span>{/snippet}

<Table {columns} {dataSource}
  locale={{ emptyText: emptyRows, filterConfirm: 'Apply filters' }} />
```

For filters, `renderEmpty('Table.filter')` can return `0` or
`false`. `null` and `undefined` use Empty with
`filterEmptyText` as the description. [RenderEmpty](../render-empty.md)

The comparison covers 52 browser states and 27 server snapshots
from Ant Design 6.6.8. Locale updates preserve the open filter,
search query, draft, and focus. [React snapshots](../../../tests/browser/fixtures/ant-design-table-locale-reference.json) ·
[Chromium](../../../tests/browser/table/table-locale.spec.ts) · [Hydration](../../../tests/browser/table/table-column-layout-hydration.spec.ts) · [SSR](../../../tests/package/table/table-locale.ssr.test.ts)

## Pagination settings

`pagination.placement` accepts `topStart`, `topCenter`, `topEnd`,
`bottomStart`, `bottomCenter`, `bottomEnd`, and `none`. The top
pager comes before `title` and the bottom pager after `footer`.
The first supplied placement for each side wins. Start and end
follow RTL. An empty array or `['none']` hides navigation while rows
are still paginated. Zero total hides pagers.

```svelte
<Table {dataSource} {columns}
  pagination={{ placement: ['topStart', 'bottomEnd'], defaultPageSize: 20 }} />
```

Nested `pagination.current` and `pagination.pageSize` set controlled
state. Page and size changes send requests to the owner. Both
pagers and the rows use accepted values. Table's own `current`
and `pageSize`, including bindings, take precedence over their
nested equivalents. Initial values are read at creation. Table's
`defaultCurrent` and `defaultPageSize` override nested defaults.
An external reduction in total clamps the displayed page while
preserving the owner's number.

Size, locale, `simple`, `showQuickJumper`, `showSizeChanger`, and other
Pagination options pass to both pagers. An explicit Table size
of `medium` or `small` uses a compact pager if `pagination.size` is
omitted. Each quick-jump editor keeps its own text. A size change
calls `pagination.onShowSizeChange`, then `pagination.onChange`, then
`Table.onChange`. Applying a filter passes page 1 to
`pagination.onChange` before `Table.onChange`. On page changes,
`Table.onChange` receives the rows and total at request time even
if a pager handler immediately replaces the data. Placement changes
and external prop updates alone emit no events.
[Pagination](./pagination.md)

Client total defaults to the root record count after filtering.
Positive `pagination.total` specifies the overall record count.
If fewer records have loaded and they fit within one page, Table
shows the loaded page in full. Server mode retains precedence of
the separate `total`. [Server mode](#server-mode)

Order, alignment, and state are checked against 58 states and 24
SSR snapshots from Ant Design 6.6.8. Hydration and placement updates
keep the row editor, draft, and selection.
[React snapshots](../../../tests/browser/fixtures/ant-design-table-pagination-reference.json) · [Chromium](../../../tests/browser/table/table-pagination.spec.ts) ·
[Hydration](../../../tests/browser/table/table-column-layout-hydration.spec.ts) · [SSR](../../../tests/package/table/table-pagination.ssr.test.ts)

## Row selection settings

`rowSelection.type` chooses Checkbox or Radio. In `radio` mode, the
first selected key is displayed and user action leaves one checked
row. In Checkbox mode, Shift toggles the range between successive
actions in current page order, skipping disabled rows. With
`checkStrictly: false`, selection applies parent and descendant
relationships.

`rowSelection.selectedRowKeys` controls displayed keys through
column settings. The owner accepts new values in
`rowSelection.onChange`. `rowSelection.selectedRowKeys` takes
precedence over root `bind:selectedRowKeys`. Local initialization
uses `rowSelection.defaultSelectedRowKeys`, with Table
`defaultSelectedRowKeys` as fallback.

`rowSelection.onSelect(record, checked, records, nativeEvent)` runs
before `onChange` for a single row action. `rowSelection.onChange`
receives keys, records, and `info.type`. `single` and `multiple`
describe row actions. `all`, `invert`, and `none` describe header and
menu actions. Root `onSelectionChange` keeps `single` for row
actions and `all` for header actions.

`preserveSelectedRowKeys: true` remembers selected records when
`dataSource` changes. Reloading a row uses its current object.
Cached branches retain their relationships. A key is passed even
with no record, and the records array contains known records.
Ant Design measurements include `undefined` when the matching
record was never loaded. When nested keys or callbacks are used,
or preservation is explicitly disabled, missing keys are dropped
on the next action if record preservation is off. Root selection
keeps keys from other server pages.

`selections: true` adds a menu to select all processed data, invert
the current page, and clear available selections. An array can mix
`Table.SELECTION_ALL`, `Table.SELECTION_INVERT`, `Table.SELECTION_NONE`,
and custom items `{ key, text, onSelect }`. `text` accepts a string,
number, Snippet, or nested array. The item callback gets available
keys on the current page. `hideSelectAll` hides the header menu
and checkbox. Radio has neither header control.

`getCheckboxProps` and `getTitleCheckboxProps` set control
attributes and callbacks. Their `onChange` receives the DOM `change`
after Table events. `columnWidth`, `align`, and `fixed` set the
service column's width, alignment, and fixed position. The menu
supports keyboard interaction and restores focus to its button.

The comparison covers 79 states and 13 server snapshots from
Ant Design 6.6.8. Strict hydration checks that a controlled
Checkbox or Radio retains the focused input and respects accepted
and rejected changes. Radios with a shared `name` retain the
previously accepted choice on rejection.
[Reference snapshots](../../../tests/browser/fixtures/ant-design-table-selection-reference.json) · [Browser tests](../../../tests/browser/table/table-selection.spec.ts) ·
[Hydration](../../../tests/browser/table/table-selection-hydration.spec.ts)

### Order and content of service columns

Place `Table.SELECTION_COLUMN` and `Table.EXPAND_COLUMN` at the top
level of `columns`. They set selection and detail expansion
positions within data columns. The first marker of each kind
wins. A marker without active `rowSelection` or
`expandable.expandedRowRender` is skipped.

```ts
const columns: TableColumn<Person>[] = [
  { key: 'name', title: 'Name', dataIndex: 'name' },
  Table.SELECTION_COLUMN,
  { key: 'score', title: 'Score', dataIndex: 'score' },
  Table.EXPAND_COLUMN
];
```

Without markers, details come first and selection follows. If
the expansion column is placed later, the default selection
column comes first. `rowSelection.fixed` defaults to the next
visible top-level column's setting, then the previous one's.
A preceding expansion column with no resolved side takes the
selection side. Explicit `fixed: false` disables fixing. The
order applies to the header, spans, virtual window, and physical
`Table.Summary.Cell` indices.

`rowSelection.columnTitle` accepts a string, number, nested array,
or Snippet. `0`, `''`, `false`, `null`, and `undefined` keep the
default header. An array replaces it in full, including when
empty. A top-level Snippet receives the original checkbox and can
render it even with `hideSelectAll: true`. In Radio mode, the
argument is `undefined`. `renderCell(checked, record, index, origin)`
replaces cell content. `{@render origin()}` renders the default
control and all handlers. `index` is relative to siblings.
`rowSelection.onCell(record, index)` receives the index across the
expanded page and supplies attributes, events, `colSpan`, and
`rowSpan` through the same contract as `columns.onCell`.

The Ant Design 6.6.8 reference has 47 browser states and 16 server
snapshots. Strict hydration preserves focus and the built-in input
within a custom cell, including a virtual span.
[Reference](../../../tests/browser/fixtures/ant-design-table-service-columns-reference.json) · [Chromium](../../../tests/browser/table/table-service-columns.spec.ts) · [SSR](../../../tests/package/table/table-service-columns.ssr.test.ts) ·
[Hydration](../../../tests/browser/table/table-service-columns-hydration.spec.ts)

## Expandable rows

`expandable.expandedRowRender` creates a separate column with
expand buttons. `expandedRowRender(record, index, indent, expanded)`
receives the record, current-page row index, detail row depth, and
expanded state. The Snippet can declare just the parameters it
needs. `rowExpandable(record)` can hide the button and details for
individual rows. Every supplied record can expand by default.

```svelte
<script lang="ts">
  import { Button, Table, type TableColumn, type TableKey } from '@woodger/antd';

  interface Person { key: number; name: string; email: string; active: boolean }
  const people: Person[] = [
    { key: 0, name: 'Anna', email: 'anna@example.com', active: true },
    { key: 1, name: 'Boris', email: 'boris@example.com', active: false }
  ];
  const columns: TableColumn<Person>[] = [{ key: 'name', title: 'Name', dataIndex: 'name', width: 200 }];
  let expanded = $state<TableKey[]>([0]);
</script>

{#snippet details(person: Person, index: number)}<p>{index + 1}. {person.name}: {person.email}</p>{/snippet}
<Button onclick={() => { expanded = []; }}>Collapse all</Button>
<Table dataSource={people} {columns} caption="Members"
  expandable={{ expandedRowRender: details, rowExpandable: (person) => person.active,
    fixed: true, expandedRowKeys: expanded, onExpandedRowsChange: next => { expanded = next; } }} />
```

The owner controls `expandable.expandedRowKeys` through
`expandable.onExpandedRowsChange`. For local state, the component
reads `expandable.defaultExpandedRowKeys` once. `[]` collapses all
rows. `expandable.defaultExpandAllRows` expands the initial page's
records when `defaultExpandedRowKeys` is omitted. Expansion and
selection share `rowKey`. Numeric `0` and string `"0"` are distinct.
Keys survive sorting, filtering, pagination, data replacement or
removal, disabling `expandable`, and changes to `rowExpandable`.
Details appear for eligible rows in the current data source and
page. Records are uncached. A returning record with a retained key
expands again.

User toggling updates local keys and calls
`expandable.onExpand(expanded, record)`, then
`expandable.onExpandedRowsChange(keys)`. The owner updates
controlled keys. Callbacks preserve its array. The UMD measurement
covers rejected and accepted keys and callback order. `keys` includes
all expanded keys, including those off the current page. External
prop changes skip these callbacks. Expansion leaves selection and
pagination intact and skips shared `onChange`. `currentDataSource`
and `total` count records only, excluding detail rows.
[Official UMD measurement](../../../tests/reference/ant-design-current-table-expansion-observation.json)

`expandable.columnWidth` accepts a number or CSS width. Without an
upstream theme, the default is 48px. With it, width derives from
global metrics. `expandable.columnTitle` sets a visible header as
a string, number, Snippet, or nested array. Zero renders as a
number. The default is a localized accessible name.
`fixed: true` fixes the column at the row start, with RTL support.
`fixed: 'end'` without a marker places it at the logical end.
Offsets and colspan account for expansion, selection, and data.
On horizontal scroll, details fit within the visible width. Data
column widths are retained.

The button has `type=button` and `aria-expanded`. When expanded,
`aria-controls` points to the existing details block with a unique
ID. Enter and Space toggle and keep button focus. Loading and
disabled block toggling. Disabled inherits ConfigProvider. Labels
come from `locale.table.expandColumn`, `expandRow`, and `collapseRow`.

`expandable.expandIcon(info, origin)` replaces a detail or branch
toggle. `{@render origin()}` renders the default toggle or a leaf
indent. A custom button can use `info.record`, `prefixCls`,
`expanded`, `expandable`, `disabled`, and `ariaControls`. Pass the
event to `info.onExpand(event)` to toggle the row and stop bubbling
to its row-click expansion handler.

The local Snippet overrides
`ConfigProvider.table.expandable.expandIcon`. A provider without
`table` inherits the parent setting. `table={{}}` resets it for
children. The common Snippet receives `record` as `object` because
its provider can serve tables with different record types.

`expandable.expandRowByClick` expands when a row is clicked.
Controls inside cells handle their own clicks.
`expandable.showExpandColumn=false` disables the automatic detail
column and built-in tree toggles. Explicit `Table.EXPAND_COLUMN`
retains the detail column.

`expandable.expandedRowClassName` adds classes to the detail row
and nested tree rows. For `(record, index, indent)`, the index is
relative to the whole expanded page and `indent` is record depth.

`expandable.forceRender: true` mounts details before first opening
and preserves their DOM on collapse. A hidden row takes no height
and is excluded from Tab. In virtual mode, details are created
for expandable rows in the current DOM window. Leaving the
window, filtering, page changes, or `rowExpandable` becoming false
removes their details. SSR renders expanded and force-rendered
hidden rows immediately.

Svelte removes details on collapse by default. Ant Design React
normally keeps previously opened details mounted. The reference
retains both React modes and editor state after reopening. Strict
Svelte hydration preserves the server editor and button focus.
[Reference](../../../tests/browser/fixtures/ant-design-table-expansion-options-reference.json) · [Chromium](../../../tests/browser/table/table-expansion-options.spec.ts) · [SSR](../../../tests/package/table/table-expansion-options.ssr.test.ts) ·
[Hydration](../../../tests/browser/table/table-expansion-options-hydration.spec.ts)

## Tree data

A `children` array enables branch toggles in the first visible leaf
column. With selection, toggles are in the second leaf and their
position accounts for `Table.SELECTION_COLUMN` order.
`Table.EXPAND_COLUMN` applies to details. Set another child field
with `expandable.childrenColumnName`. Keys are unique across
levels. An empty array also makes an expandable branch and can
be populated after `onExpand`. Nesting uses pixel
`expandable.indentSize`, defaulting to 15. `expandedRowRender`
enables detail mode, where `rowExpandable` identifies eligible rows.

In client mode, sorting applies among siblings at each level.
For the first filter, a parent receives descendants that passed
all active filters. Later columns evaluate the parent with the
same branch contents. If the parent is filtered out, its whole
branch disappears. Pagination divides root records only.
`title`, `footer`, and `onChange.currentDataSource` receive the tree
with nested records. In server mode, the owner determines branch
order and contents.

On a collapsed tree of 127 matching records, four active filters
with one selected value each call `onFilter` 508 times during SSR.
Ant Design 6.6.8 makes 1,198,372 calls in this scenario. One root
row is visible in both implementations. [SSR regression](../../../tests/package/table/table-tree.ssr.test.ts)

The header checkbox selects enabled descendants of roots on the
current page, including collapsed branches. Row checkboxes are
independent by default. With `rowSelection.checkStrictly=false`,
checking propagates to enabled children and the parent shows a
partial check. A disabled checkbox breaks the relationship.
`onSelectionChange` receives original records in selected-key order.

Nine Ant Design 6.6.8 profiles cover expansion, pagination,
filters, sorting, selection, RTL, and handlers. The UMD adds a
leaf key on row click. Svelte expands rows with a child array.
Hydration retains the cell and editor focus and selection.
[Measurements](../../../tests/browser/fixtures/ant-design-table-tree-reference.json) · [Chromium](../../../tests/browser/table/table-tree.spec.ts) · [SSR](../../../tests/package/table/table-tree.ssr.test.ts)
· [Hydration](../../../tests/browser/table/table-tree-hydration.spec.ts)

## Column header visibility

`showHeader` defaults to `true`. `false` removes `thead` and retains
caption, title and footer, data, sorting, and selection. External
visibility changes skip `onChange`. An empty title Snippet keeps
the panel. `ant-table-no-header` applies with no title and
`showHeader=false`. In a bordered table, CSS rounds upper corners
of the first body row using upstream rules.

Without a header, fixed column widths come from the first
regular `tbody` row and are remeasured after changing pages or
restoring a nonempty set. Fixed columns and the expanded viewport
work in LTR and RTL. Hiding the header removes its open filter
while preserving content and focus in remaining body controls.
`?fixture=table-header` compares 48 UMD states.
[Browser tests](../../../tests/browser/table/table-header.spec.ts) · [SSR tests](../../../tests/package/table/table-header.ssr.test.ts)

## Column groups

Set `children` on a column to add a header level. A group spans
its visible leaf columns. A leaf header spans all remaining
header rows. Select checkboxes and expansion buttons get
full-height headers. Column keys are unique across the tree.
Use `TableColumnsType<Row>`, `TableColumnGroupType<Row>`, and
`TableColumnType<Row>` to describe columns.

```ts
const columns: TableColumnsType<Person> = [
  { key: 'name', title: 'Name', dataIndex: 'name' },
  {
    key: 'metrics', title: 'Metrics', children: [
      { key: 'score', title: 'Score', dataIndex: 'score' },
      { key: 'tasks', title: 'Tasks', dataIndex: 'tasks' }
    ]
  }
];
```

Leaf columns inherit group `fixed`. A child value takes
precedence, including `false`. A group header is fixed when
both outer leaf columns are fixed to the same side. During
vertical scroll, header rows stick below one another according
to their heights.

Group `hidden` hides the subtree. If all children are hidden,
the visible group remains a separate column. Sort and filter
criteria in a hidden group still process data.

A top-level column's `responsive` contains allowed Grid
breakpoints. The column appears when any matches. On a group,
it controls the whole subtree, and an empty list hides the
column. The server renders columns without `responsive`. The
browser resolves visibility using the theme and `matchMedia`.

Group structure, events, and geometry are checked against
33 UMD states and nine Ant Design 6.6.8 server renders.
Strict hydration checks that showing a group preserves the
active editor and selection. [Browser tests](../../../tests/browser/table/table-columns.spec.ts) ·
[SSR tests](../../../tests/package/table/table-columns.ssr.test.ts)

## Column keys

`columns` accepts `TableColumnInput<Row>` definitions, including
nested `children`. An explicit `key` can be a string or finite
number. Numbers convert to strings, so `key: 0` gives `'0'`.
The empty string is also an explicit key.

Table fills shared properties from `column` before deriving
a key. Without a supplied `key`, it uses `dataIndex`. The path
`['metrics', 'rank']` gives `'metrics.rank'`. For a column
without a field or with `dataIndex: 0` or `dataIndex: ''`,
the key uses its position in the full tree. For example, the
first leaf of a group in third position has key `'2-0'`.
Cell value lookup still uses the supplied `dataIndex`.

Explicit keys are reserved across the tree. For a collision,
`_next` is appended to a derived key until it is available.
Repeated explicit keys after string conversion raise an error.
Keys are resolved before `hidden` and `responsive` apply, so
hiding a neighbor keeps the active criterion.

`sorter.columnKey`, `filters` keys, and `TableColumn<Row>`
definitions in `onHeaderCell` and `onHeaderRow` use the same
resolved string. A positional key follows the order of input
definitions.

In the Ant Design 6.6.8 reference, filtering a nested column
with a positional key returns new rows in `onChange`, while
the DOM keeps old rows. A hidden column before a group causes
the same mismatch on sort. Svelte applies the criterion to
the rows and reports the same result to the owner.
[Reference](../../../tests/browser/fixtures/ant-design-table-column-key-reference.json) · [Chromium](../../../tests/browser/table/table-column-keys.spec.ts) · [SSR](../../../tests/package/table/table-column-keys.ssr.test.ts)
· [Hydration](../../../tests/browser/table/table-virtual-hydration.spec.ts)

## Shared column properties

`column` sets shared properties for groups and leaves. Each
column uses these values unless it supplies its own.

```svelte
<Table {columns} {dataSource} column={{ align: 'center', ellipsis: true, width: 160 }} />
```

Omitted and `undefined` properties inherit. `false`, `0`, the
empty string, and `null` remain explicit overrides. Arrays
and objects are replaced in full. Each column in a group
receives the same defaults.

`TableColumnDefaults<Row>` contains optional properties of a
single column. Define the group tree and required `key` values
in `columns`. Selection and expansion columns use their own
`rowSelection` and `expandable` settings. Shared `column` applies
to visible column selection, reading data, sorting, and
filtering. Updating it alone leaves `onChange` uncalled.
[Reference](../../../tests/browser/fixtures/ant-design-table-column-defaults-reference.json) · [Chromium](../../../tests/browser/table/table-column-defaults.spec.ts) · [SSR](../../../tests/package/table/table-column-defaults.ssr.test.ts)
· [Hydration](../../../tests/browser/table/table-column-layout-hydration.spec.ts)

## Column titles

`column.title` accepts a string, number, Svelte Snippet, or
nested array. Omission, `null`, and booleans leave it empty.
Snippets inside arrays are called without arguments. A
top-level Snippet receives `TableColumnTitleProps<Row>` on
a group or leaf. `sortColumns` holds column definitions and
directions in state order. `order: null` indicates an inactive
criterion. `filters` contains applied criteria, including
the owner's controlled values.

```svelte
{#snippet scoreHeading(info: TableColumnTitleProps<Row>)}
  Score
  {#if info.filters.score?.length}
    <span>({info.filters.score.length})</span>
  {/if}
{/snippet}
```

Pass `scoreHeading` to `column.title`. Clicking a sortable
header changes direction. Buttons, links, and fields within
the Snippet keep their own actions. The native sort button
supports Enter and Space. Sort and filter use the header's
accessible name. For an icon-only Snippet, supply
`aria-label` in `onHeaderCell`.

With `ellipsis`, a string or number supplies the native
cell `title`. For rich headers, return it from `onHeaderCell`.
[Reference](../../../tests/browser/fixtures/ant-design-table-column-title-reference.json) · [Chromium](../../../tests/browser/table/table-column-title.spec.ts) · [SSR](../../../tests/package/table/table-column-title.ssr.test.ts)
· [Hydration](../../../tests/browser/table/table-sorter-hydration.spec.ts)

Rich titles, `caption`, and selection commands were compared
in 16 Ant Design 6.6.8 browser and server profiles. Empty
arrays retain accessible names for sort, filter, and the
scroll region. [Content reference](../../../tests/browser/fixtures/ant-design-table-heading-content-reference.json) · [Chromium](../../../tests/browser/table/table-heading-content.spec.ts)
· [SSR](../../../tests/package/table/table-heading-content.ssr.test.ts)

## Column visibility

`TableColumn.hidden` defaults to `false`. `true` removes the
column's col, header, body cells, and controls from the DOM.
Its sort and active filters still process data, as in
InternalTable before rc-table. The supplied column list
remains nonempty.

Without visible data columns, selection and expansion cells
remain. Without those, the table renders one empty cell per
record and an empty header, without a colgroup. Empty and
expanded cells receive the current `colSpan`, with a minimum
of 1. Restoring columns preserves selection, expansion,
neighboring controls, the expanded editor, focus, selection,
and FormData. Changing `hidden` skips `onChange` and removes
the hidden column's own controls.

`?fixture=table-column-hidden` compares visible text, structure,
and selection controls in 14 UMD cases. Raw `textContent`,
checkbox counts, and colspan attributes are retained.
Native TableFilter keeps a closed popover in the DOM, and
`colSpan=1` can be an explicit attribute.
[Browser tests](../../../tests/browser/table/table-column-hidden.spec.ts) · [SSR tests](../../../tests/package/table/table-column-hidden.ssr.test.ts)

## Column values, widths, and ellipsis

`dataIndex: 'person.name'` reads the literal dotted key.
`dataIndex: ['person', 'name']` reads a nested field, and
`['items', 0, 'name']` accesses an array item. A missing
segment gives `undefined`. The third `render` argument holds
the raw value as `unknown`. An empty path or missing
`dataIndex` passes the record itself to the Snippet. With
default rendering, an empty path leaves the cell empty.
A Snippet can still declare just `record` and `index`.

`shouldCellUpdate(record, previousRecord)` compares the
current record with the last accepted one for that cell.
For records with revisions, use
`shouldCellUpdate: (record, previous) => record.revision !== previous.revision`.
Returning `false` retains text or the selected Snippet and its
arguments. `onCell` gets the current record, and spans and
`ellipsis` apply immediately. Automatic `title` follows the
displayed text. A Snippet still reacts to its own state.
Records are passed by reference. Replace a changed record
with a new object to compare two revisions.

First render uses the current record without calling the
predicate, including when a row remounts after leaving the
virtual window. Removing `shouldCellUpdate` resumes normal
content updates. [Reference](../../../tests/browser/fixtures/ant-design-table-cell-update-reference.json) · [Chromium](../../../tests/browser/table/table-cell-update.spec.ts) ·
[SSR](../../../tests/package/table/table-cell-update.ssr.test.ts) · [Hydration](../../../tests/browser/table/table-virtual-hydration.spec.ts)

`tableLayout` selects `'auto'` or `'fixed'`. When chosen
automatically, fixed columns with horizontal scrolling, a
fixed header, or `ellipsis` on a visible column select
`fixed`. Fixed columns with `scroll.x="max-content"` use
`auto` so the table can grow to its content width.
Numeric `minWidth` sets a pixel minimum with `auto`. In
`fixed`, an ordinary table uses `width`. `align` supports
logical `start` and `end`, physical directions, `center`,
`justify`, and `match-parent`.

`ellipsis` truncates long text in a column's header and cells.
`true` adds a native `title` for strings and numbers.
`{ showTitle: false }` skips the generated body title.
`onCell` and `onHeaderCell` can supply a title, including an
empty string. For custom Snippet content, set `title` in
`onCell`. Ellipsis changes preserve editor DOM and focus.

The active virtual window has shared fixed widths for headers
and cells. They honor `minWidth` with any `tableLayout`.
`virtual` without `scroll.y` retains the default fixed column
layout. Explicit `tableLayout` selects the algorithm in that
case. In the React reference, body minimum width is independent
of the header. In `virtual-min`, the first header is 120px
and its cell is 316px. Svelte uses a common 316px column.
Plain text in a fixed column is truncated inside the cell.
The sort button and custom Snippet keep their DOM.
[Reference](../../../tests/browser/fixtures/ant-design-table-column-layout-reference.json) · [Chromium](../../../tests/browser/table/table-column-layout.spec.ts) · [SSR](../../../tests/package/table/table-column-layout.ssr.test.ts)
· [Hydration](../../../tests/browser/table/table-column-layout-hydration.spec.ts)

## Cell attributes and spans

Column `colSpan` and `rowSpan` size its header.
`onHeaderCell(column)` returns header attributes and can override
both spans. Zero hides the cell. A hidden header retains
the data column.

Use `onCell(record, index)` for body cells. Its index refers
to the current expanded page, including visible descendants.
`column.render(record, index, value)` gets a sibling index.
Both attribute callbacks can return `TableCellProps` with
`class`, CSS string `style`, `data-*`, `aria-*`, and Svelte
handlers such as `onclick`. The class supplements column
classes. `render` controls content, and `scope` comes from
the header or column `rowScope`.

```ts
const teamColumn: TableColumn<Person> = {
  key: 'team',
  title: 'Team',
  dataIndex: 'team',
  onCell: (_record, index) => ({
    rowSpan: index === 0 ? 2 : index === 1 ? 0 : 1
  })
};
```

The virtual window shows a spanning cell even when its
origin row leaves the window. Height includes measured
rows and expanded details, and the span stops at the end of
the current page. Combined `colSpan` and `rowSpan` preserve
neighboring column positions. Ordinary mode uses native
`colspan` and `rowspan`. Virtual mode positions the span row
over the row flow and retains native cells and DOM events.

The comparison uses 32 states and eight Ant Design 6.6.8
server renders for spans, visible rows, actions within merged
cells, and RTL. Strict hydration checks editor state when
the window changes. [Browser tests](../../../tests/browser/table/table-spans.spec.ts) ·
[Hydration](../../../tests/browser/table/table-spans-hydration.spec.ts) · [SSR tests](../../../tests/package/table/table-spans.ssr.test.ts)

## Row headers

`TableColumn.rowScope` accepts `'row'` or `'rowgroup'`. Its
data cells become `th` with the corresponding scope, as in
Ant Design 6.6.8. Omission uses `td`. Column headers,
selection and expand cells, and expanded content rows keep
their semantics. `rowScope` leaves records independent. Row
headers use `headerBg`, `headerColor`, and `fontWeightStrong`.
Selection and `rowHoverable` keep their colors.

Fixed row headers use upstream `headerBg` over the existing
opaque background of native sticky cells. The raw UMD
computed CSS is kept without substituted values for these
layers. Changing `row` to `rowgroup` updates scope while
preserving the cell, editor, focus, selection, and FormData.
Adding or removing `rowScope` changes the tag and remounts cell
content as in React. `?fixture=table-row-scope` covers 18 UMD
cases with DOM, CSS, and controls. [Browser tests](../../../tests/browser/table/table-row-scope.spec.ts)
· [SSR tests](../../../tests/package/table/table-row-scope.ssr.test.ts)

## Row classes and hover highlighting

`rowClassName` accepts a string or
`(record, index, indent) => string` and adds to base row and
selection classes. The index starts at 0 in current-page
visible order. `indent` is nesting depth. Updating the
callback or its reactive dependencies changes classes while
preserving the row and controls.

`rowHoverable` defaults to `true` and controls built-in hover
highlighting. The upstream theme uses `rowHoverBg` and
`rowSelectedHoverBg`. Native-only themes retain their styling.
`false` clears highlighting immediately, even with the pointer
inside the row, and preserves selection, sorting, focus, and
keyboard controls. The prop leaves custom row and input
events available.

In the pinned UMD, switching from true to false leaves
HoverContext highlighting even after pointer leave. The raw
observation is kept, and Svelte clears paint immediately
using a CSS guard. The reference records upstream HoverContext
classes for diagnosis. The native CSS `:hover` comparison checks
colors. Browser and SSR tests cover these boundaries and
current flat rows at `?fixture=table-row-options`.
[Observation](../../../tests/browser/fixtures/ant-design-table-hover-observation.json) · [Browser tests](../../../tests/browser/table/table-row-options.spec.ts) ·
[SSR tests](../../../tests/package/table/table-row-options.ssr.test.ts)

## Row attributes

`onRow(record, index)` returns `TableRowProps` for a data row.
The index starts at 0 on the expanded page after filtering,
sorting, and pagination. The virtual window passes the same
index. Empty, summary, and detail rows skip the callback.

`onHeaderRow(columns, index)` receives column definitions for
that header level, including visibility, groups, and selection
and expansion positions. If the header has only an empty cell,
the callback gets a definition with empty `key` and `title`.
`showHeader={false}` skips the callback.

The returned object can contain `class`, CSS string `style`,
`data-*`, `aria-*`, and native Svelte handlers. The data row class
supplements `rowClassName`. Row-click expansion updates keys and
calls `onExpand` and `onExpandedRowsChange` before `onRow`'s
`onclick`. Built-in expand buttons handle their own clicks.
`onRow` can receive an editor click without expanding the row.

Table owns `data-row-key` and computed virtual `aria-rowindex`.
A custom ID on a nested row is used in the expansion button's
`aria-controls`. When a virtual row has two representations,
`id` and `tabindex` stay on the ordinary row. The spanning-cell
layer retains attributes, class, style, and handlers for the
same record.

In Ant Design 6.6.8, `HeaderRow` overwrites the returned
`className` and `style` with semantic DOM values. Svelte applies
`class` and `style` from `onHeaderRow` to the header row. The
reference retains the React result. Svelte tests also cover
fixed header offsets and strict editor hydration.
[Reference](../../../tests/browser/fixtures/ant-design-table-row-attributes-reference.json) · [Chromium](../../../tests/browser/table/table-row-attributes.spec.ts) · [SSR](../../../tests/package/table/table-row-attributes.ssr.test.ts)
· [Hydration](../../../tests/browser/table/table-row-attributes-hydration.spec.ts)

## Title and footer panels

`title` and `footer` take Snippets with a readonly array of
current page records. In client mode, it is already filtered,
sorted, and paginated. Without pagination, it is the full
processed set. Server mode passes the supplied `dataSource`
without repagination. An empty set passes `[]`.

```svelte
<Table dataSource={people} {columns} caption="Members">
  {#snippet title(currentPage)}On this page: {currentPage.length}{/snippet}
  {#snippet footer(currentPage)}Total score on this page:
    {currentPage.reduce((sum, person) => sum + person.score, 0)}
  {/snippet}
</Table>
```

Panels are inside `.ant-table` before and after the scroll
container. Caption remains the native table caption. A supplied
empty Snippet keeps the panel and its padding. Omitting the
Snippet removes the panel. Footer uses `footerBg` and
`footerColor`. Both panels use the current size's padding and
font and the theme's border and radius. Page, sort, filter,
loading, and theme changes preserve remaining Snippet content
and emit no extra `onChange`. The comparison uses
`?fixture=table-panels`. [Browser tests](../../../tests/browser/table/table-panels.spec.ts) · [SSR tests](../../../tests/package/table/table-panels.ssr.test.ts)

## Summary rows

`summary` receives the same readonly page records as `title`
and `footer`. In virtual mode, it receives the whole page.
The Snippet renders in `tfoot` of the shared table.
`Table.Summary` groups rows, and `Table.Summary.Row` passes
attributes and events to its `tr`.

```svelte
{#snippet totals(page: readonly Person[])}
  <Table.Summary>
    <Table.Summary.Row>
      <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
      <Table.Summary.Cell index={1} align="right">
        {page.reduce((total, person) => total + person.score, 0)}
      </Table.Summary.Cell>
    </Table.Summary.Row>
  </Table.Summary>
{/snippet}

<Table dataSource={people} {columns} rowKey="id"
  scroll={{ y: 320 }} summary={{ fixed: 'bottom', render: totals }} />
```

`Table.Summary.Cell` accepts `colSpan`, `rowSpan`, `align`, and
HTML cell attributes. `index` is zero-based among visible columns
including selection and expansion. A spanning cell is fixed to
the side shared by both outer columns of its `colSpan`.

Use `summary={totals}` for a regular summary after rows or
`summary={{ fixed: 'top', render: totals }}` to fix it below
the header. `fixed: true` is equivalent to `'bottom'`. Fixing
applies with `scroll.y` or `sticky`. Table receives the
configuration so SSR can place the section. A top summary
stays visible with the header hidden. A regular virtual table
summary is available after the last row.

If fixed columns cover an already focused editor during
hydration, Table scrolls to it horizontally when there is
space between the columns. DOM, value, and selection remain.
The original overlap is recorded in the measurement.
[Hydration measurement](../../../tests/browser/fixtures/ant-design-table-summary-focus-reference.json)

The reference retains 27 Ant Design 6.6.8 states and nine
server snapshots. Upstream loses the summary in two cases:
`showHeader={false}` with `fixed: 'top'`, and virtual body with
an ordinary summary. Tests check native placement, keyboard
access, and editor focus. [Measurements](../../../tests/browser/fixtures/ant-design-table-summary-reference.json) ·
[Browser scenarios](../../../tests/browser/table/table-summary.spec.ts) · [Hydration](../../../tests/browser/table/table-summary-hydration.spec.ts) ·
[SSR](../../../tests/package/table/table-summary.ssr.test.ts)

## Table prefixes

`prefixCls` sets local Table classes. Without a nonempty value,
it uses `ConfigProvider.prefixCls + '-table'`. Checkbox,
Pagination, Button, and the filter shell resolve the shared
prefix independently of the table. `dropdownPrefixCls` sets
the filter list prefix (`-menu`) as in upstream FilterDropdown.
The shared shell and controls keep their namespace.

Upstream custom `dropdownPrefixCls` leaves the filter Menu
without matching CSS selectors. Its raw transparent background
is recorded separately from a public inherited-prefix
comparison. Svelte retains the list styling. Only menu
background uses that comparison, and other properties use
raw upstream results.

The 187 pinned CSS rules are scoped to the pair of owner and
shared prefixes. Public component tokens and the
`ant-table-css-var` marker keep canonical names. Private
`nested-border-top` follows the shared namespace. Upstream
theme, default styling, fixed offsets and scroll, and native
controls survive prefix updates. An open filter retains
draft, focus, and IDs. An expanded row keeps its editor,
selection, and FormData. [Browser tests](../../../tests/browser/table/table-prefix.spec.ts) ·
[SSR tests](../../../tests/package/table/table-prefix.ssr.test.ts)

## Table component theme

`ConfigProvider.theme.components.Table` applies upstream
component tokens and aliases to cells, borders, sorting,
hover and selection, expansion controls, and filters. It
supports algorithms, custom `cssVar` prefix, nested providers,
and updates after mount. Local `style` keeps precedence.
Theme changes retain rows, selection, sorting, and drafts
and focus in an expanded Snippet.

The native default size still inherits `componentSize` and
falls back to `medium`. In the Ant Design theme, selection
width comes from `selectionColumnWidth`. Expansion width
uses the upstream `controlInteractiveSize + padding × 2`
formula. Explicit `expandable.columnWidth` wins. Without an
upstream theme, both columns default to 48px. Fixed cells
retain an opaque background.

`stickyScrollBarBg` and `stickyScrollBarBorderRadius` style the
additional scrollbar thumb. Summary cells inherit Table
colors and padding. The theme reference covers comparisons,
coverage limits, and the root style observation.
[Theme reference](../theme-context.md#table-theme)

## Semantic styling

`Table` and `ConfigProvider.table` accept `classNames` and
`styles` as an object or function of `{ props }`. The function
receives Table props with any explicit provider size. Styles
are CSS strings.

| Slot | Element |
| --- | --- |
| `root` | Outer Table container |
| `section` | Container around the scroll region |
| `content` | Scroll region in ordinary mode without a fixed header |
| `title`, `footer` | Panels above and below the table |
| `header.wrapper`, `header.row`, `header.cell` | `thead`, header row, and header cell |
| `body.wrapper`, `body.row`, `body.cell` | `tbody`, data row, and cell |
| `pagination.root`, `pagination.item` | Pagination `nav` and its items |

String `classNames.header` and `classNames.body` style their
respective `wrapper`. A string `classNames.pagination` adds to
the Pagination root. `body.wrapper` applies to ordinary and
empty bodies. Virtual rows use `body.row` and `body.cell`.
Cell slots include selection and expansion columns. Empty and
separate detail rows use their own styling.

Provider and Table classes accumulate. `rootClassName` is
added to the outer container and open filter panels. Attributes
from `onHeaderRow`, `onRow`, `onHeaderCell`, and `onCell` are
preserved, and matching slots supplement their CSS. The root
applies theme styles, `ConfigProvider.table.styles.root`,
`ConfigProvider.table.style`, `Table.styles.root`, and
`Table.style` in order.

In `header`, `body`, and `pagination`, an omitted instance slot
inherits the provider slot. A supplied slot replaces it in
full. Explicit `undefined` clears inherited group styling.
Pagination classes from `Table.classNames.pagination` precede
`pagination.classNames`. Table styles follow
`pagination.styles`.

Layer order and elements were compared against 17 states
and 13 Ant Design 6.6.8 server snapshots. Hydration tests
preserve editor DOM, value, focus, and selection through style
changes. [React snapshots](../../../tests/browser/fixtures/ant-design-table-semantic-reference.json) · [Browser tests](../../../tests/browser/table/table-semantic.spec.ts)
· [Hydration](../../../tests/browser/table/table-column-layout-hydration.spec.ts) · [SSR](../../../tests/package/table/table-semantic.ssr.test.ts)

## Fixed header and columns

In ordinary mode, `scroll.y` sets the maximum height of the
scroll region including caption and header. A number means
pixels, and a string is a CSS length such as `"20rem"` or
`"calc(100vh - 240px)"`. The header stays at the top during
vertical scrolling. Pagination is outside that region. With
a fixed summary, `scroll.y` applies to the body, and measured
header, caption, and summary heights are added. Without
`scroll.y`, height follows content.

`sticky` fixes the header during window scroll and shows an
additional horizontal scrollbar when the body is wider than
the region and extends below the viewport.
`sticky={{ offsetHeader: 48, offsetSummary: 12, offsetScroll: 8 }}`
sets pixel offsets for the header, bottom summary, and bar.
Offsets default to zero. `getContainer` can return a scrollable
element and resolves after DOM is available. Header, body,
summary, and the additional bar scroll horizontally together.

`column.fixed` accepts `true` (same as `"start"`), `"start"`,
`"end"`, or `false`. Start fixes a column to the row start and
end to the row end, with automatic RTL mirroring.
`rowSelection={{ fixed: true }}` fixes selection to the start.
Columns are unfixed by default.

```svelte
<script lang="ts">
  import { Table, type TableColumn } from '@woodger/antd';

  interface Person { key: number; name: string; team: string; tasks: number }
  const people: Person[] = Array.from({ length: 30 }, (_, index) => ({
    key: index, name: `Member ${index + 1}`, team: 'Engineering', tasks: index
  }));
  const columns: TableColumn<Person>[] = [
    { key: 'name', title: 'Member', dataIndex: 'name', width: 200, fixed: true },
    { key: 'team', title: 'Team', dataIndex: 'team', width: '24rem' },
    { key: 'tasks', title: 'Tasks', dataIndex: 'tasks', width: 100, fixed: 'end' }
  ];
</script>

<Table dataSource={people} {columns} caption="Members"
  rowSelection={{ fixed: true }} scroll={{ x: 1000, y: 320 }} pagination={false} />
```

Multiple columns on one side receive offsets from actual
cell widths, including a fixed selection column. Width is
remeasured on resize, content changes, and column changes.
Both numeric and CSS widths work. Use `width` and `scroll.x`
for a predictable layout. When the combined fixed width
equals or exceeds the region, horizontal fixing is temporarily
disabled. All columns remain reachable by scrolling, and the
header stays fixed. Widening the region restores fixing.

One native table uses CSS sticky. Focus order and Snippets
are preserved. Scroll padding accounts for fixed regions.
Filters use top-layer popovers and update position on scroll
and width changes. Fixed cells have an opaque background
accounting for theme, sort, and selection. ResizeObserver
disconnects on configuration changes and unmount.

Ordinary SSR emits all page rows and a CSS-sticky header.
Horizontal fixing activates after browser width measurements.
Before hydration, columns are available through ordinary
scrolling. Layout changes leave `onChange` and
`onSelectionChange` uncalled. Filtering, sorting, selection,
and pagination retain their behavior in both data modes.

## Virtual rows and scrolling

`virtual` enables a row window when `scroll.y` is supplied and
data exists. Numeric `scroll.y` limits body height. The header
and caption stay above it within the same scroll container.
Fixed summaries occupy a separate band, and ordinary summaries
scroll after rows. As in Ant Design 6.6.8, virtual mode uses
numeric `scroll.x` and `scroll.y`, with fallbacks of 1 and 500px
respectively. Percentage column width uses `scroll.x`. Free
width is distributed across columns based on actual container
width.

Table renders semantic `table`, `thead`, and `tbody` with the row
window. Expanded details are included in their row's measured
height. Selection covers the whole page, including off-window
rows and descendants of collapsed branches. Ordinary rows
and their Snippets unmount outside the window. Spanning cells
remain while they intersect it. SSR renders the first window
using estimated height. After hydration, Table measures heights
from the DOM.

`bind:this` exposes `TableRef.scrollTo({ top, key, index, align, offset })`.
`bind:nativeElement` gives the root `HTMLDivElement`. `top` sets
absolute vertical position and takes precedence. A `key` or
`index` addresses expanded rows of the current page. Both modes
support `start`, `end`, and `nearest`. Ordinary Table supports
`center`. In virtual mode, `offset` normally leaves a gap above
the target row. With `align="end"`, the gap is below the row.

`onScroll` reports container scrolling, on the vertical axis
in virtual mode. User sorting, filtering, or pagination scrolls
virtual Table to the top. Use `scrollToFirstRowOnChange: false`
in `scroll` to retain position, or `true` to reset ordinary
Table as well.

UMD measurements compare window geometry, RTL, selection outside
the window, and public scrolling. If some variable-height rows
are not measured, exact `scrollTop` after a key jump depends on
estimates. The comparison checks the target row relative to the
visible region. Chromium tests cover native keyboard behavior,
caption, focus, and hydration. [UMD measurements](../../../tests/browser/fixtures/ant-design-table-virtual-reference.json)

### Custom scroll body

A `components.body` Snippet receives current-page root records
after sorting and filtering. Table uses it with `scroll.y` or
`sticky`. Built-in virtualization uses its own row window.
The Snippet renders rows, sets container size, and provides
accessibility. Set numeric column widths for the shared grid.

```svelte
<script lang="ts">
  import { Table, type TableBodyRenderInfo, type TableColumn } from '@woodger/antd';

  interface Person { key: number; name: string; }
  const people: Person[] = [{ key: 1, name: 'Anna' }];
  const columns: TableColumn<Person>[] = [
    { key: 'name', title: 'Name', dataIndex: 'name', width: 640 }
  ];
</script>

{#snippet body(page: readonly Person[], info: TableBodyRenderInfo)}
  <div role="region" aria-label="Members" style="max-height:240px;overflow:auto"
    {@attach info.ref} onscroll={info.onScroll}>
    <div style="width:640px">
      {#each page as person (person.key)}
        <div data-row-key={person.key}>{person.name}</div>
      {/each}
    </div>
  </div>
{/snippet}

<Table dataSource={people} {columns} components={{ body }} scroll={{ x: 640, y: 240 }} />
```

The `info.ref` attachment registers the DOM container.
`scrollTo({ key })` looks up `data-row-key`, while
`scrollTo({ index })` uses the current-page record's key.
`info.onScroll` sends horizontal position to the header and fixed
summaries. The Snippet handles custom scroll events.
`info.scrollbarSize` contains vertical scrollbar width in pixels
and is zero during SSR. Body summaries can render in the same
Snippet.

An external virtualizer can pass `info.ref` an object with
physical `scrollLeft` and `scrollTo`. Table forwards the original
request. `info.onScroll({ scrollLeft })` synchronizes position.
Cleanup returned by `info.ref` releases registration.
[UMD measurements](../../../tests/browser/fixtures/ant-design-table-custom-body-reference.json) · [Visible scrollbar measurements](../../../tests/browser/fixtures/ant-design-table-custom-body-gutter-reference.json)
· [Chromium](../../../tests/browser/table/table-custom-body.spec.ts) · [SSR](../../../tests/package/table/table-custom-body.ssr.test.ts) · [Hydration](../../../tests/browser/table/table-virtual-hydration.spec.ts)

### Replacing individual elements

`components.table` sets the main table. With `scroll.y` or
`sticky`, replacing the table places the header and fixed
summaries in separate bands. Set their tables through
`components.header.table`. Horizontal scrolling and column widths
are synchronized across bands and body. Keyboard navigation
brings the full header button into view if it fits between
fixed columns. Header, body, and summary scroll together.

`components.header` and object `components.body` accept
`wrapper`, `row`, and `cell`. Set an element with an HTML tag
name or Snippet. In the virtual window, the built-in list
renders the main body. Its replaceable elements retain
`tbody`, `tr`, `td`, and `th` semantics. An empty virtual table
uses the default body.

A Snippet receives the default `tag`, assembled `attributes`
and handlers, `children`, and the `ref` attachment. Pass them to
the matching HTML element so Table can measure rows and retain
keyboard behavior. For example, add a CSS property in a
Snippet and pass it as
`components={{ body: { row: editableRow } }}`.

```svelte
<script lang="ts">
  import type { TableElementRenderInfo } from '@woodger/antd';
</script>

{#snippet editableRow({ attributes, children, ref }: TableElementRenderInfo<'tr'>)}
  <tr {...attributes} data-editable="" {@attach ref}>{@render children()}</tr>
{/snippet}
```

[Element reference](../../../tests/browser/fixtures/ant-design-table-element-components-reference.json) · [Chromium](../../../tests/browser/table/table-element-components.spec.ts) ·
[SSR](../../../tests/package/table/table-element-components.ssr.test.ts) · [Hydration](../../../tests/browser/table/table-virtual-hydration.spec.ts)

## Column filters

In client mode, a column supplies `filters: [{ text, value }]`
and an `onFilter(value, record)` predicate. String, number,
and boolean values keep their types, including numeric `0`
and `false`. Values within one column combine with OR, and
filters from different columns combine with AND.

```svelte
<script lang="ts">
  import { Table, type TableColumn, type TableFilters } from '@woodger/antd';

  interface Person { key: number; name: string; active: boolean }

  const people: Person[] = [
    { key: 0, name: 'Anna', active: true },
    { key: 1, name: 'Boris', active: false }
  ];
  const columns: TableColumn<Person>[] = [
    { key: 'name', title: 'Name', dataIndex: 'name' },
    {
      key: 'active', title: 'Status', dataIndex: 'active', filterMultiple: false,
      filters: [{ text: 'Active', value: true }, { text: 'Paused', value: false }],
      onFilter: (value, person) => person.active === value
    }
  ];
  let filters = $state<TableFilters>({});
</script>

<Table dataSource={people} {columns} bind:filters caption="Members" />
```

Table `filters` maps each `column.key` to an array of selected
values. Standalone tables read `defaultFilters` once. With
binding, initialize state in its owner. `filterMultiple`
allows multiple selected values by default. `false` leaves
one option and uses native radios in a flat list.

`children` sets nested options. `filterMode: 'menu'` opens
them as submenus. `filterMode: 'tree'` shows an expandable
tree. In multiple mode, a branch checkbox includes
descendants, and the shared checkbox selects all options.
Branches and leaves keep their original values.

`filters[].text` accepts a string, number, Snippet, or
nested label array. `0` renders as a number. A boolean or
`null` leaves an empty label. `undefined` in the tree
displays `---`. The filter criterion still comes from `value`.

`filterSearch: true` matches strings and numbers. A menu
hides nonmatching items, and a tree highlights matches.
`filterSearch(input, option)` receives the original option,
including a Snippet or array in `text`. Menu search lowercases
and trims the query. Tree search passes field text as
entered. Search retains checks. The query clears on close
or reset, and tree expansion persists.
[Reference](../../../tests/browser/fixtures/ant-design-table-filter-content-reference.json) · [Chromium](../../../tests/browser/table/table-filter-content.spec.ts) · [SSR](../../../tests/package/table/table-filter-content.ssr.test.ts)

`defaultFilteredValue` sets the column's initial filter. An
explicit key in Table `defaultFilters` takes precedence.
`filteredValue` controls a column, including an empty state
with `null` or `[]`. Removing control with `undefined` returns
to the local criterion. With `filteredValue`, Table uses
controlled column criteria. A supplied Table `filters` or
initial `defaultFilters` map supplies state for the remaining
columns. `bind:filters` reports user selection even when a
column awaits the owner's update to `filteredValue`.

Hidden and responsive columns still apply their criteria.
`filtered` highlights the filter button independently of
criteria.

Menu options update a draft. Apply commits it and closes
the menu. Reset clears the draft or restores
`defaultFilteredValue` with `filterResetToDefaultFilteredValue`.
Use Apply to commit the reset. Escape, outside click, and
focus leaving discard uncommitted changes. Reopening starts
with applied state. Changes in applied values, options,
selection mode, disabled or loading state, or column
removal close the stale menu. Updating a label array
element closes the panel with the old list. Reactive
content of the same Snippet updates in an open panel and
preserves draft and focus.

Applying a changed filter sets `current=1` and calls
`onChange` once with `action='filter'`. Identical values
leave the callback and page unchanged. With filterable
columns, `onChange` also receives `filters` with normalized
active criteria. Without them, the existing event shape
is preserved. `TableChange.filters` is optional. In client
mode, `currentDataSource` contains processed rows before
pagination under the requested criteria. A controlled
column displays rows from the owner's `filteredValue`.
`pagination.total` is the displayed result count before
pagination.

External changes to `filters`, `dataSource`, or `columns`
leave callbacks and the owner's page untouched. Duplicate
values are removed. In client mode, the built-in filter
ignores unknown choices, removed columns, and columns
without an option list or predicate. Single selection uses
the first valid value. Owner state is retained, so a
returning column can reapply its filter. Selected keys
persist when filters hide rows. Select all affects only
enabled rows on the visible page.

The menu uses a native popover above the scrolling table.
Tab moves among controls, Space toggles Checkbox, arrows
change radio selection, and Enter on a native selection
input applies the filter. In submenus and trees, Space
toggles the option. In the search field, Enter keeps the
draft open. Escape returns focus from a submenu to its
title and from the main panel to its filter button. The
menu stays within the viewport and inherits theme and RTL.
Configure filter labels per table. [Filter labels](#table-locale)

[Reference](../../../tests/browser/fixtures/ant-design-table-filter-state-reference.json) · [Chromium](../../../tests/browser/table/table-filter-state.spec.ts) · [SSR](../../../tests/package/table/table-filter-state.ssr.test.ts)
· [Hydration](../../../tests/browser/table/table-filter-state-hydration.spec.ts)

[Options and search reference](../../../tests/browser/fixtures/ant-design-table-filter-options-reference.json) · [Chromium](../../../tests/browser/table/table-filter-options.spec.ts)
· [SSR](../../../tests/package/table/table-filter-options.ssr.test.ts)

### Custom filter panel

`filterDropdown` accepts a string, number, Snippet, or nested array.
`0`, `''`, `false`, `null`, and `undefined` use the default option
list. `true` and an empty array render an empty custom panel.
Snippets inside arrays are called without arguments.

A top-level Snippet receives the panel controls. `selectedKeys`
holds the draft. `setSelectedKeys` updates it and accepts strings,
numbers, and booleans. The custom panel decides which values
and how many are allowed. Criteria from a custom panel without
`onFilter` remain in state and `onChange`. Other columns'
predicates still filter rows. The Snippet argument's `filters`
contains the suggested options. Selecting a `Menu` item within
the Snippet leaves the panel open. Its `onSelect` can pass new
keys to `setSelectedKeys`.

```svelte
<script lang="ts">
  import { Table, type TableColumn, type TableFilterDropdownProps } from '@woodger/antd';

  type Row = { key: string; team: string };
  const dataSource: Row[] = [{ key: '1', team: 'core' }, { key: '2', team: 'ops' }];
  const columns: TableColumn<Row>[] = [{
    key: 'team',
    dataIndex: 'team',
    title: 'Team',
    filterDropdown: teamFilter,
    onFilter: (key, row) => key === row.team
  }];
</script>

{#snippet teamFilter(filter: TableFilterDropdownProps)}
  <button type="button" onclick={() => filter.setSelectedKeys(['core'])}>
    Core team
  </button>
  <button type="button" onclick={() => filter.confirm()}>Apply</button>
{/snippet}

<Table {columns} {dataSource} pagination={false} />
```

`confirm()` requests closing before applying the draft.
`confirm({ closeDropdown: false })` applies criteria and leaves
the panel open. `close()` closes without changes. `clearFilters()`
restores the initial draft. With
`filterResetToDefaultFilteredValue`, it uses
`defaultFilteredValue`. `confirm: true` applies the reset, and
`closeDropdown: true` then requests close. An open panel
synchronizes its draft when the owner's applied values change.

`filterDropdownProps` passes options to Dropdown. `open` controls
visibility, and `onOpenChange(open)` reports requests from the
trigger or filter API. Selection in Menu keeps the panel open
until a separate close request. `placement`, `trigger`,
`getPopupContainer`, `destroyOnHidden`, and `forceRender` follow
Dropdown rules. `popupRender` receives the original content
Snippet.

Built-in and custom filter panels inherit the Dropdown layer.
[Dropdown layer](../theme-context.md#layering-nested-panels)

`filterIcon` accepts a string, number, Snippet, or nested array.
A top-level Snippet gets the active-filter flag. `0`, `''`,
`false`, `null`, and `undefined` use the default icon. `true`
and an empty array leave the button without decorative content.
Its accessible name comes from the column title and locale.

The built-in panel discards the draft on close by default.
With `filterOnClose: true`, user actions that close the panel
apply the draft. Owner updates to `open` change visibility.
A custom panel applies its criteria through `confirm` or
`clearFilters({ confirm: true })`.

[Panel reference](../../../tests/browser/fixtures/ant-design-table-filter-dropdown-reference.json) · [Chromium](../../../tests/browser/table/table-filter-dropdown.spec.ts) · [SSR](../../../tests/package/table/table-filter-dropdown.ssr.test.ts)

[Static panel and icon reference](../../../tests/browser/fixtures/ant-design-table-filter-static-content-reference.json) · [Chromium](../../../tests/browser/table/table-filter-static-content.spec.ts)
· [SSR](../../../tests/package/table/table-filter-static-content.ssr.test.ts) · [Hydration](../../../tests/browser/table/table-filter-state-hydration.spec.ts)

### Popup containers

`Table.getPopupContainer(trigger)` receives the DOM element
that opens a filter panel, its submenu, or the row selection
command menu. It returns the container for that surface.
Without a Table function, `ConfigProvider.getPopupContainer`
is used. With no configured container, the built-in filter
stays in the header.

`column.filterDropdownProps.getPopupContainer` takes precedence
for that column's outer panel. Its nested menu uses Table or
provider settings. Sort tooltip containers come from
`showSorterTooltip.getPopupContainer` and ConfigProvider.

Container resolution takes place in the browser. Moving an
open panel preserves the filter draft.
[Container reference](../../../tests/browser/fixtures/ant-design-table-popup-container-reference.json) · [Chromium](../../../tests/browser/table/table-popup-container.spec.ts) ·
[SSR](../../../tests/package/table/table-popup-container.ssr.test.ts) · [Hydration](../../../tests/browser/table/table-filter-state-hydration.spec.ts)

## Sort directions and priorities

`column.sorter` accepts `(left, right, order) => number` or
`{ compare, multiple }`. Table passes the active direction
to the comparator and applies the direction's sign to its
result. Comparators run in descending `multiple` order,
including zero and negative priorities. Equal priorities
use criterion order. Records equal under every criterion
retain source order. Tree sorting compares siblings at
each level.

Table `sortDirections` sets the cycle. A column's own list
takes precedence. The click after the final direction clears
sorting. `['ascend', 'descend', 'ascend']` cycles between both
directions without clearing. The list also controls which
arrows appear. `sortIcon` replaces them with a decorative
Snippet and receives `{ sortOrder }`, with `null` for no
direction. Name and focus stay with the header button.

`column.sortOrder` controls the displayed direction, including
explicit `null`. Hidden columns also supply this setting.
On click, `onChange` gets requested criteria and the resulting
`currentDataSource`. Displayed rows adopt that order when
the owner updates the column. Without controlled columns,
a supplied root `sorter` sets one criterion. For initial
state, `defaultSorter` takes precedence over
`column.defaultSortOrder`. Both are read at table creation.
A removed criterion is skipped while its column is absent.

For sorting multiple columns, set a numeric `multiple` in
their configuration. Selecting a single-sort column replaces
the list. Selecting a multi-sort column moves its criterion
to the end. `onChange` still passes the first active criterion
or `null` as scalar `sorter`. With configured `multiple` or
multiple active criteria, it also passes `sorters` with the
full active list in state order. A sort object without
`compare` reports the criterion to the owner and keeps data
order. [Reference](../../../tests/browser/fixtures/ant-design-table-sorter-reference.json) · [Chromium](../../../tests/browser/table/table-sorter.spec.ts) ·
[SSR](../../../tests/package/table/table-sorter.ssr.test.ts) · [Hydration](../../../tests/browser/table/table-sorter-hydration.spec.ts)

### Sort tooltip

`showSorterTooltip` defaults on and shows the next direction
in the sort cycle. Column settings replace Table settings in
full. `false` turns the tooltip off and keeps the sort button
available.

By default, hovering the header triggers the tooltip. In a
filterable column, sorting has its own hover area.
`{ target: 'sorter-icon' }` limits it to the icon. One button
handles direction selection with Enter and Space. The icon
stays decorative. Header `trigger: 'focus'` attaches Tooltip
to button focus.

A `showSorterTooltip` object uses Tooltip options including
`title`, `placement`, `trigger`, `open`, `onOpenChange`,
`getPopupContainer`, `prefixCls`, `classNames`, and `styles`.
Explicit `title` replaces the localized direction, including
an empty string or numeric 0. Changing the target area or
disabling Tooltip cancels pending opening. The button keeps
its DOM, focus, and direction. Its accessible description
reports the next direction when closed. An open header
tooltip describes it with the tooltip content.
[Tooltip](./tooltip.md) · [Reference](../../../tests/browser/fixtures/ant-design-table-sorter-tooltip-reference.json) ·
[Chromium](../../../tests/browser/table/table-sorter-tooltip.spec.ts) · [SSR](../../../tests/package/table/table-sorter-tooltip.ssr.test.ts)

## Server mode

`mode="server"` displays the supplied `dataSource` page in
full and in source order. Table leaves filtering, sorting,
and pagination to the owner, even with local `sorter` or
`onFilter` or when the row count differs from `pageSize`.
The API response's `total` defines the Pagination range.
If omitted, Table uses positive `pagination.total` or the
length of `dataSource`. Normalization follows Pagination.
`pagination={false}` hides navigation and keeps all supplied
rows.

For remote sorting, set `column.sorter: true` or an object
with `multiple` for combined criteria. For filtering,
`column.filters` is enough without `onFilter`.
`sorter: true` is used in server mode. A comparator runs in
client mode. Filter normalization, single selection, and
the sort cycle are preserved. Sorting keeps the page,
and applying a changed filter sets page 1.

`onChange` receives current `pagination`, `sorter`, `filters`,
and the action. In server mode, `currentDataSource` contains
only the supplied page, and `pagination.total` is external.
Rows stay as supplied until the owner replaces `dataSource`.
External prop updates leave the callback and owner state
untouched, including `current` when `total` falls. If the
current page is outside the new range, the owner requests
a valid page. Table performs no requests.

`selectedRowKeys` persists across page replacement.
`onSelectionChange` passes all selected keys, and records
contains only selected records present in current
`dataSource`. There is no record cache from other pages.
Select all affects enabled rows of the loaded page.

In the example, the server takes `page` and `pageSize` and
returns JSON with a `rows` array and overall `total`.
Use your API URL. A user-driven page change updates the
query parameters through bindings. Changing the page or
unmounting cancels the previous request.

```svelte
<script lang="ts">
  import { Table, type TableColumn } from '@woodger/antd';

  interface Member {
    id: number;
    name: string;
  }

  const columns: TableColumn<Member>[] = [
    { key: 'name', title: 'Member', dataIndex: 'name' }
  ];
  let current = $state(1);
  let pageSize = $state(10);
  let rows = $state<Member[]>([]);
  let total = $state(0);
  let loading = $state(false);
  let error = $state('');

  $effect(() => {
    const controller = new AbortController();
    const url = `/api/members?page=${current}&pageSize=${pageSize}`;

    async function loadPage() {
      loading = true;
      error = '';
      rows = [];

      try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Load failed (HTTP ${response.status})`);
        }

        const page: { rows: Member[]; total: number } = await response.json();

        if (!controller.signal.aborted) {
          rows = page.rows;
          total = page.total;
        }
      }
      catch (cause) {
        if (!controller.signal.aborted) {
          error = cause instanceof Error ? cause.message : 'Could not load the page';
        }
      }
      finally {
        if (!controller.signal.aborted) {
          loading = false;
        }
      }
    }

    void loadPage();

    return () => controller.abort();
  });
</script>

{#if error}
  <p role="alert">{error}</p>
{/if}

<Table
  mode="server"
  rowKey="id"
  dataSource={rows}
  {columns}
  {total}
  {loading}
  bind:current
  bind:pageSize
  caption="Members"
/>
```
