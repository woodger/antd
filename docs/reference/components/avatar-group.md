# AvatarGroup

```svelte
<script lang="ts">
  import { AvatarGroup, type AvatarGroupItem } from '@woodger/antd';

  const members: AvatarGroupItem[] = [
    { key: 'anna', label: 'Anna Novikova', text: 'AN', src: '/anna.jpg' },
    { key: 'dmitry', label: 'Dmitry Orlov', text: 'DO' },
    { key: 'vera', label: 'Vera Smirnova', text: 'VS', size: 'small' }
  ];
</script>

<AvatarGroup items={members} size="large" max={{ count: 2 }}
  aria-label="Project team" />
```

AvatarGroup is a separate Svelte export for `Avatar.Group`. `items`
accepts a readonly array of `AvatarGroupItem` with required `key` and
`label`. Keys are strings or numbers. The first occurrence is kept
and duplicates are dropped before applying the limit. The number 0
and string `'0'` are distinct. The owner's order is preserved and the
input array and its items are left intact. Reordering by key in the
visible group or open list preserves each Avatar's DOM and state.
The group consumes `key`, `label`, and `text` instead of passing them
to the avatar's DOM. Other item DOM props and callbacks apply to its
Avatar. Set `bind:nativeElement` on a standalone Avatar. `items` does
not create bindings for individual refs.

`class`, `rootClassName`, and `style` apply to the group `div`.
`bind:nativeElement` supplies it after mount and clears on unmount.
`ConfigProvider.avatar` classes and styles apply to the avatars,
including the count and visible overflow, with the group root kept
separate. The group's `prefixCls` changes its group, RTL, and popover
classes. Members and the count keep their own prefixes. Set an item's
`prefixCls` separately as for upstream Avatar children. The group
border applies to avatars with a matching prefix. Native wrapping,
overlap, the labeled list, the +N button, and focus recovery are
preserved. Updating the prefix changes the open popup class while
keeping its content. Styles are removed on unmount.

An item supports Avatar props and optional `text` for string initials.
A children Snippet takes precedence over `text`. Avatar then uses its
usual order: image, icon, content. `label` supplies the full name via
`alt` by default. Explicit `alt` and ARIA props are preserved.
Item size and shape override the group values, followed by Avatar
and ConfigProvider defaults. String and numeric sizes, breakpoint
maps, fallback, and text fitting work as in Avatar.

`max.count` limits the visible members. The +N button is separate.
With five members, `count=2` gives two Avatars and +3. The full set is
visible without a limit, or with zero, a negative, or a non-finite
value. A positive fraction is truncated to an integer with a minimum
of 1. A limit at or above the number of unique members omits the
button. `max.style` styles the Avatar inside the +N button.

Without custom triggers, the native behavior defaults to hover and
click. Updating `max` keeps the button and open list in place while
hidden members remain.

The upstream overflow Avatar is a `span` that the browser does not
focus. Svelte retains its native +N button, so the focus trigger is
accessible by keyboard. Raw upstream measurements record real focus
separately from a dispatched `focusin` for the Popover handler.

`max.popover` accepts the current Svelte Popover options except
`children`, including content, visibility, callbacks, container
getters, ARIA, classes and styles, trigger, placement, arrow,
`autoAdjustOverflow`, `mouseEnterDelay`, and `mouseLeaveDelay`.
`class` and `style` apply to the Popover wrapper. `popupClass` joins
the group popover class. The defaults are hover and click at `top`.
The native button opens on click, Enter, Space, or hover. Use
`click` or `focus` in custom triggers for keyboard access. Popover
shows a named list of hidden members with full labels. Its avatars
are decorative except for `src` Snippets, which retain their own
accessibility and controls. Explicit `aria-hidden=true` makes those
decorative too. `title` replaces the list heading and `content`
replaces the list. An explicit key with `null`, `false`, or
`undefined` disables the corresponding default. `true` leaves an empty
section, and `0` renders. Snippets are created after the first open
and are not called during SSR. Without a custom title, the locale
supplies the name. Otherwise it comes from the title or explicit
`aria-label` or `aria-labelledby`. `aria-describedby` and `aria-busy`
pass to the popup surface.

Nested `max.popover.open` is controlled through `onOpenChange`, as in
the upstream group. The owner accepts or rejects requests. Without
`open`, state is local and `defaultOpen` is read once at overflow
creation. Removing controlled `open` clears local state without
restoring `defaultOpen`. External changes to `open` leave the
callback uncalled. A rejected close keeps the popup open and focus
in place. After a rejected open, the next click can request it again.

```svelte
<script lang="ts">
  import { AvatarGroup } from '@woodger/antd';

  let open = $state(false);
  const members = [
    { key: 'anna', label: 'Anna', text: 'AN' },
    { key: 'vera', label: 'Vera', text: 'VS' }
  ];
</script>

{#snippet details()}<input aria-label="Team comment" value="Draft" />{/snippet}

<AvatarGroup items={members} max={{
  count: 1,
  popover: {
    title: 'Team',
    content: details,
    open,
    onOpenChange: next => { open = next; },
    destroyOnHidden: false
  }
}} />
```

`destroyOnHidden` defaults to `true`. Closing removes the list and custom
Snippets. `false` retains their DOM and state after the first open.
Retained content stays reactive under Svelte Popover's rules. An
explicit `destroyOnHidden=undefined` removes the group default, so
Popover keeps its content. `getPopupContainer` has the same
precedence and lifecycle as in Popover. The getter receives the
native +N button. An item moving between the visible group and
Popover gets a new Avatar instance. Image preview inside the list
keeps Popover open. The first Escape closes the preview and returns
focus to the image. The next closes Popover and returns focus to +N.

The root is a named group with no Tab stop or live region of its
own. The +N button has `type=button`, an accessible name with the
full count, and an ARIA link to Popover after mount. Escape returns
focus to the button. If the limit or list removes the button, or the
group is removed, focus returns to an accessible nearby control in
the active dialog or document. Focus explicitly chosen by the owner
is respected. When overflow reappears, it creates a closed Popover.
`componentDisabled` leaves the informational overflow button enabled.

Group, list, and button labels come from `locale.avatarGroup` with
partial inheritance. `aria-label` and `aria-labelledby` override the
group name, and `aria-describedby` describes the root. `id`, `class`,
and `style` also apply to the root. The group inherits theme, compact
mode, and RTL and wraps avatars on narrow screens. Native themes keep
the 8px logical overlap and theme background-colored border. With
upstream themes, Avatar's `groupOverlapping` and `groupBorderColor`
set the overlap and border. `groupSpace` sets row spacing in the
existing overflow list. The Popover resets unrelated alias overrides
to provider values, and hidden avatars receive their own Avatar
tokens. The native Popover uses the Popover API. The group adds no
animations of its own.

`AvatarGroupProps`, `AvatarGroupItem`, `AvatarGroupKey`,
`AvatarGroupMax`, and `AvatarGroupLocale` are exported. Arbitrary
replacements for Avatar and upstream Popover options still missing
in Svelte Popover remain pending, including motion and full
`React.memo` freezing of opaque Snippets. `id`, `forceRender`,
`fresh`, and `zIndex` pass through. `forceRender` also prepares a hidden
Snippet after mount, retaining lazy SSR and the subsequent
destroy-or-retain lifecycle. The current `max.popover` type is derived
from PopoverProps. [PopoverProps](../../../src/lib/popover/popover.types.ts)

Tests cover alias, count and style, and trigger and placement
precedence. [20 UMD references](../../../tests/browser/fixtures/ant-design-avatar-group-max-reference.json) · [SSR tests](../../../tests/package/avatar/avatar-group-max.ssr.test.ts) ·
[Browser scenarios](../../../tests/browser/avatar/avatar-group-max.spec.ts)

Tests also cover content, controlled and default state, destroy or
retain behavior, and container getters. [33 UMD sequences](../../../tests/browser/fixtures/ant-design-avatar-group-popover-reference.json) ·
[SSR tests](../../../tests/package/avatar/avatar-group-popover.ssr.test.ts) · [Browser lifecycle tests](../../../tests/browser/avatar/avatar-group-popover.spec.ts)
