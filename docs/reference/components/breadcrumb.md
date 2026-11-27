# Breadcrumb

Pass `items` in order from the top-level section to the current page. Give
the last item just a title.

```svelte
<script lang="ts">
  import { Breadcrumb } from '@woodger/antd';

  const items = [
    { title: 'Проекты', href: '/projects' },
    { title: 'Команда', href: '/projects/team' },
    { title: 'Участники' }
  ];
</script>

<Breadcrumb {items} />
```

Breadcrumb uses `nav`, `ol`, and `li` elements and accepts items shaped as
`{ key?, title?, href?, path?, menu? }`. `title`, `separator`, and
`dropdownIcon` accept strings, numbers, booleans, and Snippets. Keep a title
Snippet passive. Use `itemRender` for custom interactive elements. With the
default renderer, `title=0` renders as `"0"`, and `true` becomes `"true"`
after the upstream string conversion. `null`, `undefined`, `false`, and the
empty string skip items without a menu. Native props, `class`,
`rootClassName`, `style`, and `bind:nativeElement` apply to the `nav`.
Name the landmark with `aria-label` or `aria-labelledby`.

`path` removes one leading slash, substitutes each `params[key]` once, and
appends the segment to preceding paths as `href="#/" + paths.join('/')`.
Empty segments are preserved and URLs are left unencoded. `path` overrides
`href` only on the item that supplies it. An item with just `href` adds no
segment. `title` substitutes all `:key` matches, leaving the original text
for a falsy parameter. This behavior comes from `getPath` and
`getBreadcrumbName` in 6.6.8. The `items` array replaces the React children
syntax for `Breadcrumb.Item` and `Breadcrumb.Separator`.

The separator resolves from the local prop, then
`ConfigProvider.breadcrumb.separator`, then `"/"`. `null` and `undefined`
fall through, while `false` and `""` disable automatic separators.
`{ type:'separator', separator? }` creates a separate `aria-hidden` list
item even when automatic separators are off. Its default is also `"/"`.
As in the source, the last visible item may retain a separator if followed
by empty items. The final `href` is retained. Item `aria-*` and `data-*`
attributes and classes pass through to the default `a`, `span`, or
`button`. `onClick` without `href` uses a native `type=button` button in
place of the clickable span in upstream.

`itemRender` is a `Snippet<[route, params, originalItemsOrRoutes, paths]>`
that supplies the entire `li` contents. `paths` contains the cumulative
prefix for the current item. The parent treats the Snippet as opaque, so
an empty Snippet leaves the `li` in place. A React callback returning
`null` could remove it. Supply a native trigger in a custom menu template.

`classNames` and `styles` support `root`, `item`, and `separator`, as an
object or a callback receiving `{ props }`. `ConfigProvider.breadcrumb`
provides shared `class`, `style`, and semantic defaults. Classes accumulate.
Root styles apply after component variables in this order: context
semantic, context plain, local semantic, and local plain. Item and separator
styles apply to the `li`. Callbacks receive the resolved separator and the
existing native defaults of the other props, including `params={}` when it
is omitted. The original callback behavior with absent `params` is captured
separately. [Raw reference](../../../tests/browser/fixtures/ant-design-breadcrumb-config-reference.json)

The concrete type of `params` and `itemRender` is preserved. Configuration
accepts the same semantic callbacks as the local props. The pinned
`BreadcrumbItem.tsx` leaves `item.style` unused, and Svelte preserves that
behavior. Use `styles.item` or `itemRender` for item styles.

`menu.items` accepts `key`, `title`, `label`, `path`, `disabled`,
`danger`, and `onClick`. `label` takes precedence over `title`. A truthy
`path` is appended to the resolved parent href without adding a slash.
Navigation uses `path`. The raw `menu.items.href` on its own creates no link
in upstream and is unused here. `dropdownProps` passes to the current Svelte
Dropdown with `placement=bottom` by default. `dropdownIcon` resolves from
the local prop, then `ConfigProvider.breadcrumb.dropdownIcon`, then the
standard arrow. `null` and `undefined` fall through, `false` hides it, and
`0` renders. Native menu links retain their `href` and support Enter, Space,
callbacks and `preventDefault`, typeahead, and disabled state. This adapts
the earlier flat Dropdown. Support for arbitrary React Menu options is
pending. Theme, compact mode, and RTL come from ConfigProvider.

`undefined` inherits the parent configuration record. An explicit object,
including `{}`, replaces it in full. Updating styles, separator, icon, or
items preserves key DOM nodes, native `href`, focus, and callbacks. Icons and
separators may be Snippets. The existing native Dropdown wrapper stays in
place.

The Dropdown wrapper inside a Breadcrumb item aligns with the text baseline
of neighboring links, spans, and buttons, including when the trail wraps or
uses a custom `itemRender`. This rule is scoped to Breadcrumb. Standalone
Dropdown typography and alignment are unaffected.

Breadcrumb links use `linkDecoration`, `linkHoverDecoration`, and
`linkFocusDecoration` in every theme mode, all defaulting to `none`. The
reset is scoped to the component. Inline link styles take precedence and
external links retain their styling. With a custom `itemRender` in a menu
item, the outer wrapper adds no Tab stop. Escape restores focus to the first
accessible native control in the item.

With an upstream theme configuration, `components.Breadcrumb` receives
seven upstream defaults covering item, link, final item, and separator
colors, icon size, and separator spacing. It supports aliases, component
algorithms, CSS prefixes and hashes, zero values, and `undefined`. The menu
arrow inherits its color from the item. Link text has a separate color.
A custom `dropdownIcon` and semantic styles preserve this order. Semantic
root styles and plain `style` take precedence after the component tokens.
The popup uses its own Dropdown and Menu scopes. Theme updates preserve
native links, focus, navigation, callbacks, and native-only styling.

Fixtures are `?fixture=breadcrumb`, `?fixture=breadcrumb-theme`, and
`?fixture=breadcrumb-config`. Unit, SSR, and Chromium tests cover routes,
parameters, separators, Snippets, styles, menus, canceled navigation, and
production hydration. The `breadcrumb` recipe extracts 21 rules without
keyframes. The full Menu API remains in the migration scope.

`prefixCls` sets the root, item, link, overlay, and separator classes.
`undefined` and the empty string inherit `ConfigProvider.prefixCls`
(`ant-breadcrumb` by default). The local prefix takes precedence. Semantic
callbacks receive the original local value. Changing the prefix preserves the
DOM of links and the open menu, focus, callbacks, and navigation. The canonical
theme marker, native Dropdown wrapper and baseline, and link decoration
states are preserved. Dropdown and Menu settings belong to their own
component families. The `breadcrumb-prefix` CSS recipe reproduces the same
21 rules as a module template.

In 6.6.8, BreadcrumbSeparator ignores the local owner prefix. With
`prefixCls="trail"` inside a provider using `prefixCls="suite"`, its class
remains `suite-breadcrumb-separator` and its side margins become `0px`
instead of `8px`. Svelte also passes the owner prefix to the separators. The
reference captures the raw classes and geometry and the `matchedSeparators`
case, where upstream receives the owner class through the public
`classNames.separator` prop without changing the UMD bundle. The fixture is
`?fixture=breadcrumb-prefix`. [Reference](../../../tests/browser/fixtures/ant-design-breadcrumb-prefix-reference.json) ·
[Browser tests](../../../tests/browser/breadcrumb/breadcrumb-prefix.spec.ts) · [SSR tests](../../../tests/package/breadcrumb/breadcrumb-prefix.ssr.test.ts)

The raw reference preserves the full upstream `textContent`. Text
comparisons use visible trigger and separator fragments because the closed
native Dropdown stays in the DOM and whitespace between Svelte elements
leaves item contents intact.
