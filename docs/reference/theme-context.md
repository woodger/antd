# Токены темы в ConfigProvider

Токен — именованное значение темы, например цвет акцента, радиус скругления или
отступ. `ConfigProvider` передаёт эти значения всем компонентам внутри него.

[Настройка темы](#использование) · [Указатель по компонентам](#указатель-по-компонентам) · [CSS и SSR](#css-и-ssr)

## Использование

### Изменить общую тему

Передайте общий цвет в `theme.token.colorPrimary`. Кнопка «Сохранить» получит
зелёный фон. Другие компоненты внутри этого провайдера тоже используют зелёный
там, где им нужен основной цвет.

```svelte
<script lang="ts">
  import { Button, ConfigProvider } from '@woodger/antd';
</script>

<ConfigProvider theme={{ token: { colorPrimary: '#0f766e' } }}>
  <Button type="primary">Сохранить</Button>
</ConfigProvider>
```

Для тёмной или компактной темы доступны `mode` и `compact`. Через `algorithm`
можно явно выбрать алгоритмы и порядок расчёта, например
`[theme.darkAlgorithm, theme.compactAlgorithm]`. Значение `token.colorPrimary`
имеет приоритет над `primary`. [Темы и локализация](themes.md)

### Настроить один компонент

В `theme.components` укажите имя компонента с заглавной буквы. В этом примере
`Button.paddingInline` увеличивает боковые отступы кнопки обычного размера до
24 пикселей. У соседнего поля остаются свои отступы.

```svelte
<script lang="ts">
  import { Button, ConfigProvider, Input } from '@woodger/antd';
</script>

<ConfigProvider theme={{ components: { Button: { paddingInline: 24 } } }}>
  <Input aria-label="Название проекта" />
  <Button>Сохранить</Button>
</ConfigProvider>
```

Здесь же можно переопределить общий токен для одного семейства. Например,
`Input: { colorPrimary: '#0f766e', algorithm: true }` пересчитает производные
цвета поля по алгоритму текущей темы. Без `algorithm: true` компонент получает
только заданные переопределения. Для собственного расчёта укажите функцию или
массив функций. Доступные поля перечислены в [типах токенов компонентов](../../src/lib/theme/theme-component-token.types.ts).

### Переопределить тему внутри страницы

Вложенный провайдер объединяет токены по именам. В примере у обеих кнопок
скругление 10 пикселей. Цвет внешней кнопки зелёный, внутренней — фиолетовый.

```svelte
<script lang="ts">
  import { Button, ConfigProvider } from '@woodger/antd';
</script>

<ConfigProvider theme={{ token: { colorPrimary: '#0f766e', borderRadius: 10 } }}>
  <Button type="primary">Сохранить</Button>

  <ConfigProvider theme={{ token: { colorPrimary: '#722ed1' } }}>
    <Button type="primary">Опубликовать</Button>
  </ConfigProvider>
</ConfigProvider>
```

Для `theme.components` действует то же правило внутри записи каждого компонента.
Например, если родитель задаёт `Button.paddingInline`, а потомок задаёт только
`Button.fontWeight`, внутренняя кнопка получит обе настройки. Явно переданное
значение `undefined` перекрывает родительское значение этого поля.

С `theme={{ inherit: false }}` расчёт начинается со стандартной темы. Это
сбрасывает унаследованные токены, алгоритмы, настройки компонентов, `mode`,
`primary` и `compact`. Настройки `hashed`, `cssVar.prefix` и `zeroRuntime`
продолжают наследоваться. Для локальной темы провайдер создаёт собственный
`cssVar.key`, если вы не задали непустой ключ.

### Прочитать токены в своём компоненте

Вызовите `theme.useToken()` в дочернем компоненте при его инициализации.
В следующем примере выбор цвета меняет тему. Дочерний компонент сразу
показывает её новый основной цвет.

**App.svelte**

```svelte
<script lang="ts">
  import { ConfigProvider } from '@woodger/antd';
  import ThemePreview from './ThemePreview.svelte';

  let primary = $state('#0f766e');
</script>

<label>
  Цвет акцента
  <input type="color" bind:value={primary} />
</label>

<ConfigProvider theme={{ token: { colorPrimary: primary } }}>
  <ThemePreview />
</ConfigProvider>
```

**ThemePreview.svelte**

```svelte
<script lang="ts">
  import { theme } from '@woodger/antd';

  const current = theme.useToken();
</script>

<p style:color={current.token.colorPrimary}>
  Основной цвет: {current.token.colorPrimary}
</p>
```

Читайте `current.token` в разметке или в `$derived`. Если сохранить
`const { token } = current` при инициализации, переменная сохранит снимок
первой темы.

| Поле результата | Что содержит |
| --- | --- |
| `token` | Рассчитанные значения ближайшего провайдера, включая переопределения компонентов. |
| `cssVar` | Представление токенов для CSS. Например, `current.cssVar.colorPrimary` содержит ссылку `var(…)`. Числовые пороги адаптивной сетки сохраняют свои значения. |
| `hashId` | CSS-класс темы. При `hashed: false` возвращается пустая строка. |
| `theme` | Объект алгоритма с `id` и методом `getDerivativeToken()`. |

Вне дерева компонентов для расчёта по конфигурации используйте
[`theme.getDesignToken()`](design-tokens.md). У `ConfigProvider` пустой массив
`algorithm: []` выбирает стандартный алгоритм. При статическом расчёте пустой
массив вызывает `TypeError`.

## Указатель по компонентам

| Задача | Компоненты |
| --- | --- |
| Действия и ввод | [Button](#button), [Input, TextArea, InputPassword, InputSearch, InputOTP](#input-и-textarea), [InputNumber](#inputnumber), [Checkbox, Radio, Switch и их группы](#checkbox-radio-и-switch), [Slider](#токены-slider) |
| Выбор и поиск | [Select](#токены-select), [AutoComplete](#autocomplete), [TreeSelect](#treeselect), [Cascader и CascaderPanel](#cascader-и-cascaderpanel), [Mentions](#тема-mentions), [ColorPicker](#тема-colorpicker) |
| Даты и файлы | [DatePicker, RangePicker, TimePicker, TimeRangePicker](#дата-и-время), [Upload](#тема-upload) |
| Компоновка | [Flex](#настройки-flex), [Space, SpaceCompact и SpaceAddon](#тема-и-настройки-space), [Row и Col](#тема-grid), [Layout и LayoutSider](#токены-layout), [Divider](#токены-divider), [Masonry](#тема-masonry), [Affix](#тема-affix) |
| Навигация | [Anchor](#токены-anchor), [Breadcrumb](#токены-breadcrumb), [Menu](#токены-menu), [Tabs](#токены-tabs), [Pagination](#токены-pagination), [Steps и Timeline](#токены-steps-и-timeline) |
| Отображение данных | [Avatar, AvatarGroup и Badge](#avatar-и-badge), [Card](#токены-card), [Collapse](#токены-collapse), [Image и ImagePreviewGroup](#токены-image), [Table](#тема-table), [Watermark](#тема-watermark), [BorderBeam](#тема-borderbeam) |
| Обратная связь | [Alert](#токены-alert), [Empty](#пустое-состояние-empty), [Result](#токены-result), [Spin](#токены-spin), [Progress](#токены-и-настройки-progress), [Skeleton](#токены-skeleton), [Message](#тема-message), [Notification](#тема-notification) |
| Всплывающие элементы | [Dropdown, Tooltip, Popover и Popconfirm](#токены-всплывающих-панелей), [Modal](#тема-modal), [Drawer](#тема-drawer), [Tour](#тема-tour) |

### Button

`components.Button` задаёт оформление кнопок. Для горизонтальных отступов
используйте `paddingInline`, `paddingInlineSM` и `paddingInlineLG` в зависимости
от размера. `defaultBg`, `defaultColor` и `defaultBorderColor` относятся к
кнопке с обычным оформлением. Цвет фона основной кнопки берётся из
`colorPrimary`. [Справочник Button](components/button.md)

### Input и TextArea

`Input`, `TextArea`, поле пароля, поле поиска и ячейки одноразового кода
используют `components.Input`. Через `paddingBlock` и `paddingInline` задаются
отступы, через `activeBorderColor` и `activeShadow` — оформление фокуса.
Кнопка поиска получает настройки `Button`.

### InputNumber

`components.InputNumber.controlWidth` задаёт ширину поля. При
`handleVisible: true` ширина области со стрелками в покое зависит от
`controlHeightSM`, а `handleWidth` определяет ширину при наведении или фокусе.
Изменение `handleWidth` само по себе не расширяет область в покое.

### Checkbox, Radio и Switch

У `Checkbox` и `CheckboxGroup` цвета и размеры берутся из общих токенов.
Их можно переопределить в `components.Checkbox`. В `components.Radio`
доступны `radioSize` и `dotSize` для круга и точки, а также цвета кнопочного
варианта для `RadioButton`. В `components.Switch` настраиваются размеры
дорожки, бегунка и отступов для обычного и малого переключателей.

### Дата и время

`DatePicker`, `RangePicker`, `TimePicker` и `TimeRangePicker` используют одну
запись `components.DatePicker` для поля и всплывающей панели. Кнопка
подтверждения внутри панели получает токены маленькой кнопки из `components.Button`.
Настройки положения и контейнера панели описаны в [справочнике всплывающих элементов](popup-settings.md).

### Токены Select

В `components.Select` настраиваются высота и отступы вариантов, цвета выбора
и фокуса, размеры тегов и `zIndexPopup`. Тема действует и на поле, и на
открытый список. В компактной теме малое поле одиночного выбора имеет высоту
22 пикселя, множественного — 21. В варианте `outlined` у тегов множественного
выбора граница прозрачная, в том числе при заданном `multipleItemBorderColor`.

### AutoComplete

`AutoComplete` получает оформление поля, кнопки очистки и списка из
`components.Select`. Если передать собственный `Input`, его внутреннее поле
получит токены `components.Input`. У вложенного `textarea` сохраняются высота
по `rows` и собственные стили.

### TreeSelect

`TreeSelect` сначала применяет `components.Select`, затем `components.TreeSelect`.
Узлы в списке используют `titleHeight`, `switcherSize` и `indentSize` из
`TreeSelect`. Запись `components.Tree` относится к самостоятельному дереву.

### Cascader и CascaderPanel

Поле `Cascader` использует `components.Select`, затем `components.Cascader` для
ширины и высоты колонок, отступов и оформления выбранной строки. Самостоятельная
панель `CascaderPanel` получает только настройки `Cascader`. Встроенные флажки
оформляются самой панелью.

### Тема Mentions

`components.Mentions` управляет отступами поля, высотой списка
(`dropdownHeight`), минимальной шириной пункта (`controlItemWidth`) и `zIndexPopup`.
Тема обновляет и поле, и открытый список, сохраняя ввод и позицию курсора.

### Тема ColorPicker

`components.ColorPicker` принимает общие токены и алгоритм для кнопки выбора и
панели. Панель также использует оформление `Popover`. У вложенных
`InputNumber`, `Select` и `Slider` остаются собственные настройки. Для расчёта
контраста светлых образцов используется глобальный `colorBgElevated`.

### Тема Upload

В обычном списке файлов цвет действий задаётся через `components.Upload.actionsColor`
и по умолчанию берётся из `colorIcon`. В режиме карточек действия поверх изображения
остаются белыми. Размер карточки задаёт `pictureCardSize`. Вложенные `Button`,
`Progress` и `Tooltip` используют свои токены.

### Настройки Flex

Для именованных интервалов между элементами `Flex` использует `paddingXS`,
`padding` и `paddingLG`. Переопределите их в `components.Flex`, чтобы изменить
интервалы только в этих контейнерах. Значение `gap` в пикселях задаётся прямо
на компоненте. `ConfigProvider.flex` задаёт общие `vertical`, `class` и `style`.

### Тема и настройки Space

`Space` берёт именованные интервалы из тех же токенов отступов через
`components.Space`. Исходный интервал для группы задаётся в `ConfigProvider.space.size`.
`SpaceCompact` располагает поля вплотную и использует свои правила компоновки.
Для `SpaceAddon` используется отдельная запись `components.Addon`.

### Тема Grid

В `components.Grid` можно задать шрифт для `Row` и `Col`. Чтобы изменить точки
переключения сетки, задайте их в **глобальном** `theme.token`. Для адаптивных
`gutter`, `align` и `justify` у `Row` используются `screenSM`, `screenMD` и
другие пороги, а для колонок `Col` — `screenSMMin`, `screenMDMin` и следующие.
При изменении темы обновляются и интервалы строки, и ширина колонок.
[Адаптивная сетка](components/grid.md)

### Токены Layout

`components.Layout` задаёт, например, `headerBg`, `headerHeight`, `bodyBg`
и `triggerBg`. Внутри `Layout` шапка, основная область и подвал наследуют
его CSS-переменные, включая заданные через `style`. Вне `Layout` секции
получают собственные переменные. `LayoutSider` вычисляет их на своём корне.

### Токены Divider

`verticalMarginInline` задаёт горизонтальный отступ вертикального разделителя.
`orientationMargin` — доля длины линии для размещения подписи.
Отступ самой подписи можно задать через `styles.content`.

### Тема Masonry

В `components.Masonry` можно переопределить общие токены типографики и
переходов. Если смена шрифта изменяет высоту карточек, `fresh` включает
наблюдение за их размерами и обновление раскладки. Глобальный
`theme.token.motion: false` отключает анимацию появления и удаления карточек.

### Тема Affix

`components.Affix.zIndexPopup` задаёт порядок закреплённого элемента.
По умолчанию значение равно `zIndexBase + 10`. Компонент применяет эти токены
к внутреннему элементу, пока тот закреплён. Отступ закрепления
задаётся на самом компоненте через `offsetTop` или `offsetBottom`.

### Токены Anchor

`linkPaddingBlock` и `linkPaddingInlineStart` задают отступы ссылок.
Первый пункт горизонтального меню сохраняет нулевой начальный отступ.
Для вложенных ссылок вертикальный отступ вычисляется отдельно из `paddingXXS`.
Цвета и оформление ссылок можно изменить через общие токены в `components.Anchor`.

### Токены Breadcrumb

`components.Breadcrumb` задаёт цвета обычного и последнего пункта (`itemColor`,
`lastItemColor`), ссылки (`linkColor`, `linkHoverColor`) и разделителя
(`separatorColor`, `separatorMargin`). У пункта с меню текст ссылки получает
`linkColor`, а стрелка наследует цвет пункта. Меню оформляется отдельно через
`Dropdown` и `Menu`.

### Токены Menu

`components.Menu` задаёт размеры пунктов и групп, отступы, активную линию,
палитры светлого и тёмного оформления. Вложенный список наследует переменные
своего меню. Всплывающее подменю получает собственные переменные, в том числе
`borderRadiusLG` и `paddingXS` для промежутка между меню и заголовком.

### Токены Tabs

Для вкладок-карточек используйте `cardHeight`, `cardHeightSM`, `cardHeightLG`
и соответствующие токены отступов. Для промежутка между обычными вкладками
используйте `horizontalItemGutter`. Цвет активной линии задаёт `inkBarColor`.
Список скрытых вкладок получает переменные текущего `Tabs`, в том числе
при выводе во внешнем контейнере. [Справочник Tabs](components/tabs.md)

### Токены Pagination

`components.Pagination` задаёт оформление кнопок страниц и поля быстрого
перехода. Для поля быстрого перехода переопределяйте токены ввода в
`Pagination`. Для списка размеров страницы используются токены `Select`.
Общий `theme.token.wireframe` включает оформление пагинации с рамкой.

### Токены Steps и Timeline

`components.Steps` задаёт размеры иконок и точек, в том числе для малого
размера. У `components.Timeline` свои `tailColor`, `tailWidth`, `dotBg`,
`dotSize` и `itemPaddingBottom`. Если цвет или размер точки не задан,
действуют настройки `Steps`. Шрифт заголовка можно задать через
`Timeline.fontSize`, а шрифт иконки — через `Steps.iconFontSize`.

### Avatar и Badge

`components.Avatar` задаёт размеры аватара, текста и иконки. Настройки группы
живут в той же записи: `groupOverlapping` отвечает за перекрытие аватаров,
`groupBorderColor` — за границу. Кнопка «+N» тоже использует эти настройки.

`components.Badge` задаёт размеры счётчика, точки и индикатора статуса, шрифт
и отступы. Цвет тени вокруг индикатора берётся из `colorBorderBg`.

### Токены Card

`components.Card` задаёт высоту и фон заголовка, отступы содержимого и
оформление действий. Для маленькой карточки используйте `bodyPaddingSM`
и `headerPaddingSM`, по умолчанию оба равны 12 пикселям. `CardGrid` и
`CardMeta` наследуют тему карточки. В ячейках `CardGrid` отступ задаёт `paddingLG`.

### Токены Collapse

`headerBg` и `contentBg` задают фон заголовка и раскрытой панели.
`headerPadding` и `contentPadding` имеют отдельные значения для малого и
большого размера. Для панели без рамки есть `borderlessContentBg` и
`borderlessContentPadding`. [Справочник Collapse](components/collapse.md)

### Токены Image

`components.Image` задаёт размеры и цвета кнопок просмотра, а также `zIndexPopup`.
Изображение и окно просмотра `ImagePreviewGroup` получают эти настройки.
`styles.root` применяется к миниатюре. Параметр `preview.zIndex` имеет
приоритет при выборе слоя окна просмотра. [Справочник Image](components/image.md)

### Тема Table

В `components.Table` настраиваются отступы и фон ячеек, цвета сортировки,
наведения и выделения, оформление раскрытой строки и меню фильтров.
Например, `cellPaddingBlockMD` задаёт вертикальный отступ ячейки среднего
размера, а `footerBg` и `footerColor` — оформление подвала. Указанные в
`styles.root` CSS-переменные сохраняют приоритет при обновлении темы.
Вложенные `Button` и `Checkbox` получают собственные токены. [Справочник Table](components/table.md)

### Тема Watermark

Для отрисовки водяного знака на Canvas `Watermark` читает глобальные
`colorFill`, `fontSizeLG` и `zIndexPopupBase`. Чтобы изменить один знак,
укажите `font` и `zIndex` на компоненте. Изменение глобальных токенов
обновляет изображение. Запись `components.Watermark` и CSS-переменные
не участвуют в расчёте цвета текста для Canvas.

### Тема BorderBeam

`components.BorderBeam` принимает общие токены толщины линии, цветов градиента
и шрифта. Явные параметры рамки имеют приоритет. При выводе во внешний
`target` декоративный слой получает тему того провайдера, в котором создан
`BorderBeam`.

### Токены Alert

| Токен `components.Alert` | Что меняет |
| --- | --- |
| `borderRadius` | Скругление сообщения. По умолчанию берётся из `borderRadiusLG`. |
| `defaultPadding` | Отступы короткого сообщения. |
| `withDescriptionPadding` | Отступы сообщения с описанием. |
| `withDescriptionIconSize` | Размер иконки у сообщения с описанием. |

Цвета статусов можно менять через общие токены в этой же записи.
Оформление отдельных частей задаётся через `styles`. [Справочник Alert](components/alert.md)

### Пустое состояние Empty

В `components.Empty` можно переопределить общие токены текста и размеров.
Высота обычного изображения равна `controlHeightLG × 2.5`, простого —
`controlHeightLG`, малого — `controlHeightLG × 0.875`. Цвета внутри встроенных
SVG берутся из глобальных токенов. Для собственной иллюстрации задайте `image`.

### Токены Result

`components.Result.titleFontSize` задаёт шрифт заголовка, `subtitleFontSize` —
подзаголовка, `iconFontSize` — размер иконки, `extraMargin` — отступ блока
действий. У встроенных иллюстраций для 403, 404 и 500 собственные цвета.
[Справочник Result](components/result.md)

### Токены Spin

`components.Spin.dotSize`, `dotSizeSM` и `dotSizeLG` задают размер индикатора
при обычном, малом и большом `size`. Для своего индикатора используйте
`ConfigProvider.spin.indicator`. Само значение `contentHeight` не ограничивает
высоту содержимого. [Справочник Spin](components/spin.md)

### Токены и настройки Progress

`defaultColor` по умолчанию берётся из `colorInfo`, `remainingColor` — из
`colorFillSecondary`, `circleTextColor` — из `colorText`. Для линии используйте
`lineBorderRadius`, для подписи и иконки круга — `circleTextFontSize` и
`circleIconFontSize`. Через `ConfigProvider.progress.styles` можно оформить
отдельную часть индикатора.

### Токены Skeleton

Основной каркас и отдельные элементы используют `components.Skeleton`.
`gradientFromColor` и `gradientToColor` задают цвета градиента, `titleHeight` и
`paragraphLiHeight` — высоты строк, `paragraphMarginTop` — интервал перед
абзацем. Скругление блоков задаёт `blockRadius`.

### Тема Message

`components.Message.contentBg` задаёт фон сообщения, `contentPadding` —
отступы. По умолчанию фон берётся из `colorBgElevated`, а `zIndexPopup`
равен `zIndexPopupBase + 1010`. Смена темы обновляет уже видимые сообщения
и сохраняет очередь и время их закрытия.

### Тема Notification

`components.Notification.width` задаёт ширину карточки, по умолчанию 384 пикселя.
Через `colorSuccessBg`, `colorErrorBg`, `colorInfoBg` и `colorWarningBg`
можно задать фон каждого статуса. Без этих значений все четыре статуса
используют `colorBgElevated`. Смена темы сохраняет открытые уведомления
и их действия.

### Токены Slider

`components.Slider.railSize` задаёт толщину дорожки, `handleSize` и
`handleSizeHover` — размер бегунка в покое и при наведении. Цвета дорожки,
заполненной части и бегунка задают `railBg`, `trackBg` и `handleColor`.
Всплывающее значение использует тему `Tooltip`. [Справочник Slider](components/slider.md)

### Токены всплывающих панелей

| Панель | Где задавать оформление |
| --- | --- |
| `Dropdown` | `components.Dropdown` задаёт отступы, стрелку и `zIndexPopup`. Список команд получает шрифт из `components.Menu`, а высоту строк определяют стили `Dropdown`. |
| `Tooltip` | `components.Tooltip` задаёт `maxWidth`, стрелку и `zIndexPopup`. |
| `Popover` | Поверх темы `Tooltip` действует `components.Popover`, включая `titleMinWidth` и отступы содержимого. |
| `Popconfirm` | Настройки применяются в порядке `Tooltip`, `Popover`, `Popconfirm`. Для слоя подтверждения используйте `components.Popconfirm.zIndexPopup`. |

Расстояние от элемента до подсказки вычисляется из глобальных `marginXXS` и
`sizePopupArrow`. При включённой стрелке добавляется половина её размера.
Для выбора DOM-контейнера используйте [настройки всплывающих элементов](popup-settings.md#контейнер).

### Тема Modal

`components.Modal` задаёт фон заголовка и содержимого, цвет и размер заголовка,
оформление подвала. Тема следует за диалогом при переносе в другой контейнер.
Кнопки и поля в диалоге используют `components.Button` и `components.Input`.
Смена темы сохраняет открытый диалог, фокус и введённые данные.

### Тема Drawer

`components.Drawer.footerPaddingBlock` и `footerPaddingInline` задают отступы
подвала, `zIndexPopup` — слой панели. При переносе через `getContainer`
панель сохраняет свои CSS-переменные. Вложенные кнопки и поля получают
собственные токены.

### Тема Tour

`components.Tour` задаёт размер кнопки закрытия, цвета навигации и индикатора,
оформление стрелки. Корневой Tour без явного слоя использует 1001.
Вложенный Tour берёт слой из контекста, а `zIndex` задаёт его явно.
Кнопки в подвале используют тему `Button`.

## Уровни вложенных панелей

Modal, Drawer, Tooltip, Popover, Popconfirm, Tour и ColorPicker передают числовой
уровень потомкам, в том числе при переносе DOM в портал. Корневая поверхность
без явного слоя использует CSS-токен компонента. Корневой Tour использует 1001.
В обоих случаях потомки получают базу `zIndexPopupBase + 100`.

Эти вложенные поверхности и FloatButton, FloatButtonGroup и FloatButtonBackTop
прибавляют 100 к уровню родителя. При явном нуле у родителя используется
`zIndexPopupBase + 100`. Dropdown и всплывающие подменю Menu прибавляют 50,
включая случай нулевой базы. Dropdown передаёт свой ненулевой слой
потомкам, а явное целое `z-index` читается из итоговых стилей панели с
учётом каскада inline CSS.

Панели Select, AutoComplete, TreeSelect, Cascader, Mentions, DatePicker,
RangePicker, TimePicker и TimeRangePicker также прибавляют 50 к уровню владельца.
Явный `z-index` в доступном слоте `styles.popup.root` имеет приоритет, включая 0.
В объектах стилей Select и AutoComplete `zIndex: undefined` оставляет
слой из контекста. При `zIndex: null` панель возвращается к CSS-токену темы.
Корневая панель без явного слоя использует CSS-токен темы. Содержимое пользовательской
панели продолжает читать контекст её владельца. Например, Tooltip внутри Select
в Modal прибавляет 100 к уровню Modal.
[Эталон полей](../../tests/browser/fixtures/ant-design-input-z-index-context-reference.json)
· [Chromium](../../tests/browser/input-z-index-context.spec.ts)
· [SSR](../../tests/package/popup/z-index-context.ssr.test.ts)

Панель фильтра Table использует правила Dropdown. Встроенная панель берёт
CSS-токен Dropdown в корне и прибавляет 50 к унаследованному уровню.
Просмотр одного изображения или группы прибавляет 1 к уровню владельца.
Потомки FloatButton, FloatButtonGroup и просмотрщика читают контекст владельца.
Явный CSS FloatButton сохраняет приоритет. Числовой `preview.zIndex` задаёт
слой просмотрщика, включая 0.
[Эталон дополнительных поверхностей](../../tests/browser/fixtures/ant-design-auxiliary-z-index-context-reference.json)
· [Chromium](../../tests/browser/auxiliary-z-index-context.spec.ts)
· [SSR](../../tests/package/popup/z-index-context.ssr.test.ts)

Числовой `zIndex` на диалоге задаёт его слой и уровень для потомков.
Контекстные подтверждения Modal начинают с `zIndexPopupBase + 1000`
и принимают `zIndex` также в `handle.update`. Браузер упорядочивает
нативные `dialog` и `popover` в top layer при открытии.

В замере Ant Design 6.6.8 Drawer с `zIndex={0}` получает CSS-слой 1000
и передаёт нулевую базу потомкам. Svelte применяет 0 и к поверхности Drawer.
[Эталон](../../tests/browser/fixtures/ant-design-z-index-context-reference.json)
· [Chromium](../../tests/browser/z-index-context.spec.ts)
· [SSR](../../tests/package/popup/z-index-context.ssr.test.ts)

## CSS и SSR

`ConfigProvider.prefixCls` задаёт префикс CSS-классов, в том числе у `Flex`,
`Progress`, `Spin` и `Divider`. Например, с префиксом `suite` класс
контейнера `Flex` будет `suite-flex`. Локальный `prefixCls` компонента задаёт
его собственный класс. [Общий префикс ConfigProvider](config-provider.md)

`theme.cssVar.prefix` задаёт префикс имён CSS-переменных. Например,
`cssVar: { prefix: 'brand' }` даёт `--brand-color-primary`. Если префикс
переменных не указан, провайдер наследует его или использует общий префикс
классов. Собственный `style` на провайдере может переопределить переменную
для CSS. В `theme.useToken().token` при этом остаётся значение из конфигурации.

При серверном рендеринге провайдер уже выводит переменные темы. Если собираете
HTML вручную через `render` из `svelte/server`, включите `result.head` в
`<head>` страницы, а `result.body` — в её тело. Так браузер получит стили темы
до гидратации.

## Эталон и проверки

Наследование и результат `theme.useToken()` можно сверить с исходниками Ant Design и с тестами библиотеки.

- Исходники Ant Design — [useTheme](https://github.com/ant-design/ant-design/blob/984592267de88fbf9cdaecc96a56629e721c709d/components/config-provider/hooks/useTheme.ts), [ConfigProvider](https://github.com/ant-design/ant-design/blob/984592267de88fbf9cdaecc96a56629e721c709d/components/config-provider/index.tsx), [useToken](https://github.com/ant-design/ant-design/blob/984592267de88fbf9cdaecc96a56629e721c709d/components/theme/useToken.ts).
- Расчёт темы — [эталон токенов](../../tools/fixtures/ant-design-theme-context-reference.json), [сопоставление с эталоном](../../src/lib/theme/theme-context-reference.test.ts), [наследование](../../src/lib/theme/theme-config.engine.test.ts).
- Чтение темы в компонентах — [SSR](../../tests/package/theme/theme-context.ssr.test.ts), [браузер](../../tests/browser/theme-context.spec.ts).

### Проверки полей и элементов выбора

| Компонент | Проверки и исходные замеры |
| --- | --- |
| Кнопки и поля ввода | [Расчёт](../../src/lib/theme/theme-control-tokens-reference.test.ts), [SSR](../../tests/package/theme/control-theme.ssr.test.ts), [Браузер](../../tests/browser/control-theme.spec.ts) |
| Checkbox, Radio и Switch | [Расчёт](../../src/lib/theme/theme-toggle-tokens-reference.test.ts), [SSR](../../tests/package/theme/toggle-theme.ssr.test.ts), [Браузер](../../tests/browser/toggle-theme.spec.ts) |
| Выбор даты и времени | [Кнопка подтверждения](../../tests/browser/picker-button.spec.ts) |
| Компактная тема | [Браузер](../../tests/browser/compact-theme.spec.ts), [SSR](../../tests/package/space/compact-theme.ssr.test.ts), [Размеры](../../tests/browser/fixtures/ant-design-compact-metrics.json) |
| Select | [Расчёт](../../src/lib/theme/theme-select-tokens-reference.test.ts), [Браузер](../../tests/browser/select-theme.spec.ts), [SSR](../../tests/package/select/select-theme.ssr.test.ts) |
| AutoComplete | [Размеры](../../tests/browser/fixtures/ant-design-auto-complete-metrics.json), [Браузер](../../tests/browser/auto-complete-theme.spec.ts), [SSR](../../tests/package/auto-complete/auto-complete-theme.ssr.test.ts) |
| TreeSelect | [Расчёт](../../src/lib/theme/theme-tree-select-tokens-reference.test.ts), [Размеры](../../tests/browser/fixtures/ant-design-tree-select-metrics.json), [Браузер](../../tests/browser/tree-select-theme.spec.ts), [SSR](../../tests/package/tree-select/tree-select-theme.ssr.test.ts) |
| Slider | [Расчёт](../../src/lib/theme/theme-slider-tokens-reference.test.ts), [Размеры и цвета](../../tests/browser/fixtures/ant-design-slider-theme-reference.json), [SSR](../../tests/package/slider/slider-theme.ssr.test.ts), [Браузер](../../tests/browser/slider-theme.spec.ts) |
| Mentions | [Браузер](../../tests/browser/mentions-theme.spec.ts), [Расчёт](../../src/lib/theme/theme-mentions-tokens-reference.test.ts), [SSR](../../tests/package/mentions/mentions-theme.ssr.test.ts) |
| Upload | [Расчёт](../../src/lib/theme/theme-upload-tokens-reference.test.ts), [SSR](../../tests/package/upload/upload-theme.ssr.test.ts), [Браузер](../../tests/browser/upload-theme.spec.ts) |

### Проверки компоновки и навигации

| Компонент | Проверки и исходные замеры |
| --- | --- |
| Flex | [Параметры и стили](../../tests/browser/flex-source.spec.ts) |
| Flex и Divider | [Префикс при SSR](../../tests/package/config-provider/core-prefix.ssr.test.ts), [Префикс в браузере](../../tests/browser/core-prefix.spec.ts) |
| Divider | [Браузер](../../tests/browser/divider-theme.spec.ts), [SSR](../../tests/package/divider/divider-theme.ssr.test.ts), [Стили и префикс](../../tests/browser/divider-config.spec.ts) |
| Affix | [Расчёт](../../src/lib/theme/theme-affix-tokens-reference.test.ts), [Геометрия](../../tests/browser/fixtures/ant-design-affix-theme-reference.json), [SSR](../../tests/package/affix/affix-theme.ssr.test.ts), [Браузер](../../tests/browser/affix-theme.spec.ts) |
| Space | [Тема и настройки](../../tests/browser/fixtures/ant-design-space-theme-reference.json), [SSR](../../tests/package/space/space-theme.ssr.test.ts), [Браузер](../../tests/browser/space-theme.spec.ts) |
| Layout | [Размеры секций](../../tests/browser/fixtures/ant-design-layout-theme-reference.json) |
| Masonry | [Стили и размеры](../../tests/browser/fixtures/ant-design-masonry-theme-reference.json) |
| Row и Col | [Расчёт](../../src/lib/theme/theme-grid-tokens-reference.test.ts), [SSR](../../tests/package/grid/grid-theme.ssr.test.ts), [Браузер](../../tests/browser/grid-theme.spec.ts), [Пороги компонента](../../tests/browser/fixtures/ant-design-grid-media-observation.json) |
| Адаптивные пороги сетки | [Эталон](../../tests/browser/fixtures/ant-design-grid-breakpoints-reference.json), [Браузер](../../tests/browser/grid-breakpoints.spec.ts), [Страница без JavaScript](../../tests/browser/grid-breakpoints-ssr.spec.ts), [SSR](../../tests/package/grid/grid-breakpoints.ssr.test.ts), [Расчёт порогов](../../src/lib/grid/grid-style.engine.test.ts), [Обновление темы](../../tests/browser/fixtures/ant-design-grid-breakpoints-update-observation.json) |
| Steps и Timeline | [Расчёт](../../src/lib/theme/theme-steps-tokens-reference.test.ts), [Размеры](../../tests/browser/fixtures/ant-design-steps-metrics.json), [Браузер](../../tests/browser/steps-theme.spec.ts), [SSR](../../tests/package/steps/steps-theme.ssr.test.ts) |
| Pagination | [Расчёт](../../src/lib/theme/theme-pagination-tokens-reference.test.ts), [Размеры](../../tests/browser/fixtures/ant-design-pagination-metrics.json), [SSR](../../tests/package/pagination/pagination-theme.ssr.test.ts), [Браузер](../../tests/browser/pagination-theme.spec.ts) |
| Tabs | [Расчёт](../../src/lib/theme/theme-tabs-tokens-reference.test.ts), [Размеры](../../tests/browser/fixtures/ant-design-tabs-theme-metrics.json), [SSR](../../tests/package/tabs/tabs-theme.ssr.test.ts), [Браузер](../../tests/browser/tabs-theme.spec.ts) |
| Стили и переходы Tabs | [Стили](../../tests/browser/fixtures/ant-design-tabs-semantic-reference.json), [Стили при SSR](../../tests/package/tabs/tabs-semantic.ssr.test.ts), [Стили в браузере](../../tests/browser/tabs-semantic.spec.ts), [Переходы](../../tests/browser/fixtures/ant-design-tabs-motion-reference.json), [Переходы при SSR](../../tests/package/tabs/tabs-motion.ssr.test.ts), [Переходы в браузере](../../tests/browser/tabs-motion.spec.ts) |

### Проверки данных и обратной связи

| Компонент | Проверки и исходные замеры |
| --- | --- |
| Avatar и Badge | [Расчёт](../../src/lib/theme/theme-display-tokens-reference.test.ts), [Браузер](../../tests/browser/avatar-badge-theme.spec.ts), [SSR](../../tests/package/theme/avatar-badge-theme.ssr.test.ts) |
| Image | [Миниатюра и просмотр](../../tests/browser/fixtures/ant-design-image-theme-reference.json) |
| Watermark | [Отрисовка](../../tests/browser/fixtures/ant-design-watermark-theme-reference.json), [Браузер](../../tests/browser/watermark-theme.spec.ts), [SSR](../../tests/package/watermark/watermark-theme.ssr.test.ts) |
| BorderBeam | [Расчёт](../../src/lib/theme/theme-border-beam-tokens-reference.test.ts), [Внешний контейнер](../../tests/browser/fixtures/ant-design-border-beam-theme-reference.json), [Браузер](../../tests/browser/border-beam-theme.spec.ts), [SSR](../../tests/package/border-beam/border-beam-theme.ssr.test.ts) |
| Table | [Расчёт](../../src/lib/theme/theme-table-tokens-reference.test.ts), [SSR](../../tests/package/table/table-theme.ssr.test.ts), [Браузер](../../tests/browser/table-theme.spec.ts) |
| Стили и состояния таблицы | [Стили корня](../../tests/browser/fixtures/ant-design-table-root-style-observation.json), [Панели](../../tests/browser/fixtures/ant-design-table-panels-reference.json), [Панели в браузере](../../tests/browser/table-panels.spec.ts), [Подсветка строк](../../tests/browser/fixtures/ant-design-table-hover-observation.json), [Параметры строк](../../tests/browser/table-row-options.spec.ts) |
| Alert | [Стили](../../tests/browser/fixtures/ant-design-alert-reference.json), [Оформление по умолчанию](../../tests/browser/fixtures/alert-native-reference.json), [SSR](../../tests/package/alert/alert.ssr.test.ts), [Браузер](../../tests/browser/alert-source.spec.ts) |
| Result | [Стили и статусы](../../tests/browser/fixtures/ant-design-result-reference.json), [Браузер](../../tests/browser/result-source.spec.ts), [SSR](../../tests/package/result/result.ssr.test.ts) |
| Empty | [Тема и изображения](../../tests/browser/fixtures/ant-design-empty-reference.json) |
| Spin | [Размеры и оформление](../../tests/browser/fixtures/ant-design-spin-source-reference.json), [Браузер](../../tests/browser/spin-source.spec.ts) |
| Progress | [Линия](../../tests/browser/fixtures/ant-design-progress-line-reference.json), [Круг](../../tests/browser/fixtures/ant-design-progress-circle-reference.json) |
| Skeleton | [Отдельные элементы](../../tests/browser/fixtures/ant-design-skeleton-element-reference.json), [Основной каркас](../../tests/browser/fixtures/ant-design-skeleton-main-reference.json) |

### Проверки диалогов и уведомлений

| Компонент | Проверки и исходные замеры |
| --- | --- |
| Drawer | [Расчёт](../../src/lib/theme/theme-drawer-tokens-reference.test.ts), [SSR](../../tests/package/drawer/drawer-theme.ssr.test.ts), [Браузер](../../tests/browser/drawer-theme.spec.ts) |
| Modal | [Расчёт](../../src/lib/theme/theme-modal-tokens-reference.test.ts), [SSR](../../tests/package/modal/modal-theme.ssr.test.ts), [Браузер](../../tests/browser/modal-theme.spec.ts) |
| Message | [Расчёт](../../src/lib/theme/theme-message-tokens-reference.test.ts), [SSR](../../tests/package/message/message-theme.ssr.test.ts), [Браузер](../../tests/browser/message-theme.spec.ts), [Перенос текста](../../tests/browser/fixtures/ant-design-message-wrap-observation.json) |
| Notification | [Расчёт](../../src/lib/theme/theme-notification-tokens-reference.test.ts), [SSR](../../tests/package/notification/notification-theme.ssr.test.ts), [Браузер](../../tests/browser/notification-theme.spec.ts), [Цвета статусов](../../tests/browser/fixtures/ant-design-notification-background-observation.json), [Ширина карточки](../../tests/browser/fixtures/ant-design-notification-width-observation.json) |
| Всплывающие панели | [Расчёт](../../src/lib/theme/theme-overlay-tokens-reference.test.ts), [Браузер](../../tests/browser/overlay-theme.spec.ts), [SSR](../../tests/package/popup/overlay-theme.ssr.test.ts) |
| Tour | [Приоритет zIndex](../../tests/browser/fixtures/ant-design-tour-z-index-observation.json) |

Лицензии исходных библиотек — [Ant Design](../../src/lib/vendor/LICENSE.ant-design), [cssinjs](../../src/lib/vendor/LICENSE.cssinjs), [cssinjs-utils](../../src/lib/vendor/LICENSE.cssinjs-utils), [emotion/hash](../../src/lib/vendor/LICENSE.emotion-hash).
