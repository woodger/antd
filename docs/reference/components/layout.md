# Layout

`Layout` объединяет разделы страницы. Если боковая панель видна сразу, задайте
`hasSider` у окружающего её контейнера, чтобы колонки заняли свои места уже при SSR.

```svelte
<script lang="ts">
  import { Layout, LayoutContent, LayoutHeader, LayoutSider } from '@woodger/antd';
</script>

<Layout>
  <LayoutHeader>Кабинет проекта</LayoutHeader>
  <Layout hasSider>
    <LayoutSider theme="light"><a href="#team">Команда</a></LayoutSider>
    <LayoutContent><h1 id="team">Участники проекта</h1></LayoutContent>
  </Layout>
</Layout>
```

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
переходы. Фикстура — `?fixture=layout`; unit/SSR/
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

