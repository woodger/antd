# Notification

Create an instance in its owner and place one NotificationHolder in the
intended ConfigProvider context. Components and SSR requests have
independent queues.

```svelte
<script lang="ts">
  import { Button, NotificationHolder, createNotification } from '@woodger/antd';

  const notification = createNotification({ maxCount: 3 });
</script>

{#snippet actions()}
  <Button onclick={() => notification.destroy('report')}>Got it</Button>
{/snippet}

<NotificationHolder {notification} />
<Button onclick={() => notification.success({
  key: 'report',
  title: 'Report ready',
  description: 'Two records are ready.',
  duration: 0,
  actions
})}>Show export result</Button>
```

`open`, `success`, `info`, `warning`, and `error` accept a
`NotificationConfig` object and return `void`. `open` without `type`
shows a card without a status icon. Typed methods set their own
`type`. `title` and `description` accept text, numbers, or Snippets.
Zero renders as a number. An empty string removes that area.
`icon` and `closeIcon` are decorative. Actions can go in `actions` or
`description`. `class` and `style` apply to the card. `props` adds
root `div` attributes, including `data-*` and ARIA. Direct
`aria-label`, `aria-labelledby`, and `aria-describedby` take precedence.
By default, the name comes from `title` and the accessible description
from `description`. `onClick` receives a native event with the card as
`currentTarget`. The close button stops it from bubbling.

`duration` is in seconds and defaults to 4.5. Zero and `false`
disable automatic removal. Negative and non-finite values use the
default. `createNotification` captures default `duration`,
`pauseOnHover=true`, `placement`, and `maxCount`. A card can override
`duration`, `pauseOnHover`, and `placement`. Hover preserves the
remaining time, and `pauseOnHover=false` lets the countdown continue
during hover. Focus inside always pauses the timer, including during
Tab between actions and same-key updates. The countdown resumes
once focus leaves and, if hover pausing is enabled, the pointer also
leaves. Touch does not start a hover pause.

`showProgress` renders a native `progress` for a positive duration.
It represents the remaining time and follows the timer's pauses.
Per-card `showProgress: false` overrides the queue setting.

Keys are strings or numbers, including 0 and the empty string.
Reusing an active key updates content in place, restarts duration,
and replaces `onClose`. Within a placement, unchanged Snippets and
their controls retain their instances. Changing placement moves the
card to another group and recreates the Snippets. Reopening an
exiting key creates a separate card. A late finish from the old
animation leaves the new card intact. `destroy(key)` closes the key.
`destroy()` closes the full instance queue. `maxCount` limits the
total active notifications across placements in FIFO order. Key
updates leave queue order intact. Positive finite values round down.
Without a valid value there is no limit.

`closable` defaults to `true`. `false` removes the button. An object
supports `disabled`, `closeIcon`, and the button's `aria-label`,
`aria-labelledby`, and `aria-describedby`. `closeIcon` can also be
supplied at the top level. `false` and `null` hide the button. The
accessible name comes from `locale.closeText` or `closable.aria-label`.
`disabled` disables only the button. `destroy` and the timer remain
effective. `ConfigProvider.disabled` leaves notification closing
available, and nested action components inherit their own context.
The close icon inherits `ConfigProvider.notification.closeIcon`.
Holder and card settings take precedence. `closable.onClose` runs
before the card's `onClose` for a button close or timer close.

`onClose` runs once on a close request from the button, `destroy`,
the timer, or FIFO. The exiting card gets `inert` and `aria-hidden`
and remains in the DOM until the animation ends. A callback error
does not interrupt processing the other cards in `destroy()`. It
propagates to the caller after processing. Reduced motion skips
the animation. Enabling it finishes an already active exit.

Appearance leaves focus in place. Buttons use native Enter, Space,
and normal Tab. The page or containing Modal or Drawer handles
Escape. When closing or removing a focused action, focus moves to
the next accessible control in the DOM, then falls back to the
previous control or active dialog. Focus chosen outside the card
by `onClose` is preserved. The default `role` is `alert`. Use `status`
for an ordinary result. `aria-atomic=true`. Icons add no Tab stops.

`placement` supports `top`, `topLeft`, `topRight`, `bottom`,
`bottomLeft`, and `bottomRight`, defaulting to `topRight`.
Left and right are physical directions and stay the same in RTL.
Cards grow toward the center of the viewport. The list scrolls
on overflow. Holder `top` and `bottom` set offsets in pixels,
defaulting to 24. Invalid values use 24. `id`, `class`, and `style`
apply to the holder's native popover surface. The
`--ant-notification-width` CSS variable sets card width and defaults
to 384px. The viewport constrains width and long text wraps.
Theme, compact mode, and RTL inherit from ConfigProvider.
`theme.components.Notification` configures `width`, `zIndexPopup`,
status backgrounds, aliases, and component algorithms.

`NotificationHolder.prefixCls` changes the namespace of all placement
lists and cards. An empty string inherits `ConfigProvider.prefixCls`.
In App, pass it through `notification`. Canonical component tokens
and existing status background styling are preserved. Private icon
and title metrics use an independent shared namespace. Raw prefix
measurements are separate from public styles for the native close
target and wrapping safeguards. The upstream loss of status classes
on an already open card is recorded separately from the public
same-key refresh. Svelte updates classes without reopening and
preserves DOM, ARIA IDs, drafts, selection, focus, queue, deadlines,
and callbacks, including in App. [Raw prefix measurements](../../../tests/browser/fixtures/ant-design-notification-prefix-reference.json)

`progressBg` sets the timer indicator fill. Local CSS variables with
a different prefix resolve on the notice. Holder user variables take
precedence. Updates preserve viewport styles, queue, deadlines,
action DOM, drafts, focus, and selection. Actions sit at the root
as in the reference. The wrapper renders only with an icon, and the
section renders only with both title and description. The legacy
grid preserves its padding and placement. Upstream `flow-root`
preserves the height of floated actions with native relative
positioning. Theme changes preserve controls.
[Comparison and tests](../theme-context.md#dialog-and-notification-checks)

Svelte applies explicit status backgrounds even when they equal the
global alias or use another `cssVar` prefix. Upstream 6.6.8 sometimes
loses these settings. The native minimum 24px close target,
`padding:0`, `max-width:100%` for root and actions, and wrapping for
title and description are preserved. The comparison gives the
reference the same conditions through public semantic styles.
[Upstream measurements](../../../tests/browser/fixtures/ant-design-notification-background-observation.json)

The raw `width:undefined` measurement is also retained. Upstream
clips the close button. The native relative list keeps it
accessible. [Raw measurement](../../../tests/browser/fixtures/ant-design-notification-width-observation.json)

Notifications can be queued before first mount. SSR renders a closed
popover without timers or callbacks. The countdown starts when shown.
A hidden context, hidden tab, or another topmost dialog pauses the
queue. Inside Modal or Drawer, put the holder in the intended dialog
content. Background holders wait for that dialog to close. Removing
the holder or replacing `notification` clears the queue and cancels
timers and animations without `onClose`. Later calls on the old
instance are ignored until remount. A new holder starts with an empty
queue. The shared queue model is in `notice-queue.model.svelte.ts`.
`notice.dom.ts` handles DOM visibility and focus. Message and Alert
also use these modules.

## Stack and container

The stack collapses by default when more than three active cards share
a placement. `stack: { threshold: 2 }` sets a custom threshold and
`stack: false` keeps the list expanded. Up to three recent cards are
visible in a collapsed stack. Hover or focus inside expands it. Hover
pauses timers with `pauseOnHover` in the current placement. With an
explicit `stack` or once the threshold is exceeded, the newest cards
are closest to the viewport edge. An ordinary list within the
threshold preserves insertion order.

`getContainer` selects a node for the popover. It runs in the browser
without arguments. An empty result falls back to
`ConfigProvider.getPopupContainer`, then `document.body`. Without either
getter, the surface stays in the holder's DOM context. Changing the
container recreates the lists and preserves the queue and timers.
`rtl` overrides provider direction. `onAllRemoved` runs once the
final card finishes exiting and the queue is empty.

## Semantic styling

`classNames` and `styles` accept a slot object or a function receiving
`{ props }`. List props hold the holder settings. Card props hold the
call configuration. `list` and `listContent` apply to a placement.
`root`, `wrapper`, `icon`, `section`, `title`, `description`, `actions`,
`close`, and `progress` apply to the card. Styles use inline CSS
strings. Provider, holder, and card layers merge in that order.
Explicit card `style` applies last.

## Comparison with Ant Design 6.6.8

`createNotification` and `NotificationHolder` correspond to contextual
`notification.useNotification`. In App, the same instance is available
through `App.useApp().notification`. The pinned reference marks global
methods deprecated. `title` and `actions` correspond to the deprecated
`message` and `btn` fields. [Upstream reference](https://github.com/ant-design/ant-design/blob/984592267de88fbf9cdaecc96a56629e721c709d/components/notification/index.en-US.md#examples)

In two reference runs, FIFO removed a card without calling
`onClose`. Svelte calls `onClose` on eviction. Measurements cover
styling, icons and closing callbacks, multiple placements, container
changes and App defaults, stack layout, and time indicator progress.
[Upstream measurements](../../../tests/browser/fixtures/ant-design-notification-api-reference.json) · [Browser test](../../../tests/browser/notification/notification-api.spec.ts) ·
[SSR and types](../../../tests/package/notification/notification-api.ssr.test.ts)
