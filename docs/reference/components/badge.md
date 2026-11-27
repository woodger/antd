# Badge

```svelte
<script lang="ts">
  import { Badge, Button } from '@woodger/antd';

  let unread = $state(120);
</script>

<Badge count={unread}>
  {#snippet children({ descriptionId })}
    <Button aria-describedby={descriptionId}>Notifications</Button>
  {/snippet}
</Badge>
<Badge count={0} showZero size="small" />
<Badge status="processing" text="Service running" />
```

Badge accepts `count` and an optional children Snippet. `count`
can be a number, string, boolean, `null`, or Snippet. Without
children, the indicator stays in flow. Defaults are
`overflowCount=99`, `showZero=false`, `dot=false`, and `size=medium`.
Size is independent of `componentSize`. A value over the limit
displays as `99+` by default. Finite negative and fractional
numbers are preserved. `NaN` and infinity count as absent.
A negative or nonnumeric overflow limit uses 99. A finite
nonnegative `overflowCount`, including 0, is valid. Input values
are left intact.

Strings retain their original spelling, including leading
zeros, negative numbers, and spaces. Overflow uses numeric
comparison as upstream. `'100'` gives `99+`, and `'001'` stays
`001`. Only the exact string `'0'` triggers the zero rule.
`'00'` and `'0.0'` are visible. Integer-valued numeric strings
render through ScrollNumber's original character slots. The
empty string and `false` produce no count without text or dot.
`null` means no count. Boolean `true` displays as `true` as in
upstream ScrollNumber. Full strings stay in the title and
accessible description even on overflow.

Integers and numeric strings scroll using the original
SingleNumber algorithm. Direction follows changes in the
absolute count. Transitions between 9 and 0 and changes in
length retain digits by position from the right. Signs and
nonnumeric characters stay static. Rapid changes use the
previous value and count as upstream. An unchanged digit on its
own does not update the previous count. `transitionend` finishes
the move, with a 1000ms fallback if the event does not arrive.
The timer is cleared when a digit's numeric value changes or
the digit is removed. SSR renders initial settled units without
timers. Browser mount retains their DOM. Reduced motion disables
transitions. With the existing numeric API, offset changes
immediately. The native outer ScrollNumber offset is independent
of digit motion. The fixture is `?fixture=badge-digit-motion`.
[18 UMD sequences and 68 frames](../../../tests/browser/fixtures/ant-design-badge-digit-motion-reference.json) · [Engine tests](../../../src/lib/badge/badge-digit.engine.test.ts) ·
[Browser tests](../../../tests/browser/badge/badge-digit-motion.spec.ts) · [SSR tests](../../../tests/package/badge/badge-digit-motion.ssr.test.ts)

Entry and exit follow CSSMotion. The initial visible count does
not animate. Subsequent changes go through start and active,
and showing the count again interrupts exit. The indicator
retains its last visible count, dot, and title during exit. An
explicit title keeps updating. The indicator's own
`animationend` or `transitionend` finishes the animation.
Events from inner digits are ignored. The fallback fires 1000ms
after active. An early end preserves previous markup until
activation, as upstream. Standalone status bypasses this
lifecycle. `theme.token.motion=false` and reduced motion disable
new animations. Enabling reduced motion finishes the current
animation. Unmount cancels frames, timers, and listeners.
The description and `descriptionId` disappear immediately,
independently of the retained decorative indicator. The fixture
is `?fixture=badge-zoom`. [17 UMD sequences, 87 frames, and SSR](../../../tests/browser/fixtures/ant-design-badge-zoom-reference.json)
· [Browser tests](../../../tests/browser/badge/badge-zoom.spec.ts) · [SSR tests](../../../tests/package/badge/badge-zoom.ssr.test.ts)

```svelte
<script lang="ts">
  import { Badge, type BadgeCountContext } from '@woodger/antd';
</script>

{#snippet clock(attributes: BadgeCountContext)}<span {...attributes} aria-label="Waiting for a reply">◷</span>{/snippet}
<Badge count={clock}><a href="/messages">Messages</a></Badge>
```

A count Snippet receives `BadgeCountContext` with `class` and
`style`. Apply both to its root. With custom styling, merge
classes in an array and put the context CSS string before your
own. This replaces `React.cloneElement` with explicit attributes
for the opaque Snippet. There is no extra wrapper, so automatic
positioning requires these attributes. `style` contains offset,
`ConfigProvider.badge.style`, and `Badge.style`. The Snippet's
root style takes precedence. As upstream, dot leaves custom
count content intact.

An empty Snippet still counts as supplied and prevents status
fallback. The Snippet owns its accessibility and interactivity.
Badge leaves the controls accessible and adds no generic
“Updates available” description. Offset and theme changes retain
the Snippet's DOM, state, and focus. Hiding count retains content
for the exit. Zoom classes pass through context. As with an
upstream custom count without a CSSMotion DOM ref, completion
uses a deadline. The cache retains the Snippet reference and
its own reactive dependencies continue updating.

A zero count is hidden unless `showZero` is on. As in Ant Design
6.6.8, dot with `count=0` is hidden and with `showZero` displays
the number 0. Dot is visible without a count. Standalone status
is visible with a missing or hidden zero count. With children,
a status dot needs `dot` or a visible count or text. A visible
numeric count takes precedence over status styling.
`text='0'` and `text=0` follow the zero rule even with a nonzero
count. A Snippet counts as content regardless of output.

Statuses are `success`, `processing`, `default`, `error`, and
`warning`. The 13 preset colors are `blue`, `purple`, `cyan`,
`green`, `magenta`, `pink`, `red`, `orange`, `yellow`, `volcano`,
`geekblue`, `lime`, and `gold`. CSS colors, variables, and background
gradients are supported. A custom color sets the background
on a regular indicator and both background and color on a
standalone status dot. Preset color takes precedence over
status. `text` accepts a string, number, boolean, `null`, or
Snippet. A number is independent of `count` and
`BadgeContext.count`. `true` counts as present without rendering a
label. `false` and `null` are empty. `text=0` displays only with
`showZero`. Badge sizes are `small` and `medium`.

`offset` is a readonly `[x, y]` pair of numbers or strings.
`y` sets `margin-top`. Positive `x` shifts outward from the
logical end and mirrors in RTL. A non-finite numeric coordinate
uses 0 independently of the other coordinate. String `x` uses
`parseFloat`, so `'10.5px'` gives 10.5 and `'1e2'` gives 100.
String `y` retains CSS units including em, %, calc, and var.
`'20'` stays unitless. A regular indicator and standalone
status apply raw offset as individual DOM properties. An
invalid new value leaves the old coordinate intact, as in
React. Custom count retains offset in the BadgeCountContext
CSS string. Badge inherits theme and RTL. Native compact mode
keeps its own Badge sizes.

Upstream `theme.components.Badge` applies the original count,
dot, and status sizes, font, and padding. Defaults are
recalculated from global and component aliases and algorithms.
The shadow uses `colorBorderBg`. Numeric `indicatorZIndex` and
`textFontWeight` are serialized with `px`, as in 6.6.8. Use
strings for unitless values. Settings apply during SSR, with
custom `cssVar.prefix`, and during reactive updates.
[ConfigProvider theme tokens](../theme-context.md)

A regular numeric or string indicator is hidden from screen
readers. A nearby hidden text node provides the full value,
including for `99+` and dot. The children Snippet receives
`BadgeContext` with a normalized numeric `count` and
`descriptionId`, which the owner can use to describe a button,
link, or other control. String and Snippet counts give
`count=undefined`. A Snippet count receives no automatic
`descriptionId`. Hiding the indicator clears `descriptionId`
to `undefined`. Children stay in the DOM as count changes,
retaining focus, state, and native events. Badge adds no Tab
stops, live region, or automatic announcements.
`aria-label` or `aria-labelledby` names an optional group.
`aria-describedby` applies to the root. Full value and status
labels are translated through partially inherited
`locale.badge`. `title` defaults to the full count. `false`
and `null` remove the native tooltip, and a string replaces it.
`class` and `style` apply to the root. Offset applies to the
indicator, or to the root for standalone status, as upstream.

`ConfigProvider.badge` supplies `class`, `style`, and semantic
`classNames` and `styles`. `class` and `rootClassName` apply to the
root. `classNames` and `styles` accept an object or function of
`{ props }` with resolved `size`, `overflowCount`, `dot`, and
`showZero`. Slots are `root` and `indicator`. Context and local
classes combine. Regular indicator style order is offset,
context indicator, context `style`, local indicator, and
custom color. `border-color` creates an inset ScrollNumber
shadow overriding `box-shadow`. For standalone status, context
`style` applies to the root. Status text color comes from
semantic root and context `style`. Custom color overrides both
dot colors. Custom count receives only legacy context style
and offset via `BadgeCountContext`. It leaves the semantic
indicator unused, as upstream ScrollNumber. An empty
`ConfigProvider.badge` replaces the parent configuration.

```svelte
<Badge count="12" color="#2db7f5"
  styles={{ root: 'margin-inline:8px', indicator: 'border-color:#fff' }} />
```

`Badge.style` still applies to the root. Use `styles.indicator`
for regular indicators. `Badge.style` also stays part of
`BadgeCountContext` for custom count. The existing numeric
layout without new APIs is preserved. `ConfigProvider.badge`,
semantic props, `rootClassName`, custom CSS color, and new scalar
text and string offset enable the upstream layout.
`bind:nativeElement` supplies the root `HTMLSpanElement` and
clears on unmount. Native span attributes and events pass to
the root. `onclick` takes precedence over React-compatible
`onClick`. Prop and config updates preserve DOM, state, selection,
and focus. The fixture is `?fixture=badge-api`. [49 UMD variants and updates](../../../tests/browser/fixtures/ant-design-badge-api-reference.json)
· [Browser tests](../../../tests/browser/badge/badge-api.spec.ts) · [SSR tests](../../../tests/package/badge/badge-api.ssr.test.ts)

The count fixture is `?fixture=badge-count`. The existing numeric
mode without new APIs keeps native normalization, BadgeContext,
root style, and standalone and non-status text styling, which
differ from React. [46 official UMD snapshots](../../../tests/browser/fixtures/ant-design-badge-count-reference.json) ·
[Browser tests](../../../tests/browser/badge/badge-count.spec.ts) · [SSR tests](../../../tests/package/badge/badge-count.ssr.test.ts)

The value fixture is `?fixture=badge-values`.
[58 UMD variants and reversible updates](../../../tests/browser/fixtures/ant-design-badge-values-reference.json) ·
[Browser tests](../../../tests/browser/badge/badge-values.spec.ts) · [Engine tests](../../../src/lib/badge/badge.engine.test.ts) · [SSR tests](../../../tests/package/badge/badge-values.ssr.test.ts)

`prefixCls` changes Badge, status and text, and zoom classes.
The empty string inherits `ConfigProvider.prefixCls`
(`ant-badge` by default). For a local prefix, Badge emits a head
stylesheet from the pinned CSS template. Styles update with
the prefix and clear on unmount, preserving the root, digits,
and caller controls. `scrollNumberPrefixCls` changes classes of
the `sup`, custom count, and digits. Otherwise it inherits
`ConfigProvider.prefixCls` (`ant-scroll-number` by default).
Badge CSS uses the shared prefix for ScrollNumber as upstream.
An arbitrary `scrollNumberPrefixCls` alone generates no CSS
for its classes, affecting standalone positioning, overflow,
and digit styles. The shared prefix applies to count and digit
classes and CSS. Digit reduced motion is independent of prefix.

The prefix fixtures are `?fixture=badge-prefix` and
`?fixture=badge-prefix-motion`. [31 UMD class, style, and geometry variants](../../../tests/browser/fixtures/ant-design-badge-prefix-reference.json)
· [Six zoom sequences and 30 frames](../../../tests/browser/fixtures/ant-design-badge-prefix-motion-reference.json) ·
[Browser tests](../../../tests/browser/badge/badge-prefix.spec.ts) · [Motion tests](../../../tests/browser/badge/badge-prefix-motion.spec.ts) ·
[SSR tests](../../../tests/package/badge/badge-prefix.ssr.test.ts) · [Motion SSR tests](../../../tests/package/badge/badge-prefix-motion.ssr.test.ts)

`processing` uses the original CSS pulse, disabled under reduced
motion. Exports are `BadgeProps`, `BadgeStatus`, `BadgeColor`,
`BadgeSize`, `BadgeText`, `BadgeOffset`, `BadgeCount`,
`BadgeCountContext`, `BadgeContext`, `BadgeConfig`, `BadgeSlots`,
`BadgeSemantic`, and `BadgeLocale`.
