# Компоненты

Точные `Props`, `callbacks`, `snippets` и `refs` определены рядом с компонентами и
экспортируются через [index.ts](../../../src/lib/index.ts). JSDoc у исходных объявлений
описывает defaults, приоритеты и ограничения; сборка сохраняет его в декларациях
пакета. Таблица ниже описывает поведение и не заменяет эти объявления.

| Компонент | Поддерживаемое поведение |
| --- | --- |
| ConfigProvider | Светлая и тёмная темы, три основных цвета, компактная плотность, размеры, disabled, направление и локаль |
| App | Контекст Message/Notification/Modal, встроенные holders, вложенные настройки, root/fragment и App.useApp() |
| Button | Native button/href, color/variant/ghost, loading delay/icon, semantic slots, config и Compact |
| Typography / TypographyText / TypographyTitle / TypographyParagraph / TypographyLink | Нативный текст, decorations, copy/edit, CSS/JS ellipsis, expand/collapse и semantic config |
| FloatButton / FloatButtonGroup / FloatButtonBackTop | Плавающие native actions, Badge/Tooltip, меню групп и возврат с прогрессом прокрутки |
| Watermark | Text/image Canvas tiles, per-line fonts, offsets, mutation repair, наследование Modal/Drawer |
| BorderBeam | CSS-лучи по рамке нативного контейнера, градиенты, фазы, размеры и reduced motion |
| Rate | Value/defaultValue, half/clear, hover, keyboard/RTL, character/tooltips, размеры и focus ref |
| Input | Native text/events/forms, prefix/suffix, clear/count, variants, semantic slots и input config |
| InputPassword | Видимость пароля, click/hover/keyboard, controlled toggle, focus/selection и возможности Input |
| InputSearch | Поиск по кнопке/Enter/очистке, loading/IME, custom button snippet и композиция Compact |
| InputOTP | UTF-16 ячейки, formatter/paste, mask/separator, keyboard/focus и callbacks полного кода |
| DatePicker | Single Dayjs date/datetime, input/calendar/time, presets и preview, confirmation, clear, ограничения, locale и native формы |
| RangePicker | Пара Dayjs, связанные календари, время и подтверждение границ, allowEmpty/disabled, presets и hover |
| Calendar | Full/mini date/month panels, controlled value/mode, header, week numbers, snippets и custom date adapter |
| Upload / UploadDragger | Выбор/drop, controlled list, beforeUpload, XHR/customRequest, статусы и удаление |
| Tree / DirectoryTree | TreeData, раскрытие/выбор/отметки, strict/conduction, loadData, клавиатура и выбор диапазона |
| TreeSelect | Single/multiple, labelInValue, check strategies, поиск, loadData и native popup |
| Cascader / CascaderPanel | Полные пути, multiple/check strategies, поиск, lazy children, колонки и standalone Panel |
| Transfer | Два списка, controlled targetKeys, выделение/Shift, поиск, oneWay, пагинация и custom lists |
| Listy | Группы, sticky headers, измеряемая виртуализация, scrollTo и native scroll |
| Carousel | Слайды, infinite/finite, rows, fade, swipe, autoplay, lazy loading, responsive и refs |
| TextArea | Многострочное значение, native constraints/events/selection, формы, размеры, статусы и RTL |
| InputNumber | Число/null и stringMode, точные десятичные шаги, formatter/parser, spinner, variants, prefix/suffix, refs, FormData и reset |
| Slider | Число или диапазон, marks/dots, editable/draggableTrack, push/cross, клавиатура, подсказки, темы/RTL, native формы и refs |
| ColorPicker | Color-модель, RGB/HSB/hex/alpha, palette, single/gradient, presets, semantic config и native popup |
| Image / ImagePreviewGroup | Native img/fallback/placeholder, preview transforms/focus и групповая навигация по images/items |
| Mentions | Prefix/split, поиск у каретки, loading, autoSize, popupRender и контейнер |
| AutoComplete | Свободный текст, options/groups, поиск, keyboard backfill, custom input и controlled popup |
| Select | Одиночный и множественный выбор строковых/числовых значений; поиск, очистка, disabled options, клавиатура и FormData |
| Checkbox | Checked/defaultChecked, mixed state, semantic config, callbacks/refs, native формы и участие в группе |
| CheckboxGroup | Типизированный массив, options/children, skipGroup, semantic options, FormData, disabled и reset |
| Radio | Checked/defaultChecked, semantic config, callbacks/refs, нативные группы и FormData |
| RadioButton | Кнопочное оформление Radio, native input, group context и refs |
| RadioGroup | Типизированный одиночный выбор, options, уникальное имя группы, горизонтальное/вертикальное расположение, required, reset и FormItem |
| Switch | Checked/value aliases, source events, semantic config, refs, loading, клавиатура и native формы |
| Pagination | Страницы, переходы по пять страниц, выбор pageSize, диапазон записей, размеры, RTL и локаль |
| Table | Типизированные колонки и snippets, фильтры, стабильная сортировка одной колонки, локальная и серверная пагинация, выбор и раскрытие строк, закрепление заголовка и колонок, loading и пустые данные |
| Modal | Нативный dialog, заголовок, footer snippet, loading Skeleton, confirmLoading и callbacks |
| Tour | Шаги, target/mask/gap, 12 размещений, controlled/default state, keyboard, snippets и semantic config |
| Tooltip | Текст, hover/focus, bind:open, задержки, Escape, 12 положений, стрелка, автоматический переворот и aria-describedby |
| Popover | Интерактивные snippets, click/hover/focus, bind:open, 12 положений, стрелка, автоматический переворот, клавиатура и возврат фокуса |
| Popconfirm | Подтверждение и отмена, Promise/loading, повтор после ошибки, защита от поздних результатов, snippets, локализация и клавиатура |
| Dropdown | Плоское меню команд, click/hover, bind:open, disabled/danger, snippets, шесть положений, стрелки/typeahead и возврат фокуса |
| Menu | Items/группы/подменю, selected/open keys, horizontal/vertical/inline, native links, клавиатура и collapse |
| Tabs | Типизированные панели, bind:activeKey, line/card/editable-card, четыре положения, centered/gutter, меню more, ручная клавиатурная активация, сохранение содержимого и destroyOnHidden |
| Collapse | Независимые панели и accordion, bind:activeKey, snippets, extra, header/icon/disabled, сохранение содержимого и destroyOnHidden |
| Drawer | Модальная выдвижная панель, bind:open, четыре стороны, размеры, snippets, анимация, сохранение содержимого и destroyOnHidden |
| Alert | Четыре статуса, scalar/snippet content, semantic/provider config, component tokens, prefix/ref и закрытие с доступным фокусом |
| MessageHolder / createMessage | Изолированная очередь пяти типов сообщений, ключи и обновления, таймеры, hover-пауза, maxCount, callable/thenable handle и контекст ConfigProvider |
| NotificationHolder / createNotification | Подробные уведомления с title/description/actions snippets, четыре статуса, шесть положений, ключи, таймеры, hover/focus-пауза и закрытие |
| Progress | Line/circle/dashboard, steps, gradients, success и percentPosition; component tokens, semantic/provider config, local prefix и formatter snippets; ARIA/RTL/SSR |
| Spin | Standalone/children/fullscreen, percent/auto, component tokens, prefixCls, semantic/provider config, indicator snippets и static fallback; сохранены inert и восстановление фокуса |
| Skeleton | Каркас первой загрузки и Avatar/Button/Input/Image/Node; размеры, темы, active/round, semantic slots, ConfigProvider, prefix, refs, замена children, доступный статус и фокус |
| Empty | Пустое состояние, default/simple SVG, image/description snippets, действия, локаль, темы и восстановление фокуса |
| Result | Семь статусов, официальные иконки/SVG, static images, component tokens, semantic/provider config, prefix/ref и восстановление фокуса |
| Steps | Управляемые этапы, статусы, snippets, нативные кнопки, horizontal/vertical, medium/small, локаль, темы и восстановление фокуса |
| Tag | Preset/status/CSS colors, варианты, semantic styles, ConfigProvider.tag, snippets и отменяемое закрытие |
| CheckableTag | Управляемый checked/onChange, click/keyboard callbacks, DOM attrs/ref, нативная toggle-кнопка, aria-pressed и disabled |
| CheckableTagGroup | Одиночный/множественный выбор, controlled/defaultValue, options, семантические стили и native ref |
| Badge | Числовой счётчик, overflow/showZero/dot, статусы/preset цвета, string/Snippet text, размеры, offset и доступное полное значение |
| Avatar | Изображение, icon/children fallback, circle/square, именованные/числовые/адаптивные размеры, подгонка текста и доступное имя |
| AvatarGroup | Типизированные items, стабильные ключи, общие размеры/форма, перекрытие, max.count и скрытые участники в Popover |
| Divider | Направления, подпись, titlePlacement, варианты линий, размеры, semantic slots и nativeElement |
| Flex | Прямые дети, направления, align/justify, wrap, gap/flex, нативный component и nativeElement |
| Statistic | Числа/строки, precision без округления, разделители, formatter, snippets, semantic slots и loading |
| StatisticTimer | Отсчёт времени вверх/вниз, формат, callbacks, SSR-placeholder и отмена интервалов |
| Segmented | Типизированный одиночный выбор, native radio, стрелки, размеры, block/round, snippets и semantic slots |
| Row / Col | 24 колонки, responsive span/offset/order/push/pull/flex, gutter, align/justify и вложенные контексты |
| Masonry | DOM-высоты, кратчайшие колонки, responsive gutters, fresh, keyed items и CSS appear/leave |
| Layout / LayoutHeader / LayoutContent / LayoutFooter / LayoutSider | Нативная структура, hasSider, collapse/trigger, responsive sidebar, темы и RTL |
| Descriptions | Таблица read-only полей, responsive column/span/filled, horizontal/vertical, bordered и semantic slots |
| Card / CardGrid / CardMeta | Header/cover/body/actions, loading, grid, tabs, metadata, semantic slots и варианты оформления |
| Breadcrumb | Items/routes, params, separator items, custom Snippet renderer, меню и native navigation |
| Space / SpaceCompact / SpaceAddon | Wrappers/gaps/separators, компактные стыки controls, размеры, вложенность и addon variants/status |
| Form | Типизированная модель, валидация, submit, reset и обработка ошибок |
| FormItem | Label, required, help, ошибки и контекст доступности одного control |
| FormList | Вложенные массивы, initialValue, add/remove/move, устойчивые ключи и custom validation |
| FormErrorList | Ошибки и предупреждения FormList, help, темы и lifecycle сообщений |

Input и Select поддерживают `bind:value` и `onValueChange`. Очистка одиночного
Select возвращает `undefined`, множественного — `[]`; числовой `0` остаётся допустимым значением. `defaultValue`
используется как начальное значение отдельного control. Для control с
`bind:value` задавайте начальное значение у владельца и не передавайте
`defaultValue`. Для сброса привязанного значения изменяйте состояние владельца.

Button `type` задаёт оформление, `htmlType` задаёт нативный тип кнопки и по
умолчанию равен `button`. Вариант `link` остаётся кнопкой действия без href;
при href создаётся нативная ссылка. Кнопка loading недоступна для повторного
нажатия. Подробности — в [справочнике Button](button.md).


## Справочники компонентов

- [Button](button.md)
- [Divider](divider.md)
- [Flex](flex.md)
- [Statistic](statistic.md)
- [Segmented](segmented.md)
- [Grid: Row, Col и breakpoints](grid.md)
- [Masonry](masonry.md)
- [Splitter](splitter.md)
- [Layout](layout.md)
- [Descriptions](descriptions.md)
- [Card](card.md)
- [Breadcrumb](breadcrumb.md)
- [Anchor](anchor.md)
- [Affix](affix.md)
- [Space](space.md)
- [InputNumber](input-number.md)
- [ColorPicker](color-picker.md)
- [Slider](slider.md)
- [Tooltip](tooltip.md)
- [Popover](popover.md)
- [Popconfirm](popconfirm.md)
- [Menu](menu.md)
- [Dropdown](dropdown.md)
- [Tabs](tabs.md)
- [Collapse](collapse.md)
- [Modal](modal.md)
- [Drawer](drawer.md)
- [Alert](alert.md)
- [Message](message.md)
- [Notification](notification.md)
- [Progress](progress.md)
- [Spin](spin.md)
- [Skeleton](skeleton.md)
- [Empty](empty.md)
- [Result](result.md)
- [Steps](steps.md)
- [DatePicker](date-picker.md)
- [TimePicker](time-picker.md)
- [TimeRangePicker (TimePicker.RangePicker)](time-range-picker.md)
- [RangePicker (DatePicker.RangePicker)](range-picker.md)
- [Calendar](calendar.md)
- [Cascader / CascaderPanel](cascader.md)
- [Transfer](transfer.md)
- [Carousel](carousel.md)
- [Tour](tour.md)
- [Typography](typography.md)
- [Listy](listy.md)
- [TreeSelect](tree-select.md)
- [Tree](tree.md)
- [Upload / UploadDragger](upload.md)
- [Input](input.md)
- [InputPassword (Input.Password)](input-password.md)
- [InputSearch (Input.Search)](input-search.md)
- [InputOTP (Input.OTP)](input-otp.md)
- [TextArea (Input.TextArea)](text-area.md)
- [FloatButton, FloatButtonGroup и FloatButtonBackTop](float-button.md)
- [Timeline](timeline.md)
- [Tag, CheckableTag и CheckableTagGroup](tag.md)
- [Badge](badge.md)
- [BadgeRibbon](badge-ribbon.md)
- [Avatar](avatar.md)
- [AvatarGroup](avatar-group.md)
- [Image](image.md)
- [ImagePreviewGroup (Image.PreviewGroup)](image-preview-group.md)
- [QRCode](qr-code.md)
- [BorderBeam](border-beam.md)
- [Watermark](watermark.md)
- [Rate](rate.md)
- [Mentions](mentions.md)
- [AutoComplete](auto-complete.md)
- [Select](select.md)
- [Checkbox](checkbox.md)
- [CheckboxGroup](checkbox-group.md)
- [Radio и RadioGroup](radio.md)
- [Switch](switch.md)
- [Pagination](pagination.md)
- [Table](table.md)
- [App](app.md)
