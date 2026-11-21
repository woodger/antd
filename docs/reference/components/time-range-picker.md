# TimeRangePicker (TimePicker.RangePicker)

TimeRangePicker переносит picker=time из общего RangePicker Ant Design /
rc-picker. Он использует RangePickerCore, nullable time columns и CSS
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

