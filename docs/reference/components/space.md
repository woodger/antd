# Space

Space добавляет отдельный div.ant-space-item вокруг каждого элемента, а Flex
сохраняет children без wrappers. Для нескольких элементов используйте items:
readonly-массив string/number/Snippet либо { key, children }. Key сохраняет DOM
и state при перестановке. Children Snippet без items представляет одну группу;
его содержимое нельзя проинспектировать и разделить как React children.
Пустой items имеет приоритет над children и не создаёт root. Непустой массив
из одних пустых значений сохраняет пустой root, как исходник.

Boolean/null/undefined/пустые строки не создают item wrappers, 0 отображается.
Это учитывает React.Children, который нормализует оба boolean в null перед
rc-component/util.toArray. Snippet, ничего не отрисовавший, сохраняет wrapper,
скрытый CSS :empty; как React child component с null, он всё ещё участвует в
расчёте позиции разделителя. Separator задаёт span между renderable
entries, кроме последнего; falsy separator, включая 0, не создаёт span. Такой
separator не помечается aria-hidden автоматически: Snippet может содержать
собственный содержательный элемент.

Orientation имеет приоритет над явным vertical;
по умолчанию horizontal. Align=start/end/center/baseline, horizontal по умолчанию
center, vertical без align использует естественное stretch. Size выбирается из
локального prop, ConfigProvider.space.size и затем small; componentSize не участвует.
Поддержаны small/medium/large
либо число, tuple [horizontal, vertical]. Числовой 0 не создаёт inline gap,
NaN игнорируется. Wrap добавляет flex-wrap:wrap. Gap/wrap styles идут перед
styles.root и style: пользовательский inline style перекрывает также числовой
gap. Presets используют общие padding tokens, включая compact 4/8/16px.

Root — div с нативными attrs, class/rootClassName/style и bind:nativeElement.
ClassNames/styles root/item/separator принимают объект либо callback ({ props })
с разрешёнными size/orientation/align. Space не сбрасывает typography и наследует
тему/RTL. Галерея — `/ant-design#space`, фикстура — `?fixture=space`. Unit/SSR/
Chromium проверяют gaps, пустые значения, keyed DOM/фокус и production hydration.
Рецепт space извлекает 16 правил без Compact/Addon, reset и keyframes.
ConfigProvider.space задаёт size, class/style и object/function classNames/styles
для root/item/separator. Явный вложенный record заменяет родительский целиком;
undefined наследует, {} очищает. Semantic callbacks получают разрешённые
size/orientation/align и могут вернуть undefined. Порядок styles: gap/wrap →
provider styles.root → provider style → local styles.root → local style.
ConfigProvider.space не применяется к Compact/Addon.

```svelte
<script lang="ts">
  import { ConfigProvider, Space } from '@woodger/antd-svelte';
</script>

<ConfigProvider space={{ size: ['small', 'large'], styles: { item: 'color:#531dab' } }}
  theme={{ components: { Space: { paddingXS: 12 } } }}>
  <Space items={['Первый', 'Второй']} separator="|" />
</ConfigProvider>
```

Theme.components.Space принимает alias overrides и отдельный algorithm; собственных
component tokens в 6.6.8 нет. Preset gaps читают paddingXS/padding/paddingLG,
numeric gaps сохраняют inline priority, typography reset не добавляется. Поддержаны
именованные cssVar, нули/undefined и независимые provider scopes; обновление темы
или config сохраняет keyed DOM, черновики, выделение и фокус.
PrefixCls меняет root/orientation/align/gap/item/separator classes. Empty/undefined
наследуют ConfigProvider.prefixCls (по умолчанию ant-space), локальный prefix
имеет приоритет. Semantic callbacks получают исходный local prefix.
Badge selector использует общий prefix провайдера независимо от local Space.
Смена prefix сохраняет keyed DOM, refs, draft/selection/focus и приоритет стилей.

## SpaceCompact и SpaceAddon

SpaceCompact соответствует Space.Compact: тот же items/children Snippet API,
один div без дополнительных item wrappers. Каждый item задаёт отдельный context
для первого/последнего элемента и размера. Для нескольких controls используйте
items; один children Snippet представляет одну позицию, как компонент React,
вернувший несколько узлов. Null/undefined/boolean удаляются из позиций, пустая
строка и 0 сохраняются, как rc-component/util.toArray без keepEmpty.

Size=small/medium/large, по умолчанию явно заданный componentSize;
приоритет control.size → Compact.size → ConfigProvider.componentSize. Block
включает width=100% и display=flex, иначе inline-flex. Orientation/vertical следуют приоритету Space. Нативные attrs, class/rootClassName/
style и bind:nativeElement относятся к root. Подключены Button, Input,
InputNumber и Select. Горизонтальные стыки используют логические углы и
перекрытие на lineWidth; vertical compact-стыки поддержаны для Button, как
в исходнике. Select сохраняет существующий внешний container: его радиусы
наследует внутренняя рамка. Keyed DOM и фокус сохраняются при перестановке.

Вложенный Compact получает крайние flags с учётом положения во внешней группе;
его собственный size снова разрешается из props/ConfigProvider, а не из размера
родительского Compact. Это соответствует Compact.tsx 6.6.8. Контекст остаётся
на Popup triggers, но сбрасывается внутри Modal/Drawer и содержимого Tooltip/
Popover/Dropdown. Общие ConfigProvider/Form contexts при этом не меняются.

SpaceAddon соответствует Space.Addon, использует div и children Snippet.
Variant=outlined/filled/borderless/underlined, default=outlined;
status=error/warning меняет границу/фон/текст. Disabled задаёт только внешний
вид: не наследуется из componentDisabled автоматически и не отключает children.
Размер берётся только из Compact context; вне Compact componentSize не меняет
Addon. Поддержаны нативные attrs, class/style и bind:nativeElement.

SpaceCompact и SpaceAddon имеют собственные prefixCls с теми же правилами
наследования: ant-space-compact/ant-space-addon по умолчанию. Local prefix Compact
не меняет prefixes вложенных Addon и controls. Служебные variant/status variables
Addon используют общий prefix без точек, независимо от local class и theme.cssVar.prefix.
Canonical markers и прежние Compact adapters сохраняются; prefixes остальных
controls подключаются в своих семействах.

В 6.6.8 общий local class Space кэшируется с первым global prefix. Во вложенном
провайдере правило Badge может продолжать искать родительский class и оставлять
display:inline-block вместо block. Native ограничивает CSS по local и global
prefix; [raw](../../../tests/browser/fixtures/ant-design-space-prefix-reference.json) и
[fresh-page](../../../tests/browser/fixtures/ant-design-space-prefix-isolated.json)
замеры сохранены для разбора. Prefix проверяют
[browser](../../../tests/browser/space-prefix.spec.ts),
[SSR](../../../tests/package/space-prefix.ssr.test.ts) и fixture `?fixture=space-prefix`.

Фикстура — `?fixture=space-compact`, пример — `/ant-design#space`. Unit/SSR/
Chromium проверяют размеры, границы/RTL, вложенность, фокус, Popup isolation,
variants/status/disabled и hydration. Рецепты space-compact/space-addon/
input-number-compact извлекают 4/29/8 правил без keyframes. InputSearch использует
внутренний Compact с отдельными items для Input и кнопки. Состояние
Compact-интеграций остальных семейств описано в реестре.
Рецепты space-prefix/space-compact-prefix/space-addon-prefix воспроизводят
16/4/29 правил CSS-модулями с проверкой SHA-256; namespace и selectors меняет runtime.

