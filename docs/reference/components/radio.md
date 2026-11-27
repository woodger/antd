# Radio и RadioGroup

Radio использует нативный input[type=radio], поддерживает bind:checked,
defaultChecked и `onCheckedChange(checked)`. Содержимое передаётся snippet,
как у Checkbox. Варианты с одинаковым непустым name в одной форме и одном
DOM-корне образуют нативную группу. Выбор одного снимает соседний; bind:checked
соседа тоже обновляется. Его callback при этом не вызывается: нативный change
получает выбранный radio. Внешнее обновление checked синхронизирует соседей без
callbacks. Нативный onchange также доступен. Без name отдельные Radio независимы.

Для общего типизированного значения используйте RadioGroup.
`RadioGroupProps<Value>` и `RadioOption<Value>` принимают string, number и
boolean. Options содержит примитивы или `{ value, label, disabled?, id?, title?,
className?, style?, required?, onChange? }`. Label принимает строку, число или
snippet; style остаётся CSS-строкой, как в остальных Svelte-компонентах.
Повторяющиеся значения отображаются один раз, с первой подписью и disabled.

```svelte
<script lang="ts">
  import { RadioGroup } from '@woodger/antd';

  const options = [
    { value: 0, label: 'Базовый' },
    { value: 1, label: 'Командный' },
    { value: 2, label: 'Архивный', disabled: true }
  ];
  let plan = $state<number | undefined>(0);
</script>

<RadioGroup {options} bind:value={plan} name="plan" aria-label="Тариф" orientation="vertical" />
```

Пользовательский выбор обновляет bind:value и вызывает onValueChange(value)
один раз, только при смене значения. Числовой 0 и boolean false остаются
полноценными выбранными значениями и отличаются от строк "0" и "false".
Для внешней очистки присвойте undefined. Изменение props не вызывает callbacks
и не переписывает значение владельца. Если выбранный вариант исчезает,
в группе нет отмеченного input; после возвращения option выбор восстанавливается.

Без name и FormItem.name RadioGroup назначает уникальное нативное имя,
чтобы соседние группы не снимали выбор друг друга. Это имя также используется
в FormData; для стабильного имени поля задавайте name явно. Одинаковое имя
в разных формах не объединяет варианты. Внутри одной формы для независимых
групп используйте разные имена.

Стрелки переключают нативный выбор и фокус, пропуская disabled options;
Space выбирает сфокусированный вариант, Tab выходит из группы. Orientation
по умолчанию horizontal; vertical располагает варианты столбцом. Boolean alias
vertical применяется, когда orientation не задан. Явный orientation имеет приоритет. Группа
наследует disabled из Form/FormItem и ConfigProvider. Явный disabled=false
переопределяет наследование, disabled группы блокирует все options.

Для отдельного Radio defaultChecked, а для RadioGroup defaultValue
фиксируются при создании. С привязкой задавайте начальное значение у владельца
без defaults. Нативный reset восстанавливает начальные значения и обновляет
привязки в следующей задаче после события, без callbacks. Отменённый reset
сохраняет текущий выбор. Атрибут form связывает controls с внешней формой.
Form сбрасывает значения через модель resetFields.

Выбранный доступный radio передаёт в FormData строку под своим name.
`new FormData(form).get('plan')` возвращает, например, '0' или 'false';
при отсутствии выбранного доступного варианта — null.
Required использует нативное правило группы: нужен один
выбранный вариант среди её input. Для пустого списка options используйте
правила Form, поскольку нативного input в такой группе нет.

В Form передавайте `value={form.values.plan}` и
`onValueChange={(value) => form.setFieldValue('plan', value)}`. Правило required
проверяет значение поля и принимает 0/false. Для отдельного Radio с boolean
используйте checked/onCheckedChange; если требуется именно true, задайте
custom validator, как в примере Checkbox.

RadioGroup получает из FormItem имя, подпись, required и описание ошибки.
Fieldset с ролью radiogroup сообщает required/invalid; отдельные Radio связаны
с описанием ошибки. Нажатие подписи FormItem и ошибка формы переводят фокус
к выбранному доступному варианту либо первому доступному. Пустая группа может
получить фокус сама, без дополнительного шага Tab.

RadioGroup также принимает children со вложенными Radio и RadioButton.
Непустые options имеют приоритет, пустой массив оставляет children:

```svelte
<script lang="ts">
  import { RadioButton, RadioGroup } from '@woodger/antd';

  let mode = $state('month');
</script>

<RadioGroup bind:value={mode} name="mode" aria-label="Режим календаря" size="small">
  <RadioButton value="month">Месяц</RadioButton>
  <RadioButton value="year">Год</RadioButton>
</RadioGroup>
```

RadioButton соответствует React Radio.Button и добавляет только кнопочный
option context, без новой DOM-обёртки. Input остаётся radio: работают native
keyboard, name/FormData, required и существующий reset/bind контракт Radio.
`optionType="button"` у группы меняет все дочерние Radio; явный `optionType="default"`
перекрывает кнопочный контекст RadioButton. Без optionType каждый дочерний control
сохраняет собственный вид. Привязка value и checked использует прежний Svelte API.

`buttonStyle` выбирает outline (default) или solid. `size` наследует componentSize;
локальный small/medium/large имеет приоритет. Block растягивает группу и делит
ширину между вариантами; vertical сохраняет стыки и радиусы кнопок. Темы, primary,
compact и RTL используют текущие настройки библиотеки. Нативный fieldset и
существующий приоритет disabled группы сохранены.

`bind:nativeElement` у Radio/RadioButton возвращает внутренний span RcCheckbox,
bind:inputElement — input для focus()/blur(). Обе ссылки очищаются при unmount.
Bind:ref возвращает `{ input, nativeElement, focus(options?), blur() }`; focus/blur
доступны также через bind:this. У RadioGroup bind:nativeElement возвращает fieldset.
AutoFocus переводит фокус на input при mount; lowercase autofocus сохраняет нативное
поведение. TabIndex — alias нативного tabindex.
`rootClassName`, как class/style, относится к label. Точные объявления — в
[radio.types.ts](../../../src/lib/radio/radio.types.ts).

Рецепт radio-button воспроизводит 70 правил эталона для кнопок, размеров,
vertical/block и Badge; прежний vendor/radio.css сохранён. Проверки —
`?fixture=radio-button`, SSR/public package и browser, включая существующие Radio.
Включены width:auto и отрицательный margin для Badge в vertical Group: обёртка
и кнопка растягиваются по ширине группы, соседние границы перекрываются на 1px,
в том числе со стандартным prefix.
Счётчик Badge внутри Group получает исходный z-index:1.

ClassNames/styles у Radio и RadioButton задают root/icon/label объектом или
функцией от `{ props }`. Props содержат фактические checked, disabled, value и name;
checked учитывает локальное состояние Svelte. ConfigProvider.radio задаёт общие
class/style и semantic slots, в том числе для Radio из options и вложенного provider.
Приоритет root style: config.styles.root, config.style, styles.root, style.
Настройки применяются к каждому Radio, как в исходной реализации; Group сохраняет
собственные class/style. PrefixCls задаёт базовое имя Radio без -button; непустой
локальный prefix имеет приоритет, empty/undefined наследуют ConfigProvider.
Radio/RadioButton/RadioGroup подключают CSS для local/shared prefix, включая
независимый общий Badge namespace. У Group prefix передаётся в options; children
выбирают свой отдельно. Canonical token markers и native layout сохраняются.
Смена prefix сохраняет input/group DOM, выбор, refs, focus, selection и FormData.

В Source defaultChecked выбирает standalone input без wrapper-checked класса;
у RadioButton выбранные цвета не применяются. Raw UMD замеры сохранены отдельно
от matched public checked=true. Native отражает фактическое checked состояние,
как прежде. Неэффективный Source Badge selector с button-wrapper исключён из
нового CSS template; прежняя геометрия остаётся для отдельного разбора.

OnChange получает `{ target, nativeEvent, stopPropagation, preventDefault }`;
target.value сохраняет исходный тип. NativeEvent — DOM change, а не React MouseEvent.
Callback option/Radio вызывается до Group.onChange; Group.onChange — перед
onValueChange. Нативный onchange остаётся на input. Label/input clicks защищены от
повторного внешнего всплытия. OnClick/onFocus/onBlur/onKeyDown/onKeyPress работают
на input; onMouseEnter/onMouseLeave — на label. У Group onFocus/onBlur получают
всплывающие focusin/focusout дочерних controls. Для отклонения выбора владельцем
группы используйте function binding с getter/setter; native checked восстанавливается
по типизированным значениям, включая различие 0 и '0'.

Сохраняются прежние native fieldset, defaults/reset, required и disabled группы,
уникальные имена, примитивные типы и удаление повторных options. Эти границы
отличаются от React any-value/controlled-state и приоритета disabled дочернего Radio.
Source Radio tokens и отдельные theme algorithms применяются к Radio, RadioButton
и RadioGroup; native-only темы сохраняют прежнее оформление. Local/shared prefix CSS
и Wave подключены; React diagnostics/statics и вложенные Form NamePath остаются неперенесёнными.
Дополнительные сценарии — `?fixture=radio-features`,
[browser](../../../tests/browser/radio/radio-features.spec.ts) и
[package SSR](../../../tests/package/radio/radio-features.ssr.test.ts).
Сверка prefix с официальным UMD — `?fixture=radio-prefix` и
[browser](../../../tests/browser/radio/radio-prefix.spec.ts).

