# Компоненты

Выберите компонент по задаче. В каждом справочнике описаны настройки, примеры
использования и ограничения. Компоненты и их типы импортируются из `@woodger/antd`.

## Справочники компонентов

### Настройки приложения

- [ConfigProvider](../themes.md) — тема, язык, направление текста и размер компонентов. Для собственных имён CSS-классов см. [настройку префикса](../config-provider.md).
- [App](app.md) — доступ к сообщениям, уведомлениям и модальным окнам через `App.useApp()`.

### Действия и навигация

- [Button](button.md) — кнопка действия или ссылка. Для отправки формы задайте `htmlType="submit"`.
- [FloatButton, FloatButtonGroup и FloatButtonBackTop](float-button.md) — плавающие действия и возврат к началу страницы.
- [Menu](menu.md) и [Dropdown](dropdown.md) — меню навигации и выпадающее меню команд.
- [Anchor](anchor.md) и [Breadcrumb](breadcrumb.md) — переходы по разделам страницы и по иерархии страниц.
- [Tabs](tabs.md) и [Steps](steps.md) — переключение вкладок и навигация по шагам.
- [Pagination](pagination.md) — переход между страницами и выбор числа записей на странице.
- [Tour](tour.md) — пошаговые подсказки у элементов интерфейса.

### Формы и ввод

- [Form и FormItem](../forms.md) — модель, подписи полей, правила валидации и отправка. [FormList](../forms.md#formlist) управляет массивом полей, [FormErrorList](../forms.md#formerrorlist) выводит его ошибки.
- [Input](input.md) и [TextArea](text-area.md) — однострочный и многострочный ввод текста.
- [InputPassword](input-password.md), [InputSearch](input-search.md) и [InputOTP](input-otp.md) — пароль, поисковый запрос и одноразовый код.
- [InputNumber](input-number.md) и [Slider](slider.md) — ввод числа и выбор значения или диапазона на шкале.
- [Select](select.md) — выбор одного или нескольких значений, поиск и теги. [AutoComplete](auto-complete.md) предлагает варианты при вводе произвольного текста.
- [Mentions](mentions.md) — подсказки после префикса, например `@`.
- [Checkbox](checkbox.md) и [CheckboxGroup](checkbox-group.md) — отдельный флажок и выбор нескольких вариантов.
- [Radio, RadioButton и RadioGroup](radio.md) и [Segmented](segmented.md) — выбор одного из нескольких вариантов.
- [Switch](switch.md) — переключение между двумя состояниями.
- [DatePicker](date-picker.md) и [RangePicker](range-picker.md) — выбор даты или интервала дат.
- [TimePicker](time-picker.md) и [TimeRangePicker](time-range-picker.md) — выбор времени или интервала времени.
- [Cascader и CascaderPanel](cascader.md) — выбор пути по уровням. [TreeSelect](tree-select.md) показывает варианты в виде дерева.
- [Transfer](transfer.md) — перенос выбранных записей между двумя списками.
- [ColorPicker](color-picker.md), [Rate](rate.md) и [Upload / UploadDragger](upload.md) — выбор цвета, оценка и загрузка файлов.

### Компоновка

- [Layout](layout.md) — шапка, основная область, подвал и боковая панель.
- [Row и Col](grid.md) — адаптивная сетка. [Flex](flex.md) выравнивает элементы по оси, [Space, SpaceCompact и SpaceAddon](space.md) задают интервалы и группируют поля.
- [Masonry](masonry.md) — колонки для элементов разной высоты.
- [Splitter](splitter.md) — панели с изменяемой шириной или высотой.
- [Divider](divider.md) — разделитель с подписью. [Affix](affix.md) закрепляет элемент при прокрутке.

### Отображение данных

- [Table](table.md) — строки и колонки, сортировка, фильтры и пагинация. [Descriptions](descriptions.md) выводит пары «название — значение».
- [Tree и DirectoryTree](tree.md) — дерево данных и навигация по каталогам. [Listy](listy.md) — виртуализированный список с группами.
- [Card, CardGrid и CardMeta](card.md), [Collapse](collapse.md) и [Carousel](carousel.md) — карточки, раскрывающиеся панели и слайды.
- [Typography](typography.md) — заголовки, абзацы, ссылки и действия с текстом.
- [Calendar](calendar.md) и [Timeline](timeline.md) — календарь и последовательность событий.
- [Statistic и StatisticTimer](statistic.md) — форматирование чисел и отсчёт времени.
- [Tag, CheckableTag и CheckableTagGroup](tag.md) — метки и выбор по меткам.
- [Badge](badge.md) и [BadgeRibbon](badge-ribbon.md) — счётчики, статусы и ленты.
- [Avatar](avatar.md) и [AvatarGroup](avatar-group.md) — изображения и инициалы участников, по одному или в группе.
- [Image](image.md) и [ImagePreviewGroup](image-preview-group.md) — просмотр изображения и переходы между изображениями.
- [QRCode](qr-code.md), [Watermark](watermark.md) и [BorderBeam](border-beam.md) — QR-код, водяной знак и анимированная рамка.

### Обратная связь и всплывающие элементы

- [Alert](alert.md), [MessageHolder и createMessage](message.md), [NotificationHolder и createNotification](notification.md) — сообщение в потоке страницы, краткое сообщение о действии и уведомление.
- [Modal](modal.md) и [Drawer](drawer.md) — диалоговое окно и выдвижная панель.
- [Tooltip](tooltip.md), [Popover](popover.md) и [Popconfirm](popconfirm.md) — подсказка, всплывающая карточка и подтверждение действия.
- [Spin](spin.md), [Skeleton](skeleton.md) и [Progress](progress.md) — индикатор ожидания, каркас содержимого и прогресс операции.
- [Empty](empty.md) и [Result](result.md) — пустая выдача и итог операции.
