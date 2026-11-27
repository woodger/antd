# TimePicker

TimePicker позволяет выбрать время.
Вложенная панель наследует [слой владельца](../theme-context.md#уровни-вложенных-панелей).

```svelte
<script lang="ts">
  import dayjs, { type Dayjs } from 'dayjs';
  import { TimePicker } from '@woodger/antd';

  let value = $state<Dayjs | null>(dayjs('2024-09-15T10:30:15'));
</script>

<label for="meeting-time">Время встречи</label>
<TimePicker id="meeting-time" name="time" {value} onChange={next => { value = next; }} />
```

`value`, `open` и `pickerValue` управляются props/callbacks. Без value/open
используются defaultValue/defaultOpen. Пустое значение остаётся пустым: начало
панели берётся из текущего дня с нулевым временем. DefaultOpenValue заполняет
только панель и кандидат для OK, не input или onCalendarChange до выбора.
DefaultPickerValue задаёт время панели при открытии; pickerValue независим от value.

По умолчанию format — HH:mm:ss; use12Hours включает hh:mm:ss A. Format принимает
строку, массив допустимых форматов или display callback. Callback делает input
readonly, даже при inputReadOnly={false}. Флаги showHour/showMinute/showSecond/
showMillisecond задают колонки; остальные выводятся из формата по правилам
rc-picker. Шаги и disabledTime управляют
единицами; hideDisabledOptions скрывает запрещённые пункты.

Panel selection выравнивает все четыре единицы, включая скрытые: default
millisecondStep=100, ближайшее разрешённое значение слева либо первое
разрешённое. Для точности до миллисекунды задайте millisecondStep={1}.
Ручной ввод разбирается строго и не округляется. Дата и UTC/timezone режим
входного Dayjs сохраняются при редактировании панели; parser/getNow используют
общий адаптер без прикладной сериализации.

`needConfirm` по умолчанию true. Выбор в колонке меняет только calendar draft.
Кнопка OK вызывает `onOk` перед `onChange`. Если обработчик `onOk` принимает
выбранное время или закрывает панель через `open`, пикер всё равно сообщает
об изменённом выборе и запросе закрытия. У диапазона закрытие относится к
последнему подтверждению. Enter/Tab подтверждают допустимый ввод без `onOk`.
Двойной клик по единице подтверждает первый выбранный пункт без `onOk`.
Если автопрокрутка меняет цель между вторыми down/up, подтверждение обрабатывается
на колонке. Новый двойной клик по пустой области не подтверждает прежний выбор.
В [закреплённом upstream](../../../tests/browser/fixtures/ant-design-time-column-double-click-observation.json)
автопрокрутка между двумя кликами может выбрать соседний час; это поведение
намеренно не воспроизводится. При needConfirm={false}
onChange вызывается при завершении ввода/закрытии, а не при каждом клике колонки.
Escape отменяет draft; закрытие снаружи при needConfirm=true тоже отменяет его.
Now и presets применяют значение сразу. OnCalendarChange получает пустой info
объект. При полной очистке onChange
получает `(null, null)`, а onCalendarChange — `(null, '', {})`, как SinglePicker.

`previewValue='hover'` временно показывает время под указателем, включая disabled
units, без callbacks. False отключает preview. ChangeOnScroll выбирает ближайшую
разрешённую единицу через 300 ms после прокрутки; программное выравнивание колонок
не считается вводом. RAF, scroll listeners и delayed callbacks очищаются при
изменении выбора и удалении панели.

Locale имеет общую форму DatePickerLocale: lang плюс timePickerLocale.placeholder.
Он объединяется с ConfigProvider.locale.datePicker. Default ruRU и переключение
enUS сохраняются. ConfigProvider.timePicker задаёт variant, class/style, icons,
clear и semantic config; вложенный объект заменяет родительский целиком.
Semantic classNames/styles поддерживают root/prefix/input/suffix и popup
root/content/item/footer/container. Локальный callback получает исходные props
с разрешённым variant; контекст проходит оба исходных слоя TimePicker/SinglePicker.
Локальный style применяется последним к root.

Prefix/suffixIcon/allowClear.clearIcon, cellRender, panelRender, renderExtraFooter
и presets принимают Svelte snippets вместо React nodes/render functions.
Cell info.originNode — snippet
нативной кнопки, остальные поля описаны в [time-picker.types.ts](../../../src/lib/picker/time-picker.types.ts).
Bind:nativeElement даёт root div, bind:this — focus({cursor,preventScroll})/blur().
Native name/id/required и FormItem работают без скрытого ISO input; FormData
содержит отображаемую строку, Form model хранит Dayjs напрямую.

`components.input` заменяет поле времени. `components.button` получает
подпись OK и атрибуты штатного подтверждения.
[Контекст редактора и кнопки](date-picker.md#редактор-и-кнопка-подтверждения)

`components.time` заменяет колонки, сохраняя обычный черновик и подтверждение.
Панель может запросить календарный режим через `onModeChange`. Для владельца
с такими переходами используйте `TimePickerProps<DatePickerMode>`. По
умолчанию тип режима у `TimePickerProps` — `'time'`.
[Контекст панели](date-picker.md#пользовательские-панели)

Адаптация доступности использует native buttons для единиц, стрелки/Home/End,
ArrowDown из input, Enter/Tab и Escape с возвратом фокуса. Popup использует общий
native popover lifecycle библиотеки. Класс popup задаётся через classNames.popup.root
у всех четырёх picker-компонентов; остальные semantic slots у DatePicker/RangePicker
ещё не перенесены. ShowNow управляет Today/Now, ограничения времени задаются
функцией disabledTime, иконка очистки — allowClear.clearIcon. Прежние popup aliases,
showToday, прямые disabled units, addon/onSelect и второй аргумент onKeyDown удалены. Темы, compact, RTL, status и размеры
наследуют текущие контексты.

Проверки: [engine](../../../src/lib/picker/time-picker.engine.test.ts),
[SSR](../../../src/lib/picker/time-picker.ssr.test.ts),
[public package](../../../tests/package/picker/time-picker.ssr.test.ts),
[browser](../../../tests/browser/time-picker.spec.ts) и `?fixture=time-picker`.
Общие component tokens настраиваются через `components.DatePicker`; подробности
и правила обновления открытой панели описаны в разделе DatePicker.
Для собственного типа даты используйте `DatePicker.generatePicker(adapter).TimePicker`.
Описание адаптера есть в [документации DatePicker](./date-picker.md#свой-тип-даты).
`multiple` доступен у `DatePicker.TimePicker` и `Picker.TimePicker` из
`generatePicker`. Эти компоненты принимают массив дат и подтверждают набор
по правилам [множественного выбора](./date-picker.md#множественный-выбор).
Mask format, React diagnostics и полный rc-trigger/
motion API пока не перенесены. Настройки `popupAlign` и `builtinPlacements`
общие для пикеров даты и времени. [Положение панели](./date-picker.md#положение-панели)
Подписи и формат времени берутся из словаря в `ConfigProvider.locale`.
[Подключение локали](../themes.md#язык-интерфейса)
Диапазон экспортируется как TimeRangePicker.
Переполненный 32-bit step вызывает RangeError вместо бесконечного цикла upstream.

