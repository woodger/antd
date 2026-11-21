# Эталон Ant Design и лицензии

## Локальные исходники Ant Design

[Реестр покрытия и инструменты переноса](readme.md)
содержат сводку возможностей, рецепты CSS и отдельные маршруты браузерных фикстур.

Официальный React-репозиторий используется как эталон при переносе:
`.upstream/ant-design` от корня проекта. Это отдельный Git-клон, исключённый
из Git проекта через корневой `.gitignore`. Рабочая копия закреплена на
[Ant Design 6.6.8](https://github.com/ant-design/ant-design/tree/984592267de88fbf9cdaecc96a56629e721c709d),
commit `984592267de88fbf9cdaecc96a56629e721c709d`.

Для восстановления копии из корня проекта:

```sh
mkdir -p .upstream
git clone --depth 1 --single-branch --branch 6.6.8 https://github.com/ant-design/ant-design.git .upstream/ant-design
git -C .upstream/ant-design rev-parse HEAD
```

Клон содержит файлы релиза с сокращённой Git-историей. Для чтения исходников
установка зависимостей не требуется. Новую целевую версию выбираем отдельно
от переноса очередного компонента.

В `components/<component>/` доступны реализация и типы, `style/`, `demo/`,
`__tests__/` и документация `index.en-US.md`. Например, у Button основной файл —
`components/button/Button.tsx`, у Avatar — `components/avatar/Avatar.tsx`.
Общие механизмы находятся в `components/_util/`, токены и алгоритмы тем —
в `components/theme/`, переводы — в `components/locale/`.

Поиск в исключённой рабочей копии выполняется явно:

```sh
rg --files --hidden --no-ignore .upstream/ant-design/components/avatar
```

Перед переносом сверяем исходник, props, демо и граничные случаи в тестах;
затем реализуем Svelte API, документируем поддержанный объём и проверяем его
в наших unit/SSR/Chromium-тестах. Часть логики Ant Design делегирует пакетам
`@rc-component/*`; для неё также нужны исходники соответствующей версии пакета.
Стили в `vendor/` по-прежнему происходят из опубликованного npm-архива,
описанного ниже; checkout дополняет его исходниками и тестами.

## Источник и лицензия

Статический theme API использует algorithms/alias Ant Design 6.6.8,
палитры @ant-design/colors 8.0.1, семантику getComputedToken из cssinjs 2.1.2
и FastColor 3.0.1. Сохранены лицензии
[colors](../../../src/lib/vendor/LICENSE.ant-design-colors),
[cssinjs](../../../src/lib/vendor/LICENSE.cssinjs) и
[FastColor](../../../src/lib/vendor/LICENSE.fast-color).

Стили взяты из `dist/antd.css` официального
[пакета antd 6.6.8](https://registry.npmjs.org/antd/-/antd-6.6.8.tgz).
В [vendor/antd.css](../../../src/lib/vendor/antd.css) оставлены правила Button, Input, Select,
Checkbox, Pagination, Table, Modal, Form и связанные animations; глобальные токены
сохранены. В [vendor/radio.css](../../../src/lib/vendor/radio.css) добавлены обычные Radio и
RadioGroup из того же архива; [vendor/switch.css](../../../src/lib/vendor/switch.css) содержит
Switch вместе с правилами reduced motion.
Общий эффект Wave извлечён отдельно в [vendor/wave.css](../../../src/lib/vendor/wave.css);
рецепт wave сохраняет все восемь исходных правил без keyframes.
InputNumber outlined находится в [vendor/input-number.css](../../../src/lib/vendor/input-number.css),
адаптация тем и reduced motion — в theme.css и InputNumber.svelte.
[vendor/slider.css](../../../src/lib/vendor/slider.css) содержит Slider с одним бегунком из
того же архива; нативный control и reduced motion адаптированы в
[SliderSingle.svelte](../../../src/lib/SliderSingle.svelte).
[vendor/slider-prefix.css.js](../../../src/lib/vendor/slider-prefix.css.js) воспроизводится
рецептом slider-prefix из 54 правил того же архива. Runtime заменяет componentCls
и descendant resets; marker и CSS variable names сохраняются. Defaults ограничены
корнем, а native aliases восстанавливаются отдельным bridge после template.
[vendor/tooltip.css](../../../src/lib/vendor/tooltip.css) содержит базовые Tooltip и стрелку
из того же архива. Native popover, позиционирование и reduced motion реализованы
в TooltipPopup.svelte и popup.dom.ts; тёмная тема адаптирована в theme.css.
[vendor/popover.css](../../../src/lib/vendor/popover.css) содержит базовые Popover и стрелку
из того же архива. Общая DOM-логика поверхностей находится в popup.dom.ts;
расчёт положения переиспользует tooltip.engine.ts. Popover.svelte и popover.dom.ts
добавляют интерактивное содержимое, ARIA-связь и управление фокусом.
[vendor/popconfirm.css](../../../src/lib/vendor/popconfirm.css) содержит Popconfirm из того же
архива. Popconfirm.svelte использует Popover для поверхности и фокуса,
а popconfirm.model.svelte.ts связывает результат действия с текущим открытием.
[vendor/menu.css](../../../src/lib/vendor/menu.css) содержит 201 правило Menu из того же архива:
items, группы, подменю, три режима, light/dark/RTL и токены; collapse/slide/zoom
motion исключены. Рецепт menu воспроизводит файл; корни ограничены
:where(.ant-menu-css-var). Menu/MenuList/MenuSubMenu адаптируют Svelte snippets,
native buttons/links/popover и refs, menu.engine.ts — key paths/selection/навигацию.
Theme.css связывает цвета и геометрию с общей темой и compact.
[vendor/dropdown.css](../../../src/lib/vendor/dropdown.css) содержит базовое меню Dropdown,
команды, разделитель, danger/disabled, стрелку и токены из того же архива.
Dropdown.svelte добавляет нативные menu buttons и управление фокусом;
dropdown.engine.ts — навигацию и typeahead, popup.dom.ts — поверхность и выравнивание.
Корневые селекторы Dropdown ограничены :where(.ant-dropdown-css-var), чтобы
не менять существующие popover-фильтры Table с классом ant-dropdown.
[vendor/tabs.css](../../../src/lib/vendor/tabs.css) содержит line/card, расположения, индикатор
и токены Tabs из того же архива. Селекторы корня ограничены
:where(.ant-tabs-css-var), группы с общими declarations сохранены.
Tabs.svelte и tabs.engine.ts управляют выбором и фокусом, TabsPanel.svelte —
временем жизни содержимого; tabs.dom.ts измеряет индикатор и прокручивает заголовки.
[vendor/tabs-editable.css](../../../src/lib/vendor/tabs-editable.css) дополняет их 13
исходными правилами add/remove, размеров, focus и RTL. Рецепт tabs-editable
воспроизводит их из закреплённого архива; прежний tabs.css сохранён.
TabsEditIcon использует точные PlusOutlined/CloseOutlined из icons-svg 4.6.0
под существующей MIT-лицензией; их пути совпадают с официальным UMD Ant Design.
[vendor/tabs-layout.css](../../../src/lib/vendor/tabs-layout.css) содержит исходное
правило centered; рецепт tabs-layout сохраняет селекторы и declaration margin:auto.
[vendor/tabs-overflow.css](../../../src/lib/vendor/tabs-overflow.css) содержит 16 исходных
правил More/operations/listbox/remove/RTL без motion selectors. TabsOverflow.svelte
управляет popup, tabs-overflow.engine.ts повторяет visible range и навигацию rc-tabs,
tabs-overflow.dom.ts сохраняет native scroll и переносит тот же Add с заглушкой.
[vendor/tabs-overflow-motion.css](../../../src/lib/vendor/tabs-overflow-motion.css) добавляет
74 исходных slide-up/down rules и четыре keyframes. Общие phase selectors
ограничены :where(.ant-tabs-dropdown) без роста specificity; placement overrides и
повторные source groups сохранены.
Раздельные actions и touch повторяют @rc-component/trigger 3.10.1; его
[MIT-лицензия](../../../src/lib/vendor/LICENSE.rc-trigger) включена в пакет.
EllipsisOutlined взят из icons-svg 4.6.0; regexp is-mobile 5.0.0 сопровождается
[исходной MIT-лицензией](../../../src/lib/vendor/LICENSE.is-mobile).
[vendor/collapse.css](../../../src/lib/vendor/collapse.css) содержит 49 правил Collapse и его
токены из того же архива. Корневые селекторы ограничены
:where(.ant-collapse-css-var); React motion и правила ColorPicker исключены.
Collapse.svelte адаптирует заголовки к нативным кнопкам и управляет DOM-фокусом,
collapse.engine.ts — ключами и выбором доступного заголовка,
CollapsePanel.svelte — временем жизни содержимого. Темы и отступы кнопок
адаптированы в theme.css и scoped-стилях компонента.
[vendor/drawer.css](../../../src/lib/vendor/drawer.css) содержит 32 правила модального Drawer
и его токены из того же архива. Корневые селекторы ограничены
:where(.ant-drawer-css-var); React motion, resizable, skeleton и inline/pure
исключены. Drawer.svelte адаптирует нативный dialog и жизненный цикл содержимого;
drawer.dom.ts управляет модальностью и отменяемой Web Animations API-анимацией,
drawer.engine.ts — размерами, направлением ухода и длительностью.
[vendor/alert.css](../../../src/lib/vendor/alert.css) содержит 37 правил Alert из того же
архива: четыре статуса, outlined/filled, banner и токены. Корневые селекторы
ограничены :where(.ant-alert-css-var); React motion исключён. Alert.svelte
управляет закрытием, alert.dom.ts — отменяемой анимацией, notice.dom.ts — фокусом.
Scoped-стили адаптируют мобильные действия и размер кнопки закрытия.
[vendor/message.css](../../../src/lib/vendor/message.css) содержит 21 правило Message из того
же архива: базовую поверхность, верхнее положение, пять статусов и токены.
Корневые селекторы ограничены :where(.ant-message-css-var); React motion,
collapsing stack и остальные положения исключены. MessageHolder.svelte и
MessageNotice.svelte адаптируют нативный popover и обычный поток списка;
message.dom.ts предоставляет общий механизм notice.dom.ts для видимости
контекста и отменяемой Web Animations API-анимации. Theme.css связывает фон с
темой, иконки переиспользуют Icon.svelte.
[vendor/notification.css](../../../src/lib/vendor/notification.css) содержит 45 правил из того
же архива: шесть положений, статусы, описание, actions, кнопку закрытия и токены.
Корневые селекторы ограничены :where(.ant-notification-list); React motion,
stack, progress и pure-panel исключены. NotificationHolder.svelte и
NotificationNotice.svelte адаптируют нативную поверхность и обычный поток списков;
notice.dom.ts управляет видимостью, фокусом и анимацией. Иконки переиспользуют
существующий Icon.svelte и status-icons.ts.
[vendor/progress.css](../../../src/lib/vendor/progress.css) содержит 26 правил line/circle и
active keyframes из того же архива. Корневые селекторы ограничены
:where(.ant-progress-css-var); steps, success-сегмент и percentPosition исключены.
Progress.svelte адаптирует SVG, доступность, переполнение, RTL-анимацию и reduced
motion; progress.engine.ts нормализует значения/размеры и рассчитывает дугу.
Theme.css связывает цвет, фон и текст с токенами темы. Иконки переиспользуют
существующий Icon.svelte и лицензированные status-icons.ts.
[vendor/spin.css](../../../src/lib/vendor/spin.css) содержит 27 правил и два keyframes из того
же архива: standalone/embedded Spin, четыре точки, размеры и токены.
Корневые селекторы ограничены :where(.ant-spin-css-var); правила Listy,
fullscreen и percent исключены. Spin.svelte адаптирует доступность, inert,
перенос текста и reduced motion, spin.model.svelte.ts управляет ожиданием,
spin.dom.ts — парковкой/возвратом фокуса. Новые иконки и лицензии не добавлены.
[vendor/skeleton.css](../../../src/lib/vendor/skeleton.css) содержит 48 правил и один keyframe
из того же архива: составной Skeleton, пять primitives, active, round и block.
Корневые селекторы ограничены :where(.ant-skeleton-css-var). Рецепт skeleton-prefix
выводит CSS data module для локального prefix primitives с теми же 48 правилами.
Skeleton.svelte использует декоративный div для title, постоянную группу,
отдельный status, адаптивный flex-layout, пропорции аватара и reduced motion.
skeleton.engine.ts рассчитывает конфигурацию; skeleton.dom.ts сохраняет фокус
при замене children. Theme.css связывает градиент с fill-токенами темы.
Новые иконки и лицензии не добавлены.
[vendor/empty.css](../../../src/lib/vendor/empty.css) содержит все 15 правил default/simple/small
из того же архива. Корневые селекторы ограничены :where(.ant-empty-css-var).
Empty.svelte адаптирует snippets, локаль, inert-изображение, перенос текста и footer.
EmptyImage.svelte переносит геометрию es/empty/empty.js и es/empty/simple.js:
paths, ellipse, circle, viewBox и transforms сохранены. Native SVG patterns заменяют
getAsSolidColor, накладывая fill-токен на colorBgContainer с уникальными $props.id(),
без title. При явной source theme empty-image.engine.ts повторяет getAsSolidColor
из закреплённого исходника с локальным портом FastColor 3.0.1; SVG получает исходный title.
Рецепты empty/empty-prefix проверяют архив и воспроизводят CSS и local prefix template.
feedback.dom.ts управляет общим для Empty/Result focusin/MutationObserver
и восстановлением после tick.
SVG включены в исходники и покрываются существующей MIT-лицензией Ant Design.
[vendor/result.css](../../../src/lib/vendor/result.css) содержит все 20 правил Result из того
же архива; корни ограничены :where(.ant-result-css-var). Result.svelte добавляет
нативный заголовок, snippets, перенос текста/действий и мобильные ограничения.
ResultImage.svelte переносит геометрию и цвета es/result/unauthorized.js,
noFound.js и serverError.js: добавлены viewBox и декоративная семантика,
удалены SVG title. Новая лицензия для этих SVG не требуется.
[vendor/steps.css](../../../src/lib/vendor/steps.css) содержит все 147 правил Steps
из того же архива; воспроизводится рецептом steps. Варианты сохранены;
корни ограничены :where(.ant-steps-css-var), role-button selectors адаптированы
к классу интерактивного шага. Declarations сохранены. Steps.svelte адаптирует
структуру es/steps и нативные кнопки, локаль, responsive и reduced motion;
steps.dom.ts восстанавливает фокус шагов и использует общий feedback.dom.ts
при unmount. React/@rc-component зависимости не добавлены; ellipsis SVG
использует существующую MIT-лицензию icons.
[vendor/tag.css](../../../src/lib/vendor/tag.css) содержит 85 правил Tag/CheckableTag из того
же архива: ссылки, группа и селектор DatePicker исключены; корни ограничены
:where(.ant-tag-css-var). Declarations сохранены. Tag.svelte и CheckableTag.svelte
добавляют нативные buttons, snippets, перенос текста, тёмную тему, reduced motion
и восстановление фокуса через feedback.dom.ts. Listener закрытия использует
Svelte attachment с cleanup. Используется существующий Icon close; новые
зависимости, иконки и лицензии не добавлены.
[vendor/tag-links.css](../../../src/lib/vendor/tag-links.css) добавляет четыре исходных
правила ссылок Tag, а [vendor/tag-link-reset.css](../../../src/lib/vendor/tag-link-reset.css) —
два исходных набора общего link reset (14 правил), ограниченных marker Tag.
Преобразование сохраняет specificity a/псевдоклассов, focus-visible и порядок
исходного CSS; остальные ссылки документа этот reset не затрагивает.
[vendor/tag-group.css](../../../src/lib/vendor/tag-group.css) содержит одно исходное
правило CheckableTagGroup: flex, wrap и token gap; правило извлекается CSS-рецептом.
[vendor/tag-prefix.css.js](../../../src/lib/vendor/tag-prefix.css.js) — CSS data module
из того же архива: 90 правил Tag, CheckableTag/Group, preset/status и ссылок,
без DatePicker и keyframes. Runtime меняет component class selectors и shared
reset selectors, сохраняя marker ant-tag-css-var, anticon и имена CSS variables.
Scoped native styles используют стабильные markers для root/close и состояния цвета,
поэтому согласованные native behavior и themes работают с локальным prefixCls.
Runtime добавляет native font rule с прежней specificity; disabled close сохраняет
not-allowed, хотя исходный anticon[tabindex] показывает pointer.
[vendor/badge.css](../../../src/lib/vendor/badge.css) содержит 52 правила Badge и keyframes
antStatusProcessing из того же архива. Селекторы Radio/Space, ссылок и анимации
цифр/появления исключены; корни ограничены :where(.ant-badge-css-var), declarations
сохранены. Badge.svelte добавляет standalone-позиционирование без ScrollNumber,
описания, логические offsets, обводку под фон темы и reduced motion.
Новые зависимости, иконки и лицензии не добавлены.
[vendor/badge-custom-count.css](../../../src/lib/vendor/badge-custom-count.css) содержит
пять исходных правил готового count и antBadgeLoadingCircle;
[vendor/badge-count-digits.css](../../../src/lib/vendor/badge-count-digits.css) — три правила
ScrollNumber/SingleNumber slots. Селекторы и декларации извлечены
из того же архива; JS-план разрядов реализован в BadgeDigit/BadgeNumber.
[vendor/badge-zoom.css](../../../src/lib/vendor/badge-zoom.css) содержит четыре исходных
правила CSSMotion и четыре keyframes для обычного и самостоятельного Badge;
lifecycle реализован в Badge и badge-zoom.dom по @rc-component/motion 1.3.3.
[vendor/badge-prefix.css.js](../../../src/lib/vendor/badge-prefix.css.js) содержит portable
CSS template из того же архива: 59 правил и шесть keyframes для локального Badge prefix.
Селекторы Badge/common reset меняются в badge-prefix.engine; ScrollNumber selectors
следуют общему prefix. CSS-variable marker, icon selectors и keyframe names сохраняются. Тела деклараций
не меняются; обычные vendor-файлы остаются прежними. ES-модуль генерируется рецептом
badge-prefix через тот же CSS CLI, без runtime import с Vite-specific ?raw.
[vendor/badge-ribbon.css](../../../src/lib/vendor/badge-ribbon.css) содержит 27 правил
Badge.Ribbon из того же архива: wrapper, indicator, content/corner, логические
placement, RTL и preset colors. Декларации сохранены; корни ограничены классами
.ant-ribbon-wrapper-css-var и .ant-ribbon-css-var.

[badge-ribbon-prefix.css.js](../../../src/lib/vendor/badge-ribbon-prefix.css.js) содержит те же
27 правил как CSS data module; рецепт badge-ribbon-prefix проверяет закреплённый
SHA-256. [Engine](../../../src/lib/badge-ribbon-prefix.engine.ts) меняет общий префикс selectors,
сохраняя markers и namespace variables; локальный Ribbon.prefixCls остаётся независимым.
[vendor/avatar.css](../../../src/lib/vendor/avatar.css) содержит 17 правил Avatar из того же
архива, включая display:block для Image. Group и anticon исключены,
declarations сохранены.
Корни ограничены :where(.ant-avatar-css-var), исходный класс токенов заменён
на .ant-avatar-css-var. Avatar.svelte добавляет Svelte snippets, доступное имя,
версию источника изображения и нативные listeners с cleanup; avatar.dom.ts
подгоняет текст через ResizeObserver без React/@rc-component зависимостей.
Существующая MIT-лицензия сохранена; новые зависимости и сторонние иконки не добавлены.
[vendor/avatar-group.css](../../../src/lib/vendor/avatar-group.css) содержит три исходных правила
Avatar.Group из того же архива: display, обводку и перекрытие. Declarations
сохранены. AvatarGroup.svelte адаптирует перенос и фон обводки; отдельный
AvatarGroupOverflow.svelte использует существующий Popover и ленивый список
с полными именами. Восстановление фокуса использует feedback.dom.ts.
Avatar сохраняет версию src/srcSet при обновлении spread props с теми же
значениями, Popover игнорирует blur после destroy. Новые зависимости не добавлены.
[vendor/avatar-prefix.css.js](../../../src/lib/vendor/avatar-prefix.css.js) содержит 24
исходных правила Avatar/Group, включая anticon и Popover. CSS-рецепт проверяет
архив и число правил; runtime меняет component selectors и ограничивает shared
reset/alias declarations текущим prefix через :is/:where с исходной specificity.
Marker, имена CSS variables и глобальные Image/anticon selectors сохраняются;
стили соседних стандартных Avatar не сбрасываются. Native text/icon wrappers,
group wrap/overflow и resource cleanup остаются в Svelte-компонентах.
Пять filled-иконок в [status-icons.ts](../../../src/lib/status-icons.ts) скопированы из
[Ant Design Icons](https://github.com/ant-design/ant-design-icons/tree/7f2516ac91226d2b41f93b35cb5197c8d94f7189/packages/icons-svg/svg/filled)
и подключены к существующему Icon.svelte с сохранением outline-иконок.
Их отдельная [MIT-лицензия](../../../src/lib/vendor/LICENSE.ant-design-icons) включена в пакет.
Селекторы
`.css-var-_R_0_` заменены на `:root`/`.ant-svelte-theme` и классы компонентов.
SHA-256 исходного архива записан в заголовке файла.

Компоненты и модели реализованы на Svelte. [theme.css](../../../src/lib/theme.css) связывает
статические токены компонентов с переключаемыми темами. Текст исходной
[лицензии MIT](../../../src/lib/vendor/LICENSE.ant-design) сохранён в пакете. Официальная
React-реализация развивается в [ant-design/ant-design](https://github.com/ant-design/ant-design).
