# Drawer

```svelte
<script lang="ts">
  import { Button, Drawer, Input } from '@woodger/antd';

  let open = $state(false);
</script>

{#snippet footer()}<Button onclick={() => { open = false; }}>Close</Button>{/snippet}

<Button onclick={() => { open = true; }}>Edit</Button>
<Drawer bind:open title="Member details" {footer}>
  <label>Name<Input defaultValue="Anna" /></label>
</Drawer>
```

Drawer uses a native dialog. `bind:open` passes visibility requests to
the owner. Without the binding, Drawer can close on its own. Initial
`open={true}` prepares content during SSR and opens the dialog after
hydration. The server-rendered dialog stays closed until the client
connects.

`title`, `extra`, and `footer` accept text, a number, a Snippet, or an
array of content. Zero renders as text. An empty string, `false`,
`null`, and `undefined` hide the area. `true` and an empty array keep an
empty area, as in Ant Design. Pass `children` as a Snippet. The title
uses `h2`. Place interactive actions in `extra` and `footer`.

Without a title, name the dialog with `aria-label` or
`aria-labelledby`. An external `aria-labelledby` takes precedence.
`aria-label` overrides the automatic association with the visible
heading. `id`, `role`, `aria-*`, `class`, and `style` apply to the native
`dialog`. `data-*` applies to the sliding `*-content-wrapper`.
`maskClassName` adds to `classNames.mask`.

`prefixCls` sets the namespace for Drawer and its mask, panel, header,
body, and footer. The empty string inherits `ConfigProvider.prefixCls`.
The 32 upstream CSS rules exclude motion, pure, inline, resizable,
and skeleton styles and are scoped to the root. Canonical variables
and internal native dialog and size markers are preserved. Button
in `extra` or `footer` uses its own shared prefix. Prefix changes
retain the open dialog, panel and input DOM, drafts, focus, selection,
IDs, scroll lock, and focus restoration. Internal motion and backdrop
logic uses attributes independently of BEM classes.

`placement` is the physical side `top`, `right`, `bottom`, or `left`,
defaulting to `right`. RTL changes the content direction while keeping
the side. `size` sets width for left or right and height for top or
bottom. `default` is 378px, `large` is 736px, and a positive number
in pixels or a valid CSS length such as 50% or 30rem can be used.
The viewport limits size. An empty string or nonpositive or
non-finite number uses the default. Header and footer stay in
place, and a long body scrolls.

`resizable` displays a resize handle at the free edge. Dragging
changes width for left or right and height for top or bottom.
Initial `defaultSize` applies until the owner supplies `size` or the
user resizes. `maxSize` caps the proposed value. The minimum during
drag is zero. A percentage size is measured when the gesture begins.

With `size`, the owner accepts the new value via
`resizable.onResize(size)`. `onResizeStart(size)` receives the initial
size in pixels and `onResizeEnd(size)` measures the result. After
closing, the recorded size persists until content is removed.
Closing, disabling resize, and changing sides cancel an active
gesture.

`closable` controls the close button. `false` hides it. An object
accepts `placement: 'start' | 'end'`, `disabled`, `closeIcon`, and ARIA
attributes. By default, the button is before the title.
`placement: 'end'` puts it after `extra`, accounting for RTL.
Local `closable` determines placement as a whole. Icon, disabled
state, and ARIA attributes can inherit individually. The locale
supplies the default button name.

The icon can be a string, number, or Snippet. At the top level,
`closeIcon={false}` or `closeIcon={null}` hides the button when
`closable` is omitted. Inside a `closable` object, `closeIcon: false`
keeps a button without an icon. `closeIcon: null` removes the button
and keeps the header area.

`keyboard={false}` disables Escape dismissal for the top drawer.
`mask` accepts a boolean or an object with `enabled`, `closable`,
and `blur`. By default, the mask is enabled, closes on click, and
is unblurred. The pointer press must begin and end on the backdrop
to close. With `mask={false}` or `mask={{ enabled: false }}`, page
clicks and scrolling remain available. Drawer still passes the
original Form and ConfigProvider contexts to its children.

`ConfigProvider.drawer` supplies `mask`, `focusable`, `closable`,
`closeIcon`, and styling. Local fields take precedence. A boolean
`mask` overrides only `enabled`. Thus `mask={true}` retains the
provider's `blur` and `closable`. An explicit `drawer` object in a
nested provider replaces its parent in full.

`zIndex` sets the panel's layer and the base for nested dialogs
and popups. Drawer accepts explicit zero. [Nested popup layers](../theme-context.md#layering-nested-panels)

A user close first writes `open=false` to the binding, then calls
`onClose(Event)` once with `click` for the button, `cancel` for
Escape, or `pointerup` for the backdrop. The callback reports the
request and cannot cancel it. Owner-driven `open`, native
`dialog.close()`, and unmount leave `onClose` uncalled. A native
close synchronizes the binding. A delayed event from an old close
leaves a reopened dialog visible.

The section calls `onclick`, `onmouseenter`, `onmouseover`,
`onmouseleave`, `onkeydown`, `onkeyup`, and `onfocusin`.
`event.currentTarget` refers to the section from `bind:panelRef`.
Events follow DOM nesting, including after moving the section with
`getContainer`. Clicking the close button calls `onClose` before the
event reaches the section's `onclick`. The mask calls `onClose` with
its own event. `preventDefault()` in `onkeydown` cancels Escape
dismissal. [Event and attribute reference](../../../tests/browser/fixtures/ant-design-drawer-dom-reference.json) · [Chromium](../../../tests/browser/drawer/drawer-dom.spec.ts)
· [SSR](../../../tests/package/drawer/drawer-dom.ssr.test.ts) · [Hydration](../../../tests/browser/drawer/drawer-dom-hydration.spec.ts)

By default, a masked Drawer opens via `showModal()`. The browser
focuses the first accessible control or the dialog itself, makes
the background inert, and traps focus. Closing restores focus
to the opener. `focusable.trap` controls trapping independently
of the mask. `focusable.focusTriggerAfterClose={false}` disables
restoration. `autoFocus={false}` preserves current focus when
focus can move freely. With trapping enabled, focus stays in the
panel. Without explicit `aria-modal`, it is added when the mask
and trap are enabled. Select, Tooltip, and Popover handle their
own Escape before Drawer.

Drawer stacks with Modal and other modal Drawers. A nested panel
pushes its parent into the viewport by 180px by default.
`push={false}` disables the push, and `push={{ distance: 56 }}` sets
a distance in pixels. Explicit `push={true}` inherits the parent's
distance. The push remains while any nested panel is open. A
native modal Drawer locks page scroll, including in ShadowRoot.
A controlled Drawer with a mask locks the page with the default
portal or explicit `document.body`.

Content is lazy and keeps local state and DOM drafts in the
closed dialog after first opening. `forceRender` mounts it
immediately and retains it even with `destroyOnHidden`.
`destroyOnHidden` removes header, body, and footer after exit.
Turning it off does not remount already destroyed content.
Unmounting Drawer destroys its content and releases modality.
State stored outside stays intact. Retained hidden fields stay
in the DOM and the form's native FormData. Their timers and
subscriptions keep running. The form owner must open a closed
drawer before focusing an error inside it.

## Content and styling

`loading` replaces `children` with a five-row animated Skeleton.
The header, actions, and footer stay in place. When content returns,
its fields remount and their local drafts reset.

The Drawer boundary clears the outer `Form.Item` status and
validation indicator. A local `Form.Item` and an explicit field
`status` set styling within the panel. [Ant Design 6.6.8 comparison](../../../tests/browser/dialog/dialog-form-style.spec.ts)

`drawerRender` receives a section Snippet to wrap or replace.
Drawer still owns the mask, sliding wrapper, and resize handle.
If the replacement removes the title, name the dialog with
`aria-label` or `aria-labelledby`. `bind:panelRef` receives the
section `HTMLDivElement` at mount and clears to `undefined` when
the section is removed.

```svelte
{#snippet decorate(section)}
  <div class="drawer-frame">{@render section()}</div>
{/snippet}

<Drawer open drawerRender={decorate} title="Member details">
  <p>The panel content goes here.</p>
</Drawer>
```

`classNames` and `styles` accept a slot object or function of
`{ props }`. For `root`, `mask`, `wrapper`, `section`, and `dragger`,
the function receives wrapper props with resolved mask and focus
settings. For `header`, `title`, `extra`, `body`, `footer`, and
`close`, it receives section props with inherited `closable` if
omitted locally. `styles` accepts CSS strings.

Provider and instance slot classes accumulate.
`ConfigProvider.drawer.class` adds a section class, and its
`style` applies between the provider and instance slot styles.
`rootClassName` adds to the dialog class. `rootStyle` applies after
`styles.root` and `style`. [Ant Design 6.6.8 reference](../../../tests/browser/fixtures/ant-design-drawer-panel-reference.json) ·
[Chromium](../../../tests/browser/drawer/drawer-panel.spec.ts) · [SSR](../../../tests/package/drawer/drawer-panel.ssr.test.ts) · [Hydration](../../../tests/browser/drawer/drawer-panel-hydration.spec.ts)

## Motion and theme

The panel slides from the chosen side, and an enabled mask
changes opacity. Explicit `styles.wrapper` with `transform` and
`styles.mask` with `opacity` apply during transitions as well.
`afterOpenChange` keeps its completion timing. When a close
is requested, the dialog retains its mode until the animation
ends. Updates to `mask` and `focusable` apply to the same open
dialog. Reopening interrupts exit and preserves drafts. Reduced
motion disables animation. Toggling it finishes a running
animation. `afterOpenChange(open)` runs after show or hide
completes. At `afterOpenChange(false)`, the dialog is already
closed and its content remains available until the next Svelte
update. An interrupted exit produces no hide notification.
Hydrating initial `open={true}` produces one show completion.

### Custom transitions

`motion` accepts `DrawerMotionConfig` or a function of
`placement`. `maskMotion` controls the mask independently.
Omitting a setting uses the default animation for that surface.
An empty object disables it. A string `motionName` sets the
CSS class base. A map sets names for individual phases.
`motionAppear`, `motionEnter`, and `motionLeave` enable their
respective phases. `motionLeaveImmediately` starts leave on a
premounted, closed Drawer that remains hidden.

`on*Prepare` can return a Promise. Preparation runs without a
CSS transition if that phase is enabled. `on*Start` and
`on*Active` receive `null` as the second argument and return a
CSS string or property object. Panel handlers receive the section
from `bind:panelRef`. Motion classes and styles apply to its
wrapper, with `styles.wrapper` taking precedence. Mask handlers
receive the mask itself, and `styles.mask` styles it.

`on*End` receives `transitionend` or `animationend` from the
section or mask. A positive `motionDeadline` sets a deadline
in milliseconds from the start of the active phase and passes
`{ deadline: true }`. Returning `false` keeps the transition
active until another event. For a transition that animates only
the wrapper, use `motionDeadline`.

`afterOpenChange` follows panel completion. The mask reports
visibility via `maskMotion.onVisibleChanged` and can finish later
if Drawer content stays mounted. `maskMotion.forceRender` and
`removeOnLeave: false` inside `maskMotion` can retain the hidden
mask. For a mask kept after display, `leavedClassName` sets the
hidden class. Drawer's own `forceRender` and `destroyOnHidden`
control the full panel lifecycle. [Transition reference](../../../tests/browser/fixtures/ant-design-drawer-motion-api-reference.json) ·
[Chromium](../../../tests/browser/drawer/drawer-motion-api.spec.ts) · [SSR](../../../tests/package/drawer/drawer-motion-api.ssr.test.ts) · [Hydration](../../../tests/browser/drawer/drawer-motion-api-hydration.spec.ts)

### Theme

`theme.components.Drawer` configures `zIndexPopup`,
`footerPaddingBlock`, `footerPaddingInline`, aliases, and component
algorithms. The user `style` on the root dialog takes precedence.
The title inherits panel color as in 6.6.8. Nested Button and
Input keep their own tokens. `draggerSize` sets the resize handle's
thickness. Theme and inheritance reset updates preserve modality,
DOM, drafts, selection, and focus, including after moving
via `getContainer`. Default styling is preserved. The UMD comparison
accounts for outer ConfigProvider typography: React sets it on a
static host through public `theme.useToken()`, while Svelte
sets it on the provider DOM container.
[UMD comparison and tests](../theme-context.md#dialog-and-notification-checks)

Size, push, and events were checked against 100 Ant Design 6.6.8
frames. In the UMD, closing one of two open child Drawers resets
the parent's push. In Svelte, each open panel keeps its own
registration. [100 Ant Design 6.6.8 frames](../../../tests/browser/fixtures/ant-design-drawer-geometry-reference.json)

Mask, focus, scroll, and Escape were compared with 118 React UMD
states. The UMD sets `aria-modal="true"` even without a mask.
In Svelte, that attribute reflects the interaction settings.
[118 React UMD states](../../../tests/browser/fixtures/ant-design-drawer-focus-reference.json)

`getContainer` supports the same DOM nodes, DocumentFragments,
selectors, functions, and `false` as Modal. `undefined` inherits
`ConfigProvider.getPopupContainer`, which Drawer calls with
`document.body` like the Ant wrapper. The getter also runs while
closed, except with `destroyOnHidden` without `forceRender` while
content is unneeded. [Modal](modal.md#modal)

When `open` changes, Drawer resolves the container again after the
DOM update. The node may appear before opening or in the same
update, on either side of Drawer in the template.
`afterOpenChange(true)` runs once when the panel opens in the
resolved node. [Ant Design 6.6.8 comparison](../../../tests/browser/drawer/drawer-container-timing.spec.ts)

A different container recreates the panel and cancels the old
animation. Replacing the getter with one returning the same
container preserves DOM, state, and focus. In controlled mode,
the default portal moves the same dialog to the nearest dialog
or `body`. Explicit `getContainer={false}` keeps that panel in
its original container with absolute positioning. Existing
modal inline settings retain fullscreen geometry and the native
focus barrier. The reference uses `@rc-component/drawer` 1.4.2
and portal 2.1.3. The package retains the upstream license.
[LICENSE.rc-drawer](../../../src/lib/vendor/LICENSE.rc-drawer)
