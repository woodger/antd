# Menu

Menu отображает команды, группы и подменю с поддержкой клавиатуры.

PrefixCls задаёт локальный namespace Menu, его пунктов, групп, Divider и подменю.
Пустая строка наследует ConfigProvider.prefixCls. Popup и inline-списки сохраняют
тот же префикс; Typography selectors используют независимый общий namespace.
Canonical variables/link reset и @scope границы тем сохранены. Шаблоны содержат
201 базовое и 77 scoped theme rules без motion и deprecated declarations.
Смена префикса сохраняет root/item/title DOM, selection/open state, refs, IDs и фокус.

У upstream dashed Divider пропускает локальный префикс владельца. [Raw измерения и
public per-divider prefixCls counterparts](../../../tests/browser/fixtures/ant-design-menu-prefix-reference.json)
сохранены отдельно; Svelte наследует согласованный prefix Menu и сохраняет dashed.
Независимый prefixCls для отдельного Divider не поддерживается.

```svelte
<script lang="ts">
  import { Menu, type MenuItemType } from '@woodger/antd';
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

## Стили и значки

`ConfigProvider.menu` задаёт общие `class`, `style`, `classNames`, `styles` и
`expandIcon`. Вложенный провайдер наследует эту настройку при `undefined`.
Собственный объект, включая `{}`, заменяет её целиком.

`classNames` и `styles` принимают объект или callback с `{ props }`. Поле
`props.theme` по умолчанию равно `light`, а `props.inlineCollapsed` учитывает
состояние LayoutSider. Доступны следующие части Menu.

- `root` — корневой список. Семантические классы корня и `rootClassName`
  также применяются к поверхностям popup.
- `item`, `itemIcon`, `itemContent` — пункт первого уровня, иконка и содержимое.
- `itemTitle`, `list` — заголовок и список группы первого уровня.
- `subMenu` — те же части пунктов и групп внутри подменю. Иконка заголовка
  раскрываемой ветки использует общий `itemIcon` на любой глубине.
- `popup.root` — поверхность всплывающего подменю. Для класса можно записать
  `classNames={{ popup: 'navigation-popup' }}`.

Классы провайдера и экземпляра объединяются. Стили корня применяются в порядке
`provider.styles.root` → `provider.style` → `styles.root` → `style`. У пунктов
локальный `item.style` имеет приоритет над семантическим стилем. Локальные
строки `subMenu.*` и `popup.root` целиком заменяют строки того же slot провайдера.
Стили поверхности `styles.popup.root` накладываются после `popupStyle` ветки.

```svelte
<script lang="ts">
  import { ConfigProvider, Menu, type MenuExpandIconInfo, type MenuItemType } from '@woodger/antd';

  const items: MenuItemType[] = [
    { key: 'docs', label: 'Документация', children: [{ key: 'api', label: 'API' }] }
  ];
</script>

{#snippet expand(info: MenuExpandIconInfo)}{info.isOpen ? '−' : '+'}{/snippet}
<ConfigProvider menu={{ classNames: { item: 'navigation-item' }, expandIcon: expand }}>
  <Menu {items} mode="inline" styles={{ subMenu: { item: 'font-weight: 600' } }}
    aria-label="Разделы документации" />
</ConfigProvider>
```

`expandIcon` принимает snippet с данными ветки, её `eventKey` и `isOpen`.
Приоритет у настройки ветки, затем у Menu и провайдера. `false` или `null`
скрывают значок. В горизонтальном режиме заголовок первого уровня без значка
раскрытия. [Замеры Ant Design 6.6.8](../../../tests/browser/fixtures/ant-design-menu-config-reference.json).

## Выбор и клавиатура

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

### Горизонтальное переполнение

В режиме `horizontal` Menu оставляет в строке помещающиеся пункты. Кнопка
с многоточием открывает остальные в исходном порядке. Изменение ширины,
пунктов или размеров индикатора пересчитывает состав строки. `disabledOverflow`
выключает это поведение.

`overflowedIndicator` принимает текст, число или snippet. При отсутствии prop
используется значок Ant Design, явный `undefined` выводит `...`, а `null`
и `false` оставляют кнопку без видимого содержимого. Для оформления поверхности
подменю служит `overflowedIndicatorPopupClassName`.

В `openKeys` подменю имеет ключ `rc-menu-more`. При выборе вынесенного
пункта его `keyPath` заканчивается этим ключом. При коллизии ключ пользователя
сохраняется, к служебному ключу добавляется дефис до получения свободного ключа.
Вынесенный пункт первого уровня использует семантические стили первого уровня.

При SSR все пункты остаются в строке, индикатор скрыт до измерения. После
измерения невместившиеся строки остаются смонтированными для замеров и
исключаются из навигации. Когда сужение скрывает пункт под фокусом, Menu
переводит фокус в открытое подменю или на его кнопку. При расширении фокус
возвращается к тому же пункту в строке. При очень малой ненулевой ширине
подменю сохраняет все пункты. [Замеры Ant Design 6.6.8](../../../tests/browser/fixtures/ant-design-menu-overflow-reference.json).

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
Фикстура — `?fixture=menu`.

Пока не поддерживаются исходные popup/collapse motion, controlled activeKey/defaultActiveFirst,
tooltip для свёрнутого меню, render hooks, placements/offset и общий itemIcon.
Deprecated
Menu.Item/SubMenu/ItemGroup/Divider children wrappers исключены из переноса; данные
задаются items. Standalone Menu пока не расширяет существующий контракт Dropdown.

