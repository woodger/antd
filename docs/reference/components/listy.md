# Listy

Listy displays a grouped list with sticky headers and virtual scrolling.

```svelte
<script lang="ts">
  import { Listy, type ListyRef } from '@woodger/antd';
  const items = [
    { id: 'one', team: 'A', name: 'Alpha' },
    { id: 'two', team: 'B', name: 'Beta' },
    { id: 'three', team: 'A', name: 'Gamma' }
  ];
  let list = $state<ListyRef>();
</script>

{#snippet title(team: string, members: typeof items)}
  <strong>{team} ({members.length})</strong>
{/snippet}
<Listy {items} rowKey="id" height={240} virtual sticky
  group={{ key: item => item.team, title }} bind:ref={list}>
  {#snippet itemRender(item, index)}<a href={`#${item.id}`}>{index}: {item.name}</a>{/snippet}
</Listy>
<button onclick={() => list?.scrollTo({ key: 'three', align: 'top' })}>Show Gamma</button>
```

The source types define the exact props, semantic slots, and refs. Items accepts
a readonly array. RowKey is required. Grouping spans the full array in order
of each group's first appearance, including interleaved entries. Title receives
the original group objects, and itemRender gets the original entry index.
Keys preserve zero and the empty string. Duplicate keys keep the records and
use internal occurrence keys to avoid a Svelte error. Use unique keys for
correct identity. [Source types](../../../src/lib/listy/listy.types.ts)

Virtual resolves as `local ?? ConfigProvider.virtual ?? false`. Without a nonzero
height, the virtual branch renders all rows. Height=0 in raw mode collapses the
viewport. The virtual window uses the upstream height estimate, row measurements
with margins, overscan, and a keyed cache. It supports variable heights, resize,
data replacement and shortening, wheel, nested lists, touch momentum, selection
drag, and a scrollbar with track clicks, dragging, and delayed hiding. Switching
raw or virtual mode creates a new branch with its own scroll state and cache,
as in React.

The ref only exposes scrollTo. A number or `{ top, left }` specifies position.
`{ key }` and `{ groupKey }` support top, bottom, auto, and offset. Raw mode uses
native scrollIntoView with temporary scroll margins. A group refers to an
entire section. In virtual mode, a group refers to its header row. Alignment
repeats after measurement. A sticky offset applies to top, including auto
resolved to top. A height estimate is used before the header is measured.
A missing key preserves the position, and the virtual branch retries it
during data updates. A missing argument or null leaves raw mode alone and
shows the virtual scrollbar. When both keys are supplied, raw mode chooses
the item and virtual mode the group. Horizontal virtualization is outside
the Listy API.

ConfigProvider.listy sets class, style, and root, item, and groupHeader semantic
slots. Local slots extend classes and override styles. Style overrides styles.root.
The callback gets raw props before defaults and context. Generic metadata
callbacks are typed unknown. The virtual root enforces position:relative,
and the sticky clone's top overrides a user-supplied top.

A nonempty prefixCls sets local classes. Empty and undefined inherit
ConfigProvider.prefixCls. Raw and virtual roots, items, groups, sticky headers,
and scrollbar use one prefix. Scoped CSS reproduces 16 upstream rules.
Canonical token markers and variables and the rc-virtual-list scrollbar variable
stay in place. A prefix change preserves DOM, refs, measurement cache, scroll,
a row editor, draft, focus, and selection. The fixture is `?fixture=listy-prefix`.
[UMD](../../../tests/browser/fixtures/ant-design-listy-prefix-reference.json) · [Browser](../../../tests/browser/listy/listy-prefix.spec.ts) · [SSR](../../../tests/package/listy/listy-prefix.ssr.test.ts)

OnScroll and native onscroll receive a native UIEvent whose currentTarget is
the raw root or virtual holder. Bind:ref and bind:nativeElement become available
after mount and clear on unmount. Timers, observers, and the sticky clone start
only after mount. Native links, controls, selection, and focus are preserved.
RTL, dark, compact, and reduced motion are supported. Row selection, application
navigation, and empty content belong to the consumer.

ItemRender links use upstream color, decoration, hover, active, focus, and
inline precedence. The shared link reset applies inside Listy and keeps the
existing native focus-visible ring and external links intact. [Link reset](../../../src/lib/vendor/list-link-reset.css)

`theme.components.Listy` applies `itemPaddingBlock`, `itemPaddingInline`,
font, color, and spacing aliases and algorithms to raw and virtual branches.
The upstream estimated row height is fontHeight plus twice the vertical
padding, excluding lineWidth. DOM measurement refines actual heights. Explicit
undefined padding uses the upstream fallback for estimation. Theme LineHeight
applies before semantic and local styles. The earlier CSS and height estimates
remain in effect without an upstream theme. Theme updates preserve DOM, drafts,
selection, focus, refs, and the live measurement cache. Named CSS variables,
nested, reset, and sibling scopes, dark, compact, and RTL are supported.

Virtual-list 1.5.1 omits the `itemHeight` dependency in `useMemo`. When semantic
styles leave visible row heights unchanged, the new estimate reaches the
offscreen portion only after another list change. The native implementation
updates immediately, matching a fresh upstream mount. The reference records
2555→2555px and a fresh 2835px result in `staleEstimateObservation`.
That upstream difference remains recorded separately.

React development warnings are outside the port. The main fixture is `?fixture=listy`.
[Engine](../../../src/lib/listy/listy.engine.test.ts) · [Public package and SSR](../../../tests/package/listy/listy.ssr.test.ts) · [Browser](../../../tests/browser/listy/listy.spec.ts)
Theme, visible window, and virtual content height are checked against the
official UMD at `?fixture=listy-theme`. [Official UMD](../../../tests/browser/fixtures/ant-design-listy-theme-reference.json) · [Unit](../../../src/lib/theme/theme-listy-tokens-reference.test.ts) ·
[SSR](../../../tests/package/listy/listy-theme.ssr.test.ts) · [Browser](../../../tests/browser/listy/listy-theme.spec.ts)
The CSS recipe reproduces 16 rules without keyframes. The package includes
MIT licenses for Listy and virtual-list. [CSS recipe](../../../tools/ant-design-css-recipes.json) · [CSS rules](../../../src/lib/vendor/listy.css) ·
[Listy MIT license](../../../src/lib/vendor/LICENSE.rc-listy) · [Virtual-list MIT license](../../../src/lib/vendor/LICENSE.rc-virtual-list)
