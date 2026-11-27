# Cascader / CascaderPanel

Cascader selects a path in a hierarchy. CascaderPanel displays the same
options inline. The type declarations define the public types and
defaults. An embedded panel inherits its owner's layer.
[Type declarations](../../../src/lib/cascader/cascader.types.ts) · [Owner layer](../theme-context.md#layering-nested-panels)

```svelte
<script lang="ts">
  import { Cascader, CascaderPanel, type CascaderPath } from '@woodger/antd';

  let path = $state<CascaderPath>([]);
  const options = [
    { value: 'asia', label: 'Asia', children: [
      { value: 'japan', label: 'Japan' }
    ] }
  ];
</script>

<Cascader {options} value={path} onChange={next => { path = next ?? []; }} />
<CascaderPanel {options} value={path} onChange={next => { path = next ?? []; }} />
```

`value` and `defaultValue` are full paths of strings or numbers.
`multiple` uses an array of paths. The owner controls `value` through
`onChange`. `defaultValue` is read at creation. Clearing a single
selection calls `onChange(undefined, undefined)`. Clearing in multiple
mode calls `onChange([], [])`. The second argument holds the original
options in path order and keeps `undefined` for missing nodes. Missing
paths remain visible using raw values. Selecting the same single path
again also calls `onChange`. Application-specific serialization of
paths in `FormData` is left to the owner.

In multiple mode, selection propagates through enabled checkboxes only.
`disabled` and `disableCheckbox` stop propagation. Display and
`onChange` use `SHOW_PARENT` by default or `SHOW_CHILD`. The constants
are exported as `CASCADER_SHOW_PARENT` and `CASCADER_SHOW_CHILD`.
Clicking a parent's content opens a column, while its checkbox selects
the branch. By default, single mode displays the entire path joined
by ` / `, and multiple mode displays the last label. `maxTagCount`,
responsive tags, `maxTagTextLength`, `tagRender`, and
`maxTagPlaceholder` change display while preserving selected paths.
`maxTagTextLength` retains the original title and counts UTF-16 code
units as rc-select does. It avoids leaving a dangling half of a valid
surrogate pair when truncating. The shared reference records the
upstream Unicode defect for separate analysis. [Raw Select and Cascader measurements](../../../tests/browser/fixtures/ant-design-select-tag-text-reference.json)

`showSearch` defaults to `false`. `true` enables search by any label
in the path. An object configures controlled `searchValue` and
`onSearch`, `filter`, `sort`, `render`, `limit`,
`matchInputWidth`, `searchIcon`, and `autoClearSearchValue`. The
default limit is 50. `false` or a nonpositive number removes it.
Without `sort`, the limit stops traversal. With `sort`, it applies
after sorting. `changeOnSelect` and `multiple` include intermediate
paths in the results. A disabled parent disables its descendants in
the results. Label Snippets are opaque to the default filter, like
ReactNode. Supply a custom `filter` to search Snippet contents.

Selection clears the local search without a separate `onSearch`.
Multiple mode with `autoClearSearchValue=false` retains the query
until blur. Clearing all selections and closing in single mode can
call `onSearch('')`. With controlled search, the owner decides whether
to update the query.

`loadData` receives the original options of the active path when its
last node is not a leaf. Its Promise is neither awaited nor used to
clear loading. The indicator disappears when `children` changes,
`isLeaf` becomes `true`, or the node is removed from `options`.
Empty `children=[]` also clears it. Search does not trigger loading.
Explicit `isLeaf=false` stays in search results. Single mode without
`changeOnSelect` skips selection of such a node. The consumer owns
requests, errors, and option updates, as upstream.

The popup supports controlled `open` or `defaultOpen`,
`changeOnSelect`, click and hover, placement, width, and
`popupRender`. Deprecated dropdown aliases are removed. The field
retains focus on selection. Up and Down move through enabled rows.
Left and Right move between columns and swap in RTL. Backspace returns
to the parent, Enter selects, and Escape closes. With a nonempty
query, Left and Right preserve native caret and selection behavior.
The search field retains line height and text color after hiding the
selected label. Typing again preserves the selected path. In multiple
mode, Backspace also removes the last removable tag. Clear is a native
button with keyboard activation. FormItem supplies the label and ID,
description, required state, and status. `bind:nativeElement`,
`bind:inputElement`, and focus and blur are available after mount.

`ConfigProvider.cascader` supplies `variant`, `class`, `style`,
semantic slots, and icons. Local fields refine the configuration.
Root `style` follows `styles.root`, and popup, list, and list item use
their own semantic slots. `allowClear=true` inherits
`ConfigProvider.cascader.clearIcon` and defaults to the standard Ant
icon. An `allowClear` object is passed through without inheritance. Its
missing or falsy `clearIcon` falls back to `×`. Semantic callbacks
receive the original props, including raw `multiple`, and resolved
`disabled`, `size`, `variant`, and `status`. Panel inherits disabled
state, direction, and expand and loading icons. Cascader's root
`class` and `style` and popup semantic configuration do not apply to
Panel. Themes and compact mode use the library's current tokens, and
the locale comes from the shared ConfigProvider.

With an upstream theme, the field and dropdown combine
`components.Select` and `components.Cascader` in the upstream order.
Cascader controls field and column widths, dropdown height, padding,
and selected row styling. Component algorithms, zero and undefined
values, and a custom CSS prefix are supported. `components.Checkbox`
leaves internal checkboxes independent. Standalone Panel receives
only Cascader tokens, inherits the provider's font and color, and
keeps its transparent background. Theme changes preserve DOM, search,
selection, focus, and popup position. Semantic popup styles retain
precedence. Native-only themes retain their behavior.
[Theme reference](../theme-context.md)

Svelte Snippets replace ReactNode and render callbacks. `optionRender`
receives the original option and info with `path`, `searchValue`, and
`originNode`. Use `originNode` for search highlighting. React's
search `option.label` contains a rendered node. Svelte keeps the
original label and supplies the rendered content separately.
`tagRender` receives a label Snippet, `closable`, `onClose`, and the
rc path key. The `maxTagCount` summary tag has `isMaxTag=true` and no
`value`, `index`, or `onClose`. `maxTagPlaceholder` receives the default
label and original labels and options for each hidden path. A custom
`displayRender` can be called again with those values. Custom
`children` receives handlers and ARIA attributes for a native trigger,
replacing React's `cloneElement`. `inputElement` is absent when it is
used.

`getPopupContainer` receives the `.ant-select` root or, with custom
`children`, the DOM trigger from the Snippet. `nativeElement` continues
to refer to the wrapper `div`. The local getter overrides
`ConfigProvider.getPopupContainer`, and `undefined` inherits the
provider. The getter runs in the browser after the first open.
ShadowRoot requires its own styles. Replacing the getter with one
returning the same container preserves panel state, search, focus, and
selection. The gap to the trigger remains 4px. CascaderPanel stays
inline and bypasses the shared getter.

Standalone Panel uses native row buttons with keyboard focus between
them. This adapts the original pointer-only panel for accessibility.
SSR avoids DOM access and `loadData` calls. An initially open popup
renders hidden until mount. Arbitrary popup alignment and motion,
React-specific components, refs and warnings, and inferring the value
type from arbitrary generic `ValueField` remain outside this stage.

A nonempty `prefixCls` sets the namespace for the Select control and
Cascader columns or Panel. An empty value inherits independent shared
prefixes. CSS retains canonical tokens and passes the resolved Cascader
prefix to the search render callback. Input width, refs, IDs, selected
paths, search, caret, focus, callbacks, and Panel keyboard behavior
persist when the prefix changes. Thirty UMD configurations in normal,
nested, and reset scopes cover single and multiple selection, Panel,
search, empty and RTL, sizes, variants, status, and aliases.
[UMD configurations](../../../tests/browser/fixtures/ant-design-cascader-prefix-reference.json) · [Browser tests](../../../tests/browser/cascader/cascader-prefix.spec.ts) ·
[SSR tests](../../../tests/package/cascader/cascader-prefix.ssr.test.ts)

In Ant Design 6.6.8, a local prefix changes the Select popup class, while
the Cascader padding reset still looks for the shared Select class.
The raw local case retains 4px instead of 0px. Svelte preserves its
existing `padding:0`. A separate comparison applies
`styles.popup.root.padding:0` through public props to match the popup and
the column width that depends on padding, while the control is compared
as originally rendered. Panel also keeps the existing native
`dir=rtl` on its root. Upstream applies RTL to the columns and leaves
the root LTR. The raw root direction and a separate public equivalent
with an ordinary `dir="rtl"` HTML wrapper are recorded separately.
Upstream Panel itself does not pass `dir` to its root. The comparison
does not assert identical DOM.
