# Avatar

```svelte
<script lang="ts">
  import { Avatar, Badge, Image } from '@woodger/antd';
</script>

<Avatar src="/anna.jpg" alt="Анна Новикова">АН</Avatar>
<Avatar shape="square" size={48} alt="Дмитрий Орлов">ДО</Avatar>
<Badge count={3}><Avatar alt="Вера Смирнова" size="large">ВС</Avatar></Badge>
{#snippet photo()}<Image src="/anna.jpg" alt="Фото Анны" />{/snippet}
<Avatar src={photo} size={64} alt="Анна Новикова" />
```

Avatar displays an image, icon, or member initials. `src` accepts a string
or a Snippet. An empty or omitted `src` uses the fallback. An image takes
precedence, followed by the `icon` Snippet and then the `children`
Snippet. When a string `src` fails to load, `onError` runs once for the
current image. Returning `false` keeps the image and cancels fallback.
Other results select the icon or children. Changing `src` or `srcSet`
allows a new load, including a return to a previously failed address.
Changing only the error handler leaves the load untouched. `srcSet`
alone does not enable image mode. Native `draggable` and `crossOrigin` are
supported.

A `src` Snippet renders directly, even when empty, and takes precedence
over icon and children. Its DOM, attributes, events, and interactivity
belong to the caller. Avatar leaves `srcSet`, `draggable`, `crossOrigin`,
and `onError` outside the Snippet. In particular, Image retains its
own fallback and preview. Changes in Avatar size, theme, and attributes
preserve the Snippet's state. Changing the kind of `src` removes the
previous content. SSR renders the Snippet without accessing browser APIs.

An error belongs to the current revision of `src` and `srcSet`. Late
events from an old image are ignored. The handler can synchronously
replace `src`, and the new source is preserved. After hydration, a
load that has already failed is also checked so fallback works with
SSR images. Listeners are removed when the image is replaced or the
component unmounts. The native `img` manages image loading without
additional timers or network retries from Avatar.

`shape` defaults to `circle` and also accepts `square`. Size inherits
`ConfigProvider.componentSize`. Named sizes `small`, `medium`, and
`large` are 24, 32, and 40px. Explicit `size` overrides the context.
A numeric size can be any positive finite number, including a
fraction. Nonpositive or non-finite numbers use the context size.
With numeric size, text font size is 18px and icon font size is
half the supplied size, as upstream.

`class`, `rootClassName`, and `style` apply to the root.
`ConfigProvider.avatar` sets `class` and `style` for each Avatar. An
omitted record inherits. An explicit object, including `{}`, replaces
its parent in full. Context `style` overrides numeric and responsive
sizes. Local `style` overrides the context. AvatarGroup's root is
independent of this configuration. Its visible avatars, count, and
hidden avatars read the shared record. Theme and RTL inherit, and
native compact mode retains its own Avatar sizes.

`size` also accepts a numeric breakpoint map
`{ xs, sm, md, lg, xl, xxl, xxxl }`, for example
`<Avatar size={{ xs: 24, md: 40, xxl: 100 }}>AB</Avatar>`. The largest
matching breakpoint with a defined value wins. Omitted or
`undefined` entries let smaller matching breakpoints apply. The
`xxl` size continues at `xxxl` if `xxxl` is omitted. When no value
matches, inline sizes are removed and ordinary Avatar tokens apply.
`componentSize` leaves an explicit map intact. Zero stops the lookup
without setting inline geometry as upstream. Responsive icons or
children use half the size as their font size. Without them the
font size is 18px. Local `style` retains precedence.

Thresholds use upstream `screen*` tokens with the original order
validation. The media query map is captured at subscription. As in
6.6.8 `useBreakpoint`, updates to theme thresholds take effect after
leaving and re-entering responsive mode. SSR avoids `window` and
leaves the map without matches. After mount, sizes update without
recreating Avatar, its image, or the focusable owner. Text fitting
is recalculated, and listeners are cleared on unmount. The fixture is
`?fixture=avatar-responsive`. It has 20 upstream variants and 274
measurement sets. [UMD snapshots](../../../tests/browser/fixtures/ant-design-avatar-responsive-reference.json) · [Browser tests](../../../tests/browser/avatar/avatar-responsive.spec.ts)
· [SSR tests](../../../tests/package/avatar/avatar-responsive.ssr.test.ts)

Upstream `theme.components.Avatar` prepares container, text, and icon
sizes using the original rules, including a separate algorithm and
aliases. With the standard `compactAlgorithm`, the named sizes
`small`, `medium`, and `large` are 21, 28, and 35px. Numeric size keeps
its own dimensions and `font-size`. Local `style` applies last.
Shared tokens also apply to AvatarGroup and overflow avatars.

`gap` sets space on either side of text, defaulting to 4px. Finite
nonnegative values are kept, and other values use 4. Long text is
scaled down with a transform that leaves the content intact. Short
text is never enlarged. If the gap takes the full width or the
element is hidden, scale stays at 1 until the next measurement. A
ResizeObserver watches root and text. Changes to size, font, or
children and revealing a hidden element recompute the scale. The
observer is disconnected when replacing the fallback or unmounting.
SSR displays initials without measuring. Fitting takes place after
mount. Avatar adds no animation.

For string `src`, icon, and children, `alt`, `aria-label`, or
`aria-labelledby` names the root with `role=img`. The name survives a
switch from image to fallback. `aria-describedby` describes this
root. The inner image of a string `src` and the icon and children
are hidden from screen readers. The icon and children are also
`inert`. Without a name or with `aria-hidden=true`, the whole Avatar
is decorative. For an action, wrap Avatar in a native named button
or link and hide the duplicate Avatar name if needed. Without
explicit props, Avatar adds no Tab stop, live region, automatic
focus, or root click handler. `title` supplies the native tooltip.

`HTMLAttributes`, data and ARIA attributes, and native events pass
to the root `span`. `onClick` and `onclick` receive a native
`MouseEvent`. `onclick` takes precedence. A click already canceled
still reaches the owner. Enter and Space leave click behavior to
the owner. Local `dir` and `role` override context direction and the
automatic role, with the same naming rules. `bind:nativeElement`
supplies the current `span`, survives configuration, prop, and content
updates, and clears on unmount. SSR creates no ref or browser
resources.

With a `src` Snippet, a named root uses `role=group` and keeps nested
images and controls accessible. Without a group name, the content
uses its own labels. Explicit `aria-hidden=true` hides the Avatar
and makes it `inert`. Keep an interactive Snippet out of another
button or link. The fixture `?fixture=avatar-source` has 14 pinned
variants. [UMD snapshots](../../../tests/browser/fixtures/ant-design-avatar-source-reference.json) · [Browser tests](../../../tests/browser/avatar/avatar-source.spec.ts) ·
[SSR tests](../../../tests/package/avatar/avatar-source.ssr.test.ts)

`AvatarProps`, `AvatarShape`, `AvatarSize`, and `AvatarConfig` are
exported through `index.ts`. Local `prefixCls` changes root, modifier,
and string classes. Omission or an empty string inherits
`ConfigProvider.prefixCls` (`ant-avatar` by default). CSS variable,
Image, and `anticon` names stay shared. The template from 24 original
rules is scoped to the current prefix and preserves fonts and aliases
for nearby default Avatars. Prefix changes preserve root, image,
text fitting, the `src` Snippet, focus, and refs. The stylesheet
lives with the instance and is also emitted in the SSR head.

Upstream Avatar 6.6.8 has no semantic `classNames` or `styles`
declarations. The configuration, DOM, and ref fixture is
`?fixture=avatar-api`. [UMD references](../../../tests/browser/fixtures/ant-design-avatar-api-reference.json) ·
[Browser tests](../../../tests/browser/avatar/avatar-api.spec.ts) · [SSR tests](../../../tests/package/avatar/avatar-api.ssr.test.ts)

The prefix fixture is `?fixture=avatar-prefix`.
[UMD references](../../../tests/browser/fixtures/ant-design-avatar-prefix-reference.json) · [Browser tests](../../../tests/browser/avatar/avatar-prefix.spec.ts) ·
[SSR tests](../../../tests/package/avatar/avatar-prefix.ssr.test.ts)
