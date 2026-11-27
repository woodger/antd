# TreeSelect

TreeSelect selects values from a hierarchy. Checkbox state is
calculated across the full tree, including nodes hidden by filters.

```svelte
<script lang="ts">
  import { TreeSelect } from '@woodger/antd';
  const data = [{value:'docs',title:'Documents',children:[{value:'intro',title:'Introduction'}]}];
  let value = $state<string[]>([]);
</script>
<TreeSelect treeData={data} {value} treeCheckable treeDefaultExpandAll
  showSearch={{treeNodeFilterProp:'title'}} onChange={next => { value = next; }} />
```

A node has a unique string or numeric `value`, `title` or `label`,
`children`, and `disabled`, `disableCheckbox`, `checkable`,
`selectable`, and `isLeaf` flags. Internal identity uses `value` as in
upstream `fieldNames`. `key` is optional. Values must be unique after
`String(value)`. `title` and `label` accept strings, numbers, booleans,
`null`, Snippets, and nested arrays of these. Booleans and `null`
produce no text. An omitted panel title uses the Tree fallback.
`treeTitleRender` accepts a Snippet typed to the source record and
provides titles for the panel and selected values.

`fieldNames={{value:'code',label:'caption',children:'nodes'}}` uses a
different schema without preprocessing. Empty names use standard
fields. Without a label mapping, the first defined title or label
wins, including `null`. Generic `TreeSelectProps<ValueType, Data>`
infers `Data` from `treeData` without an index signature. `onSelect`,
`onDeselect`, and `filterTreeNode` receive a shallow copy of the source
record, and `treeTitleRender` receives the original. Nested payload
references are preserved. `loadData` gets the same custom fields
with computed key and state as in Tree. A custom `props` field stays
intact without the deprecated React wrapper.

`TreeSelect.TreeNode` declares nodes in a nested `children` Snippet.
It is also exported as `TreeSelectTreeNode`, with props type
`TreeSelectTreeNodeProps`. `TreeSelectNode` describes a data record.
`treeData` takes precedence over declarations, including an empty
array. Simple mode applies to `treeData`.

```svelte
<TreeSelect defaultValue={0} treeDefaultExpandAll treeIcon>
  <TreeSelect.TreeNode value="docs" title="Documents">
    <TreeSelect.TreeNode value={0} title="Introduction" icon="📄" />
  </TreeSelect.TreeNode>
</TreeSelect>
```

Declarations are collected before the field renders. A hidden
container and `template` elements provide the selected label and
expanded branches during SSR and track keyed list order, additions,
and removals. Declaration updates preserve field DOM, focus, and
refs. For custom payload in declarative nodes, use
`TreeSelectProps<ValueType, Data>` and `TreeSelectTreeNodeProps<Data>`.

A node's `icon` and `switcherIcon` accept content or a
`Snippet<[TreeEventNode<Data>]>`. They receive state and custom
fields as in Tree. The switcher also receives calculated `isLeaf`.
A local switcher overrides the shared renderer and loading icon.
`treeIcon` enables icon cells, with content from the node's `icon`.
As in the React 6.6.8 wrapper, a function in `treeIcon` acts as a flag.

A node's `className` sets its row class. Local `class` wins.
`style` is a CSS string. `data-*` and `aria-*` attributes apply to
the row, including its accessible name. `styles.popup.item` overrides
node styles. A reactive title Snippet keeps reading its context when
passed through callback labels. The reference uses a React component
with Context for this case. The comparison covers declarations,
data, aliases, renderers, order, loading, and updates.
[Node comparison](../../../tests/browser/tree-select/tree-select-nodes.spec.ts)

`treeDataSimpleMode` builds a tree from flat `id` and `pId` records.
An object configures field names and `rootPId`. The default
`rootPId=null` makes all nodes whose parent cannot be found
roots. Other values, including 0, are compared strictly. The
first occurrence of an ID sets its position, and a repeated ID
replaces the record. As upstream, simple mode always creates
canonical `children` regardless of `fieldNames.children`. Keep the
default child field name for this hierarchy. Source records and
children arrays are left intact. Readonly inputs are supported.

`value` and `defaultValue` accept a scalar, array, or
`{value,label?,halfChecked?}`. `null` clears, and `undefined` enables
local state. `value`, `open`, and `showSearch.searchValue` are
controlled through callbacks. The owner retains control of them.
When the owner rejects `onSearch`, the field restores `searchValue`.
`showAction={['focus']}` also opens on focus before `onFocus`.
An empty array and `['click']` retain ordinary pointer opening.
Changing `showAction` while focused does not open by itself.
`autoFocus` and `tabIndex` set field autofocus and tabindex.
Explicit native `autofocus` and `tabindex` take precedence. As in
upstream TreeSelect, `maxLength` leaves search input unrestricted.
Native `maxlength` sets the browser limit.

Clicking a readonly single control again closes the panel. Single
selection with search keeps it open. Multiple mode closes on a
click outside the input and stays open on the input itself. Prefix,
suffix, and selected label follow the same rules. Closing happens
after click callbacks. Clearing single closes the panel, while
multiple keeps it open. Touch uses the browser's mouse events.
Canceled touch and swipes do not toggle. With
`showAction={['focus']}`, the first press can report opening twice
as in React, first on focus and then on mousedown.
[Pointer API comparison](../../../tests/browser/tree-select/tree-select-pointer.spec.ts)

`onInputKeyDown` receives the input event. `onKeyDown`, `onKeyUp`,
`onFocus`, `onBlur`, `onMouseDown`, `onMouseEnter`, `onMouseLeave`,
and `onClick` apply to the control's DOM root. Native lowercase
handlers keep the input as `currentTarget`. Native `onkeydown`
runs first, then `onInputKeyDown`, internal handling, and root
`onKeyDown`. As upstream, `preventDefault` in `onInputKeyDown`
does not cancel selection. Use native `onkeydown` to cancel internal
handling. `stopPropagation` in the input hook stops the root handler
while allowing a supported key to open. Holding Enter selects once
until keyup or blur. Keyboard and outside-click dismissal are
deferred so the root key or blur callback receives the event first.
Enter and Space on clear trigger its click and bypass root
`onKeyDown`. Focus hooks receive actual focusin and focusout. The
popup portal has its own DOM event boundary. SSR skips autofocus,
callbacks, and timers. Hydration preserves focus on another
control. [Trigger API comparison](../../../tests/browser/tree-select/tree-select-trigger.spec.ts)

Space opens a readonly field with one `onOpenChange(true)`. In the
raw React 6.6.8 observation, one keydown fires two identical
callbacks before rerender. Svelte retains idempotent opening.
Native Escape cancels default behavior and bubbling. ArrowUp,
Left, and Right retain opening behavior for a closed field.
Enter ignores an active node removed from `treeData`. Missing
selected values can still be removed through tags.

`multiple` enables arrays. `treeCheckable` enables checkboxes and
multiple selection. `treeCheckStrictly` also enables both and forces
`labelInValue`. `treeCheckable` accepts `TreeSelectCheckableContent`:
booleans, text, numbers, bigint, Snippets, nested arrays and
iterables, and Promises. It uses JavaScript truthiness. Empty arrays
and iterables and any Snippet or Promise enable standard checkboxes.
`false`, `null`, `undefined`, the empty string, ±0, `NaN`, and `0n`
do not. The content is never rendered, called, iterated, or awaited.
`classNames` and `styles` receive the original value and reference,
preserving omission and explicit `undefined`. Display label types
are unchanged. Explicit `multiple=false` still allows truthy
`treeCheckable`. Ant Design's development warning is outside the
port. Svelte keeps root, editor, public methods, and focus when
switching modes. React may recreate the editor. With
`treeCheckStrictly` and falsy `treeCheckable`, Svelte retains the
existing internal checkbox and upstream omits it.
`TreeSelectProps<ValueType, Data>` preserves the concrete callback
value type. As upstream, the mode and supplied type must agree.

`onChange(value,labels,extra)` receives a scalar or array.
With `labelInValue` or strict mode, values are objects with `value`,
`label`, `halfChecked`, and `disabled`, and `labels=null`. Clearing
all returns `undefined` in single mode or `[]` in multiple mode.
Raw mode returns `labels=[]`. Extra includes `triggerValue`.
Deprecated `preValue`, `checked`, and `selected` are omitted.
`onSelect` and `onDeselect` receive `(value,node)` for a single node.
Clearing calls `onClear` and `onChange` without per-tag `onDeselect`.
Deprecated React getters `triggerNode` and `allCheckedNodes` and
`node.props` wrappers are outside the port.

In checkbox mode, upstream check propagation respects `disabled`,
`disableCheckbox`, and `checkable` boundaries.
`showCheckedStrategy` defaults to `SHOW_CHILD`. Named exports
`TREE_SELECT_SHOW_CHILD`, `TREE_SELECT_SHOW_PARENT`, and
`TREE_SELECT_SHOW_ALL` correspond to the React constants. They
are also available as `TreeSelect.SHOW_CHILD`,
`TreeSelect.SHOW_PARENT`, and `TreeSelect.SHOW_ALL`. The strategy
affects tags and `onChange` during propagation. Full checks
are stored separately. Unchecking a child or removing a tag
adjusts its parents. Without `treeCheckable`, the strategy is
`SHOW_ALL`, including independent strict mode. `halfChecked`
objects in strict values are omitted from tags but retained
in the callback until that value is explicitly checked.

Missing values survive `treeData` changes. The missing node's label
comes from the labeled value or local labeled state. A controlled
raw value without a label displays its value. An individual
disabled tag cannot be removed, while clear removes the whole set
as upstream.

`maxCount` limits multiple selection, including checkbox and
strict modes and missing values. An initial or controlled set
is not truncated. The Ant wrapper disables a nonzero limit
with explicit `SHOW_PARENT`, or with `SHOW_ALL` without
`treeCheckStrictly`, including plain multiple. In plain multiple
mode without an explicit strategy, the limit applies. Zero remains
active as upstream and blocks new values. Panel limits use the
full tree separately from raw disabled and state data. For
`SHOW_CHILD`, upstream estimates a parent using directly enabled
children. The final check counts display values after propagation.
A set above a nonzero limit is withheld. As upstream, `onSelect`
or `onDeselect` can report the attempt without `onChange`. Clear
stays available for an over-limit initial set. Limit and data
updates preserve query, caret, refs, focus, active IDs, and FormData.

UMD scenarios cover wrapper and rc-tree-select rules and
browser callback order. SSR renders without callbacks, timers,
or initial value truncation. Two upstream defects are recorded
separately: `maxCount` blocks changes to single selection, and
a parent's disabled cache stays stale for new children with the
same remaining count. Svelte ignores the single-mode limit and
recalculates limits on data changes. Public comparisons use a
single field without a limit and a freshly mounted tree with
the same final props.
[33 UMD scenarios](../../../tests/browser/fixtures/ant-design-tree-select-max-count-reference.json) · [Browser tests](../../../tests/browser/tree-select/tree-select-max-count.spec.ts) ·
[35 DOM-free SSR renders](../../../tests/browser/fixtures/ant-design-tree-select-max-count-ssr-reference.json) · [Package SSR tests](../../../tests/package/tree-select/tree-select-max-count.ssr.test.ts)

`maxTagTextLength` truncates only string and number labels of
multiple tags. The full label stays in the tooltip, callbacks,
and data. Arrays and Snippets are opaque. `maxTagCount` limits
visible tags while keeping all display values for FormData,
Backspace, clear, and check strategies. A number uses upstream
slice behavior. `NaN` retains all tags as in Svelte Select.
`maxTagCount="responsive"` uses the shared Select measurement
for input, summary, and custom tags. Summary takes no space
when all tags fit. Hiding a focused remove button moves focus
to the input and respects explicit external focus. Responsive
SSR tags stay hidden until measurement. Hydration preserves
DOM, focus, and form fields. As in the React reference, a closed
multiple control clears an unprocessed pre-hydration query.
An independent external draft remains intact.

`maxTagPlaceholder` accepts a literal, array, or Snippet with
omitted records `{value,label,halfChecked?,disabled?}`. Labels are
untruncated and get no synthetic key. `null` and `undefined`
choose `+ N ...`. `tagRender` receives `TreeSelectTagInfo`.
`label` is a bound Snippet, `value`, `index`, and `disabled` are tag
data, and `closable` and `onClose(event?)` control closing. The
summary has `isMaxTag=true` and omits `value`, `index`, and
`onClose`. The Ant wrapper enables the renderer through
`multiple` or `treeCheckable`. Strict mode alone keeps ordinary
tags. Custom mousedown toggles the popup. A `false` request is
deferred through MessageChannel to follow close and change
callbacks. Opening again or unmount cancels pending close.
Custom children can stop mousedown.

Tag tests cover browser, lifecycle, SSR, and hydration. Upstream
splits a Unicode pair, hides the whole list for `NaN`, and
reserves oversized summary space even when tags fit. Svelte
uses the established Select corrections. For the last case,
the public comparison changes only the unused placeholder
at the same 320px width. Existing native tooltips for literal
arrays and `treeTitleRender` are preserved, including accessible
remove names after selection changes.
[49 UMD scenarios](../../../tests/browser/fixtures/ant-design-tree-select-tags-reference.json) · [55 DOM-free SSR renders](../../../tests/browser/fixtures/ant-design-tree-select-tags-ssr-reference.json)
· [Browser tests](../../../tests/browser/tree-select/tree-select-tags.spec.ts) · [Native lifecycle](../../../tests/browser/tree-select/tree-select-tags-native.spec.ts) ·
[SSR tests](../../../tests/package/tree-select/tree-select-tags.ssr.test.ts) · [Hydration](../../../tests/browser/tree-select/tree-select-tags-hydration.spec.ts)

For a known node, `treeTitleRender` supplies labels in
`onChange` and `maxTagPlaceholder` even if the `labelInValue`
value already has a label. Without `labelInValue`, Snippets
are in the labels array. In `labelInValue` and strict mode,
they appear in value records, and the second `onChange` argument
is `null`. Missing nodes retain a supplied or previously resolved
label. `value`, `halfChecked`, `disabled`, and data sent to
`onSelect` and `onDeselect` are preserved.

A label binds the renderer and source record. After checking
`typeof label === 'function'`, retain and render it with
`{@render label()}`, including after TreeSelect unmount.
Content uses the render site's context. Creating a label
does not start its lifecycle. SSR includes `<head>` and IDs.
Hydration preserves DOM, focus, and nested field drafts.
The summary binds labels within its render without a nested
mount or extra DOM node.

Replacing or removing a renderer upstream leaves the old one
in the summary and next `onChange`. Svelte refreshes new labels
immediately, and saved Snippets stay bound to their earlier
renderer and record. [28 browser scenarios and two observations](../../../tests/browser/fixtures/ant-design-tree-select-labels-reference.json)
· [30 DOM-free SSR renders](../../../tests/browser/fixtures/ant-design-tree-select-labels-ssr-reference.json) · [Rendering returned labels](../../../tests/browser/tree-select/tree-select-labels.spec.ts)
· [SSR tests](../../../tests/package/tree-select/tree-select-labels.ssr.test.ts) · [Hydration](../../../tests/browser/tree-select/tree-select-labels-hydration.spec.ts)

`prefix` renders content before the field. `suffixIcon` replaces the
default icon, and `suffixIcon={null}` hides it. The default follows
loading and an open panel with search explicitly enabled. `suffix`
takes precedence over `suffixIcon`. `null` and `undefined` fall back
to `suffixIcon`. `suffix` accepts content or
`Snippet<[TreeSelectSuffixInfo]>` with `searchValue`, `open`, `focused`,
`showSearch`, and `loading`. The last two may be `undefined`, and
a `showSearch` object gives `true`. A supplied Snippet keeps its
wrapper even when empty.

`allowClear` accepts a boolean or an object with `clearIcon` and
`label`. `true` uses the default icon, while an object without an
icon uses `×`. The button defaults to a localized name. Clearing
calls `onClear`, `onChange`, and `onSearch('')` if there was a search
query. Clicking closes a single popup. Keyboard activation of
clear preserves visibility. `removeIcon` changes a regular tag's
remove content, and `null` uses `×`. `tagRender` supplies the entire
custom content.

`popupRender` accepts `Snippet<[Snippet]>`. Call
`{@render menu()}` within your Snippet to keep the tree or empty
state in the panel. Nested fields can receive focus. Clicking the
background keeps the panel and query. The panel boundary clears
outer FormItem binding and status and Space.Compact context.
Content mounts on first open and retains state between openings.
Escape also closes the panel with a replaced or empty menu. With
initial `open` or `defaultOpen`, Svelte renders a hidden panel in SSR
and moves that same DOM to `getPopupContainer` at hydration.

The comparisons cover slot order, precedence, callbacks, and
lifecycle in 29 UMD scenarios and 29 server renders. React 6.6.8
keeps an empty panel open after Escape and creates the open panel
DOM on the client. The separate Form.Item feedback icon remains
part of the Form port. [UMD reference](../../../tests/browser/fixtures/ant-design-tree-select-surface-reference.json) · [Upstream SSR](../../../tests/browser/fixtures/ant-design-tree-select-surface-ssr-reference.json)
· [Browser tests](../../../tests/browser/tree-select/tree-select-surface.spec.ts) · [SSR tests](../../../tests/package/tree-select/tree-select-surface.ssr.test.ts) ·
[Hydration](../../../tests/browser/tree-select/tree-select-surface-hydration.spec.ts)

`classNames` and `styles` accept a slot object or function with
`TreeSelectSemanticInfo<ValueType, Data>`. `info.props` contains
the original props and resolved `size`, `disabled`, `status`,
and `variant`. `open` reflects the owner's value. Styles use CSS
strings. Field slots include `root`, `prefix`, `input`, `suffix`,
`clear`, `content`, `placeholder`, `item`, `itemContent`, and
`itemRemove`. Tag slots apply to ordinary tags and the hidden
tag count. `tagRender` supplies its own markup.

A string `classNames.popup` sets `popup.root`. `rootClassName`
and `classNames.root` apply to field and panel. `popup.item`,
`popup.itemTitle`, and `popup.itemSwitcher` style the tree node,
its title, and its switcher. The panel receives `styles.root`,
then `styles.popup.root`. The field's layer is separate. Panel
`z-index` comes from `styles.popup.root` or the owner's context.
Numeric `popupMatchSelectWidth` overrides style `width`. The panel
defaults to field width. With `false`, it sizes to content with
field width as the minimum. The local prop takes precedence over
`ConfigProvider.popupMatchSelectWidth`. Styles can constrain width.
Changing an open panel's styles preserves DOM, focus, and nested
field drafts. [Owner context](../theme-context.md#layering-nested-panels)

`ConfigProvider.treeSelect` supplies `variant`, `classNames`,
`styles`, and `switcherIcon`. A nested object replaces the
nearest record in full and `{}` resets it. Slot classes combine
with local classes. A local CSS string in `styles.popup` replaces
the matching provider slot. Use provider `classNames` and
`styles` for styling. The record accepts `class` and `style` for
Ant Design 6.6.8 type compatibility.

`placeholder` accepts text, a number, array, or Snippet. A text
placeholder is also available via the native field attribute.
Local `switcherIcon` takes precedence over the provider.
`null` and `undefined` use the provider. `false` leaves an empty
switcher, and 0 renders. `treeLine.showLeafIcon` accepts a
boolean, content, or node-state Snippet. A branch shows the
loading indicator while loading. The owner sets classes inside
its Snippet.

24 UMD scenarios and 24 server renders record slots, style order,
panel size, configuration scope, and switchers.
[UMD reference](../../../tests/browser/fixtures/ant-design-tree-select-semantic-reference.json) · [Upstream SSR](../../../tests/browser/fixtures/ant-design-tree-select-semantic-ssr-reference.json) ·
[Browser tests](../../../tests/browser/tree-select/tree-select-semantic.spec.ts) · [SSR tests](../../../tests/package/tree-select/tree-select-semantic.ssr.test.ts)

`showSearch` defaults to `false` for single and `true` for multiple.
The object supports `searchValue`, `onSearch`,
`autoClearSearchValue`, `filterTreeNode`, and `treeNodeFilterProp`.
Deprecated top-level props with those names are removed. The
multiple default retains the Svelte contract and matches Ant
Design docs. Raw React 6.6.8 with `undefined` leaves the multiple
input readonly. Independent observations and a case with explicit
`true` are recorded separately.

The default filter prop is literal `value`, even with
`fieldNames.value='code'`. For a custom schema, set
`treeNodeFilterProp`. Case-insensitive search retains ancestors of
matches and all children of a matching parent. `filterTreeNode=false`
keeps the whole tree. A callback supplies a predicate. Checking a
filtered parent still uses the full tree. `autoClearSearchValue=true`
clears local search after selection, and the owner clears controlled
search. Automatic clearing does not call `onSearch`. Node loading is
disabled during search.

`tokenSeparators` accepts an array of delimiters or a function
returning an array of strings. As in the pinned TreeSelect,
successful tokenization clears search and defers closing. It
keeps selected values without `onChange`, `onSelect`, or
`onDeselect`. `maxCount` does not limit token processing. IME
defers tokenization until composition ends. Pasted line breaks
are preserved for relevant delimiters and functions.
`onSearch` runs when the query changes. Closing single also
clears search. A splitter function receives the empty string
on mount and after closing. Initial `open=true` uses the same
client search reset as React. SSR calls neither splitter nor
callbacks. A closed single control retains its native selection
label. A query retained by the owner returns on open. Raw React
keeps the query in a separate input beside the label. The
reference records and tests that display separately.
[Token API comparison](../../../tests/browser/tree-select/tree-select-token.spec.ts)

`loadData(node)`, `treeLoadedKeys` and `onTreeLoad`, and
`treeExpandedKeys` and `onTreeExpand` use Tree's logic. The
consumer adds children. `treeDefaultExpandAll` and
`treeDefaultExpandedKeys` set initial expansion. TreeSelect
stores panel expansion outside Tree. After load rejection,
an expanded branch can retry up to Tree's upstream limit.
There is no separate error callback or slot. A closed popup
starts no new loads. An existing Promise can finish and call
`onTreeLoad`. Results after unmount are ignored.

`treeExpandAction=false | 'click' | 'doubleClick'` enables title
expansion through the existing Tree and defaults to `false`.
In click mode, `onTreeExpand` precedes `onChange` and
`onSelect`. In multiple mode, a real double-click first performs
two ordinary selections, then expands on `dblclick`. Ctrl, Meta,
and Shift suppress title expansion. Selection is independent.
Explicit `isLeaf=true` prevents expansion. A disabled node can
expand through its title and cannot be selected, as upstream.
Switcher, checkbox, and keyboard keep their actions. The owner
accepts controlled expanded keys. Changing the action preserves
DOM, refs, input focus, and active IDs. Tests compare visible
tree and callback order. A separate raw observation records
two React `loadData` calls for one pending node. Svelte keeps
Tree's one-Promise-per-node guard and skips callbacks after
unmount. SSR starts no load or timers, even with an initially
open shell. [28 UMD scenarios](../../../tests/browser/fixtures/ant-design-tree-select-expand-action-reference.json) · [Browser tests](../../../tests/browser/tree-select/tree-select-expand-action.spec.ts)
· [SSR tests](../../../tests/package/tree-select/tree-select-expand-action.ssr.test.ts)

The native combobox retains focus during panel actions. Arrow
keys navigate and expand through Tree's keyboard engine. Enter
selects the active node. Escape and Tab close the popup.
Backspace removes the last available tag in empty search.
Single closes after selection and multiple stays open.
`listHeight` bounds the tree viewport, defaulting to 256px.
`onPopupScroll` receives viewport scroll events. `virtual`
inherits `ConfigProvider.virtual` and defaults on.
`popupMatchSelectWidth={false}` keeps all rows in the DOM.
`listItemHeight` sets the initial estimate, which defaults to
`controlHeightSM + paddingXXS`. A zero estimate disables
virtualization and `listHeight={0}` removes the height limit.
`listItemScrollOffset` adds space when moving to the active
node. Scroll preserves the active key. `aria-activedescendant`
points to the node while its row is mounted. Pointer movement
on a row clears the active keyboard node as in rc-tree.

`bind:nativeElement` and `bind:inputElement` expose the DOM.
`bind:this` provides `TreeSelectRef` with `focus(options)`,
`blur()`, and `scrollTo(config)`. `TreeScrollConfig` accepts
pixels, coordinates, or a key or index with `align` and
`offset`. It is safe to call with an open empty panel or a
missing key. Calling with a closed panel leaves the position
unchanged. `autoExpand` adds the target key to the inner
tree's local expansion until the first user change to
`expandedKeys`, if expansion keys are omitted in props. The
comparison covers window bounds, width, row measurement,
scroll, search, and reopening. [React 6.6.8 comparison](../../../tests/browser/tree-select/tree-select-virtual.spec.ts)

Inherited `showScrollBar` accepts `true`, `false`, and
`'optional'`. It leaves scrolling unchanged because the
pinned rc-tree-select does not pass it to the inner Tree.
The scrollbar still appears on interaction and hides after
idle. It is absent without overflow or with `virtual=false`.
[React and Select comparison](../../../tests/browser/tree/tree-scrollbar.spec.ts)

It supports placement, size, status, variant, `treeLine`,
`treeIcon`, `switcherIcon`, `notFoundContent`, loading, RTL,
themes, Compact, and ConfigProvider and Form disabled state.

`name` and FormItem create hidden inputs with raw values for
native FormData. The Form model stores raw scalars and arrays
and supports required validation, submit, and reset. TreeSelect
keeps the object contract for `labelInValue`. Form v1's general
object store remains pending. SSR starts no `loadData`, popover,
or browser APIs.

The upstream theme combines `components.Select` and
`components.TreeSelect` in the source order. TreeSelect aliases
can affect the field too. Select styles tags, arrow, clear,
and focus. TreeSelect styles node metrics, spacing, colors,
and panel checkboxes. `components.Tree` leaves TreeSelect's
internal tree independent. Tokens are available during SSR.
Theme updates preserve DOM, search, selection, focus, raw
FormData, and open panel position. Upstream compact nodes are
21px tall. Native-only themes are retained.

`getPopupContainer` receives the actual root, whether
`.ant-select` or a registered `components.root`. The local
function overrides `ConfigProvider.getPopupContainer`. `undefined` inherits the provider. It is skipped on the
server and before first open. Moving to an HTMLElement or
ShadowRoot retains Select and TreeSelect tokens, search,
keyboard behavior, lazy loading, and native FormData. The
upstream gap to the field is 4px. A new function returning
the same container preserves panel DOM, focus, and selection.
Consumers supply ShadowRoot styles. TreeSelect and Cascader
have 40 official UMD scenarios in `?fixture=choice-container`.
[Container comparison](../../../tests/browser/popup/choice-container.spec.ts)

`components.input` replaces the editor inside the default
selector. It preserves selected label, tags, prefix and suffix,
clear, and Form feedback. React components, tags, and elements
in `components` map to a Svelte Snippet. An object
`{render, props}` also supplies custom DOM attributes. They
override generated attributes, including value, class and
style, readonly, disabled state, and ARIA. Custom input
callbacks run first, and internal callbacks run afterward
even with `preventDefault`. The TreeSelect's native
`onkeydown` can still cancel built-in handling.

```svelte
<script lang="ts">
  import { TreeSelect, type TreeSelectInputContext } from '@woodger/antd';
  let editor = $state<HTMLInputElement | HTMLTextAreaElement>();
</script>

{#snippet query({ attributes, register }: TreeSelectInputContext<HTMLTextAreaElement>)}
  <textarea {...attributes} {@attach register}></textarea>
{/snippet}
<TreeSelect treeData={[{ value: 'a', title: 'Alpha' }]} showSearch
  components={{ input: { render: query, props: { rows: 2 } } }} bind:inputElement={editor} />
```

A direct textarea retains arrow navigation while closed. A composite
ref follows its original keyboard path. A multiple editor measures
its text to update width. Custom `style` replaces generated style in
full. Responsive tags account for the complete custom editor,
including its wrapper and neighboring Snippet elements, and react
to width changes. On close, multiple mode hides the query unless
`autoClearSearchValue` is false. A controlled owner retains its own
query. `props.value=undefined` leaves the editor uncontrolled, while
a fixed value overrides search. During hydration, the custom
editor's controlled value applies to existing DOM as in React,
preserving focus and refs.

`components.root` replaces the entire selector. Default labels,
tags, editor, affixes, and clear are omitted, and `components.input`
is unused. The root toggles on click instead of selector mousedown.
Its generated callbacks run before custom ones. The renderer owns
content and DOM attributes. The generated ID, class, style, tab
index, disabled state, and combobox ARIA are not assigned. TreeSelect
disabled state controls the popup. The custom DOM receives its
own disabled state through props.

```svelte
<script lang="ts">
  import { TreeSelect, type TreeSelectRootContext } from '@woodger/antd';
</script>

{#snippet response({ attributes, register }: TreeSelectRootContext<HTMLButtonElement>)}
  <button {...attributes} {@attach register}>Select a node</button>
{/snippet}
<TreeSelect treeData={[{ value: 'a', title: 'Alpha' }]}
  components={{ root: { render: response, props: { type: 'button', class: 'my-trigger' } } }} />
```

`register(node)` returns attachment cleanup. A composite root
registers `{nativeElement, focus?, blur?}`. A composite input uses
`{inputElement, nativeElement?, focus?, blur?}`. The input's native
element can be a wrapper, and `inputElement` points to the editor.
Replacing a registration prevents old cleanup from clearing a
new ref. Focus and blur use composite methods. The popup anchors
to the actual root. For a composite Svelte component, attributes
follow its public props. For example, Input's `class` and `style`
apply to its root. If a composite root uses Input with its own
text, store it in adapter state and use `bind:value`. This retains
drafts when dynamic spread attributes update and keeps the selected
TreeSelect value separate.

Ordinary bindings remain `HTMLDivElement` and `HTMLInputElement`.
The extra `TreeSelectProps<ValueType, Data, RootElement, EditorElement>`
parameters describe custom DOM. Bindings use
`RootElement | HTMLDivElement` and
`EditorElement | HTMLInputElement`, since removing a slot restores
the default element. Custom root creates no inner `inputElement`.
Renderers inherit Form status and feedback without registering a
second successful control. Required and help ARIA reach custom root.
Native FormData still contains raw selected values. Native Input
reflects error status in `aria-invalid`. Form keeps synchronous SSR
help and existing IDs like `choice-help`, where upstream uses
`choice_help`.

The native input connects to the existing Tree and its ARIA IDs.
Focus, blur, and input remain DOM events. `preventDefault` leaves
`defaultPrevented` unchanged on a noncancelable event, unlike React
SyntheticEvent. Removing an opaque composite root can deliver
blur before DOM detachment, when React has already cleared synthetic
callbacks. The raw observations are recorded separately. Removing
a focused editor can synchronously deliver native blur before DOM
detachment. No callbacks follow completed unmount. Registering the
actual editor also preserves safe composite measurement. A
multiple-mode upstream ref without `.style` throws TypeError.

With `components.input` and `maxTagCount="responsive"` in multiple
mode, suffix follows upstream Overflow. It can become absolute
and shrink around a fragment while preserving control height,
overflow, hit targets, and tag order. The popup keeps its previous
anchor until a size change, window resize, or ancestor scroll.
Container movement uses the same coordinate system, including RTL.
The layout and container scenarios use independent React references
in standards mode. Five more regressions cover static renderers,
summary history, and a `will-change: transform` container.
[15 layout scenarios](../../../tests/browser/tree-select/tree-select-suffix-layout.spec.ts) · [Four container scenarios](../../../tests/browser/tree-select/tree-select-suffix-container.spec.ts)
· [Five regressions](../../../tests/browser/tree-select/tree-select-suffix-layout-edges.spec.ts)

The ordinary native responsive control keeps its existing flow
algorithm. SSR retains hidden measuring tags where upstream
Overflow is empty. The native popup keeps its fixed portal
contract. Strict hydration checks query, selection, DOM identity,
and observer and frame cleanup. [Strict hydration](../../../tests/browser/tree-select/tree-select-suffix-layout-hydration.spec.ts) ·
[Root](../../../tests/browser/tree-select/tree-select-root.spec.ts) · [Input](../../../tests/browser/tree-select/tree-select-input.spec.ts) · [Form](../../../tests/browser/tree-select/tree-select-components-form.spec.ts)

Inherited `onPopupVisibleChange`, `popupStyle`,
`choiceTransitionName`, and `direction` follow Ant Design 6.6.8.
The wrapper overrides the callback and style, current Overflow
leaves choice transition unused, and ConfigProvider sets RTL and
default placement. Use `onOpenChange` for opening and
`styles.popup.root` for styling. Original prop values and presence
remain visible in `classNames` and `styles` callbacks, including
live replacements, empty values, and `undefined`. Custom root
semantic callbacks also run during SSR, and custom root attributes
and styles are retained.

HTML `dir` follows the native contract. The provider supplies
`dir` to the default root, explicit native `dir` goes to the
editor, and custom slot `dir` is preserved. Browser and SSR
tests compare an independent React reference and explicitly
account for the existing difference in HTML direction ownership.
Strict hydration retains editor, query, caret, popup, and public
refs across prop changes. [Browser tests](../../../tests/browser/tree-select/tree-select-inert-api.spec.ts) · [SSR tests](../../../tests/package/tree-select/tree-select-inert-api.ssr.test.ts)
· [Strict hydration](../../../tests/browser/tree-select/tree-select-inert-api-hydration.spec.ts)

`popupAlign` shallowly overrides the selected placement.
`offset`, `targetOffset`, and `overflow` replace entire fields.
`builtinPlacements` replaces the full default map, including
an explicitly empty object. A missing entry uses upstream
centering. `TreeSelectPopupAlign` accepts points, numeric and
percentage offsets, overflow flags, `dynamicInset`, and
`htmlRegion`. Percentage offset is relative to the popup and
targetOffset to the control. `useCssRight`, `useCssBottom`,
`useCssTransform`, and `ignoreShake` retain their upstream no-op
behavior.

An open popup retains computed alignment until placement,
control or popup size, window size, or ancestor scroll changes.
Replacing the map alone leaves coordinates intact.
Updating `popupAlign` recalculates immediately only when the
selected entry is absent. The same applies when adding these
props for the first time while open. Flip history persists
across custom root replacement and resets on close. Semantic
callbacks receive the original prop objects.

With alignment props, the native popup retains its fixed
top layer and DOM parent. Upstream's absolute CSS coordinate
frame is projected to native physical coordinates, accounting
for border, margin, scale, transforms, and ShadowRoot.
Container frame changes are handled separately from alignment
recalculation. The ordinary multiple control keeps native
editor and tag flow. A separate upstream run with the same
publicly set control height checks the related popup alignment.
Native public ref methods retain identity on prop updates.
Upstream recreates them. Root and popup are compared through
actual DOM refs. Local `htmlRegion` is supported.
`ConfigProvider.popupOverflow` chooses the default map region.
Custom `builtinPlacements`, including `{}`, replaces the map,
and local `popupAlign.htmlRegion` takes precedence.

Tests check an independent React reference, geometry, query,
caret, refs, and cleanup. [35 browser scenarios](../../../tests/browser/tree-select/tree-select-align.spec.ts) ·
[Two CSS frame and root changes](../../../tests/browser/tree-select/tree-select-align-frame.spec.ts) ·
[DOM-free SSR](../../../tests/package/tree-select/tree-select-align.ssr.test.ts) · [Strict hydration](../../../tests/browser/tree-select/tree-select-align-hydration.spec.ts)

`animation` and `transitionName` control upstream panel
transitions. A nonempty `animation` selects
`${prefixCls}-dropdown-${animation}` and takes precedence over
`transitionName`. `transitionName=undefined` uses
`${ConfigProvider.prefixCls}-slide-up`. An empty string turns
off named transition. Local dropdown and shared motion
namespaces are independent. The consumer supplies CSS for a
custom name. The `tree-select-popup-motion` recipe ports 110
rules and eight slide and move keyframes from the pinned
bundle, scoped to TreeSelect popup and leaving adjacent
Selects intact. Canonical CSS is in `styles.css`.
`tree-select-popup-motion-prefix` generates a custom namespace
template without new canonical SSR head scopes.

The panel runs appear, enter, and leave with prepare, start,
and active phases, keeping DOM after exit. Reopening aborts
leave and preserves drafts and refs. `animationend` and
`transitionend` finish only the element's active phase.
The effect name is not filtered, and descendant events are
ignored. CSSMotion retains the rendered active frame until
the next step is ready even when internal status completed.
The alignment cache recalculates in prepare and after motion.
Scroll and resize during transition skip ordinary alignment.
Replacing a custom root retains popup, CSS clock, and
previous coordinates until the next upstream alignment trigger.

Global `theme.token.motion=false` at opening leaves only prepare.
A live name or global motion change leaves an already running
phase in progress. Component `motion=false` reduces CSS
duration to zero and retains upstream steps and end handling.
There is no separate JavaScript deadline or reduced-motion
completion. A name without matching CSS can remain active
until its own end event.

Svelte keeps the fixed top layer. CSS animations use actual
browser clocks. Projected transform transitions expose a
real WAAPI Animation, distinct from the upstream CSSTransition.
Phase completion reaches the controller without a synthetic DOM
`transitionend`. Without alignment props and
`ConfigProvider.popupOverflow`, the existing native viewport
width and positioning limits apply. Explicit `popupAlign`,
`builtinPlacements`, or `popupOverflow` enables upstream
overflow rules. A closed hidden popup releases its position
frame without waiting for a canceled CSS end and stays
closed when the control returns to view.

Existing Svelte refs and opaque Snippets stay live. Disabling
global motion preserves the editor, and a closed custom panel
receives reactive updates instead of React.memo caching.
Separate upstream runs with public settings check these
boundaries and retain the original raw snapshots. Tests
compare the independent React reference, phases, geometry,
callbacks, identity, and cleanup. [Browser tests](../../../tests/browser/tree-select/tree-select-motion.spec.ts) ·
[Root replacement](../../../tests/browser/tree-select/tree-select-motion-root-swap.spec.ts) · [Leave completion before activation](../../../tests/browser/tree-select/tree-select-motion-leave.spec.ts)
· [Hide and reopen](../../../tests/browser/tree-select/tree-select-motion-visibility.spec.ts) · [DOM-free SSR](../../../tests/package/tree-select/tree-select-motion.ssr.test.ts) ·
[Strict hydration](../../../tests/browser/tree-select/tree-select-motion-hydration.spec.ts)

Ant Design excludes `treeMotion` from public TreeSelect and
passes `null` to the nested tree. Panel list and collapse motion
are disabled as upstream. Private `getInputElement` and
`getRawInputElement` and deprecated React extras are outside
the public port. Set the popup class through
`classNames.popup.root`. `popupClassName` is removed.

`prefixCls` sets local classes for the Select control, tags,
and TreeSelect popup. An empty value inherits
`ConfigProvider.prefixCls`. Internal Select variables follow
the shared namespace, and canonical token names persist.
The shared native Tree adapter retains internal `ant-tree`
classes and generated IDs. Prefix changes preserve search,
selection, refs, focus, form values, and the open tree.
Browser and SSR tests check 26 UMD configurations in normal,
nested, and reset scopes. [26 UMD configurations](../../../tests/browser/fixtures/ant-design-tree-select-prefix-reference.json)
· [Browser tests](../../../tests/browser/tree-select/tree-select-prefix.spec.ts) · [SSR tests](../../../tests/package/tree-select/tree-select-prefix.ssr.test.ts)

In Ant Design 6.6.8, a local prefix exposes a style hook and
nested tree mismatch. With `prefixCls="choices"`, styles target
`choices` but rc-tree-select produces `choices-tree`. In the
recorded case, five rows occupy 110px instead of 140px and
lose their background. Raw measurements are separate from a
public comparison without the local override under the same
ConfigProvider. Only tree and nodes use that comparison.
Control and popup use raw measurements. Its classes differ,
so the comparison checks styling while preserving the markup
difference. Svelte retains the native Tree adapter and styling
under a local prefix.

The data scenarios compare aliases, simple topology, search
and check strategies, literal labels, and data, schema, and
mode updates with the unmodified UMD. The independent SSR
reference runs without DOM or timers. Two upstream defects
are recorded separately: simple mode appends into the input
children array, and the raw renderer first receives a
labeled value instead of a data node. Svelte preserves the
input array and gives the renderer the complete record and payload.
[32 data scenarios](../../../tests/browser/fixtures/ant-design-tree-select-data-reference.json) · [SSR reference](../../../tests/browser/fixtures/ant-design-tree-select-data-ssr-reference.json) ·
[Browser tests](../../../tests/browser/tree-select/tree-select-data.spec.ts) · [Native lifecycle](../../../tests/browser/tree-select/tree-select-data-native.spec.ts) ·
[SSR tests](../../../tests/package/tree-select/tree-select-data.ssr.test.ts)
