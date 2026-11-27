# Tooltip

```svelte
<script lang="ts">
  import { Button, Tooltip, type TooltipRef } from '@woodger/antd';

  let open = $state(false);
  let tooltipRef = $state<TooltipRef>();
</script>

<Tooltip title="Save changes" bind:open bind:ref={tooltipRef} placement="top">
  <Button>Save</Button>
</Tooltip>
```

`title` accepts a string, number, boolean, passive Snippet, nested
arrays, or `null`. Legacy `overlay` takes precedence except when
`title=0`. Falsy `overlay` falls back to `title`. Booleans produce no
text. `true` and an empty array allow an empty tooltip to open.
`false` and `NaN` without a fallback disable it. A Snippet renders
inside an isolated popup context. Tooltip cannot determine in
advance whether it is empty. An empty string, whitespace,
`undefined`, and `null` retain native suppression of display and
the description link, which differs from upstream whitespace and
controlled empty titles. Numeric zero renders. Text is escaped.

`children` is a Snippet with one main DOM element such as Button,
Input, or a native button. It acts as the anchor and receives
`aria-describedby`. The wrapper preserves child handlers and adds
no Tab stop. Use a focusable child for keyboard access. Hover also
works around a disabled Button. ConfigProvider disabled state
leaves explanatory tooltips available.

`bind:open` shares visibility with the owner. Without binding,
Tooltip stores it locally. `defaultOpen` sets the initial state.
`onOpenChange(open)` runs on user opening and closing. External
`open` changes and initial state leave the callback uncalled. As
with other bindable props in the module, `open` follows Svelte
semantics. Use `bind:open` to synchronize with the owner.

`disabled` hides the tooltip and open class and retains raw
`open`. Trigger events and pending `mouseEnterDelay` continue
updating that state and calling `onOpenChange` as in rc-trigger.
Changing `disabled` itself does not call the callback. Re-enabling
can reveal an already open tooltip. `ConfigProvider.disabled`
keeps explanatory Tooltip available.

`id` sets the popup ID. The empty string uses a stable generated
fallback. With `fresh=false`, the hidden ID is cached with the
content and updates on opening. The existing native
`aria-describedby` link persists when closed. Disabled removes
only Tooltip's own link. Owner descriptions survive ID changes
and disabling.

`zIndex` sets inline popup `z-index`, including zero and negative
values. Provider root styles and local `styles.root` follow it.
When omitted, the layer comes from context or theme
`zIndexPopup`. Settings pass to single and range Slider and
Typography's ellipsis Tooltip. In Typography, ellipsis calculates
`disabled` and overrides tooltip options, as upstream.
[Nested popup layers](../theme-context.md#layering-nested-panels)

`bind:ref` supplies a `TooltipRef` after mount and clears on
unmount. `nativeElement` refers to the main DOM trigger, including
SVG. `popupElement` is the existing native `span` shell. Getters
reflect trigger replacement and popup container moves. The shell
is available before first open and with `destroyOnHidden`.
The original lazy `div` and its removal are independent of this
native lifecycle.

`tooltipRef?.forceAlign()` recalculates an open popup using the
current placement, arrow, and overflow controller. After changing
markup, call it after `await tick()` or in `$effect`. The method
creates no additional animation loop, leaves a closed or destroyed
popup closed, and leaves `onOpenChange` uncalled. DOM, input, focus,
and selection persist. Existing automatic anchor tracking
continues. Calls in one turn are combined into one microtask, as
in rc-trigger, and return `void`. The imperative call does not
subscribe `$effect` to internal Tooltip state.

As in the upstream interface, `TooltipProps` excludes the ref.
The full Svelte component type with its binding is
`ComponentProps<typeof Tooltip>`. DOM, ref, and layout comparisons
use `?fixture=tooltip-ref`. [Four UMD scenarios](../../../tests/browser/fixtures/ant-design-tooltip-ref-reference.json) ·
[SSR tests](../../../tests/package/tooltip/tooltip-ref.ssr.test.ts) · [Browser tests](../../../tests/browser/tooltip/tooltip-ref.spec.ts)

Without component configuration, `trigger` defaults to
`['hover', 'focus']`. Choose one event or pass an empty array
for programmatic visibility. `mouseEnterDelay` and
`mouseLeaveDelay` are in seconds and default to 0.1. Focus opens
immediately. Touch pointers do not simulate hover. Moving the
pointer onto the tooltip keeps it visible, and clicking it
preserves focus. Escape and outside click close it. After
Escape it stays hidden until another hover or focus. Inside
Modal, the first Escape closes Tooltip and the next closes Modal.

`showAction` and `hideAction` independently replace open and
close actions from `trigger`, including with `trigger=[]`.
`undefined` restores the corresponding trigger actions.
An empty array disables only that direction. `focusDelay` and
`blurDelay` are in seconds and default to 0 independently
of mouse delays. With the close action disabled, blur or leave
does not cancel pending opening. Replacing the action list
also leaves an ongoing delay intact.

With explicit action overrides, hover without click adds touch
for each direction independently, as in rc-trigger. Touchstart
toggles the enabled direction, and later hover events are
suppressed until a handled click. Upstream component
configuration also uses touch fallback. The existing native
default without new actions keeps touch hover suppressed.
With explicit overrides, outside dismissal uses mousedown or
contextmenu and requires hide click, hide contextMenu, or
implicit touch. `hideAction=[]` disables it. Escape still closes
an open tooltip. These settings also apply to Typography
ellipsis. Measured truncation still gates visibility, and
`onOpenChange` reports raw `open`. Controlled comparisons use
a getter and setter binding with rejected writes. Ordinary
`open` follows the existing Svelte semantics above.

Native blur without `relatedTarget` checks trigger availability
in the next microtask so removing focused DOM does not call
the callback. This differs from rc-trigger's synchronous
callback timing. Focus transitions with `relatedTarget` keep
the upstream timing. The fixture is `?fixture=tooltip-actions`.
[54 UMD scenarios and 310 frames](../../../tests/browser/fixtures/ant-design-tooltip-actions-reference.json) · [SSR tests](../../../tests/package/tooltip/tooltip-actions.ssr.test.ts)
· [Browser tests](../../../tests/browser/tooltip/tooltip-actions.spec.ts)

Hidden tooltip content is kept by default. `fresh=false` holds
the last displayed content and the inner container's semantic
class and style. `fresh=true` updates them with the popup
closed. Opening always takes the current value. Arrays are
snapshotted, including nested values. Outer root and arrow
styles and inherited CSS variables keep updating. The cache
retains the chosen Snippet, whose reactive values and effects
continue under Svelte semantics. Opaque captures retain their
reactivity beyond what React.memo freezes. The `fresh` policy
passes to Typography ellipsis and single and range Slider.
Typography retains bigint and whitespace support.

Without `forceRender`, `destroyOnHidden=true` removes content
on close and recreates it on open, resetting DOM and child
state. Toggling `destroyOnHidden` on an open tooltip preserves
DOM, input, and focus. Enabling it on a closed tooltip without
`forceRender` clears content immediately. With destruction
enabled, SSR skips the title Snippet even with initial
`open` or `defaultOpen`. The existing hidden native shell and
its ID and ARIA stay in place. Default SSR remains eager.
The same applies to Typography ellipsis and Slider tooltips.
Tooltip and Typography remove contents after closing finishes.
Slider tooltips keep their own immediate lifecycle.

`forceRender=true` mounts hidden content after hydration and
calls `getPopupContainer`, even before opening or while disabled.
It retains hidden content with `destroyOnHidden=true`. Turning it
off on a closed tooltip removes that content. A subsequent
forced mount gets the current payload, after which the `fresh`
cache applies. `forceRender` leaves the popup closed and
`onOpenChange` uncalled. The native shell remains. SSR with
`destroyOnHidden` stays lazy and does not call the portal getter.
The active range Slider retains one native shell before thumb
selection. Upstream's conditional composition is recorded
separately from that lifecycle. The fixture is
`?fixture=tooltip-lifecycle`.
[19 UMD scenarios and four consumer traces](../../../tests/browser/fixtures/ant-design-tooltip-lifecycle-reference.json) ·
[SSR tests](../../../tests/package/tooltip/tooltip-lifecycle.ssr.test.ts) · [Browser tests](../../../tests/browser/tooltip/tooltip-lifecycle.spec.ts)

Lifecycle comparisons use official runtime UMD CSS with motion
disabled. Upstream lazy mount before first opening is recorded
separately. The agreed native SSR and eagerly mounted default
content remain. The fixture is `?fixture=overlay-lifecycle`.
[44 UMD scenarios and 224 frames](../../../tests/browser/fixtures/ant-design-overlay-lifecycle-reference.json) ·
[SSR tests](../../../tests/package/popup/overlay-lifecycle.ssr.test.ts) · [Browser tests](../../../tests/browser/popup/overlay-lifecycle.spec.ts)

`title`, `overlay`, and `fresh` have additional comparisons at
`?fixture=tooltip-content`. The registry tracks the remaining
delegated props. [24 UMD content scenarios and 80 cache frames](../../../tests/browser/fixtures/ant-design-tooltip-content-reference.json)
· [SSR tests](../../../tests/package/tooltip/tooltip-content.ssr.test.ts) · [Browser tests](../../../tests/browser/tooltip/tooltip-content.spec.ts)

## Opening and closing completion

`onOpenChange(open)` reports a trigger request.
`afterOpenChange(open)` runs after visibility takes effect and
animation completes, including initial `defaultOpen`, external
`open` changes, and hiding through `disabled`. With no animation,
it follows the DOM update. A request rejected by the owner
through `bind:open` leaves visibility intact. If animation is
interrupted, the callback receives only the completed state.
`forceRender` prepares hidden content without
`afterOpenChange`.

By default, Tooltip uses CSSMotion `zoom-big-fast` with the
theme duration (100ms by default). The motion class prefix
comes from ConfigProvider.
`motion={{ motionName: 'my-motion' }}` supplies custom classes
for appear, enter, and leave. An empty name,
`theme.token.motion=false`, or `prefers-reduced-motion: reduce`
disables motion. A custom name without a completion event has
a 1000ms deadline.

The exiting panel stays in the top layer outside focus order.
In `afterOpenChange(false)`, it is hidden and its contents are
available through `popupElement`. With `destroyOnHidden` and
no `forceRender`, the Snippet is removed after the callback.
The hidden native shell and ID remain.

Tooltip, Popover, and Popconfirm have 19 scenarios from the
pinned React UMD, each measured twice.
[Reference](../../../tests/browser/fixtures/ant-design-overlay-motion-reference.json) · [Browser scenarios](../../../tests/browser/popup/overlay-motion.spec.ts) ·
[SSR test](../../../tests/package/popup/overlay-motion.ssr.test.ts)

## Shared tooltip for multiple triggers

```svelte
<Tooltip.UniqueProvider>
  <Tooltip title="Copy link"><button type="button">Copy</button></Tooltip>
  <Tooltip title="Open in a new window"><button type="button">Open</button></Tooltip>
</Tooltip.UniqueProvider>
```

The nearest provider shows one shared panel without an arrow.
When the trigger changes, the panel retains its DOM node while
the background animates to the new position and size. The
background and contents share one native popover surface.
When requested during opening motion, the group uses the last
target after that phase completes. If the pointer leaves both
targets, the group cancels the move and closes the panel. The
group uses the active owner's theme and prefixes. Popover and
Popconfirm join with explicit `unique={true}`. When switching
between a Tooltip and a card, the same `div` changes role from
`tooltip` to `dialog` and takes the new owner's name and ID.
`unique={false}` keeps a standalone Tooltip. The option is also
available in `Slider.tooltip` and `Typography.ellipsis.tooltip`.

A member receives `onOpenChange` at the usual trigger handling
stage. The group then applies its own `mouseEnterDelay` and
`mouseLeaveDelay`, as in Ant Design 6.6.8. The shared panel owns
its lifecycle and alignment. Custom `afterOpenChange` and
`onPopupAlign` apply to a standalone panel. The group retains
a hidden shell after first open and selects a container in
`body` or an open native dialog. `getPopupContainer`, `forceRender`,
and `destroyOnHidden` control the standalone panel when using
`unique={false}`.

In Svelte, `popupElement` returns the shared panel for the
current owner, and `aria-describedby` references its actual ID.
A Tooltip within Popover has its own panel and handles its
own Escape. Removing the active trigger releases the shared
panel. The background takes the active Tooltip's preset color.
The pinned React UMD differs in these three cases: its nested
tooltip skips display, a removed trigger leaves the old panel,
and `color="blue"` leaves `colorBgSpotlight` on the shared
background.

The snapshots record transitions, delays, and differences.
Chromium comparisons include separate hydration and public
API tests. [React UMD snapshots](../../../tests/browser/fixtures/ant-design-tooltip-unique-reference.json) · [Chromium](../../../tests/browser/tooltip/tooltip-unique.spec.ts)
· [Hydration](../../../tests/browser/tooltip/tooltip-unique-hydration.spec.ts) · [Public API](../../../tests/package/tooltip/tooltip-unique.ssr.test.ts)

Card scenarios have their own snapshots and Chromium comparison.
[React UMD snapshots](../../../tests/browser/fixtures/ant-design-tooltip-unique-delegates-reference.json) · [Chromium](../../../tests/browser/tooltip/tooltip-unique-delegates.spec.ts)

`placement` accepts `top`, `bottom`, `left`, `right`,
`topLeft`, `topRight`, `bottomLeft`, `bottomRight`,
`leftTop`, `leftBottom`, `rightTop`, and `rightBottom`.
Directions are physical and stay the same in RTL.
`arrow=false` hides the arrow. `arrow={{ pointAtCenter: true }}`
anchors the tip to the trigger center. Corner placements
with `pointAtCenter=false` or `arrow={{}}` keep the upstream edge
anchor. Local object `arrow` and object `autoAdjustOverflow`
enable the upstream calculation for all 12 placements,
including shifting centered positions. Without object props,
the four existing placements retain flipping toward more
space and shifting within the viewport. Corners use upstream
points, `visibleFirst`, and flipping on both axes without
shifting along the edge. The chosen flip persists until
close. The next open recalculates from scratch.
`autoAdjustOverflow=false` disables flipping and shifting.
The position updates on scroll, resize, and anchor movement
while open. `class` and `style` apply to the wrapper.

`align` is applied over the chosen placement entry. Nested
`overflow` is replaced in full. `builtinPlacements` replaces the
entire automatic map, including when empty. `points` sets the
popup and target points. `offset` is relative to the popup and
`targetOffset` to the target. It supports numbers, percentages,
and strings through `parseFloat`, including the upstream
interpretation of `5px` as 5. `TooltipAlignConfig` also includes
`htmlRegion`, `dynamicInset` and `_experimental.dynamicInset`,
and `autoArrow`. `useCssRight`, `useCssBottom`, `useCssTransform`,
and `ignoreShake` remain in metadata and are unused by
rc-trigger 3.10.1.

The placement class uses the first matching `points` in the
current map. It can have a custom key or no class. The
arrow uses the final points. Semantic `styles.arrow` and
`styles.root` take precedence over coordinates. Supplying
`align`, `builtinPlacements`, or `onPopupAlign` enables upstream
geometry and gap even without upstream theme settings.
Existing defaults apply when these props are omitted.

`onPopupAlign(node, info)` receives the actual popup and final
points after flipping, before new coordinates apply. It runs
on opening, actual geometry changes, and explicit `forceAlign`.
Calls to `forceAlign` in the same turn combine. Existing
native anchor tracking continues without callbacks on
unchanged animation frames. SSR and closed popups skip the
callback. Settings pass to Typography and single, active
range, and pinned range Slider. Box dimensions are explicit
in geometry comparisons. Native fixed top-layer and viewport
limits apply. Full CSS-transform and scroll-container
clipping are outside this comparison. The fixture uses
`?fixture=tooltip-align`. [38 UMD scenarios](../../../tests/browser/fixtures/ant-design-tooltip-align-reference.json) ·
[Numeric engine tests](../../../src/lib/tooltip/tooltip-align-reference.test.ts) · [SSR tests](../../../tests/package/tooltip/tooltip-align.ssr.test.ts) ·
[Browser tests](../../../tests/browser/tooltip/tooltip-align.spec.ts)

With upstream ConfigProvider theme settings, the panel uses
Tooltip tokens including `maxWidth`, `zIndexPopup`, arrow offsets
and shape, and component aliases and algorithm. The anchor gap
uses global `sizePopupArrow` and `marginXXS` as upstream,
typically 12px with an arrow and 4px without. Corners use
these defaults without an upstream theme. The four existing
placements retain an 8px gap in native themes. Object
`arrow` and `autoAdjustOverflow` use the upstream gap and global
`borderRadius` even without upstream settings. Component aliases
style the arrow while preserving its upstream anchoring.
[Theme reference](../theme-context.md#popup-tokens)

The surface uses native `popover="manual"` in the browser's
top layer. Without a container getter, the DOM stays in place.
Container overflow leaves it visible, and theme context and
dialog modality persist. It requires a browser with the Popover
API, as Table filters do. A hidden or offscreen anchor hides
the surface. Returning the anchor preserves external `open`.
During SSR the surface is hidden. Positioning and
`aria-describedby` connect after hydration. Adding the
description retains existing IDs and tracks changes. Cleanup
removes only the Tooltip ID.

The container resolves from `getPopupContainer` and then
`ConfigProvider.getPopupContainer`. `undefined` retains the
fallback. The getter receives the original DOM trigger,
including SVG, and runs only in the browser after opening.
A new function returning the same container preserves DOM,
state, focus, and selection. The portal carries inherited
variables and preserves precedence of its own component
tokens. Nested popups keep their own coordinates and arrow
color.

Strings, numbers, and rich Snippets are supported. Use the
provider for a shared panel. `autoAdjustOverflow` also accepts
`{ adjustX?: 0 | 1, adjustY?: 0 | 1 }`. Numeric 0 still allows
flipping, as in rc-trigger. Boolean `false` disables both
adjustments. [Tooltip.UniqueProvider](#shared-tooltip-for-multiple-triggers)

```svelte
<Tooltip title="Tooltip" placement="topLeft"
  arrow={{ pointAtCenter: true }} autoAdjustOverflow={{ adjustX: 1, adjustY: 1 }}>
  <button type="button">Details</button>
</Tooltip>
```

Local arrow and overflow comparisons cover token settings,
updates to an open card, both range Tooltip modes, and
retained drafts and focus. [84 UMD references](../../../tests/browser/fixtures/ant-design-overlay-options-reference.json) ·
[Unit tests](../../../src/lib/tooltip/tooltip-options-reference.test.ts) · [SSR tests](../../../tests/package/popup/overlay-options.ssr.test.ts) · [Browser tests](../../../tests/browser/popup/overlay-options.spec.ts)

Corner positions use the shared rc-trigger engine.
[rc-trigger engine](../../../src/lib/popup/popup-position.engine.ts)

Coordinates, arrow CSS, fractional sizes, flip history, and
placement changes are tested. Explicit sizes in some
references isolate positioning from other components'
layout. [99 UMD references](../../../tests/browser/fixtures/ant-design-overlay-corner-reference.json) · [Unit tests](../../../src/lib/tooltip/tooltip-corner-reference.test.ts) ·
[SSR tests](../../../tests/package/popup/overlay-corner.ssr.test.ts) · [Browser tests](../../../tests/browser/popup/overlay-corner.spec.ts)

## ConfigProvider and semantic slots

`ConfigProvider.tooltip`, `popover`, and `popconfirm` supply
`class`, `style`, `classNames`, `styles`, `arrow`, `trigger`, and
hover delays. An omitted object inherits. An explicit object,
including `{}`, replaces its parent. Local trigger and delays
take precedence. Zero is preserved and `undefined` inherits
the next layer. With `trigger=[]`, hover, focus, click,
and context menu events on the trigger and popup leave
visibility unchanged. This also works without component
configuration. Pointer leave and blur leave the panel open
and do not call `onOpenChange`. Content events still work,
and the context menu is not suppressed. Escape and outside
click close by the existing native rules. The empty trigger
rule also applies to Popconfirm, Typography ellipsis Tooltip,
and `AvatarGroup.max.popover`.

```svelte
<ConfigProvider tooltip={{ trigger: 'click', arrow: { pointAtCenter: true },
  class: 'help-popup', styles: { container: 'padding:12px' } }}>
  <Tooltip title="Tooltip"><button type="button">Details</button></Tooltip>
</ConfigProvider>
```

Component configuration enables upstream defaults:
`hover` for Tooltip and Popover, `click` for Popconfirm,
and upstream geometry for all 12 placements. In the
regular theme, the gap is 12px with an arrow and 4px without.
Without configuration, the existing hover and focus
defaults and native gap, flip, and shift for four
centered placements with boolean arrow and overflow remain.
A local boolean `arrow` controls visibility and preserves
inherited `pointAtCenter`. An object overrides only its
fields. Tooltip settings are separate from Popover and
Popconfirm. Popover defaults contribute to Popconfirm's outer
surface. Popconfirm's own trigger, delays, and arrow
visibility take precedence.

Hover, focus, click, context menu, and arrays of these are
supported. A repeated context menu toggles visibility, and
an ordinary click closes that surface. The browser context
menu is suppressed only with `contextMenu` enabled.
Positioning anchors to the trigger as in upstream Tooltip
without `alignPoint`. With upstream configuration, actions
are independent. An enabled hover can close a panel on leave
even if it was opened by click or focus. Events omitted from
`trigger` leave a programmatically opened surface unchanged.

Provider `class` and `style` apply to the popup. Existing local
`class` and `style` apply to the trigger wrapper.
`rootClassName` adds a popup class. `classNames` and `styles`
accept slot records or `({ props })` callbacks. Styles are
CSS strings. Tooltip supports `root`, `container`, and
`arrow`. Popover adds `title` and `content`, and Popconfirm
adds `icon`. Popconfirm title and content style the confirmation
heading and description. Callbacks see resolved trigger and
delays. Popover and Popconfirm also get placement, and Tooltip
gets original `builtinPlacements` and container getter.
In callbacks, `open` is the owner's original prop even when
uncontrolled visibility changes. Callbacks also run during
SSR before DOM is available.

Classes accumulate. CSS applies as context `styles`, context
`style` on the root, then local `styles`. The `color` layer
follows semantic container styles. The popup class comes
from `rootClassName` and `classNames.root`. Root styles have
precedence over calculated coordinates as in rc-trigger.
Updating them retains theme variables, DOM, input, selection,
and focus. Settings also reach Slider tooltips, AvatarGroup
overflow, and Typography ellipsis Tooltip. Without
configuration, Typography retains the upstream hover
trigger. It mounts its Tooltip lazily after DOM measurement
and skips semantic callbacks during SSR.

The limits of the `fresh` cache for Snippets and of CSS transforms
and clipping are described above.

## Tooltip, Popover, and Popconfirm colors

`color` accepts 13 Ant Design preset names or a CSS
background. Names are case-sensitive. `blue` uses the
Ant Design palette, and `Blue` uses the CSS named color.
`*-inverse` names get the upstream class, but Tooltip and
Popover 6.6.8 provide no fill for them. Preset CSS uses
current `--ant-<color>-6` values, including component
aliases and algorithm. Existing native themes keep their
palettes. The upstream theme uses original Ant Design tokens.

```svelte
<Tooltip title="Saved" color="#fadb14">
  <button type="button">Status</button>
</Tooltip>
<Slider defaultValue={40} tooltip={{ color: 'purple' }} />
```

With a custom background, Tooltip chooses black or white
text using upstream RGB luminance at a threshold of 0.5.
Alpha is ignored. The parser leaves CSS variables unresolved
when calculating contrast, while the browser uses them
for rendering. Popover and Popconfirm keep their upstream
title and content colors. Semantic text `color` can override
them.

The color background applies after container styles. Root
styles can override arrow color. For a preset Tooltip, the
variable is set on the arrow and can be changed with
`styles.arrow`. The raw background is one CSS value. A
reactive invalid value can retain the old background as
in React's style setter. Removing the shorthand preserves
upstream style diffing.

Color also applies to `AvatarGroup.max.popover` and both
Slider Tooltip modes. Updating an open panel preserves
DOM, input, selection, and focus. The parent panel's internal
contrast value is left out of body portals and isolated in a
nested native Tooltip without a getter. An explicit container
within the parent panel inherits it as in upstream
`getPopupContainer`.

## Local prefixes and open trigger classes

`prefixCls` changes Tooltip and Popover classes for slots,
placements, and preset colors. Without a local prefix or with
an empty string, it inherits `ConfigProvider.prefixCls`.
The defaults are `ant-tooltip` and `ant-popover`.
Popconfirm defaults to `ant-popconfirm`. Its local prefix
changes only confirmation classes, while the outer Popover
inherits the shared prefix independently, as upstream. CSS
variables and global `.anticon` keep their names. This setting
is independent of `theme.cssVar.prefix`. Compatible aliases
and existing native markers and hash remain part of the
Svelte adaptation.

```svelte
<Popover prefixCls="project-card" title="Settings" content="Saved">
  <button type="button">Show</button>
</Popover>
```

`openClassName` supplies the open trigger class and can contain
multiple tokens. Omission or an empty string defaults to
`${prefixCls}-open`, or `ant-popover-open` for Popconfirm.
The class is added to the actual DOM trigger after hydration.
The child's own classes are retained. Closing and unmount
remove only tokens added by the component. Updating the caller
class during display preserves the open class. SSR leaves the
opaque children Snippet intact and retains the hidden shell,
stable IDs, native wrapper, and ARIA.

Settings also apply to `AvatarGroup.max.popover`, `Slider.tooltip`,
and Typography ellipsis Tooltip. The last passes color and
semantic styles to the shared popup. Changing prefix preserves
DOM, input, selection, and focus. The stylesheet is removed
with its owner. Portal and native viewport limits remain,
including the Popover title on a narrow screen and AvatarGroup
focus restoration.
