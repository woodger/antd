# Grid: Row, Col и breakpoints

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

