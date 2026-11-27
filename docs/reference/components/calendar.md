# Calendar

Calendar по умолчанию показывает полный месяц с шестью строками дат;
`fullscreen={false}` включает мини-календарь. Режим year показывает 12 месяцев
и сохраняется после выбора месяца.

```svelte
<script lang="ts">
  import dayjs from 'dayjs';
  import { Calendar } from '@woodger/antd';

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
Встроенные enUS/ruRU и словари Ant Design включают Calendar. По умолчанию
действует ruRU. [Подключение локали](../themes.md#язык-интерфейса)
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
[calendar.types.ts](../../../src/lib/calendar/calendar.types.ts).

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
как в исходном Calendar. Зазор между селекторами задаёт CSS-отступ.
Границы полей и кнопок в мини-календарях
300/360px, mobile/RTL и работа dropdown/клавиатуры проверяются в
[calendar-header](../../../tests/browser/calendar/calendar-header.spec.ts).

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
[Browser-проверки](../../../tests/browser/calendar/calendar-theme.spec.ts) защищают фокус/выбор даты,
точные timestamps callbacks, открытые options и DOM input при theme update,
inherit reset и возврате к оформлению по умолчанию. Декларации сверяются с UMD отдельным
[unit-набором](../../../src/lib/theme/theme-calendar-tokens-reference.test.ts),
[SSR](../../../tests/package/calendar/calendar-theme.ssr.test.ts) не создаёт browser resources.

Calendar принимает локальный `prefixCls` для Picker и добавляет `-calendar` к
корневому классу; без override использует ConfigProvider.prefixCls. Ячейки,
originNode и `cellRender.info.prefixCls` следуют тому же Picker prefix, а Select/Radio
шапки сохраняют независимые общие namespaces. Canonical tokens и theme marker
не переименовываются. CSS-селекторы экранируют символы префикса вроде `+`.
DOM-классы и `cellRender.info.prefixCls` используют исходное значение.
Смена префикса сохраняет DOM/ref/IDs, дату и её timestamp,
выделение текста/focus, открытые options и keyboard navigation.
[Сверка с официальным UMD](../../../tests/browser/calendar/calendar-prefix.spec.ts),
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

React warnings и неперенесённые возможности используемых Select/Radio остаются
за пределами подтверждённого объёма этого этапа.
