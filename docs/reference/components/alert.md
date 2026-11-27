# Alert

```svelte
<script lang="ts">
  import { Alert, Button } from '@woodger/antd';

  let revision = $state(0);
</script>

{#key revision}
  <Alert
    type="warning"
    title="You have unsaved changes"
    description="Save your settings before leaving."
    showIcon
    closable
  />
{/key}
<Button onclick={() => { revision++; }}>Show the alert again</Button>
```

`type` accepts `success`, `info`, `warning`, and `error`, defaulting to
`info`. `variant` is `outlined` or `filled`. `filled` retains the status
background and removes the visible border. `banner` removes borders and
rounding. When `type` and `showIcon` are omitted, it uses `warning` and a
visible icon. Outside banner mode, `showIcon` defaults to `false`.

`title`, `description`, `icon`, and `action` accept strings, numbers,
booleans, `null`, Snippets, and nested arrays of those values. `null`,
`undefined`, `false`, and the empty string leave the title, description,
or actions slot out. `0`, `true`, and arrays create their containers.
Booleans produce no text. Explicit `0`, `false`, and empty strings are
preserved. A Snippet counts as present. For conditional absence, pass
`undefined` from the owner. A description enables larger padding and an
enlarged icon. With `showIcon`, the icon is decorative, including a custom
Snippet. Use `description` or `action` for interactive controls. Keep
`icon` and `closable.closeIcon` free of interactive elements. Actions leave
the Alert open and do not call close callbacks.

Without `ConfigProvider.alert`, closing is disabled by default. `true`
adds a `type=button` button named using `ConfigProvider.locale.closeText`.
An object also supports `disabled`, `closeIcon` as a string or Snippet,
`aria-label`, `aria-labelledby`, `aria-describedby`,
`onClose(MouseEvent)`, and `afterClose()`. Custom `closeIcon` text is
decorative. Supply the accessible name through `aria-label` or the locale.
An explicit boolean `closable` takes precedence over the context, and an
object enables the button. The content comes from a truthy local
`closable.closeIcon`, then the context `closable.closeIcon`. A local
`closable.closeIcon=''` preserves an empty button. Upstream chooses the
fallback in that case. Set callbacks on the local `closable` object.
`disabled` disables closing while preserving actions. Alert is independent
of Form and ConfigProvider disabled state. Child controls use their own
context.

Enter, Space, and a button click initiate closing exactly once. `onClose`
reports the request and `preventDefault` cannot cancel it. The callbacks
are captured at the time of the request. The panel animates closed after
`onClose`. During exit, the contents stay in the DOM with `inert` and
`aria-hidden`. `afterClose` runs once the contents are removed, including
under reduced motion. Removing or replacing the component cancels the
animation and pending `afterClose`. Enabling reduced motion finishes an
ongoing exit immediately.

A closed instance stays closed when its props change. To show it again,
create a new instance by mounting conditionally or changing the key. There
is no public `open` or `bind:open`. Changing the type and contents of an
open message preserves its child instances. SSR renders an open message
without callbacks. Animation runs only on user-initiated closing.

The default `role=alert` makes an assertive announcement as in Ant Design.
Use `role=status` for a routine action result with a polite announcement.
`aria-atomic=true` is the default. `aria-live` and `aria-atomic` can be
overridden. `aria-label`, `aria-labelledby`, and `aria-describedby` name
and describe the root. `id`, `class`, `style`, `data-*`, and remaining
`aria-*` attributes also apply to the root.

`onClick`, `onMouseEnter`, and `onMouseLeave` report container events.
Controls retain native behavior. Calling `stopPropagation` in `onClose`
prevents a root click. Appearance and updates leave focus in place. On
close, focus from inside the message moves to the next accessible control
in the DOM, then falls back to the preceding control or the containing
native dialog. Inside Modal or Drawer, the search stays within the active
dialog. Focus outside the message and any focus selected by the owner
in `onClose` are preserved. Icons have no Tab stops. The close button
supports native keyboard behavior and does not submit the enclosing form.
Owners set the type of their custom action buttons.

`ConfigProvider.alert` supports `variant`, `closable` with `closeIcon`,
four status icons, `class`, `style`, and object or function `classNames` and
`styles` for `root`, `icon`, `section`, `title`, `description`, `actions`,
and `close`. `undefined` inherits the record, and an explicit object
replaces it in full. Callbacks receive input props with resolved
`prefixCls`, `variant`, `type`, `showIcon`, and a boolean `closable`.
Root styles apply in this order: `provider.styles.root`, `provider.style`,
`local.styles.root`, and `local.style`. Local `prefixCls` and
`rootClassName` and the `bind:nativeElement` and `bind:ref` bindings
are supported. Refs are assigned after mount and cleared on unmount.
`ref` retains a snapshot of the root, including the detached node after
close. `nativeElement` reflects the current DOM. Styling updates preserve
the DOM, fields, focus, and selection.

All four tokens, aliases, and the component algorithm apply before
semantic and user styles. The upstream theme uses the fitted status icon
viewBox from icons-svg 4.6.0. The legacy theme retains its previous viewport.
At widths up to 575px, the action moves to a separate line to leave space
for long text. The close button has a hit target of at least 24px.
[Alert tokens](../theme-context.md#alert-tokens)

94 official UMD scenarios record the API, computed styles, status icon
geometry, callback order, and upstream corner cases. A separate fresh SSR
baseline confirms the existing empty local `closeIcon`. The native
atomic and ARIA behavior, localized name, decorative close wrapper,
glyph and palette, hit target, responsive behavior, and focus safeguards
are preserved. Closing with WAAPI preserves the callback snapshot,
`afterClose` after removal, and reduced motion. Upstream's `afterClose`
still sees a connected node. These differences are excluded from upstream
metrics.

`Alert.ErrorBoundary` renders healthy children without a wrapper. An
error in child rendering or a synchronous effect replaces them with an
`Alert type=error`. The title uses `title ?? Error.toString()`. The
description uses `description ?? Error.stack` inside a `pre` with
`font-size:0.9em` and `overflow-x:auto`. Explicit `0`, `false`, and empty
strings are preserved. `id` applies only to the fallback. Changes to props
update the same Alert, and even healthy new children leave the stored
error intact. Remount or change its key to reset. A surrounding
ErrorBoundary handles errors from the fallback itself. As upstream, event
handlers, independent Promise and timer callbacks, and SSR errors are
outside this boundary. Successful SSR preserves DOM, focus, and selection
on hydration, after which the fallback can be shown.

Svelte uses the available JavaScript `Error.stack` in place of React's
`componentStack`. React recovery diagnostics are pending. These framework
differences are separated from the official scenarios and SSR, hydration,
and lifecycle tests. The shared ConfigProvider prefix is supported.
[16 official scenarios](../../../tests/browser/fixtures/ant-design-alert-boundary-reference.json)
