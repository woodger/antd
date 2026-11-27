# Typography

`Typography` is a native `article` with typography styles. `component`
changes its tag. `TypographyText`, `TypographyTitle`, `TypographyParagraph`,
and `TypographyLink` correspond to Ant Design's Text, Title, Paragraph, and
Link and add text operations. [Type declarations](../../../src/lib/typography/typography.types.ts)

```svelte
<script lang="ts">
  import { TypographyTitle, TypographyParagraph, TypographyLink } from '@woodger/antd';

  let text = $state('Длинный текст статьи');
  let expanded = $state(false);
</script>

<TypographyTitle level={2}>Название статьи</TypographyTitle>
<TypographyParagraph children={text} copyable
  editable={{ onChange: value => { text = value; } }}
  ellipsis={{ rows: 2, expandable: 'collapsible', expanded,
    onExpand: (_event, info) => { expanded = info.expanded; } }} />
<TypographyLink href="/articles" target="_blank">Все статьи</TypographyLink>
```

Text renders a `span`, Title an `h1` through `h5` (default `h1`),
Paragraph a `div`, and Link an `a`. For a Link with `target="_blank"` and
no `rel`, `noopener noreferrer` is added. `disabled` changes the styling.
Copy, edit, and expand buttons stay interactive, as in upstream. Decorations
wrap the text and actions together. `actions.placement` moves the action
bar to the start or end.

`copyable` accepts `text`, `format`, `icon`, `tooltips`, `tabIndex`, and
`onCopy`. Clicking calls an async producer. Empty `text` uses the upstream
children fallback. HTML is copied as `text/html` and `text/plain`. When
the Clipboard API fails, the document copy fallback is used. Success state
resets after three seconds. A copy already in progress and its callback
can finish after unmount without starting a new timer. Supply
`copyable.text` for rich content. The upstream array fallback joins the
top level and converts element nodes to `[object Object]`.

`editable.editing` controls edit mode. The owner updates children from
the callbacks. The editor receives `editable.text` or string children.
Input removes CR and LF, and saving trims whitespace. Enter calls
`onChange` and `onEnd`, Escape calls `onCancel`, and blur calls only
`onChange`. IME and Enter modifiers are taken into account.
`triggerType`, `maxLength`, `autoSize`, `tooltip`, `icon`, and `tabIndex`
are supported. `enterIcon={null}` hides the confirmation icon. A custom
`enterIcon` Snippet receives the CSS class as its first argument in place
of React's `cloneElement`. Closing returns focus to the edit icon. The
editor is independent of an enclosing FormItem. On blur without
`relatedTarget`, the connection check runs after Svelte's `tick` so
removing a focused element discards the draft. `bind:nativeElement` is
absent while editing and cleared on unmount.

With no actions or other options, ellipsis uses native CSS. The JavaScript
path measures lines and actions, finds the boundary in UTF-16, and
preserves the suffix and full `aria-label`. It supports `rows`,
`expandable`/`collapsible`, `symbol`, `defaultExpanded`, `expanded`,
`onExpand`, `onEllipsis`, and `tooltip`. `defaultExpanded` is read once.
Text excludes `rows`, `expandable`, and `onExpand`. Set a `style` width
for responsive Text. Link accepts boolean `ellipsis`.

Tooltip measures native overflow on hover and hides over the action bar.
It inherits the trigger and hover delays from `ConfigProvider.tooltip`.
Local options take precedence, including `0` and `trigger=[]`. A nested
tooltip record replaces the parent's record in full. By default,
`trigger=hover` and both delays are 0.1s. It supports `focus`, `click`,
`contextMenu`, and arrays of events. Upstream configuration treats their
actions independently, so leaving hover can close a tooltip opened by
click or focus. Another context-menu event toggles it. An ordinary click
closes it. Local `showAction` and `hideAction` override these actions
independently. `focusDelay` and `blurDelay` are independent of the mouse
delays. The Tooltip reference covers their precedence, touch fallback, and
outside dismissal. [Tooltip](tooltip.md#tooltip)

Copy and edit tooltips inherit the same configuration. Copying, the
success title, and entering edit mode retain their normal behavior.
The ellipsis tooltip also accepts `destroyOnHidden`. Closing removes its
content while preserving text measurement and the native shell. As in
upstream, `onOpenChange` reports the raw open state even for text without
truncation, while the tooltip itself stays hidden. Native CSS ellipsis
first needs a hover measurement. JavaScript ellipsis is measured
independently of the Tooltip trigger.

Scalar children and arrays provide exact text boundaries for SSR. A
Snippet in an array remains an atomic item. A plain-text children Snippet
is detected through the DOM after mount. During JavaScript truncation and
editing, the original Snippet stays in a hidden `span` to receive updates.
Its full text stays in `textContent`, while the visible truncated text is
available through `innerText`. For precise editing on the initial server
render, use scalar children or `editable.text`. Rich Snippets are opaque
to Typography.

`ConfigProvider.typography` supplies `class`, `style`, and the semantic
`root`, `actions`, `action`, and `textarea` slots. Local layers take
precedence. A callback sees the resolved `prefixCls` and `direction` and
the actual `component`. `locale.typography` and upstream's `locale.Text`
provide action labels. `Text` takes precedence when both are used. Dark
mode, compact mode, RTL, native focus, and original heading margins are
preserved.

Every Typography variant uses a local `prefixCls` or inherits
`ConfigProvider.prefixCls`. An empty value inherits it. The prefix covers
headings, decorations, ellipsis, actions, and the separate editor root.
Changing it preserves DOM, drafts, selection, focus, and copy state. The
theme variable namespace and nested Tooltip prefix remain independent.

`theme.components.Typography` applies `titleMarginTop`, `titleMarginBottom`,
alias overrides, and algorithms to regular text and the editor. Global
tokens, nested, reset, and sibling scopes, and a separate CSS variable
prefix follow upstream. Semantic and local styles keep their precedence.
Theme changes preserve the DOM, editor draft, selection, focus, and any
pending async copy. Without the upstream theme, the previous CSS defaults
apply.

Tooltip uses the shared native popover inside the root in place of a
React portal to the body. It supports the 12 shared placements, container
getters, color, local popup `prefixCls` and `openClassName`, and semantic
styles. Callbacks receive the resolved trigger and delays and the owner's
input `open` value. Configuration updates preserve popup DOM, input,
selection, and focus. The ellipsis tooltip uses the nearest
`Tooltip.UniqueProvider`. `ellipsis.tooltip.unique=false` keeps its own
panel. Tooltip also defines the animation and lifecycle, the limits of
`fresh` for opaque Snippets, and the behavior with CSS transforms and
scroll containers. [Tooltip contract](tooltip.md#shared-tooltip-for-multiple-triggers)

Upstream Ellipsis memoization overlooks prefix changes. Inside a nested
provider, copy and edit buttons can retain old classes and lose their
styles. The prefix reference records raw live measurements and a fresh
mount with the same public props. The Svelte implementation updates
action classes with the root. The prefix fixture is
`?fixture=typography-prefix`. [Prefix reference](../../../tests/browser/fixtures/ant-design-typography-prefix-reference.json) ·
[Browser tests](../../../tests/browser/typography/typography-prefix.spec.ts) · [SSR tests](../../../tests/package/typography/typography-prefix.ssr.test.ts)

Action width is checked against a DOM and CSS snapshot of Ant Design
6.6.8 in an isolated ShadowRoot. This uses the current browser's fonts
for both sides in Chromium and Headless Shell and preserves the precision
and boundaries of two-line text. [Snapshot](../../../tests/browser/fixtures/ant-design-typography-actions-reference.json)

Ellipsis Tooltip defaults, semantic callbacks, and events are compared
against official UMD scenarios. The reference uses the official UMD's
runtime CSS without static `antd.css`. Native overflow is measured under
`trigger=[]` before recording event sequences. The fixture is
`?fixture=typography-tooltip`. [23 UMD scenarios, 29 frames, and 21 event traces](../../../tests/browser/fixtures/ant-design-typography-tooltip-reference.json)
· [SSR tests](../../../tests/package/typography/typography-tooltip.ssr.test.ts) · [Browser tests](../../../tests/browser/typography/typography-tooltip.spec.ts)

The recipe reproduces 73 upstream CSS rules. [Upstream CSS](../../../src/lib/vendor/typography.css) ·
[Recipe](../../../tools/ant-design-css-recipes.json)

Icons come from `@ant-design/icons-svg` 4.6.0 under the existing MIT
license. [MIT license](../../../src/lib/vendor/LICENSE.ant-design-icons)
