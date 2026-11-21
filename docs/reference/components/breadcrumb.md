# Breadcrumb

Breadcrumb использует nav/ol/li и items: { key?, title?, href?, path?, menu? }.
Title/separator/dropdownIcon принимают string/number/boolean/Snippet. Snippet
title должен быть пассивным; для собственных интерактивных элементов используйте
itemRender. Default title=0 отображается как "0", true — как "true" после
строкового преобразования upstream; null/undefined/false/пустая строка пропускают
item без menu. Нативные props, class/rootClassName/style и bind:nativeElement
относятся к nav. Имя landmark задавайте через aria-label/aria-labelledby.

Path удаляет один начальный slash, подставляет каждый params[key] один раз и
добавляет сегмент к предыдущим path: href="#/" + paths.join('/'). Пустые сегменты
сохраняются; URL encoding не выполняется. Path перекрывает href только на самом
item с path; item с одним href не добавляет сегмент. Title подставляет все
совпадения :key, но falsy parameter оставляет исходный текст. Эти особенности
взяты из getPath/getBreadcrumbName 6.6.8.
React children sugar Breadcrumb.Item/Separator заменён массивом items.

Separator берётся из local prop, ConfigProvider.breadcrumb.separator, затем "/";
null/undefined переходят к следующему уровню, false/"" отключают
автоматический разделитель. { type:'separator', separator? } создаёт отдельный
aria-hidden li, даже при отключённых автоматических разделителях; его default
также "/". Как в исходнике, последний видимый item может сохранить разделитель,
если после него есть пустые items. Последний href не удаляется автоматически.
Aria/data атрибуты item и class передаются default a/span/button. OnClick без
href создаёт нативную кнопку type=button вместо clickable span upstream.

ItemRender — Snippet<[route, params, originalItemsOrRoutes, paths]>, который
полностью задаёт содержимое li. Paths содержит накопленный префикс текущего item.
Шаблон непрозрачен для родителя: пустой Snippet сохраняет li; React callback с
null мог удалить его. В custom menu template задайте свой нативный trigger.
ClassNames/styles поддерживают root/item/separator, объект либо callback ({ props });
ConfigProvider.breadcrumb задаёт общие class/style и semantic defaults. Классы
накапливаются; root style слои идут после component variables: context semantic,
context plain, local semantic, local plain. Item/separator styles применяются на li.
Callbacks получают resolved separator и прежние native defaults остальных Props:
в частности, params={} при отсутствии prop. Исходное отсутствие params в callbacks
сохранено отдельно в [raw reference](../../../tests/browser/fixtures/ant-design-breadcrumb-config-reference.json).
Конкретный тип params и itemRender сохраняется; config принимает те же semantic
callbacks, что локальные Props.
Item.style в закреплённом BreadcrumbItem.tsx не применяется; сохранено поведение
кода, для стилей элемента используйте styles.item либо itemRender.

Menu.items принимает key/title/label/path/disabled/danger/onClick. Label имеет
приоритет над title; truthy path конкатенируется с разрешённым href родителя без
добавления slash. Raw menu.items.href сам по себе не создаёт ссылку в upstream
и здесь не используется; навигацию задаёт path. DropdownProps передаются текущему
Svelte Dropdown с placement=bottom по умолчанию. DropdownIcon берётся из local
prop, ConfigProvider.breadcrumb.dropdownIcon, затем используется обычная стрелка;
null/undefined переходят к следующему уровню, false скрывает её, 0 отображается.
Нативные links меню сохраняют href и
поддерживают Enter/Space, callback/preventDefault, typeahead и disabled. Это
адаптация прежнего плоского Dropdown; произвольные React Menu options ещё не
поддержаны. Тема/compact/RTL наследуются через ConfigProvider.

Undefined component config наследует родительский record; явно заданный объект,
включая {}, заменяет его целиком. Смена стилей, separator/icon и items сохраняет
ключевые DOM nodes, native href, фокус и callbacks. Иконки и разделители могут
быть Snippet; существующая нативная обёртка Dropdown сохраняется.

Обёртка Dropdown внутри пункта Breadcrumb сохраняет базовую линию текста
соседних links/span/button, в том числе при переносе цепочки и custom itemRender.
Это локальное правило Breadcrumb; шрифты и выравнивание отдельного Dropdown
не меняются.
Ссылки Breadcrumb во всех режимах темы используют linkDecoration,
linkHoverDecoration и linkFocusDecoration, по умолчанию none. Reset ограничен
компонентом; inline стили ссылок имеют приоритет, оформление внешних links не меняется.
В menu с custom itemRender внешняя обёртка не добавляет остановку Tab;
возврат фокуса после Escape направляет его в первый доступный нативный control
этого пункта.

При source-настройках темы `components.Breadcrumb` получает семь исходных defaults:
цвета пунктов, ссылок, последнего пункта и разделителей, размер иконок и отступ
разделителя. Поддержаны aliases, component algorithms, CSS prefix/hash,
нули и undefined. Цвет стрелки меню наследуется от пункта, цвет текста ссылки
задаётся отдельно; custom dropdownIcon и semantic styles сохраняют этот порядок.
Semantic root styles и plain style имеют приоритет после component tokens.
Popup использует собственные Dropdown/Menu scopes. Обновление темы сохраняет
нативные ссылки, фокус, навигацию и callbacks; native-only оформление сохранено.

Галерея — `/ant-design#breadcrumb`, фикстуры — `?fixture=breadcrumb`,
`?fixture=breadcrumb-theme` и `?fixture=breadcrumb-config`.
Unit/SSR/Chromium покрывают маршруты, параметры, разделители, шаблон, стили,
меню, отмену перехода и production hydration. Рецепт breadcrumb извлекает 21
правило без keyframes. Полный Menu API остаётся в полном объёме миграции.

PrefixCls задаёт root/item/link/overlay/separator classes; empty/undefined
наследуют ConfigProvider.prefixCls (по умолчанию ant-breadcrumb), local prefix
имеет приоритет. Semantic callbacks получают исходное локальное значение.
Смена prefix сохраняет DOM ссылок и открытого меню, focus, callbacks и navigation.
Canonical theme marker, Native Dropdown wrapper/baseline и link decoration states
сохранены; настройки Dropdown/Menu принадлежат своим семействам.
CSS-рецепт breadcrumb-prefix воспроизводит те же 21 правило как module template.

В 6.6.8 BreadcrumbSeparator игнорирует local owner prefix: при prefixCls="trail"
в provider prefixCls="suite" его class остаётся suite-breadcrumb-separator,
боковые margins становятся 0px вместо 8px. Native передаёт owner prefix и
разделителям. [Эталон](../../../tests/browser/fixtures/ant-design-breadcrumb-prefix-reference.json)
сохраняет raw classes/geometry и matchedSeparators: публичный classNames.separator
добавляет Source нужный owner class, без изменения UMD. Проверки:
[browser](../../../tests/browser/breadcrumb-prefix.spec.ts),
[SSR](../../../tests/package/breadcrumb-prefix.ssr.test.ts), `?fixture=breadcrumb-prefix`.

Raw reference сохраняет полный textContent исходника. Сверка текста использует
видимые trigger/separator fragments: закрытый native Dropdown сохраняется в DOM,
а пробелы между элементами Svelte не меняют содержимое пунктов.

