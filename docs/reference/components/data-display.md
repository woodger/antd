# Отображение данных

## Statistic

```svelte
<Statistic title="Баланс" value="123456.789" precision={2} suffix="₽" />
```

Value — число или строка (default=0). Встроенное форматирование повторяет
Ant Design Number.tsx: группа из трёх цифр, groupSeparator="," и decimalSeparator=".".
Precision дополняет нулями или обрезает дробную часть без округления; отрицательная
precision убирает её. Длинные числовые строки не преобразуются в number.
Пустая строка и .5 превращаются в 0 и 0.5; неподдержанная запись, например
"1e6", "-" или "1.", отображается как текст. Числа с JS-научной нотацией также
не разворачиваются. Formatter(value) получает исходный value и возвращает
строку, число или Snippet; его результат заменяет встроенное форматирование.

Title/prefix/suffix принимают string/number/Snippet, null или false. Ноль
отображается, пустые scalar-значения не создают узел. Snippet считается
присутствующим даже при пустом выводе. ValueRender — Snippet<[Snippet]>:
полученный snippet выводит готовый span значения, который можно обернуть.
ClassNames/styles поддерживают root/header/title/content/value/prefix/suffix
и callback ({ props }) с default value/loading/separators. Styles передаются CSS-строками; style перекрывает styles.root,
styles.content задаёт оформление значения. Bind:nativeElement даёт HTMLDivElement.

ConfigProvider.statistic задаёт общие class/style/classNames/styles для Statistic
и StatisticTimer. Классы config и local накапливаются. Root styles применяются
в порядке config.styles.root → config.style → local styles.root → local style;
остальные slots объединяются с приоритетом local. Оба callback получают те же
props с разрешёнными value/loading/separators. Undefined наследует родительский
statistic-record, любой собственный объект, включая {}, заменяет его целиком.

```svelte
<ConfigProvider statistic={{ class: 'metric', styles: { value: 'font-weight:600' } }}>
  <Statistic title="Баланс" value={1234.5} styles={{ value: 'color:green' }} />
</ConfigProvider>
```

Реактивная смена config и callback props сохраняет DOM корня, вложенные и соседние
провайдеры изолированы. Сверка: [26 исходных случаев и 4 обновления](../../../tests/browser/fixtures/ant-design-statistic-config-reference.json),
[браузерные метрики](../../../tests/browser/statistic-config.spec.ts),
[публичные типы и SSR](../../../tests/package/statistic-config.ssr.test.ts), `?fixture=statistic-config`.
Прежние Svelte defaults, native RTL direction и доступный loading Skeleton сохранены.

Локальный `prefixCls` меняет root и имена частей Statistic/Timer; пустая строка
наследует ConfigProvider.prefixCls (по умолчанию ant-statistic). CSS variables
сохраняют namespace Statistic, marker
ограничивает динамический CSS своим корнем. Соседние default-компоненты не меняются,
включая prefix, совпадающий с ant-statistic-content или ant-statistic-css-var.
Смена prefix сохраняет DOM корня, semantic styles, темы и native compact defaults.
Сверка: [22 исходных случая и 4 смены prefix](../../../tests/browser/fixtures/ant-design-statistic-prefix-reference.json),
[браузер](../../../tests/browser/statistic-prefix.spec.ts),
[CSS boundary](../../../src/lib/statistic-prefix.test.ts),
[публичный пакет и SSR](../../../tests/package/statistic-prefix.ssr.test.ts), `?fixture=statistic-prefix`.
Общий ConfigProvider.prefixCls применяется также к Timer; локальный prefix имеет приоритет.

Loading сохраняет заголовок и заменяет content существующим Skeleton с active
и paragraph=false. Используются его доступный статус и служебные обёртки;
formatter и valueRender скрытого значения не вызываются. Statistic не добавляет
роль, tabindex или live region для обычного значения; их можно задать нативными
атрибутами. В RTL значение остаётся LTR, интервалы prefix/suffix логические.
Темы наследуют цвета; compact меняет title/content с 14/24px на 12/20px.

ConfigProvider.theme.components.Statistic задаёт titleFontSize/contentFontSize
также для обоих режимов Timer. Defaults рассчитываются из fontSize/fontSizeHeading3;
поддержаны числовой 0, строковый contentFontSize, alias tokens, глобальные
и компонентные algorithms, cssVar.prefix и вложенные providers.
Реактивная смена темы сохраняет содержимое, snippets, фокус и работу таймеров.
Переменные темы применяются перед styles.root/style; semantic styles сохраняются.
Отступ loading host берётся из собственной темы Skeleton, включая его
component aliases/algorithm; Statistic.padding не перекрывает этот отступ.
В эталоне 6.6.8 RTL class Statistic не задаёт direction в LTR-документе.
Svelte сохраняет существующий dir=rtl и LTR value; наблюдение записано в реестре.
Сверка: [официальные CSS tokens](../../../tools/fixtures/ant-design-statistic-tokens-reference.json),
[оформление normal/loading/Timer countup/countdown](../../../tests/browser/fixtures/ant-design-statistic-theme-reference.json),
[SSR](../../../tests/package/statistic-theme.ssr.test.ts) и
[browser](../../../tests/browser/statistic-theme.spec.ts), `?fixture=statistic-theme`.

Пример — `/ant-design#statistic`, фикстура — `?fixture=statistic`. Unit/SSR/Chromium
проверяют форматирование, loading, snippets, semantic styles, темы, RTL и фокус.
Рецепт statistic воспроизводит 14 правил vendor/statistic.css из закреплённого
архива; statistic-prefix выводит те же 14 правил CSS-модулем для локального prefixCls.

StatisticTimer переносит актуальный Statistic.Timer и требует type=countdown/countup;
Остальные props
Statistic, включая loading и semantic slots, передаются показателю, но formatter
и valueRender заменяются встроенным выводом времени, как в upstream.

Value — timestamp в ms либо строка, которую принимает new Date(value).
При пропущенном value отображение использует default=0 самого Statistic,
но callbacks получают NaN от исходной отсутствующей цели, как в upstream.
SSR и первый hydration render выводят `-` без часов и callbacks. После mount
таймер отображает разницу с Date.now(), обновляясь через setInterval(1000/60).
Format по умолчанию HH:mm:ss; Y/M/D/H/m/s/S обозначают фиксированные единицы
365 дней/30 дней/день/час/минута/секунда/ms. Повтор токена дополняет нулями,
текст в квадратных скобках сохраняется буквально. Это формат длительности,
не календарный formatter и не полный API dayjs. Пропущенные крупные единицы
накапливаются в следующей: HH может превышать 24.

Отображаемая разница ограничена нулём, onChange(number) получает исходную
знаковую разницу на каждом тике. В режиме countdown onFinish вызывается один раз на первом
тике строго после цели и останавливается; на точном равенстве времени не завершает
интервал. Countup не вызывает onFinish. При смене value/type интервал перезапускается,
смена format/callbacks не требует перезапуска. Loading скрывает значение, сохраняя
работу таймера. При удалении компонента интервал очищается; поздние callbacks
отменённого или заменённого запуска игнорируются. Невалидная дата сохраняет
поведение upstream (NaN в форматировании/callback, без автоматического завершения).
Bind:nativeElement даёт корневой div Statistic. Фикстура — `?fixture=statistic-timer`.

## Descriptions

Descriptions отображает items: массив { key?, label?, children?, span? }.
Label/children/title/extra принимают string, number или Snippet; 0 отображается,
пустые значения не создают соответствующий wrapper. React Descriptions.Item
служит только JSX sugar; в Svelte используется items без предварительного
исполнения snippets. Корень — div, затем view/table/tbody/tr и нативные th/td;
bind:nativeElement возвращает div, нативные attrs передаются корню.

Column — число либо responsive map xs–xxxl; по умолчанию xs=1, sm=2,
md/lg/xl/xxl=3, xxxl=4. Пользовательская map проверяется от большего активного
breakpoint к меньшему; затем используется default map. При SSR screens={}
и column=3; media подключаются после mount и очищаются при unmount.
Span — число, responsive map либо filled. Переполнение ограничивается остатком
строки; последняя ячейка неполной строки растягивается на свободные колонки.
Filled завершает текущую строку и занимает оставшуюся часть. Входные items не
мутируются. Как в upstream, responsive перестройка строк может пересоздать
содержимое ячейки, переместившейся между строками; state таких controls храните
снаружи в модели.

Layout=horizontal по умолчанию; vertical создаёт отдельные строки labels/content.
Bordered=false, colon=true. В horizontal bordered label получает th/span=1,
content — td/span=2*span-1; vertical сохраняет span на обеих строках. Colon
управляет псевдоэлементом label только без рамки. Без явного size/componentSize
используется размер large; medium и small уменьшают отступы.
ComponentDisabled не меняет read-only поля.

ClassNames/styles поддерживают root/header/title/extra/label/content, объект
либо callback ({ props }) с разрешёнными column/items/size. У items есть
class/style и classNames/styles.label/content.
Приоритет label/content: root semantic style → item semantic style. В bordered
эти стили относятся к th/td и перекрывают item.style; без рамки — к внутренним span. Style корня идёт после styles.root.
Вложенные таблицы сохраняют собственные bordered/size и не получают row-стили
внешней таблицы. Темы/RTL наследуются через ConfigProvider.

Непустой локальный `prefixCls` задаёт корень, header/title/extra, view/row и все
ячейки; пустое значение наследует `ConfigProvider.prefixCls`. Semantic callbacks
получают исходный локальный prefix. Namespace theme variables независим.
Смена prefix сохраняет DOM/ref, draft/selection/focus и FormData.

Два правила Descriptions внутри Table expanded-row используют общий prefix Table
и локальный prefix Descriptions; namespace владельца изолирует соседние scopes.
Их default-копии в descriptions.css и общем vendor/antd.css ограничены стандартным
owner через zero-specificity selector, чтобы не перекрывать custom namespace.
В оригинале Table ищет только общий Descriptions class и пропускает local prefix.
Raw UMD замеры сохранены; Native сохраняет expanded-row оформление и с local prefix.
Для этого случая expectedNative в эталоне меняет только display view и flex table
на измеренные значения обычного Table context. Полный перенос prefix Table идёт отдельно.
Сверка: [prefix-эталон](../../../tests/browser/fixtures/ant-design-descriptions-prefix-reference.json),
[браузер](../../../tests/browser/descriptions-prefix.spec.ts) и
[SSR](../../../tests/package/descriptions-prefix.ssr.test.ts), `?fixture=descriptions-prefix`.

ConfigProvider.descriptions задаёт class/style и object/function classNames/styles
для тех же semantic slots. Классы context/local объединяются; root style layers:
context semantic → context style → local semantic → local style. Для ячеек общий
semantic слой идёт перед item semantic styles. Явный вложенный
record, включая {}, заменяет родительский; undefined наследует его. Обновления
сохраняют editor/focus/selection и FormData первой ячейки при смене column/size.
Фикстура — `?fixture=descriptions-config`,
[браузерная сверка](../../../tests/browser/descriptions-config.spec.ts) сохраняет raw UMD
classes/tags/colspan/computed styles; проверка классов учитывает состав и количество.

Callbacks сохраняют прежние native bordered=false, layout=horizontal и colon=true
при отсутствии этих props. У upstream raw mergedProps они отсутствуют; наблюдение
записано отдельно в [эталоне](../../../tests/browser/fixtures/ant-design-descriptions-config-reference.json).
Column/items/size разрешены в обоих вариантах.

ConfigProvider.theme.components.Descriptions применяет все десять компонентных
токенов, включая цвета title/extra/label/content, фон label, отступ заголовка,
ячеек и двоеточия. Значения рассчитываются из общих alias tokens; поддержаны
глобальные и компонентные algorithms, cssVar.prefix, вложенные providers
и обновление после mount. Переменные темы идут перед semantic/user styles.
Сохраняются исходные правила 6.6.8: bordered использует labelBg и общий
colorTextSecondary вместо labelColor, а размеры и рамка могут перекрывать
itemPaddingBottom/itemPaddingEnd собственными отступами.
Сверка: [официальные CSS tokens](../../../tools/fixtures/ant-design-descriptions-tokens-reference.json),
[варианты и responsive spans](../../../tests/browser/fixtures/ant-design-descriptions-theme-reference.json),
[SSR](../../../tests/package/descriptions-theme.ssr.test.ts) и
[browser](../../../tests/browser/descriptions-theme.spec.ts), `?fixture=descriptions-theme`.

Галерея — `/ant-design#descriptions`, фикстура — `?fixture=descriptions`.
Unit/SSR/Chromium проверяют раскладку, media, приоритет стилей и вложенность.
Рецепт descriptions извлекает 40 правил без keyframes, включая две интеграции
Table expanded-row. Responsive column/span используют глобальные
`theme.token.screen*`, включая отдельные screenSMMin/screenSM и gaps между
порогами. Вложенный provider наследует значения; inherit:false возвращает defaults.
Порядок порогов проверяется и при SSR; в браузере смена токенов заменяет queries
без remount. Существующее оформление без source theme сохраняет стандартные пороги.
[Исходные замеры](../../../tests/browser/fixtures/ant-design-descriptions-breakpoints-reference.json)
содержат raw stale observer Source при смене токенов и отдельный public fresh mount:
Native сохраняет реактивное поведение, проверенное по свежей исходной раскладке.
[Browser](../../../tests/browser/descriptions-breakpoints.spec.ts) проверяет column/span,
editor/ref/focus/selection/FormData и cleanup подписок;
[SSR](../../../tests/package/descriptions-breakpoints.ssr.test.ts) — fallback и validation.

## Card

Card, CardGrid и CardMeta соответствуют Card/Grid/Meta эталона 6.6.8. Слоты
title/extra/cover/actions и Meta.avatar/title/description принимают text/number/
boolean/Snippet; 0 и true считаются присутствующими, но boolean не выводит текст.
Children Card/Grid — Snippet. Все три компонента поддерживают нативные attrs,
class/style и bind:nativeElement; Card дополнительно rootClassName.
Корни остаются div, actions — ul/li/span с равными долями ширины. Интерактивный
контент actions задавайте нативными buttons/links; hoverable не добавляет роль
button или клавиатурную активацию контейнеру.

Пустой Card не создаёт body. Loading заменяет только children на активный
Skeleton без title с четырьмя строками; header/cover/actions остаются. State
заменённого содержимого уничтожается, как в upstream. Если фокус был внутри
body, он паркуется на body (tabindex=-1, aria-busy); unmount передаёт его соседнему
control. Это доступная Svelte-адаптация поверх исходной разметки.

Variant=outlined/borderless. Hoverable
по умолчанию false, type=inner меняет header/body. Small наследуется из явно
заданного ConfigProvider.componentSize; medium/large используют
обычную геометрию. По умолчанию small body/header padding равен 12px;
остальные размеры/цвета используют theme/compact tokens.
ClassNames/styles Card принимают root/header/body/extra/title/actions/cover,
Meta — root/section/avatar/title/description, объект либо callback ({ props }).
Style корня перекрывает styles.root; styles.header/body оформляют header/body.
Meta root следует тому же приоритету.

Непустой `Card.prefixCls` задаёт корень, состояния, header/body/cover/actions;
пустое значение наследует `ConfigProvider.prefixCls`. Grid/Meta используют базовый
Card prefix: undefined наследует ближайшего владельца, непустое значение задаёт
свой prefix, явная пустая строка выбирает общий provider. Callback props сохраняют
исходный локальный prefix. Typography и Tabs используют общий namespace независимо
от local Card; component theme variables и canonical markers сохраняются.
Смена prefix сохраняет Card/Grid/Meta DOM/ref, active tab, draft/selection/focus
и FormData. Grid detection использует стабильный marker с прежним canonical fallback.

В Ant Design Card не передаёт local prefix в Meta/Grid: raw и matched замеры
через их публичный prefixCls сохранены отдельно. Native наследует owner prefix.
При shared local class между Suite/Inner исходный CSS cache также может оставить
selector только для Suite Typography/Tabs. Raw/matched snapshot сохранён;
freshNested измеряет свежий Source Inner с той же темой, expectedNative использует
его для nested scope. Native изолирует class и namespace.
Сверка: [официальные prefix-замеры](../../../tests/browser/fixtures/ant-design-card-prefix-reference.json),
[браузер](../../../tests/browser/card-prefix.spec.ts) и
[SSR](../../../tests/package/card-prefix.ssr.test.ts), `?fixture=card-prefix`.

ConfigProvider.card задаёт variant, class/style и те же semantic classNames/styles;
ConfigProvider.cardMeta независимо настраивает Meta через class/style и semantic
slots. Классы context/local объединяются. Стили корня: context semantic → context
style → local semantic → local style; переменные темы идут перед ними.
Явный вложенный record, включая {}, заменяет соответствующий родительский целиком;
undefined наследует его. Обновления сохраняют editors, focus/selection, FormData,
выбранную вкладку и существующие callbacks. Фикстура — `?fixture=card-config`,
[проверки](../../../tests/browser/card-config.spec.ts) используют неизменённый UMD 6.6.8.

Semantic callbacks Card сохраняют прежние native defaults: loading/hoverable=false
и tabProps={} при отсутствии этих props. Raw source mergedProps оставляет их
undefined; size/variant разрешены в обоих случаях. Это отличие записано в
[эталоне](../../../tests/browser/fixtures/ant-design-card-config-reference.json)
отдельно от CSS-сценариев с явно заданными flags.

ConfigProvider.theme.components.Card применяет все 13 компонентных токенов
эталона, включая bodyPadding/bodyPaddingSM, headerHeight/headerHeightSM,
headerBg и actionsBg. Defaults пересчитываются из aliases и component algorithm;
вложенные providers, inherit=false, dark/compact и реактивные изменения изолированы.
Переменные темы идут перед semantic/user styles. Grid/Meta наследуют scope Card;
padding Grid использует paddingLG, а не bodyPadding, как в upstream.
Настройки theme.cssVar описаны в [справочнике темы](../theme-context.md).

CardGrid по умолчанию hoverable=true и width=33.33%; style переопределяет ширину.
Card определяет только прямые Grid внутри body. При SSR CSS :has сохраняет
геометрию до mount, затем direct-child MutationObserver обновляет класс
ant-card-contain-grid; listener очищается, отложенные callbacks игнорируются.
Для точного SSR-класса и начального loading с Grid задавайте containGrid=true;
false отключает auto detection. Это адаптация непрозрачного Snippet вместо
React children inspection. Флаг сохраняется во время загрузки уже показанного
Grid. Meta вне Card не подключает самостоятельные стили, как в upstream.

TabList задаёт заголовки Tabs, а body остаётся children Card; выбор поддерживает
bind:activeTabKey/onTabChange. DefaultActiveTabKey (включая пустую строку) имеет
приоритет над tabProps.defaultActiveKey. Label задаёт заголовок, включая
явные null/undefined. Размер вкладок large или small по размеру Card;
tabProps.size переопределяет его. Card переопределяет tabProps items/class/onChange/
tabBarExtraContent; остальные поддерживаемые Tabs props передаются. Верхний
activeTabKey имеет приоритет над tabProps.activeKey. TabBarExtraContent поддерживает
правый слот либо { left, right }. Клавиатура и fallback ключей следуют ранее
согласованному Svelte Tabs; полный React Tabs API пока не перенесён.

Галерея — `/ant-design#card`, фикстура — `?fixture=card`; unit/SSR/Chromium
проверяют стили, слоты, Grid, загрузку/фокус и вкладки. Рецепт card извлекает
59 правил без keyframes. Компонентные темы отдельно сверяются с UMD 6.6.8 в
`tests/browser/card-theme.spec.ts`, фикстура — `?fixture=card-theme`.
Отсутствующие возможности Tabs остаются в полном объёме миграции.

## Collapse

```svelte
<script lang="ts">
  import { Collapse, Input, type CollapseActiveKey } from 'antd-svelte';

  let activeKey = $state<CollapseActiveKey>(['contacts']);
</script>

{#snippet contacts()}<label>Имя<Input defaultValue="Анна" /></label>{/snippet}
{#snippet preferences()}<p>Настройки участника.</p>{/snippet}

<Collapse
  aria-label="Анкета участника"
  bind:activeKey
  items={[
    { key: 'contacts', label: 'Контакты', children: contacts },
    { key: 'preferences', label: 'Настройки', children: preferences }
  ]}
/>
```

`items` принимает readonly-массив CollapseItem: необязательный строковый/числовой
key, label, children и extra (scalar, вложенный readonly-массив или Snippet),
collapsible, showArrow, forceRender и destroyOnHidden. Без key используется
строковый индекс; числа преобразуются в строки. Пустой ключ допустим; при повторении
используется первое вхождение. Ключ сохраняет экземпляр панели и фокус при
перестановке. Интерактивные элементы размещаются в extra или children; label
должен давать кнопке доступное имя и не содержать других controls.
Extra находится рядом с заголовком, вне кнопки раскрытия: его действия не
переключают панель. Id/class/style относятся к корневому контейнеру;
aria-label или aria-labelledby именует группу.

`bind:activeKey` принимает строку, число или readonly-массив таких ключей. Активация пользователем
сначала записывает в binding новый массив, затем вызывает onChange с отдельным
массивом; изменение массива callback не меняет значение владельца. Затем вызывается
item.onItemClick со строковым ключом. Ключи дедуплицируются с сохранением порядка активации. DefaultActiveKey читается при
создании; без начального значения все панели закрыты, в том числе в accordion.
Для binding задавайте начальное значение у владельца без defaultActiveKey.
Внешние изменения, defaults и переключение accordion не вызывают onChange.

Без accordion можно открыть несколько панелей. В accordion отображается только
первый запрошенный ключ; повторная активация закрывает его. Неизвестные ключи
сохраняются без подстановки другой панели и без перезаписи владельца. Отключение
accordion снова показывает остальные запрошенные панели. Удаление item не
удаляет его ключ из значения владельца. Пустой items показывает locale.emptyText.

Collapsible поддерживает header (вся кнопка заголовка), icon (только стрелка
для указателя) и disabled. Enter/Space активируют нативную кнопку и в режиме
icon. Значение item переопределяет общее, включая header поверх disabled.
ShowArrow=false скрывает стрелку; вместе с icon используется header, чтобы
сохранить доступную зону активации. Disabled запрещает переключение пользователем,
но не скрывает панель, открываемую владельцем. Collapse не наследует disabled
от Form/ConfigProvider; поля внутри получают собственный контекст.

Каждый заголовок содержит button type=button внутри heading. HeadingLevel
задаёт уровень 2–6 (по умолчанию 3); вложенному Collapse задавайте следующий
уровень. Aria-expanded/aria-controls связывают кнопку с содержимым. В accordion
и группах до шести items панели получают именованный role=region; в больших
группах без accordion лишние landmarks не создаются. Все доступные заголовки,
extra и поля обходятся обычным Tab; стрелки не перехватываются. Escape остаётся
содержащему Modal. При скрытии сфокусированного содержимого фокус возвращается
к его доступному заголовку. При удалении/disabled заголовка выбирается открытый
доступный заголовок, затем первый доступный либо сама группа. Изменения при
фокусе снаружи Collapse не перемещают его внутрь.

Содержимое впервые монтируется при открытии и по умолчанию сохраняет локальный
state и DOM-черновики в скрытой панели. DestroyOnHidden=true удаляет содержимое
при закрытии; отключение этой настройки не монтирует уже уничтоженную панель.
Значение item переопределяет общее, включая false. ForceRender=true монтирует
содержимое сразу и сохраняет его даже с destroyOnHidden. Удаление key уничтожает
панель; состояние вне неё сохраняется. Скрытые сохранённые панели остаются в DOM,
их таймеры и подписки продолжают работать. Поля посещённых/forceRender-панелей
участвуют в FormData даже при скрытии; ещё не смонтированных или уничтоженных
полей в FormData нет. Перед фокусом ошибки скрытой панели владелец формы должен
открыть её. Кнопки заголовков не отправляют окружающую форму.

Size использует small/medium/large и ConfigProvider.componentSize. Bordered=false
убирает внешнюю рамку, ghost — фон и разделители. ExpandIconPlacement задаёт
start/end относительно кнопки заголовка и направления RTL; extra остаётся
отдельным элементом после заголовка. ExpandIcon — Snippet с данными панели:
isActive, header, panelKey, prefixCls, исходными showArrow/collapsible/accordion
и объединёнными item slots. Его onItemClick переключает доступную панель и вызывает
root/item callbacks. Пользовательская стрелка не поворачивается автоматически.

ConfigProvider.collapse задаёт expandIcon, class/style и classNames/styles;
локальная стрелка приоритетнее контекстной. Вложенный явный record заменяет
родительский. Semantic object/function slots: root, header, title, body, icon.
Callback получает props с разрешёнными size, bordered и expandIconPlacement.
Root style: context slots → context style → local slots → local style; component
variables идут перед ними. Item slots добавляют classes и перекрывают styles.
Header slot применяется к нативной кнопке, body — к внутреннему содержимому;
extra остаётся вне кнопки. Item id/class/style и data/ARIA относятся к обёртке
панели, rootClassName — к корню. Bind:nativeElement и bind:ref получают HTMLDivElement
после mount и очищаются при unmount. Смена config/theme/prefix сохраняет панели и поля.

Theme.components.Collapse подключает все десять токенов: headerPadding/SM/LG,
headerBg, contentPadding/SM/LG, contentBg, borderlessContentPadding/Bg. Aliases,
component algorithm, cssVar prefix/key, dark и compact используют общий механизм
темы. Local prefixCls либо общий ConfigProvider prefix поддерживается CSS template
из того же закреплённого архива;
все 49 CSS rules воспроизводятся инструментом. Высота содержимого меняется сразу;
анимируется только стрелка, с учётом reduced motion.

Галерея `/ant-design#collapse` показывает анкету, вложенные панели, сохранение
черновиков, destroyOnHidden и независимую кнопку сброса в extra. Сброс примера
пересоздаёт поля с исходными значениями, сохраняя открытые внешние панели.
Item поддерживает headerClass, HTML attributes, native lowercase events и camelCase
aliases (включая Capture). Click/capture/bubble/stopPropagation/preventDefault,
focus/blur, key и mouse traces сверяются с оригиналом. События остаются native DOM:
React SyntheticEvent и его input/change normalization не создаются. Enter/Space
сохраняют порядок активации нативной кнопки, включая возможность отменить default.
Item.ref — callback с node после mount и null при замене ref или unmount; стабильный
callback не вызывается повторно из-за label updates. Он использует post-DOM lifecycle
Svelte; React RefObject не мутируется.

React-анимация высоты пока не перенесена. Native group, heading/button/region,
ARIA-связи, Space, full button hit area, независимость extra, focus recovery
и icon/showArrow fallback сохранены; это явные отличия от DOM React. Пустой custom
expandIcon Snippet сохраняет wrapper. Общий ConfigProvider.prefixCls поддержан;
React DEV diagnostics пока не поддерживаются.

## Carousel

Carousel переносит Ant Design 6.6.8 и @ant-design/react-slick 2.0.0 без React
runtime. Геометрия, клоны и переходы следуют исходному Slick. Публичные Props,
render snippets и refs описаны в [carousel.types.ts](../../../src/lib/carousel.types.ts).

```svelte
<script lang="ts">
  import { Carousel, type CarouselRef } from 'antd-svelte';

  let carousel = $state<CarouselRef>();
</script>

<Carousel arrows autoplay={{ dotDuration: true }} bind:ref={carousel}
  children={['Первый слайд', 'Второй слайд', 'Третий слайд']} />
<button type="button" onclick={() => carousel?.goTo(0)}>В начало</button>
```

Каждый элемент массива children — отдельный логический слайд. Один непрозрачный
snippet тоже образует один слайд: его внутренние DOM-узлы не разбираются.
Для нескольких snippets и метаданных используйте items: каждый элемент задаёт
children, class, attributes и width исходного child div. Items имеет приоритет
над children. Числовой width нужен для variableWidth, включая SSR; строки rows
и slidesPerRow группируются до создания клонов. Как в Slick, группировка заменяет
child style своими width/display; произвольный стиль содержимого задавайте внутри
snippet. Клоны создают независимые экземпляры snippets, поэтому их DOM ids должны
учитывать возможное повторение.

По умолчанию dots включены, arrows/draggable/autoplay/waitForAnimate выключены,
infinite включён, speed равен 500ms. Effect="fade" включает fade и один слайд на
страницу; centerMode устанавливает slidesToScroll=1. DotPlacement принимает
top/bottom/start/end.
Start/end включают vertical по умолчанию; явный vertical имеет приоритет.
Вертикальный режим отключает наследуемое зеркалирование RTL. В горизонтальном
RTL currentSlide зеркальный, но next/prev сохраняют исходное направление Slick.

InitialSlide задаёт начальную позицию и повторно применяется при изменении этого
prop или root RTL. Смена количества слайдов сама по себе его не применяет.
Как в Ant Design, RTL reset считает исходные children до rows grouping.
BeforeChange/afterChange сохраняют порядок и прерывание перехода; waitForAnimate
блокирует повторный переход. GoTo/next/prev откладываются на native timer, как
исходные методы. Ref появляется после mount, nativeElement указывает на внешний
div. InnerSlider предоставляет типизированные state/list/track и методы Slick;
это Svelte adapter, а не произвольный React class instance. В responsive unslick
innerSlider отсутствует, а методы Carousel ничего не переключают.

Autoplay использует интервал autoplaySpeed+50ms; duration dots — autoplaySpeed.
PauseOnHover/pauseOnDotsHover/pauseOnFocus сохраняют исходные состояния
playing/paused/hovered/focused. Focus pause относится к самому slick-slide,
а не к вложенному input. CSS-прогресс dots не останавливается вместе с JS autoplay.
LazyLoad поддерживает ondemand, anticipated и progressive с исходными индексами
onLazyLoad, включая клоны. AdaptiveHeight обновляется после измерений и image load.
Responsive регистрирует media listeners при mount и применяет breakpoint по
событию matchMedia; исходного принудительного применения при mount нет.

Клавиатура использует physical Left/Right и RTL, пропуская input/textarea/select.
Мышиный drag требует draggable; touch учитывает swipe/touchMove/touchThreshold,
edgeFriction и swipeToSlide. Controls — native button с type="button"; они не
отправляют форму. У arrows, dots и слайдов есть видимый keyboard focus. Отключённая
стрелка сохраняет исходные class/pointer semantics без добавления native disabled.
FocusOnSelect фокусирует прежний current DOM slide до commit, как react-slick.

PrevArrow/nextArrow получают class/style/onClick/currentSlide/slideCount;
customPaging — индекс и onClick, appendDots — default dots snippet и root props.
Пользовательский renderer явно применяет эти props к своим элементам.
ConfigProvider.carousel задаёт class/style внутреннего slick-slider; локальные
значения имеют приоритет. RootClassName/id относятся к внешнему wrapper.
Locale.carousel и исходный alias Carousel задают имена стрелок; локальный
Carousel имеет приоритет. Темы light/dark/compact и RTL используют общие CSS variables.

Локальный `prefixCls` задаёт wrapper, RTL/vertical classes и имена duration
keyframes; пустое значение наследует `ConfigProvider.prefixCls`. Классы Slick
сохраняются. Prefix вложенных Radio/Checkbox selectors берётся из общего provider,
независимо от локального имени Carousel и namespace theme variables. Смена prefix
сохраняет текущий слайд, DOM, ref, draft/selection/focus и управление стрелками.
Сверка: [официальные замеры](../../../tests/browser/fixtures/ant-design-carousel-prefix-reference.json),
[браузер](../../../tests/browser/carousel-prefix.spec.ts) и
[SSR](../../../tests/package/carousel-prefix.ssr.test.ts), `?fixture=carousel-prefix`.

ConfigProvider.theme.components.Carousel применяет семь компонентных токенов:
размеры и отступ стрелок, ширину/высоту/отступ/интервал точек и ширину активной
точки. Вертикальный режим меняет местами размеры точек по исходным правилам.
Поддержаны alias tokens, глобальные и компонентные algorithms, cssVar.prefix,
вложенные providers и реактивное обновление без пересоздания слайдов.
DotActiveWidth поддерживает явный 0; по умолчанию используется 24.
Тематические переменные задаются wrapper; пользовательские class/style и
ConfigProvider.carousel по-прежнему относятся к inner slider и сохраняют приоритет.
Сверка: [официальные CSS tokens](../../../tools/fixtures/ant-design-carousel-tokens-reference.json),
[геометрия четырёх размещений](../../../tests/browser/fixtures/ant-design-carousel-theme-reference.json),
[SSR](../../../tests/package/carousel-theme.ssr.test.ts) и
[browser](../../../tests/browser/carousel-theme.spec.ts), `?fixture=carousel-theme`.

SSR выводит исходную процентную либо variable-width геометрию и lazy placeholders
без DOM, callbacks, timers или media queries. При уничтожении очищаются timers,
ResizeObserver, image/focus/touch/media listeners и refs; поздние callbacks не
вызываются. React development diagnostics и устаревшие IE fallbacks не воспроизводятся.

Проверки: [engine](../../../src/lib/carousel.engine.test.ts),
[public package SSR](../../../tests/package/carousel.ssr.test.ts),
[browser](../../../tests/browser/carousel.spec.ts) и `?fixture=carousel`.
[CSS](../../../src/lib/vendor/carousel.css) воспроизводится рецептом: 58 правил и два
keyframes. Перенесённая логика снабжена [MIT react-slick](../../../src/lib/vendor/LICENSE.react-slick),
стили — существующей [MIT Ant Design](../../../src/lib/vendor/LICENSE.ant-design).

## Listy

Listy переносит Ant Design 6.6.8, @rc-component/listy 1.2.3 и
@rc-component/virtual-list 1.5.1. Последняя версия удовлетворяет runtime range
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

## Tree

Tree переносит Ant Design 6.6.8 и @rc-component/tree 1.4.0. Чистые engines отвечают
за flatten/родителей, исходную checkbox conduction и async load lifecycle.
React/rc-tree runtime не устанавливаются; лицензия сохранена в vendor/LICENSE.rc-tree.
CSS-рецепт извлекает 99 правил, включая collapse motion, и keyframe drag feedback
из закреплённого antd.css, исключая TreeSelect. Иконки соответствуют @ant-design/icons-svg 4.6.0.

```svelte
<script lang="ts">
  import { Tree, type TreeKey, type TreeCheckedKeys } from 'antd-svelte';
  const nodes = [{key:'docs',title:'Документы',children:[{key:'intro',title:'Введение'}]}];
  let expanded = $state<TreeKey[]>(['docs']);
  let checked = $state<TreeKey[] | TreeCheckedKeys>([]);
</script>
<Tree treeData={nodes} aria-label="Документы" checkable expandedKeys={expanded}
  checkedKeys={checked} onExpand={keys => { expanded = keys; }}
  onCheck={keys => { checked = keys; }} />
```

TreeData — массив узлов со стабильным уникальным key (string/number/bigint), title
(текст, число, пустое содержимое, массив или snippet) и children. Ключи должны быть уникальны и
после String(key), как в upstream entity index. Поддержаны disabled,
disableCheckbox, checkable, selectable, isLeaf, icon и локальные class/style.
ExpandedKeys/selectedKeys/checkedKeys/loadedKeys — controlled props; default-пары
инициализируют внутреннее состояние. Владелец может отклонить callback. Массивы
ключей и treeData обновляются новым значением, как в исходном controlled API.

DefaultExpandParent=true раскрывает родителей начальных expanded keys до disabled
границы. AutoExpandParent=false по умолчанию; true повторяет раскрытие родителей
при изменении controlled keys. Чтобы разрешить сворачивание предка при сохранённом
ключе потомка, отключите autoExpandParent. DefaultExpandAll применяется только
при инициализации к узлам с детьми; данные, поступившие позже, сами по себе не
расширяют этот начальный набор.

Выбор строки независим от checkbox. Multiple переключает отдельные ключи без
обязательного Ctrl и не добавляет range selection. Selectable=false переводит
клик заголовка на отметку. Node.selectable перекрывает tree selectable. В обычном
checkable-режиме отметки распространяются вниз и вверх; disabled,
disableCheckbox и checkable=false останавливают conduction. Disabled-потомки
не мешают полноте отметки разрешённого родителя. Снятие отметки использует исходный
fill/clean algorithm; дети, добавленные в отмеченного родителя, получают отметку.
CheckStrictly=true разрывает связи и onCheck возвращает {checked,halfChecked}.
Без него onCheck возвращает массив и info.halfCheckedKeys/checkedNodesPositions.
CheckedKeys в strict режиме принимает также объект с halfChecked.

OnExpand(keys,{expanded,node,nativeEvent}), onSelect(keys,{event,selected,node,
selectedNodes,nativeEvent}), onCheck(keys,{event,checked,node,checkedNodes,...})
сохраняют отдельные события. Node включает исходные данные, pos и flags
expanded/selected/checked/halfChecked/loaded/loading/active. Mouse callback содержит
нативный event; keyboard callbacks соответствуют внутреннему пути rc-tree и могут
не иметь nativeEvent. Дополнительно поддержаны onClick/onDoubleClick/onRightClick
и onActiveChange. Состояние node в callback относится к узлу до действия.

`expandAction` включает раскрытие заголовком: false по умолчанию, 'click' или
'doubleClick'. Ctrl/Meta/Shift оставляют выбор без раскрытия. При click-expansion
onExpand предшествует onClick и последующему onSelect/onCheck; флаги node остаются
снимком до действия, даже если callback синхронно обновил controlled selection.
Заголовок может свернуть pending-ветку; прежний pointer switcher ждёт загрузку.
Title action проверяет исходный isLeaf: узел без детей сохраняет expanded keys,
чтобы показать детей после обновления данных, и обрабатывает действие при поиске.
Смена expandAction сохраняет DOM, выбранные ключи и внешний draft/focus/selection.
[22 исходных случая](../../../tests/browser/fixtures/ant-design-tree-expand-action-reference.json),
[counterpart с завершёнными переходами](../../../tests/browser/fixtures/ant-design-tree-expand-action-settled-reference.json),
[browser](../../../tests/browser/tree-expand-action.spec.ts) и
[SSR](../../../tests/package/tree-expand-action.ssr.test.ts) проверяют эти границы.

В rc-tree 1.4.0 быстрый двойной клик с expandAction='click' может свернуть узел,
оставив только первый onExpand(expanded=true): предварительное обновление keys
обходит guard listChanging. Raw observation сохранён в случае click-double.
Native сообщает каждый фактический переход, как Source при двух завершённых
кликах. Полный list motion остаётся отдельным неперенесённым объёмом.

LoadData(node) возвращает PromiseLike. Дети добавляются потребителем в treeData;
компонент их не выдумывает. Loading дедуплицируется по ключу; pointer switcher ждёт завершения загрузки,
но клавиатура позволяет свернуть pending-ветку. OnLoad(keys,{event:'load',
node}) вызывается до внутреннего обновления loadedKeys. При controlled loadedKeys
владелец принимает новый набор сам. Загрузка запускается и для изначально раскрытой
видимой незагруженной ветки. Узел с уже имеющимися детьми не загружается повторно;
isLeaf=true запрещает загрузку, isLeaf=false сохраняет switcher даже у пустой
загруженной ветки. Rejection снимает loading и сворачивает uncontrolled ветку,
не вызывая onLoad; повторное раскрытие позволяет retry. После 10 неудачных попыток
загрузка прекращается, ключ помечается загруженным без успешного onLoad. Отдельного
onError/публичного error-state в исходном Tree нет: обработка ошибки остаётся в
loadData потребителя. Результаты после unmount не меняют состояние и callbacks.

Клавиатура использует один tab stop на role=tree и aria-activedescendant. Up/Down
перемещаются циклически по видимым строкам, Home/End — к краям. Left сворачивает
либо переходит к родителю, Right раскрывает либо переходит к первому ребёнку;
эти действия не инвертируются в RTL, как в rc-tree. Enter раскрывает ветку либо
однократно выбирает/отмечает лист; Space переключает отметку, а без checkable —
выбор. Disabled-строки остаются в навигации. Disabled блокирует выбор/отметки,
но switcher допускает раскрытие мышью, как upstream; global disabled отключает
клавиатурную обработку. Native buttons имеют tabindex=-1; роли treeitem/checkbox
и level/posinset/setsize отражают логическое дерево. Bind:nativeElement даёт root;
bind:this предоставляет focus(options)/blur()/scrollTo(config).

BlockNode, showLine и showLine={{showLeafIcon:true}}, showIcon, icon,
switcherIcon/switcherLoadingIcon, titleRender и filterTreeNode поддержаны.
Иконки и заголовки задаются snippets с node-аргументом; filterTreeNode подсвечивает
узел и не удаляет его из дерева. RU/EN подписи switcher берутся из Locale.tree;
темы, compact, RTL, ConfigProvider/Form disabled наследуют существующие контексты.
Height ограничивает viewport и включает виртуальное окно. Без height либо при
height=0 выводятся все раскрытые строки без ограничения высоты, как в Source.
Virtual=false оставляет native scroll со всеми строками. Undefined наследует
ConfigProvider.virtual; по умолчанию Tree включает виртуализацию, Listy — выключает.
SSR использует начальную оценку окна без DOM-измерений, загрузки и timers.

Оценка строки следует Tree tokens: paddingXS/2 + (titleHeight || controlHeightSM).
ItemHeight переопределяет её; itemHeight=0 отключает виртуальное окно. После mount
измеряются реальные строки с margins, cache сохраняется по ключам до unmount.
Границы окна и overscan следуют virtual-list 1.5.1. ScrollWidth включает
горизонтальную прокрутку, включая fitting dataset; колесо, Shift+wheel, touch,
перетаскивание и клики scrollbar поддерживают обе оси и RTL.

```svelte
<script lang="ts">
  import { Tree, type TreeRef } from 'antd-svelte';

  const nodes = Array.from({ length: 100 }, (_, key) => ({ key, title: `Node ${key}` }));
  let tree = $state<TreeRef>();
</script>

<Tree treeData={nodes} height={240} bind:this={tree} aria-label="Nodes" />
<button onclick={() => tree?.scrollTo({ key: 80, align: 'top', offset: 8 })}>Show node</button>
```

ScrollTo принимает число, {top,left}, key либо index с align='top'/'bottom'/'auto'.
Left — неотрицательная логическая позиция и в RTL. Offset бывает числом или
функцией ({getSize,align}) => number; getSize(startKey,endKey?) читает измеренные
либо оценённые top/bottom, неизвестный endKey даёт bottom=undefined. NaN/Infinity
offset заменяются нулём. Измерение и выравнивание повторяются до десяти проходов;
более поздний запрос отменяет предыдущий. Неизвестный key сохраняет позицию.
Null/undefined показывают scrollbar. AutoExpand у key-запроса добавляет только
целевой ключ в uncontrolled expandedKeys, без раскрытия предков или onExpand.
ItemScrollOffset задаёт отступ автоматической прокрутки активного узла.
OnScroll (либо native onscroll) получает событие holder; root ref остаётся прежним.
DirectoryTree предоставляет те же методы. Загрузка изначально раскрытых узлов
начинается при их попадании в смонтированное окно; результаты после unmount игнорируются.

Шесть ошибок Source сохранены как raw observations и не переносятся: stale estimate
при смене itemHeight/theme, потеря active key=0, ссылка aria-activedescendant на
отсутствующий DOM, local virtual=undefined поверх global false и пропущенный
direction в rc-tree NodeList, отрицательный offset при scrollWidth меньше viewport.
Native ограничивает offset снизу нулём, обновляет оценку без клонирования data,
сохраняет key=0, валидный ARIA target, наследование и направление обеих осей.
[28 исходных browser случаев, 12 SSR и шесть наблюдений](../../../tests/browser/fixtures/ant-design-tree-virtual-reference.json),
[Source browser](../../../tests/browser/tree-virtual.spec.ts),
[Native browser](../../../tests/browser/tree-virtual-native.spec.ts) и
[SSR](../../../tests/package/tree-virtual.ssr.test.ts) проверяют эти границы.

Tree и DirectoryTree выводят тип пользовательской записи из `treeData`.
`fieldNames={{ key: 'id', title: 'caption', children: 'items' }}` задаёт имена полей;
пустые имена используют стандартные key/title/children. Поля с прежними именами
не подменяют выбранную схему. Настройка действует на раскрытие, leaf state,
conduction, lazy load, renderers и диапазоны DirectoryTree.

```svelte
<script lang="ts">
  import { Tree } from 'antd-svelte';

  interface Entry {
    id: number;
    caption: string;
    priority: number;
    items?: Entry[];
  }
  const entries: Entry[] = [{ id: 0, caption: 'Документ', priority: 2 }];
</script>

<Tree treeData={entries} fieldNames={{ key: 'id', title: 'caption', children: 'items' }}
  onSelect={(_keys, info) => console.log(info.node.priority, info.selectedNodes)} />
```

`TreeProps<Data>`, `DirectoryTreeProps<Data>`, `TreeEventNode<Data>` и
`TreeCheckInfo<Data>` сохраняют тип payload, включая discriminated unions;
`TreeFieldDataNode<Payload, ChildName>`
помогает объявить рекурсивные записи с общими flags и snippets. `info.node` содержит
исходные поля, но canonical key и state flags перекрываются состоянием дерева.
`selectedNodes`, `checkedNodes` и позиции отметок сохраняют исходные объекты,
включая прежний raw key. `titleRender` получает исходную запись; snippet в самом
поле title имеет приоритет над общим renderer, как в Source. При titleRender
поле заголовка может содержать произвольный payload, который читает этот snippet.

Новые ссылки на `treeData` или `fieldNames` обновляют индекс без замены компонента.
Смена только fieldNames также обновляет заголовки и дочерние поля. Это исправляет
явную ошибку cache в rc-tree 1.4.0: Source оставляет старые flatten entities до
замены treeData. Raw observation сохранено вместе с публичным Source counterpart,
который обновляет оба props. Существующие keys, DOM/ref и active IDs сохраняются.
[27 raw UMD сценариев и наблюдение](../../../tests/browser/fixtures/ant-design-tree-fields-reference.json),
[browser](../../../tests/browser/tree-fields.spec.ts),
[SSR](../../../tests/package/tree-fields.ssr.test.ts) и
[типизированные записи](../../../tests/browser/fixtures/TreeGenericFields.svelte) проверяют
aliases, исходные объекты, strict/conduction, lazy load, controlled keys, snippets,
DirectoryTree, RTL/prefix и смену схемы.

`TreeDataNode.switcherIcon` задаёт switcher конкретного узла, включая лист,
и имеет приоритет над общим renderer, линиями и loading icon. Общий
`switcherIcon` применяется к веткам после loading; `showLine.showLeafIcon`
принимает также snippet. Рендереры получают вычисленный `isLeaf`; пустой snippet
оставляет существующий native switcher без содержимого. Snippets сохраняют своё
содержимое и классы вместо клонирования React elements.
`onMouseEnter`/`onMouseLeave` получают `{event,node}` при входе/уходе с содержимого
строки, включая disabled. Наведение на switcher не является событием содержимого.
Node в событии сохраняет исходный `isLeaf` и актуальные selected/expanded/loading;
вычисленный флаг рендерера не подменяет исходные данные.
После unmount hover callbacks не вызываются, даже если потребитель удерживает
удалённый DOM-узел и отправляет ему событие.
[14 raw UMD сценариев](../../../tests/browser/fixtures/ant-design-tree-node-renderers-reference.json),
[browser](../../../tests/browser/tree-node-renderers.spec.ts) и
[SSR](../../../tests/package/tree-node-renderers.ssr.test.ts) проверяют приоритеты,
текст/элементы/пустое содержимое, центрирование switcher, pending load, hover,
RTL/prefix и DirectoryTree. Сброс native button styles сохраняет исходный
`text-align: center` у switcher; наследуемое выравнивание остаётся у содержимого строки.

`prefixCls` меняет namespace дерева, nodes, checkbox, switcher и линий; пустая
строка наследует ConfigProvider.prefixCls. Canonical Tree tokens и generated IDs
сохранены; общий Row selector независим от local prefix. Шаблон tree-prefix
воспроизводит 98 исходных правил с изоляцией root/RTL/line scopes.
[Raw замеры](../../../tests/browser/fixtures/ant-design-tree-prefix-reference.json)
отделены от public root-style и readonly-selection counterparts. Прежний Native
Tree сохраняет заданный selection при selectable=false; React при initial render
его отбрасывает. Отдельный public вариант запрещает selection на каждом узле.
Смена prefix сохраняет DOM/ref, active descendant, focus, checked/selected state
и pending load. Внутренний TreeSelect пока использует canonical Tree namespace
своего существующего CSS-адаптера; его собственный prefix API переносится отдельно.

`ConfigProvider.theme.components.Tree` подключён к общему механизму компонентной
темы: метрики title/switcher/indent, hover/selected colors, alias overrides,
global/component algorithms и custom cssVar prefix. Локальные CSS variables и
`style` сохраняют приоритет. DirectoryTree использует те же настройки и отдельные
directoryNodeSelectedBg/directoryNodeSelectedColor. Внутреннее дерево
TreeSelect использует тему Select/TreeSelect, независимо от `components.Tree`.
Отдельный UMD-замер проверяет одновременные конфликтующие настройки трёх компонентов.

Сохранён прежний native contract: `Tree.style` оформляет внешний корень. В React
этот prop относится к внутреннему `.ant-tree-list`; исходные замеры обоих слоёв
сохранены в [UMD-эталоне](../../../tests/browser/fixtures/ant-design-tree-theme-reference.json).
Сверка видимого содержимого охватывает 14 тем / 112 наборов CSS-измерений, включая
checkbox, disabled/selected/active nodes, RTL и nested/reset/sibling scopes.
[Browser-проверки](../../../tests/browser/tree-theme.spec.ts) также подтверждают сохранение
DOM, фокуса, active descendant, отметок и pending load при обновлении токенов;
[SSR-проверки](../../../tests/package/tree-theme.ssr.test.ts) не запускают загрузку или
браузерные ресурсы. Декларации сверяются с официальным UMD отдельным
[unit-набором](../../../src/lib/theme-tree-tokens-reference.test.ts).

`classNames` и `styles` настраивают пять частей: root, item, itemIcon, itemTitle
и itemSwitcher. Они принимают объект или `({props}) => slots`; props сохраняют
тип данных и входные Native props. Подставляются defaults Ant wrapper для
showIcon/blockNode/checkable/selectable/disabled, остальные внутренние defaults
дерева не подменяют отсутствующие входные значения. Общий `ConfigProvider.tree`
принимает class/style и те же semantic slots. Отсутствующий record наследуется,
любой собственный объект, включая `{}`, заменяет родительский целиком.

```svelte
<ConfigProvider tree={{ styles: { itemTitle: 'font-weight:600' } }}>
  <Tree treeData={nodes} classNames={{ item: 'document-row' }}
    styles={({ props }) => ({ itemSwitcher: props.disabled ? 'opacity:0.5' : undefined })} />
</ConfigProvider>
```

Классы provider и local накапливаются. Внешний root использует слои
provider styles.root → provider style → local styles.root → local style после
theme variables. Прежний `Tree.style` остаётся на внешнем корне; `tree.style`
следует той же Native границе. В React обычные style/context style относятся к
inner list. Raw наблюдения и публичные Source counterparts через styles.root
сохранены отдельно; это отличие не выдаётся за одинаковую структуру.
На строке `styles.item` перекрывает node.style, как Source. Switcher slots
действуют также на листья; itemIcon существует у pending загрузки при showIcon=false.
TreeSelect сохраняет собственную конфигурацию внутреннего дерева и не читает tree record.

Смена slots сохраняет DOM/ref, выбор и active IDs, фокус и pending load.
Native обновляет также default icon: rc-tree 1.4.0 ошибочно кэширует прежние
itemIcon classes/styles при их изменении без смены prefix/expanded/loading.
Исходный stale-cache сохранён отдельно; корректный Source counterpart использует
публичный custom icon. Ошибка не переносится. Snippets остаются непрозрачным
Svelte-содержимым; CSS относится к существующим wrappers.
[18 Source случаев и три raw наблюдения](../../../tests/browser/fixtures/ant-design-tree-semantic-reference.json),
[browser](../../../tests/browser/tree-semantic.spec.ts) и
[SSR](../../../tests/package/tree-semantic.ssr.test.ts) проверяют slots, callbacks/defaults,
nested/reset/replaced/sibling scopes, DirectoryTree, prefix/RTL, style priorities
и обновления, включая pending loading и независимый TreeSelect.

Deprecated `TreeNode` children не входят в перенос: rc-tree 1.4.0 прямо помечает
`Tree.children` как deprecated и предлагает `treeData`.

### Collapse motion

`motion` принимает Native CSSMotion config или `false`. Undefined/null выбирают
исходный Ant collapse object: `${rootPrefixCls}-motion-collapse`, измеряемые
height/opacity и deadline 500 ms. Пустой объект отключает CSS phases, сохраняя
самостоятельный custom config. Semantic callbacks получают этот итоговый object;
пользовательский config сохраняет identity.

Начальные defaultExpandedKeys/expandedKeys и SSR не анимируются. При изменении
одного expanded key его видимые потомки временно переходят в motion group:
раскрытие использует `appear`, сворачивание — `leave`. Tree перезаписывает
motionAppear по направлению перехода; custom `motionAppear: false` не отключает
раскрытие. При нескольких изменённых keys список обновляется сразу.

`motionName` поддерживает строку и object с именами фаз. Prepare hooks могут
возвращать Promise; start/active hooks получают DOM группы и event=null и
возвращают CSS-строку. End hooks получают нативный transition/animation event
или `{deadline:true}`; false оставляет группу активной. Default collapse игнорирует
opacity end и завершается по height либо deadline. События потомков не завершают
группу. Ant Tree удерживает собственный onVisibleChanged; этот унаследованный
callback, React children/internalRef не добавлены в Svelte API.

`theme.token.motion=false` отключает CSS phases, но сохраняет prepare. Native
также учитывает prefers-reduced-motion и его изменение во время перехода.
Другие expand действия ждут окончания motion; selection/check остаются доступны.
Смена данных, motion=false, завершение drag и unmount очищают удержанную группу
и отменяют старые RAF, prepare completions, deadlines и DOM listeners.

При virtual list группа содержит первые ceil(height/itemHeight)+1 потомков;
сам virtual placeholder сохраняет исходную оценку itemHeight. Virtual=false или
отсутствие height сохраняют весь диапазон. Соседние keyed строки, tree-root,
refs и opaque controls вне диапазона сохраняют DOM. Узлы самого диапазона
монтируются в группе и затем возвращаются в плоский список, как Source.
TreeSelect сохраняет прежнее самостоятельное управление раскрытием.

[23 Source сценария и raw наблюдение](../../../tests/browser/fixtures/ant-design-tree-motion-reference.json),
[12 SSR вариантов](../../../tests/browser/fixtures/ant-design-tree-motion-ssr-reference.json),
[engine](../../../src/lib/tree-motion.engine.test.ts),
[lifecycle](../../../src/lib/tree-motion.dom.test.ts),
[browser](../../../tests/browser/tree-motion.spec.ts),
[Native browser](../../../tests/browser/tree-motion-native.spec.ts) и
[SSR](../../../tests/package/tree-motion.ssr.test.ts) проверяют фазы, callbacks,
измерения, virtual, generic aliases/zero/bigint, prefix/RTL, темы и cleanup.
Ошибка rc-tree1.4.0 со скрытым expanded key сохранена в raw reference: пустой
motion range блокирует видимые ветки до deadline. Native пропускает пустые
и невидимые диапазоны, сохраняя доступное раскрытие.

### Drag/drop

`draggable` включает HTML5 drag/drop в Tree и DirectoryTree. Принимаются boolean,
predicate исходного data-узла или `{ nodeDraggable, icon }`. Predicate=false
отключает и начало drag, и drop handlers строки, как в Source. По умолчанию
показывается Holder icon; `icon: false` убирает handle, snippet заменяет его
содержимое, включая пустой результат. Интерактивное содержимое handle сохраняет
свои DOM controls и фокус. Клик обычного handle возвращает фокус tree-root;
draggable строки имеют tabindex=-1 и не добавляют tree tab stops.

`allowDrop({ dragNode, dropNode, dropPosition })` получает исходные data-объекты
и относительную позицию -1/0/1. Позиция зависит от вертикальной половины
event.target, горизонтального смещения, раскрытых веток и indent; поддержаны
переходы между уровнями, RTL и виртуальные окна. Disabled запрещает начать drag,
но сам по себе не исключает drop target: при необходимости проверяйте
`dropNode.disabled` в allowDrop. Индикатор фиксирован Ant wrapper, который также
перезаписывает унаследованный rc `dropIndicatorRender`.

`onDragStart`, `onDragEnter`, `onDragOver`, `onDragLeave` и `onDragEnd` получают
`{event,node}` с нативным DragEvent и canonical key/state. OnDragEnter добавляет
expandedKeys до отложенного раскрытия. Через 800 ms приходит onExpand с
expanded=true; key добавляется при наличии детей. Для листа набор может остаться
прежним; hover сам по себе не загружает lazy children. Uncontrolled Tree сворачивает
source при dragstart без onExpand; DirectoryTree сохраняет своё управление
expandedKeys и не сворачивает source этим действием.

`onDrop` добавляет dragNode, dragNodesKeys, dropToGap и dropPosition. Последний
равен sibling index dropNode плюс -1/0/1. DropNode может быть предком строки,
над которой находится индикатор; dragOver flags относятся к строке индикатора.
DragNode сохраняет state начала drag и исходную data-ссылку: изменения свойств
этого объекта видны onDrop, а замена узла новым объектом не меняет сохранённую
ссылку. DragNodesKeys содержит source и всех его потомков на начало drag,
включая свёрнутые ветки. Перестановка treeData остаётся у потребителя;
проверки не меняют выбор, checkbox, native refs и существующую клавиатуру.

[38 независимых Source сценариев и шесть raw наблюдений](../../../tests/browser/fixtures/ant-design-tree-drag-reference.json),
[12 Source SSR вариантов без DOM](../../../tests/browser/fixtures/ant-design-tree-drag-ssr-reference.json),
[engine](../../../src/lib/tree-drag.engine.test.ts),
[SSR](../../../tests/package/tree-drag.ssr.test.ts) и
[browser](../../../tests/browser/tree-drag.spec.ts) фиксируют геометрию, snapshots,
defaults, controlled keys, generic data/fieldNames, icons, prefix/RTL и lifecycle.
[Native проверки](../../../tests/browser/tree-drag-native.spec.ts) включают реальные
mouse drags, виртуальную прокрутку, смену данных и сохранение фокуса/DOM.
Ошибки rc-tree1.4.0 не воспроизводятся:

- allowDrop проверяется перед drop; запрет в dragover очищает прежний target.
- Проверяется текущее дерево потомков, включая добавленных после dragstart.
- Оконный dragend сохраняет source node, даже когда его DOM вышел из окна.
- Unmount отменяет таймер раскрытия и listeners; поздних callbacks нет.
- Drop container сохраняет key=0, а handle обновляет namespace при смене prefix.

### Data utilities

`createTree` соответствует React `Tree.useTree`. Модель предоставляет стабильный
`getPath(key)`: массив entities от корня до найденного узла включительно.
Entity содержит `key`, `pos`, `level`, `index`, исходный `node`, путь исходных
объектов `nodes`, `parent` и `children` при наличии потомков. Lookup по string,
number и bigint использует исходное строковое сопоставление ключей.

```svelte
<script lang="ts">
  import { createTree, type TreeFieldNames } from 'antd-svelte';

  interface Item {
    id: string;
    caption: string;
    items?: Item[];
  }
  let items = $state.raw<Item[]>([{ id: 'root', caption: 'Корень', items: [
    { id: 'leaf', caption: 'Лист' }
  ] }]);
  let fields = $state<TreeFieldNames>({ key: 'id', title: 'caption', children: 'items' });
  const model = createTree(() => items, { get fieldNames() { return fields; } });
  let path = $derived(model.getPath('leaf').map(entity => entity.key));
</script>

<output>{path.join(' / ')}</output>
```

Getter data и getter `config.fieldNames` читаются при каждом lookup; новая ссылка
на data или schema перестраивает индекс. Для изменений используйте новый массив
и новый объект fieldNames. Сохранённая функция `getPath` читает актуальные inputs,
включая вызов через `$derived`. Статический массив также принимается.
Модель работает без DOM, effects и timers, в том числе при SSR. Generic payload
и identity исходных объектов сохраняются; title не переименовывается в raw node.
UI-компоненты Tree/DirectoryTree принимают ту же схему полей через prop fieldNames;
модель передаёт её отдельно через config.

[Исходный UMD-эталон](../../../tests/browser/fixtures/ant-design-tree-data-model-reference.json)
фиксирует entities, aliases, positional fallback и обновления data/schema.
Неизвестный ключ возвращает `[]`. Это исправляет явную ошибку rc-tree 1.4.0:
lookup отсутствующих constructor/__proto__/toString читает plain object prototype
и возвращает function/Object.prototype вместо DataEntity. Исходное наблюдение
сохранено; реальные data keys с такими именами поддерживаются.
[Unit](../../../src/lib/tree-data-model.test.ts),
[browser](../../../tests/browser/tree-data-model.spec.ts) и
[package/SSR](../../../tests/package/tree-data-model.ssr.test.ts) проверяют модель.

### DirectoryTree

Отдельный экспорт `DirectoryTree` соответствует React `Tree.DirectoryTree` и
использует существующий Tree. По умолчанию `expandAction='click'`, `showIcon=true`
и `blockNode=true`; эти props можно переопределить. Лист получает file icon,
ветка — закрытую или открытую папку. Snippet `icon` заменяет стандартную иконку.

```svelte
<script lang="ts">
  import { DirectoryTree } from 'antd-svelte';

  const nodes = [{ key: 'docs', title: 'Документы', children: [
    { key: 'intro', title: 'Введение', isLeaf: true },
    { key: 'api', title: 'API', isLeaf: true }
  ] }];
</script>

<DirectoryTree treeData={nodes} multiple defaultExpandAll aria-label="Файлы" />
```

Обычный клик выбирает только строку и не снимает её выбор повторным кликом.
При `multiple` Ctrl/Meta переключает отдельный ключ, Shift добавляет диапазон
между текущей строкой и последним обычным/Ctrl/Meta выбором. Диапазон идёт по
видимому дереву, не включает скрытых потомков и пропускает промежуточные
disabled/nonselectable узлы. Первый Shift без такого выбора не создаёт диапазон.
`onSelect` сообщает `selected=true`, включая снятие ключа через Ctrl/Meta;
`selectedNodes` содержит исходные узлы в порядке полного дерева.

Controlled/default keys и `defaultExpandParent` сохраняют Tree-контракты.
В отличие от обычного Tree, DirectoryTree при `defaultExpandAll` включает
в начальный набор также ключи листьев, как upstream. Lazy load, checkbox,
клавиатура, темы Tree, RTL, prefix, focus/blur/scrollTo и `bind:nativeElement` используют
существующий компонент. Расширенные неперенесённые Tree API перечислены выше.

[Пятнадцать исходных сценариев](../../../tests/browser/fixtures/ant-design-directory-tree-reference.json)
сверяют выбор/диапазоны, callbacks, раскрытие, иконки и directory tokens.
[Browser](../../../tests/browser/directory-tree.spec.ts) и
[SSR](../../../tests/package/directory-tree.ssr.test.ts) проверяют Svelte-реализацию.
При снятии controlled-режима сохраняются последние принятые ключи. Это намеренное
исправление: Ant Design 6.6.8 / rc-tree 1.4.0 после такого перехода теряет
безопасные массивы, и следующий Shift-клик падает на `undefined.includes`.
[Оба исходных наблюдения](../../../tests/browser/fixtures/ant-design-directory-tree-control-release-observation.json)
сохранены отдельно; ошибка не переносится в Svelte.

## Timeline

Timeline использует общий renderer Steps с type=dot, как Ant Design 6.6.8.
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

## Tag, CheckableTag и CheckableTagGroup

```svelte
<script lang="ts">
  import { CheckableTag, ConfigProvider, Tag } from 'antd-svelte';
  let checked = $state(false);
</script>

<Tag color="success" variant="outlined">Готово</Tag>
<Tag closeIcon closeLabel="Удалить обязательную метку"
  onClose={event => event.preventDefault()}>Обязательная метка</Tag>
<Tag href="#tag-help" closable>Ссылка с закрытием</Tag>
<CheckableTag {checked} onChange={value => { checked = value; }}>
  Показывать готовые задачи
</CheckableTag>

<ConfigProvider tag={{ variant: 'outlined', style: 'letter-spacing:1px' }}>
  <Tag color="#2db7f5" styles={{ root: 'font-weight:600' }}>CSS color</Tag>
</ConfigProvider>
```

Tag показывает метку с обязательным children Snippet. Icon и пользовательский
closeIcon принимают Snippet; closeIcon также принимает текст и числа.
Содержимое — короткая phrasing-разметка
без вложенных controls, кроме ссылки. Иконки декоративные, aria-hidden/inert.
Без непустого href корень — span и Tag не создаёт остановок Tab или live-region.
Именование через aria-label/aria-labelledby добавляет span роль group; переданный
role имеет приоритет. Непустой href выбирает native anchor с target и естественным
Tab/Enter. Disabled оставляет anchor, убирает href и добавляет aria-disabled.
Закрытие ссылки предотвращает навигацию; отмена закрытия сохраняет её содержимое.
У ссылки в children сохраняется собственный href; disabled Tag меняет её стиль
и pointer-events, как upstream.

HTMLAttributes, data-/aria-атрибуты и нативные события относятся к корню; локальный
dir имеет приоритет над context. Bind:nativeElement даёт текущий span/anchor,
обновляется при смене типа корня и очищается при закрытии/unmount. В SSR ref пуст.
Hydration сохраняет существующий DOM и фокус. Явные a/span branches избегают
повторной вставки корня, которая сбрасывает фокус дочерней кнопки.

OnClick/onclick получают нативный click корневого span; onclick имеет приоритет.
Callback или единственная прямая ссылка включают [Wave](../wave.md).
Закрытие сохраняет stopPropagation и не вызывает onClick метки.

Variant: filled (по умолчанию), outlined, solid. Прежний default class сохраняется;
semantic callbacks получают исходный undefined color, кроме default для solid.
Статусы — success/processing/error/default/warning. Предустановленные цвета:
blue/purple/cyan/green/magenta/pink/red/orange/yellow/volcano/geekblue/lime/gold.
Pink и magenta используют соответствующие токены Ant Design. Статусный цвет не добавляет
role=status и не запускает анимацию/объявление. TagColor, TagPresetColor,
TagStatusColor и TagVariant экспортируются через index.ts.

Color также принимает CSS-строки. Solid задаёт background-color; filled и outlined
вычисляют светлый фон через исходный FastColor/HSL с lightness 0.95, сохраняя alpha.
Outlined добавляет border-color. CSS variables используются как исходная строка
foreground/border; FastColor не вычисляет их значение. Disabled убирает рассчитанные
цвета, но сохраняет явно переданные styles/style.

Приоритет variant: локальный prop, ConfigProvider.tag.variant, затем filled.

ConfigProvider.tag наследуется при отсутствии; явный объект, включая {}, заменяет
родительский record. Поддерживаются class, style, variant, classNames, styles,
closable и closeIcon.
TagSlots/TagSemantic задают root, icon, content и close строками CSS или classes;
callback получает props с разрешёнными color, variant и disabled. Root styles:
рассчитанный CSS-цвет, context styles.root, context style, local styles.root, local style.
RootClassName дополняет class. Изменения shorthand/longhand повторяют style diff
upstream; CSS-строки сохраняют нативный приоритет !important.

Icon styles/classes применяются к существующей декоративной wrapper-границе Snippet,
close — к нативной кнопке. Content semantic slot действует при наличии icon, как
upstream; прежняя private content-обёртка и описание кнопки закрытия сохраняются.
CheckableTag читает только context class/style и локальный style имеет приоритет;
semantic настройки и variant Tag к нему не применяются.

Без local/context close config кнопка скрыта. CloseIcon=true включает default Icon
close; текст/число и Snippet заменяют изображение внутри той же нативной кнопки.
Пустая строка и 0 сохраняют control. Отсутствие props наследует context;
closable=false скрывает кнопку независимо от icon. CloseIcon=false/null скрывает её,
если closable не включён. Явный closable=true сохраняет inherited icon или default.

Closable принимает также object config с closeIcon и ARIA-атрибутами. В этом объекте
closeIcon=null убирает control, а boolean оставляет пустое изображение. Undefined
не стирает context field. Передаются только ARIA-атрибуты, как в useClosable;
disabled/afterClose этого объекта Tag не использует. Блокировкой управляет Tag.disabled.
CloseLabel имеет приоритет над closable['aria-label'], затем используется locale.closeText.
По умолчанию описание кнопки ссылается на содержимое метки; closable['aria-describedby']
может его заменить, поэтому одинаковое «Закрыть» сохраняет контекст.
Disabled наследует ConfigProvider.componentDisabled; false явно снимает его.
Disabled запрещает закрытие и callbacks, не удаляя содержимое.

OnClose получает нативный MouseEvent; event.preventDefault() синхронно отменяет
закрытие. Возвращаемое значение и Promise не ожидаются. Повторный вход из callback
не вызывает onClose ещё раз. Прямой DOM listener останавливает всплытие клика;
Enter и Space обрабатываются при keydown через кнопку type=button; repeat и уже
отменённое событие игнорируются. Форма не отправляется. Callback может удалить
весь компонент или выбрать фокус.

После принятого закрытия содержимое удаляется из DOM. Изменение props не
открывает тот же экземпляр заново: для восстановления нужен новый экземпляр/key.
Tag не изменяет коллекцию владельца; при удалении записи или отмене onClose
владелец синхронизирует свою модель. Фокус из закрытой/удалённой кнопки переходит
на следующий доступный control текущего dialog/документа, затем предыдущий.
При скрытии closeIcon механизм также восстанавливает фокус. Явный выбор
владельца сохраняется; закрытие не создаёт дополнительных объявлений.

CheckableTag — отдельный export с обязательным children и декоративным icon.
Это нативный button type=button с aria-pressed, а не поле формы. Checked по
умолчанию false и полностью управляется владельцем. OnChange сообщает !checked;
компонент не присваивает checked и не поддерживает bind:checked/defaultChecked.
Внешнее обновление checked не вызывает callback. При disabled остаются значение
и содержимое, но кнопка исключается из Tab и не меняет состояние.

CheckableTag поддерживает Enter/Space и естественный Tab; при удалении кнопки
фокус восстанавливается рядом, сохраняя выбор владельца. OnClick вызывается
после onChange; отмена click внутри него не отменяет уже отправленное значение.
OnKeyDown вызывается первым: preventDefault отменяет переключение. Space
переключает при keydown, игнорирует repeat и не вызывает onClick; нативный Enter
создаёт click. Lowercase onclick/onkeydown имеют приоритет над соответствующими
callbacks. Уже отменённый click не вызывает переключение или onClick.

Id/class/style, title, data-/aria-атрибуты и остальные HTMLAttributes относятся
к кнопке. Dir наследуется при отсутствии локального значения. Bind:nativeElement
даёт ту же кнопку при обновлениях и очищается при unmount; SSR не создаёт ref.
Type=button и aria-pressed остаются собственными атрибутами компонента. Выбранные
фильтры, их объединение и связь с Form/Table принадлежат владельцу; скрытых
полей FormData и автоматической интеграции с FormItem нет.

CheckableTagGroup — отдельный export, соответствующий Tag.CheckableTagGroup.
Options принимает строки, числа или records с value, label, className и style;
label также принимает Snippet. Значения сохраняют тип и должны быть уникальными
стабильными ключами. Группа без options пуста; children не подменяют options.

```svelte
<script lang="ts">
  import { CheckableTagGroup } from 'antd-svelte';

  let selected = $state<string[]>(['Books']);
</script>

<CheckableTagGroup multiple options={['Movies', 'Books', 'Music']}
  value={selected} onChange={next => { selected = next; }} />
```

Без multiple повторное нажатие выбранной метки возвращает null. В multiple
callback получает массив: добавление сохраняет порядок текущих значений,
удаление сохраняет остальные, включая значения вне options. Value полностью
управляется владельцем; отказ принять callback сохраняет checked. Без value
состояние хранится внутри, defaultValue читается только при создании. Смена
value на undefined сбрасывает внутреннее значение, как useControlledState upstream;
callback при внешнем обновлении не вызывается. Bind:value не поддерживается.

ClassNames/styles задают root/item объектом или callback с raw props группы.
Приоритет root styles: context styles.root, context style, local styles.root,
local style. Item получает context style CheckableTag, context styles.item,
local styles.item и option.style. Context class относится к группе и меткам;
local class/rootClassName — к группе, option.className — к метке. Общие callbacks
ConfigProvider.tag получают props текущего компонента; тип context остаётся Tag,
как upstream. Для типизированных group callbacks используйте локальные props.

Корень — div без автоматической group/radiogroup роли. Передаются id, role,
data-/aria-атрибуты; остальные HTML props отбрасываются, как upstream. Bind:nativeElement
даёт div после mount и очищается при unmount. Disabled группы передаётся меткам;
undefined наследует componentDisabled, false явно снимает блокировку. Class disabled
группы отражает локальный prop. Flex-wrap и gap используют исходный paddingXS.
Метками остаются native toggle-кнопки CheckableTag: Enter/Space, aria-pressed,
focus recovery и отсутствие FormData сохраняются. Это осознанная граница с React span.

Tag, CheckableTag и CheckableTagGroup принимают локальный prefixCls. Отсутствие
или пустая строка наследуют ConfigProvider.prefixCls (по умолчанию ant-tag);
root/modifier/close classes следуют префиксу. У группы меняются group/item classes,
но вложенные CheckableTag отдельно наследуют общий prefix,
как в закреплённом upstream. PrefixCls не передаётся HTML-атрибутом и не меняет
имена CSS variables. Приватные content/icon wrappers и native dark class сохраняются.

Для нестандартного prefix используется шаблон из 90 исходных CSS rules. Он
попадает в SSR head и обновляется вместе с props; смена prefix не заменяет root,
close control или элементы группы. Удаление/закрытие экземпляра освобождает его
stylesheet, сохраняя стили соседей. Стандартный prefix использует прежний vendor CSS
без дополнительного head style. Native wrapping, hit target, focus и dark/compact
theme сохраняются; источник semantic styles и component tokens не меняется.

Компоненты наследуют тему, primary, compact и RTL. Для тёмной темы Tag связывает
обычный цвет текста с токенами и адаптирует фон/границу preset/status меток
через color-mix и локальные токены палитры. Solid сохраняет исходный цвет;
обычный solid в тёмной теме использует светлый фон и тёмный текст.
Эта прежняя адаптация действует в native theme; source token/algorithm theme
использует исходные Tag aliases, component overrides и палитры алгоритма.
Текст переносится на узком экране; close control не сжимается. Reduced motion
отключает встроенные transitions; ресурсы пользовательского Snippet принадлежат
его владельцу. Новая локаль не нужна: closeText уже входит в ruRU/enUS.

Галерея `/ant-design#tag` переключает цвета и варианты, показывает отмену
закрытия и восстановление экземпляра. Модель меток обрезает пробелы, проверяет
дубликаты без учёта регистра и защищает обязательную метку. Повторное добавление
удалённой метки получает новый key. CheckableTag фильтрует отдельную Table по
объединению выбранных статусов; пустой выбор показывает все строки. Ядро Table
не изменяется. Введённые значения выводятся обычными Svelte bindings.

Drag-and-drop и внешняя анимация остаются ответственностью владельца.

## Badge

```svelte
<script lang="ts">
  import { Badge, Button } from 'antd-svelte';

  let unread = $state(120);
</script>

<Badge count={unread}>
  {#snippet children({ descriptionId })}
    <Button aria-describedby={descriptionId}>Уведомления</Button>
  {/snippet}
</Badge>
<Badge count={0} showZero size="small" />
<Badge status="processing" text="Сервис работает" />
```

Badge принимает count и необязательный children Snippet. Count может быть числом,
строкой, boolean/null или Snippet. Без children
индикатор остаётся в потоке. По умолчанию overflowCount=99, showZero=false,
dot=false и size=medium; размер не наследуется от componentSize. Значение выше
предела отображается как `99+`. Конечные отрицательные и дробные числа сохраняются;
NaN/Infinity считаются отсутствующим count. Отрицательный или нечисловой предел
заменяется на 99; конечный неотрицательный overflowCount, включая 0, допустим.
Входные значения владельца компонент не изменяет.

Строки сохраняют исходное написание, включая ведущие нули, отрицательные числа
и пробелы. Overflow использует числовое сравнение, как upstream: `'100'` даёт
`99+`, `'001'` остаётся `001`. Только точная строка `'0'` включает правило нуля;
`'00'` и `'0.0'` видимы. Числовые строки с целым значением выводятся исходными
символьными slots ScrollNumber. Пустая строка и false не
создают счётчик без text/dot; null означает отсутствие count. Boolean true
отображается как `true`, как в исходном ScrollNumber. Полные строки сохраняются
в title и доступном описании, независимо от overflow.

Целые числа и числовые строки прокручиваются по исходному алгоритму SingleNumber.
Направление следует изменению абсолютного count; переходы 9/0 и смена длины
сохраняют разряды по позиции справа. Знаки и нечисловые символы остаются статичными.
Быстрые изменения используют сохранённые previous value/count, как upstream;
неизменная цифра сама по себе не обновляет предыдущий count.
Transitionend завершает путь; если событие не пришло, работает fallback 1000 ms.
Таймер очищается при смене числового значения разряда и при его удалении. SSR выводит
начальные settled units без таймеров; browser mount не пересоздаёт их DOM.
Reduced motion отключает переходы. Прежний numeric offset без нового API меняется мгновенно;
это сохранённая native-граница внешнего ScrollNumber, независимо от движения цифр.
18 последовательностей и 68 кадров закреплены в
[UMD-эталонах](../../../tests/browser/fixtures/ant-design-badge-digit-motion-reference.json),
проверки — [engine](../../../src/lib/badge-digit.engine.test.ts),
[browser](../../../tests/browser/badge-digit-motion.spec.ts) и
[SSR](../../../tests/package/badge-digit-motion.ssr.test.ts), фикстура — `?fixture=badge-digit-motion`.

Появление и исчезновение следуют CSSMotion: начальный видимый count не анимируется,
последующие изменения проходят start/active, а повторный показ прерывает выход.
У индикатора на время выхода сохраняются последние видимые count, dot и title; явно заданный
title продолжает обновляться. Собственный animationend/transitionend завершает
анимацию, события внутренних цифр игнорируются. Fallback срабатывает через
1000 ms после active. Ранний end сохраняет предыдущую разметку до activated,
как в исходнике. Самостоятельный status обходит этот lifecycle.
`theme.token.motion=false` и reduced motion отключают новые анимации;
включение reduced motion завершает текущую. Удаление компонента отменяет RAF,
таймеры и слушатели. Description и descriptionId скрываются сразу, независимо
от сохраняемого декоративного индикатора. 17 последовательностей/87 кадров и SSR
закреплены в [UMD-эталонах](../../../tests/browser/fixtures/ant-design-badge-zoom-reference.json),
проверки — [browser](../../../tests/browser/badge-zoom.spec.ts) и
[SSR](../../../tests/package/badge-zoom.ssr.test.ts), фикстура — `?fixture=badge-zoom`.

```svelte
<script lang="ts">
  import { Badge, type BadgeCountContext } from 'antd-svelte';
</script>

{#snippet clock(attributes: BadgeCountContext)}<span {...attributes} aria-label="Ожидает ответа">◷</span>{/snippet}
<Badge count={clock}><a href="/messages">Сообщения</a></Badge>
```

Count Snippet получает BadgeCountContext с class/style. Примените их к своему
корневому элементу; при собственном оформлении объедините классы массивом,
а CSS-строку контекста поставьте перед собственной. Это явная
замена React.cloneElement: Svelte не анализирует и не клонирует непрозрачный
Snippet. Дополнительной обёртки нет; если атрибуты не применены, автоматического
позиционирования не будет. Style содержит offset, ConfigProvider.badge.style и
Badge.style; собственный style корня имеет приоритет. Dot не заменяет готовый
count точкой, как upstream.
Пустой Snippet остаётся заданным count и не выбирает status вместо себя.
Доступность и интерактивность принадлежат Snippet; Badge не скрывает его controls
и не добавляет общее описание «Есть обновления». Смена offset/темы сохраняет его
DOM, состояние и фокус. При скрытии count содержимое сохраняется на время выхода.
Классы zoom передаются через контекст; как у исходного custom count без DOM-ref
CSSMotion, завершение использует deadline. Кеш сохраняет ссылку на Snippet,
а его собственные реактивные зависимости продолжают обновляться.

Нулевой count скрыт, пока не включён showZero. Как в Ant Design 6.6.8,
dot с count=0 скрыт, а с showZero отображается число 0; без count dot виден.
Самостоятельный status виден и без count, и при скрытом нуле. При наличии
children для статусной точки нужен dot или отображаемый count/text. Видимый
числовой count имеет приоритет над оформлением status. Строка text='0' и число
text=0 участвуют в общем правиле нуля, в том числе при ненулевом count.
Snippet считается содержимым независимо от его результата.

Поддерживаются success, processing, default, error, warning и 13 preset цветов:
blue, purple, cyan, green, magenta, pink, red, orange, yellow, volcano, geekblue,
lime, gold. Также поддерживаются CSS-цвета, CSS variables и background gradients.
У обычного индикатора custom color задаёт background; у самостоятельной статусной
точки — background и color. Preset color имеет приоритет над status.
Text принимает string/number/boolean/null или Snippet. Число не становится count
или BadgeContext.count. True учитывается как присутствующее значение, но подпись
не выводит; false/null считаются пустыми. Text=0 выводится только с showZero.
Размеры Badge — small и medium.

Offset — readonly-пара [x, y] из number|string: y задаёт margin-top,
положительный x сдвигает от логического конца наружу, в RTL направление зеркально.
Неконечная числовая координата заменяется на 0 независимо от второй координаты.
Строковый x использует parseFloat: '10.5px' даёт 10.5, '1e2' — 100; строковый y
сохраняет CSS units, включая em, %, calc и var. Строка '20' не превращается в 20px.
У обычного индикатора и самостоятельного статуса raw offset задаётся отдельными
DOM-свойствами: невалидное новое значение оставляет прежнюю координату, как React.
У custom count offset остаётся частью CSS-строки BadgeCountContext.
Компонент наследует тему и RTL; native compact сохраняет собственные размеры Badge.

Source `theme.components.Badge` применяет исходные размеры count/dot/status,
шрифты и padding. Defaults пересчитываются из global/компонентных aliases и
algorithm; тень использует colorBorderBg. Числовые indicatorZIndex/textFontWeight
сериализуются с px, как в Ant Design 6.6.8; безразмерные значения задаются строками.
Настройки доступны при SSR, custom cssVar.prefix и реактивных обновлениях.
Подробности — [контекст темы](../theme-context.md).

Обычный числовой/строковый индикатор скрыт от screen reader. Рядом расположен скрытый
текст с полным значением, в том числе при `99+` и dot. Children получает
BadgeContext с нормализованным числовым count и descriptionId, которым владелец может
описать кнопку, ссылку или другой control. Для строки/Snippet count остаётся
undefined; Snippet также не получает автоматического descriptionId.
При скрытии индикатора descriptionId
становится undefined. Children остаётся в DOM при изменении count: его фокус,
состояние и нативные события сохраняются. Сам Badge не создаёт остановок Tab,
live-region или автоматических объявлений. Aria-label/aria-labelledby именуют
необязательную группу; aria-describedby относится к корню. Подписи полного
значения/статусов переводятся через locale.badge с частичным наследованием.
Title по умолчанию содержит полный count; false/null убирают нативную подсказку,
строка заменяет её. Class/style относятся к корню, offset — к индикатору;
для самостоятельного статуса offset применяется к корню, как в исходнике.

ConfigProvider.badge задаёт class/style и semantic classNames/styles. Class и
rootClassName относятся к корню. ClassNames и styles принимают object либо
callback({props}) с разрешёнными size, overflowCount, dot и showZero; slots —
root и indicator. Контекстные и локальные классы объединяются. Для обычного
индикатора порядок стилей: offset → context indicator → context style → local
indicator → custom color. Border-color создаёт inset shadow ScrollNumber,
перекрывая заданный box-shadow. У самостоятельного статуса context style относится
к root, цвет status text берётся из semantic root/context style, а custom color
перекрывает оба цвета точки. Custom count получает только legacy context style
и offset через BadgeCountContext; semantic indicator к нему не применяется,
как в исходном ScrollNumber. Пустой ConfigProvider.badge заменяет родительский config.

```svelte
<Badge count="12" color="#2db7f5"
  styles={{ root: 'margin-inline:8px', indicator: 'border-color:#fff' }} />
```

Badge.style по-прежнему применяется к корню и не переносится
на обычный индикатор; для него используйте styles.indicator. Для custom count
Badge.style остаётся частью BadgeCountContext. Прежний числовой layout без нового
API сохраняется; ConfigProvider.badge, semantic props, rootClassName и custom
CSS color, новые scalar text и строковый offset включают исходный layout. Bind:nativeElement предоставляет корневой
HTMLSpanElement и очищается при unmount. Нативные span attrs/events передаются
корню; onclick имеет приоритет над React-compatible onClick. Изменение props/config
сохраняет DOM, состояние, selection и фокус. 49 вариантов и реактивные обновления
закреплены в [UMD-эталонах](../../../tests/browser/fixtures/ant-design-badge-api-reference.json),
проверки — [browser](../../../tests/browser/badge-api.spec.ts) и
[SSR](../../../tests/package/badge-api.ssr.test.ts), фикстура — `?fixture=badge-api`.

Галерея `/ant-design#badge` показывает варианты и локальный список уведомлений
в Drawer. Непрочитанное количество вычисляется из сообщений. Чтение сохраняет
записи; фокус переходит на прочитанное сообщение или список после «Прочитать все».
После закрытия Drawer фокус возвращается к прежней кнопке даже при count=0.
Сброс создаёт исходные сообщения с новыми ключами. Сеть и persistence отсутствуют.

46 вариантов count закреплены в
[официальных UMD-снимках](../../../tests/browser/fixtures/ant-design-badge-count-reference.json),
проверки — [browser](../../../tests/browser/badge-count.spec.ts) и
[SSR](../../../tests/package/badge-count.ssr.test.ts), фикстура — `?fixture=badge-count`.
У прежнего числового режима без нового API сохранены native normalization, BadgeContext,
root style и оформление standalone/non-status text; эти границы отличаются от React.

58 вариантов text/offset/size и обратимые обновления закреплены в
[UMD-эталонах](../../../tests/browser/fixtures/ant-design-badge-values-reference.json),
проверки — [browser](../../../tests/browser/badge-values.spec.ts),
[engine](../../../src/lib/badge.engine.test.ts) и
[SSR](../../../tests/package/badge-values.ssr.test.ts), фикстура — `?fixture=badge-values`.

PrefixCls меняет классы Badge, status/text и zoom; пустая строка наследует
ConfigProvider.prefixCls (по умолчанию ant-badge).
Для локального префикса Badge выводит в head stylesheet из закреплённого CSS template.
Стили обновляются вместе с префиксом и удаляются при unmount; root, digits и caller
controls сохраняются. ScrollNumberPrefixCls меняет классы sup/custom count и разрядов,
иначе он наследует ConfigProvider.prefixCls (по умолчанию ant-scroll-number).
Как в исходнике, Badge CSS использует общий prefix для scroll-number:
произвольный scrollNumberPrefixCls сам по себе не создаёт CSS
для новых классов. Эта связь влияет на standalone positioning, overflow и стили
разрядов. Общий prefix применяется также к count/digit classes и CSS.
Reduced motion цифр не зависит от prefix.
31 вариант классов/styles/геометрии и шесть zoom-последовательностей/30 кадров
закреплены в [UMD-эталонах](../../../tests/browser/fixtures/ant-design-badge-prefix-reference.json)
и [motion-эталонах](../../../tests/browser/fixtures/ant-design-badge-prefix-motion-reference.json).
Проверки — [browser](../../../tests/browser/badge-prefix.spec.ts),
[motion](../../../tests/browser/badge-prefix-motion.spec.ts),
[SSR](../../../tests/package/badge-prefix.ssr.test.ts) и
[motion SSR](../../../tests/package/badge-prefix-motion.ssr.test.ts).
Фикстуры — `?fixture=badge-prefix` и `?fixture=badge-prefix-motion`.

Processing использует исходную
CSS-пульсацию, которая отключается при reduced motion. Экспортируются BadgeProps,
BadgeStatus, BadgeColor, BadgeSize, BadgeText, BadgeOffset, BadgeCount, BadgeCountContext,
BadgeContext, BadgeConfig, BadgeSlots, BadgeSemantic и BadgeLocale.

## BadgeRibbon

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

## Avatar

```svelte
<script lang="ts">
  import { Avatar, Badge, Image } from 'antd-svelte';
</script>

<Avatar src="/anna.jpg" alt="Анна Новикова">АН</Avatar>
<Avatar shape="square" size={48} alt="Дмитрий Орлов">ДО</Avatar>
<Badge count={3}><Avatar alt="Вера Смирнова" size="large">ВС</Avatar></Badge>
{#snippet photo()}<Image src="/anna.jpg" alt="Фото Анны" />{/snippet}
<Avatar src={photo} size={64} alt="Анна Новикова" />
```

Avatar отображает изображение, icon или инициалы участника. Src принимает строку
или Snippet; пустая строка и отсутствующий src выбирают fallback.
Изображение имеет приоритет над icon Snippet, затем children Snippet.
При ошибке загрузки строки src onError вызывается один раз
для текущего изображения; false сохраняет его и отменяет fallback. Остальные
результаты выбирают icon или children. Смена src/srcSet разрешает новую загрузку,
в том числе возврат к ранее ошибочному адресу. Изменение только обработчика
ошибки не повторяет загрузку. SrcSet сам по себе не включает режим изображения.
Поддерживаются нативные draggable и crossOrigin.

Src Snippet отображается напрямую, даже если он пуст, и имеет приоритет над
icon/children. Его DOM, атрибуты, события и интерактивность принадлежат вызывающему
коду: Avatar не передаёт внутрь srcSet, draggable, crossOrigin и onError.
В частности, Image сохраняет собственные fallback и preview. Изменение размера,
темы и атрибутов Avatar сохраняет состояние Snippet; смена вида src удаляет
прежнее содержимое. При SSR Snippet выводится без обращения к browser API.

Ошибка привязана к версии пары src/srcSet. Позднее событие старого изображения
игнорируется; обработчик может синхронно заменить src, и новый источник
сохраняется. После гидратации также проверяется уже завершившаяся ошибочная
загрузка, чтобы fallback работал с изображениями из SSR. Listeners удаляются
при замене изображения и unmount. Компонент не загружает изображения вручную
и не вводит таймеров или повторных сетевых запросов поверх нативного img.

Shape по умолчанию circle; доступен square. Размер наследуется от
ConfigProvider.componentSize. Именованные размеры
small/medium/large равны 24/32/40 px. Явный size переопределяет контекст;
числовой size принимает положительное конечное число, включая дробное.
Неположительное/неконечное число заменяется размером из контекста. Для числового
размера шрифт текста равен 18 px, иконки — size/2, как в исходнике.
Class/rootClassName/style относятся к корню. ConfigProvider.avatar задаёт class/style
для каждого Avatar; отсутствующий record наследуется, явный объект, включая {},
заменяет родительский целиком. Context style перекрывает числовые/адаптивные размеры,
локальный style — context style. AvatarGroup не применяет этот config к своему корню,
но его видимые, счётчик и скрытые аватары читают общий config.
Темы и RTL наследуются, native compact сохраняет собственные размеры Avatar.

Size также принимает карту `{ xs, sm, md, lg, xl, xxl, xxxl }` с числовыми значениями:
например, `<Avatar size={{ xs: 24, md: 40, xxl: 100 }}>АВ</Avatar>`.
Выбирается самый крупный совпавший breakpoint с заданным значением; пропуски и
undefined позволяют использовать меньший совпавший. Размер xxl сохраняется на
xxxl, если xxxl не задан. Если совпадений нет, inline-размеры снимаются и действуют
обычные Avatar tokens; componentSize не заменяет явно заданную карту. Значение 0
останавливает поиск, но не задаёт inline-геометрию, как upstream. Шрифт адаптивных
icon/children равен size/2; без них — 18px. Локальный style сохраняет приоритет.

Пороги берутся из source screen* tokens с исходной проверкой порядка границ.
Карта media queries фиксируется при подписке: как useBreakpoint 6.6.8, изменение
порогов темы начинает действовать после выхода из responsive mode и возврата в него.
SSR не обращается к window и оставляет карту без совпадений; после mount размеры
обновляются без пересоздания Avatar, изображения и фокусируемого владельца.
Подгонка текста пересчитывается, listeners очищаются при unmount.
Эталонные 20 вариантов и 274 набора измерений закреплены в
[UMD-снимках](../../../tests/browser/fixtures/ant-design-avatar-responsive-reference.json),
проверки — [browser](../../../tests/browser/avatar-responsive.spec.ts) и
[SSR](../../../tests/package/avatar-responsive.ssr.test.ts), фикстура — `?fixture=avatar-responsive`.

Source `theme.components.Avatar` подготавливает container/text/icon sizes по
исходным правилам, включая отдельный algorithm и aliases. При стандартном
compactAlgorithm именованные small/medium/large имеют 21/28/35px; числовой size
сохраняет собственные размеры и font-size. Локальный style остаётся последним.
Общие токены применяются также к AvatarGroup и аватарам в overflow.

Gap задаёт свободное место по краям текста, по умолчанию 4 px. Конечное
неотрицательное значение сохраняется, иначе используется 4. Длинный текст
уменьшается через transform без изменения содержимого; короткий не увеличивается.
Если gap занимает всю ширину или элемент скрыт, scale остаётся 1 до следующего
измерения. ResizeObserver следит за корнем и текстом: изменение размера,
шрифта, children и появление скрытого элемента пересчитывают масштаб. При замене
fallback или unmount observer отключается. На SSR инициалы видимы без измерения;
подгонка выполняется после mount. Собственной анимации нет.

Для строки src, icon и children Alt, aria-label или aria-labelledby задают
полное имя корню с role=img;
оно сохраняется при смене изображения на fallback. Aria-describedby описывает
этот корень. Внутренний img строки src и icon/children скрыты от screen reader,
icon/children также inert. Без имени или
с aria-hidden=true весь Avatar декоративный. Для действия оберните Avatar
нативной кнопкой/ссылкой, задайте ей имя и при необходимости скройте повторяющий
его Avatar. Без явно переданных props компонент не добавляет остановок Tab,
live-region, автоматического фокуса и root click handler. Title задаёт нативную подсказку.

HTMLAttributes, data-/aria-атрибуты и нативные события передаются корневому span.
OnClick/onclick получают нативный MouseEvent; onclick имеет приоритет. Уже
отменённый click также передаётся владельцу. Enter/Space не синтезируют click:
keyboard behavior принадлежит владельцу. Локальные dir/role имеют приоритет над
контекстом и автоматической ролью; согласованные правила именования сохраняются.
Bind:nativeElement даёт текущий span, сохраняется при обновлениях config/props/
содержимого и очищается при unmount. SSR не создаёт ref или browser resources.

Для src Snippet именованный корень имеет role=group и сохраняет доступность
вложенных изображений и controls. Без имени содержимое использует собственные
подписи. Явный aria-hidden=true скрывает такой Avatar и делает его inert.
Не оборачивайте интерактивный Snippet ещё одной кнопкой или ссылкой.
Эталонные 14 вариантов закреплены в
[UMD-снимках](../../../tests/browser/fixtures/ant-design-avatar-source-reference.json),
проверки — [browser](../../../tests/browser/avatar-source.spec.ts) и
[SSR](../../../tests/package/avatar-source.ssr.test.ts), фикстура — `?fixture=avatar-source`.

Галерея `/ant-design#avatar` переключает содержимое, форму, размер, gap и отмену
fallback. Отдельный список участников сочетает Avatar с Badge и профилем в
Drawer. Выбор фото/инициалов/ошибочного источника сохраняется после закрытия
профиля; сброс восстанавливает участников и не меняет предпросмотр. Пример
использует локальные data URL без внешней сети и persistence.

AvatarProps, AvatarShape, AvatarSize и AvatarConfig экспортируются через index.ts.
Локальный prefixCls меняет root/modifier/string classes; отсутствие и пустая строка
наследуют ConfigProvider.prefixCls (по умолчанию ant-avatar).
Имена CSS variables, Image и anticon остаются общими.
Шаблон из 24 исходных правил ограничен текущим prefix и сохраняет шрифты/aliases
соседних стандартных Avatar. Смена prefix сохраняет root, img, text fit, src Snippet,
focus и ref; stylesheet живёт вместе с экземпляром и выводится также в SSR head.
Semantic classNames/styles исходный Avatar 6.6.8 не объявляет. Config/DOM/ref проверяются по
[UMD-эталонам](../../../tests/browser/fixtures/ant-design-avatar-api-reference.json),
[browser](../../../tests/browser/avatar-api.spec.ts) и
[SSR](../../../tests/package/avatar-api.ssr.test.ts); фикстура — `?fixture=avatar-api`.
Префиксы закреплены в
[UMD-эталонах](../../../tests/browser/fixtures/ant-design-avatar-prefix-reference.json),
[browser](../../../tests/browser/avatar-prefix.spec.ts) и
[SSR](../../../tests/package/avatar-prefix.ssr.test.ts); фикстура — `?fixture=avatar-prefix`.

## AvatarGroup

```svelte
<script lang="ts">
  import { AvatarGroup, type AvatarGroupItem } from 'antd-svelte';

  const members: AvatarGroupItem[] = [
    { key: 'anna', label: 'Анна Новикова', text: 'АН', src: '/anna.jpg' },
    { key: 'dmitry', label: 'Дмитрий Орлов', text: 'ДО' },
    { key: 'vera', label: 'Вера Смирнова', text: 'ВС', size: 'small' }
  ];
</script>

<AvatarGroup items={members} size="large" max={{ count: 2 }}
  aria-label="Команда проекта" />
```

AvatarGroup — отдельный Svelte export для Avatar.Group. Items принимает readonly
массив AvatarGroupItem с обязательными key и label. Key — строка или число;
первый повтор ключа сохраняется, следующие исключаются до применения лимита.
Число 0 и строка '0' различаются. Порядок владельца сохраняется, входной массив
и элементы не изменяются. Внутри видимой части и открытого списка элементы
сохраняют DOM и состояние Avatar при перестановке по key.
Key/label/text используются группой и не передаются в DOM аватаров. Остальные
DOM props и callbacks элемента относятся к его Avatar. Bind:nativeElement
задаётся на отдельном Avatar; items не создаёт binding для ref каждого элемента.

Class/rootClassName/style относятся к div группы. Bind:nativeElement даёт этот div
после mount и очищается при unmount. ConfigProvider.avatar class/style относятся
к аватарам, включая счётчик и открытый overflow; к корню группы они не применяются.
PrefixCls группы меняет group/RTL/popover classes, но не передаётся участникам и
счётчику. PrefixCls участника задаётся отдельно, как у исходных дочерних Avatar.
Обводка группы применяется к аватарам с совпадающим prefix. Native wrap, overlap,
список с подписями, кнопка +N и focus recovery сохраняются. Смена prefix обновляет
класс уже открытого popup и сохраняет его содержимое; стили снимаются при unmount.

Item поддерживает props Avatar и необязательный text для строковых инициалов.
Children Snippet имеет приоритет над text; затем действуют правила Avatar:
изображение → icon → содержимое. Label даёт Avatar полное имя по умолчанию
через alt; явные alt/ARIA props сохраняются. Size/shape элемента переопределяют
значения группы, затем используются defaults Avatar/ConfigProvider. Строковые
и числовые размеры, breakpoint-карты, fallback и подгонка текста работают как у Avatar.

Max.count ограничивает число видимых участников, а кнопка +N добавляется
отдельно: count=2 при пяти участниках даёт два Avatar и +3. Без лимита, при 0,
отрицательном или неконечном значении видны все. Положительная дробь усекается
до целого, но не ниже 1. При лимите не меньше числа уникальных участников
кнопка отсутствует. Max.style задаёт style Avatar внутри кнопки +N.

Без собственных triggers сохраняется нативный default hover/click.
При обновлении max кнопка и открытый список сохраняются, пока остаются
скрытые участники.

В исходнике overflow Avatar — span, которому браузер не передаёт фокус.
В Svelte сохранена нативная кнопка +N: focus trigger доступен с клавиатуры.
В raw source-замерах отдельно записан результат настоящего focus;
событие focusin отправляется отдельно для проверки обработчика Popover.

Max.popover принимает настройки текущего Svelte Popover, кроме children:
содержимое, видимость, callbacks, container getters, ARIA, classes/styles,
trigger, placement, arrow, autoAdjustOverflow и задержки
mouseEnterDelay/mouseLeaveDelay. Class/style относятся к wrapper Popover;
popupClass добавляется к group-popover class. По умолчанию используются
hover/click и top: нативная кнопка открывается кликом, Enter/Space или наведением.
Для клавиатуры при собственном trigger используйте click или focus. Popover
показывает именованный список скрытых участников с полными label; аватары
в этом списке декоративные, кроме src Snippet, сохраняющих собственную
доступность и controls; явный aria-hidden=true делает их декоративными.
Title заменяет заголовок списка, content — сам список. Наличие ключа с null,
false или undefined явно отключает соответствующий default; true оставляет
пустую секцию, 0 отображается. Snippets создаются после первого открытия,
без вызовов при SSR. Если собственного заголовка нет, сохраняется имя из locale;
иначе имя берётся из title или явных aria-label/aria-labelledby. Aria-describedby
и aria-busy передаются поверхности.

Вложенный max.popover.open — controlled prop с onOpenChange, как у исходной
группы: владелец принимает или отклоняет запрос. Без open состояние внутреннее;
defaultOpen читается один раз при создании overflow. Удаление controlled open
очищает внутреннее значение и не возвращает defaultOpen. Внешнее изменение open
не вызывает callback. Отклонённое закрытие сохраняет открытый popup и фокус;
отклонённое открытие позволяет повторить запрос следующим кликом.

```svelte
<script lang="ts">
  import { AvatarGroup } from 'antd-svelte';

  let open = $state(false);
  const members = [
    { key: 'anna', label: 'Анна', text: 'АН' },
    { key: 'vera', label: 'Вера', text: 'ВС' }
  ];
</script>

{#snippet details()}<input aria-label="Комментарий команды" value="Черновик" />{/snippet}

<AvatarGroup items={members} max={{
  count: 1,
  popover: {
    title: 'Команда',
    content: details,
    open,
    onOpenChange: next => { open = next; },
    destroyOnHidden: false
  }
}} />
```

DestroyOnHidden по умолчанию true: список и пользовательские snippets удаляются
при закрытии. False сохраняет их DOM и состояние после первого открытия;
сохраняющееся содержимое остаётся реактивным по правилам Svelte Popover.
Явный ключ destroyOnHidden=undefined снимает default группы; Popover сохраняет
содержимое. GetPopupContainer имеет те же
приоритеты и lifecycle, что у Popover; getter получает нативную кнопку +N.
Переход элемента между видимой частью и Popover создаёт новый Avatar.
Image preview внутри списка сохраняет открытый Popover: первый Escape закрывает
preview и возвращает фокус изображению, следующий — Popover с возвратом к +N.

Корень — именованная группа, собственных остановок Tab и live-region у неё нет.
Кнопка +N имеет type=button, доступное имя с полным количеством и ARIA-связь с
Popover после mount. Escape возвращает фокус кнопке. Если лимит/список убирает
кнопку или группа удалена, фокус восстанавливается на доступном соседнем control
в текущем dialog или документе. Явный выбор фокуса владельцем сохраняется.
Повторное появление overflow создаёт закрытый Popover. Кнопка раскрытия
не блокируется через componentDisabled, поскольку показывает информацию.

Подписи группы, списка и кнопки берутся из locale.avatarGroup с частичным
наследованием. Aria-label/aria-labelledby переопределяют имя группы,
aria-describedby описывает корень; id/class/style также относятся к корню.
Группа наследует темы, compact и RTL и переносит аватары на узком экране.
В native-темах сохраняются логическое перекрытие 8px и обводка под фон темы.
В source-темах Avatar groupOverlapping/groupBorderColor управляют перекрытием и
обводкой; groupSpace задаёт расстояние между строками существующего overflow-списка.
Панель Popover сбрасывает чужие alias overrides на значения provider, а скрытые
аватары получают собственные Avatar tokens.
Нативный Popover требует Popover API; собственных анимаций группа не добавляет.

Галерея `/ant-design#avatar-group` показывает добавление, удаление, перестановку,
лимит, размеры и форму команды. Имена выводятся обычными bindings; пустое имя
не добавляется. Новые и сброшенные участники получают свежие ключи. Фокус
сохраняется при перестановке и переходит к соседу после удаления. Внешней сети
и persistence нет. Экспортируются AvatarGroupProps, AvatarGroupItem,
AvatarGroupKey, AvatarGroupMax и AvatarGroupLocale. Произвольные компоненты вместо
Avatar и настройки исходного Popover, ещё отсутствующие в Svelte Popover,
пока не перенесены: в том числе motion и полная React.memo-заморозка opaque Snippet.
Id/forceRender/fresh/zIndex передаются; forceRender прогревает также скрытый
Snippet после mount, сохраняя ленивый SSR и последующий destroy/retain lifecycle.
Точный текущий тип max.popover производен от
[PopoverProps](../../../src/lib/popover.types.ts), а не дублирует отдельный список props.
Приоритеты aliases, count/style и trigger/placement проверяются по
[20 UMD-эталонам](../../../tests/browser/fixtures/ant-design-avatar-group-max-reference.json),
[SSR](../../../tests/package/avatar-group-max.ssr.test.ts) и
[браузерным сценариям](../../../tests/browser/avatar-group-max.spec.ts).
Содержимое, controlled/default state, destroy/retain и container getters проверяются по
[33 UMD-последовательностям](../../../tests/browser/fixtures/ant-design-avatar-group-popover-reference.json),
[SSR](../../../tests/package/avatar-group-popover.ssr.test.ts) и
[browser lifecycle](../../../tests/browser/avatar-group-popover.spec.ts).

## Image

Первый этап следует Ant Design 6.6.8 / @rc-component/image 1.10.0 (~1.10.0).
[MIT-лицензия rc-image](../../../src/lib/vendor/LICENSE.rc-image) сохранена; React runtime не
устанавливается. Геометрия перенесена в image-preview.engine.ts, browser
listeners/probes — в соответствующие DOM-модули. ImagePreviewGroup использует тот же
ImagePreview для групповой навигации.

```svelte
<script lang="ts">
  import { Image } from 'antd-svelte';
  let open = $state(false);
</script>
<Image src="/photo.jpg" alt="Фотография" width={240}
  preview={{ open, onOpenChange: next => { open = next; } }} />
```

Src/alt/width/height и native image attrs поддержаны. Числовые размеры задаются
в px, CSS-строки сохраняются. Class/style относятся к img; rootClassName и
styles.root — к обёртке. Bind:nativeElement и bind:imageElement дают native refs.
Preview по умолчанию true; false оставляет пассивное изображение. Интерактивная
обёртка — native button вместо React div role=button, поэтому не отправляет форму.
Enter/Space открывают preview, onKeyDown доступен; pointer opening вызывается до
onClick, как upstream. Image не наследует Form/ConfigProvider control disabled.

PrefixCls задаёт локальный базовый префикс Image; пустая строка наследует общий
ConfigProvider.prefixCls. Классы миниатюры, placeholder/cover и preview используют
этот префикс; viewer по умолчанию добавляет суффикс -preview. Смена префикса
сохраняет DOM, refs, открытый viewer, масштаб и фокус. Canonical theme variables не переименовываются.

Image.previewPrefixCls задаёт полное независимое имя viewer. Undefined оставляет
производное имя; пустая строка сохраняется, как в rc-image. Настройка не меняет
классы миниатюры и игнорируется групповым viewer. Стили подключаются для обоих
namespaces. В официальном wrapper независимое имя теряет CSS; [raw замеры и отдельные
оформленные counterparts](../../../tests/browser/fixtures/ant-design-image-independent-preview-reference.json)
сохранены. Svelte подключает недостающие стили и сохраняет dialog, transform и фокус.

Fallback подставляется при ошибке исходного src; root сохраняет ant-image-error,
даже если fallback загрузился. Новый src сбрасывает ошибку. Source probe повторяет
useStatus; результаты старого src и события отсоединённого img игнорируются.
OnError/onLoad передают native event. Placeholder=true включает исходный фон img,
Snippet отображается до загрузки; без src Snippet показывается отдельно без preview.
Кешированный complete img обрабатывается после mount без зависания placeholder.

Preview config содержит src, open/onOpenChange/afterOpenChange, cover, closeIcon,
mask, focusTrap, movable, wheel, scaleStep/minScale/maxScale и onTransform.
Preview.src может отличаться от thumbnail. Open без onOpenChange остаётся под
контролем владельца; без open компонент хранит состояние сам. Программная смена
open не вызывает onOpenChange. Cover — boolean/Snippet/{coverNode,placement};
placement top/bottom/center. По runtime 6.6.8 default cover=true создаёт пустую
hover-поверхность. CloseIcon — boolean/null/Snippet; false/null скрывают кнопку.

Viewer — native dialog, SSR не открывает его. После первого открытия DOM остаётся
смонтированным. FocusTrap по умолчанию true; false допускает фокус вне viewer.
Escape закрывает верхний preview, фокус возвращается opener, scroll освобождается
при закрытии/unmount и остаётся заперт при открытом host Modal. Mask принимает
boolean/{enabled,blur,closable}; closable по умолчанию true. ClassNames.popup.root
на Image/ImagePreviewGroup и preview.zIndex применяются к viewer. AfterOpenChange
выполняется после native смены видимости; rc-motion fade timing пока отсутствует.

Default transform: x=y=rotate=0, scale=1, flipX=flipY=false. По умолчанию
minScale=1, maxScale=50, scaleStep=0.5. Toolbar zoom использует множитель 1+step;
wheel учитывает deltaY и ограничивает ratio, сохраняя точку под курсором.
Double click переключает zoom/scale=1; rotate меняется по 90°, flip инвертирует
соответствующую ось. Movable=false отключает drag/touch, wheel управляется отдельно.
Touch pinch допускает временный scale ниже min и восстанавливает его на отпускании.
Mouse rebound сохраняет source проверку изменения обеих координат.

OnTransform({transform,action}) сообщает изменения через RAF queue; close сбрасывает
transform, если он отличается от начального. Actions: zoomIn/zoomOut, rotateLeft/
rotateRight, flipX/flipY, wheel, doubleClick, move, dragRebound, touchZoom, reset/close.
ActionsRender(original,info) и imageRender(original,info) — Snippet: original можно
вызвать через @render, info содержит transform/image, а toolbar info также
current/total/actions. Reset доступен через info.actions.onReset. Native Pointer
Events/capture заменяют React window mouse/touch handlers с cleanup на unmount.

Темы, RTL, RU/EN accessible labels и reduced motion поддержаны. Рецепт image
извлекает 48 правил; progress wrapper и rc-motion исключены. Иконки перенесены из
Ant Design Icons SVG 4.6.0 с существующей MIT-лицензией. Галерея `/ant-design#image`,
фикстура `?fixture=image`.

ConfigProvider.theme.components.Image задаёт zIndexPopup, previewOperationSize,
previewOperationColor, previewOperationHoverColor, previewOperationColorDisabled
и progressAnimationDuration. Общая тема применяется к миниатюре и viewer, включая
ImagePreviewGroup; aliases, algorithms, cssVar prefix/key и вложенные providers
поддержаны. Preview.zIndex имеет приоритет над токеном, styles.root — над
переменными миниатюры. Смена темы сохраняет viewer, transforms, current и фокус.
ProgressAnimationDuration пока доступен только как CSS variable: placeholder.progress
и его анимация ещё не перенесены. Native dialog stack поверх Modal сохранён;
числовой React z-index context не добавляется.

Из semantic API пока перенесены styles.root у Image и classNames.popup.root у
Image/ImagePreviewGroup. Остальные slots, placeholder progress/render,
ConfigProvider.image, getContainer, icons/React info.icons wrappers и
исходные fade/appear/leave/mousePosition motion пока отсутствуют. Deprecated aliases
исключены из переноса. [Замер текущих полей оформления](../../../tools/fixtures/ant-design-image-current-styling-observation.json)
подтверждает styles.root и classNames.popup.root в закреплённом UMD; вложенный
preview.classNames не входит в текущий тип preview и игнорируется upstream.

## ImagePreviewGroup (Image.PreviewGroup)

ImagePreviewGroup соответствует React Image.PreviewGroup, отдельный Svelte export
относится к тому же семейству Image. Он предоставляет контекст дочерним Image и
общий viewer; своей DOM-обёртки вокруг children нет.

```svelte
<script lang="ts">
  import { Image, ImagePreviewGroup } from 'antd-svelte';
</script>
<ImagePreviewGroup>
  <Image src="/first.jpg" alt="Первое изображение" width={160} />
  <Image src="/second.jpg" alt="Второе изображение" width={160} />
</ImagePreviewGroup>
```

PreviewPrefixCls группы задаёт базовый Image prefix, как в Ant Design; к нему
добавляется -preview. Пустая строка наследует ConfigProvider. Префиксы дочерних
Image независимы от группы. Смена общего или локального префикса сохраняет viewer,
выбранное изображение и transform.

Без items список строится из зарегистрированных дочерних Image с preview=true.
Порядок соответствует созданию/регистрации, сохраняется при keyed DOM reorder;
обновление src не переставляет элемент. Одинаковые src различаются по id.
Image.preview=false исключает thumbnail из этого списка. Preview.src дочернего
Image регистрируется вместо thumbnail src; его собственный preview config и
onOpenChange не управляют групповым viewer.

Items принимает строки URL или объекты с src/alt и shared native image attrs.
Явный массив, включая пустой, имеет приоритет над регистрациями. При открытии
thumbnail ищется первое совпадение preview src, при отсутствии совпадения индекс 0.
Изображения items не создают thumbnails автоматически. Fallback группы применяется
к viewer; индивидуальный Image.fallback в registration data не входит.

Preview config поддерживает open/onOpenChange, current/onChange, countRender и
общие настройки viewer/transforms/render Snippets. Current — zero-based; по
умолчанию 0. Prev/next и физические Left/Right меняют индекс в пределах списка;
в RTL порядок индексов клавиатуры не меняется, иконки/логическое положение
переключателей адаптируются. OnChange(next,previous) относится к навигации;
thumbnail напрямую задаёт внутренний индекс и не вызывает onChange. Controlled
current остаётся у владельца. Navigation фиксирует previous до вызова callbacks,
даже если onTransform изменил props владельца.

OnOpenChange(open,{current}) вызывается при пользовательском изменении видимости.
Сохранена особенность rc-image 1.10.0: при открытии thumbnail callback получает
snapshot прежнего current, а viewer использует индекс нажатого изображения.
Внешняя смена open сама не вызывает этот callback. После закрытия программное
открытие uncontrolled current начинает с 0; новое открытие thumbnail сохраняет
его выбранный индекс. Внешнее изменение controlled current сохраняет transform,
пользовательская навигация сбрасывает его без scale transition.

CountRender(current,total) получает one-based current. Render info для
imageRender/actionsRender содержит zero-based current, total и actions;
info.actions.onActive(offset) принимает относительное смещение, как runtime
rc-image, а не абсолютный индекс. Refs/DOM и управление фокусом относятся к общему
viewer. После закрытия фокус возвращается thumbnail, открывшему группу.

Удаление images/items обновляет список, не ограничивая owner current автоматически:
владелец отвечает за допустимый индекс. Даже при пустом списке viewer можно закрыть.
Ещё одна особенность rc-image 1.10.0 сохранена: preview=false у Group снимает
настройки, но само по себе не отключает открытие из дочернего Image; отключение
конкретного thumbnail задаётся Image.preview=false.

Fixture — `?fixture=image-preview-group`, галерея — `/ant-design#image`.
SSR рендерит children без DOM registration и открытого viewer. Ограничения semantic/
config/container/icons и исходных motion общие с Image и перечислены выше.

## QRCode

QRCode переносит canvas/SVG и статусы Ant Design 6.6.8 с encoder из
@rc-component/qrcode 2.0.0 (~2.0.0). TypeScript-алгоритм Project Nayuki сохранён
с исходными таблицами, сегментацией, выбором версии/маски и Reed–Solomon.
Runtime React dependencies не добавлены. В пакет включены лицензии
[rc-qrcode](../../../src/lib/vendor/LICENSE.rc-qrcode),
[Nayuki](../../../src/lib/vendor/LICENSE.qrcodegen) и
[qrcode.react](../../../src/lib/vendor/LICENSE.qrcode-react).
Точные Props, status snippet и semantic/config — в
[исходных объявлениях](../../../src/lib/qrcode.types.ts).

```svelte
<script lang="ts">
  import { QRCode } from 'antd-svelte';
</script>

<QRCode
  value="https://ant.design"
  type="svg"
  size={180}
  marginSize={4}
  aria-label="Ссылка на Ant Design"
/>
```

Массив value задаёт отдельные сегменты, а не склеенную строку. Numeric,
alphanumeric и UTF-8 выбираются с исходными правилами; доступны версии 1–40 и
уровни L/M/Q/H. BoostLevel по умолчанию повышает коррекцию, если размер символа
не увеличивается. Пустая строка не создаёт DOM, пустой массив создаёт символ
без payload. Слишком длинное значение сохраняет RangeError `Data too long`,
незавершённая Unicode surrogate pair — URIError, без подмены данных.

Type по умолчанию canvas. SSR создаёт canvas shell размером size; отрисовка после
mount учитывает devicePixelRatio. SVG целиком готов при SSR. MarginSize задаётся
в модулях, округляется вниз и ограничивается снизу нулём; default 0 сохраняет
поведение Ant Design. Size управляет bitmap и fallback root width/height.
Только width/height обычного style передаются также рисунку; semantic root
dimensions не передаются ему. CSS-растяжение не увеличивает разрешение bitmap.

Icon принимает URL, iconSize — квадрат либо width/height, по умолчанию 40×40.
Размер 0 сохраняет fallback rc-qrcode к 10% от size. Изображение центрируется,
загружается с crossOrigin=anonymous и растягивается в указанный прямоугольник.
Canvas вырезает перекрытые модули только после успешной загрузки; SVG делает это
сразу. При отсутствии Path2D используется исходный fallback с отдельными rect:
он сохраняет модули под иконкой, как в закреплённом rc-qrcode. При отсутствии
2D context остаётся canvas shell. При ошибке загрузки canvas сохраняет все QR-модули.
PNG можно получить через nativeElement.querySelector('canvas').toDataURL();
чужой сервер изображения должен разрешать CORS, как в эталоне.

Status active оставляет рисунок без cover; expired показывает текст и refresh,
loading использует Spin, scanned — текст подтверждения. OnRefresh не меняет
status автоматически. Кнопка использует текущие Button/config/disabled правила
и сохраняет native type=button; её click всплывает до root. StatusRender —
snippet с status/locale/onRefresh, который целиком заменяет содержимое cover,
включая пустой результат. Locale.qrcode объединяется по полям; RU/EN подписи
взяты из закреплённых словарей Ant Design.

Role=img и aria-* относятся к canvas/SVG. Native id/title/data-* и обработчики
относятся к root; title не создаёт SVG title, children не выводится. Передавайте
aria-label или aria-labelledby для имени рисунка. Bind:nativeElement заменяет
React ref и очищается при пустом value или unmount; поздний load отсоединённого
изображения не перерисовывает старый canvas.

ConfigProvider.qrcode задаёт class/style/classNames/styles для root/cover;
nested config заменяет объект целиком. Semantic callbacks получают разрешённые
type/size/status/bordered/errorLevel/bgColor. Root style идёт после semantic
styles, затем записываются size или plain width/height. Color по умолчанию берётся
из глобального colorText token theme; component QRCode.colorText и style.color
не меняют модули. Явный color приоритетнее; при undefined global colorText действует
исходный fallback #000000. Native light/dark defaults сохранены. Bordered=false
оставляет прозрачную границу, убирает padding и radius. RTL наследуется.

В upstream QRCode не объявляет публичных собственных component tokens.
ConfigProvider.theme.components.QRCode поддерживает alias tokens и algorithms:
padding, border, radius, текст cover и прочие глобальные значения. Внутренний
background cover готовится из colorBgContainer с абсолютной alpha 0.96, включая
полупрозрачный исходный цвет. Theme variables идут перед semantic/user styles.
Global/component algorithms, cssVar.prefix и nested/reset/sibling scopes
сверяются с [UMD](../../../tests/browser/fixtures/ant-design-qrcode-theme-reference.json),
[SSR](../../../tests/package/qrcode-theme.ssr.test.ts) и
[browser](../../../tests/browser/qrcode-theme.spec.ts), `?fixture=qrcode-theme`.
Реактивная смена global colorText перерисовывает прежний canvas и обновляет
прежний SVG; cover/padding не сбрасывают фокус status snippet или refs.

CSS-рецепт qrcode воспроизводит все 11 правил с проверкой SHA-256. Fixture —
`?fixture=qrcode`; unit/SSR/package/browser проверяют матрицы, pixel centers,
quiet zone, иконку/CORS, statuses, refs, темы, стили и fallback. Матрицы сверяются
с [фиксированными результатами npm-пакета](../../../tests/package/qrcode-vectors.json),
включая все 40 версий, четыре уровня коррекции и восемь масок.

Локальный prefixCls меняет root/cover/expired/scanned/borderless classes; пустая
строка наследует ConfigProvider.prefixCls (по умолчанию ant-qrcode). CSS module
ограничен marker своего корня, namespace
токенов и классы Button/Spin сохраняются. Соседние QRCode не меняются, включая
совпадения prefix с cover/css-var/borderless. При смене prefix сохраняются root,
canvas/SVG, encoding, status, refs и доступная с клавиатуры кнопка refresh.
Fallback-переменная module не перекрывает адаптивный cover прежней light/dark темы.
Native RTL наследуется, исходное LTR-направление корня хранится в raw reference.
Сверка: [44 исходных случая и 4 обновления](../../../tests/browser/fixtures/ant-design-qrcode-prefix-reference.json),
[CSS boundary](../../../src/lib/qrcode-prefix.test.ts),
[браузер](../../../tests/browser/qrcode-prefix.spec.ts),
[публичный пакет и SSR](../../../tests/package/qrcode-prefix.ssr.test.ts), `?fixture=qrcode-prefix`.
Рецепт qrcode-prefix воспроизводит те же 11 правил CSS data module с проверкой SHA-256.
Общий ConfigProvider.prefixCls применяется к QRCode, локальный prefix имеет приоритет.
React development warnings для пустого value и icon с уровнем L
пока не воспроизводятся; production-поведение этих случаев сохранено.

## Watermark

Watermark переносит Ant Design 6.6.8: index/useClips/useWatermark/context/utils,
useSingletonCache и leading RAF debounce. Изучен также
@rc-component/mutate-observer 2.0.1 (^2.0.1) и @rc-component/util 1.14.0
(^1.14.0); [лицензия observer](../../../src/lib/vendor/LICENSE.rc-mutate-observer) сохранена.
Используются native Canvas/MutationObserver/Image без React dependencies.

```svelte
<script lang="ts">
  import { Watermark } from 'antd-svelte';
</script>
<Watermark content={['Ant Design', { text: 'Svelte 5', font: { fontSize: 12 } }]}>
  <p>Содержимое страницы</p>
</Watermark>
```

Content принимает строку, WatermarkText {text,font} либо смешанный readonly массив.
Отсутствующий content даёт ноль строк; пустая строка остаётся отдельной строкой.
Font задаёт color (включая CanvasGradient/CanvasPattern), fontSize, fontWeight,
fontStyle, fontFamily и textAlign; построчный font накладывает только определённые
значения. FontSize конвертируется через Number, как source: числовые строки
поддержаны, единицы вроде '18px' не разбираются. Между строками FontGap=3.

Три Canvas повторяют исходные text/image, поворот и alternating clips. Размер
текста определяется measureText/fontBoundingBoxAscent/Descent; width/height
переопределяют измерение. Image имеет приоритет, использует crossOrigin=anonymous
и referrerPolicy=no-referrer. При ошибке рисуется content; image defaults 120x64
сохраняются и для fallback. DPR читается при отрисовке; отдельной подписки на его
изменение нет. Пустой рисунок не копирует нулевые Canvas. В DOM Canvas не остаются:
слой использует PNG data URL, background-repeat=repeat и floor(logical width).

Rotate=-22, gap=[100,100], offset=gap/2. Положительное смещение относительно
центра gap сдвигает и сужает слой; отрицательное меняет background-position.
Координаты физические и не переворачиваются в RTL. ZIndex по умолчанию равен
zIndexPopupBase-1, то есть 999 в стандартной теме. Слой absolute, занимает 100%,
не перехватывает pointer events и имеет visibility:visible!important.
Декоративный слой скрыт от accessibility tree, children/focus не подменяются.

Обёртка имеет position:relative/overflow:hidden. ConfigProvider.watermark
принимает class/style; class и rootClassName добавляются, style владельца идёт
после default/context. Вложенный явно заданный watermark config заменяет
родительский. Bind:nativeElement возвращает div. Как исходный WatermarkProps,
компонент не принимает произвольные HTML attrs/events; они остаются у children.
В source theme font defaults читают глобальные colorFill/fontSizeLG, а zIndex —
zIndexPopupBase - 1. Изменения aliases/seed/algorithm перерисовывают PNG без замены
слоя, контейнера, ref или содержимого. Явный font/zIndex и построчные overrides
имеют приоритет; CSS variables и components.Watermark на Canvas не влияют,
как в исходнике. Без source theme сохранены прежние CSS defaults и реактивные
light/dark/compact. Общий disabled не отключает рисунок.

MutationObserver следует исходному набору subtree/childList/style/class.
Изменение style/class слоя восстанавливает стили, снимает class/hidden;
самостоятельное изменение hidden не наблюдается до следующей наблюдаемой мутации.
Удалённый/перемещённый слой возвращается тем же DOM node с кэшированным PNG,
вызывая onRemove. Изменение только стилей не вызывает onRemove. На root
восстанавливаются лишь ожидаемые position/overflow, включая явные overrides;
прочие утраченные inline styles не восстанавливаются. При штатном unmount и
удалении панели onRemove не вызывается.

Сохранены особенности алгоритма кэша и scheduling Ant Design 6.6.8. Кэш хранит
последний набор параметров, исключая HTMLElement и top-level NaN из ключей.
Поэтому смена только image URL при неизменных геометрии/параметрах использует
прежний PNG; смена rotate/size/gap обновляет изображение. Незавершённые image
requests сохраняют исходный completion order: старый ответ с отличающейся
геометрией может временно заменить уже показанный новый рисунок; наблюдатель
может затем запустить актуальную отрисовку. Нативные paint-объекты без enumerable
полей также следуют исходному глубокому сравнению ключей кэша. Leading RAF throttle
выполняет первый вызов сразу и подавляет остальные до кадра без trailing-вызова;
внутрикадровые изменения могут ждать следующего независимого обновления.
Эти особенности не исправлены скрыто при переносе.

Inherit=true предоставляет контекст дочерним Modal/Drawer. Они регистрируют
соответственно .ant-modal-container и .ant-drawer-section; каждый получает
такой же рисунок, включая native dialog top layer. Регистрация следует
сохранённому lifecycle местных Modal/Drawer. Inherit=false не предоставляет
свой контекст; в nested Watermark остаётся доступен контекст внешнего Watermark.
Смена inherit пересоздаёт children branch, как условный Provider исходника.
Attachment панели снимает регистрацию при уничтожении без её восстановления.

SSR выводит только обёртку/children, без Canvas/Image/observer/callbacks.
После unmount отключаются observer, RAF и callbacks ожидающих изображений,
удаляются принадлежащие компоненту слои. Без 2D context остаются children; без
MutationObserver рисунок создаётся, но не восстанавливается после DOM mutation.
Watermark не имеет собственного CSS/component token/prefixCls API в upstream;
нового CSS-рецепта не требуется. Source global tokens, algorithms, zero/undefined,
cssVar prefix/key, priority и scopes проверяются через `?fixture=watermark-theme`
по замерам официального UMD, включая Canvas calls и повторяемый PNG.
Изменение темы обновляет унаследованные слои Modal/Drawer без потери фокуса.
Источник алгоритмов покрыт существующей
[MIT-лицензией Ant Design](../../../src/lib/vendor/LICENSE.ant-design).

Галерея — `/ant-design#watermark`, fixture — `?fixture=watermark`.
Unit/SSR проверяют geometry/fonts/draw calls и серверную границу; browser
проверяет реальные PNG pixels, восстановление DOM, image/cache, DPI и панели.

## Table

```svelte
<script lang="ts">
  import { Table, type TableColumn, type TableKey, type TableSorter } from 'antd-svelte';

  interface Person { id: number; name: string; score: number }

  const people: Person[] = [
    { id: 0, name: 'Анна', score: 30 },
    { id: 1, name: 'Борис', score: 10 }
  ];
  const columns: TableColumn<Person>[] = [
    { key: 'name', title: 'Имя', render: personName },
    { key: 'score', title: 'Баллы', dataIndex: 'score', sorter: (left, right) => left.score - right.score }
  ];
  let current = $state(1);
  let pageSize = $state(10);
  let sorter = $state<TableSorter | null>(null);
  let selectedRowKeys = $state<TableKey[]>([]);
</script>

{#snippet personName(person: Person)}<strong>{person.name}</strong>{/snippet}

<Table
  dataSource={people}
  {columns}
  rowKey="id"
  caption="Участники"
  bind:current
  bind:pageSize
  bind:sorter
  bind:selectedRowKeys
  rowSelection
  scroll={{ x: 600 }}
/>
```

По умолчанию используется `mode="client"`: фильтрация, сортировка и разбиение
на страницы выполняются локально; переданный `total` в этом режиме игнорируется.
`dataSource` и `columns` принимают readonly-массивы. Каждая колонка имеет
уникальный строковый `key` и текстовый `title`. `dataIndex` выбирает одно поле
`keyof Row`; null/undefined отображаются пустой строкой, остальные значения —
через безопасное текстовое преобразование. `render(record, index)` заменяет
содержимое ячейки типизированным snippet; index начинается с 0 на текущей
странице. Колонка также принимает `width`, `align` и `className`. Поле `className`
дополняет классы заголовка и ячеек данных своей колонки; служебные selection/expand
колонки его не получают. Сортировка, selected/fixed classes и native semantics
сохраняются. Обновление класса не пересоздаёт ячейку или snippet editor.
8 состояний официального UMD сверяются в
[browser](../../../tests/browser/table-column-classes.spec.ts), серверная разметка —
в [SSR](../../../tests/package/table-column-classes.ssr.test.ts).
Fixture `?fixture=table-column-classes`.

`rowKey` задаёт поле или функцию получения ключа, по умолчанию используется
поле `key`. Ключ должен быть уникальной строкой или конечным числом; `0`
поддерживается. Отсутствующие/повторные ключи строк, повторные ключи колонок и
пустой список колонок вызывают явную ошибку. Позиции строк не используются как
идентификаторы выбора.

Сортировка задаётся через `sorter: { columnKey, order } | null` и поддерживает
привязку. Компаратор принадлежит `column.sorter`. Нажатие заголовка переключает
`ascend → descend → null`. Равные значения сохраняют порядок исходных записей
в обоих направлениях; входной массив не изменяется. После фильтрации сортируется
весь прошедший набор, затем выбирается текущая страница. Номер страницы при сортировке
сохраняется. Если колонка удалена или не имеет компаратора, отображается исходный
порядок прошедших фильтр записей без изменения состояния владельца.

Пагинация включена по умолчанию: `current=1`, `pageSize=10`; оба props
поддерживают привязку. `pagination={false}` показывает все записи.
Объект `pagination` передаёт настройки `showSizeChanger`, `pageSizeOptions`,
`hideOnSinglePage`, `showTotal` и `aria-label` существующему Pagination. В клиентском
режиме total равен количеству записей после фильтрации. При уменьшении набора отображаемая страница
ограничивается допустимым диапазоном; props владельца не переписываются.

`rowSelection` включает Checkbox-колонку; объект
`{ getCheckboxProps: (record) => ({ disabled, 'aria-label': ... }) }` позволяет
отключить отдельные строки и изменить их доступное имя. `selectedRowKeys`
поддерживает привязку. Выбор всех строк затрагивает только доступные строки
текущей страницы и сохраняет ключи с других страниц. Заголовок игнорирует
disabled-строки при расчёте checked/indeterminate и отключается, если доступных
строк нет. При выключенной пагинации выбор всех относится ко всему набору.
Выбранные ключи сохраняются после замены или удаления записей, пока владелец
или пользователь не изменит выбор.

`onChange({ action, pagination, sorter, currentDataSource, filters })` вызывается
при пользовательской сортировке, фильтрации или смене страницы/размера.
`action` равен `sort`, `filter` или `paginate`, pagination содержит
`{ current, pageSize, total }`, а currentDataSource в клиентском режиме — весь отфильтрованный и
отсортированный набор до разбиения на страницы. Filters передаётся при наличии
фильтруемых колонок.
`onSelectionChange(keys, records, { type })` вызывается отдельно; type равен
`single` или `all`. Records идут в порядке выбранных ключей и содержат только
записи, присутствующие в текущем dataSource, включая скрытые фильтром;
отсутствующие записи не кэшируются.
Внешние изменения props, данных и колонок не вызывают эти callbacks.

Для отдельных таблиц доступны начальные `defaultCurrent`, `defaultPageSize`,
`defaultSorter`, `defaultSelectedRowKeys`, которые читаются один раз. При
привязке задавайте начальные значения у владельца. Для сброса присвойте
`sorter=null`, `selectedRowKeys=[]` и нужную страницу.

`loading` выставляет aria-busy, показывает статус загрузки и блокирует
сортировку, выбор и пагинацию. `disabled` наследуется из ConfigProvider и может
быть явно переопределён. Интерактивное содержимое собственных snippets
отключает владелец. `empty` заменяет текст пустого состояния snippet.
Размер наследуется из `componentSize`; доступны `bordered`, `caption`,
`aria-label`, `class` и `style`. `scroll.x` задаёт минимальную ширину таблицы:
горизонтальная прокрутка остаётся внутри фокусируемого контейнера.

### Раскрываемые строки

`expandable` добавляет перед колонкой выбора отдельную колонку с кнопками
раскрытия. `expandedRowRender(record, index)` — типизированный snippet с
подробностями; index начинается с 0 среди строк данных текущей страницы.
`rowExpandable(record)` позволяет скрыть кнопку и подробности отдельных строк.
По умолчанию раскрытие доступно для каждой переданной записи.

```svelte
<script lang="ts">
  import { Button, Table, type TableColumn, type TableKey } from 'antd-svelte';

  interface Person { key: number; name: string; email: string; active: boolean }
  const people: Person[] = [
    { key: 0, name: 'Анна', email: 'anna@example.com', active: true },
    { key: 1, name: 'Борис', email: 'boris@example.com', active: false }
  ];
  const columns: TableColumn<Person>[] = [{ key: 'name', title: 'Имя', dataIndex: 'name', width: 200 }];
  let expanded = $state<TableKey[]>([0]);
</script>

{#snippet details(person: Person, index: number)}<p>{index + 1}. {person.name}: {person.email}</p>{/snippet}
<Button onclick={() => { expanded = []; }}>Свернуть все</Button>
<Table dataSource={people} {columns} caption="Участники"
  expandable={{ expandedRowRender: details, rowExpandable: (person) => person.active,
    fixed: true, expandedRowKeys: expanded, onExpandedRowsChange: next => { expanded = next; } }} />
```

`expandable.expandedRowKeys` управляется владельцем через
`expandable.onExpandedRowsChange`. Для локального состояния доступны
`expandable.defaultExpandedRowKeys`, которые читаются один раз. `[]` сворачивает все строки.
Раскрытие использует тот же rowKey, что и выбор; числовой `0` и строковый `"0"`
различаются. Ключи сохраняются при сортировке, фильтрации, смене страниц,
замене/удалении данных, выключении expandable и изменении rowExpandable.
Подробности отображаются только для доступных строк текущего dataSource и страницы;
кэша записей нет. Возвращённая запись с сохранённым ключом снова раскрывается.

Пользовательское переключение обновляет внутренние ключи и вызывает
`expandable.onExpand(expanded, record)`, затем `expandable.onExpandedRowsChange(keys)`.
Управляемые ключи обновляет владелец; callbacks сами не меняют его массив.
[Замер официального UMD](../../../tools/fixtures/ant-design-current-table-expansion-observation.json)
фиксирует отказ владельца, принятие новых ключей и порядок callbacks.
Keys содержит все раскрытые ключи, включая отсутствующие на текущей странице.
Внешние изменения props не вызывают эти callbacks. Раскрытие не меняет выбор
или пагинацию и не вызывает общий onChange. currentDataSource и total считают
только записи, строки подробностей в них не входят.

`expandable.columnWidth` принимает число или CSS-ширину; default без source-темы —
48px, в теме Ant Design ширина выводится из глобальных метрик.
`columnTitle` задаёт видимый заголовок; по умолчанию он только доступен скринридеру.
`fixed: true` закрепляет колонку у начала строки, включая RTL. Смещения и colspan
учитывают раскрытие, выбор и данные. При горизонтальной прокрутке содержимое
подробностей остаётся в ширине видимой области. Ширины колонок данных сохраняются.

Кнопка имеет type=button и aria-expanded; в раскрытом состоянии aria-controls
ссылается на существующий блок подробностей с уникальным ID. Enter и Space
переключают состояние и сохраняют фокус на кнопке. Loading и disabled блокируют
переключение, disabled наследуется из ConfigProvider. Подписи задаются через
`locale.table.expandColumn`, `expandRow`, `collapseRow`.

Snippet создаётся только для видимой раскрытой строки. Сворачивание, скрытие
фильтром, уход со страницы или запрет rowExpandable удаляют его из DOM и
сбрасывают локальное состояние controls. Данные, которые нужно сохранить,
держите у владельца. SSR сразу отображает переданные раскрытые строки.
Раскрытие нажатием на всю строку, forceRender и иерархические данные пока не
поддерживаются. Живой пример карточек участников доступен на `/ant-design`.

### Видимость заголовка колонок

`showHeader` по умолчанию true. False удаляет `thead`, сохраняя caption, title/footer,
данные, сортировку и выбор строк. Внешние изменения видимости не вызывают onChange.
Пустой title snippet сохраняет панель. Класс ant-table-no-header применяется
при отсутствии title и showHeader=false; в bordered-таблице CSS скругляет
верхние углы первой строки body по исходным правилам.

Без шапки ширины fixed columns берутся из первой обычной строки tbody и заново
измеряются после замены страницы или восстановления пустого набора. Закрепление
и expanded viewport работают в LTR/RTL. Скрытие шапки удаляет её открытый фильтр;
содержимое и фокус controls в остающихся body rows сохраняются.
Сравнение 48 состояний UMD: [browser](../../../tests/browser/table-header.spec.ts),
[SSR](../../../tests/package/table-header.ssr.test.ts), fixture `?fixture=table-header`.

### Видимость колонок

`TableColumn.hidden` по умолчанию false. True убирает col/header/body cells
колонки и её controls из DOM. Сортировка и активные фильтры этой колонки
продолжают обрабатывать данные, как InternalTable перед rc-table. Переданный
список columns остаётся непустым.

При отсутствии видимых колонок данных остаются selection/expand cells.
Без них таблица показывает одну пустую ячейку на запись и пустой заголовок;
colgroup в этом случае отсутствует. Empty и expanded cells получают актуальный
colSpan, минимум 1. Восстановление колонок сохраняет выбранные/раскрытые строки,
controls соседних ячеек и expanded editor, focus/selection и FormData.
Смена hidden не вызывает onChange; controls самой скрытой колонки удаляются.

14 случаев UMD: [browser](../../../tests/browser/table-column-hidden.spec.ts),
[SSR](../../../tests/package/table-column-hidden.ssr.test.ts), fixture `?fixture=table-column-hidden`.
Сравниваются видимый текст, структура и selection controls. Raw textContent,
checkbox counts и colspan attributes сохранены: native TableFilter сохраняет
закрытый popover в DOM, а colSpan=1 может быть явным атрибутом.

### Заголовки строк

`TableColumn.rowScope` принимает `'row'` или `'rowgroup'`: ячейки данных этой
колонки становятся `th` с соответствующим scope, как в Ant Design 6.6.8.
Без настройки используются `td`. Заголовки колонок, selection/expand cells и
строки раскрытого содержимого сохраняют свою семантику. RowScope не объединяет
записи. У заголовков строк используются headerBg/headerColor/fontWeightStrong;
выделение строки и rowHoverable сохраняют исходные цвета.

Fixed row headers используют source headerBg поверх прежней непрозрачной
подложки native sticky cells. Это отдельные CSS-слои; raw UMD computed CSS
сохранён без подмены значений. Row → rowgroup обновляет scope без замены ячейки,
editor, focus/selection или FormData. Добавление/снятие rowScope меняет тег и
пересоздаёт содержимое ячейки, как source React.

18 случаев UMD, DOM/CSS и controls: [browser](../../../tests/browser/table-row-scope.spec.ts),
[SSR](../../../tests/package/table-row-scope.ssr.test.ts), fixture `?fixture=table-row-scope`.

### Классы и подсветка строк

`rowClassName` принимает строку или `(record, index, indent) => string` и добавляет
классы к основным классам строки и selection. Index начинается с 0 на текущей
странице после filter/sort; indent у поддерживаемых плоских данных равен 0.
Изменение callback или его реактивных зависимостей обновляет классы без замены
строки и её controls.

`rowHoverable` по умолчанию true и управляет встроенной подсветкой при наведении.
В source-теме используются rowHoverBg/rowSelectedHoverBg; native-only темы
сохраняют прежние стили. False снимает подсветку сразу, включая курсор внутри
строки, и сохраняет выбранное состояние, сортировку, focus и keyboard controls.
Проп не блокирует обработку пользовательских событий строки или inputs.

В закреплённом UMD после true → false HoverContext сохраняет подсветку даже
после ухода курсора. Raw [наблюдение](../../../tests/browser/fixtures/ant-design-table-hover-observation.json)
сохранено; native использует CSS guard и очищает paint сразу. Source classes
HoverContext записаны как диагностика, сравнение с native CSS :hover проверяет
цвета. Границы и текущие flat-row случаи покрывают
[browser](../../../tests/browser/table-row-options.spec.ts) и
[SSR](../../../tests/package/table-row-options.ssr.test.ts), fixture `?fixture=table-row-options`.

### Панели title и footer

`title` и `footer` принимают snippets с readonly-массивом записей текущей страницы.
В client mode он уже отфильтрован, отсортирован и ограничен пагинацией; без
пагинации передаётся весь обработанный набор. Server mode передаёт полученный
`dataSource` без повторного разбиения. Для пустого набора передаётся `[]`.

```svelte
<Table dataSource={people} {columns} caption="Участники">
  {#snippet title(currentPage)}На странице: {currentPage.length}{/snippet}
  {#snippet footer(currentPage)}Всего баллов на странице:
    {currentPage.reduce((sum, person) => sum + person.score, 0)}
  {/snippet}
</Table>
```

Панели находятся внутри `.ant-table` до и после scroll container. Caption
сохраняет нативную подпись таблицы. Переданный пустой snippet сохраняет панель
и её отступы; отсутствие snippet убирает панель. Footer использует footerBg и
footerColor, обе панели — padding/font текущего размера и border/radius темы.
Смена страницы, сортировки, фильтра, loading или темы сохраняет содержимое
остающихся snippets и не создаёт дополнительных onChange callbacks.
Source comparison: [browser](../../../tests/browser/table-panels.spec.ts),
[SSR](../../../tests/package/table-panels.ssr.test.ts), fixture `?fixture=table-panels`.

### Префиксы Table

`prefixCls` задаёт локальные классы Table; без непустого значения используется
`ConfigProvider.prefixCls + '-table'`. Checkbox, Pagination, Button и shell фильтра
разрешают общий prefix независимо от владельца таблицы. `dropdownPrefixCls`
задаёт префикс списка фильтров (`-menu`), как в исходном FilterDropdown;
он не меняет общий namespace shell и controls.

В upstream собственный dropdownPrefixCls оставляет filter Menu без соответствующих
CSS selectors; raw прозрачный фон сохранён отдельно от public inherited-prefix
counterpart. Svelte сохраняет прежнее оформление списка; только menu background
сравнивается с counterpart, остальные свойства — с raw Source.

187 правил закреплённого CSS изолированы по паре owner/shared prefix.
Публичные component tokens и marker `ant-table-css-var` сохраняют canonical имена,
а private `nested-border-top` следует общему namespace. Source theme, оформление
по умолчанию, fixed offsets/scroll и нативные controls сохраняются при обновлении
префикса. Открытый фильтр сохраняет draft/focus/IDs; раскрытая строка — editor,
выделение текста и FormData. Проверки: [browser](../../../tests/browser/table-prefix.spec.ts)
и [SSR](../../../tests/package/table-prefix.ssr.test.ts).

### Компонентная тема Table

`ConfigProvider.theme.components.Table` применяет исходные component tokens и
aliases к ячейкам, границам, сортировке, hover/selection, expand controls и фильтрам.
Поддержаны algorithms, custom cssVar prefix, вложенные provider и обновления
после mount. Local `style` сохраняет приоритет. Смена темы не пересоздаёт строки,
не меняет выбор/сортировку и не сбрасывает draft/focus в раскрытом snippet.

Native default size по-прежнему наследует `componentSize` (`medium` без настройки).
В теме Ant Design ширина selection column берётся из `selectionColumnWidth`,
а expand column — из исходной формулы `controlInteractiveSize + padding × 2`;
явный `expandable.columnWidth` имеет приоритет. Без source-темы обе колонки
сохраняют default 48px. Для fixed cells сохраняется непрозрачная подложка.

Summary, tree indentation и отдельная sticky scrollbar ещё не реализованы:
соответствующие declarations готовятся, но сами по себе не добавляют этот API.
Сравнение с эталоном, границы покрытия и наблюдение root style описаны в
[справочнике темы](../theme-context.md#тема-table).

### Закрепление заголовка и колонок

`scroll.y` задаёт максимальную высоту прокручиваемой области вместе с caption
и заголовком. Число означает пиксели, строка — CSS-длину, например `"20rem"` или
`"calc(100vh - 240px)"`. Заголовок остаётся сверху при вертикальной прокрутке;
Pagination находится снаружи этой области. Без scroll.y высота не ограничена
и заголовок прокручивается вместе с таблицей.

`column.fixed` принимает `true` (то же, что `"start"`), `"start"`, `"end"` или
`false`. Start закрепляет колонку у начала строки, end — у конца; в RTL стороны
меняются автоматически. `rowSelection={{ fixed: true }}` закрепляет колонку
выбора у начала строки. По умолчанию колонки не закреплены.

```svelte
<script lang="ts">
  import { Table, type TableColumn } from 'antd-svelte';

  interface Person { key: number; name: string; team: string; tasks: number }
  const people: Person[] = Array.from({ length: 30 }, (_, index) => ({
    key: index, name: `Участник ${index + 1}`, team: 'Разработка', tasks: index
  }));
  const columns: TableColumn<Person>[] = [
    { key: 'name', title: 'Участник', dataIndex: 'name', width: 200, fixed: true },
    { key: 'team', title: 'Команда', dataIndex: 'team', width: '24rem' },
    { key: 'tasks', title: 'Задачи', dataIndex: 'tasks', width: 100, fixed: 'end' }
  ];
</script>

<Table dataSource={people} {columns} caption="Участники"
  rowSelection={{ fixed: true }} scroll={{ x: 1000, y: 320 }} pagination={false} />
```

Несколько колонок с одной стороны получают смещения по фактической ширине
ячеек, включая закреплённую колонку выбора. Ширина пересчитывается при resize,
изменении содержимого и состава колонок. Можно использовать числовые и CSS-ширины;
для предсказуемого макета задавайте width и scroll.x. Если суммарная ширина
закреплённых колонок не меньше ширины области, горизонтальное закрепление
временно отключается. Все колонки доступны через прокрутку, заголовок остаётся
закреплённым. При расширении области закрепление восстанавливается.

Используется одна нативная таблица с CSS sticky. Порядок фокуса и snippets
сохраняется; отступы прокрутки учитывают закреплённые области. Фильтры используют
верхний слой popover и обновляют положение при прокрутке и изменении ширин.
Закреплённые ячейки имеют непрозрачный фон с учётом темы, сортировки и выбора.
ResizeObserver отключается при изменении конфигурации и unmount.

SSR сохраняет полную разметку, данные и CSS-закрепление заголовка. Горизонтальное
закрепление активируется после измерения ширин в браузере; до гидратации
колонки доступны обычной прокруткой. Изменения layout не вызывают onChange или
onSelectionChange. Фильтрация, сортировка, выбор и пагинация сохраняют поведение
в обоих режимах данных. В галерее `/ant-design` переключатель находится в примере
Table с API.

### Фильтры колонок

В клиентском режиме в колонке задаются плоский список `filters: [{ text, value }]` и предикат
`onFilter(value, record)`. Значения — string, number или boolean; числовой `0`
и `false` сохраняют тип. Несколько выбранных значений одной колонки объединяются
через OR, фильтры разных колонок — через AND.

```svelte
<script lang="ts">
  import { Table, type TableColumn, type TableFilters } from 'antd-svelte';

  interface Person { key: number; name: string; active: boolean }

  const people: Person[] = [
    { key: 0, name: 'Анна', active: true },
    { key: 1, name: 'Борис', active: false }
  ];
  const columns: TableColumn<Person>[] = [
    { key: 'name', title: 'Имя', dataIndex: 'name' },
    {
      key: 'active', title: 'Статус', dataIndex: 'active', filterMultiple: false,
      filters: [{ text: 'Активен', value: true }, { text: 'Приостановлен', value: false }],
      onFilter: (value, person) => person.active === value
    }
  ];
  let filters = $state<TableFilters>({});
</script>

<Table dataSource={people} {columns} bind:filters caption="Участники" />
```

`filters` таблицы — объект, где ключ соответствует `column.key`, а значение
содержит массив выбранных значений. Для отдельной таблицы доступен `defaultFilters`,
который читается один раз; при привязке задавайте начальное состояние у владельца.
`filterMultiple` по умолчанию равен true и использует Checkbox; false включает
одиночный выбор нативными radio.

Пункты меню меняют черновик. «Применить» подтверждает его и закрывает меню;
«Сбросить» очищает черновик, после чего нужно нажать «Применить». Escape,
нажатие снаружи и уход фокуса отменяют неподтверждённые изменения. Повторное
открытие начинает с применённого состояния. Изменение применённых значений колонки,
вариантов, режима выбора, disabled/loading или удаление колонки закрывают
устаревшее меню.

Пользовательское применение изменившегося фильтра задаёт `current=1` и вызывает
один `onChange` с `action='filter'`. Неизменившийся набор значений не вызывает
callback и не сбрасывает страницу. Если настроены фильтруемые колонки,
`onChange` также получает `filters` с нормализованными активными критериями;
без таких колонок формат прежних событий сохраняется. В типе TableChange
поле filters опционально. В клиентском режиме `currentDataSource` содержит отфильтрованный и
отсортированный набор до пагинации, pagination.total — его длину.

Внешние изменения filters, dataSource и columns не вызывают callbacks и не
переписывают страницу владельца. Дубликаты значений удаляются; неизвестные
варианты, удалённые колонки и колонки без списка/предиката в клиентском режиме игнорируются при
отображении. В одиночном режиме используется первое допустимое значение.
Состояние владельца сохраняется, поэтому возвращённая колонка может снова
применить свой фильтр. Выбранные строки сохраняют ключи при скрытии фильтром;
«выбрать всё» затрагивает только доступные строки видимой страницы.

Меню использует нативный popover поверх прокручиваемой таблицы. Tab перемещает
фокус между controls, Space переключает Checkbox, стрелки меняют radio,
Enter на пункте подтверждает фильтр, Escape закрывает меню с возвратом к кнопке.
Меню остаётся в границах viewport и наследует тему, RTL и `locale.table`:
`filterTitle`, `filterApply`, `filterReset`.

### Серверный режим

`mode="server"` показывает переданную страницу `dataSource` целиком и в исходном
порядке. Table не фильтрует, не сортирует и не разрезает её повторно, даже если
переданы локальные `sorter`/`onFilter` или число строк отличается от pageSize.
Передавайте `total` из ответа API: он определяет диапазон Pagination. Если total
не указан, используется длина dataSource. Его нормализация совпадает с Pagination.
`pagination={false}` скрывает навигацию и сохраняет все переданные строки.

Для удалённой сортировки задавайте `column.sorter: true`; для фильтра достаточно
`column.filters` без `onFilter`. Значение `sorter: true` используется только в
серверном режиме; компаратор поддерживается в обоих режимах, но исполняется только
в клиентском. Правила нормализации фильтров, одиночного выбора и цикл сортировки
сохраняются. Сортировка сохраняет страницу, применение изменившегося фильтра
задаёт страницу 1.

`onChange` получает текущие `pagination`, `sorter`, `filters` и причину действия.
В серверном режиме `currentDataSource` содержит только переданную страницу,
а `pagination.total` — внешний total. Строки остаются прежними до замены
dataSource владельцем. Внешние обновления props не вызывают callback и не
переписывают состояние владельца, включая current при уменьшении total.
Владелец должен запросить допустимую страницу, если текущая больше нового
диапазона; Table сам запросов не выполняет.

`selectedRowKeys` сохраняет ключи между заменами страниц. `onSelectionChange`
передаёт все выбранные ключи, но records содержит только выбранные записи,
присутствующие в текущем dataSource. Кэш записей других страниц отсутствует.
Выбор всех действует на доступные строки загруженной страницы.

В приложении [пример удалённой таблицы](https://woodger.org/ant-design#server-table)
показывает полную связку. [Модель загрузки](https://woodger.org/ant-design#server-table)
принадлежит presentation и не входит в пакет UI. Её loader получает
`{ current, pageSize, sorter, filters }` и `AbortSignal`, возвращает
`Promise<{ rows, total }>`. Модель отменяет предыдущий запрос и игнорирует его
поздний ответ, даже если источник не поддерживает отмену. Во время загрузки строки
очищаются; ошибка доступна отдельно, retry повторяет последний запрос. При
уменьшении total модель запрашивает исправленную страницу перед публикацией строк.
На unmount вызывается dispose для отмены и блокировки поздних обновлений.

Минимальное подключение модели в этом приложении:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, Table, type TableColumn } from 'antd-svelte';
  import { createRemoteTable } from '$lib/presentation/ant-design/remote-table.model.svelte';
  import { createMemberSource, type RemoteMember } from '$lib/presentation/ant-design/remote-members';

  const remote = createRemoteTable(createMemberSource().load);
  const columns: TableColumn<RemoteMember>[] = [
    { key: 'name', title: 'Участник', dataIndex: 'name', sorter: true },
    { key: 'tasks', title: 'Задачи', dataIndex: 'tasks', sorter: true }
  ];
  onMount(() => { void remote.load(); return remote.dispose; });
</script>

{#if remote.error}<p role="alert">{remote.error}</p><Button onclick={remote.retry}>Повторить</Button>{/if}
<Table mode="server" {columns} dataSource={remote.rows} total={remote.total}
  bind:current={remote.current} bind:pageSize={remote.pageSize}
  bind:sorter={remote.sorter} bind:filters={remote.filters}
  loading={remote.loading} onChange={remote.change} caption="Удалённые участники" />
```

Источник примера имитирует API в памяти с задержкой и управляемой ошибкой;
реального endpoint в проекте нет. Для своего API замените loader, передавайте
signal в fetch и возвращайте строки страницы вместе с общим количеством.
В примере загрузка начинается на onMount; SSR отображает пустую таблицу без запросов.
