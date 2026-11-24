# RangePicker (DatePicker.RangePicker)

RangePicker позволяет выбрать диапазон дат и времени. Черновой выбор,
подтверждённые границы и принятое владельцем значение хранятся отдельно.

RangePickerCore также используется TimeRangePicker. ConfigProvider.rangePicker
задаёт общий variant/class/style/separator; локальные props имеют приоритет.
Объект вложенного провайдера заменяет родительский целиком.
Семантические классы и стили, значок суффикса и настройку очистки RangePicker
наследует из `ConfigProvider.datePicker`. Локальные `prefix`, `classNames`
и `styles` работают по [общим правилам DatePicker](date-picker.md#семантическое-оформление-и-настройки-провайдера).

```svelte
<script lang="ts">
  import dayjs from 'dayjs';
  import { RangePicker, type RangePickerValue } from '@woodger/antd';
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

`mode` принимает пару `[start, end]` и задаёт панели обеих границ.
`onPanelChange(dates, modes)` предлагает режим активной границы и сохраняет режим
второй. При переключении границы календарь использует её текущий режим.
Смена пары не пересоздаёт поля и сохраняет введённое значение, выделение и фокус.
При снятии `mode` обе панели возвращаются к `picker`. Исходный RangePicker
в Ant Design React 6.6.8 выбрасывает TypeError и удаляет поле при снятии пары.
[Замеры React](../../../tests/browser/fixtures/ant-design-date-picker-panel-mode-range-release.json.gz)

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

`components.input` получает `range: 'start' | 'end'` для каждой границы.
Классы, маска и атрибуты формы передаются в `attributes`. Привязки
`startInput` и `endInput` по-прежнему возвращают `HTMLInputElement`;
пользовательский `textarea` подключается через `register`. Кнопку OK можно
заменить через `components.button`. [Контекст редактора и кнопки](date-picker.md#редактор-и-кнопка-подтверждения)

Подтверждены SSR без browser APIs, ввод/ошибки/очистка, переходы фокуса,
подтверждение времени, ограничения/from, nullable границы, controlled rejection,
Form/нативная отправка и UTC в разных browser zones. Состояние переноса остальных
возможностей приведено в [реестре](../ant-design-porting/status.md).

