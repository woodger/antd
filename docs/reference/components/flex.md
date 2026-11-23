# Flex

```svelte
<Flex gap="small" justify="space-between" wrap>
  <Button>Первое действие</Button>
  <Button>Второе действие</Button>
</Flex>
```

Flex не оборачивает детей; нативный component создаёт один корневой элемент. Children — Snippet;
без содержимого контейнер скрывается CSS-правилом :empty, как в Ant Design.
Orientation=horizontal/vertical имеет приоритет над vertical. В вертикальном
режиме без align используется stretch. Align/justify поддерживают значения,
для которых эталон генерирует классы; остальные CSS-настройки доступны через style.
Wrap принимает boolean или wrap/nowrap/wrap-reverse; false не добавляет класс.

Gap принимает small/medium/large, число в px или CSS-строку, включая
составной row/column gap. Preset-интервалы используют токены padding: 8/16/24px.
Ноль сохраняется. Flex принимает CSS shorthand либо число без единицы.
Числовой и произвольный CSS gap, а также flex имеют приоритет над одноимёнными
декларациями style. Preset gap задаёт CSS-класс, поэтому inline style имеет
приоритет: gap="small" со style="gap:99px" даёт 99px, gap={12} — 12px.
Component выбирает нативный HTML-тег (default=div) или Svelte-компонент; bind:nativeElement даёт
текущий HTMLElement и обновляется при смене тега. Class/rootClassName/style,
нативные атрибуты и события передаются корню. Собственные роли, tabindex,
reset шрифта и обработчики клавиатуры не добавляются. RTL меняет визуальное
направление, сохраняя DOM-порядок и нативный Tab.

Фикстура — `?fixture=flex`.
SSR/Chromium-проверки покрывают структуру, направления, выравнивание, gap/flex,
перенос строк, пустое содержимое, смену тега, события, фокус, темы и RTL.
ConfigProvider.flex задаёт vertical/class/style. Undefined наследует record,
явный объект, включая {}, заменяет его целиком. Приоритет направления:
orientation → local vertical → provider vertical → horizontal. Provider style
идёт перед local style, затем применяются flex и custom gap; preset gap остаётся классом.
Локальный prefixCls меняет корень и все layout-классы; пустая строка выбирает ant-flex.
CSS variables сохраняют namespace, собственный stylesheet добавляется при SSR и
не меняет соседние Flex, включая prefix, совпадающий с private marker.

Пользовательский component получает атрибуты, события, class/style/dir и children
без дополнительного элемента. Class поддерживает стандартные Svelte ClassValue.
Layout props потребляются Flex. Дополнительные параметры проверяются через generic
FlexComponentProps; FlexProps остаётся расширяемым интерфейсом для прежних потребителей.
Для nativeElement custom root должен объявить `$bindable()` без fallback и связать
его с корнем; без forwarding Flex не подставляет найденный DOM-элемент.

```svelte
<!-- CustomRoot.svelte -->
<script lang="ts">
  import type { FlexRootProps } from '@woodger/antd';
  let { children, nativeElement = $bindable(), ...rest }: FlexRootProps = $props();
</script>

<section {...rest} bind:this={nativeElement}>{@render children?.()}</section>
```

`components.Flex` принимает alias overrides и algorithm; собственных component defaults
у upstream нет. PaddingXS/padding/paddingLG меняют preset gaps, а font/color reset не
добавляется. CSS-variable prefix настраивается независимо от BEM prefix.
Сверка с 33 официальными UMD-сценариями:
[browser](../../../tests/browser/flex-source.spec.ts),
[SSR](../../../tests/package/flex-source.ssr.test.ts),
[эталон](../../../tests/browser/fixtures/ant-design-flex-source-reference.json),
фикстура `?fixture=flex-source`. Live updates сохраняют custom state, DOM/ref,
фокус и selection; смена component заменяет корень, как в React.
Рецепты flex и flex-prefix воспроизводят 32 правила закреплённого CSS без reset типографики.
Flex наследует ConfigProvider.prefixCls; непустой локальный prefix имеет приоритет.

