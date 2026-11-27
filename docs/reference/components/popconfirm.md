# Popconfirm

`getPopupContainer` passes to Popover with the same precedence.
Theme context and the action Promise survive moving the popup into the
container. Trigger and hover delays inherit from
`ConfigProvider.popconfirm`. Local props take precedence. The default
trigger remains `click`. `showAction`, `hideAction`, `focusDelay`, and
`blurDelay` pass to Popover with the same precedence and native limits.
Empty `hideAction` leaves confirm and cancel buttons enabled. Pending
Promise protection and the existing disabled contract are preserved.
`Popover.disabled` and `Popconfirm.disabled` have separate rules.

`align`, `builtinPlacements`, and `onPopupAlign` also pass to the outer
Popover. The callback receives its DOM. Moving it preserves the
description and buttons. `bind:ref` passes to the same Popover and uses
the shared `PopoverRef`. `forceAlign` preserves pending confirmation and
parked focus. `id`, `forceRender`, `fresh`, and `zIndex` also pass through.
Changing the ID or layer preserves the pending Promise, current content,
and parked focus. The result still follows controlled ownership and
stale-request protection. [Nested popup layers](../theme-context.md#layering-nested-panels)

`destroyOnHidden` passes to Popover, including explicit `false`. Removing
the content recreates the description Snippet and buttons next time.
The confirmation controller still guards against an old Promise
settling after close or reopen. With destruction enabled, SSR content
stays lazy even with initial `open` or `defaultOpen`. The native shell,
focus, and ARIA follow the existing Popover rules.

`unique={true}` passes to Popover and joins the confirmation to the
nearest Tooltip.UniqueProvider group. Each confirmation keeps its own
Promise and pending state. If the group moved the panel to another
trigger, completing the previous action updates its owner. The current
card retains its state. [Popover](./popover.md)

```svelte
<script lang="ts">
  import { Button, Popconfirm } from '@woodger/antd';

  let open = $state(false);

  async function remove() {
    // Send the request and update the data after it succeeds.
  }
</script>

<Popconfirm
  title="Delete this record?"
  description="The record will be removed from the list."
  bind:open
  okText="Delete"
  okButtonProps={{ danger: true }}
  onConfirm={remove}
>
  <Button danger>Delete</Button>
</Popconfirm>
```

`title` is required. `title` and `description` accept a string, number, or
Svelte Snippet. Zero renders and strings are escaped. An empty title
string disables the card. A Snippet must supply an accessible title.
`icon` accepts decorative Button content, including a string, number,
or Svelte Snippet. `undefined` keeps the warning sign. `null`, `false`, and
the empty string remove the slot. `children` contains one main DOM node,
usually a Button. Its attributes and handlers are preserved.

Popover provides click and native button Enter and Space opening,
the 12 Tooltip placements, `arrow`, and `autoAdjustOverflow`. Cancel
comes before confirm in the content. `showCancel=false` hides cancel.
Opening focuses the first accessible control, typically cancel for a
plain description. Tab follows native order. Escape closes the card
and restores focus. Modal, nested Tooltip, themes, compact mode, RTL,
and `prefers-reduced-motion` are supported. The native Popover API is
required.

With upstream ConfigProvider theme settings, aliases apply in
Tooltip, Popover, and Popconfirm order. Popconfirm prepares its own
`zIndexPopup`. A nested standalone Popover uses its own tokens without
Popconfirm aliases. Theme changes preserve a pending confirmation.

`bind:open`, `defaultOpen`, and `onOpenChange(open)` follow the Svelte
model. `defaultOpen` is read once. External `open` changes leave
`onOpenChange` uncalled. Only the confirm button calls
`onConfirm(event)`. Synchronous completion and a resolved Promise
close the card. Without `onConfirm`, confirmation simply closes it.
Only the cancel button calls `onCancel(event)`. Escape, outside click,
and another trigger click change visibility through `onOpenChange`
without calling `onCancel`.

`afterOpenChange(open)` reports completed visibility changes for the
outer Popover. `motion.motionName` overrides its default `zoom-big`.
Duration, reduced motion, and content removal order follow Tooltip.
Setting `disabled` on an open Popconfirm closes the card under the
Svelte contract and calls `afterOpenChange(false)` after closing.
[Tooltip contract](tooltip.md#opening-and-closing-completion)

While the Promise is pending, confirm shows loading and both buttons
are disabled. Repeat activation, Escape, outside click, another
trigger click, and focus leaving keep the card open. External `open`
remains controlled by the owner. Closing, reopening, disabling, and
unmounting invalidate the old result. It leaves a new card and its
loading state intact and does not call `onError`. This protects
Popconfirm state. The `onConfirm` owner manages request cancellation and
data changes.

A synchronous throw or rejected Promise leaves the card open and shows
a safe message with `role=alert`. `onError(error)` receives the original
error as `unknown`. Technical details are withheld from the message.
Retrying clears it. Set the message with `locale.confirmErrorText`.

`okText` and `cancelText` accept Button content, including numbers and
Svelte Snippets. For `null` or `undefined`, labels come from
`locale.popconfirm` and then the shared locale. Empty strings and
`false` leave labels empty. `0` renders as a number. React 6.6.8 uses
the locale label for those three values. `ruRU` and `enUS` are supported,
and a partial locale inherits from ConfigProvider.

`okType="danger"` selects Button's danger palette. `okButtonProps` sets
final `type`, `danger`, `color`, and `variant` according to Button rules.
Both buttons accept size, disabled state, attributes, and handlers.
`onclick` runs before the action and can cancel it using
`preventDefault()`. Without `onclick`, the compatible `onClick` runs
after the action. It receives the event immediately after starting the
Promise or closing synchronously. The native button gets
`type="button"`, and Popconfirm controls loading.

`disabled` inherits from Form and ConfigProvider. Explicit
`disabled={false}` overrides inheritance. Disabled hides the card and
blocks its actions while retaining the owner's `open`. The original
trigger stays mounted and this prop leaves its own disabled state intact.
[React variants and callback order](../../../tests/browser/fixtures/ant-design-popconfirm-action-content-reference.json) · [Svelte tests](../../../tests/browser/popconfirm/popconfirm-action-content.spec.ts)

With `href`, an action renders a Button link and passes it `target`
and `rel`. In `onclick` and `onClick`, `event.currentTarget` is
`HTMLAnchorElement` for a link and `HTMLButtonElement` for a button.
Conditional `href` produces their union. Template types are inferred
from props. For explicit typing, use `PopconfirmProps<string>` to
specify the confirm URL in the first type parameter and the cancel
URL in the second. In programmatic SSR, the type can be supplied on
the component, for example `render(Popconfirm<string>, { props })`.
Local semantic callbacks receive their instance's action types.
`ConfigProvider.popconfirm` applies to both buttons and links, so
its callback sees both.

The browser follows a link after the original click handlers. While
pending, Popconfirm removes `href` from both links, removes them from
the Tab order, and moves focus into the card. React 6.6.8 keeps
`href` and `tabindex` on both links while pending.
[React measurements](../../../tests/browser/fixtures/ant-design-popconfirm-action-links-reference.json) · [Svelte tests](../../../tests/browser/popconfirm/popconfirm-action-links.spec.ts)

`onPopupClick(event)` receives a native `MouseEvent` when it bubbles
to the panel root. Content handlers, including confirm and cancel,
run earlier. `preventDefault()` lets it bubble and
`stopPropagation()` stops it. In a shared `Tooltip.UniqueProvider`
panel, the current owner receives the event. Ant Design React 6.6.8
loses the shared panel callback.
[React measurements](../../../tests/browser/fixtures/ant-design-popconfirm-popup-click-reference.json) · [Svelte tests](../../../tests/browser/popconfirm/popconfirm-popup-click.spec.ts)

The card has `role=dialog`, a name from `title`, and a description
from `description`. The trigger retains any `aria-describedby` and
links to the card with `aria-controls` and `aria-expanded`. While
pending, the card gets `aria-busy`. Focus from disabling buttons
stays on its content. `class` and `style` apply to the trigger
wrapper, as in Popover. Closed card content remains mounted. The
error state resets on a new open.

Popconfirm supports click opening and all 12 Tooltip placements,
as well as hover, focus, context menu, and independent action props.
