# Splitter

Splitter поддерживает размеры панелей, drag/lazy, collapse и оформление Ant Design.
Точные Props и callbacks — в
[исходных объявлениях](../../../src/lib/splitter.types.ts).

```svelte
<script lang="ts">
  import { Splitter } from '@woodger/antd';
</script>

{#snippet navigation()}<nav>Разделы</nav>{/snippet}
{#snippet content()}<article>Содержимое</article>{/snippet}

<Splitter
  style="height:320px"
  items={[
    { defaultSize: '30%', min: 120, collapsible: true, children: navigation },
    { min: '20%', children: content }
  ]}
/>
```

React Splitter.Panel declarations заменены массивом items с scalar/snippet
children: Svelte не предоставляет синхронный разбор дочерних snippets до SSR.
Отдельного публичного SplitterPanel нет. Панели сохраняются по позиции, как в
upstream; key не участвует в их идентичности. DefaultSize читается при создании
Splitter. Если size задан хотя бы у одной панели, вся группа становится
controlled, а defaults остальных панелей не используются. Для controlled
режима записывайте предложенные размеры обратно в items[].size.

Числа задают px, строки с % — долю контейнера. Остаток делится между панелями;
при изменении контейнера размеры нормализуются с исходными правилами min/max.
Полностью заданные размеры сохраняют пропорции с поправкой на ограничения;
несовместимые ограничения не имеют отдельного error callback. В ненулевой группе
размер 0 остаётся collapsed даже при min > 0; если все размеры равны 0, группа
делится поровну. Orientation имеет приоритет над boolean vertical,
по умолчанию horizontal.

Mouse и одиночный touch считают смещение от начала gesture. Normal drag
вызывает onResizeStart, onResize и onResizeEnd; end сообщает текущие размеры,
поэтому при controlled rejection возвращает исходную геометрию. Lazy показывает
preview и вызывает onResizeEnd с предложением только при release, без onResize;
controlled lazy принимает размеры в onResizeEnd. RTL меняет знак horizontal
drag. Как в закреплённом SplitBar, lazy сначала ограничивает физическое смещение
по ARIA-границам, затем меняет знак для RTL; при несимметричных ограничениях это
может отличаться от normal drag. Вертикальное направление знак не меняет.

Collapsible задаётся у соседних панелей; его объект управляет start/end и
showCollapsibleIcon (true/false/auto). Collapse вызывает resize, resizeEnd, затем
collapse, сохраняет прежний размер и проверяет текущие ограничения при
восстановлении. Resizable=false блокирует drag, сохраняя collapse и double-click.
Скрытое содержимое остаётся в DOM; destroyOnHidden удаляет его, а одноимённое
поле панели переопределяет root. Collapsible.motion включает CSS transition,
который отключается на время drag и при prefers-reduced-motion.

Как в Ant Design 6.6.8, при destroyOnHidden=false свёрнутая панель только
обрезает содержимое: её controls остаются в Tab-порядке и доступном дереве.
Панель не получает inert или aria-hidden, фокус автоматически не переносится.
Это ограничение доступности upstream. DestroyOnHidden=true удаляет потомков;
после раскрытия они создаются заново, неконтролируемые значения сбрасываются.
Для сохранения значений при таком режиме храните их снаружи панели.

Разделитель сохраняет role=separator, ориентацию и числовые ARIA-границы; как в
эталоне, он не получает фокус и не имеет keyboard resize. Кнопки collapse —
native button type=button с Enter/Space и исходными английскими именами
Toggle start/end panel. Content controls сохраняют нативную семантику;
componentDisabled сам по себе не отключает Splitter. Bind:nativeElement заменяет
React ref. При unmount очищаются ResizeObserver и node/window listeners,
поздние события не вызывают callbacks.

SSR выводит панели и snippets без измерения, сохраняет исходные px/% и auto для
неуказанного размера. После mount ResizeObserver рассчитывает px; нулевой замер
не затирает последний размер. Смена orientation без изменения размеров root сама
по себе не запускает новый замер — это поведение закреплённого upstream.

ConfigProvider.splitter задаёт class/style и semantic root/panel/dragger;
nested config заменяет объект целиком. Root style идёт после semantic styles,
а вычисленные flex-basis/flex-grow панели — после её style. Dragger classes
принимают строку или default/active; как в upstream, из styles.dragger применяется
только default. Semantic callbacks получают resolved orientation/vertical.
Collapsible.icon задаёт иконки сворачивания; пустой объект сохраняет defaults.
Null/false icons оставляют пустой custom wrapper.

CSS-рецепты splitter и splitter-prefix воспроизводят все 59 правил эталона,
включая reduced motion, с проверкой SHA-256. Второй сохраняет module template для
локального prefix. Темы, primary и RTL наследуются; локальный hover alias bar
сохраняется для native темы, а в token theme bar наследует настроенные aliases.

ConfigProvider.theme.components.Splitter применяет splitBarSize, splitTriggerSize
и splitBarDraggableSize, включая 0; обычный splitBarDraggableSize равен 20.
Поддержаны global/component
aliases и algorithms, cssVar.prefix, undefined, вложенные/reset/sibling scopes.
Тематические переменные идут перед semantic/user styles. Реактивные изменения
сохраняют размеры панелей, draft/selection/focus и текущий lazy drag/preview.
Сверка: [UMD](../../../tests/browser/fixtures/ant-design-splitter-theme-reference.json),
[SSR](../../../tests/package/splitter-theme.ssr.test.ts),
[browser](../../../tests/browser/splitter-theme.spec.ts), `?fixture=splitter-theme`.
RTL-метрики измерены с явным dir=rtl на host; отдельно записано source-наследование
LTR без этого host. Существующий native direction провайдера сохранён.
PrefixCls задаёт root/panel/bar/collapse/preview/mask classes. Пустая строка и
undefined наследуют ConfigProvider.prefixCls (по умолчанию ant-splitter); локальный
prefix имеет приоритет. Semantic callbacks получают исходный local prefix.
Служебная preview-offset variable следует общему prefix без точек, независимо от
локального класса и theme.cssVar.prefix. Canonical token marker сохранён.
Смена prefix сохраняет панели, refs, draft/focus/selection и активный lazy drag.

В 6.6.8 CSS-кэш связывает общий local class с первым namespace: у вложенного
Splitter preview-offset=30px может дать transform:none. В свежем документе с
тем же вложенным namespace получается смещение 30px. Native изолирует CSS по
local class и общему namespace; исходные
[raw](../../../tests/browser/fixtures/ant-design-splitter-prefix-reference.json) и
[fresh-page](../../../tests/browser/fixtures/ant-design-splitter-prefix-isolated.json)
замеры сохранены для разбора. Prefix проверяют
[browser](../../../tests/browser/splitter-prefix.spec.ts),
[SSR](../../../tests/package/splitter-prefix.ssr.test.ts) и fixture `?fixture=splitter-prefix`.

Fixture — `?fixture=splitter`. Engine, DOM lifecycle, SSR, package и browser
проверяют размеры, ограничения, callbacks, controlled/lazy, collapse, native
controls, touch, RTL, темы, semantic styles и cleanup.

