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
При передаче `open` без binding видимость следует значению владельца, включая
случай, когда он отклоняет запрос открытия или закрытия.
Без внешнего open состояние хранится отдельно от входных props: обновление
spread-объекта сохраняет открытое/закрытое меню, DOM команд и focus, без callbacks.
Изменение defaultOpen после mount не сбрасывает состояние. При снятии внешнего
open сохраняется прежний fallback к начальному defaultOpen.
`onOpenChange(open, { source })` сообщает запросы видимости. Кнопка, hover,
Escape, Tab и клик снаружи передают `source: 'trigger'`. При выборе команды
Dropdown передаёт `false` и `source: 'menu'` после `menu.onClick` и до
событий выбора Menu. Сочетание `menu.selectable` и `menu.multiple` сохраняет
панель открытой. Изменение open владельцем и закрытие из-за disabled
не вызывают callback. Одно нажатие Escape даёт один запрос закрытия и при
отказе владельца изменить open.
Обработчики идут от пункта к родительским подменю, затем к `menu.onClick`.
`DropdownMenuClickInfo` добавляет `keyPath` от пункта к корню и `itemData` к
`key` и нативному `MouseEvent`. Все обработчики команды получают один объект.
`preventDefault` отменяет оставшиеся обработчики команды, изменение выбора и
закрытие. Асинхронные операции и их ошибки обрабатывает владелец.
[Порядок событий Ant Design 6.6.8](../../../tests/browser/fixtures/ant-design-dropdown-menu-reference.json).

`trigger` принимает `'hover'`, `'click'`, `'contextMenu'` или массив этих действий.
По умолчанию действует `['hover']`. Пустой массив оставляет открытие владельцу.
`mouseEnterDelay` и `mouseLeaveDelay` задаются в секундах, по умолчанию 0.1.
Уход указателя запрашивает закрытие при `hover` без `contextMenu`.

`contextMenu` открывает меню по правому клику или клавиатурному событию
контекстного меню. Повторное действие перемещает открытую панель к новой
координате. Обычный клик по trigger, прокрутка его контейнера или контейнера
панели и изменение размера окна запрашивают закрытие. Внутренний список
прокручивается при открытой панели. При сочетании с `hover` запланированное
открытие срабатывает и после ухода указателя.

Hover по умолчанию сохраняет текущий фокус. `autoFocus` переводит его в меню
также при наведении, контекстном открытии и открытии владельцем. Во встроенном
меню Click, Enter, Space и ArrowDown фокусируют первую доступную команду,
ArrowUp — последнюю. Стрелки
обходят команды по кругу, Home/End выбирают крайние, ввод букв ищет по префиксу.
Повтор буквы перебирает совпадения; пауза в секунду начинает новый поиск.
Disabled-пункты и разделители пропускаются. Если доступных команд нет, фокус
получает сам menu. Tab/ShiftTab закрывают меню и продолжают нативный порядок.
Escape и выбор команды возвращают фокус к trigger, если он оставался в меню.
При удалении trigger после действия новый фокус назначает владелец.

В children передавайте один нативный focusable control, обычно Button.
Dropdown связывает первый дочерний элемент с menu через aria-haspopup="menu",
aria-controls и aria-expanded, сохраняя исходные ARIA-атрибуты владельца.
`aria-label` задаёт имя панели. `aria-labelledby` связывает его с элементом по ID.
По умолчанию имя берётся от trigger. Class/style
относятся к wrapper trigger. Disabled наследуется от Form/ConfigProvider;
явное false переопределяет контекст. Нативный disabled trigger также не открывает меню.

`bind:ref` возвращает сам DOM-узел триггера, включая SVG. Значение доступно после
монтирования, обновляется при замене узла и очищается при удалении Dropdown.
После гидратации `openClassName` добавляется к этому узлу при открытии. По умолчанию
используется `${prefixCls}-open`. Пустая строка отключает добавление класса.
`rootClassName` добавляет классы на панель.

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

`ConfigProvider.dropdown` задаёт `class`, `style`, `classNames` и `styles` панели.
Классы слотов накапливаются. Корень применяет `styles.root` провайдера, затем его
`style`, затем локальный `styles.root`. Стили пунктов дополняют друг друга в порядке
от провайдера к экземпляру. `undefined` наследует настройку целиком, объект во
вложенном провайдере её заменяет. В callbacks провайдера доступны используемые
задержки и `autoAdjustOverflow`. Локальные callbacks получают входные props.
[Замеры провайдера](../../../tests/browser/fixtures/ant-design-dropdown-provider-reference.json) и
[замеры trigger](../../../tests/browser/fixtures/ant-design-dropdown-appearance-reference.json)
сняты в Ant Design 6.6.8.

`placement` задаёт сторону и выравнивание. Доступны `top`, `topLeft`, `topRight`,
`bottom`, `bottomLeft`, `bottomRight`, `left`, `leftTop`, `leftBottom`, `right`,
`rightTop` и `rightBottom`. По умолчанию действует `bottomLeft`, в RTL — `bottomRight`.
`align` переопределяет точки привязки, смещения и правила коррекции для выбранного
placement. `offset` и `targetOffset` принимают числа и проценты.
`autoAdjustOverflow` по умолчанию `true`. Объект уточняет коррекцию по осям,
`false` отключает переворот и сдвиг.

Для панели, привязанной к элементу, минимальная ширина следует ширине trigger.
В режиме `contextMenu` ширина зависит от содержимого и места в контейнере.
`styles.root` позволяет задать минимальную ширину. `arrow` по умолчанию `false`.
`arrow={{ pointAtCenter: true }}` включает стрелку и привязывает её к центру
элемента или к указанной координате. Длинный список можно прокручивать.
Поверхность использует native popover, сохраняет контекст темы и работает внутри Modal.
Слой вложенной панели берётся из контекста, а целочисленный `z-index` в
`styles.root` задаёт явное значение.
[Уровни вложенных панелей](../theme-context.md#layering-nested-panels)
GetPopupContainer выбирает локальную функцию или ConfigProvider fallback;
undefined наследует provider. Функция вызывается с первого открытия либо при
подготовке скрытой панели через `forceRender`.

### Содержимое и время жизни панели

`popupRender` принимает snippet с необязательным аргументом `origin`.
Чтобы оставить встроенное меню внутри своей разметки, вызовите `{@render origin?.()}`.
При переданных `menu.items`, включая пустой массив, `origin` содержит меню.
Собственную панель можно создать без `menu`. Добавленный через snippet `Menu`
получает префикс Dropdown и настройки `ConfigProvider.menu`. Слоты строк самого
Dropdown применяются к встроенному меню. Контролы панели получают статус и
значок `Form.Item`, сохраняя собственные значения и имена полей.

При пользовательском содержимом клик оставляет фокус на trigger, когда `autoFocus`
выключен. `autoFocus` фокусирует единственный focusable корень snippet или Menu.
Стрелки на trigger переводят фокус к меню или элементу панели.
Для этой панели trigger указывает на диалог через `aria-haspopup` и `aria-controls`.

Пользовательская панель монтируется на клиенте при первом открытии. После закрытия
по умолчанию сохраняются DOM и черновики. `destroyOnHidden` удаляет содержимое
после завершения анимации ухода. `forceRender` заранее монтирует скрытую панель
на клиенте и сохраняет её при закрытии, в том числе вместе с `destroyOnHidden`.
Если снять `forceRender` до первого открытия, подготовленная панель удалится.
Включение `destroyOnHidden` в уже закрытой панели также удаляет её содержимое.
Захваченные значения в уже смонтированном snippet сохраняют реактивность в
закрытой панели. Замена самого snippet применяется при следующем открытии.
Встроенное меню без настроек жизненного цикла сохраняет прежнюю скрытую SSR-оболочку.

По умолчанию панель использует slide-анимацию по фактической стороне открытия.
`transitionName` задаёт базовое имя для пользовательских CSS-классов
`*-appear`/`*-enter`/`*-leave` и `*-active`. Пустая строка отключает переход.
Учитываются `theme.token.motion` и системное предпочтение уменьшенного движения.
Во время закрытия панель исключается из фокуса и взаимодействия.

[Исходные сценарии содержимого](../../../tests/browser/fixtures/ant-design-dropdown-lifecycle-reference.json),
[замеры Menu в пользовательской панели](../../../tests/browser/fixtures/ant-design-dropdown-replacement-reference.json) и
[кадры анимации](../../../tests/browser/fixtures/ant-design-dropdown-motion-reference.json)
сняты в Ant Design 6.6.8.

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

В [замерах контекстного меню](../../../tests/browser/fixtures/ant-design-dropdown-context-reference.json)
и [размещения](../../../tests/browser/fixtures/ant-design-dropdown-placement-reference.json)
зафиксированы геометрия панели и стрелки, порядок событий, RTL, задержки и закрытие.
Дополнительная [сверка взаимодействий](../../../tests/browser/fixtures/ant-design-dropdown-interactions-reference.json)
охватывает касание, наведение с задержкой, прокрутку меню и автофокус.
Замеры встроенного [Menu](../../../tests/browser/fixtures/ant-design-dropdown-menu-reference.json)
покрывают управляемое закрытие, множественный выбор и оформление.

Deprecated Dropdown.Button исключён из переноса; актуальная композиция —
SpaceCompact с Dropdown и Button.

