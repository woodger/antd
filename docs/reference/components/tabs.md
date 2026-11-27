# Tabs

```svelte
<script lang="ts">
  import { Input, Tabs } from '@woodger/antd';

  let activeKey = $state<string | undefined>('profile');
</script>

{#snippet profile()}
  <label>Name<Input defaultValue="Anna" /></label>
{/snippet}
{#snippet history()}<p>Recent profile changes.</p>{/snippet}

<Tabs
  aria-label="Member sections"
  bind:activeKey
  items={[
    { key: 'profile', label: 'Profile', children: profile },
    { key: 'access', label: 'Access', disabled: true },
    { key: 'history', label: 'History', children: history }
  ]}
/>
```

`items` accepts a readonly array of `TabsItem`: a string `key`,
`label` (string, number, boolean, `null`, or passive Snippet),
optional `children` (a Snippet), `icon`, `disabled`, `forceRender`,
`destroyOnHidden`, `closable`, and `closeIcon`. Keys identify panels
across reordering, preserving content and focus. The empty string
is valid. The first occurrence of a duplicate key wins. Icons
are decorative. Labels must give tabs accessible names and contain
no interactive elements. `aria-label` or `aria-labelledby` names the
tab list. `id`, `class`, and `style` apply to the root.

`items[].className` and `items[].style` apply to the corresponding
tabpanel. Classes are appended after `classNames.content`. CSS
strings apply in order: `styles.content`, `item.style`, and motion
style. Each panel has its own overrides. For example,
`{ key: 'profile', label: 'Profile', children: profile, className: 'profile-panel', style: 'padding-inline:12px' }`.
Live style updates preserve DOM, local state, drafts, selection,
and focus.

`bind:activeKey` holds the selected key. `defaultActiveKey` is read
at creation. Without a key, the first available tab is selected.
With a binding, set the initial value in the owner and omit
`defaultActiveKey`. An unknown, removed, or disabled key displays
the first available panel. The external value is retained, so
restoring that key's tab selects it again. With no available tabs,
no panel is selected and the tablist can receive focus. Empty
`items` displays `ConfigProvider.locale.emptyText`.

`onTabClick(key, MouseEvent)` runs on click and native Enter or
Space activation, including on the selected tab. `preventDefault`
cancels the panel change. The binding then updates and
`onChange(key)` runs if the selected tab changed. Owner updates,
default changes, fallback on removal or disabling, and focus
movement leave `onChange` uncalled. Availability is rechecked
after `onTabClick` because the handler can remove or disable
the tab.

Keyboard navigation uses manual activation. Arrow keys cycle
focus, skipping disabled tabs. Home and End focus the first and
last available headers. Horizontal lists use Left and Right with
RTL support, and vertical lists use Up and Down. Enter and Space
activate the focused tab. Headers contribute one Tab stop.
Returning to the list focuses the selected tab. In line and
card modes, Tab moves from the list to the named active panel,
then to its fields and buttons. Hiding a focused panel or
removing or disabling a focused header moves focus to an
available header or tablist. Changes while focus is outside Tabs
leave it outside.

Content is lazy. It first mounts on activation and is retained
in the hidden panel by default, including child local state
and DOM drafts. `destroyOnHidden=true` removes it on hiding, or
after leave when panel motion is active. The next visit mounts
a new instance. Turning off `destroyOnHidden` after destruction
does not remount a panel by itself. The item setting overrides
the shared one, including explicit `false`. This retains the
native v1 contract. rc-tabs 1.13.0 gives explicit shared
`destroyOnHidden` precedence. `forceRender=true` mounts content
immediately and keeps it even with `destroyOnHidden`. Removing a
key always destroys its panel. Panel removal preserves state
held outside Tabs.

`?fixture=tabs-destroy` compares eight current official UMD
scenarios. Six match upstream, and two record retained item
precedence.

Retained hidden panels stay in the DOM and their timers and
subscriptions keep running. Fields in visited or force-rendered
panels participate in native FormData even when hidden. Fields
that have yet to mount or were destroyed are absent. Tabs
does not act as a form field. Each item's `disabled` controls
navigation independently of Form and ConfigProvider disabled
state. Headers use `type=button` and do not submit the surrounding
form.

`type` supports `line`, `card`, and `editable-card`.
`tabPlacement` supports `top`, `bottom`, `start`, and `end`.
Start and end are relative to RTL. On viewports up to 575px,
a vertical list moves to the top. Overflow scrolls. Navigation
reveals the focused header without scrolling the whole page.
`size` uses shared `ComponentSize` values `small`, `medium`,
and `large`, defaulting to `ConfigProvider.componentSize`.
Explicit `medium` overrides provider size. Theme, compact mode,
RTL, and reduced motion use existing tokens.

The upstream theme applies `theme.components.Tabs` with 26
upstream defaults, aliases, and component algorithms. Card
heights contribute to calculated padding before explicit
overrides. Zero and `undefined` retain upstream behavior. The
More popup inherits the same scope, including CSS variable
prefix and hash. Native themes keep existing styling.
The upstream theme allows a header below the native 32px
minimum. `?fixture=tabs-theme` compares 15 themes and 10 variants
in LTR and RTL and the popup with the official UMD. Theme
changes preserve DOM, drafts, selection, and focus.

`animated` defaults to `{ inkBar: true, tabPane: false }`.
`false` turns both animations off. `true` enables both without
initial panel appear. An object configures each independently.
`tabPane=true` replaces the supplied `tabPaneMotion`, including
callbacks, with the default `ant-tabs-switch`, as in 6.6.8.

For a custom transition, pass
`animated={{ tabPaneMotion: motion }}` and omit `tabPane`.
rc-tabs enables it automatically. Explicit `tabPane=false`
keeps motion but removes the body's animated class.
`motionName` accepts a string with phase suffixes or a map of
names. It supports appear, enter, and leave flags, immediate
leave, a deadline in milliseconds, `visible`, `forceRender`,
and `removeOnLeave` overrides, `leavedClassName`, and lifecycle
callbacks. `eventProps.className` and `eventProps.style` apply
in steady state. CSS phases override them. Motion sets
`display:none` for a hidden force-rendered panel. As upstream
CSSMotion, `leavedClassName` overrides `eventProps.className` on
a retained panel. A custom `motionName` needs transition CSS.
Positive `motionDeadline` finishes it without a CSS end event.
Prepare can return a Promise and also runs at
`theme.token.motion=false`. Start and active receive a native
`div` and `event=null` and return a CSS string applied after
content styles. End receives a native event or
`{ deadline: true }`. Returning `false` from end keeps the
transition active. Prepare and start read DOM with prepare
classes. Active reads it with start classes.

During leave, the outgoing panel retains DOM, local state,
and FormData. `aria-hidden` and `inert` immediately remove it
from navigation. Focus within the panel moves to the new header.
Quick return cancels destruction. `onVisibleChanged` runs after
DOM commit. An initial hidden mount produces no callback.
Independent deadline timers imply no ordering between panels,
as upstream. Native `prefers-reduced-motion` and disabling
motion live finish CSS transitions. Unmount cancels frames,
timers, and prepare continuations. Empty native panel shells
and item destruction precedence are retained.

`classNames` and `styles` accept an object or pure function
`({ props }) => slots`. Slots are `root`, `item`, `remove`,
`indicator`, `body`, `content`, `header`, and `popup.root`.
A `popup` string is shorthand for `popup.root`. Styles use CSS
strings. `remove` applies to remove buttons in headers and More.
Callbacks receive upstream size semantics: `undefined` without
a size on the component or provider, physical `tabPlacement`
before mobile fallback, and items with normalized
`destroyOnHidden`. Other fields retain supplied Svelte props,
and `bind:activeKey` stays live.

`ConfigProvider.tabs` supplies `class`, `style`, semantic slots,
add, remove, and more icons, and `indicator`. Omission inherits
the record. An explicit object in a nested provider replaces
it in full, as in Ant Design. Provider and component classes
accumulate. Root CSS applies in order: provider `styles.root`,
provider `style`, local `styles.root`, and local `style`.
`tabBarStyle` follows `styles.header`. Semantic indicator
styles follow calculated line geometry.

```svelte
<ConfigProvider tabs={{
  classNames: { header: 'section-tabs' },
  styles: { item: 'padding-inline:12px' },
  indicator: { size: 24, align: 'start' }
}}>
  <Tabs {items} classNames={{ content: 'section-panel' }} />
</ConfigProvider>
```

More icon precedence is local `more.icon`, then global
`tabs.more.icon ?? tabs.moreIcon`, then local `moreIcon`.
Explicit local `more.icon`, including `null`, `false`, and
`undefined`, overrides the fallback. Global `tabs.more` uses
only `icon` as in 6.6.8. Set trigger and other options locally.
Own `more.overlayClassName` and `more.overlayStyle` fields override
semantic `popup.root`, even with explicit `undefined`.

`rootClassName` adds a class to the root. Native title and data
attributes and handlers pass to the `HTMLDivElement`.
`bind:nativeElement` supplies the root `div` after mount and
clears on unmount. It is unassigned in SSR. The binding
returns the node directly. `aria-label` and `aria-labelledby`
retain their role naming the tablist. Configuration and semantic
style updates preserve DOM, drafts, and focus.

`indicator={{ size: 12.5, align: 'center' }}` sets indicator length
and alignment. Size accepts a pure function such as
`(origin) => origin - 20`. `origin` is the entire horizontal
header width or vertical header height with fractional precision.
Full size and `align=center` are the defaults. Start and end
account for RTL. Zero and negative values pass to CSS without
clamping. Nullish `indicator.size` inherits
`ConfigProvider.tabs.indicator.size`. Align inherits separately.
The formulas, including end transform in RTL, follow
rc-tabs 1.13.0. Measurement runs after mount. SSR does not call
size callbacks. Updates are scheduled on a frame, with
rounded value comparisons suppressing indicator jitter.
Indicator updates preserve scroll, focus, selected tab, and
panel state.

`onTabScroll` receives
`{ direction: 'left' | 'right' | 'top' | 'bottom' }` on native
header scroll changes along the current axis. Directions are
physical, including in RTL. Focusing a header can also scroll.
Repeated scroll events at the same position leave the callback
uncalled. Browsers can combine neighboring changes into one
native event. Scrolling remains native, while React uses
transforms, wheel, and touch. Replacing the callback retains
position. The listener clears on unmount.

`centered=true` centers a horizontal header list while space
allows. As upstream, a vertical list stretches in height
and keeps headers at the top. `tabBarGutter` sets a pixel gap
before all headers except the first and before Add when the
list is nonempty. Zero removes the default gap. Fractions and
negative values are kept. Horizontal uses `margin-inline-start`
with RTL, while vertical uses `margin-top`. Moving to the top
on mobile changes the gap axis. `tabBarStyle` accepts a CSS
string for the entire header including extra content. Root
`style` applies separately. For example,
`<Tabs {items} centered tabBarGutter={12} tabBarStyle="margin-bottom:8px" />`.

`tabBarExtraContent` sets the right slot or `{ left, right }`
with a string, number, boolean, or Snippet. These slots sit
outside the tablist and allow native interactive controls.
Arrow navigation excludes them. As in `@rc-component/tabs`
1.13.0, falsy extra content including 0 creates no wrapper.
Numeric `label=0` still renders.

In editable-card mode, `onEdit(target, action)` requests a change
from the owner. Add receives a native click event and remove
receives a string key, including the empty string. The owner
changes `items` and `activeKey`. Edit alone leaves `onChange` and
`onTabClick` uncalled. `hideAdd=true` hides Add. Disabled and
`closable=false` prevent removal. `closeIcon=null` or `false`
hides the button only when `closable` is omitted. `closable=true`
keeps the button with the fallback icon. Precedence is a
truthy `closeIcon`, then `removeIcon`, then `×`. Nullish
`removeIcon` uses CloseOutlined. Falsy `addIcon` uses
PlusOutlined. Boolean `true` leaves an empty icon and retains
the button's accessible name. Icons are passive TabsContent
or Snippets.

Delete, Backspace, and middle-click request removal and move
focus forward, or backward for the last available tab, skipping
disabled tabs. This still happens if the owner rejects the
change to items. Clicking close leaves tab activation untouched.
Explicit focus chosen outside Tabs is preserved. The selected
tab's close and Add are in Tab order. Other close buttons have
`tabindex=-1`. `locale.addAriaLabel` and `locale.removeAriaLabel`
supply names, defaulting to `Add tab` and `remove`.
`locale.dropdownAriaLabel` names the hidden tab listbox and
defaults to `expanded dropdown`. An explicit empty string is
preserved.

```svelte
<script lang="ts">
  import { Tabs, type TabsItem } from '@woodger/antd';

  let items = $state<TabsItem[]>([{ key: 'first', label: 'First tab' }]);
  let next = 1;
</script>

<Tabs type="editable-card" aria-label="Sections" {items}
  locale={{ addAriaLabel: 'Add tab', removeAriaLabel: 'Close tab' }}
  onEdit={(target, action) => {
    if (action === 'add') {
      const key = `new-${next++}`;
      items = [...items, { key, label: 'New tab' }];
    } else if (typeof target === 'string') {
      items = items.filter(item => item.key !== target);
    }
  }} />
```

On overflow, More shows tabs outside the visible range,
including partly clipped and disabled tabs. Native scrolling
remains. Add moves to the operations area, retaining its DOM
node, focus, and card gutter. Mobile detection follows the
is-mobile 5.0.0 default independently of the placement breakpoint.
For a mobile user agent, More is hidden while scrolling and
Add remain available.

A nonempty `prefixCls` supplies classes for Tabs, navigation,
panels, and More. An empty value inherits
`ConfigProvider.prefixCls`. Switch names use the local Tabs
prefix, and default More slide uses the shared prefix
independently of `cssVar.prefix`. Canonical theme markers and
shared keyframes are preserved. A prefix change retains the
active panel, DOM and refs, drafts, selection, focus, and an
open popup and its editor. Internal focus requests use stable
attributes. Editable and custom cells scroll fully into view,
including the remove button, so the active tab does not appear
in More when only its text is visible. The fixture is
`?fixture=tabs-prefix`. [Official prefix reference](../../../tests/browser/fixtures/ant-design-tabs-prefix-reference.json) ·
[Browser tests](../../../tests/browser/tabs/tabs-prefix.spec.ts) · [SSR tests](../../../tests/package/tabs/tabs-prefix.ssr.test.ts)

More opens by hover with 0.1s enter and leave delays.
`more.trigger` also supports click, focus, context menu, and
an array of events. `showAction` and `hideAction` replace open
and close actions separately. An empty array disables that
side. The upstream context-menu close action is click.
Hover without click gets touch toggling. After touch, hover
is ignored until the next handled click. A close action
of `focus` fires on button blur even when focus enters the
popup, as in upstream Trigger.

ArrowDown, Enter, and Space on the button open the list
without selecting. Up and Down then change the active item,
skipping disabled items. The first Up retains the upstream
choice of the second-to-last enabled item. Tab moves focus
into the list, where arrows, Home, and End move among native
options. Selection from the More button with hover keeps
the list open. Clicking an option closes it. Keyboard
selection uses a native click, so public `onTabClick`
continues to receive a MouseEvent, including its PointerEvent
subtype. Close calls only `onEdit` and keeps the list open.
The owner updates items. Escape closes a nested surface
first, then More, then the enclosing Modal.

`more.icon` overrides legacy `moreIcon`, including `null`,
`false`, 0, and the empty string. When both are omitted,
the upstream EllipsisOutlined is used. Explicit
`more.icon=undefined` gives the string `More` as in rc-tabs.
An empty decorative button retains the native name
`ellipsis`. More accepts `placement`, `mouseEnterDelay`,
`mouseLeaveDelay`, `autoFocus`, `minOverlayWidthMatchTrigger`,
`overlayClassName`, `overlayStyle`, `onOverlayClick`, and
`getPopupContainer`. CSS styles are strings. Root
`getPopupContainer` is supported, with the More override
taking precedence, including explicit `undefined`. The
portal retains theme and the popup's own CSS variables.

`ConfigProvider.getPopupContainer` is inherited when the
Tabs root prop is omitted. Explicit root
`getPopupContainer=undefined` disables provider inheritance
as in upstream prop spreading. More takes further
precedence, including its own `undefined`. These rules
also apply to default tab bar props in `renderTabBar`.
Semantic callbacks receive raw props.

More alignment follows rc-dropdown and rc-trigger 3.10.1.
`placements` replaces the entire map. `builtinPlacements`
takes precedence, and explicit `undefined` gives Trigger an
empty map. `align` shallowly overrides the selected placement,
including the full `overflow`. Points are physical and
unchanged in RTL. `offset` and `targetOffset` accept numbers
or percentages of the popup and target respectively. It
supports flipping and shifting, upstream `adjust=0`, the
`htmlRegion` values `visible`, `scroll`, and `visibleFirst`,
and `dynamicInset` for right and bottom including legacy
`_experimental.dynamicInset`. Upstream 3.10.1 ignores old
`useCssRight`, `useCssBottom`, `useCssTransform`, and
`ignoreShake`.

`alignPoint` uses the latest client coordinate from click,
hover, or context menu. Without one, keyboard and touch use
the button. Point mode disables default stretch.
`minOverlayWidthMatchTrigger=true` enables it, and an own
`undefined` disables it. A point menu that hides on click
closes on scroll or resize. Hover retains the point even if
the button leaves the viewport. `onPopupAlign` receives the
popup and actual alignment after flipping and before offsets
are written. The call count is unspecified, and idle frames
do not produce a callback loop. Alignment and callback are
skipped at zero scale. CSS `overlayStyle` overrides offsets
and arrow variables.

```svelte
<Tabs {items} more={{
  trigger: 'contextMenu',
  alignPoint: true,
  align: { offset: ['10%', 4], overflow: { adjustX: true, adjustY: true } }
}} />
```

`arrow=true` adds low-level Dropdown's arrow div and show-arrow
class. Upstream Tabs supplies no styles to the div. Use
`popup.root` to style it. AutoFocus and Tab work with the
overlay and skip the arrow div. Autofocus runs on open.
Alignment and size updates in the same session preserve
focus in a custom field. An updated `getPopupContainer` with
the same DOM container preserves the portal and text
selection. Flipping switches CSS insets even with identical
coordinates. The native popover remains fixed in the top
layer and tracks layout changes. Ancestor clipping contributes
to the available area. Measurement uses the real border box
with custom `box-sizing:content-box`. The upstream logic's MIT
licenses are included. [rc-dropdown](../../../src/lib/vendor/LICENSE.rc-dropdown) · [rc-trigger](../../../src/lib/vendor/LICENSE.rc-trigger)

`more.visible` with `true` or `false` overrides internal
requests and `onClose`. As in rc-tabs, `more.onVisibleChange`
replaces the internal pointer and dismissal callback. Pass
both fields for controlled mode. Keyboard opening and
`aria-expanded` use the internal OperationNode flag.
Explicit `more.visible=undefined` enables a separate
uncontrolled Trigger. Pointer actions control the popup,
while keyboard and `onClose` only change the OperationNode
flag. In this branch, Dropdown omits the open class and
does not move focus via autofocus or Tab. Changing
`visible` resets Trigger's internal value as in upstream
`useControlledState`.

`popupRender` receives the menu Snippet and
`{ restTabs, onClose }`. `more.overlay` is a Snippet replacing
both menu and `popupRender`. Keyboard selection from More
works without the original menu DOM. Content is lazy and
retained after first opening. `autoDestroy=true` removes
content and popup at leave end. Reopening during leave
retains DOM and state. The exiting surface stays
`aria-hidden` and `inert`, leaving Escape to the next popup
or Modal.

By default More uses `ant-slide-up` with placement overrides.
`transitionName` supplies another CSS motion prefix. An empty
string disables motion. A nonempty `animation` takes
precedence and gets the `ant-tabs-dropdown-` prefix. The
consumer supplies CSS for a custom name. Theme motion off
and reduced motion finish transitions. `openClassName`
replaces the open button's class, with an empty string
removing it. The existing native SSR shell is retained
without content, unless `autoDestroy=true`.

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Tabs, type TabsMoreRenderInfo } from '@woodger/antd';

  const items = Array.from({ length: 12 }, (_, index) => ({
    key: String(index),
    label: `Tab ${index + 1}`
  }));
</script>

{#snippet popup(menu: Snippet, info: TabsMoreRenderInfo)}
  {@render menu()}
  <button type="button" onclick={info.onClose}>Close list</button>
{/snippet}
<Tabs {items} aria-label="Sections" more={{ trigger: 'click', popupRender: popup }} />
```

`renderTabBar` receives resolved navigation props and a
Snippet for the default bar. It can wrap the bar, override
its props, or build a custom header.

```svelte
<script lang="ts">
  import { Tabs, type TabsDefaultTabBar, type TabsTabBarProps } from '@woodger/antd';

  const items = [{ key: 'profile', label: 'Profile' }, { key: 'history', label: 'History' }];
</script>

{#snippet bar(props: TabsTabBarProps, DefaultTabBar: TabsDefaultTabBar)}
  <div class="custom-bar">
    {@render DefaultTabBar({ ...props, className: 'custom-header', style: 'padding-top:8px' })}
  </div>
{/snippet}
<Tabs {items} renderTabBar={bar} />
```

Spread the full prop set onto the default bar. Its overrides
affect navigation only. For example, `activeKey` highlights
a header while Tabs still owns the active panel. The
supplied `onTabClick` runs native selection and can be
replaced or called from a custom handler. KeyboardEvent
from a fully custom bar is converted to MouseEvent for
public `onTabClick`, preserving modifiers, target and
currentTarget, and cancellation. Callback ref `ref` receives
the default bar's DOM node and gets `null` when replaced or
on unmount. SSR does not call it.

Native popup theme inheritance is preserved. In the original
UMD, replacing `more.overlayClassName` can remove the internal
CSS variable scope and reset text color to the browser
default. The native portal keeps inheriting the Tabs theme.

The default bar's `children` is a Snippet
`(node, item, attributes)` wrapping each header.
`node(overrides)` supplements or replaces its original DOM
attributes. Use `attributes` to retain class, style, and
handlers and add Svelte attachments. As in upstream TabNode,
the outer node is separate from the native tab button.
The button's click stops bubbling before the outer
`onclick`. Use `props.onTabClick` for bar-wide selection
handling. The owner handles item reordering and drag and
drop, as in the official example.

A custom bar owns keyboard behavior and ARIA.
`getTabsItemId(props.id, key, 'tab' | 'panel')` links its
controls to native panels, including for empty and Unicode
keys. Panels, state, and root ref survive renderer updates
and replacement. The default bar's `tabPosition` and
`popupClassName` follow the pinned rc-tabs TabNavList
interface, independently of the removed Tabs root props.
[Tab navigation types](../../../src/lib/tabs/tabs-nav.types.ts)

`?fixture=tabs-editable` compares truthiness, icons, and sizes
with Ant Design 6.6.8 and `@rc-component/tabs` 1.13.0.
It checks callbacks, acceptance and rejection by the owner,
focus, FormData, layout and RTL, and preserved panels.

`?fixture=tabs-layout` compares centering, gutter, and header
styles with 31 official UMD references covering all types
and placements in LTR and RTL, zero gap, and an empty
editable list. It also checks medium, size inheritance, and
panel retention on placement changes.

`?fixture=tabs-overflow` compares 35 official UMD More
references for hidden tabs, CSS metrics, SVG, icon
precedence, RTL, and locale. It covers the keyboard,
controlled ownership and callbacks, `popupRender`, the portal,
nested surfaces, and focus.

`?fixture=tabs-more-runtime` checks lifecycle, overlay
precedence, independent actions and touch, `visible=undefined`,
and motion phases against 33 UMD references. It also checks
`autoDestroy` after leave, reversal, motion updates, and
portal cleanup.

`?fixture=tabs-more-position` compares 51 official UMD
geometry references for placements, offsets, overflow
and regions, point targeting, arrow, callback payload, and
container. Live checks cover DOM, state, drafts, selection,
focus, callback loops, scroll and resize, the anchor leaving
the viewport, and cleanup. Existing Tour scenarios also
cover the shared numeric engine.

`?fixture=tabs-indicator` compares 52 official UMD indicator
references and `onTabScroll` directions across eight RTL and
placement combinations. It also checks DOM, focus, More,
scroll preservation, and frame and listener cleanup.

`?fixture=tabs-semantic` compares 22 official UMD references
for semantic slots, CSS layers, callback props, provider
inheritance, and icon precedence. It checks native
attributes, events, ref, and live updates to an open popup.

`?fixture=tabs-motion` compares 41 UMD references for phases,
CSS, callbacks, precedence, RTL, and lifecycle. It also
checks unfinished transitions, FormData, focus, reversal,
`end=false`, async prepare, reduced motion, and cleanup.
Eight scenarios cover per-item class and style, semantic
and motion precedence, hidden force render, and RTL,
including live updates during transition.

`?fixture=tabs-render` compares 35 UMD references for props,
overrides, per-tab wrappers and attributes, callbacks, More,
RTL, and an empty editable set. It also checks SSR, native
keyboard and cancellation, attachments, and bar updates
that preserve DOM, state, drafts, selection, focus, and
open More.

Panel destruction retains native v1 precedence. Remaining
low-level Dropdown and Trigger options for More need a
separate audit. The ported arrow, alignment and point
alignment, placements, actions, callbacks, overlay, and
motion are described above.
