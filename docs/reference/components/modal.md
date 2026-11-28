# Modal

Modal retains the native dialog, `bind:open`, footer and children
Snippets, and existing `onOk`, `onCancel`, `confirmLoading`, Escape,
and backdrop dismissal rules. `loading` replaces the body with
an active four-row Skeleton without a title and hides the
default or custom footer. Returning to content remounts body and
footer and resets local child drafts. Dialog, header, title, and
close retain their DOM identity. `loading` itself leaves dismissal
available and preserves the existing `confirmLoading` rules.
The placeholder element receives `${prefixCls}-body-skeleton`
with the local prefix. Native dialog centering, separate Skeleton
accessibility wrappers, max-width containment, and keyframe
names are preserved. Independent upstream runs cover two owners,
10 actions, 12 states, and lifecycle after removal. Browser
tests cover transitions and cleanup. SSR tests cover the closed
native shell without DOM or timers. [Upstream runs](../../../tests/browser/fixtures/ant-design-modal-loading-source-manifest.json) ·
[Browser tests](../../../tests/browser/modal/modal-loading.spec.ts) · [SSR tests](../../../tests/package/modal/modal-loading.ssr.test.ts)

`title` and `children` are optional. `title` takes a scalar or
Snippet. An empty title, `null`, or `false` removes the header.
Numeric zero is visible. Without a visible title, supply
`aria-label` or `aria-labelledby`. Explicit ARIA naming applies
to the dialog. `aria-labelledby` takes precedence, then a
nonempty `aria-label`, then the generated title ID. Title
changes preserve the dialog, draft, selection, and focus.
The raw cases capture the React exceptions where `title=0` and
explicit ARIA props are lost. Svelte renders 0 and preserves the
owner's name. [Raw content and ARIA cases](../../../tests/browser/fixtures/ant-design-modal-content-reference.json)

The Modal boundary clears outer `Form.Item` status and
validation feedback. Local `Form.Item` and explicit field
`status` set styling inside the dialog.
[Ant Design 6.6.8 comparison](../../../tests/browser/dialog/dialog-form-style.spec.ts)

`prefixCls` changes the namespace of Modal and its parts.
The empty string inherits `ConfigProvider.prefixCls`. The
setting also applies to contextual confirmations, including
`handle.update`. Button uses its own shared prefix. Canonical
CSS variables, the native dialog, IDs, and open content are
preserved. In the upstream Confirm defect, a local prefix
leaves an extra header because upstream hides it through the
shared namespace. A separate public `styles.header` comparison
hides it. Svelte keeps one confirmation title. The comparison
also records the upstream cache's loss of footer Button margins
separately from a public comparison with a new local prefix.
Existing native disabled and loading rules and SVG size are
preserved, with a separate React case using public button props.
[Raw comparison](../../../tests/browser/fixtures/ant-design-modal-prefix-reference.json)

`zIndex` sets Modal's numeric layer, including zero. Nested
dialogs and popups inherit it. [Nested popup layers](../theme-context.md#layering-nested-panels)

`theme.components.Modal` sets header, content, and footer
backgrounds, title color, font size and line height, padding,
and wireframe styling. Aliases, component algorithms, CSS
lengths, and a custom prefix are supported. Nested Button and
Input keep their own tokens. The upstream close wrapper sizes
the icon, and the legacy size is preserved. Theme updates
preserve modality, DOM, drafts, selection, and focus, including
with `getContainer`. Native centering and the title's reserved
close-button space are preserved. The UMD comparison covers
the theme options. Full render and configuration API coverage
remains pending. Contextual confirmations are described below.
[Official UMD comparison](../theme-context.md#dialog-and-notification-checks)

`getContainer` accepts a DOM node, DocumentFragment including
ShadowRoot, CSS selector, zero-argument function, or `false`.
Local `undefined` uses `ConfigProvider.getPopupContainer`. Modal
calls the global getter without a trigger, as Ant Design 6.6.8
does. `false` keeps the DOM in place and disables the global
fallback. On `open` changes, the container resolves after the
DOM update. Selectors and getters see a node mounted together
with opening. With neither setting, existing native placement
applies. [Ant Design 6.6.8 comparison](../../../tests/browser/drawer/drawer-container-timing.spec.ts)

```svelte
<script lang="ts">
  import { Modal } from '@woodger/antd';
  let open = $state(false);
</script>

<button type="button" onclick={() => open = true}>Open editor</button>
<div id="modal-container"></div>
<Modal bind:open title="Editor" getContainer="#modal-container">
  <input name="description" aria-label="Description" />
</Modal>
```

The getter runs only after browser mount, including for a
closed Modal. The first move into a ready container preserves
SSR DOM. A new function returning the same container preserves
content, drafts, selection, and focus. Changing the actual
container recreates the dialog and contents as with a React
portal. Moving a closing Drawer cancels the old panel's motion
and pending destruction. The new dialog stays closed until the
next opening. Default and custom prefixes preserve lifecycle
without causing a move loop. A missing selector match or empty
getter result falls back to the body. A detached node or
DocumentFragment waits until it is inserted in the document to
open. Consumers supply ShadowRoot styles. Native dialog mode
retains modality, `inert`, and focus restoration in any
container.

If the host disappears during close, Modal releases modality and finishes the
close callbacks in their usual order. Changing a connected target during an
animated close discards the old panel and its animation. A move while open
keeps the original opener as the focus restore target. In the captured React
move, focus ended on the document body.

When motion is disabled, the close settles before moving the retained panel to
its new container.
[Container close measurements](../../../tests/browser/fixtures/ant-design-dialog-container-commit-reference.json)

The reference uses `@rc-component/dialog` 1.10.0 and portal 2.1.3.
Their licenses are included. [Dialog license](../../../src/lib/vendor/LICENSE.rc-dialog) ·
[Portal license](../../../src/lib/vendor/LICENSE.rc-portal)

Modal and Drawer comparisons use 36 official UMD snapshots,
browser checks, and interaction checks in
`?fixture=dialog-container`. [Browser checks](../../../tests/browser/dialog/dialog-container.spec.ts) ·
[Interaction checks](../../../tests/browser/dialog/dialog-container-interaction.spec.ts)

## Mask, scrolling, and focus

`mask` accepts a boolean or an object with `enabled`, `blur`, and
`closable`. By default, the mask is visible and a backdrop click
closes the dialog. `blur: true` adds 4px of blur. `mask={false}`
leaves a transparent area around the panel. That area follows
`mask.closable` for clicks and blocks buttons beneath it. A click
must start and end in the area.

`focusable.trap` defaults to the mask's visibility. With
`trap: false`, focus can move outside the dialog.
`aria-modal` follows focus trapping.
`focusable.focusTriggerAfterClose` restores focus to the trigger
by default after closing a dialog with a visible mask.
`ConfigProvider.modal` supplies `mask` and `focusable`. Local
fields take precedence.

`scrollLock={false}` allows page scrolling independently of mask
and focus. By default, native mode locks it in any container.
Controlled mode locks the page with the default portal and
in `document.body`, as Ant Design does. Mode changes preserve
the dialog, draft, and focus inside the panel.
[Ant Design 6.6.8 reference](../../../tests/browser/fixtures/ant-design-modal-interaction-reference.json) · [Chromium](../../../tests/browser/modal/modal-interaction.spec.ts)
· [Hydration](../../../tests/browser/modal/modal-interaction-hydration.spec.ts)

## Sizing and placement

`width` takes a number in pixels, a CSS length string, or a
Grid breakpoint map from `xs` to `xxxl`. A size applies from
its breakpoint to the next supplied breakpoint. The rules
use the active theme's thresholds and work during SSR.
Numeric zero is preserved. For a contextual confirmation,
`width` takes a number or string. An empty value or zero
uses the standard 416px width. `height` sets the height of
either panel type as a number in pixels or a CSS length.

`centered` inherits from `ConfigProvider.modal`. Local `true`
centers the panel, and `false` places it at the top as in
Ant Design. When both settings are omitted, Svelte keeps
native centering. In top placement, content scrolls inside the
panel within the available height. Size and placement changes
preserve DOM, drafts, selection, and focus.
[Ant Design 6.6.8 reference](../../../tests/browser/fixtures/ant-design-modal-layout-reference.json) · [Chromium](../../../tests/browser/modal/modal-layout.spec.ts)
· [Hydration](../../../tests/browser/modal/modal-layout-hydration.spec.ts)

## Mounting and transition completion

Without mount settings, Modal renders a closed dialog and
its content, including in SSR. Ant Design 6.6.8 mounts an
ordinary Modal at first open. Svelte `forceRender={false}`
enables that lazy mode. `forceRender={true}` mounts the panel
ahead of time. `destroyOnHidden` delays first mount until opening
and removes the panel after hiding. With `forceRender={true}`,
the panel is retained. Retaining it preserves DOM and drafts.
After removal, the next opening creates a new panel.

The panel scales from 0.2 to 1 on opening and reverses on close.
The mask fades independently. Durations come from theme
tokens. `theme.token.motion: false` and
`prefers-reduced-motion: reduce` finish transitions without
animation. Focus and scroll lock rules apply until the dialog
closes. `afterOpenChange(true)` runs after opening. On close,
Modal first releases modality, restores focus according to
`focusable`, and finishes removal with `destroyOnHidden`.
It calls `afterClose()` and then `afterOpenChange(false)`.
Reopening during exit retains contents and cancels the close
notification.

The options also apply to contextual confirmations. Their
owner settles `await` when a decision is made. After close,
callbacks run before confirmation removal so child cleanup
can see their updates. SSR runs neither animation nor
callbacks. The first opening during hydration uses the rendered
DOM. [Ant Design 6.6.8 snapshots](../../../tests/browser/fixtures/ant-design-modal-lifecycle-reference.json) ·
[Chromium](../../../tests/browser/modal/modal-lifecycle.spec.ts) · [SSR](../../../tests/package/modal/modal-lifecycle.ssr.test.ts) · [Hydration](../../../tests/browser/modal/modal-lifecycle-hydration.spec.ts)

## Named transitions and transform origin

`transitionName` sets the panel CSS transition and
`maskTransitionName` sets the mask transition. An empty string
disables motion for that part. CSS can use the phases
`<name>-appear`, `<name>-enter`, and `<name>-leave`, and their
`<name>-<phase>-active` classes. Without custom names, the
default zoom and fade apply. These options are available in
confirmation configuration and through `handle.update()`.

`mousePosition` supplies a point in page coordinates
`{ x, y }`. With `null` or `undefined`, a click within the
last 100ms is used, including the click that mounts Modal.
`{ x: 0, y: 0 }` retains the normal transform origin.

Panel close releases focus and scroll lock. The mask can keep
animating after `afterOpenChange(false)` while passing input to
the page or lower dialog. The mask of a closing lower window
stays beneath an already open top dialog. With
`destroyOnHidden` and no `forceRender`, content is removed before
callbacks and the remaining mask after them. Without a CSS
effect for the requested name, Svelte finishes the phase
after checking a frame. In the Ant Design 6.6.8 measurement
without CSS rules, the wrapper remained visible after close
and the callbacks were absent.
[Ant Design 6.6.8 reference](../../../tests/browser/fixtures/ant-design-modal-motion-reference.json) · [Chromium](../../../tests/browser/modal/modal-motion.spec.ts)
· [SSR](../../../tests/package/modal/modal-motion.ssr.test.ts) · [Hydration](../../../tests/browser/modal/modal-motion-hydration.spec.ts)

## Buttons, footer, and dismissal

`okButtonProps` and `cancelButtonProps` accept Button settings,
including link `href` and its native handler. Local fields
override `ConfigProvider.modal`. `okType` controls the OK
appearance and defaults to `primary`. `okText` and
`cancelText` accept scalars or Snippets. `undefined` uses the
locale and `null` leaves the label empty.

A button runs the Modal action first and then its `onclick`
or `onClick`. In a confirmation, pressing the same button
again during its Promise skips both handlers, even with the
loading indicator turned off through `loading: false`.

The footer receives the default group and Snippets for
individual buttons. For example, ordinary and confirmation
Modals can place OK before Cancel.

```svelte
{#snippet footer(_defaultFooter, { OkBtn, CancelBtn })}
  {@render OkBtn()}
  {@render CancelBtn()}
{/snippet}

<Modal bind:open {footer} okButtonProps={{ danger: true }} />
```

A footer with no parameters still works. `footer={null}` leaves
no buttons. In a confirmation, the default group includes an
element with class suffix `-confirm-btns`. When rendering the
buttons individually, the Snippet supplies the group markup.
Cancel appears when `okCancel` allows it.

The ordinary Modal footer resets the inherited disabled setting and
keeps the configured size. Explicit Button `disabled` and Modal button
options still apply. [ConfigProvider.useConfig](../config-provider.md#reading-size-and-disabled-settings)

`closable` accepts a boolean or an object with `closeIcon`,
`disabled`, ARIA attributes, `role`, `onClose`, and `afterClose`.
`disabled` applies to the close button. Escape and backdrop
dismissal use `keyboard` and `mask.closable`. If `closable` is
omitted, a separate `closeIcon={null}` or `closeIcon={false}`
hides the button. In the object, `closeIcon: null` keeps an
accessible button without an icon.

An ordinary Modal calls local `closable.onClose` after
`onOk` or `onCancel`. A confirmation calls it when a button
action finishes, or immediately after `onCancel` for Escape,
the backdrop, or the close button. `closable.afterClose` runs
before `afterClose` when closing, including on an external
`open` change or `handle.destroy()`. With a Promise,
`onClose` is captured at the press, and `afterClose` is read
at actual close. The provider sets the button's appearance and
availability.

In upstream, `confirmLoading` blocks Cancel through the callback.
Svelte also retains disabled styling and behavior for Cancel and
the close button. While loading, Button itself uses native
`disabled`.
[Ant Design 6.6.8 reference](../../../tests/browser/fixtures/ant-design-modal-actions-reference.json) · [Chromium](../../../tests/browser/modal/modal-actions.spec.ts)
· [SSR and types](../../../tests/package/modal/modal-actions.ssr.test.ts) · [Hydration](../../../tests/browser/modal/modal-actions-hydration.spec.ts)

## Semantic slots and wrapper

`classNames` and `styles` style `root`, `wrapper`, `mask`,
`container`, `close`, `header`, `title`, `body`, and `footer`.
Pass a map or a function receiving `{ props }` and returning
a map. It receives current Modal settings, including width,
mask state, focus options, and `zIndex`. Provider and instance
classes accumulate. Instance CSS declarations follow provider
declarations. `ConfigProvider.modal.class` styles the inner
panel, and instance `style` supplements
`ConfigProvider.modal.style`.

`root` and `wrapper` style the shared native `<dialog>`, which
also receives `class`, `rootClassName`, and `wrapClassName`.
`styles.root` supplements `rootStyle`, followed by wrapper
styles. React 6.6.8 takes root style from `styles.root`. Svelte
also applies direct `rootStyle`. Width and height belong to
the native wrapper.

`wrapProps`, `maskProps`, and `bodyProps` take native attributes
and handlers for their elements. Explicit `class` and `style`
in these props replace the corresponding slot's styles.
Modal retains control of `open`, modality, and lifecycle.
`wrapProps.onclick` and `wrapProps.onmousedown` delegate backdrop
dismissal handling to the owner. Customizing the mask slot
creates a DOM element beneath the panel. By default, the mask
paints the backdrop and the wrapper receives clicks. The
native dialog retains modality.

`modalRender` receives the default container as a Snippet. It
can wrap it or render custom content. `bind:panelRef` receives
the `HTMLDialogElement` for the panel's lifetime. In a contextual
confirmation, `panelRef` takes a callback and passes
`undefined` when cleared. The confirmation's `body` slot styles
visible content, and `bodyProps` apply to its structural
container. A confirmation retains one title. `header` and
`title` style the ordinary Modal title.
[Ant Design 6.6.8 reference](../../../tests/browser/fixtures/ant-design-modal-semantics-reference.json) · [Chromium](../../../tests/browser/modal/modal-semantics.spec.ts)
· [SSR and types](../../../tests/package/modal/modal-semantics.ssr.test.ts) · [Hydration](../../../tests/browser/modal/modal-semantics-hydration.spec.ts)

## Contextual Modal confirmations

`createModal()` and one `ModalHolder` replace React
`Modal.useModal()`. Place the holder under the intended
ConfigProvider. Open confirmations inherit theme, locale, RTL,
and container, including subsequent context changes.
`zIndex` defaults to `zIndexPopupBase + 1000` and can be updated
with `handle.update({ zIndex })`.

```svelte
<script lang="ts">
  import { Button, ModalHolder, createModal } from '@woodger/antd';
  const modal = createModal();

  async function confirm() {
    const accepted = await modal.confirm({ title: 'Continue?', content: 'Confirm the action.' });
    if (accepted) {
      // Carry out the confirmed action.
    }
  }
</script>

<Button onclick={confirm}>Continue</Button>
<ModalHolder {modal} />
```

The `info`, `success`, `error`, `warning`, and `confirm`
methods return a handle with `destroy()`, an `update` accepting
an object or `previous => patch`, and an awaitable `true` or
`false` result. Confirm shows OK and Cancel. The other types
show only OK. Default width is 416px. Close is hidden, Escape
is enabled, and backdrop dismissal is off. Native centering
is preserved. Title, content, icon, and button labels accept
scalars or Snippets.

`ConfigProvider.modal` supplies `infoIcon`, `successIcon`,
`errorIcon`, and `warningIcon`. Confirm uses `warningIcon`.
Local `icon` takes precedence. `icon: null` and `icon: false`
hide it. `okCancel`, `closable`, `keyboard`, `mask`,
`focusable`, `scrollLock`, `getContainer`, and `class` apply
separately to each confirmation. `direction` sets the window's
direction. The called method supplies the initial type.
`handle.update({ type })` can change the icon, class, and
default buttons.

A backdrop click closes the confirmation with local
`mask.closable: true`. `focusable.autoFocusButton` chooses
OK or Cancel on open and in `handle.update()`. The default is
OK. `null` gives neither button explicit autofocus. In Ant
Design 6.6.8, `null` focuses OK. [Comparison](../../../tests/browser/modal/modal-interaction.spec.ts)

An `onOk` or `onCancel` with no argument closes after a
synchronous result. A callback taking `close` leaves closing
to the owner. A returned Promise sets loading on the
corresponding button. Fulfillment closes the dialog, and
rejection leaves it available to retry. Pressing again while
pending skips the callback. Escape, close, and the mask close
immediately and call `onCancel`, even during pending `onOk`.
`destroy` leaves `onCancel` uncalled. `afterClose` runs once after
the native dialog actually closes. Destroying a confirmation
before mount settles it immediately.

Destroy and holder removal settle pending handles as `false`.
Late async results cannot bring the window back. Removing the
holder leaves `onCancel` and `afterClose` uncalled, releases
modality, and restores focus unless the owner moved it.
Remount starts with an empty queue and accepts new calls.
Calls between detaching and reattaching resolve to `false`.
During SSR, the factory avoids DOM access and the holder
renders closed dialog shells.

Thirteen scenarios use the official UMD. Upstream
`destroy` leaves `await` pending, and this exception is
recorded. Svelte settles it. Async rejection follows the
upstream await mode without an unhandled rejection. Existing
native button labels use `locale.okText` and `locale.cancelText`.
[13 upstream scenarios](../../../tests/browser/fixtures/ant-design-modal-controller-reference.json) · [Model tests](../../../src/lib/modal/modal.model.test.ts) ·
[Browser tests](../../../tests/browser/modal/modal-controller.spec.ts) · [SSR and declarations](../../../tests/package/modal/modal-controller.ssr.test.ts)

## Global confirmations

`Modal.confirm(config)`, `Modal.info(config)`,
`Modal.success(config)`, `Modal.warning(config)`, and
`Modal.error(config)` open without a `ModalHolder`. Each call
creates a separate browser root. The dialog moves into the
supplied container, falling back to the provider container
and `document.body`. For static calls, `getContainer: false`
uses the same path as omitting the setting.

The handle exposes `destroy()` and `update()`. An object passed
to `update` extends current settings. A function receives a
snapshot with `open` and `close` and returns the entire new
configuration. `update({ open: false })` hides the panel while
allowing it to reopen. Multiple changes before the next
render apply together. Closing before first show releases
the root without visibility or close callbacks.

Buttons use current `onOk` and `onCancel` callbacks. A handler
taking `close` can finish manually. A pending Promise shows
loading, and a rejection leaves the dialog available to retry.
An action result from a previous opening leaves a reopened
dialog intact. For Escape, mask click, or the close button,
the original `onCancel` runs after the original `afterClose`.
`destroy()` also calls the original `afterClose` after closing
a shown panel. `afterOpenChange` is read from current
settings.

`Modal.destroyAll()` closes global windows and removes
contextual confirmations, including `App.useApp().modal`.
Removing a contextual panel settles its handle as `false`.
In React, that handle stays pending. In SSR, a global call
returns a passive handle. Contextual confirmations belong to
their request.

Separate roots receive global settings and `holderRender`.
When moved to `document.body` or a custom container, a dialog
receives the computed CSS variables from its provider.
Theme updates change colors on the open panel. Mounted
`locale` providers participate in choosing static Modal
button labels. [ConfigProvider.config](../config-provider.md#global-settings-for-static-calls)

[21 Ant Design 6.6.8 profiles](../../../tests/browser/fixtures/ant-design-modal-static-reference.json) · [Chromium](../../../tests/browser/modal/modal-static.spec.ts)
· [Portalled dialog colors](../../../tests/browser/modal/modal-static-theme.spec.ts) · [SSR and types](../../../tests/package/modal/modal-static.ssr.test.ts)
