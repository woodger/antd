# Справочник компонентов

## Подключение

Соберите библиотеку командой `npm run build` из её корня. Если рядом находится приложение
на Svelte 5, выполните из его каталога `npm install ../antd-svelte`. Пакет приватный.
Сборщику приложения нужна поддержка Svelte 5. Диапазоны версий Svelte и Day.js указаны
в `peerDependencies`. [Метаданные пакета](../../../package.json).

В компоненте приложения импортируйте нужные имена из `antd-svelte`.

```svelte
<script lang="ts">
  import { Button, ConfigProvider, Input, Select } from 'antd-svelte';

  let name = $state('');
  let role = $state<string | undefined>('developer');
</script>

<ConfigProvider theme={{ mode: 'light', primary: 'blue' }}>
  <label for="name">Имя</label>
  <Input id="name" bind:value={name} />

  <label for="role">Роль</label>
  <Select
    id="role"
    bind:value={role}
    options={[
      { value: 'developer', label: 'Разработчик' },
      { value: 'designer', label: 'Дизайнер' }
    ]}
    showSearch
    allowClear
  />

  <Button type="primary" onclick={() => console.log(name, role)}>Сохранить</Button>
</ConfigProvider>
```

ConfigProvider подключает стили. Для использования отдельных компонентов без
провайдера импортируйте `antd-svelte/styles.css` один раз в корневом layout.

## Компоненты

Точные Props, callbacks, snippets и refs определены рядом с компонентами и
экспортируются через [index.ts](../../../src/lib/index.ts). JSDoc у исходных объявлений
описывает defaults, приоритеты и ограничения; сборка сохраняет его в декларациях
пакета. Таблица ниже описывает поведение и не заменяет эти объявления.

| Компонент | Поддерживаемое поведение |
| --- | --- |
| [Affix](layout.md#affix) | Фиксация при прокрутке страницы или заданного контейнера |
| [Alert](feedback.md#alert) | Четыре статуса, scalar/snippet content, semantic/provider config, component tokens, prefix/ref и закрытие с доступным фокусом |
| [Anchor](navigation.md#anchor) | Ссылки на разделы страницы и индикатор текущего заголовка |
| [App](configuration.md#app) | Контекст Message/Notification/Modal, встроенные holders, вложенные настройки, root/fragment и App.useApp() |
| [AutoComplete](data-entry.md#autocomplete) | Свободный текст, options/groups, поиск, keyboard backfill, custom input и controlled popup |
| [Avatar](data-display.md#avatar) | Изображение, icon/children fallback, circle/square, именованные/числовые/адаптивные размеры, подгонка текста и доступное имя |
| [AvatarGroup](data-display.md#avatargroup) | Типизированные items, стабильные ключи, общие размеры/форма, перекрытие, max.count и скрытые участники в Popover |
| [Badge](data-display.md#badge) | Числовой счётчик, overflow/showZero/dot, статусы/preset цвета, string/Snippet text, размеры, offset и доступное полное значение |
| [BadgeRibbon](data-display.md#badgeribbon) | Лента с подписью, цветом и положением на дочернем элементе |
| [BorderBeam](layout.md#borderbeam) | CSS-лучи по рамке нативного контейнера, градиенты, фазы, размеры и reduced motion |
| [Breadcrumb](navigation.md#breadcrumb) | Items/routes, params, separator items, custom Snippet renderer, меню и native navigation |
| [Button](layout.md#button) | Native button/href, color/variant/ghost, loading delay/icon, semantic slots, config и Compact |
| [Calendar](date-time.md#calendar) | Full/mini date/month panels, controlled value/mode, header, week numbers, snippets и custom date adapter |
| [Card / CardGrid / CardMeta](data-display.md#card) | Header/cover/body/actions, loading, grid, tabs, metadata, semantic slots и варианты оформления |
| [Carousel](data-display.md#carousel) | Слайды, infinite/finite, rows, fade, swipe, autoplay, lazy loading, responsive и refs |
| [Cascader / CascaderPanel](data-entry.md#cascader--cascaderpanel) | Полные пути, multiple/check strategies, поиск, lazy children, колонки и standalone Panel |
| [CheckableTag](data-display.md#tag-checkabletag-и-checkabletaggroup) | Управляемый checked/onChange, click/keyboard callbacks, DOM attrs/ref, нативная toggle-кнопка, aria-pressed и disabled |
| [CheckableTagGroup](data-display.md#tag-checkabletag-и-checkabletaggroup) | Одиночный/множественный выбор, controlled/defaultValue, options, семантические стили и native ref |
| [Checkbox](data-entry.md#checkbox) | Checked/defaultChecked, mixed state, semantic config, callbacks/refs, native формы и участие в группе |
| [CheckboxGroup](data-entry.md#checkboxgroup) | Типизированный массив, options/children, skipGroup, semantic options, FormData, disabled и reset |
| [Collapse](data-display.md#collapse) | Независимые панели и accordion, bind:activeKey, snippets, extra, header/icon/disabled, сохранение содержимого и destroyOnHidden |
| [ColorPicker](data-entry.md#colorpicker) | Color-модель, RGB/HSB/hex/alpha, palette, single/gradient, presets, semantic config и native popup |
| [ConfigProvider](configuration.md#темы-и-локализация) | Светлая и тёмная темы, три основных цвета, компактная плотность, размеры, disabled, направление и локаль |
| [DatePicker](date-time.md#datepicker) | Single Dayjs date/datetime, input/calendar/time, presets и preview, confirmation, clear, ограничения, locale и native формы |
| [Descriptions](data-display.md#descriptions) | Таблица read-only полей, responsive column/span/filled, horizontal/vertical, bordered и semantic slots |
| [Divider](layout.md#divider) | Направления, подпись, titlePlacement, варианты линий, размеры, semantic slots и nativeElement |
| [Drawer](feedback.md#drawer) | Модальная выдвижная панель, bind:open, четыре стороны, размеры, snippets, анимация, сохранение содержимого и destroyOnHidden |
| [Dropdown](navigation.md#dropdown) | Плоское меню команд, click/hover, bind:open, disabled/danger, snippets, шесть положений, стрелки/typeahead и возврат фокуса |
| [Empty](feedback.md#empty) | Пустое состояние, default/simple SVG, image/description snippets, действия, локаль, темы и восстановление фокуса |
| [Flex](layout.md#flex) | Прямые дети, направления, align/justify, wrap, gap/flex, нативный component и nativeElement |
| [FloatButton / FloatButtonGroup / FloatButtonBackTop](layout.md#floatbutton-floatbuttongroup-и-floatbuttonbacktop) | Плавающие native actions, Badge/Tooltip, меню групп и возврат с прогрессом прокрутки |
| [Form](forms.md#формы-и-валидация) | Типизированная модель, валидация, submit, reset и обработка ошибок |
| [FormErrorList](forms.md#formerrorlist) | Ошибки и предупреждения FormList, help, темы и lifecycle сообщений |
| [FormItem](forms.md#формы-и-валидация) | Label, required, help, ошибки и контекст доступности одного control |
| [FormList](forms.md#formlist) | Вложенные массивы, initialValue, add/remove/move, устойчивые ключи и custom validation |
| [Image](data-display.md#image) / [ImagePreviewGroup](data-display.md#imagepreviewgroup-imagepreviewgroup) | Native img/fallback/placeholder, preview transforms/focus и групповая навигация по images/items |
| [Input](data-entry.md#input) | Native text/events/forms, prefix/suffix, clear/count, variants, semantic slots и input config |
| [InputNumber](data-entry.md#inputnumber) | Число/null и stringMode, точные десятичные шаги, formatter/parser, spinner, variants, prefix/suffix, refs, FormData и reset |
| [InputOTP](data-entry.md#inputotp-inputotp) | UTF-16 ячейки, formatter/paste, mask/separator, keyboard/focus и callbacks полного кода |
| [InputPassword](data-entry.md#inputpassword-inputpassword) | Видимость пароля, click/hover/keyboard, controlled toggle, focus/selection и возможности Input |
| [InputSearch](data-entry.md#inputsearch-inputsearch) | Поиск по кнопке/Enter/очистке, loading/IME, custom button snippet и композиция Compact |
| [Layout / LayoutHeader / LayoutContent / LayoutFooter / LayoutSider](layout.md#layout) | Нативная структура, hasSider, collapse/trigger, responsive sidebar, темы и RTL |
| [Listy](data-display.md#listy) | Группы, sticky headers, измеряемая виртуализация, scrollTo и native scroll |
| [Masonry](layout.md#masonry) | DOM-высоты, кратчайшие колонки, responsive gutters, fresh, keyed items и CSS appear/leave |
| [Mentions](data-entry.md#mentions) | Prefix/split, поиск у каретки, loading, autoSize, popupRender и контейнер |
| [Menu](navigation.md#menu) | Items/группы/подменю, selected/open keys, horizontal/vertical/inline, native links, клавиатура и collapse |
| [MessageHolder / createMessage](feedback.md#message) | Изолированная очередь пяти типов сообщений, ключи и обновления, таймеры, hover-пауза, maxCount, callable/thenable handle и контекст ConfigProvider |
| [Modal](feedback.md#modal) | Нативный dialog, заголовок, footer snippet, loading Skeleton, confirmLoading и callbacks |
| [NotificationHolder / createNotification](feedback.md#notification) | Подробные уведомления с title/description/actions snippets, четыре статуса, шесть положений, ключи, таймеры, hover/focus-пауза и закрытие |
| [Pagination](navigation.md#pagination) | Страницы, переходы по пять страниц, выбор pageSize, диапазон записей, размеры, RTL и локаль |
| [Popconfirm](feedback.md#popconfirm) | Подтверждение и отмена, Promise/loading, повтор после ошибки, защита от поздних результатов, snippets, локализация и клавиатура |
| [Popover](feedback.md#popover) | Интерактивные snippets, click/hover/focus, bind:open, 12 положений, стрелка, автоматический переворот, клавиатура и возврат фокуса |
| [Progress](feedback.md#progress) | Line/circle/dashboard, steps, gradients, success и percentPosition; component tokens, semantic/provider config, local prefix и formatter snippets; ARIA/RTL/SSR |
| [QRCode](data-display.md#qrcode) | Вывод QR-кода в Canvas или SVG, настройки и статусы |
| [Radio](data-entry.md#radio-и-radiogroup) | Checked/defaultChecked, semantic config, callbacks/refs, нативные группы и FormData |
| [RadioButton](data-entry.md#radio-и-radiogroup) | Кнопочное оформление Radio, native input, group context и refs |
| [RadioGroup](data-entry.md#radio-и-radiogroup) | Типизированный одиночный выбор, options, уникальное имя группы, горизонтальное/вертикальное расположение, required, reset и FormItem |
| [RangePicker](date-time.md#rangepicker-datepickerrangepicker) | Пара Dayjs, связанные календари, время и подтверждение границ, allowEmpty/disabled, presets и hover |
| [Rate](data-entry.md#rate) | Value/defaultValue, half/clear, hover, keyboard/RTL, character/tooltips, размеры и focus ref |
| [Result](feedback.md#result) | Семь статусов, официальные иконки/SVG, static images, component tokens, semantic/provider config, prefix/ref и восстановление фокуса |
| [Row / Col](layout.md#grid-row-col-и-breakpoints) | 24 колонки, responsive span/offset/order/push/pull/flex, gutter, align/justify и вложенные контексты |
| [Segmented](data-entry.md#segmented) | Типизированный одиночный выбор, native radio, стрелки, размеры, block/round, snippets и semantic slots |
| [Select](data-entry.md#select) | Одиночный и множественный выбор строковых/числовых значений; поиск, очистка, disabled options, клавиатура и FormData |
| [Skeleton](feedback.md#skeleton) | Каркас первой загрузки и Avatar/Button/Input/Image/Node; размеры, темы, active/round, semantic slots, ConfigProvider, prefix, refs, замена children, доступный статус и фокус |
| [Slider](data-entry.md#slider) | Число или диапазон, marks/dots, editable/draggableTrack, push/cross, клавиатура, подсказки, темы/RTL, native формы и refs |
| [Space / SpaceCompact / SpaceAddon](layout.md#space) | Wrappers/gaps/separators, компактные стыки controls, размеры, вложенность и addon variants/status |
| [Spin](feedback.md#spin) | Standalone/children/fullscreen, percent/auto, component tokens, prefixCls, semantic/provider config, indicator snippets и static fallback; сохранены inert и восстановление фокуса |
| [Splitter](layout.md#splitter) | Панели с изменяемым размером и сворачиванием |
| [Statistic](data-display.md#statistic) | Числа/строки, precision без округления, разделители, formatter, snippets, semantic slots и loading |
| [StatisticTimer](data-display.md#statistic) | Отсчёт времени вверх/вниз, формат, callbacks, SSR-placeholder и отмена интервалов |
| [Steps](navigation.md#steps) | Управляемые этапы, статусы, snippets, нативные кнопки, horizontal/vertical, medium/small, локаль, темы и восстановление фокуса |
| [Switch](data-entry.md#switch) | Checked/value aliases, source events, semantic config, refs, loading, клавиатура и native формы |
| [Table](data-display.md#table) | Типизированные колонки и snippets, фильтры, стабильная сортировка одной колонки, локальная и серверная пагинация, выбор и раскрытие строк, закрепление заголовка и колонок, loading и пустые данные |
| [Tabs](navigation.md#tabs) | Типизированные панели, bind:activeKey, line/card/editable-card, четыре положения, centered/gutter, меню more, ручная клавиатурная активация, сохранение содержимого и destroyOnHidden |
| [Tag](data-display.md#tag-checkabletag-и-checkabletaggroup) | Preset/status/CSS colors, варианты, semantic styles, ConfigProvider.tag, snippets и отменяемое закрытие |
| [TextArea](data-entry.md#textarea-inputtextarea) | Многострочное значение, native constraints/events/selection, формы, размеры, статусы и RTL |
| [Timeline](data-display.md#timeline) | Последовательность событий с заголовком и содержимым |
| [TimePicker](date-time.md#timepicker) | Выбор времени, ввод с клавиатуры, форматирование и недоступное время |
| [TimeRangePicker](date-time.md#timerangepicker-timepickerrangepicker) | Ввод и подтверждение начала и конца интервала времени |
| [Tooltip](feedback.md#tooltip) | Текст, hover/focus, bind:open, задержки, Escape, 12 положений, стрелка, автоматический переворот и aria-describedby |
| [Tour](feedback.md#tour) | Шаги, target/mask/gap, 12 размещений, controlled/default state, keyboard, snippets и semantic config |
| [Transfer](data-entry.md#transfer) | Два списка, controlled targetKeys, выделение/Shift, поиск, oneWay, пагинация и custom lists |
| [Tree / DirectoryTree](data-display.md#tree) | TreeData, раскрытие/выбор/отметки, strict/conduction, loadData, клавиатура и выбор диапазона |
| [TreeSelect](data-entry.md#treeselect) | Single/multiple, labelInValue, check strategies, поиск, loadData и native popup |
| [Typography / TypographyText / TypographyTitle / TypographyParagraph / TypographyLink](layout.md#typography) | Нативный текст, decorations, copy/edit, CSS/JS ellipsis, expand/collapse и semantic config |
| [Upload / UploadDragger](data-entry.md#upload--uploaddragger) | Выбор/drop, controlled list, beforeUpload, XHR/customRequest, статусы и удаление |
| [Watermark](data-display.md#watermark) | Text/image Canvas tiles, per-line fonts, offsets, mutation repair, наследование Modal/Drawer |

Input и Select поддерживают `bind:value` и `onValueChange`. Очистка одиночного
Select возвращает `undefined`, множественного — `[]`; числовой `0` остаётся допустимым значением. `defaultValue`
используется как начальное значение отдельного control. Для control с
`bind:value` задавайте начальное значение у владельца и не передавайте
`defaultValue`. Для сброса привязанного значения изменяйте состояние владельца.

Button `type` задаёт оформление, `htmlType` задаёт нативный тип кнопки и по
умолчанию равен `button`. Вариант `link` остаётся кнопкой действия без href;
при href создаётся нативная ссылка. Кнопка loading недоступна для повторного
нажатия. Подробнее в [разделе Button](layout.md#button).
