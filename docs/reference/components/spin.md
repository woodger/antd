# Spin

```svelte
<script lang="ts">
  import { Button, Input, Spin } from '@woodger/antd';

  let loading = $state(false);
  let draft = $state<string | undefined>('Anna');
</script>

<Button onclick={() => { loading = !loading; }}>Toggle loading</Button>
<Spin spinning={loading} delay={200} description="Updating profile…" aria-label="Profile">
  <label for="profile-name">Name</label>
  <Input id="profile-name" bind:value={draft} />
</Spin>
```

Without children, Spin renders a standalone indicator. `spinning` defaults to
`true`. With children, it preserves their DOM and local state between loads.
The owner manages requests, results, and cancellation. Spin displays the
supplied `spinning` state.

`delay` is in milliseconds and postpones only the indicator. Busy content
immediately becomes `inert` and receives `aria-busy=true` even when the
indicator is still hidden. A positive finite delay is rounded down and
capped at 2147483647. Negative values, `NaN`, and `Infinity` mean 0. For a
short load, the indicator stays hidden. Changing `spinning` or the normalized
delay cancels the timer and starts the new delay from the beginning, even
after the indicator has appeared. Changes in content, description, and size
leave the delay intact. Unmount cancels the timer. SSR creates no timers and
keeps the delayed indicator hidden.

`size` accepts `small`, `medium`, and `large`, whose dot sizes default
to 14, 20, and 32px. Without `size`, it uses
`ConfigProvider.componentSize`. `theme.components.Spin` changes these sizes
independently of other components. Spin supports themes, compact mode, primary
color, RTL, and dynamic `prefers-reduced-motion`. Reduced motion disables the
default animation and any CSS animations or transitions inside the
indicator. The owner of a custom Snippet manages its timers and SVG or
JavaScript animation. Wrapper height follows its content.

`description` accepts a string, number, or passive Snippet. `indicator` is
a passive Snippet that replaces the four dots. It receives
`{ percent, prefixCls, class, style }`. Existing Snippets without parameters
keep working. Svelte applies the dot class and semantic style to a decorative
`span` around the Snippet's content, since it has no equivalent to React's
`cloneElement` for the content. Strings are escaped. The indicator is
decorative, without controls or Tab stops. `id`, `class`, and `style` apply
to the root. A standalone indicator can be decorative via `aria-hidden`
when a text status is already present nearby.

The visible indicator has `role=status` with polite, atomic announcements.
The wrapper is a named group. Its status is next to the busy content,
outside the `inert` area. The announcement excludes the form. Set the name
with `aria-label` or `aria-labelledby`. By default it comes from a string
description or `locale.spin.loadingText`. Supply an informative accessible
name for a description Snippet. `ruRU` and `enUS` include `Загрузка…` and
`Loading…`, respectively. Partial `locale.spin` falls back to `ruRU` for
omitted fields.

If focus was inside the children when they became blocked, it temporarily
moves to the wrapper, which has `tabindex=-1` and is outside the regular
Tab order. When loading ends, focus returns to the previous accessible
control, falls back to an accessible control inside the children, then to a
nearby control in the current dialog or document. If the user has already
moved focus out, Spin leaves it there. If the focused wrapper unmounts, Spin
uses the saved accessible neighbors. The containing Modal or Drawer
continues to handle Escape. `ConfigProvider.disabled` leaves the feedback
visible.

Table uses a separate decorative Spin in its existing loading row. The
table retains its text status, `aria-busy`, blocked controls, and data
without an enclosing Spin.

`fullscreen` adds a fixed backdrop in the current DOM branch. It stays in
place, leaves the rest of the document interactive, and does not take focus.
With `spinning=false`, its root remains in the DOM with `opacity=0` and
`pointer-events=none`. A regular standalone Spin still uses `hidden`.
The same blocking and focus restoration rules apply to children.

`percent` accepts a number or `auto`. A number is limited to 0–100 for the
SVG ring, preserving the fractional part. At zero, the four dots are shown.
After the first nonzero `percent`, the ring remains mounted and is hidden on
return to zero. As in upstream, the SVG appears after mount and is absent
during SSR. `auto` updates every 200ms after the indicator appears. It
advances by 5%, 3%, or 1% of the distance to 100 at current values up to and
including 30, 70, and 96 respectively. It stops at 96.01238963686535. A new
visible loading cycle starts from zero. Switching to a number, stopping,
and unmounting clear the interval. Size, description, theme, and prefix
changes keep the automatic progress running without resetting it.

`ConfigProvider.spin` sets `indicator`, `class`, `style`, and object or
function `classNames` and `styles`. `undefined` inherits the full record.
An explicit object, including `{}`, replaces the parent record. The local
indicator takes precedence, followed by the provider and
`Spin.setDefaultIndicator(snippet)`. The static setter stores a module-level
fallback and accepts `null` or `undefined` to reset it. Mounted Spin
instances read the new value on their next prop update.

Semantic callbacks receive normalized `size`, `spinning`, `description`,
and `fullscreen`, and a numeric `percent`. Slots are `root`, `section`,
`indicator`, `description`, and `container`. Styles apply in this order:
provider `styles.root`, provider `style`, and local `styles.root`. A
standalone Spin then receives `section` styles. Local `style` comes last.
`rootClassName`, native attributes and events, `bind:nativeElement`, and
`bind:ref` with `nativeElement` are preserved on updates. Refs are cleared
on unmount.

`prefixCls` changes the BEM classes. `undefined` and the empty string inherit
`ConfigProvider.prefixCls` (`ant-spin` by default). The CSS template from
35 rules in the pinned bundle preserves the variable namespace and isolates
root defaults. The theme reference covers tokens, aliases, algorithms, and
CSS variables. [Spin tokens](../theme-context.md#spin-tokens)

The library owns comparisons for 49 upstream profiles and the `auto`
timeline. Consumer examples complement those checks. The native
implementations of delay, `inert`, focus, ARIA, and reduced motion are
documented differences from React. The shared ConfigProvider prefix is
supported. Porting React development warnings remains pending.
