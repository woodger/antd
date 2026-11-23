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

