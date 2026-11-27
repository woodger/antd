# Wave effect

Wave adds a decorative ripple when users interact with Button, Checkbox, Radio,
RadioButton, Switch, an interactive Tag, or Steps with `onChange`. It preserves
native controls, callbacks, forms, and focus order. Wave creates its DOM only
in the browser.

Set the effect through `ConfigProvider.wave`. [WaveConfig and WaveEffectInfo](../../src/lib/wave/wave.types.ts)

```svelte
<script lang="ts">
  import { Button, ConfigProvider } from '@woodger/antd';
</script>

<ConfigProvider wave={{ triggerType: 'pointerdown' }}>
  <Button type="primary">Действие</Button>
</ConfigProvider>
```

## Settings and events

The default event is click. The effect also supports mousedown, mouseup, pointerdown,
and pointerup. The listener runs in the capture phase. Multiple events in the same
animation frame produce one effect using the last event. Settings update reactively.
`disabled=true` disables only the wave and keeps the control callbacks.

A provider with no `wave` setting inherits the parent record. An explicit object
replaces the record in full. `wave={}` restores the default effect and click even
inside a provider with `showEffect`.

`showEffect(element, info)` replaces the default wave. The element is the selected
target. The info contains the current full GlobalToken, component, className and
hashId, colorSource, and a native MouseEvent or PointerEvent. `currentTarget` follows
native event semantics after the deferred call. Custom effects own their cleanup.

## Component rules

| Component | Target and conditions |
| --- | --- |
| Button | Native button. href and the text and link variants are excluded. Loading and disabled states prevent the wave. |
| Checkbox | Inner ant-wave-target. The default effect runs only when checked. |
| Radio | Inner ant-wave-target with a quick effect. |
| RadioButton | Entire label button with the regular effect. |
| Switch | Native button. Disabled and loading states prevent the wave. |
| Tag | Root when it has onClick or onclick, or when its only direct child is an anchor. |
| Steps | Item icon with ant-wave-target, or the item root. Requires a shared onChange and an enabled item. |

For Checkbox, the default effect filters on the checked state. `showEffect` also
receives unchecking. Filled Steps passes `colorSource=color`. CheckableTag follows
upstream and has no wave. Closing Tag preserves stopPropagation and leaves its
onClick untouched. For opaque Svelte snippets in Tag, the effect tests the
rendered direct children because Svelte has no React `children.type`.

FloatButton, FloatButtonBackTop, and the FloatButtonGroup trigger inherit Wave
through the shared Button. Their `info.component` is Button, as in upstream
composition. The confirm buttons in DatePicker, RangePicker, TimePicker, and
TimeRangePicker also get their wave from Button and preserve the native picker
lifecycle. Changing Button's variant or removing a handler or link from Tag
disables Wave and clears a pending or active effect. The Svelte control keeps
its native root.

Hidden event targets, disabled or aria-disabled targets, and leaving roots
prevent the wave. The upstream exception for utility classes containing
`disabled:` is preserved.

## Geometry, color, and cleanup

Color comes from colorSource, then border-top-color, border-color, and
background-color. The white and transparent exclusions follow the upstream
predicate without normalizing the color. CSS uses the inherited colorPrimary
when none of those values is suitable. The effect reads the border radius,
border offsets, and dimensions after the action. A ResizeObserver tracks
target size changes.

The regular wave uses box-shadow at 0.4s and opacity at 2s. The quick Checkbox
and Radio waves use motionDurationSlow. As in the official UMD, `token.motion=false`
sets the quick duration to zero and leaves the regular fixed durations in effect.
The pinned CSS has no separate Wave override for prefers-reduced-motion.
Use `wave.disabled` to disable the effect completely.

Two animation frames separate start and active. The wave is removed when its
own opacity transition ends. Box-shadow transitions and child element events
leave it in place. The upstream 5000ms deadline removes the effect if transitionend
never arrives. On unmount, pending animation frames, timers, observers, and the
holder DOM are cleaned up. Each repeated effect has its own lifecycle.

## Sources and checks

The port includes the wave module, integration points for six upstream families,
and timing from @rc-component/motion 1.3.3. Colors and behavior were also compared
with the official antd.min.js. The port is independent of React and its runtime
dependencies. The wave recipe extracts eight CSS rules without keyframes from the
verified npm archive. [Upstream wave module](https://github.com/ant-design/ant-design/tree/984592267de88fbf9cdaecc96a56629e721c709d/components/_util/wave) ·
[vendor/wave.css](../../src/lib/vendor/wave.css)

- [Color selection](../../src/lib/wave/wave.engine.test.ts)
- [Public package SSR](../../tests/package/wave/wave.ssr.test.ts)
- Events, geometry, and lifecycle on Chromium at `?fixture=wave`. [Browser tests](../../tests/browser/wave/wave.spec.ts)
- The pinned current AliasToken reference supplies the public keys. The checks
  include component entries and exclude the private cache key. [Token key reference](../../tests/browser/fixtures/ant-design-wave-token-keys-reference.json)

Licenses for [Ant Design](../../src/lib/vendor/LICENSE.ant-design),
[rc-util](../../src/lib/vendor/LICENSE.rc-util), and [rc-motion](../../src/lib/vendor/LICENSE.rc-motion).
