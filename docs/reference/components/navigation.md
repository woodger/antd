# Навигация

## Breadcrumb

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

## Anchor

`Anchor` содержит `items` с key/href/title/target/class, вложенными children,
replace и targetOffset; title принимает текст, число или Snippet. В horizontal
вложенные items не монтируются. Ссылки остаются
нативными a: Tab и Enter работают без дополнительного keyboard engine.

```svelte
<Anchor affix={false} showInkInFixed items={[
  { key: 'intro', href: '#intro', title: 'Введение' },
  { key: 'api', href: '#api', title: 'API', targetOffset: 48 }
]} />
```

По умолчанию Affix включён; `affix` принимает false/true или дополнительные
Affix props без offsetTop/target/children. getContainer возвращает окно
или HTMLElement и используется для scroll и Affix. Приоритет контейнера:
getContainer → ConfigProvider.getTargetContainer → window. Undefined во вложенном
provider сохраняет родительскую функцию; локальный prop имеет приоритет. `offsetTop`
задаёт закрепление; `targetOffset` переопределяет scroll offset, per-link
`targetOffset` имеет высший приоритет, включая 0. `bounds` по умолчанию 5px.
Выбирается наиболее близкий к границе уже достигнутый раздел; порядок items
не заменяет сравнение координат. Raw fragment после # не декодируется, пробелы
сохраняются; используется исходное регулярное выражение Ant Design.

`onClick(event,{title,href})` вызывается перед scroll. preventDefault отменяет
только изменение URL; выбор и анимация всё равно выполняются как в upstream.
Внутренние href используют history.pushState/replaceState (без :target эффекта),
HTTP(S) сохраняют нативный переход, при replace — location.replace.
Item.replace переопределяет общий replace.
`getCurrentAnchor(rawHref)` меняет визуальное выделение; onChange получает
исходный href. Повторная прокрутка с тем же mapped highlight не дублирует callback,
выбор другой raw ссылки сохраняет callback даже при одинаковом highlight.

Прокрутка использует исходную cubic easing длительностью 450ms. Во время
анимации scroll tracking приостановлен; повторный выбор той же ссылки не
перезапускает анимацию, другая ссылка отменяет предыдущую. Удаление компонента
снимает scroll listener и отменяет RAF. SSR не читает getContainer/DOM,
не выбирает active link и не закрепляет контент. Фокус остаётся на ссылке.

`classNames`/`styles` — объект либо функция от {props}, слоты root/item/itemTitle/
indicator. `ConfigProvider.anchor` задаёт общие class/style и semantic defaults.
Undefined наследует родительский record; явно заданный объект, включая {},
заменяет его целиком. Semantic classes накапливаются; root style слои идут после
component variables и вычисленного max-height: context semantic, context plain,
local semantic, local plain. Callback получает текущие Props с resolved direction;
прежние native defaults остальных Props сохранены. Class/rootClassName и
bind:nativeElement относятся к wrapper. `showInkInFixed` сохраняет исходный
класс ant-anchor-fixed при false/affix=false. Тема и RTL наследуются; horizontal
indicator использует offsetLeft/clientWidth и раскрывает активную ссылку
в scrollable ancestors как upstream.

Изменения semantic styles/classes сохраняют ссылки, фокус и callbacks и обновляют
геометрию индикатора. Runtime владеет top/height/left/width индикатора; изменение
его цвета сохраняет эти координаты. Обнаруженный upstream дефект пересчёта
сохранён [отдельно с raw замерами](../anchor-indicator-observation.md).

Базовые отступы пункта Anchor — 4px по вертикали и 16px перед текстом.
У первого горизонтального пункта отступ по inline-оси нулевой; у вложенного
вертикального пункта padding-block равен paddingXXS / 2, обычно 2px.
Переменные отступов объявлены в том же CSS scope, который использует корень
компонента; пользовательский gap для разделения ссылок не требуется.

При source-настройках темы Anchor применяет `components.Anchor`: defaults берутся
из paddingXXS/padding, затем действуют component overrides и отдельный algorithm.
Source compact уменьшает inline-отступ до 8px; native-only compact сохраняет 16px.
Вложенный padding-block по-прежнему равен paddingXXS / 2, независимо от
linkPaddingBlock. Aliases меняют шрифт, цвета и границы; нули/undefined и custom
CSS prefix поддерживаются. Переменные доступны при SSR, semantic/plain styles
сохраняют приоритет. Source-ссылки используют linkDecoration/linkHoverDecoration/
linkFocusDecoration; по умолчанию подчёркивания нет.
Смена темы сохраняет ссылки, фокус, scroll и callbacks.

Для раскрытия ссылки сохранён framework-independent compute-scroll-into-view
3.0.2 (git 0c45c0afce9650b8cc96dd23ea8efdc90cbd32fe), удовлетворяющий ^3.0.2
делегата scroll-into-view-if-needed 3.1.0 (git
8ac397fc9119014eae13069615b16ef4e45b3d9f). Исходник находится в vendor,
единственное изменение алгоритмического файла — удаление неиспользуемого
catch binding; MIT-лицензии обоих пакетов сохранены рядом. Обёртка ограничена
опциями Anchor (if-needed/nearest и scroll margins); npm-зависимости не добавлены.
Сохранено ограничение делегата 3.0.2: отрицательный scrollLeft RTL-контейнера
не поддерживается при автоматическом раскрытии; нативная ручная прокрутка,
выбор и геометрия indicator доступны.
PrefixCls задаёт wrapper/content/link/indicator classes. Empty/undefined наследуют
ConfigProvider.prefixCls (по умолчанию ant-anchor), локальный prefix имеет приоритет.
Items по умолчанию наследуют разрешённый prefix Anchor; item.prefixCls позволяет
явный override, а пустая строка у item возвращает общий prefix провайдера.
Для отдельного item prefix нужны соответствующие внешние стили, как в Source.
Semantic callbacks получают исходный локальный prefix; canonical token marker
сохранён. Смена prefix сохраняет ссылки, refs, ink, фокус, callbacks и history.
Affix получает свой общий prefix независимо от локального prefix Anchor.

В 6.6.8 локальный Anchor.prefixCls не передаётся в items: ссылки остаются с общим
prefix, теряют отступы, а updateInk не находит активную ссылку. Native наследует
prefix владельца, сохраняя явный item override. В
[эталоне](../../../tests/browser/fixtures/ant-design-anchor-prefix-reference.json) записаны
оба случая: raw Source и matchedItems с тем же публичным prefixCls у каждого item,
без правки официального UMD. Сверка полной геометрии использует matchedItems;
исходное наблюдение оставлено для отдельного разбора.

Фикстура — `?fixture=anchor`, пример — `/ant-design#anchor`. Unit/SSR/Chromium
проверяют приоритеты offsets, callbacks/history, анимацию/cleanup, nested items,
RTL/indicator и production hydration. Source tokens и метрики проверяются
[по официальному UMD](../../../src/lib/theme-anchor-tokens-reference.test.ts) и
[в браузере](../../../tests/browser/anchor-theme.spec.ts). CSS-рецепты anchor и anchor-prefix
содержат 22 правила; второй хранит module template для local classes. Prefix
проверяют [browser](../../../tests/browser/anchor-prefix.spec.ts),
[SSR](../../../tests/package/anchor-prefix.ssr.test.ts) и fixture `?fixture=anchor-prefix`.

Ссылки items используют linkDecoration/linkHoverDecoration/
linkFocusDecoration также без cssVar; defaults равны none. Пользовательские
переменные и inline styles.itemTitle сохраняют приоритет.

## Menu

Первый этап следует Ant Design 6.6.8 и @rc-component/menu 1.5.0
(диапазон upstream ~1.5.0). React/rc-menu runtime не устанавливается;
[MIT-лицензия rc-menu](../../../src/lib/vendor/LICENSE.rc-menu) сохранена в пакете.

PrefixCls задаёт локальный namespace Menu, его пунктов, групп, Divider и подменю.
Пустая строка наследует ConfigProvider.prefixCls. Popup и inline-списки сохраняют
тот же префикс; Typography selectors используют независимый общий namespace.
Canonical variables/link reset и @scope границы тем сохранены. Шаблоны содержат
201 базовое и 77 scoped theme rules без motion и deprecated declarations.
Смена префикса сохраняет root/item/title DOM, selection/open state, refs, IDs и фокус.

У upstream dashed Divider пропускает локальный префикс владельца. [Raw измерения и
public per-divider prefixCls counterparts](../../../tests/browser/fixtures/ant-design-menu-prefix-reference.json)
сохранены отдельно; Svelte наследует согласованный prefix Menu и сохраняет dashed.
Независимый per-divider prefixCls этим этапом не добавляется.

```svelte
<script lang="ts">
  import { Menu, type MenuItemType } from 'antd-svelte';
  let selected = $state<string[]>(['overview']);
  let opened = $state<string[]>(['guides']);
  const items: MenuItemType[] = [
    { key: 'overview', label: overview },
    { key: 'guides', label: 'Руководства', children: [
      { key: 'setup', label: 'Подключение' },
      { key: 'forms', label: 'Формы' }
    ] }
  ];
</script>

{#snippet overview()}<a href="/overview">Обзор</a>{/snippet}
<Menu {items} mode="inline" selectedKeys={selected} openKeys={opened}
  onSelect={info => { selected = info.selectedKeys; }}
  onDeselect={info => { selected = info.selectedKeys; }}
  onOpenChange={keys => { opened = keys; }} aria-label="Навигация" />
```

Items принимает MenuItemType: обычный пункт, подменю с children,
`type='group'` с label/children, `type='divider'` с dashed либо null.
У пунктов и подменю обязательны стабильные key. Числовой key нормализуется в
строку для selection/open/events; исходное значение остаётся в itemData.
Label и extra пункта — string/number/Snippet, icon — Snippet. Поддержаны
item.disabled/danger/title, class/style; у подменю также theme/popupClassName
и onTitleClick. Группы не добавляют уровень отступа и не входят в keyPath.
Theme подменю меняет только его popup; следующее подменю без собственного theme
использует тему корневого Menu. Для native popover правила light/dark дополнительно
ограничены CSS @scope: тема родителя не переходит во вложенный popup. Базовые
нескопированные правила сохранены для браузеров без поддержки @scope.

SelectedKeys/openKeys задают controlled state; defaultSelectedKeys/defaultOpenKeys
читаются при создании для uncontrolled state. По умолчанию выбран один пункт,
selectable=true, multiple=false. OnClick пункта, его подменю от ближайшего к корню
и Menu вызываются до onSelect/onDeselect. Info содержит key, keyPath от листа
к корню, domEvent и itemData — поверхностную копию исходного пункта. Select info
добавляет selectedKeys. Устаревший React instance info.item отсутствует.
Повторная активация выбранного single-пункта сохраняет `[key]`, но вызывает
onDeselect: это поведение rc-menu 1.5.0. В multiple выбранный key удаляется.
Selectable=false сохраняет onClick и закрытие popup без изменения selection.

Mode по умолчанию vertical; поддержаны horizontal и inline. Hover открывает
popup-подменю; triggerSubMenuAction='click' переключает их по клику. Inline
раскрывается по клику независимо от этого prop. SubMenuOpenDelay и
subMenuCloseDelay — секунды, обе задержки по умолчанию 0.1, как runtime rc-menu
1.5.0 (таблица Ant Design указывает open delay=0). OnTitleClick относится к
клику заголовка; keyboard opening меняет openKeys без этого callback.
Single selection закрывает все popup-подменю, multiple сохраняет их.
Закрытие inline-подменю сохраняет descendant openKeys; закрытие popup удаляет их.

InlineIndent по умолчанию 24 px. InlineCollapsed переводит inline в vertical;
при отсутствии prop учитывается LayoutSider.collapsed. Возврат в inline
восстанавливает кэш uncontrolled openKeys. Controlled openKeys остаются у владельца:
если он принял `[]` при сворачивании, компонент не заменяет этот массив кэшем.
Первый уровень без icon сокращается до первого символа; доступное имя и native
подсказка title сохраняют текст. Полный Tooltip API для collapsed items пока отсутствует.

Закрытые подменю монтируются при первом открытии; forceSubMenuRender монтирует
их заранее, сохраняя закрытые popup скрытыми в том числе в horizontal mode.
Inline скрывает сохранённый DOM через hidden, popup использует native
popover и общий механизм позиционирования. Боковое подменю выравнивается по верху
заголовка, horizontal popup — по нижнему левому краю, в RTL по правому; поверхность
переворачивается/сдвигается в пределах viewport. Outside click закрывает её;
Escape внутри popup закрывает текущий уровень и возвращает фокус к родителю.
Таймеры, listeners и animation frames очищаются при unmount.

GetPopupContainer задаёт HTMLElement или ShadowRoot для popup каждого подменю.
Без локального prop используется ConfigProvider.getPopupContainer; собственный
`getPopupContainer={undefined}` отключает это наследование, как Ant wrapper.
Getter получает native button заголовка (в React это div). Без getter сохраняется
прежнее native-размещение. Обычный inline не вызывает getter; при
forceSubMenuRender с getter создаются также скрытые popup-копии inline-подменю,
которые не заменяют refs основного списка. Getter с объявленным параметром ждёт
DOM-заголовок; zero-arity getter при force render может сначала получить undefined.
SSR getter не вызывает. Смена функции с тем же контейнером сохраняет DOM, draft,
выделение и фокус; смена самого контейнера пересоздаёт popup contents, как React portal.
Вынесенные подменю сохраняют клавиатуру, hover-задержки, callbacks и theme variables.
Стили внутри ShadowRoot подключает потребитель. Сверка существующих подменю покрыта
32 снимками официального UMD и фикстурой `?fixture=menu-container`; горизонтальный
overflow More в эти гарантии пока не входит и остаётся отдельным этапом.

Структура — ul/li с role=menu/menuitem/group/separator. Заголовки подменю используют
native button, a[href] в label остаётся настоящей ссылкой. Menu не перехватывает
переход, модификаторы, target/rel; native Enter на ссылке запускает callback
один раз через click вместо дублирования legacy React keydown/click.
Ссылки label и групп используют исходный link reset во всех режимах Menu,
включая inline/popup-подменю и отдельный popup container, без зависимости от cssVar.
LinkDecoration/linkHoverDecoration/linkFocusDecoration и inline styles сохраняют
приоритет; ссылки вне Menu не меняются. Рецепт menu-link-reset извлекает 14 общих
правил из закреплённого CSS. Сверка:
[39 UMD-сценариев](../../../tests/browser/fixtures/ant-design-menu-link-decoration-reference.json) и
[browser](../../../tests/browser/menu-link-decoration.spec.ts), `?fixture=menu-link-decoration`.

Inline Up/Down обходят все видимые доступные пункты, Enter переключает подменю.
Horizontal Left/Right меняют пункты первого уровня с учётом RTL, Down/Enter входят
в popup. В popup Up/Down обходят текущий уровень, Left/Right входят/возвращаются
с учётом RTL. Home/End переходят к границам текущего списка; в inline — всего
видимого дерева. Disabled пропускается. Space не активирует пункты/подменю, как
upstream. Ref.focus(options) предпочитает ссылку в пункте; findItem({key}) возвращает
смонтированный элемент пункта/заголовка, bind:nativeElement — корневой ul.

Theme='light' по умолчанию независимо от алгоритма страницы; theme='dark' задаёт
тёмную палитру Menu с фоном #001529. Глобальные primary/compact/RTL наследуются.
При source-настройках темы `components.Menu` получает исходные defaults и aliases:
размеры пунктов/иконок/групп, отступы, active bar и light/dark цвета. Отдельные
component algorithms, CSS prefix и hash поддержаны. Устаревшие имена токенов
сопоставляются после расчёта defaults, как upstream; явно переданные нули сохраняются.
Вложенные inline-списки наследуют переменные корневого Menu, popup получает
собственный scope. Его переменные обновляются без потери позиции и фокуса.
Plain style имеет приоритет на корневом меню; popup использует component tokens,
как отдельная поверхность upstream. Native-only темы сохраняют прежнее оформление.
Source compact использует itemHeight=35px и collapsedWidth=70px.
Как Ant wrapper, Menu учитывает только свой disabled и disabled пунктов:
Form.disabled и ConfigProvider.componentDisabled не отключают навигацию.
Галерея — `/ant-design#menu`, изолированная фикстура — `?fixture=menu`.

Первый этап не включает responsive horizontal overflow/overflowedIndicator,
исходные popup/collapse motion, controlled activeKey/defaultActiveFirst,
component config вне темы, semantic classNames/styles, prefixCls, render hooks,
placements/offset и overrides expandIcon/itemIcon. Deprecated
Menu.Item/SubMenu/ItemGroup/Divider children wrappers исключены из переноса; данные
задаются items. Standalone Menu пока не расширяет существующий контракт Dropdown.

## Dropdown

```svelte
<script lang="ts">
  import { Button, Dropdown } from 'antd-svelte';

  let open = $state(false);
  let lastAction = $state('');
</script>

<Dropdown
  bind:open
  trigger={['click']}
  menu={{
    items: [
      { key: 'details', label: 'Открыть карточку' },
      { key: 'export', label: 'Экспорт', disabled: true },
      { key: 'divider', type: 'divider' },
      { key: 'archive', label: 'В архив', danger: true }
    ],
    onClick: ({ key }) => { lastAction = key; }
  }}
>
  <Button>Действия</Button>
</Dropdown>
<output>{lastAction}</output>
```

`menu.items` принимает readonly-массив DropdownItem. Команда имеет строковый key,
label (строку или пассивный Snippet), необязательные icon, textValue, disabled,
danger и onClick. Разделитель имеет `{ key, type: 'divider' }`. Пустой строковый
ключ допустим; при повторении ключа используется первое вхождение. Icon декоративный.
Для snippet со сложным или нетекстовым содержимым задайте textValue: он служит
доступным именем команды и текстом поиска. В label не следует вкладывать кнопки,
ссылки и поля ввода. Пустой список показывает ConfigProvider.locale.emptyText.

Для навигации item поддерживает href/target/rel: вместо button создаётся a с
role=menuitem. Это Svelte-адаптация link label исходного Menu без вложения ссылки
в кнопку. Disabled link не получает href и имеет aria-disabled=true. Enter и
Space активируют его; preventDefault в callbacks отменяет и нативный переход,
и закрытие меню. Без href сохраняется прежняя нативная кнопка команды.

Open поддерживает bind:open; defaultOpen читается при создании компонента.
Без внешнего open состояние хранится отдельно от входных props: обновление
spread-объекта сохраняет открытое/закрытое меню, DOM команд и focus, без callbacks.
Изменение defaultOpen после mount не сбрасывает состояние. При снятии внешнего
open сохраняется прежний fallback к начальному defaultOpen.
`onOpenChange(boolean)` сообщает запросы видимости от trigger, hover, Escape,
Tab и клика снаружи. Изменение open владельцем и закрытие из-за disabled
не вызывают callback. В существующем Svelte API выбор команды закрывает меню и обновляет
binding **без onOpenChange(false)**; для команды используйте menu.onClick.
Исходный Ant Design 6.6.8 вызывает callback и при выборе команды, передавая
второй аргумент с source; это расширение текущего Svelte API ещё не перенесено.
Сначала вызывается onClick пункта, затем menu.onClick; оба получают
`{ key, domEvent: MouseEvent }`. PreventDefault в пункте отменяет следующий
обработчик и закрытие, в menu.onClick — закрытие. Асинхронные операции и их ошибки
обрабатывает владелец; Dropdown не показывает loading и не ожидает Promise.

По умолчанию trigger равен `['hover']`; допустимы `'hover'`, `'click'`, их массив
и `[]` для внешнего управления. MouseEnterDelay/MouseLeaveDelay задаются в
секундах, по умолчанию 0.1. Уход указателя закрывает меню только при включённом
hover: внешне открытое меню с click или `[]` остаётся открытым. Hover не перемещает
фокус; click, Enter, Space и
ArrowDown фокусируют первую доступную команду, ArrowUp — последнюю. Стрелки
обходят команды по кругу, Home/End выбирают крайние, ввод букв ищет по префиксу.
Повтор буквы перебирает совпадения; пауза в секунду начинает новый поиск.
Disabled-пункты и разделители пропускаются. Если доступных команд нет, фокус
получает сам menu. Tab/ShiftTab закрывают меню и продолжают нативный порядок.
Escape и выбор команды возвращают фокус к trigger, если он оставался в меню.
При удалении trigger после действия новый фокус назначает владелец.

В children передавайте один нативный focusable control, обычно Button.
Dropdown связывает первый дочерний элемент с menu через aria-haspopup="menu",
aria-controls и aria-expanded, сохраняя исходные ARIA-атрибуты владельца.
`aria-label` именует меню; по умолчанию имя берётся от trigger. Class/style
относятся к wrapper trigger. Disabled наследуется от Form/ConfigProvider;
явное false переопределяет контекст. Нативный disabled trigger также не открывает меню.

PrefixCls задаёт локальный CSS-префикс Dropdown; пустая строка наследует общий
ConfigProvider.prefixCls. Trigger/popup/arrow и внутреннее меню получают классы
этого namespace; меню добавляет суффикс -menu. Button в trigger сохраняет собственный
общий prefix. Canonical theme variables и IDs/ARIA не переименовываются.
Смена префикса сохраняет открытый popover, DOM команд, фокус и typeahead по label.
77 исходных CSS-правил без motion и исходного title flex:auto изолированы по локальному и общему префиксам;
native wrapper, ссылки, reduced motion и bind:open/callback contracts сохранены.
Независимый menu.prefixCls входит в ещё не перенесённый полный Menu API.
Прежние label flex/min-width и явный dir popup сохранены. [Raw эталоны и public
counterparts через styles.itemContent/root.direction](../../../tests/browser/fixtures/ant-design-dropdown-prefix-reference.json)
разделяют эти Native границы и исходное оформление Ant Design.

Placement: top, topLeft, topRight, bottom, bottomLeft, bottomRight. По умолчанию
bottomLeft, в RTL — bottomRight. AutoAdjustOverflow по умолчанию true:
меню переворачивается и сдвигается в границах окна; false сохраняет запрошенное
положение. Минимальная ширина соответствует trigger, длинный список прокручивается.
Arrow по умолчанию false. Поверхность использует native popover, сохраняет
контекст темы и работает внутри Modal; закрытое меню остаётся смонтированным.
GetPopupContainer выбирает локальную функцию или ConfigProvider fallback;
undefined наследует provider. До первого открытия функция не вызывается.

При source-настройках темы `components.Dropdown` рассчитывает paddingBlock,
zIndexPopup и tokens стрелки; aliases задают шрифт, цвета, отступы и радиусы.
Внутренний список получает отдельный scope Menu: его aliases дополняют Dropdown,
как в исходной реализации. Например, `components.Menu.fontSize` меняет строки,
а `components.Menu.itemHeight` не заменяет `Dropdown.paddingBlock`.
Поддержаны component algorithms, CSS prefix/hash, нули, undefined и CSS-строки.
Source gap равен глобальному marginXXS плюс половина sizePopupArrow при arrow;
corner placements используют исходные arrowOffsetHorizontal. Обновления темы
сохраняют DOM, фокус и inline-позицию popup. Native-only оформление и существующие
bind:open/callback contracts сохранены.

Галерея `/ant-design#dropdown` показывает действия строки Table: открытие Modal,
копирование и архивирование участника. Первая версия ограничена плоскими командами:
интеграция standalone Menu, подменю, selectable/checkable items, contextMenu
и popupRender пока отсутствуют. Пункты с href уже создают нативные ссылки.
Deprecated Dropdown.Button исключён из переноса; актуальная композиция —
SpaceCompact с Dropdown и Button.

## Tabs

```svelte
<script lang="ts">
  import { Input, Tabs } from 'antd-svelte';

  let activeKey = $state<string | undefined>('profile');
</script>

{#snippet profile()}
  <label>Имя<Input defaultValue="Анна" /></label>
{/snippet}
{#snippet history()}<p>Последние изменения профиля.</p>{/snippet}

<Tabs
  aria-label="Разделы участника"
  bind:activeKey
  items={[
    { key: 'profile', label: 'Профиль', children: profile },
    { key: 'access', label: 'Доступ', disabled: true },
    { key: 'history', label: 'История', children: history }
  ]}
/>
```

`items` принимает readonly-массив TabsItem: строковый key, label (строку, число,
boolean/null или пассивный Snippet), необязательные children (Snippet), icon, disabled,
forceRender, destroyOnHidden, closable и closeIcon. Ключи идентифицируют панели при перестановке;
содержимое и его фокус сохраняются.
Пустой строковый ключ допустим; при повторении используется первое вхождение.
Icon декоративный. Label должен давать вкладке доступное имя; интерактивные
элементы внутри label не поддерживаются. `aria-label` или `aria-labelledby`
именует список вкладок. Id/class/style относятся к корневому контейнеру.

`items[].className` и `items[].style` относятся к соответствующему tabpanel,
а не к заголовку. Классы добавляются после classNames.content. CSS-строки применяются
в порядке styles.content → item.style → motion style; у каждой панели свои overrides.
Например: `{ key: 'profile', label: 'Профиль', children: profile, className: 'profile-panel', style: 'padding-inline:12px' }`.
Живое обновление оформления сохраняет DOM, local state, draft, selection и focus.

`bind:activeKey` хранит выбранный ключ. DefaultActiveKey читается при создании;
без ключа выбирается первая доступная вкладка. Для binding задавайте начальное
значение у владельца без defaultActiveKey. При неизвестном, удалённом или
отключённом ключе отображается первая доступная панель. Внешнее значение при
этом сохраняется: его восстановление снова выберет соответствующую вкладку.
Если доступных вкладок нет, ни одна панель не выбрана, а фокус может получить
сам tablist. Пустой items показывает ConfigProvider.locale.emptyText.

`onTabClick(key, MouseEvent)` вызывается и по клику, и при нативной активации
Enter/Space, включая уже выбранную вкладку. PreventDefault отменяет смену
панели. Затем обновляется binding и вызывается onChange(key), если выбранная
вкладка действительно изменилась. Обновления владельцем, изменение defaults,
fallback при удалении/disabled и перемещение фокуса не вызывают onChange.
После onTabClick доступность пункта проверяется повторно: обработчик может
удалить или отключить вкладку.

Клавиатура использует ручную активацию. Стрелки перемещают фокус по кругу,
пропуская disabled; Home/End выбирают первый/последний доступный заголовок.
В горизонтальном списке действуют Left/Right с учётом RTL, в вертикальном —
Up/Down. Enter и Space активируют сфокусированную вкладку. Заголовки добавляют
одну остановку Tab; после выхода повторный вход возвращает фокус к выбранной
вкладке. В line/card Tab из списка переходит к именованной активной панели, затем к её
полям и кнопкам. При скрытии сфокусированной панели или удалении/disabled
сфокусированного заголовка фокус переходит на доступный заголовок либо tablist.
Изменения при фокусе снаружи Tabs не перемещают его внутрь.

Содержимое ленивое: впервые монтируется при активации и по умолчанию сохраняется
в скрытой панели, включая локальный state дочерних компонентов и DOM-черновики.
DestroyOnHidden=true удаляет содержимое при скрытии, а при анимации панели — после
завершения leave; следующий визит создаёт
новый экземпляр. После уничтожения отключение destroyOnHidden само по себе
не монтирует панель заново. Значение на отдельном item переопределяет общее,
включая явное false. Это сохранённый контракт native v1: rc-tabs 1.13.0 отдаёт
приоритет явно заданному общему destroyOnHidden. ForceRender=true монтирует содержимое сразу и сохраняет
его даже вместе с destroyOnHidden. Удаление key всегда уничтожает панель.
Состояние, которое владелец хранит снаружи Tabs, уничтожение панели не сбрасывает.

Фикстура `?fixture=tabs-destroy` сопоставляет восемь актуальных сценариев официального
UMD: шесть совпадают с upstream, два фиксируют сохранённый приоритет item.

Сохранённая скрытая панель остаётся в DOM; её таймеры и подписки продолжают
работать. Поля посещённых/forceRender-панелей участвуют в нативной FormData,
даже когда скрыты; ещё не смонтированных или уничтоженных полей в FormData нет.
Tabs не является полем формы и не наследует disabled от Form/ConfigProvider:
доступность навигации задаётся disabled отдельных items. Заголовки используют
button type=button и не отправляют окружающую форму.

Type поддерживает line/card/editable-card, tabPlacement — top, bottom, start, end.
Start/end разрешаются относительно RTL. На экране шириной до 575px вертикальный
список переходит наверх. Переполнение прокручивается; навигация показывает
сфокусированный заголовок без прокрутки всей страницы. Size использует общий
ComponentSize: small/medium/large;
по умолчанию используется ConfigProvider.componentSize. Явный medium имеет
приоритет над размером провайдера.
Тема, compact, RTL и reduced motion применяются через существующие токены.

Source-тема применяет `theme.components.Tabs`: 26 исходных defaults, aliases и
component algorithms. Высоты карточек участвуют в вычислении padding до наложения
явных overrides; zero и undefined сохраняют исходное поведение. More popup наследует
тот же scope, включая CSS-variable prefix и hash. Стандартные native-темы сохраняют
прежнее оформление; source-тема допускает шапку ниже native минимума 32px.
Фикстура `?fixture=tabs-theme` сверяет 15 тем, 10 вариантов в LTR/RTL и popup
с официальным UMD; смена темы сохраняет DOM, черновики, выделение и фокус.

`animated` по умолчанию равен `{ inkBar: true, tabPane: false }`. False отключает обе
анимации, true включает обе без initial appear панели. Объект задаёт переключатели
независимо. `tabPane=true` заменяет весь переданный tabPaneMotion стандартным
`ant-tabs-switch`, включая его callbacks, как в 6.6.8.

Для собственного перехода передайте `animated={{ tabPaneMotion: motion }}` без
tabPane: rc-tabs включает его автоматически. Явное tabPane=false сохраняет motion,
но отключает body animated class. MotionName принимает строку с suffix фаз либо
объект имён. Поддержаны appear/enter/leave flags, leaveImmediately, deadline в ms,
visible/forceRender/removeOnLeave overrides, leavedClassName и lifecycle callbacks.
EventProps.className/style применяются в стабильном состоянии; CSS-фазы перекрывают
их. У скрытой forceRender-панели motion задаёт display:none, у сохранённой панели
leavedClassName перекрывает eventProps.className, как в исходном CSSMotion.
Собственный motionName требует CSS для перехода; положительный motionDeadline
завершает его без CSS end event. Prepare может вернуть Promise и работает даже
при `theme.token.motion=false`. Start/active получают native div и event=null,
возвращают CSS-строку после content styles; end получает native event либо
`{ deadline: true }`. Возврат false из end оставляет переход незавершённым.
Prepare/start читают DOM с prepare classes, active — со start classes.

Во время leave сохраняются DOM, local state и FormData уходящей панели. Aria-hidden
и inert сразу исключают её из навигации; owned focus переходит к новому заголовку.
Быстрое возвращение отменяет уничтожение. OnVisibleChanged вызывается после DOM
commit; первый невидимый mount не вызывает callback. Независимые deadline timers
не задают порядок между панелями, в том числе в upstream.
Native prefers-reduced-motion и живое отключение motion завершают CSS-переходы;
unmount отменяет frames, timers и продолжения prepare. Пустые native panel shells
и согласованный приоритет item destroy сохраняются.

`classNames` и `styles` принимают объект либо чистую функцию `({ props }) => slots`.
Доступны root/item/remove/indicator/body/content/header и popup.root; строка popup
сокращает запись popup.root. Styles используют CSS-строки. Remove применяется
к кнопкам удаления и в заголовках, и в More. Callback получает source size:
undefined без явного размера у компонента/провайдера, физический tabPlacement до
mobile fallback и items с нормализованным destroyOnHidden.
Остальные поля сохраняют переданные Svelte props; bind:activeKey остаётся живым.

`ConfigProvider.tabs` задаёт class/style, semantic slots, add/remove/more icons и
indicator. Отсутствующий record наследуется; явно переданный объект
во вложенном провайдере заменяет его целиком, как в Ant Design. Классы провайдера
и компонента накапливаются. Порядок root CSS: provider styles.root → provider style
→ local styles.root → local style; tabBarStyle идёт после styles.header.
Semantic indicator styles идут после вычисленной геометрии линии.

```svelte
<ConfigProvider tabs={{
  classNames: { header: 'section-tabs' },
  styles: { item: 'padding-inline:12px' },
  indicator: { size: 24, align: 'start' }
}}>
  <Tabs {items} classNames={{ content: 'section-panel' }} />
</ConfigProvider>
```

У More сохраняется исходный порядок: локальное more.icon, затем глобальные
tabs.more.icon ?? tabs.moreIcon, затем локальное moreIcon. Явное локальное
more.icon, включая null/false/undefined, перекрывает fallback. Глобальный tabs.more
использует только icon, как в 6.6.8; trigger и остальные параметры задаются локально.
Собственные поля more.overlayClassName/overlayStyle перекрывают semantic popup.root, даже при явном undefined.

`rootClassName` добавляет класс корню; нативные title/data-атрибуты и обработчики
передаются HTMLDivElement. `bind:nativeElement` предоставляет сам корневой div
после mount и очищается при unmount; SSR его не заполняет. Это Svelte binding,
без React ref wrapper. Aria-label/aria-labelledby сохраняют прежнее назначение:
именуют tablist. Обновления config/semantic styles сохраняют DOM, draft и фокус.

`indicator={{ size: 12.5, align: 'center' }}` задаёт длину и выравнивание линии.
Size также принимает чистую функцию `(origin) => origin - 20`: origin — полная
ширина горизонтального или высота вертикального заголовка с дробной точностью.
По умолчанию используется полный размер и align=center; start/end учитывают RTL.
Нули и отрицательные значения передаются в CSS без ограничения. Nullish
indicator.size наследует ConfigProvider.tabs.indicator.size.
Align наследуется отдельно.
Формулы, включая
end transform в RTL, повторяют rc-tabs 1.13.0. Измерение выполняется после mount;
SSR не вызывает size callbacks. Обновление откладывается на кадр, а сравнение
округлённых значений подавляет дрожание индикатора. Смена indicator не сбрасывает
прокрутку и не меняет фокус, выбранную вкладку или состояние панели.

OnTabScroll получает `{ direction: 'left' | 'right' | 'top' | 'bottom' }` при
изменении native scroll заголовков на текущей оси. Направления физические,
в том числе в RTL; фокусировка заголовка тоже может вызвать прокрутку.
Повторные scroll events при прежней позиции не вызывают callback. Браузер
может объединять соседние изменения в одно native событие; согласованная
прокрутка остаётся нативной, вместо transform/wheel/touch механизма React.
Смена callback не сбрасывает позицию, listener удаляется при unmount.

Centered=true центрирует горизонтальный список заголовков, пока хватает места.
Как в исходной реализации, вертикальный список растягивается по высоте, а
заголовки остаются сверху. TabBarGutter
задаёт отступ в px перед всеми заголовками, кроме первого, и перед кнопкой
добавления, если список не пуст. Нулевое значение убирает исходный отступ;
дробные и отрицательные значения сохраняются. По горизонтали используется
margin-inline-start с учётом RTL, по вертикали — margin-top; при мобильном
переходе наверх меняется и ось отступа. TabBarStyle принимает CSS-строку для
всей панели заголовков, включая extra content. Корневой style действует отдельно.
Например: `<Tabs {items} centered tabBarGutter={12} tabBarStyle="margin-bottom:8px" />`.

TabBarExtraContent задаёт правый слот либо { left, right }: string/number/boolean/
Snippet. Слоты находятся вне tablist и допускают нативные интерактивные controls;
они не участвуют в навигации стрелками. Как @rc-component/tabs 1.13.0, falsy extra
(включая 0) не создаёт wrapper; числовой label=0 при этом отображается.

В editable-card `onEdit(target, action)` запрашивает изменение у владельца:
add получает native click event, remove — строковый key, включая пустой.
Items и activeKey меняет владелец; edit сам по себе не вызывает onChange/onTabClick.
HideAdd=true скрывает добавление. Disabled и closable=false запрещают удаление;
closeIcon=null/false скрывают кнопку только при не заданном closable.
Closable=true сохраняет кнопку и использует fallback иконки. Приоритет —
truthy closeIcon, removeIcon, затем «×»; nullish removeIcon использует CloseOutlined.
Falsy addIcon использует PlusOutlined. Boolean true создаёт пустую иконку,
сохраняя доступное имя кнопки. Иконки — пассивные TabsContent/Snippet.

Delete/Backspace и средняя кнопка мыши запрашивают удаление и перемещают фокус
вперёд, а для последней доступной вкладки — назад; disabled пропускаются.
Это происходит и при отказе владельца менять items. Обычный click на close
не активирует вкладку. Фокус, явно заданный владельцем снаружи Tabs, сохраняется.
Close выбранной вкладки и Add доступны через Tab; остальные close имеют tabindex=-1.
Locale.addAriaLabel/removeAriaLabel задают имена с defaults «Add tab»/«remove».
Locale.dropdownAriaLabel именует listbox скрытых вкладок, по умолчанию «expanded dropdown»;
явная пустая строка сохраняется.

```svelte
<script lang="ts">
  import { Tabs, type TabsItem } from 'antd-svelte';

  let items = $state<TabsItem[]>([{ key: 'first', label: 'Первая вкладка' }]);
  let next = 1;
</script>

<Tabs type="editable-card" aria-label="Разделы" {items}
  locale={{ addAriaLabel: 'Добавить вкладку', removeAriaLabel: 'Закрыть вкладку' }}
  onEdit={(target, action) => {
    if (action === 'add') {
      const key = `new-${next++}`;
      items = [...items, { key, label: 'Новая вкладка' }];
    } else if (typeof target === 'string') {
      items = items.filter(item => item.key !== target);
    }
  }} />
```

При переполнении More показывает вкладки вне видимого диапазона, включая частично
обрезанные и disabled. Native scroll сохраняется; Add переходит в блок операций
с сохранением DOM-узла, фокуса и исходного card gutter. Определение мобильного
устройства повторяет default is-mobile 5.0.0, отдельно от breakpoint расположения:
на мобильном user agent More скрыт, прокрутка и Add остаются доступны.

Непустой `prefixCls` задаёт классы Tabs, навигации, панелей и More; пустое значение
наследует `ConfigProvider.prefixCls`. Имена switch используют локальный Tabs prefix,
default More slide — общий prefix, независимо от cssVar.prefix. Canonical theme
markers и shared keyframes сохраняются. Смена prefix сохраняет активную панель,
DOM/ref, draft/selection/focus и открытый popup с его редактором.
Внутренние запросы фокуса используют стабильные атрибуты. Editable/custom cells
прокручиваются целиком, включая кнопку удаления, чтобы активная вкладка не
попадала в More из-за видимого только текста.
Сверка: [официальный prefix-эталон](../../../tests/browser/fixtures/ant-design-tabs-prefix-reference.json),
[браузер](../../../tests/browser/tabs-prefix.spec.ts) и
[SSR](../../../tests/package/tabs-prefix.ssr.test.ts), `?fixture=tabs-prefix`.

More открывается через hover с задержками 0.1/0.1 секунды. `more.trigger` также
поддерживает click, focus, contextMenu и массив событий. `showAction` и `hideAction`
раздельно заменяют действия открытия и закрытия; пустой массив отключает сторону.
У contextMenu исходное закрытие — click. Hover без click получает touch toggle;
после touch hover игнорируется до следующего обработанного click.
Закрывающий focus срабатывает на blur кнопки, включая переход внутрь popup,
как в исходном Trigger.
ArrowDown/Enter/Space на
кнопке открывают список без выбора; Up/Down затем меняют активный пункт, пропуская
disabled. Первый Up сохраняет исходный выбор предпоследнего enabled-пункта.
Tab переносит фокус в список; его стрелки/Home/End двигают фокус по native options.
Выбор с кнопки More при hover оставляет список открытым, клик по option закрывает.
Клавиатурный выбор использует native click: публичный onTabClick по-прежнему получает
MouseEvent, включая его подтип PointerEvent. Close вызывает только onEdit, не закрывая
список; items меняет владелец. Escape сначала закрывает вложенную поверхность,
затем More, затем содержащий Modal.

`more.icon` перекрывает исторический moreIcon, включая null/false/0 и пустую строку.
Без них используется исходный EllipsisOutlined; явно заданный more.icon=undefined
даёт строку «More», как rc-tabs. У пустой декоративной кнопки остаётся native имя
«ellipsis». More принимает placement, mouseEnterDelay/mouseLeaveDelay, autoFocus,
minOverlayWidthMatchTrigger, overlayClassName/overlayStyle, onOverlayClick и
getPopupContainer; CSS styles задаются строкой. Корневой getPopupContainer
также поддерживается; одноимённый more override имеет приоритет,
включая явно заданный undefined. Portal сохраняет тему и собственные CSS variables popup.
ConfigProvider.getPopupContainer наследуется, если корневой prop Tabs отсутствует.
Явный root getPopupContainer=undefined выключает provider, как исходный spread props.
More имеет следующий приоритет, включая собственный undefined. Эти правила сохраняются
в props стандартной панели при renderTabBar; semantic callbacks получают raw props.

Выравнивание More повторяет rc-dropdown/rc-trigger 3.10.1. `placements` заменяет
таблицу целиком, `builtinPlacements` имеет приоритет; его явный undefined даёт пустую
таблицу Trigger. `align` неглубоко перекрывает выбранный placement, в том числе весь
overflow. Points физические и не отражаются в RTL. Offset и targetOffset принимают
числа или проценты от popup и target соответственно. Поддержаны flip/shift, исходное
значение adjust=0, области htmlRegion visible/scroll/visibleFirst и dynamicInset
для right/bottom, включая legacy _experimental.dynamicInset. Старые useCssRight,
useCssBottom, useCssTransform и ignoreShake исходный 3.10.1 не использует.

`alignPoint` использует последнюю client-точку click/hover/contextMenu. Без точки
keyboard/touch используют кнопку. В point mode default stretch выключен;
minOverlayWidthMatchTrigger=true включает его, собственный undefined выключает.
Point menu с click-hide закрывается при scroll/resize; hover сохраняет точку,
включая уход кнопки за viewport. `onPopupAlign` получает popup и фактический align
после flip, перед записью offsets. Количество вызовов не фиксируется; idle frames
не создают callback loop. При нулевом scale выравнивание/callback пропускается.
CSS overlayStyle имеет приоритет над offsets и arrow variables.

```svelte
<Tabs {items} more={{
  trigger: 'contextMenu',
  alignPoint: true,
  align: { offset: ['10%', 4], overflow: { adjustX: true, adjustY: true } }
}} />
```

`arrow=true` добавляет div-arrow и show-arrow class низкоуровневого Dropdown.
Tabs upstream не задаёт стили этому div; потребитель может оформить его через
semantic popup.root. AutoFocus/Tab работают с overlay, пропуская div-arrow.
AutoFocus запускается при открытии; обновление align/размеров внутри сеанса
сохраняет фокус в пользовательском поле. Смена getPopupContainer callback с тем же
DOM-контейнером сохраняет portal и выделение текста. Flip переключает CSS insets даже тогда,
когда числовые координаты остаются теми же.
Native popover остаётся в fixed top layer и отслеживает изменения layout;
клиппинг предков участвует в расчёте доступной области. Сохраняется измерение
реального border box при пользовательском box-sizing:content-box.
Исходная логика сопровождается MIT-лицензиями
[rc-dropdown](../../../src/lib/vendor/LICENSE.rc-dropdown) и
[rc-trigger](../../../src/lib/vendor/LICENSE.rc-trigger).

`more.visible` со значением true/false перекрывает внутренние запросы и onClose.
Как в rc-tabs,
more.onVisibleChange заменяет внутренний pointer/dismiss callback; для controlled
режима передавайте оба поля. Клавиатурное открытие и aria-expanded используют
внутренний флаг OperationNode. Явный more.visible=undefined включает отдельный
uncontrolled Trigger: pointer actions управляют popup, а keyboard/onClose меняют
только флаг OperationNode. В этой ветке Dropdown не добавляет open class и не
переносит фокус по autoFocus/Tab. Изменение visible сбрасывает внутреннее значение
Trigger, как useControlledState исходника.

PopupRender получает menu Snippet и { restTabs, onClose }; `more.overlay` — Snippet,
который заменяет и menu, и popupRender. Клавиатурный выбор с More работает даже
без исходного menu DOM. Содержимое ленивое и сохраняется после
первого открытия. `autoDestroy=true` удаляет его вместе с popup после leave end;
повторное открытие во время leave сохраняет DOM/state. Уходящая поверхность остаётся
aria-hidden/inert и не перехватывает Escape у следующего popup/Modal.

По умолчанию More использует ant-slide-up с placement overrides. `transitionName`
задаёт другой CSS motion prefix; пустая строка отключает motion. Непустой animation
имеет приоритет и добавляет префикс ant-tabs-dropdown-. CSS для собственного имени
задаёт потребитель. Theme motion=false и reduced motion завершают переход;
`openClassName` заменяет класс открытой кнопки, пустая строка убирает его.
Прежний native SSR shell сохраняется без содержимого; при autoDestroy=true его нет.

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Tabs, type TabsMoreRenderInfo } from 'antd-svelte';

  const items = Array.from({ length: 12 }, (_, index) => ({
    key: String(index),
    label: `Вкладка ${index + 1}`
  }));
</script>

{#snippet popup(menu: Snippet, info: TabsMoreRenderInfo)}
  {@render menu()}
  <button type="button" onclick={info.onClose}>Закрыть список</button>
{/snippet}
<Tabs {items} aria-label="Разделы" more={{ trigger: 'click', popupRender: popup }} />
```

`renderTabBar` получает разрешённые props навигации и Snippet стандартной панели.
Он может обернуть её, заменить props или построить собственную шапку:

```svelte
<script lang="ts">
  import { Tabs, type TabsDefaultTabBar, type TabsTabBarProps } from 'antd-svelte';

  const items = [{ key: 'profile', label: 'Профиль' }, { key: 'history', label: 'История' }];
</script>

{#snippet bar(props: TabsTabBarProps, DefaultTabBar: TabsDefaultTabBar)}
  <div class="custom-bar">
    {@render DefaultTabBar({ ...props, className: 'custom-header', style: 'padding-top:8px' })}
  </div>
{/snippet}
<Tabs {items} renderTabBar={bar} />
```

Стандартной панели передают полный набор props через spread. Её overrides меняют
только навигацию: например, activeKey управляет выделением заголовка, а активная
панель остаётся под управлением Tabs. Переданный onTabClick выполняет native выбор;
его можно заменить или вызвать из своего обработчика. KeyboardEvent из полностью
пользовательской шапки преобразуется в MouseEvent для публичного onTabClick,
сохраняя modifiers, target/currentTarget и отмену события.
Callback-ref `ref` предоставляет DOM-узел стандартной панели и получает null
при замене ref или unmount; во время SSR он не вызывается.

Сохраняется native наследование темы popup. В исходном UMD замена
more.overlayClassName может удалить служебный CSS-variable scope и сбросить цвет
текста до browser default; native portal продолжает наследовать тему Tabs.

`children` стандартной панели — Snippet `(node, item, attributes)`. Он оборачивает
каждый заголовок; `node(overrides)` дополняет или заменяет его исходные DOM attributes.
Attributes позволяют сохранить class/style/handlers и добавить Svelte attachments.
Как в исходном TabNode, внешний узел отделён от нативной кнопки tab: её клик
останавливает всплытие до внешнего onclick. Для перехвата выбора всей шапки
используйте props.onTabClick. Перестановка items и интеграция с drag-and-drop
остаются у владельца, как в официальном примере.

Собственная шапка отвечает за клавиатуру и ARIA. Публичный
`getTabsItemId(props.id, key, 'tab' | 'panel')` связывает её controls с native
панелями, включая пустые и Unicode keys. Панели, их состояние и корневой ref
не пересоздаются при обновлении или замене renderer'а. Точные типы находятся в
[tabs-nav.types.ts](../../../src/lib/tabs-nav.types.ts).
Поля tabPosition/popupClassName стандартной панели следуют текущему интерфейсу
TabNavList закреплённого rc-tabs; они независимы от удалённых корневых props Tabs.

Фикстура `?fixture=tabs-editable` сверяет truthiness, иконки и размеры с Ant Design
6.6.8 и @rc-component/tabs 1.13.0. Проверяются callbacks, принятие/отказ владельца,
фокус, FormData, layout/RTL и сохранение панелей. Фикстура `?fixture=tabs-layout`
сравнивает centered/gutter/header style с 31 эталоном официального UMD, включая
все типы и положения в LTR/RTL, нулевой отступ и пустой editable список.
Здесь же проверяются medium, наследование размера и сохранение панелей
при смене расположения.
Галерея `/ant-design#tabs`
показывает профиль, настройки, историю Table, destroyOnHidden и Tabs внутри Modal.
Фикстура `?fixture=tabs-overflow` сверяет 35 эталонов More из официального UMD:
скрытые вкладки, CSS метрики, SVG, icon precedence, RTL и locale. Проверяются также
keyboard, control/owner callbacks, popupRender, portal, вложенные поверхности и focus.
Фикстура `?fixture=tabs-more-runtime` сверяет lifecycle, overlay precedence,
раздельные actions/touch, visible=undefined и motion phases с 33 эталонами UMD.
Здесь же проверяются autoDestroy после leave, reversal, смена motion и cleanup portal.
Фикстура `?fixture=tabs-more-position` сверяет 51 эталон геометрии официального UMD:
placements, offsets, overflow/regions, point targeting, arrow, callback payload и
container. Живые проверки защищают DOM/state/draft/selection/focus, callback loop,
scroll/resize, уход anchor за viewport и cleanup. Общий числовой engine проверяется
также прежними сценариями Tour.
Фикстура `?fixture=tabs-indicator` сверяет 52 эталона indicator из
официального UMD и направления onTabScroll в восьми сочетаниях RTL/placement.
Здесь же проверяются сохранение DOM, focus, More, прокрутки и cleanup кадров/listeners.
Фикстура `?fixture=tabs-semantic` сравнивает 22 эталона semantic slots, CSS-слоёв,
callback props, provider inheritance и icon precedence с официальным UMD.
Проверяются native attrs/events/ref и живое обновление открытого popup.
Фикстура `?fixture=tabs-motion` сверяет 41 UMD-эталон фаз, CSS, callbacks,
приоритетов, RTL и lifecycle; дополнительно проверяются незавершённые переходы,
FormData, focus, reversal, end=false, async prepare, reduced motion и cleanup.
Восемь сценариев задают per-item class/style, semantic/motion precedence, hidden
forceRender и RTL; живое обновление проверяется также во время перехода.
Фикстура `?fixture=tabs-render` сверяет 35 UMD-эталонов props, overrides,
per-tab wrappers/attributes, callbacks, More, RTL и пустого editable набора.
Проверяются также SSR, native keyboard/cancellation, attachments и обновления
шапки без потери DOM/state/draft/selection/focus и открытого More.
Приоритет уничтожения панелей сохраняет native v1. Остальные low-level
Dropdown/Trigger возможности More требуют отдельного аудита; перенесённые
arrow, align/alignPoint, placements, actions, callbacks, overlay и motion описаны выше.

## Steps

```svelte
<script lang="ts">
  import { Steps } from 'antd-svelte';
  let current = $state(0);
</script>

<Steps {current} onChange={index => { current = index; }} items={[
  { key: 'data', title: 'Данные', content: 'Заполните форму' },
  { key: 'review', title: 'Проверка', subTitle: 'Перед отправкой' },
  { key: 'send', title: 'Отправка', disabled: true }
]} />
```

Steps показывает этапы процесса. Current управляется владельцем и отсчитывается
от нуля; onChange сообщает запрошенный индекс, не меняя current самостоятельно.
Владелец может проверить поля перед принятием перехода. Повторный выбор текущего
шага, disabled и внешние обновления не вызывают callback. Без onChange список
пассивный и не создаёт остановок Tab. Привязка bind:current не используется.

Существующий тип StepsItem сохраняет стабильные строковые key и title.
StepsDataItem дополнительно принимает необязательные/numeric key и title;
для отсутствующих ключей используются позиции. При повторении string key
остаётся первое вхождение; индексы относятся к этому нормализованному списку.
Пустой список допустим. Конечное current округляется вниз и ограничивается
диапазоном 0..items.length; NaN/Infinity дают 0. Current=items.length отмечает
все автоматические шаги завершёнными без aria-current. Нормализация не
перезаписывает значение владельца и не генерирует callbacks.

Автоматические статусы: finish до current, process на current, wait после него.
Status меняет состояние текущего шага на wait/process/finish/error;
items.status имеет приоритет над вычисленным состоянием. Disabled ограничивает
выбор и не меняет статус или current. Корневой disabled наследует
ConfigProvider.componentDisabled; false явно снимает его, сохраняя items.disabled.

Существующий StepsItem принимает string или Snippet в title/subTitle/content;
новый StepsDataItem также принимает number/boolean/null. Ноль отображается,
boolean не создаёт текст. Icon может быть текстом, числом или декоративным Snippet.
Строки экранируются. Заголовок и подзаголовок находятся в нативной кнопке выбора
и должны содержать только текст/phrasing-разметку без вложенных controls.
Content находится отдельно и допускает блочную разметку; панели с полями
и действиями остаются у владельца. Иконки и линии
aria-hidden; icon также inert. Check/close используют существующий Icon.
Выбранный шаг помечен aria-current="step"; доступное описание кнопки содержит
локализованный статус и content. Собственных live-region и автофокуса нет.

Список использует ol/list, кнопки — естественные Tab/Shift+Tab, Enter и Space.
Это не tablist: содержимое и переходы принадлежат владельцу. При удалении или
отключении сфокусированного шага фокус переходит на следующий доступный шаг,
затем предыдущий. Keyed-перестановка сохраняет сфокусированную кнопку.
Если шагов/кнопок больше нет или Steps размонтирован, выбирается доступный
сосед текущего dialog/документа. Явный выбор владельца сохраняется.

Orientation: horizontal/vertical, по умолчанию horizontal. Responsive=true
переключает горизонтальный список в вертикальный при ширине viewport меньше
532px; SSR до гидратации не измеряет viewport и использует orientation.
При responsive=false сохраняется горизонтальная ориентация с внутренней
прокруткой при нехватке места. Size: medium/small; отсутствующий size наследует
small из ConfigProvider, остальные общие размеры дают medium.
Темы, compact, primary и RTL используют токены. Reduced motion отключает
встроенные transitions. Id/class/style и aria-describedby относятся к ol;
aria-label/aria-labelledby задают имя, по умолчанию locale.steps.label.

Locale.steps содержит label/wait/process/finish/error. RuRU и enUS предоставляют
все строки; вложенные частичные переводы сохраняют значения родительского
ConfigProvider. Отсутствующие значения дополняются ruRU. Тексты items задаёт владелец.

Галерея `/ant-design#steps` показывает независимый предпросмотр и многошаговую
заявку: данные → проверка → отправка → Result. Form проверяет поля, владелец
открывает следующие шаги и фокусирует панель/ошибочное поле. Возврат и retry
сохраняют данные; reset/unmount отменяют ожидание и игнорируют поздние результаты.
Модель отправки общая с примером Result. Сетевых запросов и сохранения в storage нет.

Type поддерживает default/dot/inline/navigation/panel, variant — filled/outlined.
Panel всегда горизонтальный. Dot/inline используют вертикальные заголовки в
горизонтальном списке; navigation сохраняет горизонтальные заголовки.
Orientation задаёт направление списка, titlePlacement — размещение заголовков.
Inline скрывает content в строке и показывает его в Tooltip по hover/focus;
Snippet title сохраняет rich content, Escape закрывает tooltip без смены фокуса.
Wrapper Tooltip находится внутри li, сохраняя нативную ol/li-семантику.

Initial сдвигает нумерацию, current и onChange в исходное пространство индексов;
согласованная нормализация current и first-wins keys сохранена. MaxCount>=3
ограничивает число реальных видимых шагов: первый, последний, текущий и ближайшие
соседи по исходному приоритету. Разрывы заменяются disabled ellipsis; сами ellipsis
не входят в maxCount. Номер и callback относятся к исходному item. Status ellipsis
сохраняет error скрытого диапазона либо finish/wait по current. Ellipsis=true
отдельно включает CSS-обрезку текста; offset задаёт начальную inline flex-cell.

Percent добавляет SVG progressbar к process-номеру, с исходной формулой dasharray;
в inline percent игнорируется. Progressbar доступен assistive technology,
декоративные иконки и стрелки panel скрыты. Новая ellipsis-иконка — точный SVG
@ant-design/icons-svg 4.6.0 (git 7f2516ac91226d2b41f93b35cb5197c8d94f7189),
MIT-лицензия уже включена в vendor/LICENSE.ant-design-icons.

ClassNames/styles принимают объект или функцию от {props}; root и item* слоты
совпадают с upstream. Item classNames/styles используют root/wrapper/icon/section/
header/title/subtitle/content/rail; локальные слои перекрывают общие, item.style
перекрывает styles.root. Root style имеет приоритет над styles.root. Стрелки navigation наследуют
colorTextDisabled активной темы; прямой --ant-steps-nav-arrow-color имеет приоритет.
Item.onClick вызывается перед onChange, включая повторный выбор current;
в disabled оба callback подавлены. Содержимое шага задаётся через content.

ConfigProvider.steps задаёт общие class/style/classNames/styles для десяти slots.
Классы config и local накапливаются. Root styles идут в порядке config.styles.root
→ config.style → local styles.root → local style; item-specific слои сохраняют приоритет.
Callbacks получают прежние native props с вычисленными layout/type/titlePlacement
и percent; текущие defaults/status/size и правила current не меняются.
Undefined наследует steps-record, любой собственный объект, включая {}, заменяет его.
В композиции Timeline, как в Source InternalContext, действуют только plain class/style:
semantic classNames/styles Steps не применяются и их callbacks не вызываются.

Локальный prefixCls меняет классы root, layout, item и progress; пустая строка
наследует ConfigProvider.prefixCls (по умолчанию ant-steps). CSS извлечён из закреплённого архива отдельным рецептом
steps-prefix. Namespace --ant-steps-* / --ant-cmp-steps-* и общий marker
ant-steps-css-var сохраняются. Смена prefix не пересоздаёт ol или кнопки, не меняет
их ids, выбор и фокус. Components.Icon из iconRender наследует тот же prefix;
восстановление фокуса при удалении шага от классов не зависит. Соседние Steps
изолированы, локальные/semantic styles и компонентные токены сохраняют приоритет.
Общий prefix ConfigProvider применяется и внутри Timeline.
Настройки самого ConfigProvider.timeline и локальные Timeline слои сохраняют приоритет.
Сверка: [36 исходных случаев и 4 обновления](../../../tests/browser/fixtures/ant-design-steps-config-reference.json),
[браузер](../../../tests/browser/steps-config.spec.ts),
[публичные типы и SSR](../../../tests/package/steps-config.ssr.test.ts), `?fixture=steps-config`.

IconRender — Snippet<[originalIcon, info]>, где info содержит index/active/item/
components.Icon. Можно отрендерить исходный Snippet или использовать переданный
Svelte Icon-компонент.
Bind:nativeElement возвращает ol; rootClassName добавляется к его class.

Сохранены согласованные отличия v1 от React: нативные кнопки внутри именованного
списка, keyed focus recovery, clamp current, responsive-порог 532px (исходный
useBreakpoint версии 6.6.8 использует xs), componentDisabled и locale.steps.
Произвольный prefixCls пока не перенесён.
Wave работает для доступных items при общем onChange.
Новые сценарии находятся в ?fixture=steps-variants и втором примере #steps;
unit/SSR/Chromium проверяют layouts, collapse/index mapping, render Snippets,
rich tooltip и доступность процента.

Source `theme.components.Steps` применяет исходные defaults, aliases и отдельные
algorithms к размерам иконок/точек, шрифтам, цветам и navigation. Поддержаны
CSS prefix/hash, нули/undefined и переданные во время выполнения CSS lengths.
Semantic root styles и plain style сохраняют приоритет. CustomIconSize/customIconTop
и iconTop создают переменные, но не меняют оформление,
как в 6.6.8; то же относится к legacy waitIcon*/finishIcon* defaults.
Метрики вариантов и композиции Timeline сверяются с официальным UMD в
`?fixture=steps-theme`; native-only темы сохраняют прежнее оформление.

## Pagination

```svelte
<script lang="ts">
  import { Pagination } from 'antd-svelte';

  let current = $state(1);
  let pageSize = $state(10);
</script>

<Pagination total={137} bind:current bind:pageSize>
  {#snippet showTotal(total, range)}{range[0]}–{range[1]} из {total}{/snippet}
</Pagination>
```

`total` по умолчанию равен 0. `current` и `pageSize` поддерживают привязку;
для отдельных controls доступны `defaultCurrent=1` и `defaultPageSize=10`.
Начальные значения читаются один раз. При привязке задавайте их у владельца.

Переход вызывает `onChange(page, pageSize)`. Повторное нажатие текущей страницы
не вызывает событие. Смена размера сначала вызывает
`onShowSizeChange(previousCurrent, pageSize)`, затем
`onChange(clampedCurrent, pageSize)`, сохраняя номер страницы в допустимых пределах.
Callback получает номера с учётом отображаемого диапазона.

Отображаемая страница ограничена диапазоном `1…ceil(total / pageSize)`.
Изменение props, включая уменьшение `total`, само не записывает исправленное
значение владельцу и не вызывает callbacks. Для пустой коллекции отображается
страница 1 и диапазон `[0, 0]`; `hideOnSinglePage` скрывает навигацию.
У пустой коллекции числовая кнопка отключена и не помечена active, как в upstream.
Дробные значения округляются вниз, total ограничен снизу нулём, current и
pageSize — единицей, все значения — сверху `Number.MAX_SAFE_INTEGER`.
Для NaN и бесконечных значений используются defaults 0, 1 и 10.
Список номеров и переходов содержит не более девяти элементов независимо от total.
Расчёт окон и jump boundaries перенесён из @rc-component/pagination 1.4.0:
при двух jump-кнопках между ними остаются три числовые кнопки, включая текущую.
`showLessItems` уменьшает buffer и шаг jump с 5 до 3; `showPrevNextJumpers` скрывает jumps.

Выбор размера автоматически показывается при `total > 50`; это меняется через
`showSizeChanger`. `pageSizeOptions` по умолчанию равен `[10, 20, 50, 100]`.
Допустимы положительные целые безопасные числа; дубликаты удаляются, варианты
сортируются, текущий размер добавляется в список. `showTotal` получает
нормализованный total и диапазон записей с нумерацией от 1.
На узком экране элементы переносятся на следующую строку, а выбор размера
остаётся доступным.

`simple=true` показывает редактируемый current/total. Enter и blur подтверждают ввод,
ArrowUp уменьшает страницу, ArrowDown увеличивает. Объект `{ readOnly: true }`
сохраняет counter без input. Для пустой коллекции simple counter равен 1/0,
как в закреплённой версии. Незавершённый ввод сохраняется при внешнем изменении
total/pageSize, пока отображаемая current не изменилась. Выбор размера сбрасывает
draft к отображаемой странице. `showQuickJumper=true` добавляет ввод цифр: Enter и blur
за пределами paging controls переходят на указанную страницу. Объект
`{ goButton: true }` добавляет подтверждение и отключает переход по blur.
Вместо true у goButton допустим текст/snippet. Quick jumper доступен и в simple mode.
Его кнопка сначала подтверждает simple input, затем значение quick jumper; blur
simple input сохраняет исходное поведение подтверждения. Для одной страницы
quick jumper и его кнопка скрыты. Вложенный в quick jumper React li заменён на span
с тем же классом, чтобы сохранить валидную HTML-структуру; подтверждение — native button.

`align` принимает start/center/end. `showTitle=false` убирает tooltip titles,
сохраняя доступные имена. `responsive` на XS добавляет class mini при
отсутствии явного size. В CSS Ant Design 6.6.8 этот класс сам не меняет высоту:
её меняет size=small. Это поведение проверено на исходной React-сборке и сохранено.
`size` и ConfigProvider.componentSize по-прежнему задают реальные размеры.

Responsive Pagination читает глобальный `theme.token.screenXSMax`; явный size
сохраняет приоритет. Пороги валидируются и при SSR, включая responsive=false,
как в useBreakpoint исходника. Смена токенов заменяет queries, сохраняя текущую
страницу и quick-jump draft/selection/focus. Наблюдение stale Source subscriptions
и fresh public counterpart записаны отдельно. [Browser-проверки](../../../tests/browser/responsive-controls.spec.ts)
охватывают также Masonry columns/gutter; [SSR](../../../tests/package/responsive-controls.ssr.test.ts)
сохраняет исходные defaults и проверяет порядок порогов.

`itemRender` — snippet с `(page, type, originalElement, info)`. OriginalElement
рисует готовый native button; info содержит disabled/active/label/title/onClick
для собственного native control. Это замена ReactNode и cloneElement/LI click.
`prevIcon/nextIcon/jumpPrevIcon/jumpNextIcon` принимают текст или декоративный snippet.
Стандартные jump/ellipsis icons перенесены из @ant-design/icons-svg 4.6.0
под существующей [MIT-лицензией](../../../src/lib/vendor/LICENSE.ant-design-icons).

`showSizeChanger` допускает boolean или поддержанные Select props. Собственный
onChange вызывается после onShowSizeChange и основного onChange Pagination.
Размер Pagination имеет приоритет над size из Select props.
`components.sizeChanger` получает snippet с value/disabled/class/options/onChange.
Не все расширенные React Select props уже существуют у Svelte Select.

ConfigProvider.pagination задаёт class/style, semantic classNames/styles,
showSizeChanger и totalBoundaryShowSizeChanger. Локальные настройки имеют приоритет.
Semantic callbacks получают исходные props и явный resolved size; внутренние
default values не подставляются вместо отсутствующих исходных props.
Semantic root соответствует native nav; прежний class остаётся на ul.
Root style перекрывает styles.root; classNames.item/styles.item относятся к страницам,
prev/next и simple counter, исключая jump controls, как в upstream.
`locale` принимает исходные snake_case aliases; locale.page задаёт suffix quick jumper.
Существующий config.locale.pagination.page остаётся доступным именем страницы.

Сохранены отличия прежнего Svelte API: bind:current/pageSize, нормализация чисел,
сортировка/удаление повторов размеров и доступный size changer на XS. Новые строковые
pageSizeOptions сначала преобразуются в числа. В React options могут сохранять
исходный порядок, а вся options area скрывается на XS. Quick jumper следует
исходному CSS и скрывается на XS. Для controlled compositing с отказом владельца
используйте functional bindings с getter и обработчики onChange.

PrefixCls задаёт локальный namespace Pagination; пустая строка наследует
ConfigProvider.prefixCls. 111 исходных правил styles/media изолированы по local/global
prefix, без четырёх общих Input Group rules. Частные item-size-actual и
item-spacing-actual следуют общему namespace с исходным удалением точек;
публичные token variables сохраняются. Смена префикса сохраняет current/pageSize,
DOM активного пункта и jumper, его draft/focus/selection и callbacks.
Пункты сохраняют `border-box` и размер темы, включая 28px для medium в native compact.
Source button Arial и [public itemRender counterparts с fontFamily:inherit](../../../tests/browser/fixtures/ant-design-pagination-prefix-reference.json)
разделены: прежняя Native typography, active colors и wireframe сохранены.

Генерация CSS selectPrefixCls и React-specific components/dev warnings остаются
в следующих этапах. `selectPrefixCls` доступен custom size changer info;
штатный Select сохраняет свои классы. Обычный disabled, навигация native кнопками,
возврат focus после отключения next и SSR без DOM/media/timers сохранены.

Source `theme.components.Pagination` использует 12 собственных defaults и общий
расчёт 18 Input defaults для quick jumper. Поддержаны component algorithms,
aliases, нули/undefined, runtime CSS lengths и CSS prefix/hash. Токены находятся
на native nav, styled ul наследует их, поэтому styles.root/style сохраняют
приоритет. Внутренний Select получает собственный scope; Input overrides
не подменяют quick jumper. MiniOptionsSizeChangerTop сериализуется, но исходный
CSS 6.6.8 его не использует.

Глобальный token.wireframe включает bordered, независимо от одноимённого
component override. Дополнительные правила перенесены из исходного
pagination/style/bordered.ts: в закреплённом dist/antd.css их нет. Цвета и padding
номеров применяются к сохранённым native buttons. Кнопки prev/next сохраняют
source line-height: normal, в том числе при неопределённой высоте item.
Метрики трёх размеров, disabled/simple и variants, hover/focus и обновления темы
проверяются с официальным UMD в `?fixture=pagination-theme`. Native-only темы,
bind API и согласованное поведение на XS сохраняются.

В теме без `cssVar` активный номер также получает primary-цвет, hover —
primary-hover, disabled — disabled-цвет. Переменные цветов состояний на
`styles.item` и inline-цвет custom `itemRender` сохраняют приоритет. Эти состояния
проверяет [регрессионный тест](../../../tests/browser/pagination-color.spec.ts)
в светлой и тёмной теме, LTR и RTL; существующая native-палитра `primary` сохраняется.

Проверки: [engine](../../../src/lib/pagination.engine.test.ts),
[SSR](../../../src/lib/pagination.ssr.test.ts),
[package](../../../tests/package/pagination.ssr.test.ts),
[browser](../../../tests/browser/pagination-features.spec.ts), прежние
[binding/normalization tests](../../../tests/browser/checkbox-pagination.spec.ts)
и `?fixture=pagination-features`. [CSS](../../../src/lib/vendor/pagination.css)
воспроизводится рецептом pagination: 115 правил, включая два media rules;
алгоритм страниц использует [MIT rc-pagination](../../../src/lib/vendor/LICENSE.rc-pagination).
