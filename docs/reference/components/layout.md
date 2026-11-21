# Кнопки, типографика и компоновка

## Button

Button сохраняет прежние props и native onclick; добавлены href, color/variant,
ghost, square shape, iconPlacement,
classNames/styles и rootClassName. Children/icon принимают Snippet, текст,
число или boolean; 0 отображается, true создаёт пустой присутствующий контент.
ButtonProps остаётся интерфейсом native button и доступен по прежнему пути
Button.svelte; ButtonLinkProps описывает ссылку. Компонент выводит тип currentTarget
из href: существующий onclick без href получает HTMLButtonElement, с href —
HTMLAnchorElement. OnClick поддержан как alias; native onclick имеет приоритет.
Bind:nativeElement возвращает фактический button или a.

```svelte
<Button color="purple" variant="filled" iconPlacement="end">Действие</Button>
<Button href="#details">К подробностям</Button>
<SpaceCompact size="small"><Button>Назад</Button><Button>Вперёд</Button></SpaceCompact>
```

Полная пара color+variant имеет приоритет над type/danger. Без пары явный type
либо danger выбирает исходную sugar-map. Отдельный variant=solid выбирает primary;
неполные остальные пары fallback используют ConfigProvider.button либо default/
outlined, как в коде Ant Design 6.6.8. Color включает default/primary/danger и
13 preset colors. Ghost превращает solid в outlined и включает прозрачный фон;
для text/link ghost не применяется. Square использует обычный border radius без
дополнительного shape-класса. Block и размеры сохраняют прежнее поведение.

Loading принимает boolean или {delay,icon}. Положительный delay откладывает
spinner; смена delay/отмена/удаление очищают deadline. Loading.icon имеет приоритет
над button.loadingIcon. SSR не создаёт timer и не показывает отложенный spinner.
Согласованный v1 native button во время loading остаётся disabled и aria-busy;
это сохраняет существующее отличие от React click guard. Для ссылки loading
отменяет переход через preventDefault; disabled дополнительно убирает href,
ставит aria-disabled и tabindex=-1. Enabled anchor получает tabindex=0 как upstream.
Native button сохраняет htmlType/button/submit/reset и form-атрибуты; href не
превращает type=link в навигацию автоматически. AutoFocus фокусирует при mount.

ClassNames/styles — объект или функция от {props}; слоты root/icon/content.
Классы объединяются. Стилевые слои: context.styles → context.style(root) →
local styles → local style(root). ConfigProvider.button задаёт autoInsertSpace,
shape/color/variant, loadingIcon, class/style и semantic slots. Omitted button
наследует config; явный объект, включая {}, заменяет его целиком как в upstream.
FloatButton может пропустить semantic slots этого config через внутренний
_skipSemantic; обычные пользователи не должны использовать этот prop.

Размер Button берётся из local size, затем Compact, затем ConfigProvider.
Для плотных групп используется SpaceCompact; native Tab-порядок сохраняется.

AutoInsertSpace по умолчанию true: scalar children из ровно двух символов
U+4E00–U+9FA5 получают пробел на SSR, если нет icon и variant не text/link.
Svelte Snippet непрозрачен для SSR; после hydration проверяется единственный
отрендеренный text/element и применяется исходный HOC-класс letter-spacing.
Текст и DOM владельца не переписываются; такой Snippet сохраняет textContent без
ASCII-пробела, в отличие от scalar children. Изменения текста наблюдаются с cleanup.
Эта адаптация явно учитывается как partial coverage в реестре.

Button поддерживает local/shared prefixCls для root, icon/loading, вариантов,
размеров, shapes и Compact. Непустой локальный prefix имеет приоритет; пустой
или undefined наследует ConfigProvider.prefixCls. Служебные переменные вариантов
и Compact используют общий namespace независимо от local class и cssVar.prefix;
component tokens и legacy themes сохраняют прежний namespace и приоритет стилей.
Смена prefix сохраняет DOM/ref, focus, draft/selection и native submit.

Enter/leave анимация loading icon пока отсутствует; прежний spinner сохранён.
Source component tokens и [Wave](../wave.md) подключены.
Общий механизм тем,
RTL, Form disabled и Compact остаётся прежним. Фикстура — ?fixture=button;
расширенный пример — /ant-design#buttons. Unit/SSR/Chromium проверяют приоритеты,
формы/ссылки, delay/cancel, CJK, nested config, Compact и совместимость
с Popconfirm. Фикстура ?fixture=button-prefix сравнивает оформление с официальным
UMD и сохраняемое состояние. Default CSS Button входит в vendor/antd.css;
button-prefix выводит отдельный template без deprecated ButtonGroup.

## Divider

```svelte
<Divider titlePlacement="start" variant="dashed">Раздел проекта</Divider>
<Divider orientation="vertical" />
```

Divider сохраняет структуру Ant Design 6.6.8: корневой div с role=separator,
две rail и inner-text для горизонтальной подписи. Children принимает строку,
число или Snippet; 0 отображается, null/false/пустая строка дают линию без подписи.
Переданный Snippet считается подписью, даже если он выводит пустое содержимое.
Вертикальный Divider не монтирует подпись. Aria-orientation отражает направление;
компонент не добавляет tabindex и не меняет фокус.

Orientation=horizontal/vertical имеет приоритет над boolean vertical.
TitlePlacement задаёт положение подписи: start/end зависят от RTL,
left/right сохраняют физическую сторону, default=center. Отступ подписи
задаётся через styles.content.

Variant=solid/dashed/dotted, dashed alias и plain повторяют классы эталона.
Size=small/medium/large наследуется от явно заданного componentSize в ConfigProvider,
включая вложенные провайдеры. Без явного
размера Divider сохраняет стандартный отступ 24px без подписи и 16px с подписью.
В semantic callbacks size в этом случае undefined. Без подписи large имеет
отступ 24px, medium — 16px, small — 8px;
с подписью large использует 16px, как upstream. Размеры действуют горизонтально.
Темы, compact, RTL и componentDisabled не скрывают разделитель.

Class/style и нативные атрибуты/события передаются корню. Bind:nativeElement
даёт HTMLDivElement после mount. RootClassName добавляет корневой класс.
ClassNames/styles принимают объект со слотами root/rail/content либо callback
({ props }) с нормализованными orientation/titlePlacement/size. Значения styles —
CSS-строки, как style остальных Svelte-компонентов. Root style имеет приоритет
над styles.root; без подписи styles.rail также применяется к корню.

Пример доступен на `/ant-design#divider`, изолированная фикстура — `?fixture=divider`.
SSR и Chromium-проверки покрывают aliases, ноль, snippets, варианты, размеры,
semantic slots, геометрию размещения, темы, RTL и узкий экран.
`ConfigProvider.theme.components.Divider` поддерживает textPaddingInline,
orientationMargin и verticalMarginInline, локальные alias-токены и algorithm.
Токен orientationMargin задаёт долю ширины rail. Тема применяется уже при SSR,
обновляется без замены DOM и предшествует semantic styles и пользовательскому style.
Нули, CSS-единицы, явный undefined и собственный cssVar.prefix сохраняются.
Проверки: [SSR](../../../tests/package/divider-theme.ssr.test.ts),
[browser](../../../tests/browser/divider-theme.spec.ts),
[эталон UMD](../../../tests/browser/fixtures/ant-design-divider-theme-reference.json),
фикстура `?fixture=divider-theme`.

Локальный prefixCls меняет BEM-классы корня, вариантов и потомков; пустой prefix
наследует ConfigProvider.prefixCls (по умолчанию ant-divider).
CSS variables и общий marker сохраняют прежние имена.
Собственный stylesheet из 27 правил добавляется при SSR и очищается при unmount.
Defaults ограничены владельцем, включая prefix, совпадающий с общим marker.

ConfigProvider.divider задаёт class/style и object/function classNames/styles.
Undefined наследует родительский record; явный объект, включая {}, заменяет его
целиком. Приоритет root styles: provider styles.root → provider style → local
styles.root → local style. Без подписи merged styles.rail идёт перед local style.
Callbacks получают прежние нормализованные props и могут вернуть undefined.
Prefix/config updates сохраняют nativeElement, DOM, фокус и состояние соседних полей;
строчный vertical Divider не добавляет пробелы. Проверки:
[SSR](../../../tests/package/divider-config.ssr.test.ts),
[browser](../../../tests/browser/divider-config.spec.ts),
[эталон UMD](../../../tests/browser/fixtures/ant-design-divider-config-reference.json),
фикстура `?fixture=divider-config`. Общий prefix ConfigProvider поддержан;
React development warnings ещё не перенесены.

Vendor/divider.css содержит 27 правил из закреплённого архива; рецепт divider
исключает интеграцию ColorPicker и воспроизводится через `npm run cli -- css`.
Рецепт divider-prefix выводит CSS data module для локального prefix из тех же правил.

## Flex

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

Галерея — `/ant-design#flex`, отдельная фикстура — `?fixture=flex`.
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
  import type { FlexRootProps } from 'antd-svelte';
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

## Grid: Row, Col и breakpoints

```svelte
<Row gutter={[16, 8]}>
  <Col xs={24} md={12}>Первая колонка</Col>
  <Col xs={24} md={12}>Вторая колонка</Col>
</Row>
```

Row/Col сохраняют нативные div и 24-колоночные CSS-классы Ant Design. Span=0
скрывает колонку, order/offset/push/pull задают порядок и логическое смещение.
Responsive props xs/sm/md/lg/xl/xxl/xxxl принимают число или объект ColSize.
Span в объекте и базовый span также принимают строку; строковый shorthand
breakpoint, например md="12", игнорируется как в реализации Col эталона.
ColSize поддерживает span/order/offset/push/pull/flex, включая нулевые значения
для сброса responsive свойств. Базовые order/offset/push/pull=0 не добавляют класс.

Row.gutter — число в px, CSS-строка, responsive map чисел либо пара [horizontal,
vertical]. Горизонтальный интервал даёт отрицательный margin-inline у Row и
половину padding-inline у Col; вертикальный использует row-gap. Вложенный Row
создаёт независимый контекст. Wrap=false добавляет nowrap; Col с flex также
получает min-width:0. Flex=number даёт n n auto, auto — 1 1 auto, строка с px/em/
rem/% — 0 0 размер, остальные строки передаются как CSS shorthand. Row.style
перекрывает рассчитанные margin/gap, Col.style — padding/flex; responsive flex
CSS-переменные записываются после style, как в upstream.

Align=top/middle/bottom/stretch и justify=start/end/center/space-around/
space-between/space-evenly принимают responsive maps. Breakpoints: xs<576,
sm≥576, md≥768, lg≥992, xl≥1200, xxl≥1600, xxxl≥1920. В CSS Col класс xs —
базовый без media query, а Row выбирает xs-map только при фактическом совпадении
xs. Побеждает наибольший активный breakpoint с заданным значением.

При SSR Row не выбирает responsive align/justify, но gutter при неизвестной
ширине выбирает наибольший заданный breakpoint (поведение useGutter эталона).
После mount media queries обновляют Row; Col адаптируется CSS без JS/hydration.
CreateBreakpoint заменяет React Grid.useBreakpoint явной Svelte-моделью:
`const breakpoint = createBreakpoint();` и
`$effect(() => breakpoint.connect(window));`. Реактивное breakpoint.screens
при SSR равно {}, подключение публикует карту семи MediaQueryList, cleanup
удаляет listeners и игнорирует запоздалые события. Breakpoint.connected сообщает
наличие подключения; повторный connect завершает предыдущее.
Необязательный второй аргумент connect(view, mediaQueries) задаёт полную карту
семи запросов; без него используются прежние стандартные пороги Grid.

Оба компонента поддерживают class/style, нативные атрибуты/события,
bind:nativeElement и RTL без изменения DOM-порядка. Галерея — `/ant-design#grid`,
фикстура — `?fixture=grid`. Рецепт grid извлекает 1043 правила с исходными media
scopes и без keyframes. Unit/SSR/Chromium проверяют gutters, вложенность, ширины,
границы media, нулевые reset-значения, CSS units, RTL и cleanup.
Theme.components.Grid применяет aliases и algorithms к Row/Col, включая
fontSize/fontFamily, вложенные provider и custom cssVar prefix. Собственных defaults
у Grid нет. Component variables ставятся перед прежними gutter/flex/style layers;
локальный style сохраняет приоритет. Обновления сохраняют Row/Col refs, slots,
редактируемое значение, focus/selection и responsive layout.
14 тем / 140 CSS-состояний UMD сверяются в
[browser](../../../tests/browser/grid-theme.spec.ts), declarations —
в [unit](../../../src/lib/theme-grid-tokens-reference.test.ts), серверная граница —
в [SSR](../../../tests/package/grid-theme.ssr.test.ts). Fixture `?fixture=grid-theme`.

Глобальные theme.token.screen* задают Row observer, а screen*Min — Col media CSS.
Пороги могут различаться: между screenSMMin и screenSM меняется ширина Col,
но Row ещё не выбирает sm gutter/align/justify. Сохраняются source validation
порядка порогов и безусловные xs column styles. Пользовательские media работают
при SSR без JavaScript и обновляются после mount; nested/reset/sibling providers
изолированы, включая одинаковый cssVar.key и hashed=false. Стандартный режим
и createBreakpoint().connect(window) без явных queries сохраняют прежние пороги.
5 конфигураций / 126 состояний на свежих pages эталона сверяются в
[browser](../../../tests/browser/grid-breakpoints.spec.ts); загрузка CSS в обоих порядках
без JavaScript — [отдельно](../../../tests/browser/grid-breakpoints-ssr.spec.ts).
Source не обновляет Row/Col layout при смене глобальных порогов после mount,
хотя публичные tokens уже изменились. [Наблюдение](../../../tests/browser/fixtures/ant-design-grid-breakpoints-update-observation.json)
сохранено; Svelte обновляет обе части без потери DOM и состояния slot input.

Row.prefixCls задаёт корень и состояния wrap/align/justify/RTL. Empty/undefined
наследуют ConfigProvider.prefixCls (по умолчанию ant-row); local prefix имеет
приоритет. Canonical Grid marker и gutter context сохраняются. Смена prefix
сохраняет Row/children DOM, refs, draft/selection/focus и FormData.
Сверка: [UMD](../../../tests/browser/fixtures/ant-design-grid-row-prefix-reference.json),
[browser](../../../tests/browser/grid-row-prefix.spec.ts),
[SSR](../../../tests/package/grid-row-prefix.ssr.test.ts), `?fixture=grid-row-prefix`.
Рецепт grid-row-prefix извлекает 16 Row rules без Col/media scopes.
Col.prefixCls подключает полный scoped template из 1027 rules: base/xs и все
responsive states, resets и flex. Empty/undefined наследуют ConfigProvider;
локальные классы независимы от общего namespace private Col/Grid variables.
Canonical Grid token marker и gutter/flex/style priority сохраняются. Смена
prefix сохраняет Col/ref, draft и selection/focus вложенного native input.
Пользовательские media thresholds изолированы от canonical styles, включая
local prefix=ant-col в другом общем namespace.

FormItem сохраняет default layout при общем prefix и собственных prefixes
labelCol/wrapperCol: CSS поддерживает стабильные span/breakpoint attributes с
прежней specificity, а control связывает общий grid-display с native Form variable.
Form prefix/media теперь подключены отдельно. В custom-media примерах Col
форма по-прежнему получает независимые стандартные пороги для своей матрицы. Source кэширует private flex
первого global namespace при одинаковом local Col class; raw и fresh Inner
measurements сохранены раздельно. В custom-media случаях Source сохраняет прежние
пороги; freshMedia измерен с новым public local class. Native scope включает оба
prefixes и media.
Проверки: `?fixture=grid-col-prefix`,
[UMD](../../../tests/browser/fixtures/ant-design-grid-col-prefix-reference.json),
[browser](../../../tests/browser/grid-col-prefix.spec.ts),
[SSR](../../../tests/package/grid-col-prefix.ssr.test.ts). Row reference по-прежнему
использует официальный Col с public prefixCls=ant-col для своего сравнения.
В CSS-variable режиме эталон записывает components.Grid.screen*Min в CSS variables,
но Col media queries продолжают использовать глобальные thresholds. Это
[наблюдение](../../../tests/browser/fixtures/ant-design-grid-media-observation.json) сохранено;
declarations сами по себе не заявляют изменения media layout.

## Masonry

Masonry переносит Ant Design 6.6.8: Masonry/MasonryItem, usePositions/useDelay/
useRefs и style. Изучены @rc-component/motion 1.3.3 (^1.3.3),
@rc-component/resize-observer 1.1.2 (^1.1.2) и @rc-component/util 1.14.0 (^1.14.0).
Используются native ResizeObserver/RAF и CSS transitions без React dependencies;
[лицензии motion](../../../src/lib/vendor/LICENSE.rc-motion),
[resize-observer](../../../src/lib/vendor/LICENSE.rc-resize-observer) и
[util](../../../src/lib/vendor/LICENSE.rc-util) включены в пакет.
Точные Props, semantic callbacks и тип данных — в
[исходных объявлениях](../../../src/lib/masonry.types.ts).

```svelte
<script lang="ts">
  import { Masonry } from 'antd-svelte';

  const items = [100, 60, 120, 80].map((height, index) => ({ key: index, data: height }));
</script>

<Masonry {items} columns={{ xs: 1, sm: 2, md: 3 }} gutter={[12, 24]} fresh>
  {#snippet itemRender({ data, index, column })}
    <div style={`height:${data}px`}>
      Карточка {index + 1}, колонка {column + 1}
    </div>
  {/snippet}
</Masonry>
```

Корневой children принимается и игнорируется, как в React PropsWithChildren;
для ячеек используются items. Items появляются после mount; SSR выводит пустой div
с высотой 0, не вызывает renderer или onLayoutChange и не читает DOM. ItemRender — snippet
с данными item, исходным index и текущим column. Item.children принимает scalar
или snippet без аргументов и имеет приоритет над renderer, включая false, 0 и
пустую строку. Поле item.height, как в реализации эталона, не задаёт CSS-высоту:
размер определяет содержимое, а раскладка читает getBoundingClientRect().height.

Элементы обрабатываются в исходном порядке. Следующий попадает в самую короткую
колонку; при равенстве выбирается первая. Item.column закрепляет колонку и
ограничивается сверху columns - 1. Числовые columns не округляются: 0/NaN
выбирают default 3, отрицательные и дробные значения сохраняют RangeError
исходника. Для responsive map используется наибольший совпавший breakpoint;
если совпадений нет — xs, затем 1. Поддерживаются xs/sm/md/lg/xl/xxl/xxxl из Grid.

Masonry использует глобальные `theme.token.screen*` для columns и обеих осей
responsive gutter. Пороги проверяются и при SSR; после mount смена токенов
заменяет media queries без пересоздания items. Editor/ref/focus/selection сохраняются.
Raw stale observer Source отделён от public fresh-mount counterpart в
[замерах responsive controls](../../../tests/browser/fixtures/ant-design-responsive-controls-reference.json).

Одиночный числовой gutter действует по обеим осям, пара разделяет horizontal и
vertical. Каждая ось принимает responsive map. Нижнего gutter после последнего
элемента нет. Хотя общий тип Row.gutter допускает CSS-строку, Masonry эталона
не преобразует её: horizontal участвует в `${value}px`, vertical — в JS-сложении
с высотой. Используйте числа или responsive maps чисел для рабочей геометрии.

Root наблюдается всегда. Fresh дополнительно наблюдает ячейки; без fresh смена
их содержимого сама по себе не запускает замер. Новый массив items, columns,
resize root и захваченные load/error вызывают RAF-замер с объединением событий.
Resize dedup использует floored rect и offset sizes, но для раскладки сохраняется
дробная DOM-высота. При unmount observers/listeners/frames очищаются, поздние
observer microtasks не обновляют состояние.

OnLayoutChange сообщает элементы с исходными полями и вычисленным column.
Сравнение соответствует util isEqual: одинаковые данные и распределение не
вызывают повторный callback. Результат можно записывать обратно в item.column,
как в upstream demo. Функции/snippets сравниваются по ссылке. Ключи должны быть
уникальны после String(key): CSSMotionList использует строковые ключи, тогда
как geometry map сохраняет исходный number/string key.

CSS-рецепты masonry и masonry-prefix воспроизводят все 12 правил эталона,
без keyframes, с проверкой SHA-256. Второй сохраняет CSS как module template для
локального prefix. Appear/leave используют исходные CSS classes и два RAF до
active. Удаляемая ячейка остаётся до собственного transitionend/animationend;
события вложенного содержимого её не удаляют. Возврат того же key сохраняет DOM
и отменяет удаление. Если браузер не создал собственную анимацию, phase завершается
после обновления CSS. Это сохраняет удаление при нулевой длительности, когда
upstream без deadline остаётся в leave-active. Наблюдение записано в реестре.

Bind:nativeElement заменяет React MasonryRef. Перестановка сохраняет native draft,
focus и selection input/textarea, а также selection остающихся contenteditable
узлов; внешний фокус не перехватывается. RTL использует inset-inline-start без
изменения DOM-порядка и column в данных. Controls содержимого сохраняют свою
нативную семантику, Masonry не добавляет собственную keyboard navigation.

ConfigProvider.masonry задаёт class/style/classNames/styles; явно заданный
nested config заменяет родительский объект целиком. Semantic callbacks получают
resolved columns. Root style идёт после semantic root и может перекрыть height;
геометрия ячейки идёт после semantic item. Light/dark и CSS variables наследуются.
Components.Masonry поддерживает alias overrides и algorithms; собственных
component tokens в 6.6.8 нет. Шрифт меняет измеренные высоты: с fresh ячейки
пересчитываются, без fresh сохраняют старый layout до load/error/resize либо смены
items/columns. Обновления сохраняют DOM, refs, draft/selection/focus и не создают
повторный onLayoutChange, если распределение и данные не изменились.
Theme.token.motion=false завершает текущий appear/leave и удаляет без ожидания end;
повторное включение не перезапускает appear уже видимых ячеек.

В 6.6.8 Source Masonry вычисляет ant-masonry-css-var, но пропускает этот класс на
корне: font/alias настройки не доходят до CSS. Native marker сохранён; для сверки
эталон получает его через публичный rootClassName без изменения исходников.
Исходные значения без marker и зависший zero-duration leave сохранены в
[эталоне](../../../tests/browser/fixtures/ant-design-masonry-theme-reference.json).
PrefixCls меняет root/item/motion classes; пустая строка и undefined наследуют
ConfigProvider.prefixCls (по умолчанию ant-masonry). Локальный prefix имеет
приоритет, semantic callbacks получают исходное локальное значение. Служебная
item-width variable использует общий prefix провайдера без точек, независимо от
локального класса и theme.cssVar.prefix. Смена prefix сохраняет DOM, текущую
motion phase, draft, focus и selection. Canonical theme marker остаётся прежним.

В 6.6.8 prefixCls="ant-masonry-rtl" в LTR наследует RTL от стандартного stylesheet,
если рядом был обычный Masonry. В свежем документе без этого stylesheet раскладка
LTR. Native ограничивает root/RTL rules владельцем и сохраняет заданное направление;
[raw замеры](../../../tests/browser/fixtures/ant-design-masonry-prefix-reference.json) и
[изолированный замер](../../../tests/browser/fixtures/ant-design-masonry-prefix-isolated.json)
сохранены для разбора. В закреплённом CSS нет отдельного reduced-motion override.

Fixture — `?fixture=masonry`. Engine, SSR, DOM lifecycle, package SSR и browser
проверяют геометрию, breakpoints, fresh/load/error, данные/callbacks, motion,
focus/selection, semantic/config, темы, RTL и cleanup. Prefix отдельно проверяют
[browser](../../../tests/browser/masonry-prefix.spec.ts),
[SSR](../../../tests/package/masonry-prefix.ssr.test.ts) и fixture `?fixture=masonry-prefix`.

## Splitter

Splitter переносит размеры панелей, drag/lazy, collapse и оформление Ant Design
6.6.8. Изучены Splitter/SplitBar/Panel, hooks, demos и tests, а также
@rc-component/resize-observer 1.1.2, util 1.14.0 и Ant Design icons 6.3.4
(icons-svg 4.6.0). Точные Props и callbacks — в
[исходных объявлениях](../../../src/lib/splitter.types.ts).

```svelte
<script lang="ts">
  import { Splitter } from 'antd-svelte';
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

## Layout

Layout, LayoutHeader, LayoutContent, LayoutFooter и LayoutSider соответствуют
Layout и его секциям Header/Content/Footer/Sider. Они сохраняют div/header/main/
footer/aside без дополнительных контейнеров. Children — Snippet, нативные props,
class/rootClassName/style и bind:nativeElement относятся к корню.

Layout.hasSider явно задаёт наличие sidebar; false отключает автоматическое
определение. На клиенте Sider регистрируется в ближайшем Layout; вложенные
Layout независимы. Snippet нельзя проинспектировать как React children до SSR,
поэтому автоматический SSR-ряд определяется CSS :has(> .ant-layout-sider),
а класс ant-layout-has-sider появляется после mount. Для серверного класса
передавайте hasSider=true. Это сохраняет геометрию до hydration и не вызывает
предварительного исполнения children. Явный false отключает CSS fallback.

Sider: width=200, collapsedWidth=80, defaultCollapsed=false, collapsible=false,
theme=dark. Число или числовая строка ширины получают px, другие CSS-строки
сохраняются. Calculated flex/max-width/min-width/width перекрывают style, как
в upstream; semantic styles.root идёт перед style, styles.body — на children.
ClassNames/styles принимают root/body, объект либо callback ({ props }).
Collapsed поддерживает binding; onCollapse(next, source) вызывается при клике
или responsive изменении с source=clickTrigger/responsive. Черновики/DOM children
сохраняются. Trigger — пассивный string/number/Snippet внутри нативной кнопки;
null скрывает кнопку. Для собственного интерактивного trigger используйте null
и внешний control, меняющий bind:collapsed. ReverseArrow меняет стрелку и сторону
zero-width trigger. CollapsedWidth=0 создаёт специальный переключатель; при
нулевой фактической ширине children становятся inert, фокус из них переносится
на trigger либо соседний доступный control. Это Svelte-адаптация доступности;
React Sider не блокирует невидимые focus targets через inert.

Breakpoint подписывает один MediaQueryList, сообщает начальное/изменённое
состояние через onBreakpoint и при необходимости вызывает onCollapse. Listener
очищается при смене breakpoint/unmount, запоздалые события игнорируются.
Порог берётся из Sider.tsx: xs=479.98, sm=575.98, md=767.98, lg=991.98,
xl=1199.98, xxl=1599.98, xxxl=1839.98px. Последнее значение отличается от
таблицы upstream docs (1920); эталоном оставлен код. Ни SSR, ни первый hydration
render не вычисляют media. Ручное раскрытие ниже порога сохраняется до следующего
media change. ComponentDisabled не отключает навигационный trigger.

Темы sidebar light/dark независимы от общей темы; light наследует container/text
токены текущего режима, dark сохраняет #001529. Compact использует меньшие control
tokens. Trigger поддерживает Enter/Space, aria-expanded/controls и locale.layout
expand/collapse, с expandLabel/collapseLabel override. Reduced motion отключает
переходы. Галерея — `/ant-design#layout`, фикстура — `?fixture=layout`; unit/SSR/
Chromium покрывают структуру, SSR без JS, callbacks, размеры, breakpoint/cleanup,
фокус, locale и темы. Рецепт layout извлекает 35 правил, включая Menu-интеграции.
ConfigProvider.theme.components.Layout поддерживает 16 актуальных токенов. Aliases, отдельный
algorithm и cssVar prefix/key применяются к Layout/Sider; секции внутри Layout
наследуют его переменные, включая CSS overrides в style. Semantic styles.root
идут перед style, вычисляемая
ширина Sider — последней. Смена темы сохраняет collapse, DOM, refs, фокус и черновики.
Отдельные Header/Content/Footer получают собственные переменные: в закреплённом
upstream standalone-секции остаются без Layout variables. Наблюдение и выбранное
поведение записаны в реестре; это отличие не переносится в Svelte.
ConfigProvider.layout задаёт общие class/style только для контейнеров Layout.
Классы config и local накапливаются; локальный style перекрывает общий, оба идут
после переменных темы. Undefined наследует родительский record; собственный объект,
включая {}, заменяет его целиком. Header/Content/Footer/Sider напрямую этот record
не получают. Обновление config сохраняет DOM, черновики, выделение/фокус и collapse.
Самостоятельные секции сохраняют native variables/RTL; исходные отличия записаны
в raw reference и учтены явно при сравнении.
В эталоне также зафиксирован сброс неизменившегося padding после удаления
локального paddingTop при React update; native строка стилей сохраняет отступ.

Layout.prefixCls и LayoutSider.prefixCls независимы; пустая строка использует
prefix ближайшего ConfigProvider (ant по умолчанию). Классы состояний, children и trigger следуют своему
prefix; namespace --ant-layout-* и общий marker ant-layout-css-var сохраняются.
Рецепт layout-prefix извлекает 35 правил, runtime выбирает свою группу Layout/Sider.
Native SSR-определение прямого Sider использует внутренние атрибуты; смена prefix
сохраняет DOM, ids/aria-controls, collapse, черновики, выделение и фокус.
Восстановление фокуса использует фактический DOM body и сохраняет явный выбор владельца.
LayoutHeader/LayoutContent/LayoutFooter принимают собственный literal prefixCls:
он задаёт полный класс секции, без добавления suffix. Пустая строка возвращает
класс из ConfigProvider. Префикс контейнера не меняет префиксы секций.
Общий ConfigProvider.prefixCls применяется к Layout и всем его секциям; локальный
literal prefix имеет приоритет. Остальные правила CSS/SSR/фокуса сохранены.

Исходные коллизии prefix с Layout/Sider/variable classes и сохранённым CSS-кэшем
записаны в [raw reference](../../../tests/browser/fixtures/ant-design-layout-prefix-reference.json).
Native markers защищают измеренные роли и соседние scopes; expected corrections
ограничены фоном, position и flex-direction известных alias cases. Замеры каждого
варианта получены в новом документе, transitions — отдельно в одном документе.
У секций upstream [свой дефект prefix](../../../tests/browser/fixtures/ant-design-layout-section-prefix-observation.json):
Header/Content/Footer получают оформление контейнера; наблюдение сохранено для отдельного разбора.
Svelte сохраняет оформление своей секции, включая explicit default/shared prefix.
В [парных замерах](../../../tests/browser/fixtures/ant-design-layout-section-prefix-reference.json)
raw custom-prefix сравнивается с обычной секцией в независимом документе upstream.
Текстовый контейнер эталона берёт font/color/line-height из его getDesignToken
для сверки с текстовым контекстом native provider.
Standalone fallback variables и border-box доступны до hydration, включая legacy
dark/compact; внутри Layout новые variables не объявляются и parent style наследуется.
Локальные style сохраняют приоритет; обновление prefix не заменяет controls и их drafts/selection.

## Affix

`Affix` закрепляет содержимое относительно окна либо DOM-контейнера `target`.
`offsetTop`/`offsetBottom` — числа в px; без обоих используется top=0. При
одновременном выполнении обоих условий приоритет у top. Сравнения координат
округляются как в Ant Design 6.6.8. `onChange(affixed)` вызывается только при
переходе между fixed и обычным потоком, после начального измерения в браузере.
Контейнер выбирается через target → ConfigProvider.getTargetContainer → window.
Функция вызывается только в браузере; общий тип GetTargetContainer экспортирован.

```svelte
<script lang="ts">
  import { Affix, Button } from 'antd-svelte';
  let container = $state<HTMLDivElement>();
</script>
<div bind:this={container} style="height:200px;overflow:auto">
  <Affix target={() => container ?? null} offsetTop={8}>
    <Button>Действие</Button>
  </Affix>
  <div style="height:600px"></div>
</div>
```

`class`/`style` и нативные div-атрибуты относятся к внешнему узлу;
`rootClassName` применяется к внутреннему узлу только при закреплении.
`bind:nativeElement` возвращает внешний div. Через `bind:this` доступны
`updatePosition()` и `updatePosition.cancel()` — отмена очередного принудительного
измерения; scroll-очередь независима. ResizeObserver следит за внешним узлом
и непосредственными DOM-детьми контента. Обработчики слушают фактический target
и снимаются при смене target/удалении; очереди и наблюдатели также очищаются.

SSR не читает target/DOM и оставляет контент в потоке. При закреплении добавляется
пустой aria-hidden placeholder исходных размеров; контент не клонируется и не
перемонтируется, поля сохраняют value, focus и участие в FormData. Affix не
создаёт интерактивной роли и не перехватывает клавиатуру. Типографика, цвета
и RTL наследуются; z-index фиксированного узла берётся из CSS-переменной.

Source theme.components.Affix задаёт zIndexPopup и alias overrides/algorithm.
Default zIndexPopup равен глобальному zIndexBase + 10; число остаётся без единиц,
включая 0. Переменные и scope применяются к закреплённому внутреннему узлу;
обычный поток сохраняет шрифт контейнера. Изменения темы сохраняют DOM, ref,
поля и focus, не вызывая повторного onChange при неизменном fixed-состоянии.
Style внешнего узла и вычисленные top/bottom/width/height сохраняют назначение.
Source aliases, scopes и geometry проверяются в `?fixture=affix-theme`.

ConfigProvider.affix задаёт class/style внешнего узла: локальные class идут
первыми, style — после контекстного. Вложенный record заменяет настройки целиком;
undefined наследует, {} очищает. Локальный prefixCls меняет fixed class и CSS
selectors, сохраняя имена variables. Пустое значение наследует ConfigProvider.prefixCls
(по умолчанию ant-affix).
Prefix/theme/config updates сохраняют wrapper, fixed content, placeholder,
draft/selection/focus и onChange; динамический stylesheet очищается при reset
и unmount. Проверки — `?fixture=affix-config`.

Сохранены ограничения upstream: горизонтальная прокрутка не компенсируется;
при custom target слушается сам контейнер, поэтому перемещение контейнера
внешней прокруткой требует явного updatePosition. Null target или полностью
нулевой скрытый root сохраняют последнее состояние до следующего измерения.
Общий ConfigProvider prefix применяется к fixed-узлу. React ref заменён Svelte bind:this,
children — Snippet без React-клонирования.

GetTargetContainer поддерживает Window/HTMLElement, как runtime context upstream.
В props Ant Design 6.6.8 дополнительно заявлен ShadowRoot, но официальный UMD
вызывает отсутствующий getBoundingClientRect в Affix и Anchor. Эта ветка исключена
из нашего типа и записана для отдельного разбора. При смене общей функции native
Affix сразу меняет target/позицию и снимает старые listeners. Исходник сохраняет
старую позицию до явного updatePosition(); raw frames и корректное состояние после
этого публичного вызова сохранены в [эталоне](../../../tests/browser/fixtures/ant-design-target-container-reference.json).
Проверки наследования, приоритетов, href updates, refs/focus и cleanup —
`?fixture=target-container`.

Фикстура — `?fixture=affix`, пример — `/ant-design#affix`. Engine/DOM-тесты
проверяют округление, очереди, смену target и очистку; SSR/Chromium — нативный
контент, placeholder, размеры, callbacks и hydration. Vendor CSS воспроизводится
рецептом affix (6 правил) из закреплённого архива. Affix-prefix извлекает те же
правила в CSS data template для локального prefixCls; проверяются SHA-256,
scoped defaults, overlapping prefixes и независимый default sibling.

## Space

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
  import { ConfigProvider, Space } from 'antd-svelte';
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

### SpaceCompact и SpaceAddon

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

## Typography

`Typography` — нативный `article` с типографическими стилями; `component` меняет
его тег. `TypographyText`, `TypographyTitle`, `TypographyParagraph` и
`TypographyLink` соответствуют Text/Title/Paragraph/Link Ant Design 6.6.8 и
добавляют операции над текстом. Точные контракты находятся в
[typography.types.ts](../../../src/lib/typography.types.ts).

```svelte
<script lang="ts">
  import { TypographyTitle, TypographyParagraph, TypographyLink } from 'antd-svelte';

  let text = $state('Длинный текст статьи');
  let expanded = $state(false);
</script>

<TypographyTitle level={2}>Название статьи</TypographyTitle>
<TypographyParagraph children={text} copyable
  editable={{ onChange: value => { text = value; } }}
  ellipsis={{ rows: 2, expandable: 'collapsible', expanded,
    onExpand: (_event, info) => { expanded = info.expanded; } }} />
<TypographyLink href="/articles" target="_blank">Все статьи</TypographyLink>
```

Text рендерит `span`, Title — `h1`–`h5` (по умолчанию `h1`), Paragraph — `div`,
Link — `a`. У Link с `target="_blank"` и не заданным `rel` добавляется
`noopener noreferrer`. `disabled` меняет оформление; кнопки copy/edit/expand
сохраняют интерактивность, как в upstream. Decorations оборачивают текст вместе
с действиями; `actions.placement` переносит панель в начало или конец.

`copyable` принимает настройки text, format, icon, tooltips, tabIndex и onCopy.
Async producer вызывается по клику; пустой text использует исходный children
fallback. HTML копируется как `text/html` и `text/plain`; при отказе Clipboard API
применяется document copy fallback. Успешное состояние сбрасывается через три
секунды. Уже начатая операция и callback завершаются после unmount без нового
таймера. Для богатого содержимого указывайте `copyable.text`: исходный array
fallback объединяет верхний уровень, а узлы элементов превращает в
`[object Object]`.

`editable` управляет режимом через editing; callbacks сами не заменяют children.
Редактор получает editable.text или строковые children. Ввод удаляет CR/LF,
сохранение применяет trim. Enter вызывает onChange и onEnd, Escape — onCancel,
blur — только onChange; IME и модификаторы Enter учитываются. Поддержаны
triggerType, maxLength, autoSize, tooltip, icon и tabIndex. `enterIcon={null}`
скрывает подтверждение; custom enterIcon snippet получает CSS class первым
аргументом вместо React cloneElement. При закрытии фокус возвращается к edit icon.
Редактор не становится control внешнего FormItem. При blur без relatedTarget
проверка connected выполняется после Svelte tick: удаление focused DOM не должно
сохранять draft. `bind:nativeElement` отсутствует во время editing и очищается
при unmount.

Без действий и других настроек ellipsis использует native CSS. JS-ветка измеряет
строки и операции, ищет границу по UTF-16, сохраняет suffix и полный aria-label.
Поддержаны rows, expandable/collapsible, symbol, defaultExpanded, expanded,
onExpand, onEllipsis и tooltip. DefaultExpanded читается один раз. Text исключает
rows/expandable/onExpand; для responsive ширины Text задайте style. Link принимает
boolean ellipsis. Tooltip измеряет native overflow при наведении и скрывается
над панелью действий. Его trigger и hover delays наследуют ConfigProvider.tooltip;
локальные options приоритетнее, включая 0 и trigger=[]. Вложенный tooltip record
заменяет родительский целиком. Без настроек trigger=hover и обе задержки равны 0.1s.
Поддержаны focus/click/contextMenu и массивы событий; source config разделяет
их действия, поэтому hover leave может закрыть подсказку, открытую click/focus.
Повторный contextMenu переключает видимость, обычный click её закрывает.
Локальные showAction/hideAction независимо заменяют эти действия; focusDelay и
blurDelay не наследуют mouse delays. Их приоритет, touch fallback и поведение
внешнего закрытия описаны в [Tooltip](feedback.md#tooltip).
Подсказки copy/edit наследуют те же настройки; копирование, success title и вход
в редактор сохраняют свои обычные действия.
Ellipsis Tooltip также принимает destroyOnHidden:
при закрытии удаляется его содержимое, измерение текста и native shell сохраняются.
Как в upstream, onOpenChange сообщает raw open даже для текста без усечения,
но сама подсказка остаётся скрытой. Для native CSS ellipsis сначала требуется
измерение при наведении; JS ellipsis измеряется независимо от Tooltip trigger.

Scalar children и массивы передают точные границы текста до SSR. В массиве snippet
остаётся атомом. Обычный текстовый children snippet распознаётся после mount через
DOM; при JS truncation и editing исходный snippet остаётся в скрытом `span`, чтобы
получать обновления. Его полный текст поэтому остаётся в textContent, а видимый обрезанный
текст доступен через innerText. Для точного initial SSR editing используйте
scalar children или editable.text. Богатый snippet не разбирается как React tree.

ConfigProvider.typography задаёт class/style и semantic root/actions/action/textarea;
локальные слои имеют приоритет. Callback видит разрешённые prefixCls/direction и
фактический component. Locale.typography и исходный locale.Text задают подписи
действий; Text имеет приоритет при совместном использовании. Сохранены dark,
compact, RTL, native focus и исходные heading margins.

Все варианты Typography используют локальный `prefixCls` либо наследуют общий
`ConfigProvider.prefixCls`; пустое значение выбирает наследование. Prefix охватывает
заголовки, decorations, ellipsis, actions и отдельный editor root. Смена prefix
сохраняет DOM, draft/selection/focus и состояние копирования. Namespace theme
variables и prefix вложенного Tooltip остаются независимыми.

`theme.components.Typography` применяет `titleMarginTop`/`titleMarginBottom`,
alias overrides и algorithms к обычному тексту и редактору. Global tokens,
вложенные/reset/sibling scopes и отдельный CSS-variable prefix следуют source;
semantic и локальный style сохраняют приоритет. Смена темы сохраняет DOM,
draft/selection/focus редактора и ожидающее async-копирование. Без source theme
сохраняются прежние CSS defaults.

Tooltip использует общий native popover внутри корня вместо React body portal.
Доступны общие 12 placement, container getters, color, локальные popup prefixCls и
openClassName и semantic styles. Callbacks получают разрешённые trigger/delays
и входной open владельца. Изменение config сохраняет popup DOM, ввод, выделение
и фокус. Остальные delegated Tooltip props, включая UniqueProvider/motion
и полную геометрию CSS-transform/scroll-container,
ещё требуют переноса. Граница fresh для opaque Snippet описана в Tooltip.
В исходном Ellipsis memoization не учитывает смену prefix: во вложенном provider
кнопки copy/edit могут сохранить старые классы и потерять оформление. Raw live
замеры и fresh mount с теми же public props сохранены в
[prefix-эталоне](../../../tests/browser/fixtures/ant-design-typography-prefix-reference.json).
Native обновляет классы действий вместе с корнем; этот дефект не перенесён.
Проверки prefix: [браузер](../../../tests/browser/typography-prefix.spec.ts) и
[SSR](../../../tests/package/typography-prefix.ssr.test.ts), `?fixture=typography-prefix`.

Проверки: [engine](../../../src/lib/typography.engine.test.ts),
[copy lifecycle](../../../src/lib/typography-copy.model.test.ts),
[public package SSR](../../../tests/package/typography.ssr.test.ts),
[browser](../../../tests/browser/typography.spec.ts), `?fixture=typography`.
Темы сверяются с [официальным UMD](../../../tests/browser/fixtures/ant-design-typography-theme-reference.json)
в [unit](../../../src/lib/theme-typography-tokens-reference.test.ts),
[SSR](../../../tests/package/typography-theme.ssr.test.ts) и
[браузере](../../../tests/browser/typography-theme.spec.ts), `?fixture=typography-theme`.

Ширина actions сверяется с
[DOM/CSS-снимком Ant Design 6.6.8](../../../tests/browser/fixtures/ant-design-typography-actions-reference.json)
в изолированном ShadowRoot. Так сравнение использует одинаковые шрифты текущего
браузера в Chromium и Headless Shell; точность и границы двухстрочного текста сохранены.

Ellipsis Tooltip defaults, semantic callbacks и события сверяются с
[23 UMD-сценариями / 29 кадрами и 21 event trace](../../../tests/browser/fixtures/ant-design-typography-tooltip-reference.json):
[SSR](../../../tests/package/typography-tooltip.ssr.test.ts),
[browser](../../../tests/browser/typography-tooltip.spec.ts), `?fixture=typography-tooltip`.
Эталон использует runtime CSS официального UMD без статического antd.css;
native overflow измеряется под trigger=[] до записи последовательностей событий.
[73 исходных CSS rules](../../../src/lib/vendor/typography.css) воспроизводятся
[рецептом](../../../tools/ant-design-css-recipes.json). Иконки взяты из
@ant-design/icons-svg 4.6.0 под существующей
[MIT-лицензией](../../../src/lib/vendor/LICENSE.ant-design-icons).

## FloatButton, FloatButtonGroup и FloatButtonBackTop

FloatButton сохраняет native Button/href, type=default|primary, shape=circle|square,
icon и content. Текст, число,
boolean и Snippet заменяют ReactNode; число 0 не включает default icon. Без
renderable content/icon используется FileTextOutlined из закреплённого icons-svg.
Кнопка имеет размер 40px и fixed-положение: inline-end 24px, bottom 48px.
Размер стандартной иконки — fontSizeIcon × 1.5 = 18px. Shape группы имеет
приоритет над shape детей. Native htmlType/disabled/события сохраняют Button API.

Tooltip принимает scalar/Snippet либо props существующего Tooltip; 0 показывает
подсказку. Badge принимает props существующего Badge без status/text/title/children;
этот набор исключается и в runtime. Semantic classNames/styles root/icon/content
принимают объект или callback { props }, включая undefined result. Group context
сливается перед локальными slots, style кнопки имеет последний приоритет.

FloatButtonGroup принимает children Snippet либо items=[{ key, children: Snippet }].
Items создают отдельные Compact slots и имеют приоритет над children. Для opaque
Snippet геометрия квадратных краёв определяется CSS siblings, без точного
воспроизведения Compact edge classes. Circle использует Flex, square — Compact.
Trigger click/hover включает меню; без trigger показывается список без trigger.
FloatButton/Group/BackTop поддерживают local/shared prefixCls. У Group это базовый
prefix кнопки без суффикса -group. Дочерние кнопки наследуют owner prefix при
undefined; непустое локальное значение имеет приоритет, пустое выбирает общий
ConfigProvider. Button/Badge/Tooltip/Compact сохраняют собственные namespaces;
progress и параметры анимации используют общий prefix независимо от local class.
Смена prefix сохраняет DOM/ref, открытое меню, scroll/progress, draft/selection/focus.

В Ant Design Group не передаёт local prefix детям и trigger. Raw UMD замеры
сохранены отдельно от matched public child prefixes и trigger semantic aliases/
styles. В Svelte owner prefix наследуется. Shared local class в nested provider
также обнаружил Source cache defect: BackTop теряет progress background. Fresh
Inner measurement сохранён отдельно; Native изолирует class и global namespace.

Placement top/bottom/left/right остаётся физическим и при RTL. Open + onOpenChange
дают controlled mode: владелец может отклонить запрос; без open состояние внутреннее.
Disabled блокирует переключение меню, но сам по себе не отключает детей.
Клик вне группы закрывает меню, клик элемента сохраняет его открытым.
CloseIcon и semantic slots root/list/item/itemIcon/itemContent/trigger/triggerIcon/
triggerContent доступны локально и через ConfigProvider.floatButtonGroup.

FloatButtonBackTop принимает target={() => window|document|element|null},
visibilityHeight (400), duration (450ms), showProgress. На SSR виден только при
visibilityHeight=0, target не вызывается. После mount scroll обновляет видимость
и progress; resize обновляет только progress. Click запускает cubic scroll к 0
перед пользовательским callback. При reduced motion прокрутка мгновенная;
собственные RAF/listeners отменяются при unmount. NativeElement с bind доступен
у кнопки/FloatButtonBackTop, у Group указывает на div группы.

ConfigProvider.floatButton.backTopIcon задаёт иконку FloatButtonBackTop. Как в исходной 6.6.8,
FloatButton не потребляет объявленные в глобальном floatButton config class/style/
semantic slots; локальные props работают. Config вложенного provider наследуется
при undefined и заменяется целиком при заданном объекте.

`theme.components.FloatButton` применяет alias overrides и algorithms к кнопкам,
Group и FloatButtonBackTop. Собственных component tokens у закреплённого FloatButton нет:
размер задаёт controlHeightLG, иконку — fontSizeIcon, отступы — paddingXXS,
marginXXL/marginLG и padding группы. Button сохраняет свои component tokens;
его config style, semantic styles и локальный style имеют приоритет над темой.
Вложенные и соседние providers изолированы, поддержаны custom cssVar prefix,
реактивные изменения и возврат к legacy defaults.

Сохраняются прежние ограничения Button/Badge/Tooltip; произвольный prefixCls и
общий React z-index context ещё не перенесены. CSS-рецепт воспроизводит 42 правила;
глобальный fade адаптирован через WAAPI с исходными длительностями и reduced motion.
У FloatButtonBackTop fade меняет только opacity по linear-кривой; локальный
transform сохраняется во время появления и исчезновения. Промежуточные кадры
официального UMD сверяются в [browser](../../../tests/browser/float-button-motion.spec.ts).
Wave наследуется через общий Button, включая FloatButtonBackTop и trigger группы.

```svelte
<FloatButton tooltip="Помощь" aria-label="Помощь" onclick={showHelp} />
<FloatButtonGroup shape="square" trigger="click" aria-label="Действия">
  <FloatButton content="?" aria-label="Поддержка" />
  <FloatButtonBackTop visibilityHeight={0} aria-label="К началу" />
</FloatButtonGroup>
```

## BorderBeam

BorderBeam переносит декоративные слои Ant Design 6.6.8: BorderBeam/BorderBeamEffect,
useBorderSize, util и style. Изучены @ant-design/cssinjs 2.1.2 (^2.1.2) и
@rc-component/util 1.14.0 (^1.14.0). Компонент не создаёт обёртку: слои добавляются
непосредственно в контейнер и скрыты от accessibility tree.
Точные Props и defaults — в [исходных типах](../../../src/lib/border-beam.types.ts).

В Svelte target явно связывает контейнер с эффектом. Это заменяет клонирование
React child с составным ref; существующий ref вызывающего кода сохраняется.

```svelte
<script lang="ts">
  import { BorderBeam, Card } from 'antd-svelte';

  let container = $state<HTMLDivElement>();
</script>

<BorderBeam target={container} count={3} duration={12} color="#36cfc9">
  <Card bind:nativeElement={container} title="Workspace overview">
    Состояние задач и последних запусков
  </Card>
</BorderBeam>
```

Для нативного элемента используйте bind:this. Контейнер должен задавать
position:relative либо другой positioning context; BorderBeam не исправляет его
style. Отсутствующий target, SVG и обычный текст не получают декорацию. Содержимое
при этом отображается; собственных DOM nodes на SSR нет. Смена target и unmount
удаляют принадлежащие эффекту слои, не меняя controls и содержимое контейнера.

Count округляется вниз; неконечное число или число меньше 1 дают один луч.
Несколько лучей распределяются по циклу отрицательным animation-delay. Первый
луч сохраняет delay из style; остальные используют duration prop либо исходные
6 секунд, даже когда duration переопределена через CSS variable в style.

Градиент сохраняет порядок stops и масштабирует входные проценты 0–100 в видимые
0–70%, оставляя хвост прозрачным. Если последний stop не равен 100%, его цвет
добавляется в конец видимого участка. Пустой массив возвращает градиент темы.
Числовые size/lineWidth используют px; строки остаются CSS lengths.

Без outset четыре отступа измеряются по border-width один раз для каждого
target. Последующие изменения рамки того же узла не вызывают новый замер.
Radius наследуется через CSS и обновляется сразу, включая разные углы. Явный
outset задаётся числом в px либо строкой через calc(-1 * outset); числовое
отрицательное значение сохраняет исходное выражение `--2px` и не нормализуется.

ConfigProvider.borderBeam задаёт class/style слоёв. Вложенный config заменяется
целиком; локальный style идёт после контекстного, а переменные параметров —
после style. Theme light/dark и primary работают через CSS variables; disabled,
locale и направление не меняют декоративное поведение.

BorderBeam принимает alias overrides и algorithms из theme.components.BorderBeam;
собственных component tokens у него нет. Line width, primary gradient и typography
обновляются без пересоздания слоёв. Внешний target получает тему владельца эффекта,
включая CSS overrides его ConfigProvider, независимо от темы физического контейнера.
Context/local style и явные параметры сохраняют приоритет над вычисленной темой.
При удалении source theme возвращается прежнее наследование CSS от target.

CSS-рецепт border-beam сохраняет 10 правил и antBorderBeamMove с проверкой
SHA-256 архива. Слои видимы при поддержке mask-composite и offset-path:rect;
иначе применяется исходный CSS fallback display:none. Reduced motion скрывает
псевдоэлемент и отключает анимацию. Hover/pause настраиваются обычными CSS rules.
Эффект не заменяет focus ring или validation border.

Локальный prefixCls меняет классы слоёв и selectors, включая supports/media rules.
Пустое значение наследует ConfigProvider.prefixCls (по умолчанию ant-border-beam).
Общий prefix задаёт namespace служебных переменных --prefix-border-beam-*;
точки удаляются из namespace, как в source genCssVar. Локальный prefix на него не
влияет, theme.cssVar.prefix независим, имя antBorderBeamMove сохраняется. Смена префикса
сохраняет слои, контейнер, draft и фокус. Scoped stylesheet удаляется вместе
с эффектом либо при возврате к стандартным class/variable prefixes.
Проверки локального prefix — `?fixture=border-beam-prefix`.

Общий prefix проверяется по
[14 исходным примерам и трём переходам](../../../tests/browser/fixtures/ant-design-beam-global-reference.json):
[browser](../../../tests/browser/beam-global.spec.ts),
[SSR](../../../tests/package/beam-global.ssr.test.ts), `?fixture=beam-global`.
CSS-кэш 6.6.8 при одинаковом local class и разных общих prefixes повторно использует
namespace родителя: у вложенного луча теряются outset/параметры либо читается размер
родителя. Четыре случая сохранены в raw данных; те же вложенные компоненты на
[отдельной свежей странице](../../../tests/browser/fixtures/ant-design-beam-global-isolated.json)
читают свои переменные правильно. Svelte ограничивает CSS парой class/namespace и
сверяется с этими изолированными исходными результатами. Дефект кэша не перенесён;
raw наблюдение остаётся для отдельного разбора. Слои, target, border snapshot,
draft/focus/selection и reduced motion сохраняются.
Автоматический поиск host через React child/ref заменён описанным target API;
прикладные обёртки и runtime React dependencies не добавляются. Fixture
`?fixture=border-beam`, engine/SSR, package SSR и браузерные проверки принадлежат
библиотеке. Source aliases, scopes и reactive cleanup дополнительно проверяются
через `?fixture=border-beam-theme`; пример выше не требует изменения сайта-потребителя.
