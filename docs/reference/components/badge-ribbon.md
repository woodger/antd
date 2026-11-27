# BadgeRibbon

```svelte
<script lang="ts">
  import { BadgeRibbon, Card } from '@woodger/antd';
</script>

<BadgeRibbon text="Новинка" color="green" placement="start">
  <Card title="Материал">Содержимое карточки</Card>
</BadgeRibbon>
```

BadgeRibbon is the separate Svelte export for Badge.Ribbon in 6.6.8. The wrapper
contains children followed by the absolutely positioned ribbon with text and a
decorative corner. Placement defaults to end. Start and end follow RTL. Color
accepts 13 preset colors or an arbitrary CSS color. A preset uses the theme palette
for the ribbon and its corner. A custom color sets the ribbon background and corner
color independently of style. Overriding the background through style leaves the
corner color in place.

Text and children accept a string, number, null, boolean, or snippet. Booleans
render no content and 0 remains visible. Snippets render without an extra wrapper
and retain their controls and events. Placement, color, and theme updates preserve
their DOM, state, and focus. Ribbon adds no Tab stops, live region, or autofocus.

Class and style apply to the ribbon indicator, and rootClassName applies to the
wrapper. ClassNames and styles accept root, content, and indicator slots or a
`({ props }) => slots` callback with resolved placement. Styles are CSS strings.
ConfigProvider.ribbon inherits class, style, classNames, and styles. A local
configuration object on a nested provider replaces the parent.

The indicator's initial style order is color, provider styles.indicator,
provider style, local styles.indicator, then local style. Other slots merge
provider and local settings. Subsequent updates affect only changed CSS properties,
as in React. For example, changing color replaces background while leaving an
unchanged semantic background-color out of the update. The same rule applies to
property removal. Ribbon also applies `theme.components.Badge`, including aliases,
algorithms, compact and dark themes, and a custom cssVar.prefix.

`bind:nativeElement` exposes the wrapper div and clears on unmount. This is the
Svelte counterpart to React RibbonRef. Local prefixCls changes DOM classes and
the shared reset. Geometry follows ConfigProvider.prefixCls as in upstream. The
shared prefix also changes wrapper, indicator, content, and corner selectors.
A local prefix keeps that relationship in place. The fixture is `?fixture=badge-ribbon`.
[44 official UMD cases](../../../tests/browser/fixtures/ant-design-badge-ribbon-reference.json) · [Browser tests](../../../tests/browser/badge/badge-ribbon.spec.ts) · [SSR tests](../../../tests/package/badge/badge-ribbon.ssr.test.ts)
