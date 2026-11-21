# Listy

Listy переносит Ant Design, @rc-component/listy и
@rc-component/virtual-list. Последняя версия удовлетворяет runtime range
`^1.4.0` Listy и соответствует dev-зависимости закреплённого Ant Design и коду
его официального browser bundle. React runtime не добавляется в пакет.

```svelte
<script lang="ts">
  import { Listy, type ListyRef } from 'antd-svelte';
  const items = [
    { id: 'one', team: 'A', name: 'Alpha' },
    { id: 'two', team: 'B', name: 'Beta' },
    { id: 'three', team: 'A', name: 'Gamma' }
  ];
  let list = $state<ListyRef>();
</script>

{#snippet title(team: string, members: typeof items)}
  <strong>{team} ({members.length})</strong>
{/snippet}
<Listy {items} rowKey="id" height={240} virtual sticky
  group={{ key: item => item.team, title }} bind:ref={list}>
  {#snippet itemRender(item, index)}<a href={`#${item.id}`}>{index}: {item.name}</a>{/snippet}
</Listy>
<button onclick={() => list?.scrollTo({ key: 'three', align: 'top' })}>Show Gamma</button>
```

Точные props, semantic slots и refs описаны в [исходных типах](../../../src/lib/listy.types.ts).
Items принимает readonly массив; rowKey обязателен и не подменяется индексом.
Группы собираются по всему массиву в порядке первого появления ключа, даже когда
записи группы идут вперемежку. Title получает исходные объекты группы;
itemRender — исходный индекс записи. Ноль и пустая строка сохраняются в ключах.
При некорректных duplicate keys записи не удаляются; внутренние occurrence keys
предотвращают фатальную ошибку Svelte. Для корректной идентичности нужны уникальные keys.

Virtual выбирается как `local ?? ConfigProvider.virtual ?? false`. Без ненулевой
height виртуальная ветка выводит все строки; height=0 в raw mode схлопывает viewport.
Виртуальное окно использует исходную оценку высоты, измерения строк с margins,
overscan и сохранение cache по ключам. Поддержаны переменные высоты, resize,
замена/сокращение данных, колесо, nested lists, touch momentum, selection drag и
scrollbar с track click/drag и задержкой скрытия. При смене raw/virtual создаётся
новая ветка со своей прокруткой и cache, как в React.

Ref содержит только scrollTo. Число и `{ top, left }` задают позицию;
`{ key }` и `{ groupKey }` поддерживают top/bottom/auto и offset. В raw mode
используется native scrollIntoView с временными scroll margins; группа означает
целую section. В virtual mode группа означает строку заголовка, выравнивание
повторяется после измерений. Sticky offset применяется для top, включая auto,
который разрешился в top; до измерения заголовка используется оценочная высота.
Отсутствующий ключ сохраняет позицию; виртуальная ветка повторно ищет его во время
обновления данных. Без аргумента либо с null raw mode ничего не меняет, virtual
показывает scrollbar. При одновременно переданных key/groupKey raw mode выбирает
item, virtual mode — group. Горизонтальная виртуализация не входит в API Listy.

ConfigProvider.listy задаёт class/style и semantic root/item/groupHeader.
Локальные значения дополняют классы и перекрывают стили; style перекрывает
styles.root. Callback получает сырые props до defaults/context; generic callbacks
в metadata имеют тип unknown. Virtual root принудительно сохраняет position:relative,
а top закреплённого clone перекрывает пользовательский top.

Непустой prefixCls задаёт локальные классы; empty/undefined наследуют
ConfigProvider.prefixCls. Один prefix используется raw/virtual корнями, items,
группами, sticky headers и scrollbar. Scoped CSS повторяет 16 source rules;
canonical token marker/variables и rc-virtual-list scrollbar variable сохраняются.
Смена prefix сохраняет DOM, refs, cache/scroll, редактор строки, draft/focus/selection.
Сверка: [UMD](../../../tests/browser/fixtures/ant-design-listy-prefix-reference.json),
[browser](../../../tests/browser/listy-prefix.spec.ts),
[SSR](../../../tests/package/listy-prefix.ssr.test.ts), `?fixture=listy-prefix`.

OnScroll (либо native onscroll) получает native UIEvent: currentTarget — raw root
либо virtual holder. Bind:ref и bind:nativeElement появляются после mount и
очищаются при unmount. SSR не создаёт timers/observers; sticky clone появляется
после mount. Нативные ссылки, controls, выделение и focus сохраняются; доступны
RTL, dark, compact и reduced motion. Компонент не добавляет выбор строк,
прикладную навигацию или собственное пустое состояние.
Ссылки itemRender используют source color/decoration, hover/active/focus и inline
priority. Общий [link reset](../../../src/lib/vendor/list-link-reset.css) действует внутри
Listy; прежний native focus-visible ring и внешние ссылки сохраняются.

`theme.components.Listy` применяет `itemPaddingBlock`/`itemPaddingInline`,
font/color/spacing aliases и algorithms в raw/virtual ветках. Оценка высоты строки
следует source: fontHeight плюс удвоенный вертикальный padding, без lineWidth;
фактические высоты уточняются измерением DOM. Явный undefined padding использует
source fallback для оценки. LineHeight темы применяется до semantic/local styles;
без source theme сохраняются прежние CSS и оценки высоты.
Смена темы сохраняет DOM, draft/selection/focus, refs и живой cache измерений.
Поддержаны named CSS variables, nested/reset/sibling scopes, dark/compact и RTL.

В virtual-list 1.5.1 обнаружена пропущенная зависимость `itemHeight` в `useMemo`.
Если semantic styles сохраняют высоты видимых строк, новая оценка не обновляет
невидимую часть до другого изменения списка. Native пересчитывает её сразу,
как свежий mount исходного компонента. Raw измерения 2555→2555px против свежих
2835px сохранены в `staleEstimateObservation` эталона; это отличие оставлено
для отдельного разбора.

React development warnings остаются за пределами переноса.
Проверки: [engine](../../../src/lib/listy.engine.test.ts),
[публичный пакет/SSR](../../../tests/package/listy.ssr.test.ts),
[браузер](../../../tests/browser/listy.spec.ts), `?fixture=listy`.
Темы, видимое окно и высота виртуального содержимого сверяются с
[официальным UMD](../../../tests/browser/fixtures/ant-design-listy-theme-reference.json)
в [unit](../../../src/lib/theme-listy-tokens-reference.test.ts),
[SSR](../../../tests/package/listy-theme.ssr.test.ts) и
[браузере](../../../tests/browser/listy-theme.spec.ts), `?fixture=listy-theme`.
[CSS-рецепт](../../../tools/ant-design-css-recipes.json) воспроизводит
[16 правил](../../../src/lib/vendor/listy.css) без keyframes;
[MIT Listy](../../../src/lib/vendor/LICENSE.rc-listy) и
[MIT virtual-list](../../../src/lib/vendor/LICENSE.rc-virtual-list) включены в пакет.

