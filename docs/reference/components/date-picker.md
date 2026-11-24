# DatePicker

DatePicker позволяет выбрать дату, время, дату со временем, неделю, месяц,
квартал или год. Значение имеет тип Dayjs, при очистке возвращается null.
Undefined включает внутреннее состояние с defaultValue. OnChange(value, dateString) получает объект
даты и отображаемую строку, а не ISO-строку или timestamp.

```svelte
<script lang="ts">
  import dayjs, { type Dayjs } from 'dayjs';
  import { DatePicker } from '@woodger/antd';
  let value = $state<Dayjs | null>(dayjs('2026-10-29T10:30:15'));
</script>
<label for="when">Дата и время</label>
<DatePicker id="when" name="when" {value} showTime onChange={next => { value = next; }} />
```

Value/open/pickerValue — controlled props с callbacks: владелец может отклонить
изменение; component сам не переписывает переданный value. Без value/open
используются defaultValue/defaultOpen и внутреннее состояние. DefaultPickerValue
задаёт исходную дату панели при каждом открытии. `picker` выбирает date, time,
week, month, quarter или year. Decade служит экраном навигации.
NativeElement с bind указывает на root div, а bind:this даёт методы
focus({preventScroll,cursor:'start'|'end'|'all'}) и blur().

## Свой тип даты

`DatePicker.generatePicker(adapter)` создаёт семейство пикеров для
`GenerateConfig<DateType>`. Адаптер определяет календарные операции, локаль,
форматирование и разбор текста.

```ts
import { DatePicker } from '@woodger/antd';

const Picker = DatePicker.generatePicker(dateAdapter);
const { WeekPicker, MonthPicker, YearPicker, TimePicker, RangePicker } = Picker;
```

`generatePicker` также доступен как именованный экспорт. Для квартала укажите
`picker="quarter"` на `Picker`, для времени — `picker="time"` на `Picker` или
`RangePicker` из семейства. `value`, `presets`, ограничения и callbacks используют
тип даты адаптера. Пользовательские панели получают исходный `generateConfig`;
выбранный ими объект передаётся владельцу с той же ссылкой.

## Выбор времени

`picker="time"` открывает колонки времени. Без явного `format` редактор
использует формат времени локали. `showTime.format` задаёт формат колонок
отдельно от формата поля. Подтверждение по умолчанию включено.

`DatePickerTimeProps` описывает режим часов. Он использует оформление
`ConfigProvider.datePicker`, передаёт `'time'` в `renderExtraFooter`
для панели часов и `{ source: 'time' }` в `onCalendarChange`.
Фабричный `Picker.TimePicker` берёт слоты и значки из `ConfigProvider.timePicker`.

## Множественный выбор

`multiple` включает выбор нескольких дат, недель, месяцев, кварталов или годов.
`value` и `defaultValue` принимают массив Dayjs или null. `onChange` получает
массив дат и отформатированных строк. Полная очистка передаёт `null, null`,
а удаление последнего тега в закрытом поле — `[], null`.
`DatePickerMultipleProps` и `DatePickerTagContext` доступны из пакета.
Для императивных `mount` и `render` режим массива задаётся как `DatePicker<true>`.

Календарь меняет черновик и вызывает `onCalendarChange`. При `needConfirm`
кнопка OK вызывает `onOk`, затем `onChange` и закрывает панель. Закрытие без
подтверждения восстанавливает принятый набор. Без `needConfirm` изменённый
непустой набор публикуется при закрытии. Пресет сразу переключает период
и оставляет панель открытой. `order={false}` сохраняет порядок выбора.
Отклонённое владельцем значение остаётся черновиком только до закрытия.
`showTime` доступен в одиночном режиме.

`maxTagCount` принимает число или `'responsive'`. `tagRender` получает
подпись, Dayjs, `disabled`, `closable` и `onClose`. `removeIcon` меняет
содержимое кнопки удаления. Поле сохраняет `id`, `name` и доступное имя.
Стрелка вниз переводит фокус в календарь, а FormData получает строки дат через
запятую, включая скрытые теги.

[Браузерные замеры React](../../../tests/browser/fixtures/ant-design-date-picker-multiple-browser.json.gz)
и [замеры SSR](../../../tests/browser/fixtures/ant-design-date-picker-multiple-ssr.json.gz)
сохраняют исходные случаи. Тесты пакета сверяют значения, порядок действий,
переключение режима и гидратацию.

## Формат и режимы календаря

`picker` задаёт формат поля и тип конечного выбора. `mode` управляет открытой
панелью. `onPanelChange(viewDate, nextMode)` сообщает предложенную дату и режим.
Если владелец оставляет `mode` прежним, панель остаётся на том же уровне.
Промежуточный выбор обновляет черновик. Для `multiple` он меняет только
панель, а добавление дат начинается на уровне `picker`.

`DatePickerMode` включает `date`, `week`, `month`, `quarter`, `year`,
`decade` и `time`. Для колонок на панели `time` включите `showTime`.
`pickerValue` отдельно управляет датой, которую показывает панель.
При снятии `mode` панель возвращается к `picker`. В 6.6.8 первый выбор после
снятия `mode` может перейти к десятилетиям. Исходная последовательность
зафиксирована в [замерах React](../../../tests/browser/fixtures/ant-design-date-picker-panel-mode-browser.json.gz).

Format принимает строку, массив допустимых форматов, display callback либо объект
`{ format: 'YYYY-MM-DD', type: 'mask' }`; без type объект действует как строковый формат. Input
с callback-only format автоматически readonly. По умолчанию дата YYYY-MM-DD,
showTime — YYYY-MM-DD HH:mm:ss. Разбор строгий: переполнения и неверные високосные
дни не нормализуются. Невалидный текст не меняет value и при blur восстанавливается;
preserveInvalidOnBlur сохраняет его. InputReadOnly задаёт native readonly,
сохраняя календарь и очистку. В режиме маски сохраняется поведение Ant Design:
клавиши маски могут менять разряды и при readonly. AllowClear=true по умолчанию.

Маска поддерживает разряды YYYY, MM, DD, HH, mm, ss и SSS у date/datetime,
RangePicker, TimePicker и TimeRangePicker. Стрелки перемещают выделение или меняют
разряд; Backspace/Delete возвращают его шаблон. Неполный текст остаётся в поле,
не заменяя календарную дату; при допустимом тексте Enter применяет сохранённый объект Dayjs.
Enter без редактирования сохраняет скрытое время. Ручной ввод SSS не округляется
по шагу панели.
Смена формата сохраняет поле, фокус и неподтверждённые границы диапазона.
Пример: `<DatePicker format={{ format: 'YYYY-MM-DD', type: 'mask' }} />`.
Эталон и границы сверки — [numeric mask](../../../tests/browser/fixtures/ant-design-date-picker-mask-source-notes.md).

`picker="month"` и `picker="year"` поддержаны у DatePicker и RangePicker.
Их форматы по умолчанию — YYYY-MM и YYYY; placeholder и формат берутся из
соответствующих полей locale. Явный format сохраняет приоритет. ShowTime для этих
двух режимов не применяется, needConfirm по умолчанию false. При явном подтверждении
onOk вызывается до onChange. Выбор периода сохраняет скрытые день и месяц Dayjs с
исходным округлением: например, 31 января даёт 29 февраля в високосном году.
Календарная ячейка получает нулевое время; presets сохраняют полный timestamp и alias.
Реактивная смена `picker` обновляет формат и экран открытой панели, сохраняя поле,
фокус и выбранное значение.

```svelte
<script lang="ts">
  import { DatePicker, RangePicker } from '@woodger/antd';
</script>
<DatePicker picker="month" />
<DatePicker picker="quarter" />
<DatePicker picker="week" />
<RangePicker picker="year" />
```

Range показывает соседние годы для month и соседние десятилетия для year;
переход на верхний экран оставляет одну панель. Disabled ячейки проверяют начало
и конец периода, min/max и валидация учитывают выбранный период. Сортировка по-прежнему
сравнивает полные timestamps; при заблокированной границе она не переставляет значения,
а допустимый обратный порядок скрытых дат внутри одного периода сохраняется.

`picker="quarter"` использует формат YYYY-[Q]Q и четыре квартала в строке.
Locale задаёт fieldQuarterFormat, cellQuarterFormat и quarter/rangeQuarterPlaceholder.
Range показывает соседние годы. ShowTime игнорируется; needConfirm по умолчанию false.
Выбор сохраняет скрытый день с исходным округлением: 31 января даёт 30 апреля.
DisabledDate получает фактическую дату ячейки с type=quarter, без дополнительных
проверок первого и последнего дня квартала. MinDate/maxDate допускают квартал,
который лишь частично попадает в заданные границы. Пресеты и сортировка сохраняют
полные timestamps; заблокированная граница допускает обратные скрытые даты внутри
одного квартала. Нативные кнопки ячеек поддерживают Tab и стрелки.

`picker="week"` использует исходный формат gggg-wo и выделяет недельные строки.
Range показывает соседние месяцы. Начало и номер недели определяет locale панели,
включая границу года: 31 декабря 2020 даёт 2021-1st для en_US и 2020-53rd для en_GB.
Для en_GB потребитель загружает `dayjs/locale/en-gb.js`; глобальный Dayjs locale
менять не требуется. Ввод ordinal-недели сохраняет исходный алгоритм адаптера:
подбирается 1 января плюс целое число недель, с weekday этого 1 января.
Клик по дню сохраняет его weekday; номер недели выбирает фактическое начало строки.
`showWeek` по умолчанию включает номера для week и выключает для date; явный false
убирает колонку номеров. У обычного date номера проверяются с type=week, а дни —
с type=date. Prefix и дни используют фактические кандидаты без проверки всей недели
одним агрегатом. Min/max допускают частичную граничную неделю; сортировка сохраняет
полные timestamps, а заблокированная граница допускает обратные даты внутри одной
locale-недели. ShowTime игнорируется, needConfirm по умолчанию false.

При отображении поля date/week/quarter проверка disabledDate получает исходный
Dayjs модели или календаря с его скрытым временем и ссылкой. После реального ввода
проверяется сохранённый кандидат, а не повторно разобранная строка. В этих режимах Range передаёт
при проверке поля только type; при отправке полного диапазона начало проверяется
без from, а конец — с фактическим началом. Panel сохраняет собственный from.
Массив mode в onPickerValueChange режима date сохраняет ссылку до смены режима.

ShowTime=true или объект добавляет time columns. Поддержаны format, видимость
units, шаги, use12Hours, hideDisabledOptions и defaultOpenValue. Ограничения
времени задаются через disabledTime, а не через поля showTime. NeedConfirm по умолчанию true для datetime и false для date. Выбор
с подтверждением меняет draft/onCalendarChange; OK меняет value/onChange и вызывает
onOk. Escape/внешний клик отменяют неподтверждённый draft. Now использует исходный
путь preset submit и сразу применяет допустимое текущее время.

При пустом datetime время берётся из `showTime.defaultOpenValue` либо равно нулю,
а дата остаётся датой текущей панели. Год и день шаблона времени не попадают
в выбранное значение. Это действует и для каждой границы RangePicker;
наведение на дату и время показывает тот же предварительный результат.
Исходный `defaultPickerValue` и передаваемая при сбросе дата панели сохраняются
целиком, включая время и identity.

Выбор ячейки календаря или пункта времени сначала вызывает `onCalendarChange`, затем сообщает
изменившуюся дату панели через `onPickerValueChange` с `source: 'panel'`.
Сравнение учитывает год, месяц и день, а для datetime также все разряды времени.
Для picker week сравниваются год начала locale-недели и её номер,
для month — год/месяц, для quarter — год/квартал, для year — год;
calendar/change сохраняют полное значение.
Повторное открытие сначала сообщает об открытии, затем о фактическом сбросе
панели; отклонённое controlled-открытие её не сбрасывает. Escape в поле DatePicker
сообщает об отмене изменённого черновика до закрытия, сохраняя публичные null/пустую
строку и info `{source}`. TimePicker/TimeRangePicker сохраняют свои машины событий.

`presets` принимает готовые Dayjs или функции без аргументов; подпись — строка либо
Snippet. Функция вызывается отдельно при наведении и выборе, без привязки `this`.
`previewValue='hover'` временно показывает дату под указателем, не меняя выбранное
value. Значение false отключает предпросмотр, но не вычисление ленивого preset.
При выключении уже активного preview его текст сохраняется до закрытия popup.

Выбор допустимого preset сразу применяет полный Dayjs и закрывает popup, включая
showTime/needConfirm; onOk не вызывается, время не округляется по шагам панели.
Недопустимый preset меняет calendar draft и вызывает onCalendarChange перед
проверкой ограничений, сохраняя прежнее value и открытый popup. Фокус переходит
в panel-container. Escape из панели сохраняет этот draft; Escape из input
восстанавливает committed value. Если controlled owner отклонил допустимый preset,
его value остаётся прежним, а календарь и текст сохраняют отправленную дату до сброса.

`cellRender(current, info)` заменяет содержимое календарной или временной ячейки.
В календаре current — Dayjs, во времени — число либо `am`/`pm`. Info содержит
фактический prefixCls, заполненную locale, today и originNode; для времени также
subType, включая millisecond. У RangePicker range обозначает активное поле
`start`/`end` и одинаков для обоих календарей, а не сторону панели.
Календарный current получает время из showTime.defaultOpenValue либо нули;
выбранное время хранится отдельно. Today и locale сохраняют границы исходных
panel owners: календарь и время делят locale, два календаря диапазона — нет.
Исходная ячейка учитывает locale.cellDateFormat, monthFormat и cellYearFormat.
Fallback-поля info.locale вычисляются из исходных showTime flags, отдельно от
формата видимых колонок: один showTime.format='HH:mm' сохраняет fieldTimeFormat='HH:mm:ss'.

OriginNode — snippet полной стандартной native-кнопки. Его можно обернуть,
сохранив выбор и клавиатурную навигацию, либо полностью заменить своим содержимым.
При полной замене библиотека не добавляет скрытую кнопку: фокусируемые элементы
задаёт автор snippet. Выбор мышью остаётся на внешней ячейке и учитывает disabled;
собственный control может остановить click propagation, чтобы не выбирать дату.

`panelRender(content)` получает snippet всей раскладки: presets, календарь/время
и footer. Обёртка с `{@render content()}` сохраняет её; замена без render не
создаёт дочерние ячейки и footer. Внешние popup, panel-container и стрелка диапазона
остаются у библиотеки. `renderExtraFooter(mode)` получает текущий режим панели:
date/month/year/decade, включая date при showTime. Пустой snippet сохраняет
footer-extra, отсутствие prop убирает его. Старые snippets без аргументов совместимы.
Today/Now показывается в режиме date; при needConfirm кнопка OK доступна и в
остальных режимах. Пользовательские input, textarea, select и contenteditable
в hooks получают фокус обычным нажатием мыши.

```svelte
<script lang="ts">
  import { DatePicker } from '@woodger/antd';
</script>

<DatePicker>
  {#snippet cellRender(current, info)}
    <span class="custom-date-cell">{@render info.originNode()}</span>
  {/snippet}

  {#snippet panelRender(content)}
    <section>{@render content()}</section>
  {/snippet}

  {#snippet renderExtraFooter(mode)}
    <small>Режим: {mode}</small>
  {/snippet}
</DatePicker>
```

[Проверки render hooks](../../../tests/browser/date-picker-render-hooks.spec.ts) сравнивают
аргументы четырёх режимов панели и все 47 полей en_US locale с
[неизменёнными фактами React](../../../tests/browser/fixtures/ant-design-date-picker-render-hooks-facts.json).
[Source manifest](../../../tests/browser/fixtures/ant-design-date-picker-render-hooks-source-manifest.json)
содержит два независимых CSR-прогона по 4 владельца, 122 действия и 126 состояний,
а также по 8 закрытых SSR-сериализаций. Полные исходные части сохранены в gzip.
Это проверка указанных сценариев; retained React popup, native input focus hooks
и Svelte Snippet lifecycle сохраняют описанные границы адаптации.

[Source captures presets](../../../tests/browser/fixtures/ant-design-date-picker-presets-source-manifest.json)
и [переходов](../../../tests/browser/fixtures/ant-design-date-picker-preset-transitions-source-manifest.json)
содержат 19 профилей, 181 действие, 200 состояний, 42 закрытия и обе закрытые SSR-сериализации каждого профиля;
полные raw-части сохранены без преобразований. Native сохраняет HTMLInput onfocus/onblur
и третий аргумент onCalendarChange `{source}`; React composite focus callbacks имеют
другой контракт. Удаляемый Native popup и lifecycle Snippet остаются адаптацией
сохраняемого React popup. Браузерные проверки отдельно фиксируют эти границы.
В 13 переходных профилях исходный нефокусированный caret в конце строки имеет
направление none в Native и forward в React; после действий направление сравнивается строго.
Прокрутка колонок datetime сохраняется между открытиями при прежних значениях,
шаблоне времени и строках. Смена реального контейнера popup создаёт новые колонки;
новая функция, вернувшая прежний контейнер, сохраняет их. При reset datetime
`onPickerValueChange` учитывает время и миллисекунды; date-only сравнивает календарную дату.
Если выбранное время отсутствует среди строк шага, смена ограничений в закрытой
панели сохраняет ручную прокрутку колонки. Отдельные проверки
[шаблона времени и контейнера](../../../tests/browser/date-picker-time-scroll.spec.ts)
и [значения вне шага](../../../tests/browser/date-picker-offgrid-scroll.spec.ts) используют
независимые React first/repeat captures; полные оригиналы сохранены в фикстурах.
[Browser](../../../tests/browser/date-picker-presets.spec.ts) сравнивает состояния, аргументы,
CSS и геометрию; [SSR](../../../tests/package/date-picker-presets.ssr.test.ts) проверяет
закрытые input и отсутствие browser API.

Кнопки подтверждения DatePicker, RangePicker, TimePicker и TimeRangePicker используют
общий Button с size=small и type=primary, как исходный PickerButton. Они наследуют
ConfigProvider.button, components.Button и Wave; переданная строка локали сохраняет
Button autoInsertSpace и semantic props. Нативные disabled/type=button, порядок
подтверждения, точность Dayjs и возврат фокуса сохраняются. Проверки —
[picker-button](../../../tests/browser/picker-button.spec.ts), `?fixture=picker-button`.

Точность повторяет rc-picker: panel selection выравнивает все time units, даже
скрытые; default millisecondStep=100, ближайшее разрешённое значение слева либо
первое разрешённое. ShowTime.format задаёт формат time panel; формат input
задаётся DatePicker.format либо locale.lang.fieldDateTimeFormat, как в upstream.
Колонки определяются по showTime.format, затем первому элементу format, если это
строка, затем datetime-формату locale. Явные showHour/showMinute/showSecond/
showMillisecond имеют приоритет; use12Hours выводится из формата, если не задан.
Формат поля только с датой сохраняет стандартные часы, минуты и секунды.
Для миллисекундного шага задайте showTime={{millisecondStep:1}}.
Ручной ввод через format с SSS использует строгий parser и не округляется этим
panel helper. Адаптер не навязывает timezone: календарные операции сохраняют
режим входного Dayjs, parser использует обычный dayjs(text,format), getNow учитывает
подключённый потребителем timezone plugin как upstream. UTC/timezone плагины не
включаются библиотекой автоматически.

Текст формата в квадратных скобках не включает time units. Это сохранённое
native правило: Ant Design 6.6.8 для `YYYY-MM-DD [Hours]` ошибочно оставляет только
часы и секунды. У нас применяется обычный fallback часов/минут/секунд; raw source
сохранён в [измерениях datetime config](../../../tests/browser/fixtures/ant-design-datetime-config-reference.json),
отличие проверяется в [browser suite](../../../tests/browser/datetime-config.spec.ts).

MinDate/maxDate и disabledDate ограничивают календарь; disabledTime возвращает
запрещённые часы/минуты/секунды/миллисекунды. Size, status, variant, disabled,
Compact, RTL, тема, locale.lang и ConfigProvider.locale.datePicker наследуют
существующие контексты. Встроены исходные RU/EN строки. Input использует native
name/id/required: FormData содержит отображаемый текст, без скрытой ISO-копии.
FormItem контекст даёт id/name/status/disabled. Form model хранит immutable Dayjs
напрямую: value={form.values.when}, onChange={next => form.setFieldValue('when', next)}.
OnFinish получает объект Dayjs, resetFields восстанавливает исходное значение;
преобразование в wire-формат остаётся у потребителя, как в upstream.

Клавиатура: Enter открывает/применяет корректный ввод, ArrowDown переводит фокус
в календарь; стрелки/PageUp/PageDown/Home/End перемещаются по grid; Escape закрывает
popup с возвратом фокуса. Время доступно через native buttons и стрелки в колонках.
Поверхность использует существующий native popover lifecycle библиотеки, включая
изоляцию Compact, закрытие снаружи и поддержку dialog top layer.

DatePicker, RangePicker, TimePicker и TimeRangePicker поддерживают локальный
getPopupContainer с fallback на ConfigProvider.getPopupContainer; undefined
наследует provider. Getter получает root div.ant-picker и возвращает HTMLElement
или ShadowRoot. При defaultOpen функция без параметров сначала вызывается с
undefined, затем с root; функция с параметром ждёт DOM ref, как rc-trigger.
SSR не вызывает getter. Без выбранной функции сохраняется native размещение.

### Редактор и кнопка подтверждения

`components.input` принимает `'input'`, `'textarea'` или Svelte snippet.
Встроенный `'textarea'` вписывается в ширину поля и использует цвета, шрифт
и размер пикера. Оформление редактора из snippet задаётся в самом snippet.
Snippet получает `attributes` поля и `register` для DOM-элемента. Раскройте
атрибуты на поле и передайте регистрацию через `{@attach register}`. В
`textarea` передайте `value` отдельным атрибутом, чтобы Svelte записал исходное
значение в текстовый узел при SSR. При `multiple` сохраняется штатное readonly-поле,
как в Ant Design React.

```svelte
<script lang="ts">
  import { DatePicker, type DatePickerEditorContext } from '@woodger/antd';
</script>

{#snippet editor({ attributes, register }: DatePickerEditorContext)}
  <input {...attributes} {@attach register} />
{/snippet}

<DatePicker components={{ input: editor }} />
```

`components.button` заменяет кнопку OK в панели с подтверждением. Передайте
`'button'` для нативной кнопки или snippet с контекстом `DatePickerButtonContext`.
Контекст содержит `attributes` с `type="button"`, `disabled` и `onclick`, а
`children` содержит локализованную подпись.

В Ant Design React 6.6.8 Enter вставляет перевод строки в `textarea` и может
повторно открыть календарь DatePicker либо изменить текст второй границы
RangePicker. В Svelte Enter подтверждает ввод без перевода строки.
[Браузерные замеры React](../../../tests/browser/fixtures/ant-design-picker-components-editors.json.gz)

### Пользовательские панели

`components` принимает snippets для `date`, `week`, `month`, `quarter`,
`year`, `decade`, `time` и `datetime`. Последний заменяет календарь и
колонки времени как одну панель. При отсутствии нужного слота используется
штатная панель. `panelRender` по-прежнему оборачивает всю раскладку,
включая панель, пресеты и footer.

`DatePickerPanelContext` содержит дату просмотра `pickerValue`, черновой
выбор `value` и `values`, локаль, адаптер Dayjs `generateConfig`, ограничения
и параметры времени. `disabledDate` учитывает `minDate` и `maxDate`.
`onSelect` принимает готовый Dayjs и передаёт его в обычную логику выбора и
подтверждения. `onPickerValueChange` сообщает о навигации, а `onModeChange`
запрашивает режим. При управляемых `mode` и `pickerValue` решение об обновлении
принимает владелец. Ключ `datetime` соответствует публичному режиму `date`.

```svelte
<script lang="ts">
  import { DatePicker, type DatePickerPanelContext } from '@woodger/antd';
</script>

{#snippet month(context: DatePickerPanelContext)}
  {@const date = context.pickerValue.startOf('month')}
  <button type="button" onclick={() => context.onPickerValueChange(date.add(1, 'month'))}>
    Следующий месяц
  </button>
  <button type="button" disabled={context.disabledDate(date, { type: 'month' })}
    onclick={() => context.onSelect(date)}>
    Выбрать {date.format('YYYY-MM')}
  </button>
{/snippet}

<DatePicker picker="month" components={{ month }} />
```

Замена сама задаёт доступную разметку и вызовы `onHover` для предпросмотра.
`cellRender` доступен в контексте и использует переданный `originNode`, если
владелец не задал renderer. `prevIcon`, `nextIcon`, `superPrevIcon` и
`superNextIcon` принимают текст или snippets и действуют также в штатном
заголовке. Когда сфокусированная кнопка исчезает при смене слота, фокус
остаётся в popup.

### Семантическое оформление и настройки провайдера

DatePicker и RangePicker принимают `prefix`, `classNames` и `styles`.
`prefix` выводит строку, число или Snippet перед редактором.
`classNames` и `styles` задают слоты `root`, `prefix`, `input`, `suffix`
и `popup` с ролями `root`, `header`, `body`, `content`, `item`, `footer`,
`container`. Строковое значение `popup` относится к `popup.root`.
Для `styles` используются строки CSS. Оба свойства принимают объект слотов
или функцию `({ props }) => slots`. Функция видит локальные props поля
с итоговыми `size` и `disabled` и может вернуть `undefined`.
В datetime `header`, `content` и `item` оформляют календарь и колонки времени,
а `body` оформляет календарь. Номера недель вне слота `item`.

`ConfigProvider.datePicker` задаёт общие `classNames`, `styles`, `suffixIcon`
и `allowClear` для обоих полей, а также `class`, `style` и `variant` одиночного
DatePicker. RangePicker берёт обычные `class`, `style`, `variant` и `separator`
из `ConfigProvider.rangePicker`. Классы объединяются. Для корня сначала
применяются `styles.root` и `style` провайдера, затем локальные `styles.root`
и `style`. Вложенный провайдер наследует отсутствующую настройку.
Явный объект, включая `{}`, целиком заменяет родительскую настройку.

`allowClear` принимает boolean или `{ clearIcon }`. Локальное значение перекрывает
настройку провайдера. Если очистка разрешена, локальная иконка имеет приоритет,
а отсутствующая иконка наследуется. По умолчанию очистка включена. Кнопка
сохраняет доступное имя из локали.

DatePicker/RangePicker поддерживают `suffixIcon`: локальный prop перекрывает
`ConfigProvider.datePicker.suffixIcon`. `true`/undefined выводят календарь и Form
feedback; null/false/пустая строка скрывают suffix целиком. Строка, число (включая
0) или Snippet заменяют generated suffix вместе с feedback. TimePicker/TimeRangePicker
используют те же правила с часами и `ConfigProvider.timePicker`. RangePicker
использует общий datePicker config для значка; rangePicker config управляет
прежними class/style/variant/separator. Смена suffix сохраняет поле и фокус.

Смена семантического оформления сохраняет DOM поля и открытой панели,
фокус, выделение и черновик. Приоритеты и слоты сверены с React 6.6.8
в [браузере](../../../tests/browser/date-picker-provider.spec.ts) и
[SSR](../../../tests/package/date-picker-provider.ssr.test.ts).

Исходный offset до поля — 4 px; координаты при единичном масштабе округляются
вниз, как rc-trigger. Минимальная ширина popup равна ширине selector.
Default placement — bottomLeft в LTR и bottomRight в RTL, явное значение имеет
приоритет. Смена getter с тем же контейнером сохраняет DOM панели, пользовательский
state, фокус/выделение и draft поля; смена самого контейнера пересоздаёт панель,
как исходный portal. Стили ShadowRoot задаёт потребитель. Getter не меняет
Dayjs/UTC/precision, FormData и порядок подтверждения границ.

Native панель по-прежнему удаляется при закрытии; custom footer/panel state
при следующем открытии создаётся заново. Это сохранённое отличие от retained
popup rc-trigger. Проверки и 54 эталона официального UMD —
[picker-container](../../../tests/browser/picker-container.spec.ts), `?fixture=picker-container`.

Component tokens всех четырёх date/time single/range controls задаются через
`ConfigProvider.theme.components.DatePicker`, как в Ant Design. Input, calendar,
time columns, presets и popup используют общую тему; Button подтверждения
сохраняет независимые `components.Button`. Поддержаны aliases, component algorithms,
dark/compact, вложенные provider, `inherit:false` и собственный cssVar prefix.
Локальные style и существующие semantic styles сохраняют приоритет.

Обновление токенов сохраняет DOM поля и открытой панели, draft, фокус/выделение
и значение Dayjs. При смене высоты time cells существующая прокрутка сохраняется
в пикселях, как в исходнике; новое открытие выравнивает выбранное время заново.
Datetime header показывает выбранное время в panel format; пустое значение
не подсвечивает время запасной даты. Проверки и 15 UMD-тем —
[picker-theme](../../../tests/browser/picker-theme.spec.ts), `?fixture=picker-theme`.

Все четыре date/time single/range controls принимают `prefixCls`: локальный owner
перекрывает ConfigProvider.prefixCls для поля, календаря, time columns и popup.
Button подтверждения сохраняет общий namespace, private affix-color следует общему
префиксу, component tokens и theme marker остаются canonical. Time cellRender
получает разрешённый prefixCls; generated IDs сохраняют прежний Native формат.

Смена префикса сохраняет открытый popup, DOM/refs/IDs, незавершённый ввод,
caret/focus и pending datetime. DatePicker/RangePicker синхронизируют текст при новом
value или его отображении; обновление контекста без этих изменений не сбрасывает
draft. Реальное изменение format продолжает обновлять поле. UTC, точность,
подтверждение границ, формы и порядок callbacks сохраняются.
[Сверка с официальным UMD](../../../tests/browser/picker-prefix.spec.ts),
`?fixture=picker-prefix`, включает 33 варианта в normal/nested/reset scopes
и live draft transitions всех четырёх controls, а также оформление по умолчанию
и custom container cleanup.
Defaults в prefix stylesheet имеют нулевую specificity: canonical Native bridge
продолжает задавать фон, тень фокуса и размеры без source theme. Сравнение с `ant`
в light/blue, dark/green и compact/purple —
[prefix-default-styling](../../../tests/browser/prefix-default-styling.spec.ts).
Служебные snippets/head/popup boundaries не добавляют текст рядом с controls;
SSR проверяет также defaultOpen, browser — обновление общего префикса.

Оставшиеся события и исходный lifecycle popup перечислены в
[реестре переноса](../ant-design-porting/status.md).

