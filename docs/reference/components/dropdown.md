# Dropdown

```svelte
<script lang="ts">
  import { Button, Dropdown } from '@woodger/antd';

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

`menu` использует [Menu](menu.md) в вертикальном режиме. `menu.items` принимает
команды, группы, разделители и подменю с `children`. Ключ команды может быть
строкой или числом. Пустой строковый ключ допустим. При повторении ключа на
одном уровне используется первое вхождение. Label принимает строку, число
или пассивный Snippet. Icon декоративный.
Для snippet со сложным или нетекстовым содержимым задайте textValue: он служит
доступным именем команды и текстом поиска. В label не следует вкладывать кнопки,
ссылки и поля ввода. Пустой список показывает ConfigProvider.locale.emptyText.

Раскрытие задают `openKeys`, `defaultOpenKeys` и `menu.onOpenChange`.
`triggerSubMenuAction` выбирает наведение или клик. `menu.getPopupContainer`
задаёт отдельный контейнер подменю. Внешние панели подменю входят в границы
фокуса и клика Dropdown. `menu.activeKey` выделяет строку без перевода фокуса.
Выбор по умолчанию отключён. При `selectable` доступны `selectedKeys`,
`defaultSelectedKeys`, `onSelect` и `onDeselect`. Одновременные `selectable`
и `multiple` оставляют Dropdown открытым при выборе.

Для навигации item поддерживает href/target/rel: вместо button создаётся a с
role=menuitem. Это Svelte-адаптация link label исходного Menu без вложения ссылки
в кнопку. Disabled link не получает href и имеет aria-disabled=true. Enter и
Space активируют его; preventDefault в callbacks отменяет и нативный переход,
и закрытие меню. При переходе к якорю фокус следует за браузерной навигацией.
Без href сохраняется прежняя нативная кнопка команды.

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
Обработчики идут от пункта к родительским подменю, затем к `menu.onClick`.
`DropdownMenuClickInfo` добавляет `keyPath` от пункта к корню и `itemData` к
`key` и нативному `MouseEvent`. Все обработчики команды получают один объект.
`preventDefault` отменяет оставшиеся обработчики команды, изменение выбора и
закрытие. Асинхронные операции и их ошибки обрабатывает владелец.

По умолчанию trigger равен `['hover']`; допустимы `'hover'`, `'click'`, их массив
и `[]` для внешнего управления. MouseEnterDelay/MouseLeaveDelay задаются в
секундах, по умолчанию 0.1. Уход указателя закрывает меню только при включённом
hover: внешне открытое меню с click или `[]` остаётся открытым. Hover по умолчанию
сохраняет текущий фокус. `autoFocus` переводит его в меню также при наведении
или открытии владельцем. Click, Enter, Space и
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
этого namespace. Меню добавляет суффикс `-menu`, `menu.prefixCls` переопределяет
его отдельно. Button в trigger сохраняет собственный
общий prefix. Canonical theme variables и IDs/ARIA не переименовываются.
Смена префикса сохраняет открытый popover, DOM команд, фокус и typeahead по label.
77 исходных CSS-правил без motion и исходного title flex:auto изолированы по локальному и общему префиксам;
native wrapper, ссылки, reduced motion и bind:open/callback contracts сохранены.
Прежние label flex/min-width и явный dir popup сохранены. [Raw эталоны и public
counterparts через styles.itemContent/root.direction](../../../tests/browser/fixtures/ant-design-dropdown-prefix-reference.json)
разделяют эти Native границы и исходное оформление Ant Design.

`classNames` и `styles` принимают набор слотов или функцию с текущими props.
`root` оформляет панель Dropdown. `item`, `itemTitle`, `itemIcon` и `itemContent`
применяются на всех уровнях меню. Dropdown задаёт эти слоты вместо
`menu.classNames` и `menu.styles`, сохраняя слой `ConfigProvider.menu`.

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

Из API Dropdown ещё остаются `contextMenu`, `popupRender`, `destroyOnHidden`,
настройки анимации и глобальный `ConfigProvider.dropdown`. Замеры встроенного
Menu покрывают порядок событий, управляемое закрытие, множественный выбор,
RTL и оформление. [Браузерный эталон React 6.6.8](../../../tests/browser/fixtures/ant-design-dropdown-menu-reference.json)
Deprecated Dropdown.Button исключён из переноса; актуальная композиция —
SpaceCompact с Dropdown и Button.

