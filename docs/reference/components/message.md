# Message

Create the instance in its owner so components and SSR requests have
independent queues. Each instance supports one mounted MessageHolder.

```svelte
<script lang="ts">
  import { Button, MessageHolder, createMessage } from '@woodger/antd';

  const message = createMessage({ maxCount: 3 });

  async function save() {
    const close = message.loading({ key: 'save', content: 'Saving…', duration: 0 });
    try {
      const response = await fetch('/api/settings', { method: 'POST' });
      if (!response.ok) throw new Error('Save failed');
      message.success({ key: 'save', content: 'Settings saved.' });
    } catch {
      message.error({ key: 'save', content: 'Could not save settings.' });
    }
    // close() closes the updated message. Await its removal.
    const closed = await close;
    if (closed) console.log('Message removed');
  }
</script>

<MessageHolder {message} />
<Button onclick={save}>Save</Button>
```

`open` accepts `MessageConfig` with required `content`. `info`,
`success`, `warning`, `error`, and `loading` accept a scalar value, a
passive Snippet, or an object with `content`. Numbers, including 0, render
as text. Booleans and `null` yield empty content. After the first
argument, pass `duration` and `onClose` or just `onClose`. Positional
arguments override object fields.

A typed method sets its own `type`. `open` defaults to `info`.
`type: null` gives a neutral message. `icon` accepts a decorative
Snippet or scalar. Without a custom icon, the type uses its standard
icon, which spins for `loading`. `onClick` receives a native event
with the message root in `currentTarget`. Use passive elements in
content and icon Snippets.

`duration` is in seconds and defaults to 3. Zero disables automatic
removal. `createMessage` captures default `duration`,
`pauseOnHover=true`, and `maxCount`. A message can override
`duration` and `pauseOnHover`. Invalid duration uses the default.
`maxCount` limits active messages in FIFO order. Positive finite
values round down, and without a valid value there is no limit.
Exiting messages stay in the DOM until the animation ends and do
not count as active. Hover preserves the remaining time, and the
countdown resumes when the pointer leaves. Touch does not pause
on hover.

Keys are strings or numbers. Zero and the empty string are valid.
Reusing an active key updates content in place, restarts the
duration, and replaces `onClose`. All handles for that active message
wait for the same completion. An exiting key can reopen as a
separate message, which the old handle cannot close. `destroy(key)`
closes a key. `destroy()` closes the instance's entire queue. Other
instances are independent.

Call the returned `MessageHandle` to close it, or wait for it with
`await` or `then`. `onClose` runs once when close is requested,
including for timers and FIFO removal. The handle resolves to
`true` after animation and actual DOM removal. Exiting content
gets `inert` and `aria-hidden`. Under reduced motion, exit finishes
immediately. Enabling it finishes an ongoing animation. An
`onClose` error does not interrupt closure of other messages in
`destroy()`. It propagates to the caller after processing.

Messages can be queued before the first mount. SSR renders a hidden
surface without timers or callbacks. The countdown starts after
display. Removing the holder or changing its `message` cancels timers
and animation, clears the queue without `onClose`, and resolves
pending handles to `false`. Later calls on that instance return
`false` without enqueueing. Remounting allows new messages. For
sequential actions, check the result of `await` to stop if the
holder was removed.

The holder inherits theme, compact mode, and direction from the
nearest ConfigProvider. `rtl` overrides direction explicitly. Set
surface options in `createMessage` or individual `MessageHolder`
props, which take precedence. With App, set the same options
through `App.message`.

`MessageHolder.prefixCls` changes the list and message namespace.
The empty string inherits `ConfigProvider.prefixCls`. Canonical
tokens and native popover, viewport, and motion behavior are
independent of public classes. Private Notification metrics use
the shared namespace independently of the local prefix. Raw
measurements record the upstream loss of status classes on an
already visible icon when the prefix changes. A separate public
same-key refresh restores its color. Svelte updates classes without
reopening while preserving the queue, handles, deadlines, and
external focus. [Raw measurements](../../../tests/browser/fixtures/ant-design-message-prefix-reference.json)

`theme.components.Message` sets `zIndexPopup`, `contentBg`,
`contentPadding`, aliases, and component algorithms. Default padding
is calculated without rounding. Message and holder styles retain
precedence. Local component variables with another `cssVar` prefix
resolve on the message itself. Updates change individual CSS
declarations while preserving native viewport styles, queue,
handles, and timer deadlines. In the Ant Design theme, the icon
container matches the upstream line height. Legacy styling remains.
[Tests and upstream measurements](../theme-context.md#dialog-and-notification-checks)

The existing `min-width:0` and `overflow-wrap:anywhere` for the title
are preserved. In official 6.6.8, a long unbroken word yielded
`scrollWidth` of 3871px on a 1352px card. The raw reference CSS is
unchanged. The browser comparison explicitly accounts for this
one porting difference. [Upstream observation](../../../tests/browser/fixtures/ant-design-message-wrap-observation.json)

A native manual popover displays the list at the top center. Newer
messages appear above older ones. `top` defaults to 8px. A number is
in pixels, while a string is a CSS length. `id`, `class`, and `style`
apply to the list surface. Focus, Tab, and Escape stay with the page.
A message uses `role=status`, `aria-atomic=true`, and a decorative
icon. For an urgent announcement, set `role=alert` explicitly.
`ConfigProvider.disabled` leaves feedback enabled.

Inside a Modal or Drawer, place the holder in the intended dialog's
content. If its context is closed, hidden, or covered by another
modal, the surface stays hidden and timers pause. On return, the
remaining time resumes. A hidden tab also pauses the countdown.
Background holders wait for the top dialog to close. Use a separate
holder for a different context.

## Placement and stack

`getContainer` moves the surface to a DOM node. The getter runs in
the browser without arguments. An empty result falls back to
`ConfigProvider.getPopupContainer`, then `document.body`. When both
getters are absent, the surface stays in the holder's DOM context.
Changing the target recreates the surface and preserves the queue,
handles, deadlines, and focus outside it.

`stack: true` collapses the list once there are more than three active
messages. `stack: { threshold: 2 }` sets a custom threshold. The
latest card stays visible in the collapsed stack. Hover expands the
list and pauses entries with `pauseOnHover`. The remaining time
resumes when the pointer leaves.

`transitionName` names the holder's CSS `appear`, `enter`, and
`leave` phases. An empty string disables motion. Without a value,
the default animation applies. The `motion` token and system
reduced-motion setting also apply.

## Semantic styling

`classNames` and `styles` accept a slot object or a function receiving
`{ props }`. Styles use inline CSS strings. `list` and `listContent`
style the list. `root`, `wrapper`, `icon`, and `title` style an entry.
List options can be set in `ConfigProvider.message`, when creating
the queue, or in `MessageHolder`. Entry styles can also be passed to
`open` or a typed method.

Classes accumulate. Styles apply from `ConfigProvider.message` through
holder options to the entry. Explicit entry `style` applies last.
List callbacks use surface options. Entry callbacks receive fields
from `createMessage` and the current entry.

## Comparison with Ant Design 6.6.8

`createMessage` with `MessageHolder` corresponds to contextual
`message.useMessage`. The pinned Ant Design docs mark global
`message` methods deprecated. The contextual API is also available
as `App.useApp().message`. [Upstream reference](https://github.com/ant-design/ant-design/blob/984592267de88fbf9cdaecc96a56629e721c709d/components/message/index.en-US.md#examples)

The upstream reference uses `role="alert"`, a neutral default for
`open`, and object field precedence in typed calls. Svelte retains
`role="status"`, `info`, and positional argument precedence. In two
runs of the original build, closing by key, calling a handle, and
FIFO eviction removed messages without `onClose` or completion
of `then`. Automatic close produced both events. Svelte retains
handle completion and `onClose` for programmatic close.
[Upstream measurements](../../../tests/browser/fixtures/ant-design-message-api-reference.json) · [Browser test](../../../tests/browser/message/message-api.spec.ts) ·
[SSR and type tests](../../../tests/package/message/message-api.ssr.test.ts)
