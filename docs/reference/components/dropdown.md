# Dropdown

```svelte
<script lang="ts">
  import { Button, Dropdown } from '@woodger/antd';

  let open = $state(false);
  let lastAction = $state('');
</script>

<Dropdown
  bind:open
  trigger={['click']}
  menu={{
    items: [
      { key: 'details', label: 'Открыть карточку' },
      { key: 'export', label: 'Экспорт', disabled: true },
      { key: 'divider', type: 'divider' },
      { key: 'archive', label: 'В архив', danger: true }
    ],
    onClick: ({ key }) => { lastAction = key; }
  }}
>
  <Button>Действия</Button>
</Dropdown>
<output>{lastAction}</output>
```

`menu` uses Menu in vertical mode. `menu.items` accepts commands, groups,
dividers, and submenus with `children`. A command key can be a string
or number. The empty string is valid. The first occurrence of a
duplicate key at the same level wins. `label` accepts a string, number,
or passive Snippet. `icon` is decorative. For a Snippet with complex
or nontext content, supply `textValue` for the command's accessible
name and search text. Keep buttons, links, and inputs out of the
label. An empty list displays `ConfigProvider.locale.emptyText`.
[Menu](menu.md)

`openKeys`, `defaultOpenKeys`, and `menu.onOpenChange` control
expansion. `triggerSubMenuAction` selects hover or click.
`menu.getPopupContainer` supplies a separate submenu container.
External submenu panels count as inside for Dropdown focus and
clicks. `menu.activeKey` highlights a row without moving focus.
Selection is off by default. With `selectable`, use `selectedKeys`,
`defaultSelectedKeys`, `onSelect`, and `onDeselect`. Combining
`selectable` and `multiple` keeps Dropdown open after selection.

For navigation, an item supports `href`, `target`, and `rel`, using
an `a` with `role=menuitem` in place of a button. This adapts the
upstream Menu link label without nesting a link in a button.
A disabled link drops `href` and receives `aria-disabled=true`.
Enter and Space activate it. `preventDefault` in a callback cancels
native navigation and menu closing. On anchor navigation, focus
follows the browser. Without `href`, the command keeps its native
button.

`open` supports `bind:open`. `defaultOpen` is read when the component
is created. When `open` is passed without binding, visibility follows
the owner's value, including rejected open or close requests. Without
an external `open`, state is stored separately from input props.
Updating a spread object preserves menu visibility, command DOM,
and focus without callbacks. Updating `defaultOpen` after mount does
not reset state. Removing external `open` retains the original
fallback to the initial `defaultOpen`.

`onOpenChange(open, { source })` reports visibility requests. The
button, hover, Escape, Tab, and outside click pass
`source: 'trigger'`. On command selection, Dropdown passes `false`
and `source: 'menu'` after `menu.onClick` and before Menu selection
events. Combining `menu.selectable` and `menu.multiple` keeps the
panel open. Owner-driven `open` and closing due to `disabled` do
not call the callback. One Escape press sends one close request,
even when the owner rejects it.

Handlers run from the item through its parent submenus, then
`menu.onClick`. `DropdownMenuClickInfo` adds `keyPath` from the item to
the root and `itemData` to the `key` and native `MouseEvent`. All
handlers for a command receive the same object. `preventDefault`
cancels remaining command handlers, selection changes, and closing.
The owner handles asynchronous operations and errors.
[Ant Design 6.6.8 event order](../../../tests/browser/fixtures/ant-design-dropdown-menu-reference.json)

`trigger` accepts `'hover'`, `'click'`, `'contextMenu'`, or an array
of these, defaulting to `['hover']`. An empty array leaves opening to
the owner. `mouseEnterDelay` and `mouseLeaveDelay` are in seconds
and default to 0.1. Pointer leave requests closing with `hover`
and no `contextMenu`.

`contextMenu` opens the menu on right-click or a keyboard context
menu event. Repeating it moves the open panel to the new point.
An ordinary trigger click, scrolling the trigger's or panel's
container, and window resize request closing. The internal list
can scroll while open. When combined with `hover`, a scheduled
open still runs after the pointer leaves.

Hover leaves current focus in place by default. `autoFocus` also
moves it into the menu on hover, context menu, and owner-driven
opening. In the built-in menu, click, Enter, Space, and ArrowDown
focus the first available command, and ArrowUp focuses the last.
Arrow keys cycle through commands, Home and End go to the
endpoints, and typing searches by prefix. Repeating a letter
cycles through matches, and a one-second pause starts a new
search. Disabled items and dividers are skipped. If there are
no available commands, the menu itself receives focus. Tab and
Shift+Tab close the menu and continue the native Tab order.
Escape and command selection restore focus to the trigger if it
was inside the menu. If the action removes the trigger, the
owner sets the new focus.

Pass one native focusable control in `children`, usually Button.
Dropdown connects the first child element to the menu with
`aria-haspopup="menu"`, `aria-controls`, and `aria-expanded`, preserving
the owner's original ARIA attributes. `aria-label` names the panel
and `aria-labelledby` links it to a label by ID. By default its
name comes from the trigger. `class` and `style` apply to the trigger
wrapper. `disabled` inherits from Form and ConfigProvider, and
explicit `false` overrides context. A natively disabled trigger
also leaves the menu closed.

`bind:ref` returns the trigger DOM node itself, including SVG.
It is available after mount, updates with node replacement, and
clears on unmount. After hydration, opening adds `openClassName`
to that node. It defaults to `${prefixCls}-open`. An empty string
disables the added class. `rootClassName` adds classes to the panel.

`prefixCls` is the local Dropdown CSS prefix. The empty string
inherits the shared `ConfigProvider.prefixCls`. Trigger, popup,
arrow, and internal menu classes use that namespace. The
menu appends `-menu`. `menu.prefixCls` overrides it independently.
A trigger Button keeps its own shared prefix. Canonical theme
variables, IDs, and ARIA keep their names. Changing the prefix
preserves the open popover, command DOM, focus, and label
typeahead. The 77 upstream CSS rules exclude motion and the
upstream title's `flex:auto` and are scoped to local and shared
prefixes. The native wrapper, links, reduced motion, and
`bind:open` and callback contracts are preserved. The label's
existing flex and min-width and the popup's explicit `dir`
remain. The reference distinguishes these native details from
Ant Design styles. [Raw reference and public styles.itemContent and root.direction comparisons](../../../tests/browser/fixtures/ant-design-dropdown-prefix-reference.json)

`classNames` and `styles` accept slot objects or a function of
the current props. `root` styles the Dropdown panel. `item`,
`itemTitle`, `itemIcon`, and `itemContent` apply at all menu levels.
Dropdown supplies these slots in place of `menu.classNames`
and `menu.styles` while preserving the `ConfigProvider.menu`
layer.

`ConfigProvider.dropdown` sets the panel's `class`, `style`,
`classNames`, and `styles`. Slot classes accumulate. The root
applies the provider's `styles.root`, then its `style`, then
local `styles.root`. Item styles combine from provider to
instance. `undefined` inherits the entire setting. An object
in a nested provider replaces it. Provider callbacks get the
effective delays and `autoAdjustOverflow`. Local callbacks
receive input props. Both measurements use Ant Design 6.6.8.
[Provider measurements](../../../tests/browser/fixtures/ant-design-dropdown-provider-reference.json) · [Trigger measurements](../../../tests/browser/fixtures/ant-design-dropdown-appearance-reference.json)

`placement` sets side and alignment, with `top`, `topLeft`,
`topRight`, `bottom`, `bottomLeft`, `bottomRight`, `left`, `leftTop`,
`leftBottom`, `right`, `rightTop`, and `rightBottom`. The default is
`bottomLeft`, or `bottomRight` in RTL. `align` overrides anchor
points, offsets, and overflow rules for the selected placement.
`offset` and `targetOffset` accept numbers and percentages.
`autoAdjustOverflow` defaults to `true`. An object configures
each axis. `false` disables flipping and shifting.

A panel anchored to an element has a minimum width based on
the trigger width. In `contextMenu` mode, width depends on
content and available container space. Set a minimum through
`styles.root`. `arrow` defaults to `false`.
`arrow={{ pointAtCenter: true }}` enables the arrow and points it
at the element center or the specified coordinate. Long lists
scroll. The surface uses a native popover, preserves theme
context, and works in Modal. A nested panel inherits its layer
from context. An integer `z-index` in `styles.root` sets it
explicitly. [Nested popup layers](../theme-context.md#layering-nested-panels)

`getPopupContainer` uses the local function or ConfigProvider
fallback. `undefined` inherits the provider. It is called after
the first opening or when preparing the hidden panel via
`forceRender`.

### Panel content and lifecycle

`popupRender` takes a Snippet with an optional `origin` argument.
To keep the built-in menu in custom markup, call
`{@render origin?.()}`. When `menu.items` is supplied, including
an empty array, `origin` contains the menu. A custom panel can
omit `menu`. A `Menu` added through the Snippet uses the Dropdown
prefix and `ConfigProvider.menu` settings. Dropdown's item slots
apply to the built-in menu. Panel controls receive the
`Form.Item` status and icon and keep their own values and field
names.

With custom content, a click leaves focus on the trigger when
`autoFocus` is off. `autoFocus` focuses the Snippet's single
focusable root or Menu. Arrow keys on the trigger move focus to
the menu or a panel element. The trigger points to the panel as
a dialog using `aria-haspopup` and `aria-controls`.

A custom panel first mounts on the client when opened. By
default, DOM and drafts survive close. `destroyOnHidden` removes
content after the exit animation. `forceRender` mounts the hidden
panel ahead of time on the client and keeps it on close, even
with `destroyOnHidden`. Removing `forceRender` before first opening
removes the prepared panel. Enabling `destroyOnHidden` on an
already closed panel also removes its content. Captures from
a mounted Snippet remain reactive while closed. Replacing the
Snippet takes effect on the next open. A built-in menu without
lifecycle settings keeps its existing hidden SSR shell.

The panel defaults to a slide animation based on the actual
opening side. `transitionName` sets the base name for custom
`*-appear`, `*-enter`, `*-leave`, and `*-active` CSS classes. An empty
string disables the transition. The `theme.token.motion` and system
reduced-motion settings apply. Closing removes the panel from
focus and interaction.

The following references use Ant Design 6.6.8.
[Upstream content scenarios](../../../tests/browser/fixtures/ant-design-dropdown-lifecycle-reference.json) ·
[Menu in a custom panel](../../../tests/browser/fixtures/ant-design-dropdown-replacement-reference.json) · [Animation frames](../../../tests/browser/fixtures/ant-design-dropdown-motion-reference.json)

With an upstream theme, `components.Dropdown` calculates
`paddingBlock`, `zIndexPopup`, and arrow tokens, while aliases set
font, colors, padding, and radii. The internal list has its own
Menu scope, whose aliases supplement Dropdown as upstream.
For example, `components.Menu.fontSize` changes rows and
`components.Menu.itemHeight` leaves `Dropdown.paddingBlock` in effect.
Component algorithms, CSS prefix and hash, zero and undefined
values, and CSS strings are supported. Upstream gap is global
`marginXXS` plus half `sizePopupArrow` with an arrow. Corner
placements use the original `arrowOffsetHorizontal`. Theme
updates preserve DOM, focus, and inline popup positioning.
Native-only styling and existing binding and callback contracts
are preserved.

The context menu and placement measurements cover panel and
arrow geometry, event order, RTL, delays, and dismissal.
[Context menu measurements](../../../tests/browser/fixtures/ant-design-dropdown-context-reference.json) · [Placement measurements](../../../tests/browser/fixtures/ant-design-dropdown-placement-reference.json)

Interaction comparisons also cover touch, delayed hover, menu
scroll, and autofocus. [Interaction comparison](../../../tests/browser/fixtures/ant-design-dropdown-interactions-reference.json)

Built-in Menu measurements cover controlled closing, multiple
selection, and styling. [Menu measurements](../../../tests/browser/fixtures/ant-design-dropdown-menu-reference.json)

Deprecated `Dropdown.Button` is outside the port. Use SpaceCompact
with Dropdown and Button.
