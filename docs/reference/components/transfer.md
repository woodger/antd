# Transfer

Transfer shows two lists for moving items. The owner always sets
`targetKeys`. `onChange(nextKeys, direction, moveKeys)` proposes a move.
Update `targetKeys` in the callback to accept it. There is no local
`defaultTargetKeys`.

```svelte
<script lang="ts">
  import { Transfer, type TransferKey } from '@woodger/antd';

  const dataSource = [
    { key: 'a', title: 'Alpha' },
    { key: 'b', title: 'Beta' },
    { key: 'locked', title: 'Locked', disabled: true }
  ];
  let targetKeys = $state<TransferKey[]>(['b']);
</script>

<Transfer
  {dataSource}
  {targetKeys}
  render={record => record.title}
  onChange={next => { targetKeys = next; }}
  showSearch
/>
```

A row needs a stable string, number, or bigint key or `rowKey`. The
number `0`, the string `'0'`, and bigint keys remain distinct. Without
`rowKey`, callbacks receive the original objects. With it, they receive
copies with the calculated key. Input data is left intact. `dataSource`
defines the source order, and `targetKeys` defines the target order.
Unknown target keys remain in `onChange` even when their rows are absent.
Moving right prepends selected enabled keys to `targetKeys`.

Selection is local until `selectedKeys` is supplied. The owner updates
controlled `selectedKeys` through
`onSelectChange(sourceKeys, targetKeys)`. Returning to `undefined`
resets to empty local selection. Disabled rows cannot be toggled or
moved. Selecting only disabled rows keeps actions disabled. A move
calls `onSelectChange` with its corresponding side cleared before
`onChange`. Removing data clears stale local selection without callbacks.

Native checkboxes support Tab and Space. The label toggles the whole
row. Shift selects a range of enabled rows or clears it if it is
already fully selected. Search resets the range anchor, and selected
rows outside the results stay selected. The default filter uses
case-sensitive `includes`. `showSearch` accepts `placeholder` and
`defaultValue`. `defaultValue` is read once for each list. `onSearch`,
`onScroll`, and `onChange` use the logical `left`/source and
`right`/target. `filterOption`, `footer`, and `children` receive the
physical side, which swaps in RTL.

`render` remains a callback returning text or `{ label, value }`.
`label` supplies the row content. `value` supplies its `title` and
search text. In place of JSX, the callback can return a Svelte Snippet
that receives the record. For a result without metadata, the first
string or number among the result, `item.title`, and `item.key`
provides the search text. Without `render`, the visible label is blank
as in upstream.

```svelte
<script lang="ts">
  import { Transfer, type TransferKey } from '@woodger/antd';

  const dataSource = [
    { key: 'a', title: 'Anna' },
    { key: 'b', title: 'Boris' }
  ];
  let targetKeys = $state<TransferKey[]>([]);
</script>

{#snippet row(record: { key: string; title: string; })}
  <strong>{record.title}</strong>
{/snippet}

<Transfer
  {dataSource}
  {targetKeys}
  render={record => ({ label: row, value: record.title })}
  onChange={next => { targetKeys = next; }}
/>
```

Pagination uses independent pages, with `pageSize=10` and `simple=true`
by default. Normal mode, `showLessItems`, and `showSizeChanger` are
supported. An explicit `pageSize` sets the controlled page size. Select
current and invert act on the current page. Select all acts on all
enabled rows in the results. Empty results reset the page and local
page size. Temporarily disabling pagination preserves the current page.
`oneWay` allows moves only to the right. Removal and remove current or
all leave disabled rows in place. `showSelectAll=false` hides header
controls while retaining the count.

The `children` Snippet receives `dataSource`, `filteredItems`,
`filteredRenderItems`, `selectedKeys`, `direction`, `disabled`,
semantic slots, and the callbacks `onItemSelect`, `onItemSelectAll`,
`onItemRemove`, and `onScroll`. With `children`, built-in pagination
is off. The `footer` Snippet receives the full list props and
`{ direction }`. The presence of a `children` or `footer` Snippet
determines layout even when its contents are empty. It replaces the
truthiness check of the returned ReactNode.

`actions` accepts text or a Snippet with `disabled`, `direction`,
`icon`, and `onClick`. For custom disabled state and callbacks, use
`{ children, disabled, onClick }`. Connect `info.disabled` and
`info.onClick` to the native control in place of React's
`cloneElement`. A custom `onClick` runs before the move.
`preventDefault` leaves the move intact, as in Ant Design. Additional
actions render separately. In `oneWay` mode, these are all entries
after the first. `selectAllLabels` accepts text or a callback returning
text or a Snippet. `0` renders. `null`, `false`, and the empty
string use the default count.

`ConfigProvider.transfer` sets `class`, `style`, semantic
`classNames` and `styles`, and `selectionsIcon`. Source and target slots
supplement the common slots. Side-specific styles take precedence over
common styles. Local layers take precedence over the corresponding
context layers. Root `style` overrides `styles.root`. `styles.section`
and `styles.actions` style the lists and actions. Locale, themes,
compact mode, RTL, and status are supported. The upstream
`InputStatus` values `success` and `validating` retain their classes
without separate styles. An empty status inherits from FormItem.

Only `aria-*` and `data-*` attributes pass to the root.
`nativeElement` binds to the `div`. Internal checkboxes and search
fields receive no outer FormItem name or ID and do not serialize keys.
A native reset leaves Transfer state and the search query intact. As
with a React input, the checkbox reverts to its initial DOM checked
state until selection updates, while internal selection is preserved.
Update controlled props to reset keys. SSR makes no callbacks and does
not use the DOM. State and resources belong to each instance. The menu
uses the existing Dropdown. [React input](https://github.com/facebook/react/blob/v19.2.0/packages/react-dom-bindings/src/client/ReactDOMInput.js)

`renderEmpty` uses ConfigProvider with the original fallback and locale
precedence and selects array content by side. React-specific refs and
development warnings remain outside the port.

`prefixCls` sets the local Transfer namespace. An empty value inherits
`ConfigProvider.prefixCls`. List, state, and action classes receive
their corresponding CSS, while internal Checkbox, Input, Button, and
Pagination keep independent shared namespaces. Canonical theme
variables and semantic precedence are preserved. Prefix changes keep
fields, checkboxes, and the pager mounted and preserve the query,
text selection, focus, selected keys, and current page.

The UMD reference covers 20 configurations across normal, nested,
and reset scopes and three live transitions. Browser and SSR tests
cover these cases. The native remove button's existing font is
accounted for separately, with raw measurements unchanged.
[UMD reference](../../../tests/browser/fixtures/ant-design-transfer-prefix-reference.json) · [Browser tests](../../../tests/browser/transfer/transfer-prefix.spec.ts) ·
[SSR tests](../../../tests/package/transfer/transfer-prefix.ssr.test.ts)

`ConfigProvider.theme.components.Transfer` applies six component
tokens, alias overrides, and global and component algorithms. Numeric
and string CSS sizes, zero and undefined values, and precedence of
configuration, semantic, and local styles are preserved. Internal
header padding follows the original rule and rounds up.
`fontHeight` is calculated as `Math.round(fontSize * lineHeight)`
regardless of the alias with that name. Checkbox, Input, Button, and
Pagination use their own component themes. The internal pagination's
CSS scope is restored, including default styling without an upstream
theme.

The theme reference covers 17 themes and 136 sets across eight
independent scopes. Basic lists are tested in all scopes. `oneWay`,
pagination, empty, and custom lists are tested in normal, RTL, and
priority scopes. The existing native remove button inherits the row's
font, while the original UMD retains the browser's `13.33px` size.
The raw measurements retain the original size, and comparisons check
native inheritance against the upstream item font. The native empty
state uses a regular simple Empty without `ant-empty-small`. The
reference retains the upstream fallback and a separate measurement
with explicit `locale.notFoundContent` matching the native fallback.
That measurement is used only for the empty section's natural height
when metrics are undefined. [UMD theme reference](../../../tests/browser/fixtures/ant-design-transfer-theme-reference.json)

Theme browser tests also check drafts, selection, focus, pages, keyed
rows, and move callback order during updates. In the original UMD,
switching a nested provider to `inherit:false` in the reference
replaces the input and loses the query and focus. The raw observation
is recorded separately. Svelte preserves the field and query. For CSS
comparisons, the reference also restores the same query and focus
through the public Input. [Browser theme tests](../../../tests/browser/transfer/transfer-theme.spec.ts)

Unit tests compare declarations with the UMD. SSR creates no browser
resources. [Unit tests](../../../src/lib/theme/theme-transfer-tokens-reference.test.ts) · [SSR tests](../../../tests/package/transfer/transfer-theme.ssr.test.ts)
