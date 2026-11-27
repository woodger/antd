# Popover

```svelte
<script lang="ts">
  import { Button, Popover } from '@woodger/antd';

  let open = $state(false);
</script>

{#snippet content()}
  <p>Настройки сохранены.</p>
  <Button onclick={() => { open = false; }}>Закрыть</Button>
{/snippet}

<Popover title="Настройки" {content} trigger="click" bind:open>
  <Button>Открыть настройки</Button>
</Popover>
```

`title` and `content` accept a string, number, or Svelte Snippet.
Zero renders and strings are escaped. `false` omits the section.
`true` creates an empty section, as in upstream
`isReactRenderable`. `children` is a Snippet with one main DOM
element, such as Button or a native button. It acts as the
anchor and receives `aria-haspopup=dialog`, `aria-controls`, and
`aria-expanded`. Use a focusable element for keyboard access.
The card has `role=dialog` and a name from `title`. Set
`aria-label` when there is no title. The dialog remains nonmodal.

`bind:open`, `defaultOpen`, and `onOpenChange(open)` follow the
Svelte model as in Tooltip. `defaultOpen` is read once. External
`open` changes and initial state do not call the callback.
Child handlers are preserved. Without explicit `showAction` or
`hideAction`, `preventDefault` in the child's `onclick` cancels
opening by click.

Without component config, `trigger` defaults to
`['hover', 'focus']`. It accepts `click`, `hover`, `focus`,
`contextMenu`, arrays of these, and an empty array for
programmatic visibility. `mouseEnterDelay` and `mouseLeaveDelay`
are seconds and default to 0.1. Focus opens the card immediately.
Touch does not simulate hover. In the existing native mode
(hover, focus, or click without component config), hovering over
the card or focusing inside it keeps it visible. When click is
combined with hover or focus, the first click pins the open
card and the next closes it.

In that mode, opening by click, Enter, or Space moves focus to
the first accessible control in the content. The surface
receives focus for a text-only card. Opening by hover, focus,
or external `open` leaves current focus in place. Tab and
Shift+Tab follow DOM order among the trigger, content, and
nearby controls. In native mode, moving focus outside both
the card and trigger closes it if hover is inactive. Escape
closes the card and returns focus from the content to the
trigger. Clicking outside keeps focus on the selected external
element. Closing via `bind:open` restores focus if it was
inside the card.

`unique={true}` joins the nearest Tooltip.UniqueProvider.
The group moves one `div` and its background between owners.
The panel retains its dialog role, accessible name, and focus
management. The current owner receives `aria-controls` and
`popupElement` after first display. In the group, `onOpenChange`
reports trigger requests. The provider controls alignment,
portal, the absence of an arrow, and retention while hidden.
By default and outside a provider, Popover has its own surface.
[Tooltip.UniqueProvider](./tooltip.md#shared-tooltip-for-multiple-triggers)

A function binding can reject changes to `open`. A rejected
close preserves focus and the active ways of keeping the card
open. With component config or `contextMenu`, click opening
retains current focus as upstream, and trigger combinations
follow upstream configuration rules.

`showAction` and `hideAction` independently replace trigger
events. `focusDelay` and `blurDelay` are in seconds and default
to 0 independently of hover delays, as in Tooltip. An empty
`hideAction` disables trigger and outside dismissal and
preserves Escape and content actions. Explicit lists use
upstream click, context menu, and touch fallback behavior.
Click leaves focus outside the popup and is unaffected by
`preventDefault` in a child handler. Focus inside the panel
does not cancel a delayed close. Trigger blur follows
`hideAction` even when focus enters content. Without overrides,
the existing native focus transfer and retention apply. Blur
without `relatedTarget` waits a microtask to check connectivity
and cleanup. Focus restoration before hiding or removing
content is a native adaptation. Updating or removing action
props leaves an already running delay intact. Uncontrolled
`open` persists across spread prop updates. [Tooltip](tooltip.md#tooltip)

`Popover.disabled` hides the panel and open class while
preserving raw `open`, callbacks, and pending events. Changing
`disabled` itself does not call `onOpenChange`. Re-enabling can
reveal an already open panel. The references include Popconfirm
and settings passed through `AvatarGroup.max.popover`. Controlled
cases use getter and setter bindings that reject writes. Ordinary
`open` follows the Svelte model. The fixture is
`?fixture=popover-actions`. [67 UMD scenarios, 389 frames, and six cleanup traces](../../../tests/browser/fixtures/ant-design-popover-actions-reference.json)
· [SSR tests](../../../tests/package/popover/popover-actions.ssr.test.ts) · [Browser tests](../../../tests/browser/popover/popover-actions.spec.ts)

`placement` accepts the same 12 positions as Tooltip.
`arrow=false` hides the arrow. By default,
`autoAdjustOverflow` flips and shifts the surface at a viewport
edge. `false` retains the requested placement. Position updates
on scroll, resize, anchor movement, and content size changes.
Position changes retain current input, selection, and focus.
`class` and `style` apply to the wrapper. It supports
ConfigProvider themes, compact mode, RTL, and
`prefers-reduced-motion`. `popupClass` applies to the surface.
`aria-labelledby`, `aria-describedby`, and `aria-busy` can link
the surface to its containing component. `aria-label` takes
precedence for naming.

`align`, `builtinPlacements`, and `onPopupAlign` follow Tooltip.
`align` overrides the selected entry, the map is replaced in
full including `{}`, and the placement class uses the first
matching `points`. The callback receives the actual Popover
surface and the resolved alignment before new coordinates
apply. Semantic root and arrow styles keep precedence.
These settings enable upstream geometry even without
component config. They pass through Popconfirm and
`AvatarGroup.max.popover`. Omitting the new props retains
existing defaults. [Tooltip alignment](tooltip.md#tooltip)

In 6.6.8 with rc-trigger 3.10.1, changing `align` or an
existing placement entry leaves old geometry until
`forceAlign` or another alignment event. The reference records
states before and after `forceAlign` for separate analysis.
Svelte continues to track new props automatically and preserves
drafts, selection, and focus. Fixed and top-layer positioning,
viewport, CSS transform, and scroll-container limits remain
the same as for Tooltip. The fixture is `?fixture=popover-align`.
[84 UMD scenarios](../../../tests/browser/fixtures/ant-design-popover-align-reference.json) · [SSR tests](../../../tests/package/popover/popover-align.ssr.test.ts) ·
[Browser tests](../../../tests/browser/popover/popover-align.spec.ts)

`bind:ref` returns the shared `PopoverRef` for Popover and
Popconfirm after mount. It is `undefined` during SSR and after
unmount. The stable object has getters `nativeElement` for
the main trigger, including SVG, and `popupElement` for the
outer `div`. The getters track trigger replacement and popup
container moves. `forceAlign` recalculates an open popup without
waiting for an animation frame. Synchronous calls are combined
in a microtask. It leaves a hidden card closed without changing
open or confirm callbacks or adding dependencies to a user
`$effect`. A handle retained after unmount is safe.
`forceAlign` does nothing and the DOM getters return
`undefined`.

The native `div` shell exists before first opening and with
`destroyOnHidden`. The ref returns the same node, and only its
content is removed. React's ref has no popup before first open
and can refer to a removed `div` after destruction. Svelte retains
its existing lifecycle. Nullable DOM types express these states
and support SVG without casting to `HTMLElement`.
`bind:ref` goes directly on the component. `max.popover` remains a
`PopoverProps` object. The fixture is `?fixture=popover-ref`.
[Eight UMD scenarios](../../../tests/browser/fixtures/ant-design-popover-ref-reference.json) · [SSR tests](../../../tests/package/popover/popover-ref.ssr.test.ts) ·
[Browser tests](../../../tests/browser/popover/popover-ref.spec.ts)

`id` sets the native dialog ID. An empty string uses a stable
generated ID. A hidden ID updates with the content cache.
The trigger's `aria-controls` updates without losing caller IDREF
tokens, including when the new ID matches an existing token.
`zIndex`, including zero and negative numbers, sets an explicit
layer before semantic root styles. If omitted, the layer comes
from context or the theme's CSS token. [Nested popup layers](../theme-context.md#layering-nested-panels)

`forceRender=true` prepares hidden content and the portal
after mount or hydration, including when disabled or using
`destroyOnHidden`. Turning off `forceRender` on a closed panel
with `destroyOnHidden` removes the content. A later forced mount
uses current props. `fresh=false` caches hidden title and
content, container, title, and content classes and styles, and
the ID until opening. Root and arrow styles update immediately.
`fresh=true` updates the hidden content. Popconfirm also caches
the icon and button props, while loading, disabled safeguards,
and localization stay current. The widget retains internal state
until removed. Captures in opaque Snippets remain reactive under
Svelte rules, so they do not have React.memo's full freezing.
The fixture is `?fixture=popover-lifecycle`.
[50 UMD scenarios and 399 frames](../../../tests/browser/fixtures/ant-design-popover-lifecycle-reference.json) · [SSR tests](../../../tests/package/popover/popover-lifecycle.ssr.test.ts) ·
[Browser tests](../../../tests/browser/popover/popover-lifecycle.spec.ts)

The upstream theme prepares Tooltip and Popover tokens in order.
The inner Tooltip provides `maxWidth` and the arrow, then
Popover provides its own `titleMinWidth`, `zIndexPopup`, padding,
and wireframe separation of title and content. Deprecated
`width` and `minWidth` retain precedence over default
`titleMinWidth`. Theme changes preserve panel position, entered
text, and focus.

Popover uses native `popover="manual"` and requires the Popover
API. Without a container getter, the surface stays in its
original DOM subtree and in the top layer, avoiding clipping
by container overflow and retaining theme and behavior inside
Modal. A nested Tooltip handles Escape first, then Popover,
then Modal. The trigger retains its existing `aria-describedby`.
`aria-controls` merges with existing IDs. Disabling the card
removes its ID and restores `aria-haspopup` and `aria-expanded`
while respecting owner changes. Positioning and trigger links
are set up after hydration, and the surface is hidden during
SSR.

`getPopupContainer` selects a container using the Tooltip
rules. Local `undefined` retains the provider fallback. The
getter is skipped until first opening or `forceRender`, and
during SSR. Container and theme changes retain the native
popup lifecycle. The DOM stays where it is when the container
is unchanged.

Empty `title` and `content` disable display and ARIA links.
Either being a Snippet counts as content. The owner controls
conditional absence inside the Snippet. Closed content stays
mounted with its state. Without `forceRender`,
`destroyOnHidden=true` removes title and content on close and
recreates them on open. Such Snippets are not called during
SSR, including initial `open` or `defaultOpen`. Focus returns
to the trigger before removal. Delayed openings cancel on
unmount, clearing content, or replacing the trigger.

`afterOpenChange(open)` runs after a visibility change
completes, including initial `defaultOpen` and owner-driven
`open` changes. Requests continue through `onOpenChange`. The
built-in `zoom-big` motion uses the theme duration (200ms by
default). `motion.motionName` selects custom motion classes.
Focus order excludes the card as soon as closing starts.
Hidden content is available in `afterOpenChange(false)`. With
`destroyOnHidden` and no `forceRender`, it is removed after
the callback. [Tooltip motion rules](tooltip.md#opening-and-closing-completion)

`arrow` and `autoAdjustOverflow` accept the same object settings
as Tooltip and pass through Popconfirm and
`AvatarGroup.max.popover`. Context menu and color follow the
shared Tooltip rules.
