# Pagination

```svelte
<script lang="ts">
  import { Pagination } from '@woodger/antd';

  let current = $state(1);
  let pageSize = $state(10);
</script>

<Pagination total={137} bind:current bind:pageSize>
  {#snippet showTotal(total, range)}{range[0]}–{range[1]} of {total}{/snippet}
</Pagination>
```

`total` defaults to 0. `current` and `pageSize` support binding.
Standalone controls can use `defaultCurrent=1` and
`defaultPageSize=10`. Initial values are read once. With binding, set
them in the owner.

Navigating calls `onChange(page, pageSize)`. Clicking the current
page again emits no event. Changing the size calls
`onShowSizeChange(previousCurrent, pageSize)` first and then
`onChange(clampedCurrent, pageSize)`, keeping the page within bounds.
Callbacks receive page numbers that account for the displayed range.

The displayed page is clamped to `1…ceil(total / pageSize)`. Prop
updates, including a reduced `total`, do not write the corrected value
back to the owner or call callbacks. An empty collection displays page
1 and range `[0, 0]`. `hideOnSinglePage` hides navigation. In the empty
case the number button is disabled and not marked active, as in
upstream. Fractions are rounded down. `total` has a minimum of 0,
`current` and `pageSize` have a minimum of 1, and all three are capped
at `Number.MAX_SAFE_INTEGER`. `NaN` and infinite values use defaults of
0, 1, and 10 respectively. The page and navigation list contains at
most nine items regardless of `total`. The page windows and jump
boundaries come from `@rc-component/pagination` 1.4.0. With two jump
buttons, three number buttons remain between them, including the
current page. `showLessItems` reduces the buffer and jump step from 5 to
3. `showPrevNextJumpers` controls jump visibility.

The size changer appears automatically at `total > 50` and can be
overridden by `showSizeChanger`. `pageSizeOptions` defaults to
`[10, 20, 50, 100]`. Positive safe integers are accepted. Duplicates
are removed, options are sorted, and the current size is added.
`showTotal` receives normalized `total` and the 1-based item range.
On a narrow screen, items wrap and the size changer stays available.

`simple=true` shows an editable current/total counter. Enter and blur
commit the input. ArrowUp decreases the page, and ArrowDown increases
it. `{ readOnly: true }` retains the counter without an input. With an
empty collection, the simple counter is 1/0 as in the pinned version.
Draft input survives external `total` and `pageSize` changes as long
as the displayed current page is unchanged. Selecting a size resets
the draft to the displayed page. `showQuickJumper=true` adds a numeric
input. Enter and blur outside the paging controls navigate to the
entered page. `{ goButton: true }` adds confirmation and disables
navigation on blur. `goButton` also accepts text or a Snippet. The quick
jumper is available in simple mode. Its button commits the simple
input first and then the quick-jump value. Blurring the simple input
retains its usual commit behavior. The quick jumper and its button
are hidden for a single page. The nested React `li` in the jumper is
a `span` with the same class in Svelte for valid HTML, and confirmation
uses a native button.

`align` accepts `start`, `center`, and `end`. `showTitle=false` removes
tooltip titles while retaining accessible names. At XS, `responsive`
adds the `mini` class if there is no explicit size. In Ant Design 6.6.8
CSS, height changes come from `size=small`. The `mini` class alone leaves
height unchanged. This was verified against the original React build
and preserved. `size` and `ConfigProvider.componentSize` still control
the actual dimensions.

Responsive Pagination reads the global `theme.token.screenXSMax`.
Explicit size takes precedence. Breakpoint order is validated during
SSR even with `responsive=false`, as in upstream `useBreakpoint`.
Token changes replace queries while preserving the current page and
quick-jump draft, selection, and focus. The stale upstream subscription
and fresh public comparison are recorded separately. Browser tests
also cover Masonry columns and gutters, and SSR preserves the original
defaults and checks threshold order. [Browser tests](../../../tests/browser/config-provider/responsive-controls.spec.ts) ·
[SSR tests](../../../tests/package/config-provider/responsive-controls.ssr.test.ts)

`itemRender` is a Snippet receiving
`(page, type, originalElement, info)`. `originalElement` renders a ready
native button. `info` holds `disabled`, `active`, `label`, `title`, and
`onClick` for a custom native control. This replaces ReactNode and
`cloneElement` or list item click handling. `prevIcon`, `nextIcon`,
`jumpPrevIcon`, and `jumpNextIcon` accept text or a decorative Snippet.
The default jump and ellipsis icons come from `@ant-design/icons-svg`
4.6.0 under the existing license. [MIT license](../../../src/lib/vendor/LICENSE.ant-design-icons)

`showSizeChanger` accepts a boolean or supported Select props. Its
custom `onChange` runs after `onShowSizeChange` and Pagination's main
`onChange`. Pagination's size takes precedence over size in Select
props. `components.sizeChanger` receives a Snippet with `value`,
`disabled`, `class`, `options`, and `onChange`. Some advanced React
Select props are still pending in Svelte Select.

`ConfigProvider.pagination` sets `class`, `style`, semantic
`classNames` and `styles`, `showSizeChanger`, and
`totalBoundaryShowSizeChanger`. Local settings take precedence.
Semantic callbacks receive the original props and explicit resolved
size. Omitted original props stay omitted. The semantic root is the
native `nav`, and the existing `class` stays on the `ul`. Root
`style` overrides `styles.root`. `classNames.item` and `styles.item` apply
to pages, previous and next, and the simple counter, excluding jump
controls as upstream. `locale` accepts the original snake_case aliases.
`locale.page` sets the quick jumper suffix.
`config.locale.pagination.page` remains the accessible page name.

The existing Svelte API retains `bind:current` and `bind:pageSize`,
number normalization, sorted and deduplicated sizes, and an accessible
size changer at XS. String `pageSizeOptions` are converted to numbers
first. React options can retain their input order and the entire
options area is hidden at XS. The quick jumper follows upstream CSS
and is hidden at XS. Use function bindings with a getter and
`onChange` handlers for controlled composition that can reject updates.

`prefixCls` sets the local Pagination namespace. The empty string
inherits `ConfigProvider.prefixCls`. The 111 original CSS and media
rules are scoped to the local or global prefix, excluding four shared
Input Group rules. Private `item-size-actual` and `item-spacing-actual`
variables follow the shared namespace with dots removed as upstream.
Public token variables retain their names. Changing the prefix
preserves `current`, `pageSize`, the active item's DOM, the jumper
and its draft, focus and selection, and callbacks. Items keep
`border-box` and the theme size, including 28px for medium in native
compact mode. Comparisons record the upstream button's Arial font
separately from the public example using inherited font. The existing
native typography, active colors, and wireframe style are preserved.
[Public itemRender comparison with fontFamily:inherit](../../../tests/browser/fixtures/ant-design-pagination-prefix-reference.json)

CSS generation for `selectPrefixCls`, React-specific components, and
development warnings remain pending. `selectPrefixCls` is available
in the custom size changer info. The default Select keeps its own
classes. Regular disabled behavior, native button navigation, focus
restoration when next becomes disabled, and SSR without DOM, media
queries, or timers are preserved.

Upstream `theme.components.Pagination` uses 12 of its own defaults
and the shared calculation for 18 Input defaults for the quick
jumper. Component algorithms, aliases, zero and undefined values,
runtime CSS lengths, and CSS prefix and hash are supported. Tokens
are on the native `nav` and inherited by the styled `ul`, preserving
`styles.root` and `style` precedence. The internal Select gets its own
scope. Input overrides leave quick-jumper tokens independent.
`miniOptionsSizeChangerTop` is serialized but unused by the original
6.6.8 CSS.

Global `token.wireframe` enables bordered styling independently of the
component override of the same name. Additional rules are ported from
`pagination/style/bordered.ts` since the pinned `dist/antd.css` omits
them. Number colors and padding apply to the existing native buttons.
Previous and next buttons keep the upstream `line-height: normal`,
including with undefined item height. Metrics for the three sizes,
disabled and simple modes, variants, hover, focus, and theme updates
are compared with the official UMD in `?fixture=pagination-theme`.
Native-only themes, bindings, and the agreed XS behavior are retained.

Without `cssVar`, the active number still receives the primary color,
hover receives the primary hover color, and disabled receives the
disabled color. State color variables in `styles.item` and the inline
color of a custom `itemRender` retain precedence. The regression
test covers light and dark themes in LTR and RTL. The existing native
`primary` palette is preserved. [Regression test](../../../tests/browser/pagination/pagination-color.spec.ts)
