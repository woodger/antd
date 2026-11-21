# BadgeRibbon

```svelte
<script lang="ts">
  import { BadgeRibbon, Card } from 'antd-svelte';
</script>

<BadgeRibbon text="Новинка" color="green" placement="start">
  <Card title="Материал">Содержимое карточки</Card>
</BadgeRibbon>
```

BadgeRibbon — отдельный Svelte export для Badge.Ribbon 6.6.8. Обёртка содержит
children, затем абсолютную ленту с text и декоративным уголком. Placement по
умолчанию end; start/end следуют RTL. Color принимает 13 preset colors или
произвольный CSS-цвет. Для preset лента и уголок используют палитру темы;
произвольный color задаёт background ленты и color уголка независимо от style.
Поэтому изменение фона через style не перекрашивает уголок.

Text и children принимают строку, число, null/boolean или Snippet; boolean не
выводится, 0 сохраняется. Snippets передаются без дополнительной обёртки и
сохраняют свои controls и события. Изменение placement/color/темы не пересоздаёт
их DOM, состояние и фокус. Собственных остановок Tab, live-region или
автоматического фокуса Ribbon не добавляет.

Class/style относятся к индикатору ленты, rootClassName — к обёртке.
ClassNames/styles принимают slots root/content/indicator либо callback
`({ props }) => slots`; props содержит разрешённый placement. CSS styles
задаются строками. ConfigProvider.ribbon наследует class/style/classNames/styles;
локальный объект настройки во вложенном provider заменяет родительский.
При первом выводе indicator действуют: color → context styles.indicator → context style →
local styles.indicator → local style. Остальные slots объединяют context и local.
Затем, как React, Ribbon меняет только изменившиеся CSS-свойства. Например,
обновление color переписывает background, не применяя заново неизменённый
background-color из semantic styles. То же правило действует при удалении свойств.
Настройки `theme.components.Badge` применяются также к Ribbon, включая aliases,
algorithm, compact/dark и custom cssVar.prefix.

`bind:nativeElement` возвращает div обёртки вместо React RibbonRef и очищается
при unmount. Локальный prefixCls меняет DOM-классы и shared reset; геометрия,
как в исходнике, привязана к ConfigProvider.prefixCls. Общий prefix меняет также
wrapper/indicator/content/corner selectors; локальный prefix отдельно эту связь не меняет.
44 эталона — [официальный UMD](../../../tests/browser/fixtures/ant-design-badge-ribbon-reference.json),
проверки — [browser](../../../tests/browser/badge-ribbon.spec.ts) и
[SSR](../../../tests/package/badge-ribbon.ssr.test.ts), фикстура — `?fixture=badge-ribbon`.

