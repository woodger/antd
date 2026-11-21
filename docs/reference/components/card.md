# Card

Card, CardGrid и CardMeta соответствуют Card/Grid/Meta эталона. Слоты
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

