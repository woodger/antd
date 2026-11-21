# Timeline

Timeline использует общий renderer Steps с type=dot, как Ant Design.
По умолчанию orientation=vertical, variant=outlined, mode=start. Корень —
пассивный ol/li без кнопок выбора, current-step ARIA и локализованных статусов
Steps. Class/rootClassName, нативные атрибуты и bind:nativeElement относятся к ol.
Title и content допускают блоковые Snippet; input/links внутри content сохраняют
нативную клавиатуру. При keyed reverse сохраняются тот же DOM, value и фокус;
при unmount активный control освобождает фокус к соседнему доступному элементу.

```svelte
<Timeline titleSpan="80px" items={[
  { key: 'created', title: '09:00', content: 'Создано', color: 'green' },
  { key: 'processing', title: '09:30', content: 'Обработка' },
  { key: 'waiting', content: 'Ожидается подтверждение', loading: true }
]} />
```

Items поддерживают key/title/content/icon/loading/color/placement, class/style и
локальные semantic classNames/styles. Title/content/icon принимают текст, число,
boolean или Snippet. Ноль отображается; boolean создаёт присутствующий пустой
контент. React Timeline.Item был только JSX sugar без
собственного runtime; в Svelte данные задаются items, отдельный пустой компонент
не экспортируется. Для контроля сохранения state используйте стабильные key.

Mode=start/end/alternate; item.placement имеет приоритет над mode.
Alternate назначает сторону до reverse. Даже при mode=start/end
vertical использует двухколоночный layout, если есть хотя бы один truthy title;
число 0 само по себе этот layout не включает. TitleSpan — число долей из 24 либо
строка CSS (100px/25%); в mode=alternate игнорируется. Его вычисленная переменная
имеет приоритет над тем же ключом в styles.root/style, как в upstream.

Loading задаёт process и добавляет spinner только при falsy icon;
остальные элементы имеют finish. Ожидание показывается отдельным loading-элементом
в items. Reverse разворачивает весь массив событий.
В reverse линия наследует статус предыдущего события, иначе — следующего.
SVG LoadingOutlined перенесён точно из @ant-design/icons-svg 4.6.0 под уже
включённой MIT-лицензией; React-зависимости не добавлены.

Preset colors — blue/red/green/gray; произвольный CSS color задаёт переменную
item icon, item.style перекрывает её. ClassNames/styles имеют root/item/itemWrapper/
itemIcon/itemSection/itemHeader/itemTitle/itemContent/itemRail; принимают объект
или функцию от {props} с преобразованными items. Локальные item.classNames/styles
используют имена root/wrapper/icon/section/header/title/content/rail. Общие стили
перекрываются локальными, item.style — последний; корневой style перекрывает
styles.root до применения titleSpan. Tail/dot/spacing связаны с токенами темы,
включая dark/compact и RTL.

ConfigProvider.timeline задаёт общие class/style/classNames/styles. Классы config
и local накапливаются; root styles идут в порядке config.styles.root → config.style
→ local styles.root → local style, затем применяется titleSpan. Item-specific
styles сохраняют приоритет. Callbacks используют те же native props с разрешёнными
mode/orientation/variant, преобразованными items и прежним reverse=false.
Undefined наследует timeline-record, любой собственный объект, включая {}, заменяет его.
Обновление config/props сохраняет ol; соседний provider остаётся изолированным.
Сверка: [24 исходных случая и 4 обновления](../../../tests/browser/fixtures/ant-design-timeline-config-reference.json),
[браузер](../../../tests/browser/timeline-config.spec.ts),
[публичные типы и SSR](../../../tests/package/timeline-config.ssr.test.ts), `?fixture=timeline-config`.

Horizontal сохраняет поведение исходных Steps: ниже xs=576 он получает класс
ant-steps-vertical, но явный ant-timeline-horizontal остаётся. Это отличается от
согласованного v1-порога самостоятельного Steps (532px); базовые Steps не меняются.
SSR не измеряет DOM/viewport и оставляет объявленную ориентацию.

Локальный prefixCls меняет root и Timeline item/state/color classes; пустая строка
наследует ConfigProvider.prefixCls (по умолчанию ant-timeline). Вложенный Steps
отдельно наследует общий prefix; локальный Timeline.prefixCls на него не влияет.
CSS variables
Timeline/Steps и marker сохраняют прежние имена. Соседние показатели изолированы,
включая совпадение prefix с ant-timeline-item/ant-timeline-css-var. Обновление
prefix сохраняет ol, theme/semantics, titleSpan и назначение placement до reverse.
Рецепт timeline-prefix воспроизводит 43 исходных правила CSS data module;
fallback variables не перекрывают прежние adaptive theme defaults.
Сверка: [28 исходных случаев и 4 обновления](../../../tests/browser/fixtures/ant-design-timeline-prefix-reference.json),
[CSS и item classes](../../../src/lib/timeline-prefix.test.ts),
[браузер](../../../tests/browser/timeline-prefix.spec.ts),
[публичный пакет и SSR](../../../tests/package/timeline-prefix.ssr.test.ts), `?fixture=timeline-prefix`.

Source `theme.components.Timeline` подготавливает шесть defaults для tail/dot/spacing
и поддерживает aliases, отдельные algorithms, CSS prefix/hash и нули/undefined.
На общем корне aliases Timeline применяются после Steps, как в upstream;
размеры иконок Steps и размеры точек Timeline сохраняют отдельные переменные.
Styles.root/style перекрывают tokens, а titleSpan по-прежнему применяется последним.
Эталонные метрики обеих ориентаций и обновления темы проверяются также в
`?fixture=steps-theme`.

Фикстура — ?fixture=timeline, пример — /ant-design#timeline. Engine/SSR/Chromium
проверяют aliases, порядок/статусы, геометрию titleSpan, темы/RTL, сохранение поля
и фокуса, а также production hydration. Рецепт timeline воспроизводит 43 правила
из того же закреплённого CSS-архива; общие Steps не дублируются.

