# Affix

`Affix` fixes content relative to the window or the `target` DOM container.
`offsetTop` and `offsetBottom` are numbers in pixels. When both are omitted, top
defaults to 0. When both conditions match, top takes precedence. Coordinate
comparisons use the same rounding as Ant Design. `onChange(affixed)` runs only
when switching between fixed positioning and regular flow after the initial
browser measurement. The target resolves from target, then
ConfigProvider.getTargetContainer, then window. The function runs only in the
browser. The shared GetTargetContainer type is exported.

```svelte
<script lang="ts">
  import { Affix, Button } from '@woodger/antd';
  let container = $state<HTMLDivElement>();
</script>
<div bind:this={container} style="height:200px;overflow:auto">
  <Affix target={() => container ?? null} offsetTop={8}>
    <Button>Действие</Button>
  </Affix>
  <div style="height:600px"></div>
</div>
```

`class`, `style`, and native div attributes apply to the outer node.
`rootClassName` applies to the inner node while fixed. `bind:nativeElement`
exposes the outer div. `bind:this` exposes `updatePosition()` and
`updatePosition.cancel()` to cancel the next forced measurement. The scroll queue
is independent. ResizeObserver watches the outer node and direct DOM children
of the content. Listeners follow the actual target and are removed when it
changes or Affix unmounts. Queues and observers are cleaned up too.

SSR leaves content in flow and defers all target and DOM access. A fixed state
adds an empty aria-hidden placeholder with the original size. The content
stays mounted, so fields retain value, focus, and FormData participation. Affix
adds no interactive role and leaves keyboard input alone. Typography, colors,
and RTL are inherited. The fixed node gets its z-index from a CSS variable.

Upstream theme.components.Affix supplies zIndexPopup along with alias overrides
and an algorithm. Default zIndexPopup is the global zIndexBase + 10. Values are
unitless, including 0. Variables and scope apply to the fixed inner node.
Regular flow keeps the container font. Theme updates preserve DOM, refs,
fields, and focus. OnChange runs only when the fixed state changes. Outer
node style and computed top, bottom, width, and height retain their roles.
Upstream aliases, scopes, and geometry are covered by `?fixture=affix-theme`.

ConfigProvider.affix sets class and style on the outer node. Local classes
come first and local style follows context style. A nested record replaces
the configuration in full. Undefined inherits, and {} clears it. Local prefixCls
changes fixed classes and CSS selectors while keeping variable names. An empty
value inherits ConfigProvider.prefixCls, producing ant-affix by default.
Prefix, theme, and config updates preserve the wrapper, fixed content,
placeholder, draft, selection, focus, and onChange. Reset and unmount remove
the dynamic stylesheet. The fixture is `?fixture=affix-config`.

The upstream horizontal scrolling limitation is preserved. With a custom target,
listeners follow that container, so moving it with an outer scroll requires
an explicit updatePosition. A null target or a hidden root measured entirely
as zero keeps the previous state until the next measurement. The shared
ConfigProvider prefix applies to the fixed node. Svelte uses bind:this for refs
and a snippet for children.

GetTargetContainer supports Window and HTMLElement, matching the upstream runtime
context. Ant Design 6.6.8 props also declare ShadowRoot, but the official UMD
calls an unavailable getBoundingClientRect in Affix and Anchor. That branch
is excluded from the type and recorded for separate analysis. Changing the
shared function immediately updates the native target and position and removes
old listeners. Upstream keeps the old position until updatePosition runs.
The reference preserves raw frames and the corrected state after that public
call. The `?fixture=target-container` checks inheritance, priority, href updates,
refs, focus, and cleanup. [Reference](../../../tests/browser/fixtures/ant-design-target-container-reference.json)

The main fixture is `?fixture=affix`. Engine and DOM tests cover rounding, queues,
target changes, and cleanup. SSR and Chromium tests cover native content, the
placeholder, dimensions, callbacks, and hydration. The affix recipe reproduces
six CSS rules from the pinned archive. Affix-prefix extracts the same rules into
a CSS data template for local prefixCls. Checks cover SHA-256, scoped defaults,
overlapping prefixes, and independent default siblings.
