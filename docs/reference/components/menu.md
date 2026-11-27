# Menu

Menu displays commands, groups, and submenus with keyboard support.

`prefixCls` sets the local namespace for Menu, items, groups, dividers,
and submenus. The empty string inherits `ConfigProvider.prefixCls`.
Popup and inline lists keep the same prefix. Typography selectors
use their own shared namespace. Canonical variables, the link reset,
and theme `@scope` boundaries are preserved. The templates contain
201 base rules and 77 scoped theme rules. Motion rules are provided
separately. Prefix changes preserve root, item, and title DOM,
selection and open state, refs, IDs, and focus.

The upstream dashed Divider omits its owner's local prefix. Svelte
inherits the resolved Menu prefix and retains dashed styling.
An individual Divider has no independent `prefixCls`.
[Raw measurements and public per-divider prefixCls comparisons](../../../tests/browser/fixtures/ant-design-menu-prefix-reference.json)

```svelte
<script lang="ts">
  import { Menu, type MenuItemType } from '@woodger/antd';
  let selected = $state<string[]>(['overview']);
  let opened = $state<string[]>(['guides']);
  const items: MenuItemType[] = [
    { key: 'overview', label: overview },
    { key: 'guides', label: 'Guides', children: [
      { key: 'setup', label: 'Setup' },
      { key: 'forms', label: 'Forms' }
    ] }
  ];
</script>

{#snippet overview()}<a href="/overview">Overview</a>{/snippet}
<Menu {items} mode="inline" selectedKeys={selected} openKeys={opened}
  onSelect={info => { selected = info.selectedKeys; }}
  onDeselect={info => { selected = info.selectedKeys; }}
  onOpenChange={keys => { opened = keys; }} aria-label="Navigation" />
```

`items` accepts `MenuItemType`: an ordinary item, a submenu with
`children`, `type='group'` with `label` and `children`, `type='divider'`
with `dashed`, or `null`. Items and submenus need stable keys.
Numeric keys are converted to strings for selection, expansion, and
events, and the original value stays in `itemData`. The `label` of
an item, group, or submenu accepts strings, numbers, Snippets, and
nested arrays. `null`, `undefined`, and booleans produce an empty
label. `extra` takes a string, number, or Snippet, and `icon` takes a
Snippet. Items support `disabled`, `danger`, `title`, `class`, and
`style`. Submenus also support `theme`, `popupClassName`, and
`onTitleClick`. Groups add no indentation level and are excluded
from `keyPath`. Item `data-*` attributes pass to its `li`, with
internal Menu markers taking precedence. `ConfigProvider.direction`
sets direction independently of the rc-menu `direction` prop.

A submenu's `theme` affects only its own popup. A deeper submenu
without a theme uses root Menu's theme. For native popovers, CSS
`@scope` further limits light and dark rules so the parent theme
does not spill into a nested popup. Base unscoped rules remain for
browsers without `@scope`.

## Styles and icons

`ConfigProvider.menu` supplies shared `class`, `style`,
`classNames`, `styles`, and `expandIcon`. In a nested provider,
`undefined` inherits the settings. An explicit object, including
`{}`, replaces them in full.

`classNames` and `styles` accept an object or a callback receiving
`{ props }`. `props.theme` defaults to `light`, and
`props.inlineCollapsed` accounts for LayoutSider. Menu has the
following slots.

- `root` styles the root list. Semantic root classes and
  `rootClassName` also apply to popup surfaces.
- `item`, `itemIcon`, and `itemContent` style the first-level item,
  icon, and content.
- `itemTitle` and `list` style a first-level group title and list.
- `subMenu` provides the same slots for items and groups within a
  submenu. An expandable branch's title icon uses the shared
  `itemIcon` at any depth.
- `popup.root` styles the submenu popup surface. For classes,
  `classNames={{ popup: 'navigation-popup' }}` is also accepted.

Provider and instance classes combine. Root styles apply in order:
`provider.styles.root`, `provider.style`, `styles.root`, and `style`.
Local `item.style` overrides the semantic item style. Local
`subMenu.*` and `popup.root` strings replace the matching provider
slot in full. Surface `styles.popup.root` applies after the branch's
`popupStyle`.

```svelte
<script lang="ts">
  import { ConfigProvider, Menu, type MenuExpandIconInfo, type MenuItemType } from '@woodger/antd';

  const items: MenuItemType[] = [
    { key: 'docs', label: 'Documentation', children: [{ key: 'api', label: 'API' }] }
  ];
</script>

{#snippet expand(info: MenuExpandIconInfo)}{info.isOpen ? '−' : '+'}{/snippet}
<ConfigProvider menu={{ classNames: { item: 'navigation-item' }, expandIcon: expand }}>
  <Menu {items} mode="inline" styles={{ subMenu: { item: 'font-weight: 600' } }}
    aria-label="Documentation sections" />
</ConfigProvider>
```

`expandIcon` accepts a Snippet with branch data, `eventKey`, and
`isOpen`. The branch setting takes precedence, followed by Menu
and provider settings. `false` or `null` hides the icon. In horizontal
mode, the first-level title has no expand icon.
[Ant Design 6.6.8 measurements](../../../tests/browser/fixtures/ant-design-menu-config-reference.json)

## Selection and keyboard navigation

`selectedKeys` and `openKeys` set controlled state.
`defaultSelectedKeys` and `defaultOpenKeys` are read at creation for
uncontrolled state. Selection defaults to single, with
`selectable=true` and `multiple=false`. `onClick` runs on the item,
its submenus from nearest to root, and Menu before `onSelect` or
`onDeselect`. The event info contains `key`, leaf-to-root `keyPath`,
`domEvent`, and `itemData`, a shallow copy of the original item.
Selection info adds `selectedKeys`. The deprecated React instance
`info.item` is absent. Reactivating a selected single item keeps
`[key]` and calls `onDeselect`, as in rc-menu 1.5.0. Multiple mode
removes the selected key. `selectable=false` keeps `onClick` and
popup dismissal without changing selection.

### Hover

`onMouseEnter` and `onMouseLeave` on an ordinary item apply to the
row. On a submenu, they apply to the entire branch, including
lists in separate popup containers. `onTitleMouseEnter` and
`onTitleMouseLeave` apply only to the title button. Disabling an
item or title disables its handlers. Branch-wide events remain
available on a disabled submenu.

The handler receives `{ key, domEvent }`. The key is always a string.
`domEvent` is a native `MouseEvent`, with `currentTarget` pointing
to the row or title button during the call. Moving from the title
to its submenu preserves branch hover, including with an open
ShadowRoot. [React 6.6.8 measurements](../../../tests/browser/fixtures/ant-design-menu-hover-portal-reference.json)

`mode` defaults to `vertical` and supports `horizontal` and
`inline`. Hover opens popup submenus.
`triggerSubMenuAction='click'` toggles them by click. Inline
expands on click regardless of this prop. `subMenuOpenDelay` and
`subMenuCloseDelay` are in seconds and both default to 0.1 as in
rc-menu 1.5.0 at runtime. Ant Design's table lists an open delay
of 0. `onTitleClick` applies to title clicks. Opening with the
keyboard updates `openKeys` without that callback. A single
selection closes all popup submenus, while multiple selection
keeps them open. Closing an inline submenu preserves descendant
`openKeys`, and closing a popup removes them.

### Horizontal overflow

In `horizontal` mode, Menu keeps items that fit in the row. An
ellipsis button opens the rest in their original order. Changes
in width, items, or indicator size recalculate the row.
`disabledOverflow` disables this behavior.

`overflowedIndicator` accepts text, a number, or a Snippet. An
omitted prop uses the Ant Design icon. Explicit `undefined`
renders `...`, and `null` and `false` leave its button without visible
content. `overflowedIndicatorPopupClassName` styles the submenu
surface.

The overflow submenu key in `openKeys` is `rc-menu-more`. A moved
item's `keyPath` ends with that key. On collision, the user key
is kept and a hyphen is appended to the internal key until it
is free. A moved first-level item uses first-level semantic styles.

During SSR, all items stay in the row and the indicator stays
hidden until measurement. Once measured, items that do not
fit remain mounted for measurement and are excluded from
navigation. When narrowing hides a focused item, Menu moves
focus to the open submenu or its button. When space increases,
focus returns to the same item in the row. At very small positive
widths, the submenu keeps all items.
[Ant Design 6.6.8 measurements](../../../tests/browser/fixtures/ant-design-menu-overflow-reference.json)

`inlineIndent` defaults to 24px. `inlineCollapsed` changes inline
mode to vertical. If omitted, `LayoutSider.collapsed` is used.
Returning to inline restores cached uncontrolled `openKeys`.
Controlled `openKeys` remain with the owner. If it accepted `[]`
when collapsing, Menu leaves that array as supplied. A first-level
item without an icon shows its first character and retains its
full accessible name.

Submenus mount on first opening. `forceSubMenuRender` mounts
them ahead of time, keeping closed popups hidden in horizontal
mode as well. Inline mode hides retained DOM through `hidden`.
Popups use a native popover and shared positioning. A side submenu
aligns to the top of its title. A horizontal popup aligns to
the bottom left, or bottom right in RTL. The surface flips or
shifts within the viewport. Outside click closes it. Escape
inside a popup closes the current level and returns focus to
the parent. Unmount clears timers, listeners, and animation
frames.

### Submenu motion

Inline lists expand with height and opacity transitions. An
initially open inline submenu occupies its full height immediately.
First-level horizontal and overflow popups use `slide-up`.
Side and nested popups use `zoom-big`. The first open of a lazy
popup goes through `appear`, and later openings use `enter`.

`motion` accepts `MenuMotion` and replaces default motion for
all submenus. The Ant Design map overrides input
`defaultMotions`. Handlers receive the surface element.
`on*Prepare` can return a Promise, while `on*Start` and
`on*Active` can return a CSS string or style object. Positioning
manages popup preparation for `appear` and `enter`.
`motionDeadline` sets a deadline from the start of the active
phase. Returning `false` from `on*End` waits for another event.
[MenuMotion type](../../../src/lib/menu/menu-motion.types.ts)

On close, the list remains in the DOM until `leave` ends and
is excluded from keyboard navigation. Mode changes preserve
the geometry of an exiting surface. `theme.token.motion=false`
and `prefers-reduced-motion: reduce` disable CSS phases. Quick
reopening and unmount invalidate pending frames and previous
preparation results.
[Ant Design 6.6.8 measurements](../../../tests/browser/fixtures/ant-design-menu-motion-reference.json) · [Browser tests](../../../tests/browser/menu/menu-motion.spec.ts)

### Tooltips in collapsed menus

Collapsed Menu shows a Tooltip on item hover. The tooltip opens
on the right in LTR and on the left in RTL. A first-level item
shows its label and `extra`. A nested item's content comes from
`title` or `tooltip.title`. A string `title` also becomes the row's
HTML attribute. `title={false}` removes an item's tooltip if Menu
has no shared content. `tooltip={false}` disables tooltips for all
items.

A `tooltip` object takes Tooltip settings including trigger events,
`placement`, `open`, slots, and `getPopupContainer`. The getter receives
the `li` itself. The Menu class is added to the tooltip's semantic
root. Inside a collapsed LayoutSider, tooltips also work with
`inlineCollapsed={false}`. [Tooltip](tooltip.md)

Expanding hides the open tooltip and cancels pending hover.
`forceRender` retains the hidden surface without a label. Click
first requests Tooltip visibility, then calls Menu handlers.
Svelte sends one close request when the pointer leaves a controlled
tooltip. React 6.6.8 sends two, via `pointerleave` and `mouseleave`.
[Basic measurements](../../../tests/browser/fixtures/ant-design-menu-tooltip-reference.json) · [Configuration measurements](../../../tests/browser/fixtures/ant-design-menu-tooltip-options-reference.json)

### Submenu popup placement

A popup submenu adds 50 to its inherited layer. `popupStyle` and
`styles.popup.root` can set a custom `z-index`.
[Nested popup layers](../theme-context.md#layering-nested-panels)

`builtinPlacements` on Menu replaces built-in positions by name.
First-level horizontal submenus and overflow use `bottomLeft`.
Side and nested submenus use `rightTop`. RTL mirrors side points.
Each supplied entry replaces the position in full. It can set a
pair of `points`, `offset` and `targetOffset` in pixels or
percentages, and `overflow` rules for flipping and shifting at
the edge.

`popupOffset` on a branch supplies a pixel pair `[x, y]` and
overrides only the chosen placement's `offset`. An omitted
coordinate is zero. An empty array resets both. Explicit coordinates
from `popupStyle` or `styles.popup.root` take precedence. These
options also apply to collapsed menus. They are unused for
expanding a list within an inline tree.

With a map or offset, Menu uses Ant Design's calculation for the
dimensions of its own title and panel. When an open submenu
updates, the new map immediately selects the class from the latest
points. Coordinates are recalculated on the next geometry change,
scroll, resize, or opening. [Ant Design 6.6.8 measurements](../../../tests/browser/fixtures/ant-design-menu-popup-alignment-reference.json)

### Trailing item icon

`itemIcon` supplies content after the label and `extra`. At Menu
level it applies to all items, including overflow items. On a
submenu it applies to descendants. `undefined` and `null` inherit
the parent setting. `false` disables the icon in a branch. An empty
item value, including `false` and 0, uses the branch setting.

Supply a string, number, or Snippet with `MenuItemIconInfo`. The
Snippet receives item data, its string `eventKey`, and current
`isSelected`. `icon` remains before the label, and `expandIcon`
applies to the submenu title. [Ant Design 6.6.8 measurements](../../../tests/browser/fixtures/ant-design-menu-item-icon-reference.json)

### Submenu popup content

`popupRender` on Menu supplies popup branch content, including
overflow. A branch's `popupRender` takes precedence for that branch.
Nested branches use their own setting or Menu's setting. Ordinary
inline expansion keeps the default markup. `inlineCollapsed` uses
the popup setting.

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Menu, type MenuPopupRenderInfo } from '@woodger/antd';
</script>

{#snippet popup(origin: Snippet<[children?: Snippet]>, info: MenuPopupRenderInfo)}
  <section>
    {#if typeof info.item.label === 'string'}<strong>{info.item.label}</strong>{/if}
    {@render origin()}
  </section>
{/snippet}

<Menu popupRender={popup} items={[
  { key: 'projects', label: 'Projects', children: [{ key: 'new', label: 'New project' }] }
]} />
```

`info.keys` contains the root-to-branch path. `info.item` contains
branch data, its `eventKey`, and immediate rows in `children`. To
change row order, pass `origin(rows)` a Snippet that renders them
via `{@render info.renderItem(child)}`. A full replacement can put
those rows in its own `ul`. An empty Snippet leaves a popup without
rows.

Rows retain roles, selection, event paths, and `findItem`. Submenu
entry keys, Up and Down, and Home and End follow the rendered row
order. Fields and buttons beside the list retain normal key
handling. `aria-controls` points to the custom popup surface.
Content mounts with that surface and persists after close.
`forceSubMenuRender` mounts it ahead of time.
[Upstream measurements](../../../tests/browser/fixtures/ant-design-menu-popup-render-reference.json)

`getPopupContainer` sets an `HTMLElement` or `ShadowRoot` for each
submenu popup. Omitting the local prop uses
`ConfigProvider.getPopupContainer`. An explicit
`getPopupContainer={undefined}` disables inheritance as in the
Ant wrapper. The getter receives the native title button. React
passes a `div`. Without a getter, native placement applies.
Ordinary inline lists skip the getter. With `forceSubMenuRender`
and a getter, hidden popup copies of inline submenus are also
created without replacing main list refs. A getter declaring a
parameter waits for the DOM title. With forced rendering, a
zero-arity getter can first receive `undefined`. SSR skips the
getter. A new function returning the same container preserves
DOM, drafts, selection, and focus. A different container recreates
popup content as with a React portal. Moved submenus retain
keyboard behavior, hover delays, callbacks, and theme variables.
The consumer supplies styles in ShadowRoot. Comparisons include
ordinary and overflow submenus in `?fixture=menu-container`.

The structure uses `ul` and `li` with `menu`, `menuitem`, `group`,
and `separator` roles. Submenu titles use native buttons, and
`a[href]` in a label stays a real link. Navigation, modifiers,
`target`, and `rel` keep native behavior. Native Enter on a link
runs its callback once through click in place of the duplicate
legacy React keydown and click. Label and group links use the
upstream reset in all modes, including inline and popup
submenus and separate popup containers, independently of
`cssVar`. `linkDecoration`, `linkHoverDecoration`,
`linkFocusDecoration`, and inline styles retain priority. The
reset is scoped to Menu links. The `menu-link-reset` recipe
extracts 14 shared rules from the pinned CSS. The fixture is
`?fixture=menu-link-decoration`. [39 UMD scenarios](../../../tests/browser/fixtures/ant-design-menu-link-decoration-reference.json) ·
[Browser tests](../../../tests/browser/menu/menu-link-decoration.spec.ts)

In inline mode, Up and Down traverse all visible enabled items,
and Enter toggles a submenu. In horizontal mode, Left and Right
move among first-level items with RTL support, and Down and
Enter enter the popup. In a popup, Up and Down traverse the
current level, and Left and Right enter or return with RTL
support. Home and End move to the bounds of the current list,
or of the visible tree in inline mode. Disabled items are skipped.
As upstream, Space does not activate items or submenus.
`ref.focus(options)` prefers a link within an item.
`findItem({key})` returns the mounted item or title element.
`bind:nativeElement` gives the root `ul`.

`theme='light'` is the default regardless of the page algorithm.
`theme='dark'` uses the Menu dark palette with a `#001529`
background. Global primary color, compact mode, and RTL inherit.
With an upstream theme, `components.Menu` receives source defaults
and aliases for item, icon, and group sizes, spacing, the active
bar, and light and dark colors. Separate component algorithms,
CSS prefix, and hash are supported. Deprecated token names are
mapped after defaults are calculated, as upstream. Explicit zeros
are preserved. Nested inline lists inherit root Menu variables.
Each popup has its own scope, with variable updates preserving
position and focus. Plain `style` takes precedence on root Menu.
The popup uses component tokens as a separate surface, as upstream.
Native-only themes retain their styling. Upstream compact mode
uses `itemHeight=35px` and `collapsedWidth=70px`. As in the Ant
wrapper, Menu uses only its own disabled state and item disabled
state. `Form.disabled` and `ConfigProvider.componentDisabled`
leave navigation available. The fixture is `?fixture=menu`.

Use `items` in place of the deprecated `Menu.Item`, `SubMenu`,
`ItemGroup`, and `Divider` children wrappers, which are outside the
port. Standalone Menu does not yet extend the existing Dropdown
contract.
