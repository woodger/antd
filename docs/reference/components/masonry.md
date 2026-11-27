# Masonry

Masonry places items in columns based on their height. The props, semantic
callbacks, and data types are defined in the source. [Declarations](../../../src/lib/masonry/masonry.types.ts)

```svelte
<script lang="ts">
  import { Masonry } from '@woodger/antd';

  const items = [100, 60, 120, 80].map((height, index) => ({ key: index, data: height }));
</script>

<Masonry {items} columns={{ xs: 1, sm: 2, md: 3 }} gutter={[12, 24]} fresh>
  {#snippet itemRender({ data, index, column })}
    <div style={`height:${data}px`}>
      Карточка {index + 1}, колонка {column + 1}
    </div>
  {/snippet}
</Masonry>
```

Masonry accepts and ignores root `children`, as with React
`PropsWithChildren`, and uses `items` for cells. Items appear after mount.
SSR renders an empty zero-height `div` without calling the renderer or
`onLayoutChange`, or reading the DOM. `itemRender` is a Snippet receiving the
item data, original index, and current column. `item.children` accepts a
scalar or a Snippet with no arguments and takes precedence over the renderer,
including for `false`, `0`, and the empty string. As upstream, `item.height`
does not set CSS height. Content determines size, and layout reads
`getBoundingClientRect().height`.

Items are processed in their original order. The next item goes into the
shortest column, with ties resolved in favor of the first. `item.column`
pins the column and is capped at `columns - 1`. Numeric `columns` values
are kept as supplied. `0` and `NaN` choose the default of 3. Negative or
fractional values retain the upstream `RangeError`. A responsive map uses
the largest matching breakpoint, falling back to `xs` and then 1. It
supports Grid's `xs`, `sm`, `md`, `lg`, `xl`, `xxl`, and `xxxl`
breakpoints.

Masonry uses global `theme.token.screen*` for `columns` and both responsive
gutter axes. The thresholds are validated during SSR. After mount, changing
the tokens replaces media queries while preserving items, editors, refs,
focus, and selection. The measurements record the stale upstream observer
separately from the public fresh-mount case. [Responsive controls](../../../tests/browser/fixtures/ant-design-responsive-controls-reference.json)

A single numeric `gutter` applies to both axes. A pair sets horizontal and
vertical gutters separately. Each axis accepts a responsive map. There is
no bottom gutter after the last item. Although the shared `Row.gutter` type
accepts CSS strings, upstream Masonry does not convert them. The horizontal
value is used in `${value}px`, while the vertical value is added to the
height in JavaScript. Use numbers or responsive maps of numbers for layout.

The root is always observed. `fresh` also observes the cells. Without
`fresh`, cell content changes alone do not trigger a measurement. A new
`items` array, a change to `columns`, root resize, and captured `load`
or `error` events schedule a batched measurement via
`requestAnimationFrame`. Resize deduplication uses rounded-down rect and
offset dimensions. Layout keeps fractional DOM heights. Unmount cleans up
observers, listeners, and frames. Late observer microtasks leave the
unmounted state untouched.

`onLayoutChange` reports the items with their original fields and a
calculated `column`. The comparison follows `isEqual`, so identical data
and distribution do not repeat the callback. The resulting column can be
stored back in `item.column`, as in the upstream example. Functions and
Snippets are compared by reference. Keys must remain unique after
`String(key)`. CSSMotionList uses string keys, while the geometry map
keeps the original numeric or string keys.

The `masonry` and `masonry-prefix` CSS recipes reproduce all 12 upstream
rules without keyframes and verify SHA-256. The second keeps the CSS as a
module template for a local prefix. Appear and leave use the original CSS
classes and wait two animation frames before going active. An exiting cell
remains until its own `transitionend` or `animationend`. Events from
nested content leave it in place. Returning the same key preserves the DOM
and cancels removal. If the browser created no animation on the cell, the
phase ends after CSS updates. This permits removal with zero-duration
motion. Upstream stays in `leave-active` without a deadline in that case.
The registry records the observation.

`bind:nativeElement` replaces React's `MasonryRef`. Reordering preserves
native drafts, focus, and selections in inputs and textareas, as well as
selections in retained `contenteditable` nodes. It leaves external focus
where it is. RTL uses `inset-inline-start` without changing the DOM order
or `column` in the data. Content controls retain native semantics.
Masonry adds no keyboard navigation of its own.

`ConfigProvider.masonry` sets `class`, `style`, `classNames`, and
`styles`. An explicit nested configuration replaces the full parent record.
Semantic callbacks receive the resolved columns. Root `style` follows the
semantic root style and can override height. Cell geometry follows semantic
item styles. Light and dark themes and CSS variables are inherited.
`components.Masonry` supports alias overrides and algorithms. Upstream
6.6.8 has no Masonry-specific component tokens. Font changes affect
measured heights. With `fresh`, cells are measured again. Without it, the
layout persists until `load`, `error`, resize, or an `items` or `columns`
change. Updates preserve DOM, refs, drafts, selection, and focus.
`onLayoutChange` repeats only when the distribution or data changes.
`theme.token.motion=false` finishes ongoing appear and leave phases and
removes exiting cells without waiting for an end event. Re-enabling motion
does not restart appear for already visible cells.

In 6.6.8, upstream Masonry computes `ant-masonry-css-var` but leaves it off
the root, preventing font and alias settings from reaching CSS. Svelte
includes the marker. The comparison gives upstream the marker through the
public `rootClassName` without changing its source. Original values
without the marker and the stuck zero-duration leave are retained.
[Reference](../../../tests/browser/fixtures/ant-design-masonry-theme-reference.json)

`prefixCls` changes root, item, and motion classes. The empty string and
`undefined` inherit `ConfigProvider.prefixCls` (`ant-masonry` by default).
The local prefix takes precedence, and semantic callbacks receive the
original local value. The internal item width variable uses the shared
provider prefix without dots, independent of the local class and
`theme.cssVar.prefix`. Changing the prefix preserves the DOM, current motion
phase, drafts, focus, and selection. The canonical theme marker is unchanged.

In 6.6.8, `prefixCls="ant-masonry-rtl"` in LTR inherits RTL from the default
stylesheet if a regular Masonry was also rendered. A fresh document
without that stylesheet stays LTR. Svelte scopes root and RTL rules to the
owner and preserves the requested direction. The pinned CSS has no separate
reduced-motion override. [Raw measurements](../../../tests/browser/fixtures/ant-design-masonry-prefix-reference.json) ·
[Isolated measurement](../../../tests/browser/fixtures/ant-design-masonry-prefix-isolated.json)

The fixture is `?fixture=masonry`. Engine, SSR, DOM lifecycle, package SSR,
and browser tests cover geometry, breakpoints, `fresh`, load and error
events, data and callbacks, motion, focus and selection, semantics and
configuration, themes, RTL, and cleanup. The prefix has separate browser
and SSR tests and a `?fixture=masonry-prefix` fixture.
[Browser tests](../../../tests/browser/masonry/masonry-prefix.spec.ts) · [SSR tests](../../../tests/package/masonry/masonry-prefix.ssr.test.ts)
