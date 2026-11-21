# Дата, время и календарь

## DatePicker

DatePicker переносит выбор даты, datetime, недели, месяца, квартала и года из Ant Design 6.6.8 и rc-picker 1.12.2.
Public value — Dayjs или null при очистке; undefined включает внутреннее состояние
с defaultValue. OnChange(value, dateString) получает объект даты и отображаемую
строку. Это не контракт ISO/timestamp. Day.js 1.11.23 установлен в стенде; пакет
компонентов объявляет peer dayjs ^1.11.11 наряду со Svelte. React/rc-picker runtime
не устанавливаются. CSS-рецепт извлекает 262 правила из
[закреплённого npm-архива](https://registry.npmjs.org/antd/-/antd-6.6.8.tgz);
глобальный Calendar CSS исключён, корни DatePicker ограничены собственным marker. Чистый GenerateConfig и Day.js adapter перенесены отдельно;
лицензия rc-picker сохранена в vendor/LICENSE.rc-picker.

```svelte
<script lang="ts">
  import dayjs, { type Dayjs } from 'dayjs';
  import { DatePicker } from 'antd-svelte';
  let value = $state<Dayjs | null>(dayjs('2026-10-29T10:30:15'));
</script>
<label for="when">Дата и время</label>
<DatePicker id="when" name="when" {value} showTime onChange={next => { value = next; }} />
```

Value/open/pickerValue — controlled props с callbacks: владелец может отклонить
изменение; component сам не переписывает переданный value. Без value/open
используются defaultValue/defaultOpen и внутреннее состояние. DefaultPickerValue
задаёт исходную дату панели при каждом открытии. `picker` выбирает date, week, month, quarter или year;
decade служит экраном навигации. NativeElement с bind указывает на root div; bind:this даёт методы
focus({preventScroll,cursor:'start'|'end'|'all'}) и blur().

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
  import { DatePicker, RangePicker } from 'antd-svelte';
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
{#snippet dateCell(current, info)}
  <span class="custom-date-cell">{@render info.originNode()}</span>
{/snippet}
{#snippet datePanel(content)}<section>{@render content()}</section>{/snippet}
{#snippet dateFooter(mode)}<small>Режим: {mode}</small>{/snippet}
<DatePicker cellRender={dateCell} panelRender={datePanel} renderExtraFooter={dateFooter} />
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

DatePicker/RangePicker поддерживают `suffixIcon`: локальный prop перекрывает
`ConfigProvider.datePicker.suffixIcon`. `true`/undefined выводят календарь и Form
feedback; null/false/пустая строка скрывают suffix целиком. Строка, число (включая
0) или Snippet заменяют generated suffix вместе с feedback. TimePicker/TimeRangePicker
используют те же правила с часами и `ConfigProvider.timePicker`. RangePicker
использует общий datePicker config для значка; rangePicker config управляет
прежними class/style/variant/separator. Смена suffix сохраняет поле и фокус.

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

Остальные picker/multiple modes, generatePicker factory,
полный semantic/component config
и полный rc-trigger/motion API ещё не перенесены. Реестр перечисляет эти пробелы
отдельно; данный этап не заявляет полноту семейства DatePicker.

## TimePicker

TimePicker переносит выбор одного времени из Ant Design 6.6.8 и rc-picker 1.12.2.
Он использует общий SinglePicker, Day.js adapter и CSS DatePicker. Существующие
публичные контракты DatePicker и RangePicker сохраняются.

```svelte
<script lang="ts">
  import dayjs, { type Dayjs } from 'dayjs';
  import { TimePicker } from 'antd-svelte';

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
OK вызывает onOk перед onChange; Enter/Tab подтверждают допустимый ввод без
onOk. Двойной клик по единице подтверждает первый выбранный пункт без onOk.
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
нативной кнопки, остальные поля описаны в [time-picker.types.ts](../../../src/lib/time-picker.types.ts).
Bind:nativeElement даёт root div, bind:this — focus({cursor,preventScroll})/blur().
Native name/id/required и FormItem работают без скрытого ISO input; FormData
содержит отображаемую строку, Form model хранит Dayjs напрямую.

Адаптация доступности использует native buttons для единиц, стрелки/Home/End,
ArrowDown из input, Enter/Tab и Escape с возвратом фокуса. Popup использует общий
native popover lifecycle библиотеки. Класс popup задаётся через classNames.popup.root
у всех четырёх picker-компонентов; остальные semantic slots у DatePicker/RangePicker
ещё не перенесены. ShowNow управляет Today/Now, ограничения времени задаются
функцией disabledTime, иконка очистки — allowClear.clearIcon. Прежние popup aliases,
showToday, прямые disabled units, addon/onSelect и второй аргумент onKeyDown удалены. Темы, compact, RTL, status и размеры
наследуют текущие контексты.

Проверки: [engine](../../../src/lib/time-picker.engine.test.ts),
[SSR](../../../src/lib/time-picker.ssr.test.ts),
[public package](../../../tests/package/time-picker.ssr.test.ts),
[browser](../../../tests/browser/time-picker.spec.ts) и `?fixture=time-picker`.
Общие component tokens настраиваются через `components.DatePicker`; подробности
и правила обновления открытой панели описаны в разделе DatePicker.
Multiple, mask format, generatePicker,
полный каталог locales, React diagnostics и полный rc-trigger/
motion API пока не перенесены. Контейнеры popup описаны в разделе DatePicker.
Диапазон экспортируется как TimeRangePicker.
Переполненный 32-bit step вызывает RangeError вместо бесконечного цикла upstream.

## TimeRangePicker (TimePicker.RangePicker)

TimeRangePicker переносит picker=time из общего RangePicker Ant Design 6.6.8 /
rc-picker 1.12.2. Он использует RangePickerCore, nullable time columns и CSS
DatePicker; существующие контракты календарного RangePicker сохраняются.

```svelte
<script lang="ts">
  import dayjs from 'dayjs';
  import { TimeRangePicker, type RangePickerValue } from 'antd-svelte';

  let value = $state<RangePickerValue | null>([
    dayjs('2024-09-15T09:00:00'), dayjs('2024-09-15T18:00:00')
  ]);
</script>

<TimeRangePicker name="interval" {value} onChange={next => { value = next; }} />
```

Value/open — controlled props, defaultValue/defaultOpen читаются при создании.
Удаление controlled value очищает локальный диапазон, без возврата к defaultValue.
Calendar draft, подтверждённые границы и значение владельца хранятся отдельно.
Смена `prefixCls` при прежнем `value` сохраняет черновик и выделение текста.
OnCalendarChange сообщает пару и info.range в текущем порядке полей; onChange
получает итог после завершения обеих границ. При order=true пара сортируется
перед публикацией; disabled-граница отключает сортировку. Сравнение сохраняет
правила Dayjs/rc-picker, включая календарную часть дат.

NeedConfirm=true по умолчанию. OK подтверждает активную границу и переводит фокус
к следующей; onOk вызывается до перехода и onChange. Enter/Tab и двойной клик
подтверждают без onOk. Неподтверждённая граница удерживает фокус при попытке перейти
в соседнее поле. Без needConfirm выбор в колонках всё равно остаётся черновиком:
завершение первой границы переводит выбор ко второй. Закрытие после такого выбора
может снова открыть панель второй границы, как useFocusLock upstream.

Escape отменяет calendar draft. Неразобранный текст при неизменившемся calendar
value сохраняется до blur; preserveInvalidOnBlur управляет его восстановлением.
AllowEmpty допускает null в соответствующей границе и подтверждение через Tab,
но не включает OK для пустой панели. При очистке обеих границ onChange получает
`(null, null)`; disabled-граница сохраняется. Now по явному showNow подтверждает
только активное поле без onOk; presets сразу применяют всю пару.

Format, 12-hour, show flags, steps, disabled units, hover preview и changeOnScroll
используют ту же логику, что TimePicker. DefaultOpenValue задаёт отдельные кандидаты
для обеих панелей, не заполняя inputs; одиночный Dayjs относится только к start.
PickerValue управляет шаблонами времени независимо от value, defaultPickerValue
восстанавливается при открытии и переключении полей. DisabledTime получает
`(date, partial, {from})`; при итоговой проверке end получает start, включая null
для разрешённой пустой границы.

Panel edits сохраняют дату и UTC/timezone входного Dayjs. Default millisecondStep
равен 100 и действует даже для скрытых разрядов; шаг 1 сохраняет миллисекунды.
Ручной ввод использует строгий общий Day.js parser без panel rounding или
принудительного UTC. Native name создаёт два поля с отображаемыми строками;
Form model и onFinish получают объекты Dayjs без скрытой ISO-копии.

Конфигурация повторяет разделение upstream: ConfigProvider.timePicker даёт
icons/allowClear и semantic classNames/styles; ConfigProvider.rangePicker даёт
variant, separator, class и обычный style. TimePicker.style/class/variant
на range-обёртку не переносятся. Вложенный rangePicker config заменяется целиком.
Semantic callback выполняется в одном слое с разрешёнными size/disabled и исходным
variant. Локальный callback типизирован TimeRangePickerProps; общий timePicker
callback получает range props в runtime, как в upstream, поэтому перед работой
с value в нём нужна проверка Array.isArray. Приоритет root styles: timePicker
styles.root → rangePicker style → local styles.root → local style.

Prefix/icons, cellRender с info.range и originNode, panelRender, presets и footer
используют Svelte snippets. Footer получает mode='time'. Полная форма находится в
[time-range-picker.types.ts](../../../src/lib/time-range-picker.types.ts).
Bind:nativeElement/startInput/endInput возвращают native refs и очищаются при
unmount. Focus принимает объект с index/cursor/preventScroll либо число 0/1;
индекс по умолчанию 0. Один focus не открывает закрытую панель. Keyboard и native
popover используют согласованную Svelte adaptation; deferred focus, RAF геометрии,
scroll timers и observers очищаются при удалении.

Popup наследует общий container API DatePicker, сохраняет минимальную ширину selector
и сдвигает узкую time panel со стрелкой под активное
поле. В RTL колонки времени сохраняют исходный порядок hours → minutes → seconds,
а направление внутри колонок меняется. Темы, compact, размеры, locale и status
используют текущие контексты библиотеки.

Проверки: [engine](../../../src/lib/time-range-picker.engine.test.ts),
[SSR](../../../src/lib/time-range-picker.ssr.test.ts),
[public package](../../../tests/package/time-range-picker.ssr.test.ts),
[browser](../../../tests/browser/time-range-picker.spec.ts) и `?fixture=time-range-picker`.
Полные mask/generatePicker/trigger/token/locale API и React diagnostics остаются
в следующих этапах; v1-ready в реестре не означает полного покрытия React API.

## RangePicker (DatePicker.RangePicker)

Отдельный экспорт RangePicker использует общий Day.js adapter, календарь, time
panel и извлечённый CSS DatePicker. Переходы выбора перенесены из
useRangeValueChange rc-picker 1.12.2: calendar draft, подтверждённые границы и
принятое владельцем value хранятся отдельно.

RangePickerCore также используется TimeRangePicker. ConfigProvider.rangePicker
задаёт общий variant/class/style/separator; локальные props имеют приоритет.
Объект вложенного провайдера заменяет родительский целиком.

```svelte
<script lang="ts">
  import dayjs from 'dayjs';
  import { RangePicker, type RangePickerValue } from 'antd-svelte';
  let period = $state<RangePickerValue | null>([dayjs('2026-10-10'), dayjs('2026-10-20')]);
</script>
<label for="period-start">Начало</label><label for="period-end">Конец</label>
<RangePicker id={{start:'period-start',end:'period-end'}} name="period"
  value={period} onChange={next => { period = next; }} />
```

Value/defaultValue — пара Dayjs|null|undefined; отсутствующие границы внутри
нормализуются в null. Value=null очищает обе границы, undefined включает внутреннее
состояние. OnChange получает пару Dayjs|null либо null при полной очистке.
Второй аргумент — пара отображаемых строк либо null при полной очистке: это
фактическое поведение rc-picker 1.12.2, хотя его declaration обещает только tuple.
OnCalendarChange всегда получает пару значений, пару строк и {range:'start'|'end'}
для первой изменённой границы. OnOk получает текущую календарную пару после
подтверждения каждой границы; первое подтверждение ещё не означает onChange.

Date показывает два соседних календаря, showTime — календарь и время активной
границы. Переход к следующему полю, Tab, Enter, OK, Escape и закрытие снаружи
различаются как в исходной машине переходов. NeedConfirm по умолчанию включён
для datetime. Неподтверждённые изменения отменяются; controlled value/open могут
отклонить предложение компонента. DefaultPickerValue/pickerValue принимают дату
или пару дат панели; onPickerValueChange сообщает range/source/mode.

Order=true сортирует отправляемую пару, если обе границы доступны. Order=false
сохраняет позиции. Disabled принимает boolean либо [start,end], allowEmpty —
boolean либо [start,end]. Очистка сохраняет заблокированную границу. DisabledDate
получает {type,from}, disabledTime — (date,'start'|'end',{from}); from зависит от
порядка посещения полей, как в rc-picker. Проверяются границы диапазона:
запрещённая дата внутри него сама по себе не запрещает диапазон. MinDate/maxDate
ограничивают выбор и навигацию. Presets принимают пару либо фабрику, previewValue
по умолчанию 'hover'; false отключает предварительный просмотр. ShowNow
по умолчанию выключен для диапазона; явное включение подтверждает текущую границу.

Format, showTime units/steps/defaultOpenValue, inputReadOnly,
preserveInvalidOnBlur, size/status/variant/Compact, локали, тема и RTL используют
общие механизмы DatePicker. ShowTime.defaultOpenValue принимает пару дат времени.
CellRender, panelRender и renderExtraFooter используют тот же Snippet-контракт,
что DatePicker; footer получает один режим, cell info.range — активную границу.
Календарные операции сохраняют режим входного Dayjs; UTC и wire-сериализация не
навязываются. Native FormData.getAll(name) содержит две отображаемые строки под
одним name. Form хранит пару объектов Dayjs, копирует tuple при snapshot и
восстанавливает исходные даты при reset. Id-строка относится к первому полю,
id={{start,end}} задаёт оба. Bind:nativeElement/startInput/endInput возвращают DOM;
bind:this даёт focus({index:0|1,preventScroll,cursor}) и blur(). Native onfocus/onblur
относятся к input; полный semantic event API upstream ещё не перенесён.

Подтверждены SSR без browser APIs, ввод/ошибки/очистка, переходы фокуса,
подтверждение времени, ограничения/from, nullable границы, controlled rejection,
Form/нативная отправка и UTC в разных browser zones. Остальные picker modes,
mask, полный semantic/config/motion API остаются пробелами
семейства; наличие RangePicker не означает полного покрытия React DatePicker.

## Calendar

Calendar переносит самостоятельную панель из Ant Design 6.6.8 и
@rc-component/picker 1.12.2. По умолчанию отображает полный месяц с шестью
строками дат; fullscreen={false} включает мини-календарь. Режим year показывает
12 месяцев и сохраняется после выбора месяца.

```svelte
<script lang="ts">
  import dayjs from 'dayjs';
  import { Calendar } from 'antd-svelte';

  let value = $state(dayjs('2024-09-15'));
</script>

<Calendar {value} onChange={next => { value = next; }}>
  {#snippet cellRender(date, info)}
    {#if info.type === 'date' && date.date() === 15}<span>Событие</span>{/if}
  {/snippet}
</Calendar>
```

Без value используются defaultValue или getNow(); defaultValue читается один
раз. Заданные value и mode управляются владельцем через callbacks, без
bind:value/mode. Отказ обновить prop сохраняет выбор и режим. Как PickerPanel,
сама панель сдвигает отображаемый месяц при клике соседней даты даже при
отклонённом value; заголовок продолжает показывать выбранное значение.
При удалении controlled prop локальное значение очищается, без возврата к
defaultValue/month: это поведение useControlledState изученной версии.

Порядок выбора — onPanelChange при смене месяца/года панели, затем onChange
при смене календарного дня, затем onSelect. Повторный выбор дня вызывает только
onSelect. CalendarSelectInfo.source различает date, month, year и customize. Переключатель
режима вызывает только onPanelChange. Компонент использует общий Dayjs adapter
без прикладной сериализации или нормализации; проверены UTC, timezone offset,
время и milliseconds.

`validRange` сравнивает полные timestamps включительно, до вызова disabledDate.
Month disabled вычисляется по первому и последнему дню месяца с сохранённым
временем; содержимое месяца не сканируется. Поэтому диапазон внутри одного
месяца может отключить весь этот месяц, как в rc-picker. Годы/месяцы заголовка
ограничиваются validRange, но его действия не проходят disabledDate и не
ограничивают день месяца границами диапазона.

`headerRender` получает value/type/onChange/onTypeChange и полностью заменяет
заголовок. `fullCellRender` заменяет содержимое ячейки; cellRender добавляет
содержимое в стандартный date-content. FullCellRender имеет приоритет
над cellRender. OriginNode в
CalendarCellRenderInfo — Svelte snippet исходного rc-picker inner. Date info.locale
содержит filled formats, month info.locale — исходный lang. `showWeek` добавляет
отдельные ячейки без render snippets; они выбирают начало строки с source=date.
Ячейки сохраняются по позиции строки/столбца, как в upstream.

Locale берётся из ConfigProvider.locale.calendar, независимо от DatePicker.
Глобальные enUS/ruRU включают Calendar; default locale библиотеки остаётся ruRU.
Словарь Calendar в ConfigProvider заменяется целиком, как DatePicker. Локальный
Calendar.locale объединяет поля lang с базовым словарём и контекстом. Загрузка
остальных Day.js locales остаётся у потребителя.

`classNames`/`styles` принимают объекты или callbacks для root/header/body/content/
item/itemContent. Callback props сохраняют переданные mode/showWeek, fullscreen
получает default true. Приоритет root styles после компонентной темы: context styles.root → context
style → local styles.root → local style. Вложенный ConfigProvider.calendar
заменяет component config целиком. `bind:nativeElement` возвращает root div и
очищается при unmount. Календарь не добавляет скрытое поле с сериализованной
датой; внутренние controls заголовка не получают name/id/required FormItem.

`generateCalendar(adapter)` — отдельный экспорт вместо React-статики
Calendar.generateCalendar. Фабрика возвращает Svelte component с теми же Props,
реактивными value/mode и bind:nativeElement; CalendarGenerateConfig описывает
исходные операции над датой. Типы и defaults находятся в
[calendar.types.ts](../../../src/lib/calendar.types.ts).

Адаптация доступности: table имеет роль grid, ячейки — gridcell с selected,
disabled, today и одним tab stop. Стрелки/Home/End перемещают только фокус,
Enter/Space выбирают. В standalone rc-picker эти keyboard handlers отсутствуют.
Вложенные inputs/buttons сохраняют свою клавиатуру; stopPropagation у custom
control предотвращает выбор родительской ячейки. В заголовке используются
существующие native Select/RadioGroup с доступными именами.

Из архива извлечены 123 CSS-правила Calendar, включая full/mini, week и mobile
header. Темы, primary, compact и RTL используют текущие tokens библиотеки.
В desktop-шапке без source theme обёртки Select сохраняют ширины 80/70px. При source theme
yearControlWidth/monthControlWidth задают минимальную ширину, как upstream;
скрытый текстовый sizer сохраняет intrinsic размер readonly input даже при 0/10px.
Переключатель режима не переносит отдельные кнопки.
При viewport до 480px год и месяц располагаются рядом, переключатель — ниже,
как в исходном Calendar. Эти правила принадлежат CalendarHeader и не меняют
геометрию остальных Select/RadioGroup. Границы полей и кнопок в мини-календарях
300/360px, mobile/RTL и работа dropdown/клавиатуры проверяются в
[calendar-header](../../../tests/browser/calendar-header.spec.ts).

`ConfigProvider.theme.components.Calendar` применяет все шесть public tokens,
alias overrides и global/component algorithms. Общий picker panel helper
воспроизводит 21 внутренний default; это не добавляет TimePicker/multiple API
в Calendar. Локальные CSS variables и config/semantic/local styles сохраняют
приоритет. Внутренние Select/Radio используют свои темы; intrinsic sizing
включён только для source-шапки Calendar, public default Select остаётся прежним.

[UMD-эталон](../../../tests/browser/fixtures/ant-design-calendar-theme-reference.json)
содержит 17 тем / 136 наборов для восьми scopes: full/mini month/year панели
сверяются в normal/RTL/priority, mini-month — также в variable/nested/reset/sibling/
outside. Дополнительные замеры сделаны при viewport 400px. Проверяются цвета,
метрики ячеек и шапки, string/zero/undefined размеры и независимые child themes.
[Browser-проверки](../../../tests/browser/calendar-theme.spec.ts) защищают фокус/выбор даты,
точные timestamps callbacks, открытые options и DOM input при theme update,
inherit reset и возврате к оформлению по умолчанию. Декларации сверяются с UMD отдельным
[unit-набором](../../../src/lib/theme-calendar-tokens-reference.test.ts),
[SSR](../../../tests/package/calendar-theme.ssr.test.ts) не создаёт browser resources.

Проверки: [engine](../../../src/lib/calendar.engine.test.ts),
[SSR](../../../src/lib/calendar.ssr.test.ts),
[public package](../../../tests/package/calendar.ssr.test.ts),
[browser](../../../tests/browser/calendar.spec.ts) и `?fixture=calendar`, включая
фабрику с собственным UTC Date adapter.

Calendar принимает локальный `prefixCls` для Picker и добавляет `-calendar` к
корневому классу; без override использует ConfigProvider.prefixCls. Ячейки,
originNode и `cellRender.info.prefixCls` следуют тому же Picker prefix, а Select/Radio
шапки сохраняют независимые общие namespaces. Canonical tokens и theme marker
не переименовываются. Смена префикса сохраняет DOM/ref/IDs, дату и её timestamp,
выделение текста/focus, открытые options и keyboard navigation.
[Сверка с официальным UMD](../../../tests/browser/calendar-prefix.spec.ts),
`?fixture=calendar-prefix`, включает full/mini, month/year, week, RTL,
aliases/styles, nested/reset и responsive-порог 480/481px.
Defaults prefix stylesheet не перекрывают Native bridge; тёмный фон и compact
метрики сохраняются при переходе от канонического `ant` к общему префиксу.

Существующий запрет переноса отдельных кнопок режима сохраняется. Raw Source
при увеличенных токенах в 320px переносит кнопки и растягивает controls до 48px.
Для трёх высот шапки отдельно записан public counterpart с `style.width=400px`;
остальные метрики сравниваются с raw 320px. Native readonly Select показывает
подпись года в input, Source — рядом с пустым search input; значение и выделение
Native input проверяются по собственному существующему контракту.

Полный каталог locales, React warnings и неперенесённые возможности используемых
Select/Radio остаются за пределами подтверждённого объёма этого этапа.
