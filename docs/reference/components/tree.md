# Tree

Tree displays hierarchical data with expansion, selection, and checking.

```svelte
<script lang="ts">
  import { Tree, type TreeKey, type TreeCheckedKeys } from '@woodger/antd';
  const nodes = [{key:'docs',title:'Documents',children:[{key:'intro',title:'Introduction'}]}];
  let expanded = $state<TreeKey[]>(['docs']);
  let checked = $state<TreeKey[] | TreeCheckedKeys>([]);
</script>
<Tree treeData={nodes} aria-label="Documents" checkable expandedKeys={expanded}
  checkedKeys={checked} onExpand={keys => { expanded = keys; }}
  onCheck={keys => { checked = keys; }} />
```

`treeData` is an array of nodes with a stable unique string, number,
or bigint `key`, a `title` (text, number, empty content, array, or
Snippet), and `children`. Keys must stay unique after `String(key)`,
as in the upstream entity index. Nodes support `disabled`,
`disableCheckbox`, `checkable`, `selectable`, `isLeaf`, `icon`, and
local `class` and `style`. `expandedKeys`, `selectedKeys`,
`checkedKeys`, and `loadedKeys` are controlled. Their default props
initialize local state. The owner can reject a callback. Assign new
arrays for keys and `treeData`, following the upstream controlled API.

`defaultExpandParent=true` expands ancestors of the initial expanded
keys up to a disabled boundary. `autoExpandParent` defaults to
`false`. `true` repeats ancestor expansion on controlled key changes.
Turn it off to allow an ancestor to collapse while retaining a
descendant key. `defaultExpandAll` applies only at initialization to
nodes with children. Data arriving later leaves this initial set intact.

Row selection is independent of the checkbox. `multiple` toggles keys
individually without requiring Ctrl or adding range selection.
`selectable=false` directs title clicks to checking. A node's
`selectable` overrides the tree setting. In normal checkable mode,
checks propagate down and up. `disabled`, `disableCheckbox`, and
`checkable=false` stop propagation. Disabled descendants do not
prevent a full check on an enabled ancestor. Unchecking uses the
upstream fill and clean algorithm. Children added to a checked parent
become checked. `checkStrictly=true` breaks these links and has
`onCheck` return `{checked,halfChecked}`. Otherwise, `onCheck` returns
an array with `info.halfCheckedKeys` and `checkedNodesPositions`.
In strict mode, `checkedKeys` also accepts the object with `halfChecked`.

`onExpand(keys,{expanded,node,nativeEvent})`,
`onSelect(keys,{event,selected,node,selectedNodes,nativeEvent})`, and
`onCheck(keys,{event,checked,node,checkedNodes,...})` remain distinct
events. The node includes source data, `pos`, and `expanded`,
`selected`, `checked`, `halfChecked`, `loaded`, `loading`, and
`active` flags. Mouse callbacks include a native event. Keyboard
callbacks follow rc-tree's internal path and can omit `nativeEvent`.
`onClick`, `onDoubleClick`, `onRightClick`, and `onActiveChange` are
also supported. Callback node state is the snapshot before the action.

`expandAction` enables title expansion. It defaults to `false` and
accepts `'click'` or `'doubleClick'`. Ctrl, Meta, and Shift retain
selection without expanding. With click expansion, `onExpand`
precedes `onClick` and subsequent `onSelect` or `onCheck`. Node
flags remain the before-action snapshot even when a callback
updates controlled selection synchronously. A title can collapse a
pending branch. The existing pointer switcher waits for loading.
The title action checks the original `isLeaf`. A node without children
keeps expanded keys to show children when data arrives, and handles
the action during search. Changing `expandAction` preserves DOM,
selected keys, and external drafts, focus, and selection.
[22 upstream cases](../../../tests/browser/fixtures/ant-design-tree-expand-action-reference.json) · [Comparison with completed transitions](../../../tests/browser/fixtures/ant-design-tree-expand-action-settled-reference.json)
· [Browser tests](../../../tests/browser/tree/tree-expand-action.spec.ts) · [SSR tests](../../../tests/package/tree/tree-expand-action.ssr.test.ts)

In rc-tree 1.4.0, a rapid double click with `expandAction='click'` can
collapse the node with only the first `onExpand(expanded=true)`.
The preliminary key update bypasses the `listChanging` guard.
The `click-double` case retains the raw observation. Svelte reports
each actual transition, as upstream does for two completed clicks.
Full list motion remains outside this comparison.

`loadData(node)` returns a `PromiseLike`. The consumer adds children
to `treeData`. Loading is deduplicated by key. The pointer switcher
waits for completion, while the keyboard can collapse a pending
branch. `onLoad(keys,{event:'load',node})` runs before local
`loadedKeys` updates. The owner accepts new controlled `loadedKeys`.
Loading also starts for an initially expanded, visible, unloaded
branch. A node with children does not load again. `isLeaf=true`
prevents loading. `isLeaf=false` retains the switcher even on an
empty loaded branch. Rejection clears loading and collapses the
uncontrolled branch without `onLoad`. Expanding again allows retry.
After 10 failures, loading stops and the key is marked loaded
without a successful `onLoad`. As upstream, the consumer handles
errors in `loadData`, with no separate `onError` or public error
state. Results after unmount leave state and callbacks untouched.

Keyboard navigation uses one Tab stop on `role=tree` and
`aria-activedescendant`. Up and Down cycle visible rows. Home and End
move to the endpoints. Left collapses or moves to the parent.
Right expands or moves to the first child. These directions stay
the same in RTL as in rc-tree. Enter expands a branch or selects
or checks a leaf once. Space toggles a check, or selection when
checkable is off. Disabled rows remain navigable. Node disabled
state blocks selection and checking, while its pointer switcher
can expand as upstream. Global disabled state blocks keyboard
handling. Native buttons use `tabindex=-1`. Treeitem and checkbox
roles and level, position, and set size describe the logical
tree. `bind:nativeElement` gives the root. `bind:this` provides
`focus(options)`, `blur()`, and `scrollTo(config)`.

Tree supports `blockNode`, `showLine`, `showLine={{showLeafIcon:true}}`,
`showIcon`, `icon`, `switcherIcon`, `switcherLoadingIcon`,
`titleRender`, and `filterTreeNode`. Icon and title Snippets receive
the node. `filterTreeNode` highlights matching nodes and keeps them
in the tree. Russian and English switcher labels use `locale.tree`.
Theme, compact mode, RTL, and ConfigProvider and Form disabled
state inherit their existing contexts. `height` bounds the viewport
and enables a virtual window. Without height, or with `height=0`,
all expanded rows render without a height limit, as upstream.
`virtual=false` keeps native scrolling with all rows. `undefined`
inherits `ConfigProvider.virtual`. Virtualization defaults on for
Tree and off for Listy. SSR uses an initial window estimate
without DOM measurement, loading, or timers.

The row estimate follows Tree tokens:
`paddingXS/2 + (titleHeight || controlHeightSM)`. `itemHeight`
overrides it, and `itemHeight=0` disables the virtual window.
After mount, actual rows are measured with margins and cached
by key until unmount. Window boundaries and overscan follow
virtual-list 1.5.1. `scrollWidth` enables horizontal scrolling
even when data fits. Wheel, Shift+wheel, touch, dragging, and
scrollbar clicks support both axes and RTL.

```svelte
<script lang="ts">
  import { Tree, type TreeRef } from '@woodger/antd';

  const nodes = Array.from({ length: 100 }, (_, key) => ({ key, title: `Node ${key}` }));
  let tree = $state<TreeRef>();
</script>

<Tree treeData={nodes} height={240} bind:this={tree} aria-label="Nodes" />
<button onclick={() => tree?.scrollTo({ key: 80, align: 'top', offset: 8 })}>Show node</button>
```

`scrollTo` accepts a number, `{top,left}`, or a key or index with
`align='top'/'bottom'/'auto'`. `left` is a nonnegative logical
position in RTL as well. `offset` can be a number or a function
`({getSize,align}) => number`. `getSize(startKey,endKey?)` reads
measured or estimated top and bottom. An unknown end key gives
`bottom=undefined`. `NaN` and `Infinity` offsets become 0.
Measurement and alignment repeat up to ten passes. A later request
cancels the earlier one. An unknown key leaves position intact.
`null` and `undefined` show the scrollbar. `autoExpand` on a key
request adds only that key to uncontrolled `expandedKeys`, with no
ancestor expansion or `onExpand`. `itemScrollOffset` sets the
active node's autoscroll offset. `onScroll` or native `onscroll`
receives the holder event, and the root ref stays in place.
DirectoryTree exposes the same methods. Initially expanded nodes
load when they enter the mounted window. Results after unmount
are ignored.

The raw observations record six upstream issues: stale estimates
when `itemHeight` or theme changes, losing active key 0, an
`aria-activedescendant` that points outside the DOM, local
`virtual=undefined` overriding global `false`, missing
`direction` in rc-tree NodeList, and negative offset when
`scrollWidth` is smaller than the viewport. Svelte clamps offset
to zero, updates estimates without cloning data, and preserves
key 0, valid ARIA targets, inheritance, and direction on both axes.
[28 upstream browser cases, 12 SSR cases, and six observations](../../../tests/browser/fixtures/ant-design-tree-virtual-reference.json)
· [Upstream browser tests](../../../tests/browser/tree/tree-virtual.spec.ts) · [Svelte browser tests](../../../tests/browser/tree/tree-virtual-native.spec.ts)
· [SSR tests](../../../tests/package/tree/tree-virtual.ssr.test.ts)

Tree and DirectoryTree infer record types from `treeData`.
`fieldNames={{ key: 'id', title: 'caption', children: 'items' }}`
sets field names. Empty names use `key`, `title`, and `children`.
Fields with the old names remain independent of the chosen
schema. The setting applies to expansion, leaf state, check
propagation, lazy loading, renderers, and DirectoryTree ranges.

```svelte
<script lang="ts">
  import { Tree } from '@woodger/antd';

  interface Entry {
    id: number;
    caption: string;
    priority: number;
    items?: Entry[];
  }
  const entries: Entry[] = [{ id: 0, caption: 'Document', priority: 2 }];
</script>

<Tree treeData={entries} fieldNames={{ key: 'id', title: 'caption', children: 'items' }}
  onSelect={(_keys, info) => console.log(info.node.priority, info.selectedNodes)} />
```

`TreeProps<Data>`, `DirectoryTreeProps<Data>`, `TreeEventNode<Data>`,
and `TreeCheckInfo<Data>` preserve the payload type, including
discriminated unions. `TreeFieldDataNode<Payload, ChildName>`
helps declare recursive records with shared flags and Snippets.
`info.node` includes original fields, with canonical key and
flags overridden by Tree state. `selectedNodes`, `checkedNodes`,
and checked positions retain original objects, including raw keys.
`titleRender` receives the original record. As upstream, a
Snippet in the title field overrides the shared renderer.
With `titleRender`, the title field can contain any payload that
the Snippet reads.

New `treeData` or `fieldNames` references update the index
without replacing the component. Updating only `fieldNames` also
refreshes titles and child fields. In rc-tree 1.4.0, old flattened
entities remain cached until `treeData` is replaced. The raw
observation and a public upstream comparison updating both props
are retained. Existing keys, DOM and refs, and active IDs are
preserved. Tests cover aliases, original objects, strict checks
and propagation, lazy load, controlled keys, Snippets, DirectoryTree,
RTL and prefix, and schema changes.
[27 raw UMD scenarios and an observation](../../../tests/browser/fixtures/ant-design-tree-fields-reference.json) ·
[Browser tests](../../../tests/browser/tree/tree-fields.spec.ts) · [SSR tests](../../../tests/package/tree/tree-fields.ssr.test.ts) · [Typed records](../../../tests/browser/fixtures/TreeGenericFields.svelte)

`TreeDataNode.switcherIcon` sets the switcher for a node, including a
leaf, and takes precedence over the shared renderer, lines, and
loading icon. The shared `switcherIcon` applies to branches after
loading. `showLine.showLeafIcon` also accepts a Snippet. Renderers
receive calculated `isLeaf`. An empty Snippet leaves the native
switcher without content. Snippet classes and content are kept
without cloning React elements. `onMouseEnter` and `onMouseLeave`
receive `{event,node}` when entering or leaving row content,
including disabled rows. Hovering the switcher is outside the row
content. The event node keeps the original `isLeaf` and current
selected, expanded, and loading flags. The renderer's computed
flag does not replace source data. After unmount, hover callbacks
stay uncalled even if the consumer retains the removed DOM node
and dispatches an event to it.

Tests cover precedence, text, elements, empty content, switcher
centering, pending load, hover, RTL and prefix, and DirectoryTree.
Native button reset keeps upstream `text-align: center` for the
switcher. Row content retains inherited alignment.
[14 raw UMD scenarios](../../../tests/browser/fixtures/ant-design-tree-node-renderers-reference.json) · [Browser tests](../../../tests/browser/tree/tree-node-renderers.spec.ts)
· [SSR tests](../../../tests/package/tree/tree-node-renderers.ssr.test.ts)

`prefixCls` sets the namespace for the tree, nodes, checkbox,
switcher, and lines. The empty string inherits
`ConfigProvider.prefixCls`. Canonical Tree tokens and generated
IDs remain. The shared Row selector is independent of the local
prefix. The `tree-prefix` template reproduces 98 upstream rules
scoped to root, RTL, and lines. Raw measurements are separate from
public root-style and readonly selection cases. The existing
native Tree preserves supplied selection with `selectable=false`.
React drops it on initial render. A separate public case disables
selection per node. Prefix changes preserve DOM, refs, active
descendant, focus, checked and selected state, and pending load.
Internal TreeSelect still uses the canonical Tree namespace of
its CSS adapter. Its own prefix API is tracked separately.
[Raw measurements](../../../tests/browser/fixtures/ant-design-tree-prefix-reference.json)

`ConfigProvider.theme.components.Tree` uses the shared component
theme for title, switcher, and indent metrics, hover and selected
colors, alias overrides, global and component algorithms, and a
custom `cssVar` prefix. Local CSS variables and `style` keep
precedence. DirectoryTree uses the same settings plus
`directoryNodeSelectedBg` and `directoryNodeSelectedColor`.
TreeSelect's internal tree uses the Select and TreeSelect theme
independently of `components.Tree`. The UMD reference includes a
case with conflicting settings for all three components.

In the retained native contract, `Tree.style` styles the outer
root. In React it applies to the inner `.ant-tree-list`. The
reference keeps measurements of both layers. Visible content
comparisons cover 14 themes and 112 CSS measurement sets, including
checkbox, disabled, selected, and active nodes, RTL, and nested,
reset, and sibling scopes. [UMD reference](../../../tests/browser/fixtures/ant-design-tree-theme-reference.json)

Browser tests also check preservation of DOM, focus, active
descendant, checks, and pending load on token updates. SSR tests
ensure loading and browser resources stay inactive. Unit tests
compare declarations with the official UMD.
[Browser tests](../../../tests/browser/tree/tree-theme.spec.ts) · [SSR tests](../../../tests/package/tree/tree-theme.ssr.test.ts) · [Unit tests](../../../src/lib/theme/theme-tree-tokens-reference.test.ts)

`classNames` and `styles` support five slots: `root`, `item`,
`itemIcon`, `itemTitle`, and `itemSwitcher`. They accept an object
or `({props}) => slots`. Props retain data types and native inputs.
Ant wrapper defaults are provided for `showIcon`, `blockNode`,
`checkable`, `selectable`, and `disabled`. Other omitted inputs stay
omitted. `ConfigProvider.tree` accepts `class`, `style`, and the
same semantic slots. An omitted record inherits. Any explicit
object, including `{}`, replaces it in full.

```svelte
<ConfigProvider tree={{ styles: { itemTitle: 'font-weight:600' } }}>
  <Tree treeData={nodes} classNames={{ item: 'document-row' }}
    styles={({ props }) => ({ itemSwitcher: props.disabled ? 'opacity:0.5' : undefined })} />
</ConfigProvider>
```

Provider and local classes accumulate. After theme variables,
the outer root applies provider `styles.root`, provider `style`,
local `styles.root`, then local `style`. `Tree.style` and context
`tree.style` keep the outer native root. React applies ordinary and
context style to the inner list. Raw observations and public
comparisons using `styles.root` are recorded separately.
`styles.item` overrides `node.style` as upstream. Switcher slots
also apply to leaves. `itemIcon` exists during pending load with
`showIcon=false`. TreeSelect keeps its own internal tree settings
and is independent of the tree record.

Slot changes preserve DOM, refs, selection, active IDs, focus,
and pending load. Svelte also updates the default icon. In
rc-tree 1.4.0, changing `itemIcon` classes or styles without
changing prefix, expanded state, or loading leaves the old values
cached. The raw cache observation is separate from the upstream
comparison with a public custom icon. Snippets remain opaque
Svelte content and CSS applies to existing wrappers. Tests cover
slots, callbacks and defaults, nested, reset, replaced, and
sibling scopes, DirectoryTree, prefix and RTL, style priorities,
and updates including pending load and independent TreeSelect.
[18 upstream cases and three raw observations](../../../tests/browser/fixtures/ant-design-tree-semantic-reference.json) ·
[Browser tests](../../../tests/browser/tree/tree-semantic.spec.ts) · [SSR tests](../../../tests/package/tree/tree-semantic.ssr.test.ts)

Deprecated `TreeNode` children are outside the port. rc-tree 1.4.0
marks `Tree.children` deprecated in favor of `treeData`.

## Collapse motion

`motion` accepts a native CSSMotion config or `false`. `undefined`
and `null` select the Ant collapse object, with
`${rootPrefixCls}-motion-collapse`, measured height and opacity,
and a 500ms deadline. An empty object disables CSS phases as a
custom config. Semantic callbacks receive the resolved object.
A supplied config retains its identity.

Initial `defaultExpandedKeys` and `expandedKeys` and SSR do
not animate. When one expanded key changes, visible descendants
temporarily move into a motion group. Expansion uses `appear`
and collapse uses `leave`. Tree overrides `motionAppear` by
transition direction, so custom `motionAppear: false` still
allows expansion. Multiple changed keys update the list
immediately.

`motionName` accepts a string or an object of phase names.
Prepare hooks may return a Promise. Start and active hooks
receive the group DOM and `event=null` and return a CSS string.
End hooks receive a native transition or animation event or
`{deadline:true}`. `false` keeps the group active. Default collapse
ignores opacity end and finishes on height end or deadline.
Descendant events leave the group active. Ant Tree owns its
`onVisibleChanged`. That inherited callback, React children,
and `internalRef` are outside the Svelte API.

`theme.token.motion=false` disables CSS phases and retains
preparation. Svelte also observes `prefers-reduced-motion` and
its changes during a transition. Other expansion actions wait
for motion to finish. Selection and checking remain available.
Data changes, `motion=false`, drag completion, and unmount
release the held group and cancel old frames, prepare
completions, deadlines, and DOM listeners.

With a virtual list, the group holds the first
`ceil(height/itemHeight)+1` descendants. The virtual placeholder
retains the original `itemHeight` estimate. `virtual=false`
or no height retains the full range. Neighboring keyed rows,
the tree root, refs, and opaque controls outside the range
retain DOM. Nodes in the range mount in the group and then
return to the flat list as upstream. TreeSelect retains its
own expansion behavior.

Tests cover phases, callbacks, measurement, virtualization,
generic aliases and zero and bigint keys, prefix and RTL,
theming, and cleanup. The raw reference records the rc-tree
1.4.0 error where a hidden expanded key produces an empty
range that blocks visible branches until the deadline. Svelte
skips empty and invisible ranges and keeps expansion available.
[23 upstream scenarios and a raw observation](../../../tests/browser/fixtures/ant-design-tree-motion-reference.json) ·
[12 SSR variants](../../../tests/browser/fixtures/ant-design-tree-motion-ssr-reference.json) · [Engine tests](../../../src/lib/tree/tree-motion.engine.test.ts) ·
[Lifecycle tests](../../../src/lib/tree/tree-motion.dom.test.ts) · [Browser tests](../../../tests/browser/tree/tree-motion.spec.ts) ·
[Svelte browser tests](../../../tests/browser/tree/tree-motion-native.spec.ts) · [SSR tests](../../../tests/package/tree/tree-motion.ssr.test.ts)

## Drag/drop

`draggable` enables HTML5 drag and drop in Tree and DirectoryTree.
It takes a boolean, a predicate of the original data node, or
`{ nodeDraggable, icon }`. A false predicate disables the row's
drag start and drop handlers as upstream. The default is the
Holder icon. `icon: false` removes the handle, and a Snippet
replaces its content even when empty. Interactive handle
content retains its controls and focus. Clicking a regular
handle returns focus to the tree root. Draggable rows have
`tabindex=-1` and add no tree Tab stops.

`allowDrop({ dragNode, dropNode, dropPosition })` receives original
data objects and relative position -1, 0, or 1. Position depends
on the vertical half of `event.target`, horizontal movement,
expanded branches, and indent. Level transitions, RTL, and
virtual windows are supported. Disabled nodes cannot start a
drag and can still be drop targets. Check `dropNode.disabled`
in `allowDrop` when needed. The Ant wrapper fixes the indicator
and overrides inherited rc `dropIndicatorRender`.

`onDragStart`, `onDragEnter`, `onDragOver`, `onDragLeave`, and
`onDragEnd` receive `{event,node}` with a native DragEvent and
canonical key and state. `onDragEnter` adds `expandedKeys` before
the delayed expansion. After 800ms, `onExpand` receives
`expanded=true`, with the key added if the node has children.
A leaf can leave the set unchanged. Hover alone does not load
lazy children. Uncontrolled Tree collapses the source on
dragstart without `onExpand`. DirectoryTree owns its expanded
keys and keeps the source as it was.

`onDrop` adds `dragNode`, `dragNodesKeys`, `dropToGap`, and
`dropPosition`. The last is the drop node's sibling index
plus -1, 0, or 1. The drop node can be an ancestor of the
indicator row. Drag-over flags apply to the indicator row.
`dragNode` keeps the drag-start state and original data
reference. Mutating that object is visible to `onDrop`, while
replacing the node object leaves the retained reference intact.
`dragNodesKeys` contains the source and all descendants at
drag start, including collapsed branches. The consumer reorders
`treeData`. Drop checks preserve selection, checkboxes, native
refs, and keyboard behavior.

Comparisons cover geometry, snapshots, defaults, controlled
keys, generic data and `fieldNames`, icons, prefix and RTL,
and lifecycle. Svelte browser tests include real mouse drags,
virtual scrolling, data changes, and retained focus and DOM.
[38 independent upstream scenarios and six raw observations](../../../tests/browser/fixtures/ant-design-tree-drag-reference.json) ·
[12 upstream SSR cases without DOM](../../../tests/browser/fixtures/ant-design-tree-drag-ssr-reference.json) · [Engine tests](../../../src/lib/tree/tree-drag.engine.test.ts)
· [SSR tests](../../../tests/package/tree/tree-drag.ssr.test.ts) · [Browser tests](../../../tests/browser/tree/tree-drag.spec.ts) ·
[Svelte tests](../../../tests/browser/tree/tree-drag-native.spec.ts)

Svelte handles the recorded rc-tree 1.4.0 cases as follows.

- `allowDrop` is checked before drop, and a rejected dragover
  clears the previous target.
- The current descendant tree is checked, including nodes added
  after dragstart.
- Window dragend retains the source node even if its DOM has left
  the virtual window.
- Unmount cancels the expansion timer and listeners and prevents
  late callbacks.
- The drop container keeps key 0, and the handle updates its
  namespace when the prefix changes.

## Data utilities

`createTree` corresponds to React's `Tree.useTree`. The model
exposes a stable `getPath(key)` returning entities from the root
through the matching node, inclusive. An entity has `key`, `pos`,
`level`, `index`, the original `node`, the source object path
`nodes`, `parent`, and `children` if it has descendants. String,
number, and bigint lookup follows upstream string key matching.

```svelte
<script lang="ts">
  import { createTree, type TreeFieldNames } from '@woodger/antd';

  interface Item {
    id: string;
    caption: string;
    items?: Item[];
  }
  let items = $state.raw<Item[]>([{ id: 'root', caption: 'Root', items: [
    { id: 'leaf', caption: 'Leaf' }
  ] }]);
  let fields = $state<TreeFieldNames>({ key: 'id', title: 'caption', children: 'items' });
  const model = createTree(() => items, { get fieldNames() { return fields; } });
  let path = $derived(model.getPath('leaf').map(entity => entity.key));
</script>

<output>{path.join(' / ')}</output>
```

Data and `config.fieldNames` getters are read on every lookup.
A new data or schema reference rebuilds the index. Use a new
array and fieldNames object for changes. A retained `getPath`
reads current inputs, including through `$derived`. A static
array is also accepted. The model works without DOM, effects,
or timers, including in SSR. Source object identity and generic
payloads are retained. The raw node's title field is left as
supplied. Tree and DirectoryTree take the same schema through
`fieldNames`. The model takes it through config.

The UMD reference records entities, aliases, positional
fallback, and data and schema updates. An unknown key returns
`[]`. In rc-tree 1.4.0, looking up an absent `constructor`,
`__proto__`, or `toString` reads the plain object prototype
and returns a function or Object.prototype instead of a
DataEntity. The observation is retained. Actual data keys
with those names are supported. [Upstream UMD reference](../../../tests/browser/fixtures/ant-design-tree-data-model-reference.json)
· [Unit tests](../../../src/lib/tree/tree-data-model.test.ts) · [Browser tests](../../../tests/browser/tree/tree-data-model.spec.ts) ·
[Package and SSR tests](../../../tests/package/tree/tree-data-model.ssr.test.ts)

## DirectoryTree

The separate `DirectoryTree` export corresponds to React's
`Tree.DirectoryTree` and uses the existing Tree. Defaults are
`expandAction='click'`, `showIcon=true`, and `blockNode=true`.
These props can be overridden. A leaf gets a file icon and
a branch gets an open or closed folder. An `icon` Snippet
replaces the default icon.

```svelte
<script lang="ts">
  import { DirectoryTree } from '@woodger/antd';

  const nodes = [{ key: 'docs', title: 'Documents', children: [
    { key: 'intro', title: 'Introduction', isLeaf: true },
    { key: 'api', title: 'API', isLeaf: true }
  ] }];
</script>

<DirectoryTree treeData={nodes} multiple defaultExpandAll aria-label="Files" />
```

A regular click selects just the row, and another click keeps it
selected. With `multiple`, Ctrl or Meta toggles individual keys.
Shift adds a range between the current row and the last ordinary,
Ctrl, or Meta selection. The range follows the visible tree,
excludes hidden descendants, and skips intermediate disabled or
nonselectable nodes. The first Shift click without an anchor
creates no range. `onSelect` reports `selected=true`, including
when Ctrl or Meta removes the key. `selectedNodes` contains source
nodes in complete tree order.

Controlled and default keys and `defaultExpandParent` retain
Tree contracts. DirectoryTree also includes leaf keys in the
initial set with `defaultExpandAll`, as upstream. Lazy loading,
checkboxes, keyboard interaction, Tree themes, RTL, prefix,
focus, blur, scrolling, and `bind:nativeElement` use the
existing component. Advanced Tree APIs outside the port are
listed above.

The upstream cases compare selection and ranges, callbacks,
expansion, icons, and directory tokens.
[15 upstream scenarios](../../../tests/browser/fixtures/ant-design-directory-tree-reference.json) · [Browser tests](../../../tests/browser/tree/directory-tree.spec.ts)
· [SSR tests](../../../tests/package/tree/directory-tree.ssr.test.ts)

Leaving controlled mode preserves the last accepted keys.
Ant Design 6.6.8 with rc-tree 1.4.0 loses safe arrays on this
transition and the next Shift click fails on
`undefined.includes`. Both original observations are kept
separately. [Upstream observations](../../../tests/browser/fixtures/ant-design-directory-tree-control-release-observation.json)
