# Skeleton

```svelte
<script lang="ts">
  import { Skeleton } from '@woodger/antd';

  let loading = $state(true);
</script>

<Skeleton {loading} active avatar paragraph={{ rows: 3 }} aria-label="Профиль участника">
  <p>Анна — разработчик.</p>
</Skeleton>
```

Skeleton shows the structure of content that is loading for the first
time. `loading` defaults to `true`. `active`, `round`, and `avatar`
default to `false`. `title` and `paragraph` default to `true`. While
`loading=true`, children remain unmounted. Changing it to `false`
mounts the children Snippet. Switching back to `true` unmounts the
content and discards its local state and native drafts. Store data that
must survive the swap in the owner. For an update to a form that is
already visible, use Spin to keep its children mounted.

`avatar` accepts a boolean or an object with `shape=circle/square` and
`size=small/medium/large` or a size in pixels. The main Skeleton uses
`large` by default, at 40px or 36px in compact mode. `small` and
`medium` correspond to `control-height-sm` and `control-height`.
`ConfigProvider.componentSize` leaves the selected size intact. With
`title` and no `paragraph`, the automatic shape is `square`. Otherwise
it is `circle`. A numeric size of 0 is valid. Negative or non-finite
sizes use `large`.

`title` accepts a boolean or `{ width }`. `paragraph` accepts a boolean
or `{ rows, width }`. Width is a nonnegative number in pixels or a CSS
string. With a paragraph, title width defaults to 38% without an avatar
or 50% with one. Without a paragraph, the title fills the width. The
paragraph defaults to three rows with a title and no avatar, and two
rows in the other combinations. A scalar width sets the final row. An
array sets each row's width. Missing array elements use ordinary CSS
rules, including the default 61% for the last row when there are at least
three. The final row also gets 61% when the avatar or title is absent.
`rows` is rounded down and capped at 1000. Zero is valid. Negative,
`NaN`, and infinite values use the calculated default row count. Empty
strings and invalid numeric widths use defaults.

`round` rounds the title and paragraph rows. `active` enables CSS
animation. `prefers-reduced-motion` disables it dynamically. The skeleton
inherits colors, density, and direction from ConfigProvider. The main
avatar keeps a 1:1 aspect ratio. Large sizes and widths are constrained
by the available container. Skeleton performs no requests, creates no
timers, and needs no DOM measurements for its markup. SSR renders the
skeleton or ready content immediately according to `loading`.

The root is a persistent named group. `id`, `class`, `style`,
`aria-label`, `aria-labelledby`, and `aria-describedby` apply to it.
The busy container receives `aria-busy`. A separate status outside it
announces `locale.skeleton.loadingText` with polite, atomic updates.
Placeholders are decorative, without accessible headings, controls, or
Tab stops. Russian and English texts are `Загрузка…` and `Loading…`.
Missing fields in `locale.skeleton` fall back to `ruRU`. For a static
preview, `aria-hidden` hides the whole group and suppresses the status.
`ConfigProvider.disabled` leaves the feedback visible.

`ConfigProvider.skeleton` sets `class`, `style`, and object or function
`classNames` and `styles`. A nested record replaces the full parent
record. `undefined` inherits it. The `root`, `header`, `section`,
`avatar`, `title`, and `paragraph` semantic slots are combined with
local values. Callbacks receive `avatar=false`, `title=true`, and
`paragraph=true` by default, along with original optional props including
omitted `active` or `loading`. Root styles apply in the order context
`styles.root`, context `style`, and local `styles.root`. Existing local
`class` and `style` stay on the persistent group. The new `rootClassName`,
context `class` and `style`, and semantic root relate to the decorative
skeleton and are absent when `loading=false`. This preserves the native
contract and avoids duplicated padding.

A local `prefixCls` changes the skeleton's BEM classes. Otherwise it
inherits ConfigProvider's prefix (`ant-skeleton` by default). Theme
variables retain their namespace. Nested avatar, title, and paragraph
accept `class` and `prefixCls`, which replace the corresponding
semantic class and default prefix as with the spread in the upstream
implementation. The combined semantic style replaces their `style`.
Use `styles.avatar`, `styles.title`, and `styles.paragraph` to style
those parts. `bind:nativeElement` points to the skeleton's `div` and
clears to `undefined` when `loading=false` or on unmount. `bind:ref`
gives an object whose `nativeElement` is `null` without the skeleton.
The ref itself clears to `undefined` on unmount. Refs are unassigned
during SSR.

If `loading` removes focused children, focus first moves to the
persistent group with `tabindex=-1`. It stays there when loading ends,
and Tab enters the new content. Skeleton leaves new controls unfocused
and respects focus chosen outside. When unmounting with focus on the
group, focus moves to an accessible saved neighbor in the current
dialog or document. The containing Modal or Drawer handles Escape.

The standalone `Skeleton.Avatar`, `Skeleton.Button`, `Skeleton.Input`,
`Skeleton.Image`, and `Skeleton.Node` are also exported as
`SkeletonAvatar`, `SkeletonButton`, `SkeletonInput`, `SkeletonImage`,
and `SkeletonNode`. These are the same Svelte components. Avatar,
Button, and Input inherit `componentSize`. A local size takes
precedence, including 0 for Avatar. They support `small`, `medium`, and
`large`. Avatar also accepts a number. The main Skeleton's avatar
still defaults to `large`.

Button accepts `circle`, `square`, `round`, `default`, and `block`.
Input supports `block`. These are `span` placeholders without a
button, input, live status, or Tab stop. Image renders the original
decorative SVG. Node renders an empty area or a Svelte children Snippet
and preserves its state across theme, size, and prefix changes.
`active` animates the placeholder. Reduced motion stops the animation
while keeping the background. Node supports the original
`internalClassName`, which replaces the default content class.

On the primitives, object `classNames` and `styles` set `root` and
`content`. `class` and `rootClassName` apply to the outer `div`.
`styles.root` applies there after component variables. `style` applies
to the content and takes precedence over `styles.content` and the
numeric Avatar size. A local `prefixCls` changes the BEM classes.
Otherwise the component inherits the ConfigProvider prefix
(`ant-skeleton` by default). Theme variables retain their namespace.
As upstream, the primitives are independent of `ConfigProvider.skeleton`.
They use the shared size, theme, and prefix without applying the main
Skeleton record.

The Skeleton theme supplies six current tokens for the main Skeleton
and the primitives. It supports `gradientFromColor`, `gradientToColor`,
overrides, aliases, an algorithm, and the CSS variable prefix, key, and
hash. The main Skeleton keeps its native host, status, focus behavior,
sizes, and normalization. The main Skeleton and the primitives inherit
the shared ConfigProvider prefix. Porting React development warnings
remains pending.

The primitive scenarios compare each primitive with Ant Design 6.6.8
in standards mode with matching inherited typography and color from
global design tokens. The main Skeleton scenarios check classes,
declared slot styles, inheritance, and nested props. The persistent
group, title `div`, flex and responsive layout, and normalization are
specific to the native implementation. [98 UMD primitive scenarios](../../../tests/browser/fixtures/ant-design-skeleton-element-reference.json)
· [34 main Skeleton scenarios](../../../tests/browser/fixtures/ant-design-skeleton-main-reference.json)
