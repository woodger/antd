# Ввод и выбор значений

## Segmented

```svelte
<Segmented options={['День', 'Неделя', 'Месяц']} bind:value={period} />
```

Options — строки/числа или объекты value/label/icon/title/tooltip/disabled/class.
Значения должны быть уникальными; число 0 и строка "0" различаются. Label —
строка, число или Snippet; icon — Snippet. Для icon-only задавайте title либо
aria-label option. Пустая строка рядом с icon не создаёт текстовый span и считается
icon-only; числовой 0 отображается. Интервал icon/label задаётся CSS margin.
Title по умолчанию берётся из scalar label без icon,
как в Ant Design. ClassNames/styles поддерживают root/item/label/icon, объект
либо callback ({ props }); styles — CSS-строки. Style перекрывает styles.root.

ConfigProvider.segmented задаёт class/style и classNames/styles всех четырёх slots.
Undefined наследует родительский record; явный record, включая {}, заменяет его
целиком. Slot classes объединяются context → local; root styles идут в порядке
context styles.root → context style → local styles.root → local style.
Callbacks могут возвращать undefined. Они сохраняют существующие native props:
generated name и defaults disabled/block/vertical; size остаётся локальным prop,
даже при наследуемом componentSize. Глобальный callback типизирован для разных
value/options и не меняет выбор значения.
Сверка: [UMD](../../../tests/browser/fixtures/ant-design-segmented-config-reference.json),
[SSR](../../../tests/package/segmented-config.ssr.test.ts),
[browser](../../../tests/browser/segmented-config.spec.ts), `?fixture=segmented-config`.

ConfigProvider.theme.components.Segmented применяет все восемь компонентных
токенов: padding/фон track, обычный/selected/hover текст и фоны selected/hover/active.
Поддержаны числовой 0, строковая CSS-длина trackPadding, alias tokens,
глобальные и компонентные algorithms, cssVar.prefix и вложенные providers.
Тема обновляет размеры и состояния без сброса selection, focus или radio DOM;
изменение геометрии завершает существующий thumb через ResizeObserver.
Переменные темы идут перед semantic/user styles; native light/dark/compact
сохраняют прежние цвета и размеры.
Сверка: [официальные CSS tokens](../../../tools/fixtures/ant-design-segmented-tokens-reference.json),
[размеры и pseudo states](../../../tests/browser/fixtures/ant-design-segmented-theme-reference.json),
[SSR](../../../tests/package/segmented-theme.ssr.test.ts) и
[browser](../../../tests/browser/segmented-theme.spec.ts), `?fixture=segmented-theme`.

Value поддерживает binding, defaultValue читается при создании; без него выбран
первый option, даже disabled. Внешняя смена value не вызывает onChange(value).
Удаление выбранного option не исправляет значение; восстановление option
возвращает checked. Size наследует ConfigProvider, orientation имеет приоритет
над vertical; block и shape=round повторяют оформление эталона. Disabled влияет
на все radio, option.disabled — на один. Как Ant Design 6.6.8, Segmented не
наследует ConfigProvider.componentDisabled; передавайте disabled явно.

Внутри radiogroup — нативные label/input[type=radio]/div label. Name общий
для inputs и уникален между экземплярами по умолчанию. Корень имеет tabindex=0,
если не disabled; native Tab также достигает выбранного radio. Стрелки циклически
выбирают enabled options в порядке массива независимо от RTL и направления.
Смена по стрелке подавляет второе нативное переключение и переводит фокус
на выбранный radio. Bind:nativeElement даёт корневой div.

Сохраняется upstream-контракт FormData: у radio нет value-атрибута, поэтому
выбранный enabled option отправляет "on" под name. Типизированное значение
получайте через binding/onChange. Native reset не меняет модель и не вызывает
onChange; checked после reset приводится к текущему value. Интеграция с FormItem
и сериализация option.value не добавляются скрыто.

Галерея — `/ant-design#segmented`, фикстура — `?fixture=segmented`.
Рецепт segmented воспроизводит 38 правил vendor/segmented.css; цвета адаптированы
к существующим темам, размеры используют токены controls. Изучена зависимость
@rc-component/segmented 1.4.0 (commit 8cbec0b3a0a4097b683a55b39b565ea1e249b47f),
её npm-архив сверяется по опубликованному SHA-512 и хранится только в .upstream.
При смене значения между существующими видимыми options создаётся штатный thumb.
Layout-геометрия labels (offset/client, без повторного применения CSS scale)
измеряется после обновления DOM; Web Animations API перемещает
индикатор с duration/easing токенов. Во время движения сохраняется selected-text,
а обычный selected фон возвращается после завершения. Повторная смена отменяет
предыдущий запуск. ResizeObserver, смена оси/RTL, изменения options и удаление
компонента очищают animation/observer; reduced motion пропускает либо завершает
движение. SSR не создаёт thumb, observers или animations.

Option.tooltip принимает строку либо props существующего Svelte Tooltip без
children. Поддержаны hover/focus/Escape, в том числе для disabled option.
Локальный Tooltip добавляет служебный span с display:contents и native popover;
label остаётся flex-item для block и измерений thumb. Пользовательский tooltip.style
может переопределить display; это меняет компоновку по явному выбору владельца.
Локальный prefixCls меняет классы корня, options, icon и thumb и подключает
извлечённый CSS для этого префикса. Пустая строка наследует ConfigProvider.prefixCls
(по умолчанию ant-segmented).
Имена CSS variables и общий marker сохраняются; defaults ограничены собственным
корнем. Смена префикса сохраняет radio, значение, фокус и ref, отменяя старый thumb;
при unmount удаляется локальный stylesheet. Поддержаны native и token themes,
размеры, block/round, vertical/RTL, disabled, semantic styles и option Tooltip.
Сверка: [UMD](../../../tests/browser/fixtures/ant-design-segmented-prefix-reference.json),
[SSR](../../../tests/package/segmented-prefix.ssr.test.ts),
[browser](../../../tests/browser/segmented-prefix.spec.ts), `?fixture=segmented-prefix`.
Segmented наследует ConfigProvider.prefixCls; непустой локальный prefix имеет приоритет.

## InputNumber

InputNumber редактирует `number | null` через `bind:value` и
`onValueChange(value)`. Очистка возвращает null, а `0` остаётся числом.
`defaultValue` фиксируется при создании отдельного control. При использовании
привязки задайте начальное число или null у владельца без defaultValue.

```svelte
<script lang="ts">
  import { InputNumber } from 'antd-svelte';

  let quantity = $state<number | null>(2);
</script>

<label for="quantity">Количество</label>
<InputNumber id="quantity" name="quantity" bind:value={quantity} min={0} max={99} step={1} precision={0} />
```

Компонент хранит редактируемый текст отдельно от числа. Промежуточные `-`,
`1.` и завершающие нули остаются в поле при наборе. Корректное число в пределах
min/max сразу обновляет модель; пустая строка обновляет её на null. Нечисловой
или выходящий за границы черновик не заменяет последнее принятое число.
Поддерживаются знак, десятичная точка и экспонента. DecimalSeparator задаёт другой
разделитель; без него прежний строгий parser не принимает запятую. Составной ввод IME публикует число
после compositionend.

Blur и Enter завершают редактирование: числовой черновик ограничивается
min/max и округляется с precision, нечисловой возвращается к последнему числу.
Precision задаёт от 0 до 100 знаков после точки; равные половины округляются
от нуля, например `1.005` с precision=2 становится `1.01`. Округление остаётся
внутри границ. Отображение дополняется нулями до precision. Если диапазон
не содержит числа с указанной precision, значение не меняется. Это обычный
JavaScript number; precision не добавляет произвольную числовую точность.

По умолчанию min/max равны Number.MIN_SAFE_INTEGER/Number.MAX_SAFE_INTEGER,
step равен 1. Дробный положительный step поддерживается без хвостов вроде
`0.30000000000000004` при сложении десятичных шагов. Неположительный или
нечисловой step заменяется на 1, нечисловые границы — на defaults; некорректная
precision игнорируется. При min > max изменение числа блокируется, очистка
остаётся доступной. Внешние value и изменения min/max не вызывают callbacks
и не ограничивают число автоматически. Выход за границы виден в оформлении;
NaN и Infinity отображаются как пустое значение без callback.

ArrowUp/ArrowDown и кнопки меняют число на step, сохраняя фокус в поле.
На границе недоступно движение наружу. `keyboard={false}` отключает стрелки,
`controls={false}` скрывает кнопки; эти настройки независимы. Enter завершает
ввод и сохраняет нативную отправку формы. `onkeydown` вызывается до обработки
клавиш; preventDefault отменяет её. Shift увеличивает шаг в десять раз.
Удержание кнопки повторяет изменение после 600ms с интервалом 200ms.
Колесо по умолчанию число не меняет; `changeOnWheel` включает его только для
сфокусированного поля. `changeOnBlur={false}` сохраняет черновик при blur;
Enter по-прежнему подтверждает ввод, в том числе при keyboard=false.
`oninput` и остальные нативные события получают DOM-текст; числовое значение
получайте через onValueChange.

Размеры small/medium/large, disabled и направление наследуются из
ConfigProvider. Явные props переопределяют наследование. Readonly задаётся
нативным `readonly` либо alias readOnly; disabled/readonly блокируют изменение числа и скрывают
кнопки. Status принимает error/warning и наследует ошибку FormItem.
Поддерживаются светлая/тёмная темы, основные цвета, компактный режим, RTL и
prefers-reduced-motion. Кнопки и сообщение нативной проверки локализуются
через `locale.inputNumber`; вложенный провайдер объединяет отдельные подписи.

Поле использует input с role=spinbutton и aria-valuenow/min/max. Доступное имя
задаётся label, FormItem либо aria-label/aria-labelledby; кнопки изменения
не добавляют остановки Tab. Нативные required и проверка числового черновика
работают в обычной HTML-форме. В Form правила модели управляют проверкой,
а FormItem передаёт id, name, required, статус, описание ошибки и blur/touched.
Передавайте `value={form.values.quantity}` и
`onValueChange={(value) => form.setFieldValue('quantity', value)}`.
Required считает `0` заданным значением, min/max сравнивают числа.

С name либо FormItem.name FormData содержит одно поле с канонической строкой
числа, например '1.2' для текста `1.20`, или '' для null. Disabled исключает
поле, readonly сохраняет его. Атрибут form связывает input и скрытое поле
с внешней формой. Нативный reset восстанавливает исходный defaultValue либо
null и обновляет привязку в следующей задаче без callback. Отменённый reset
сохраняет значение; удаление control отменяет ожидающую задачу. Reset модели
Form восстанавливает её initialValues и сбрасывает черновик, даже если число
осталось прежним.

StringMode переносит арифметику @rc-component/input-number 1.6.2 и mini-decimal 1.0.1:
значение и callbacks используют string/null, не теряя дробные разряды за пределами
safe integer. Step и границы могут быть строками; без заданных границ stringMode
не вводит safe-integer ограничение. Precision и дополнение до точности step
следуют исходному алгоритму. Для произвольной точности нужен BigInt; fallback
mini-decimal использует обычный Number с его ограничениями.

```svelte
<script lang="ts">
  import { InputNumber } from 'antd-svelte';
  let amount = $state<string | null>('1');
</script>

<InputNumber stringMode bind:value={amount} min="0" max="10" step="0.00000000000001" />
```

Опциональные formatter/parser разделяют текст и модель; parser может вернуть
строку для stringMode. Formatter получает строковое число и `{ userTyping, input }`.
Каретка восстанавливается после форматирования, без снятия выделения при фокусе.
OnChange получает тот же тип значения, что onValueChange, и вызывается перед ним;
onInput получает исходный текст после обновления модели. OnStep сообщает emitter
handler/keyboard/wheel, направление и offset; onPressEnter вызывается после commit.
Для отклонения обновлений владельцем используйте function binding с getter/setter.

Есть outlined/filled/borderless/underlined, mode="spinner", prefix/suffix и custom
иконки в controls. Контент принимает строки, числа и snippets. RootClassName
и nativeElement относятся к control; для внешней композиции используйте
SpaceCompact/SpaceAddon. ConfigProvider.inputNumber задаёт
variant, class/style и semantic slots. Локальные styles имеют приоритет.

Bind:inputElement возвращает input, bind:nativeElement — корень control, bind:ref —
proxy native input с nativeElement и focus({ cursor, preventScroll })/blur(). Методы
focus/blur доступны также через bind:this. Mouse callbacks с именами Ant Design
относятся к корню; нативные lowercase handlers сохраняют события input.
Публичные типы и JSDoc находятся в [input-number.types.ts](../../../src/lib/input-number.types.ts).

Обычный числовой режим сохраняет прежние native контракты выше: строгий parser,
finite number/null, safe-integer defaults, проверку формы и commit черновика.
Точность step не добавляет нули к отображению автоматически. Это явно отличается
от rc-input-number; stringMode использует исходный десятичный алгоритм.
Source component tokens и runtime algorithms подключены; native-only compact/focus
оформление сохраняет прежний контракт. React diagnostics и полный style renderer
остаются в работе; internal PurePanel не входит в публичный перенос. Нативные кнопки
и Svelte snippets заменяют React spans/nodes. CSS-рецепт input-number-features извлекает 64 правила,
не перезаписывая прежние outlined/compact стили; арифметика сопровождается
[MIT mini-decimal](../../../src/lib/vendor/LICENSE.rc-mini-decimal).

Пример количества, цены и расчёта стоимости доступен на `/ant-design#input-number`.
Новые сценарии: `?fixture=input-number-features`,
[browser](../../../tests/browser/input-number-features.spec.ts) и
[package SSR](../../../tests/package/input-number-features.ssr.test.ts).


InputNumber поддерживает local/shared prefixCls вместе с CSS обоих modes,
вариантов, размеров, affixes/actions и Compact. Непустой local prefix имеет
приоритет; empty/undefined наследуют ConfigProvider. Canonical token variables
и marker сохраняются; native geometry и reduced-motion adapters используют
стабильные классы/атрибуты. Смена prefix сохраняет root/input/ref, текстовый draft,
selection/focus, callbacks, keyboard и canonical FormData. Source measurements
снимаются в stringMode; Source FormData хранит редактируемый текст, а Native
hidden field — каноническое decimal value, как прежде. Проверки —
`?fixture=input-number-prefix`,
[browser](../../../tests/browser/input-number-prefix.spec.ts),
[SSR](../../../tests/package/input-number-prefix.ssr.test.ts),
[эталон UMD](../../../tests/browser/fixtures/ant-design-input-number-prefix-reference.json).
Рецепт input-number-prefix выводит 124 исходных CSS rules без deprecated addons.
В rc-input-number 1.6.2 focus class не совпадает с классом, ожидаемым CSS стрелок.
Raw focused measurements и counterpart с public className сохранены раздельно;
Native сохраняет прежний mode-focused class и видимые стрелки.

## ColorPicker

ColorPicker переносит Ant Design 6.6.8, @rc-component/color-picker 3.1.1,
FastColor 3.0.1 и gradient slider 1.1.1. Точные props и snippets описаны в
[color-picker.types.ts](../../../src/lib/color-picker.types.ts); методы Color — в
[color.ts](../../../src/lib/color.ts). React runtime в пакет не добавляется.

```svelte
<script lang="ts">
  import { ColorPicker, type ColorPickerProps } from 'antd-svelte';
  let color = $state<ColorPickerProps['value']>('#1677ff');
</script>

<ColorPicker value={color} onChange={next => { color = next; }}
  mode={['single', 'gradient']} showText allowClear />
```

Value принимает строку, объект Color из callback, null или массив `{ color, percent }`.
Color сохраняет точность HSV и alpha; повторный разбор строки может её потерять.
Пустое начальное значение очищено. Cleared отличается от прозрачного цвета;
clear сохраняет оттенок и насыщенность, а повторный clear не вызывает callbacks.
`onChange(color, css)` возвращает RGB/linear-gradient CSS независимо от format.
Заданные value/open/format управляются владельцем. Для обновления только после
drag передайте обработчик onChangeComplete; локальный preview до завершения
не меняет текст trigger. DefaultValue/defaultFormat читаются при создании.

Есть HEX sanitization, RGB/HSB inputs, Hue/Alpha и двумерный palette. Native handler
добавляет стрелки клавиатуры для saturation/brightness. Gradient mode поддерживает
добавление interpolated points, crossing, active color, drag deletion и исходный
keyboard Delete, включая удаление последних точек. Переход gradient → single →
gradient восстанавливает кеш, пока single color не изменён. DisabledAlpha сохраняет
исходное условие: текущий alpha учитывается при следующем изменении.

Presets принимают цвета/градиенты, ключи, label/snippet и initial defaultOpen.
ShowText может быть snippet с Color; children заменяет trigger. PanelRender получает
исходный panel snippet и `extra.components.Picker/Presets`, которые можно разместить
в своей композиции. ConfigProvider.colorPicker задаёт class/style, semantic slots
и arrow; локальный style имеет приоритет. Поддерживаются en/ru, alias locale.ColorPicker,
унаследованный размер, Compact, темы и RTL; внутренние цветовые дорожки всегда LTR.

Trigger, clear и presets — native buttons; popup использует native popover,
12 placement, click/hover, arrow/pointAtCenter и getPopupContainer. По умолчанию portal
находится в body; внутри native modal остаётся в dialog. CSS-переменные темы
переносятся общим механизмом с Tour. Локальная функция getPopupContainer имеет
приоритет над ConfigProvider.getPopupContainer; undefined использует provider.
Getter не вызывается до первого открытия. Escape возвращает фокус; outside закрывает
popup. DestroyOnHidden управляет сохранением черновиков;
portal, listeners и timers очищаются. Panel изолирует FormItem и Compact. Как upstream,
ColorPicker не добавляет скрытое поле в FormData; значение передаётся callbacks.
Размещение учитывает прокручиваемую область документа через `visibleFirst`.
Как в React 6.6.8, высокая панель может выходить за границу окна; нижняя группа
палитры в таком случае становится доступной после прокрутки страницы. Открытая
панель расширяет прокручиваемую область даже у короткой страницы и остаётся
открытой, когда trigger уходит за край окна. Tab прокручивает страницу к кнопкам
пресетов, чтобы сфокусированный цвет оставался виден. [Измерения React](../../../tests/browser/fixtures/ant-design-color-picker-short-page-source-reference.json)
содержат короткие окна 1280×360/720 и контроль на длинной странице.

`ConfigProvider.theme.components.ColorPicker` поддерживает alias overrides и
component algorithms, dark/compact, cssVar prefix и вложенные темы. Собственных
public component tokens у ColorPicker 6.6.8 нет. Trigger и popup получают общую
тему; Popover, Collapse пресетов и поля сохраняют независимые темы и исходные
приоритеты CSS. Bright-state пресетов использует глобальный colorBgElevated.

Обновление темы сохраняет popup DOM/position, цвет, незавершённый HEX input,
caret/focus и раскрытие пресетов. Локальные и semantic styles сохраняют приоритет;
popup.root.color меняет внешний popup, содержимое сохраняет исходный colorText
reset. Проверки и 15 UMD-тем — [color-picker-theme](../../../tests/browser/color-picker-theme.spec.ts),
`?fixture=color-picker-theme`.

`prefixCls` локально меняет owner ColorPicker и перекрывает общий префикс
ConfigProvider. Popover, Select/Input/InputNumber, Slider, Divider, Segmented и Collapse
сохраняют свои общие namespaces; CSS variables и theme markers остаются canonical.
Обновление префикса сохраняет открытый popup, цвет, незавершённый HEX, caret/focus,
раскрытие пресетов и custom trigger/container. Возврат к оформлению по умолчанию
также сохраняет эти состояния. Сверка с UMD —
[color-picker-prefix](../../../tests/browser/color-picker-prefix.spec.ts),
`?fixture=color-picker-prefix`.

В Source кеш style hook при одинаковом локальном owner/theme и изменённом общем
префиксе сохраняет selectors дочерних controls от первого provider. Native разрешает
их независимо. Raw замеры вложенного случая хранятся отдельно от public counterpart
с уникальным локальным prefixCls; разные классы не выдаются за одинаковый DOM.

Остаются полный rc-trigger overflow/motion API и React
development/PurePanel API. Native DOM и Svelte snippets заменяют React nodes/refs.
Извлечённый [CSS](../../../src/lib/vendor/color-picker.css) воспроизводится рецептом из 94 правил.
Логика сопровождается MIT [FastColor](../../../src/lib/vendor/LICENSE.fast-color) и
[rc-color-picker](../../../src/lib/vendor/LICENSE.rc-color-picker). Formatter/parser опираются
на [rc-input-number 1.6.2](../../../src/lib/vendor/LICENSE.rc-input-number).
Проверки: [engine](../../../src/lib/color-picker.engine.test.ts),
[package SSR](../../../tests/package/color-picker.ssr.test.ts),
[browser](../../../tests/browser/color-picker.spec.ts); fixture: `?fixture=color-picker`.

## Slider

По умолчанию Slider выбирает одно число через `bind:value` и `onValueChange(value)`.
`defaultValue` фиксируется при создании отдельного control и по умолчанию
равен 0. При привязке задавайте начальное число у владельца без defaultValue.
В одиночном режиме значение всегда числовое. Следующие положения описывают этот
сохранённый native API; режим `range` описан отдельно ниже.

```svelte
<script lang="ts">
  import { Slider } from 'antd-svelte';

  let volume = $state(40);
</script>

<label for="volume">Громкость</label>
<Slider id="volume" name="volume" bind:value={volume} min={0} max={100} step={5} />
```

Основой служит нативный input[type=range]. Нажатие на дорожку и перетаскивание
мышью или касанием меняют число сразу; выход указателя за границы ограничивает
значение. `onChangeComplete(value)` вызывается один раз после отпускания
указателя или завершения последовательности клавиш, если число изменилось.
Удержание клавиши может вызвать несколько onValueChange, но один
onChangeComplete при отпускании. Действие на уже достигнутой границе не
создаёт callbacks. Нативная пара input/change без pointer/key также
поддерживается. Для числовой модели используйте onValueChange, нативные
события остаются доступны через HTML props.

`onChange(next)` получает число перед обновлением `bind:value`; `onValueChange`
вызывается после. Этот alias не меняет сохранённые native правила завершения и
отмены действий. Deprecated onBeforeChange исключён; полная унификация lifecycle
с range пока остаётся отдельной задачей.

По умолчанию min=0, max=100, step=1. Число ограничивается границами и
выравнивается по ближайшему шагу от min; равные расстояния округляются
к большему значению. Дробные шаги вычисляются без накопления хвостов вроде
`0.30000000000000004`. Задавайте step так, чтобы он делил max - min.
Если деления нет, последняя достижимая ступень находится ниже max,
как у нативного range. Некорректный step заменяется на 1, нечисловые границы —
на defaults; max < min сворачивается в min. Равные границы дают фиксированное
значение без изменений и callbacks.

Scalar также поддерживает `marks`, `dots`, `step={null}`, `included` и `track`.
При наличии marks или step=null значение выравнивается общим с range алгоритмом
rc-slider: выбирается ближайший mark/step/min/max с исходным порядком разрешения
равных расстояний. При step=null доступны только marks и границы, даже если marks
нет. Dots добавляет визуальные деления и само не ограничивает значения.
Included=false убирает track и active marks/dots; track=false скрывает только track.
Подпись mark принимает текст, число, snippet или `{ label, style }` с CSS-строкой.
Marks — нативные кнопки: доступны Tab/Enter/Space и исключаются при disabled.
Изменение marks нормализует отображение и FormData без записи в owner и callbacks.
Отображаемые marks/dots используют тот же мост native presets, что и range;
обычный числовой Slider без делений сохраняет прежнее оформление.

Внешние value и изменения границ не вызывают callbacks и не изменяют состояние
владельца. Для отображения и FormData используется нормализованное число.
NaN и Infinity отображаются как min. При пользовательском изменении владелец
получает новое допустимое число.

Стрелки меняют число на один шаг, Home/End выбирают первую/последнюю
достижимую ступень, PageUp/PageDown — два шага. `keyboard={false}` отключает
эти клавиши, сохраняя мышь и касание. Нативный onkeydown вызывается первым;
preventDefault отменяет обработку. PreventDefault в onpointerdown отменяет
начало перетаскивания. Имя задаётся label, FormItem или aria-label/aria-labelledby;
aria-valuetext позволяет описать единицу измерения. Фокус остаётся у input,
а видимый бегунок показывает кольцо клавиатурного фокуса.

Orientation принимает horizontal/vertical.
Вертикальному Slider задайте высоту,
например `style="height: 160px"`; min по умолчанию находится снизу. Reverse
меняет направление. В RTL горизонтальный min находится справа; reverse
меняет это правило обратно. Вертикальное направление от RTL не меняется.
Стрелки следуют расположению: вправо двигает бегунок вправо, вверх — вверх;
в горизонтальном режиме вверх увеличивает число. Поддерживаются светлая/тёмная
темы, основные цвета, компактный режим и prefers-reduced-motion.

Disabled наследуется из Form/FormItem и ConfigProvider; disabled=false
переопределяет наследование. Disabled исключает input из Tab и FormData.
Смена владельца, диапазона или направления, отключение, потеря захвата,
blur и удаление control отменяют активное действие без позднего
onChangeComplete. Новое действие работает независимо от отменённого.
Слушатели и ожидающие reset освобождаются при удалении.

Scalar принимает исходные ariaLabelForHandle/ariaLabelledByForHandle,
ariaValueTextFormatterForHandle, ariaRequired, tabIndex и autoFocus, включая
первый элемент массивов handle props. Массив disabled использует только первую
отображаемую точку. AutoFocus фиксируется при mount; ref.focus()/blur() обращаются
к native input. TabIndex=[] исключает control из Tab, но сохраняет программный
фокус native input, в отличие от div без tabindex в rc-slider.

Для Form передавайте `value={form.values.volume}` и
`onValueChange={(value) => form.setFieldValue('volume', value)}`.
FormItem передаёт id, name, label, ошибку, описание и blur/touched.
Проверкой числа управляют правила Form: required принимает 0, min/max
сравнивают числа; нативный range всегда имеет значение. При ошибке Form
фокусирует input. Reset модели восстанавливает initialValues и отменяет
незавершённое действие, включая reset к прежнему числу.

Нативная FormData содержит одно поле с числом в строковом виде, включая '0'.
Атрибут form связывает control с внешней формой. Любой reset этой формы
отменяет активное действие. Если reset не отменён через preventDefault,
привязка получает исходный defaultValue с учётом текущих границ и шага
в следующей задаче, без callbacks. Отменённый reset сохраняет текущее число.

Галерея `/ant-design#slider` содержит Slider и InputNumber с одним владельцем
состояния. Числовое поле использует function binding; пустой ввод означает 0
и после blur отображается как 0. Применённая громкость обновляется после
завершения действия. Числовое поле не имеет name, поэтому FormData содержит
громкость один раз. Также показаны ориентация, reverse, disabled, проверка и reset.

Tooltip по умолчанию показывает число при наведении, фокусе и перетаскивании;
подсказка следует за видимым бегунком. `tooltip={{ formatter: (value) => value + '%' }}`
задаёт формат. `tooltip={false}`, `tooltip={{ open: false }}`, formatter=null
или результат formatter=null отключают подсказку и её описание. `open: true`
показывает её постоянно у доступного Slider. Также поддерживаются placement
и arrow, включая `{ pointAtCenter: true }`, а также boolean/object autoAdjustOverflow.
Это относится к single, активной подсказке range и закреплённым подсказкам всех
бегунков. По умолчанию положение top, для вертикального Slider — right, в RTL — left.
Escape скрывает подсказку, сохраняя фокус и число; следующее действие открывает
её снова. Disabled скрывает подсказку. Текст дополняет aria-describedby поля,
сохраняя help/ошибку FormItem. Числовые callbacks от показа подсказки не вызываются.
Поле tooltip.destroyOnHidden работает во всех
трёх режимах подсказок Slider. Правила приоритета и lazy SSR
такие же, как у самостоятельного Tooltip; по умолчанию содержимое сохраняется.

`ConfigProvider.theme.components.Slider` применяет все 18 исходных токенов к обоим
режимам и ориентациям. Например, `railSize: 6` задаёт горизонтальную высоту или
вертикальную ширину шкалы 6px. Поддержаны aliases, component algorithms, нули,
явный undefined и CSS-variable prefix. Обновление темы сохраняет значения, DOM,
фокус и callbacks; локальные root/semantic styles сохраняют приоритет.
Фокус native input оформляет видимый handle по source-токенам. Native-only темы
и интерактивные области input сохраняют прежнее поведение.
Подробнее: [токены Slider](../theme-context.md#токены-slider),
[SSR](../../../tests/package/slider-theme.ssr.test.ts),
[browser](../../../tests/browser/slider-theme.spec.ts), маршрут `?fixture=slider-theme`.

### Диапазон Slider

`Range` включает исходный multiple-handle API Ant Design 6.6.8 и
@rc-component/slider 1.1.1. Старые одиночные bind, normalization, callbacks,
native events и reset сохраняются. Точные интерфейсы:
[slider.types.ts](../../../src/lib/slider.types.ts) и
[slider-range.types.ts](../../../src/lib/slider-range.types.ts).

```svelte
<script lang="ts">
  import { Slider, type SliderRef } from 'antd-svelte';

  let interval = $state([20, 80]);
  let slider = $state<SliderRef>();
</script>

<Slider range bind:value={interval} bind:ref={slider} name="interval"
  ariaLabelForHandle={['Начало', 'Конец']} />
```

Значения сортируются в новую копию; внешний массив не меняется. Без value и
defaultValue создаются две точки у min. Null и [] оставляют диапазон пустым;
нажатие на дорожку восстанавливает две совпадающие точки. `SliderProps` по умолчанию описывает
одиночные callbacks; `SliderProps<true>` и `SliderRangeProps` описывают массив.
При прямом SSR-вызове TypeScript можно уточнить компонент как `Slider<true>`.

Range использует исходное выравнивание по step/marks/min/max rc-slider. Step=null
оставляет только marks и endpoints, включая max. Dots добавляет деления;
сам алгоритм выбора точки определяется step/marks. Marks принимает текст,
числа, snippets либо label/style. Интерактивные подписи — native buttons;
они доступны с клавиатуры и не отправляют форму. Included/track управляют
дорожками, а start/end подсветки определяются крайними значениями.

AllowCross по умолчанию true. Pushable задаёт минимальный разрыв и выталкивает
соседей; true использует step. Disabled принимает boolean или массив: выключенные
точки остаются неподвижными anchors. Любая выключенная отображаемая точка
отключает editable и draggableTrack; лишние элементы массива disabled не учитываются.
Range.draggableTrack двигает группу с сохранением расстояний и ограничением границ.

Range.editable добавляет точки по нажатию на дорожку и учитывает minCount/maxCount.
Delete/Backspace удаляет выбранную точку; перенос дальше 130px поперёк дорожки
помечает её для удаления. Editable имеет приоритет над draggableTrack; при
step=null перенос всей дорожки отключён. Во время пересечения сохраняется drag
identity; после завершения и keyboard crossing фокус следует новому индексу.

OnChange получает отсортированный массив перед обновлением bind:value;
onValueChange — после него.
Range вызывает onChangeComplete по navigation keyup и release
даже без изменения; Delete вызывает change без дополнительного complete.
Click mark завершает изменение сразу. Keyboard=false блокирует перемещение,
но сохраняет исходный callback keyup. Нативные input/change доступны отдельно;
для pointer/keyboard действий диапазона они отправляются после DOM update и
имеют isTrusted=false. Для числового массива используйте компонентные callbacks.

Каждый включённый native input отправляет своё значение под общим name;
FormData.getAll(name) возвращает диапазон. Id и связь label относятся к первому
input, form поддерживает внешнего владельца. Native reset восстанавливает
initial defaultValue с текущими границами и удаляет добавленные точки; без
defaultValue возвращаются две точки у min. Отменённый reset сохраняет значения.
Form/FormItem передают name/id, disabled, описание, ошибку и blur/touched.

Ref.focus()/blur() работают в обоих режимах; bind:nativeElement и
ref.nativeElement дают внешний div. При unmount очищаются pointer/touch listeners,
capture, reset timers и ref. SSR не измеряет DOM, не фокусирует controls и не
запускает callbacks/timers. Темы light/dark/compact и три существующих primary
переключаются через ConfigProvider. Direction/reverse и orientation
сохраняют исходные физические направления.

ConfigProvider.slider задаёт class/style и semantic slots обоих режимов.
ClassNames объединяются, styles применяются по порядку с приоритетом локального
слоя. Есть slots root/tracks/track/rail/handle.
Provider styles.root → provider style → local styles.root → local style.
Callback видит входные props и разрешённый disabled; проверяйте props.range
перед обращением к числовому/массивному value. Явный вложенный record заменяет
родительскую config целиком; undefined наследует её. Root style применяется после
theme variables и сохраняет приоритет при обновлении темы.
Сохраняется текущий SliderTooltipConfig: 12 placement, text formatter,
native popover и описание input. Контейнер выбирается в исходном порядке:
tooltip.getPopupContainer → ConfigProvider.getPopupContainer. Корневого getPopupContainer у Slider нет.
Полный SliderTooltipProps и исходное управление focus-open остаются частично
перенесёнными. Полный scalar lifecycle/callback API
ещё не закрыты; сохранены описанные выше native numeric/form/event contracts.

Локальный `prefixCls` меняет BEM-классы обоих режимов, tracks, marks/dots и handles.
Пустой prefix, как и undefined, наследует ConfigProvider.prefixCls
(по умолчанию ant-slider). Для собственного prefix
stylesheet из 54 исходных правил добавляется уже при SSR; defaults ограничены
владельцем и не меняют соседние Slider. CSS variables сохраняют пространство
Slider, а `theme.cssVar.prefix` настраивает их независимо от BEM-классов.
Смена prefix сохраняет DOM, refs, значения, фокус и callbacks.

Все подсказки получают исходный classNames.root `${prefix}-tooltip` с разрешённым prefix, включая
active и pinned range. Собственный `tooltip.prefixCls` остаётся независимым;
при стандартном Tooltip prefix применяется исходный reset min-width контейнера.
Native disabled по-прежнему скрывает подсказки даже при open=true; upstream в этом
случае оставляет принудительно открытую подсказку. При сверке RTL учитывается
унаследованный DOM dir, который задаёт Svelte ConfigProvider.

Prefix: [SSR](../../../tests/package/slider-prefix.ssr.test.ts),
[browser](../../../tests/browser/slider-prefix.spec.ts),
[эталон UMD](../../../tests/browser/fixtures/ant-design-slider-prefix-reference.json),
маршрут `?fixture=slider-prefix`.

Scalar source API: [SSR](../../../tests/package/slider-scalar.ssr.test.ts),
[browser](../../../tests/browser/slider-scalar.spec.ts),
[эталон официального UMD](../../../tests/browser/fixtures/ant-design-slider-scalar-reference.json),
маршрут `?fixture=slider-scalar`. Проверяются также semantic config, ARIA, native
focus/form/reset и отсутствие callbacks при обновлении marks.

Проверки: [engine](../../../src/lib/slider-range.engine.test.ts),
[public SSR](../../../tests/package/slider-range.ssr.test.ts),
[browser](../../../tests/browser/slider-range.spec.ts) и `?fixture=slider-range`.
Новый [CSS](../../../src/lib/vendor/slider-range.css) воспроизводится рецептом из 54 правил;
прежний [slider.css](../../../src/lib/vendor/slider.css) сохранён. Перенесённая логика
снабжена [MIT rc-slider](../../../src/lib/vendor/LICENSE.rc-slider).

## Cascader / CascaderPanel

Cascader переносит Ant Design 6.6.8 и @rc-component/cascader 1.22.0.
Selector сверён с @rc-component/select 1.10.1, каскадные checkbox — с
@rc-component/tree 1.4.0. Чистая логика путей и поиска находится в
[cascader.engine.ts](../../../src/lib/cascader.engine.ts), публичные типы и defaults — в
[cascader.types.ts](../../../src/lib/cascader.types.ts).
React-зависимости не устанавливаются. [Лицензия rc-cascader](../../../src/lib/vendor/LICENSE.rc-cascader)
включена в пакет; CSS-рецепт извлекает 108 правил selector/columns/checkbox/Panel/RTL.

```svelte
<script lang="ts">
  import { Cascader, CascaderPanel, type CascaderPath } from 'antd-svelte';

  let path = $state<CascaderPath>([]);
  const options = [
    { value: 'asia', label: 'Asia', children: [
      { value: 'japan', label: 'Japan' }
    ] }
  ];
</script>

<Cascader {options} value={path} onChange={next => { path = next ?? []; }} />
<CascaderPanel {options} value={path} onChange={next => { path = next ?? []; }} />
```

Value/defaultValue — полный путь string/number; multiple использует массив
путей. Value управляется владельцем через onChange, defaultValue читается при
создании. Очистка single вызывает onChange(undefined, undefined), multiple —
onChange([], []). Второй аргумент содержит исходные options в порядке пути;
отсутствующие узлы сохраняют undefined. Missing paths остаются видимыми, с
fallback к raw values. Повторный выбор single тоже вызывает onChange.
Компонент не задаёт прикладную сериализацию путей в FormData.

В multiple каскадный выбор проходит только через разрешённые checkbox; disabled
и disableCheckbox разрывают conduction. Отображение и onChange используют
SHOW_PARENT по умолчанию или SHOW_CHILD. Константы экспортируются как
CASCADER_SHOW_PARENT/CASCADER_SHOW_CHILD. Клик по содержимому родителя раскрывает
колонку, checkbox выбирает ветку. Default display — весь путь через ` / ` для
single и последний label для multiple. MaxTagCount, responsive, maxTagTextLength,
tagRender и maxTagPlaceholder меняют отображение, сохраняя выбранные пути.
MaxTagTextLength сохраняет исходный title и считает UTF-16 units, как rc-select;
при усечении корректной surrogate pair не остаётся её оборванная половина.
Общие [raw замеры Select/Cascader](../../../tests/browser/fixtures/ant-design-select-tag-text-reference.json)
сохраняют исходный дефект Unicode для отдельного разбора.

ShowSearch по умолчанию false. True включает поиск по любому label в пути;
объект настраивает controlled searchValue/onSearch, filter/sort/render, limit,
matchInputWidth, searchIcon и autoClearSearchValue. Default limit=50; false и неположительное число
снимают лимит. Без sort лимит останавливает обход, с sort применяется после
сортировки. ChangeOnSelect/multiple включают промежуточные пути в выдачу;
disabled родителя распространяется на результаты его детей.
Label snippet остаётся непрозрачным для default filter, как ReactNode;
для поиска по содержимому snippets задайте filter.

Выбор очищает локальный поиск без отдельного onSearch; multiple с autoClearSearchValue=false
сохраняет запрос до blur. Полная очистка и закрытие single могут вызвать
onSearch(''); при controlled search решение об изменении остаётся у владельца.

LoadData получает исходные options активного пути, когда последний узел не leaf.
Его Promise не ожидается: индикатор снимается после обновления children,
isLeaf=true либо удаления узла из options. Пустой children=[] тоже снимает
индикатор. Во время поиска загрузка не запускается.
Явный isLeaf=false сохраняется в выдаче: single без changeOnSelect не выбирает
такой узел. Сетевые запросы, ошибки и обновление options принадлежат потребителю,
как в upstream; компонент не
выполняет скрытую загрузку и не добавляет собственные состояния ответа.

Popup поддерживает controlled/defaultOpen, changeOnSelect, click/hover,
размещение, ширину и popupRender; deprecated dropdown aliases удалены.
Поле удерживает focus при выборе; Up/Down обходят разрешённые строки,
Left/Right переходят между колонками и меняются местами в RTL, Backspace
возвращает родителя, Enter выбирает, Escape закрывает.
При непустом запросе Left/Right сохраняют нативную работу каретки и выделения.
Поле поиска сохраняет высоту строки и цвет текста после скрытия выбранного label;
повторный ввод оставляет выбранный путь без изменений.
В multiple Backspace также удаляет последний разрешённый tag. Clear — нативная кнопка с клавиатурной
активацией. FormItem передаёт label/id, description, required и status;
bind:nativeElement/inputElement и focus/blur доступны после mount.

ConfigProvider.cascader задаёт variant, class/style, semantic slots и icons.
Локальные поля уточняют конфигурацию; root style идёт после styles.root,
для popup/list/listItem применяются соответствующие semantic slots.
AllowClear=true наследует ConfigProvider.cascader.clearIcon и обычную иконку Ant
по умолчанию. Объект allowClear передаётся без наследования; его отсутствующий
или falsy clearIcon использует fallback `×`.
Semantic callbacks получают исходные props, включая raw
multiple, и resolved disabled/size/variant/status. Panel наследует disabled/direction и expand/loading icons,
а root class/style и popup semantic config Cascader к ней не применяются.
Темы и compact используют текущие tokens библиотеки; locale — общий ConfigProvider.

При source-настройках темы поле и dropdown объединяют `components.Select` и
`components.Cascader` в исходном порядке. Cascader задаёт ширину поля/колонок,
высоту dropdown, отступы и оформление выбранной строки. Component algorithms,
нули/undefined и custom CSS prefix поддерживаются; настройки `components.Checkbox`
не меняют внутренние checkbox. Standalone Panel получает только Cascader tokens,
наследует шрифт/цвет provider и сохраняет прозрачный фон. Смена темы сохраняет
DOM, поиск, выделение, фокус и позицию popup; semantic popup styles сохраняют
приоритет. Native-only темы остаются прежними. Подробности —
[в справочнике темы](../theme-context.md).

ReactNode/render callbacks заменены Svelte snippets. OptionRender получает
исходный option и info с path/searchValue/originNode: для поисковой подсветки
используйте originNode. В React search option.label содержит уже отрисованный
узел; Svelte сохраняет исходный label и передаёт содержимое отдельно.
TagRender получает label snippet, closable/onClose и rc path key; сводный tag
maxTagCount имеет isMaxTag=true без value/index/onClose.
MaxTagPlaceholder получает default label и исходные labels/options каждого
скрытого пути; собственный displayRender можно повторно вызвать с ними.
Custom children получает handlers/ARIA для нативного trigger, который заменяет
React cloneElement. При нём inputElement отсутствует.

GetPopupContainer получает корень `.ant-select`, а при custom children — DOM trigger
из snippet. NativeElement при этом сохраняет прежний div обёртки. Локальная функция
перекрывает ConfigProvider.getPopupContainer; undefined наследует provider.
Getter выполняется в браузере после первого открытия. ShadowRoot требует собственных
стилей. Панель сохраняет state, поиск, фокус и выделение при замене функции с тем же
контейнером; зазор до trigger — исходные 4 px. CascaderPanel остаётся inline и не
использует глобальный getter.

Standalone Panel использует нативные строки-кнопки и клавиатурный focus между
ними. Это явная Svelte accessibility adaptation к исходной pointer-only Panel.
SSR не обращается к DOM и не вызывает loadData; initially open popup отрисован
hidden до mount. Произвольные popup align/motion, React-specific components/refs/warnings и
вывод типа value по произвольному generic ValueField остаются вне этого этапа.

Непустой `prefixCls` задаёт локальный namespace Select control и Cascader
columns/Panel; пустое значение наследует независимые общие prefixes. CSS сохраняет
canonical tokens и передаёт resolved Cascader prefix в search render callback.
Прежние input width, refs/IDs, selected paths, search/caret/focus, callbacks и
клавиатура Panel сохраняются при смене префикса.
[30 UMD-конфигураций](../../../tests/browser/fixtures/ant-design-cascader-prefix-reference.json)
в normal/nested/reset scopes сверяют single/multiple, Panel, поиск, empty/RTL,
размеры, variants/status и aliases. Проверки:
[browser](../../../tests/browser/cascader-prefix.spec.ts),
[SSR](../../../tests/package/cascader-prefix.ssr.test.ts).

В Ant Design 6.6.8 локальный prefix меняет Select popup class, а сброс Cascader
padding продолжает искать общий Select class. В raw local случае остаётся 4px
вместо 0px; Native сохраняет прежний padding:0. Отдельный public counterpart с
`styles.popup.root.padding:0` сверяет popup и зависящую от padding ширину колонок;
control остаётся raw. У Panel прежний Native root dir=rtl также сохранён: Source
задаёт RTL колонкам, оставляя корень LTR. Raw root direction и отдельный public
counterpart с обычной HTML-обёрткой `dir="rtl"` записаны раздельно. Сам Source Panel
не передаёт dir на свой корень. Эти границы не означают одинаковый DOM.

Проверки: [engine](../../../src/lib/cascader.engine.test.ts),
[SSR](../../../src/lib/cascader.ssr.test.ts),
[public package](../../../tests/package/cascader.ssr.test.ts),
[browser](../../../tests/browser/cascader.spec.ts),
[source theme](../../../tests/browser/cascader-theme.spec.ts) и `?fixture=cascader`.

## Transfer

Transfer переносит списки и логику Ant Design 6.6.8. `targetKeys` всегда задаёт
владелец; `onChange(nextKeys, direction, moveKeys)` предлагает перенос. Измените
targetKeys в callback, чтобы его принять. Локального defaultTargetKeys нет.

```svelte
<script lang="ts">
  import { Transfer, type TransferKey } from 'antd-svelte';

  const dataSource = [
    { key: 'a', title: 'Alpha' },
    { key: 'b', title: 'Beta' },
    { key: 'locked', title: 'Locked', disabled: true }
  ];
  let targetKeys = $state<TransferKey[]>(['b']);
</script>

<Transfer
  {dataSource}
  {targetKeys}
  render={record => record.title}
  onChange={next => { targetKeys = next; }}
  showSearch
/>
```

Строке нужен стабильный string/number/bigint key либо rowKey. Числовой `0`,
строка `'0'` и bigint не смешиваются. Без rowKey callbacks получают исходные
объекты; с rowKey — копии с вычисленным key. Входные данные не изменяются.
Порядок source задаёт dataSource, порядок target — targetKeys. Неизвестные
target keys сохраняются в onChange, хотя соответствующих строк пока нет.
Перенос вправо добавляет выбранные enabled keys в начало targetKeys.

Выделение локальное, пока selectedKeys не задан. Управляемый selectedKeys
обновляется владельцем через onSelectChange(sourceKeys, targetKeys).
Возврат к undefined сбрасывает его в пустое локальное выделение. Disabled строки
не переключаются и не переносятся; disabled-only selection не включает actions.
При переносе onSelectChange с очищенной стороной вызывается перед onChange.
Удаление данных очищает устаревшее локальное выделение без callbacks.

Нативные checkbox поддерживают Tab/Space; label переключает всю строку.
Shift выбирает диапазон enabled строк, а полностью выбранный диапазон снимает.
Поиск сбрасывает anchor; выделенные строки вне выдачи сохраняются.
Default filter использует case-sensitive includes. ShowSearch допускает
placeholder/defaultValue; defaultValue читается один раз для каждого списка.
OnSearch/onScroll и onChange используют логические left/source и right/target.
FilterOption, footer и children получают физическую сторону: она меняется в RTL.

Render остаётся callback, возвращающим текст либо `{ label, value }`:
label показывает строку, value задаёт title и текст поиска. Вместо JSX callback
может вернуть Svelte snippet, которому передаётся record. Для результата без
metadata текст поиска берётся из первого string/number среди результата,
item.title и item.key. Без render видимая подпись пустая, как в upstream.

```svelte
{#snippet row(record: { key: string; title: string; })}
  <strong>{record.title}</strong>
{/snippet}

<Transfer
  {dataSource}
  {targetKeys}
  render={record => ({ label: row, value: record.title })}
  onChange={next => { targetKeys = next; }}
/>
```

Pagination использует независимые страницы, default pageSize=10 и simple=true;
поддержаны normal mode, showLessItems и showSizeChanger. Явный pageSize задаёт
управляемый размер. Select current/invert действуют на текущую страницу,
select all — на все enabled строки выдачи. Пустая выдача сбрасывает страницу и
локальный pageSize; временное отключение pagination сохраняет текущую страницу.
OneWay оставляет только перенос вправо; удаление и remove current/all не затрагивают
disabled строки. ShowSelectAll=false скрывает header controls, сохраняя счётчик.

Children snippet получает dataSource, filteredItems/filteredRenderItems,
selectedKeys, direction, disabled, semantic slots и callbacks onItemSelect,
onItemSelectAll/onItemRemove/onScroll. При children встроенная пагинация выключена.
Footer snippet получает полные props списка и `{ direction }`.
Наличие children/footer snippet задаёт layout даже при пустом содержимом snippet;
проверка возвращённого ReactNode на truthiness заменена присутствием snippet.

Actions принимает текст либо snippet с disabled/direction/icon/onClick.
Для собственного disabled/callback используйте `{ children, disabled, onClick }`.
Свяжите info.disabled/info.onClick с native control: это замена React cloneElement.
Собственный onClick вызывается перед переносом; preventDefault его не отменяет,
как в Ant Design. Последующие actions отображаются отдельно; в oneWay это
все entries после первого.
SelectAllLabels принимает текст либо callback, который возвращает текст/snippet.
Значение 0 показывается; null/false/пустая строка включают стандартный счётчик.

ConfigProvider.transfer задаёт class/style, semantic classNames/styles и
selectionsIcon. Common slots дополняются source/target slots; стили конкретной
стороны имеют приоритет над common, локальные слои — над соответствующими context.
Root style имеет приоритет над styles.root; styles.section/actions задают
оформление списков и действий. Поддержаны locale, темы/compact, RTL и status.
Success/validating из исходного InputStatus сохраняют классы без отдельного оформления;
пустой status наследует FormItem.
В корень передаются только aria-/data-атрибуты. NativeElement привязывается к div;
служебные checkbox/search не получают имя/ID внешнего FormItem и не сериализуют keys.
Native reset не меняет state Transfer или поисковую строку. Как у
[React input](https://github.com/facebook/react/blob/v19.2.0/packages/react-dom-bindings/src/client/ReactDOMInput.js),
checkbox возвращает начальный checked DOM до следующего обновления selection;
внутреннее выделение при этом сохраняется. Для сброса keys обновите controlled props.
SSR не публикует callbacks и не обращается к DOM. Состояния и ресурсы принадлежат
экземпляру; меню использует существующий Dropdown.

RenderEmpty подключён через ConfigProvider с исходными fallback/locale приоритетами
и выбором array content по стороне. React-specific refs/dev warnings остаются вне переноса.

`prefixCls` задаёт локальный namespace Transfer; пустое значение наследует
`ConfigProvider.prefixCls`. Классы списков, состояний и действий получают
соответствующий CSS, а внутренние Checkbox/Input/Button/Pagination сохраняют
независимые общие namespaces. Canonical theme variables и semantic priorities
сохраняются. Смена префикса не заменяет поля, checkbox или pager и сохраняет
query, выделение текста, фокус, selection keys и текущую страницу.
[UMD-эталон](../../../tests/browser/fixtures/ant-design-transfer-prefix-reference.json)
содержит 20 конфигураций в обычном, вложенном и reset scopes и три live transitions;
[browser](../../../tests/browser/transfer-prefix.spec.ts) и
[SSR](../../../tests/package/transfer-prefix.ssr.test.ts) проверяют эти границы.
Существующий native remove font учитывается отдельно, без изменения raw measurements.

`ConfigProvider.theme.components.Transfer` применяет шесть component tokens,
alias overrides и global/component algorithms. Сохранены числовые и строковые
CSS-размеры, zero/undefined и приоритет config/semantic/local styles. Внутренний
header padding рассчитывается по исходному правилу с округлением вверх;
fontHeight берётся из `Math.round(fontSize * lineHeight)`, а не из одноимённого
переопределённого alias. Checkbox, Input, Button и Pagination используют свои
компонентные темы. У внутренней пагинации восстановлен CSS scope, включая
стандартное оформление без source theme.

[UMD-эталон](../../../tests/browser/fixtures/ant-design-transfer-theme-reference.json)
содержит 17 тем / 136 наборов для восьми независимых scopes. Basic списки проверены
во всех scopes; oneWay, pagination, empty и custom lists — в normal/RTL/priority.
Сохранено прежнее native отличие: кнопка удаления наследует шрифт строки, тогда
как в исходном UMD остаётся браузерный размер `13.33px`. Исходный размер сохранён
в raw measurements; сравнение явно проверяет native inheritance по source item font.
Ещё одно прежнее отличие — обычный simple Empty без source `ant-empty-small`.
В эталоне оставлены стандартный source fallback и отдельный замер с явным
`locale.notFoundContent`, соответствующим native fallback. Последний применяется
только для сверки естественной высоты пустой секции с undefined metrics.
[Browser-проверки темы](../../../tests/browser/transfer-theme.spec.ts) также проверяют
draft/selection/focus, страницы, keyed rows и порядок move callbacks при обновлении.
В исходном UMD переход вложенного provider к `inherit:false` в конфигурации эталона
заменяет input и теряет query/focus; raw observation сохранено отдельно.
Native сохраняет поле и введённую строку. Для CSS-сверки эталон дополнительно
восстанавливает ту же строку и фокус через публичный Input.
Декларации сверяются с UMD отдельным
[unit-набором](../../../src/lib/theme-transfer-tokens-reference.test.ts),
[SSR](../../../tests/package/transfer-theme.ssr.test.ts) не создаёт браузерные ресурсы.

Проверки: [engine](../../../src/lib/transfer.engine.test.ts),
[SSR](../../../src/lib/transfer.ssr.test.ts),
[public package](../../../tests/package/transfer.ssr.test.ts),
[browser](../../../tests/browser/transfer.spec.ts) и `?fixture=transfer`.
Оформление: [54 исходных CSS rules](../../../src/lib/vendor/transfer.css),
[рецепт](../../../tools/ant-design-css-recipes.json); legacy defaults остаются в theme.css.
Числовая/simple пагинация сверена с @rc-component/pagination 1.4.0;
алгоритм страниц включён с [MIT-лицензией](../../../src/lib/vendor/LICENSE.rc-pagination).
Delete icon перенесён из @ant-design/icons-svg 4.6.0 под существующей
[MIT-лицензией](../../../src/lib/vendor/LICENSE.ant-design-icons).

## TreeSelect

TreeSelect переносит Ant Design 6.6.8 / rc-tree-select 1.16.1 поэтапно.
Панель использует существующий Tree; checkbox conduction считается по полному
дереву, а display values и фильтрованная панель вычисляются отдельно.
React-зависимости не устанавливаются. Лицензия сохранена в
vendor/LICENSE.rc-tree-select. Рецепт CSS извлекает 92 правила dropdown/checkbox/RTL;
внутренний prefix .ant-select-tree нормализован к общему .ant-tree. Selector
использует существующие стили Select и theme aliases.

```svelte
<script lang="ts">
  import { TreeSelect } from 'antd-svelte';
  const data = [{value:'docs',title:'Документы',children:[{value:'intro',title:'Введение'}]}];
  let value = $state<string[]>([]);
</script>
<TreeSelect treeData={data} {value} treeCheckable treeDefaultExpandAll
  showSearch={{treeNodeFilterProp:'title'}} onChange={next => { value = next; }} />
```

Узел содержит уникальный value (string/number), title/label, children,
disabled/disableCheckbox/checkable/selectable/isLeaf. Внутренняя идентичность —
value, как в upstream fieldNames; key можно не задавать. Значения должны быть
уникальны также после String(value). Title/label принимают string/number, boolean,
null, Snippet и вложенные массивы этих значений. Boolean/null не создают текст;
отсутствующий заголовок панели использует fallback Tree. TreeTitleRender принимает
snippet с исходным типом записи и задаёт заголовки панели и выбранных значений.

`fieldNames={{value:'code',label:'caption',children:'nodes'}}` подключает другую
схему без предварительного преобразования. Пустые имена возвращают стандартные
поля; без label используется первый определённый title/label, включая null.
Generic `TreeSelectProps<ValueType, Data>` выводит Data из treeData без index
signature. OnSelect/onDeselect и filterTreeNode получают shallow copy исходной
записи, treeTitleRender — исходную запись; вложенный payload сохраняет ссылки.
LoadData получает те же пользовательские поля с вычисленными key/state, как Tree.
Пользовательское поле props сохраняется; deprecated React wrapper не создаётся.

`TreeSelect.TreeNode` объявляет узлы через вложенный `children` snippet. Компонент
также доступен как `TreeSelectTreeNode`, тип его props — `TreeSelectTreeNodeProps`.
`TreeSelectNode` описывает запись данных. `treeData`, включая пустой массив,
имеет приоритет над объявлениями. Simple mode применяется к `treeData`.

```svelte
<TreeSelect defaultValue={0} treeDefaultExpandAll treeIcon>
  <TreeSelect.TreeNode value="docs" title="Документы">
    <TreeSelect.TreeNode value={0} title="Введение" icon="📄" />
  </TreeSelect.TreeNode>
</TreeSelect>
```

Объявления собираются до рендера поля. Скрытый контейнер и элементы `template`
позволяют получить выбранный label и раскрытые ветки при SSR, а также отслеживать
порядок keyed-списков, добавление и удаление узлов. Изменение объявлений сохраняет
DOM поля, фокус и связанные refs. Для пользовательского payload в декларативной
форме используются `TreeSelectProps<ValueType, Data>` и `TreeSelectTreeNodeProps<Data>`.

`icon` и `switcherIcon` узла принимают содержимое или
`Snippet<[TreeEventNode<Data>]>`. Состояние и пользовательские поля передаются
как в Tree. Switcher дополнительно получает вычисленный `isLeaf`. Собственный
switcher перекрывает общий renderer и загрузочный значок. `treeIcon` включает
ячейки значков, содержимое берётся из `icon` узла. Как в wrapper React 6.6.8,
функция в `treeIcon` используется как флаг.

`className` узла задаёт класс строки, локальный `class` имеет приоритет.
`style` принимает CSS-строку. Атрибуты `data-*` и `aria-*` применяются к строке,
включая её доступное имя. `styles.popup.item` перекрывает собственные стили узла.
Реактивный title snippet продолжает читать свой контекст и после передачи через
callback labels. В эталоне этому соответствует React-компонент с Context.
[Сверка узлов](../../../tests/browser/tree-select-nodes.spec.ts) охватывает объявления,
данные, aliases, renderers, порядок, загрузку и обновления.

`treeDataSimpleMode` строит дерево из плоского списка id/pId. Объект настраивает
имена id/pId и rootPId; по умолчанию rootPId=null оставляет все узлы без найденного
родителя корнями. Другое значение, включая 0, сравнивается строго. Порядок
определяется первым появлением id, повторный id заменяет запись. Как Source,
simple mode всегда создаёт canonical children независимо от fieldNames.children;
для такой иерархии имя children следует оставить стандартным. Исходные записи и
массивы children не меняются, readonly данные допустимы.

Value/defaultValue принимают scalar, массив или {value,label?,halfChecked?}.
Null очищает; undefined включает внутреннее состояние. Value/open/showSearch.searchValue —
controlled props с callbacks, без автоматического переписывания владельца.
При отказе владельца принять onSearch поле восстанавливается из searchValue.
`showAction={['focus']}` дополнительно открывает панель при фокусе, перед `onFocus`.
Пустой массив и `['click']` сохраняют обычное открытие указателем. Смена showAction
при уже установленном фокусе сама панель не открывает. `autoFocus` и `tabIndex`
задают autofocus/tabindex поля; явные native `autofocus` и `tabindex` приоритетнее.
Как в Source TreeSelect, `maxLength` не ограничивает поисковый ввод; native
`maxlength` задаёт ограничение браузера.

Повторное нажатие на readonly single control закрывает панель. Single с поиском
сохраняет её открытой; multiple закрывается при нажатии вне input, а нажатие
на сам input сохраняет панель. Prefix, suffix и выбранная подпись следуют тем же
правилам. Закрытие выполняется после click callbacks; очистка single закрывает
панель, multiple оставляет открытой. Касание использует события мыши браузера:
отменённое касание и свайп не переключают панель. При `showAction={['focus']}`
первое нажатие может сообщить об открытии дважды, как React: при фокусе и затем
при mousedown. [Сверка pointer API](../../../tests/browser/tree-select-pointer.spec.ts).

`onInputKeyDown` получает событие input. `onKeyDown`, `onKeyUp`, `onFocus`,
`onBlur`, `onMouseDown`, `onMouseEnter`, `onMouseLeave` и `onClick` относятся
к DOM-корню control. Нативные lowercase handlers сохраняют input currentTarget.
Сначала вызывается native onkeydown, затем onInputKeyDown, внутренняя обработка
и root onKeyDown. Как в Source, preventDefault в onInputKeyDown не отменяет выбор;
для отмены внутренней обработки используется native onkeydown. StopPropagation
в input hook останавливает root handler, но сохраняет открытие разрешённой клавишей.
Удерживаемый Enter выбирает один раз до keyup или blur. Закрытие клавиатурой
и нажатием снаружи откладывается, чтобы root key/blur callback получил событие первым.
Enter/Space кнопки очистки запускают её click и не передаются в root onKeyDown.
Focus hooks получают реальные focusin/focusout; popup portal имеет собственную
DOM-границу событий. SSR не запускает autofocus, callbacks или timers; гидратация
сохраняет фокус другого control. [Сверка trigger API](../../../tests/browser/tree-select-trigger.spec.ts).

Space открывает readonly-поле с одним onOpenChange(true). В raw наблюдении
React 6.6.8 один keydown вызывает два одинаковых callbacks до перерендера;
Svelte сохраняет прежнее идемпотентное открытие. Native Escape отменяет default
и всплытие; ArrowUp/Left/Right сохраняют открытие закрытого поля.
Enter игнорирует активный узел, удалённый из treeData; выбранные отсутствующие
значения по-прежнему можно удалить через теги.
Multiple включает массивы. TreeCheckable включает checkbox и multiple;
treeCheckStrictly также включает checkbox/multiple и принудительно labelInValue.
`treeCheckable` принимает `TreeSelectCheckableContent`: прежние boolean, текст,
числа, bigint, Snippet, вложенные массивы/iterable и Promise. Используется только
JavaScript truthiness: пустые массивы и iterable, любой Snippet и Promise включают
стандартные checkbox; false/null/undefined, пустая строка, ±0, NaN и 0n не включают.
Содержимое не выводится, snippet не вызывается, iterable не обходится и Promise
не ожидается. `classNames`/`styles` получают исходное значение и его reference,
включая отсутствие prop и явно переданное undefined. Типы отображаемых подписей
не расширяются. Явное `multiple=false` не выключает truthy `treeCheckable`;
исходное development-предупреждение Ant Design не воспроизводится.
При смене режима Native сохраняет прежние root/editor и публичные методы,
а также фокус; React Source при такой смене может пересоздать editor.
При `treeCheckStrictly` с falsy `treeCheckable` Native сохраняет прежний
внутренний элемент checkbox; в Source его нет.
Параметр типа TreeSelectProps<ValueType, Data> сохраняет конкретный тип callback value;
режим и переданный тип должны соответствовать друг другу, как в upstream.

OnChange(value,labels,extra) получает scalar либо массив; при labelInValue/strict
это объекты с value/label/halfChecked/disabled, а labels=null. При полной очистке
single возвращается undefined, multiple — []; labels=[] в raw mode. Extra включает
triggerValue; deprecated preValue/checked/selected удалены.
OnSelect/onDeselect(value,node) вызываются для конкретного узла; clear вызывает
onClear/onChange без onDeselect для каждого тега. Deprecated React getters
triggerNode/allCheckedNodes и wrappers node.props исключены из переноса.

В checkbox-режиме исходная conduction уважает disabled/disableCheckbox/checkable
границы. ShowCheckedStrategy по умолчанию SHOW_CHILD; отдельные экспорты
TREE_SELECT_SHOW_CHILD/SHOW_PARENT/SHOW_ALL соответствуют константам React TreeSelect.
Они также доступны как `TreeSelect.SHOW_CHILD`, `TreeSelect.SHOW_PARENT` и
`TreeSelect.SHOW_ALL`.
Стратегия влияет и на теги, и на onChange при conduction. Внутренние полные отметки
сохраняются отдельно: снятие потомка или удаление тега корректирует родителей.
Без treeCheckable стратегия равна SHOW_ALL, включая independent strict mode.
HalfChecked объекты в strict value не показываются отдельными тегами, но
сохраняются в callback до явной отметки этого значения.

Missing values не удаляются при смене treeData. Подпись отсутствующего узла
сохраняется из labeled value либо внутреннего labeled состояния; raw controlled
value без подписи отображается самим значением. Индивидуальный тег disabled узла
не удаляется, но clear очищает весь набор, как в upstream.

`maxCount` ограничивает multiple selection, включая checkbox/strict mode и missing
values. Начальный или controlled набор не обрезается. Ant wrapper отключает
ненулевой limit при явно заданном SHOW_PARENT и при SHOW_ALL без treeCheckStrictly,
включая plain multiple; без явной стратегии plain multiple сохраняет limit.
Нулевой maxCount остаётся активным, как в Source, и запрещает новые значения.
Ограничения панели вычисляются по полному дереву, отдельно от raw disabled/state
данных. Для SHOW_CHILD исходная оценка родителя учитывает его прямых доступных
детей; окончательный guard проверяет число display values после conduction.
Набор сверх ненулевого limit не публикуется: onSelect/onDeselect может сообщить
попытку без onChange, как в Source. Clear остаётся доступен для начального набора
сверх limit. Смена limit/data сохраняет query, caret, refs/focus/active IDs и FormData.

[33 UMD-сценария](../../../tests/browser/fixtures/ant-design-tree-select-max-count-reference.json)
проверяют правила wrapper/rc-tree-select и порядок callbacks в
[browser](../../../tests/browser/tree-select-max-count.spec.ts).
[35 DOM-free SSR renders](../../../tests/browser/fixtures/ant-design-tree-select-max-count-ssr-reference.json)
проверяются в [package SSR](../../../tests/package/tree-select-max-count.ssr.test.ts), без
callbacks, timers и обрезания начальных значений. Два дефекта Source записаны
отдельно: maxCount блокирует смену single value, а disabled cache родителя не
обновляется при новых детях с тем же remaining count. Native игнорирует limit в
single и пересчитывает ограничения при смене данных; public counterparts — single
без limit и свежее дерево с теми же финальными props.

`maxTagTextLength` сокращает только string/number labels multiple-тегов; полный
label остаётся в tooltip, callbacks и данных. Arrays/snippets остаются opaque.
`maxTagCount` ограничивает видимые теги, сохраняя все display values в FormData,
Backspace, clear и check strategies. Число использует исходный slice; NaN сохраняет
все теги, как Native Select. `maxTagCount="responsive"` использует общий измеритель
Select и учитывает input/rest/custom tags. Summary не резервирует место, когда
все теги помещаются. Скрытие focused remove передаёт focus input, сохраняя явный
внешний focus. SSR responsive-теги скрыты до измерения; hydration сохраняет DOM,
фокус и поля формы. Закрытый multiple очищает необработанный pre-hydration query,
как React-эталон; независимый внешний draft сохраняется.

`maxTagPlaceholder` принимает literal/array или snippet с omitted records
`{value,label,halfChecked?,disabled?}`. Labels не усечены, synthetic key не добавляется;
null/undefined выбирают `+ N ...`. `tagRender` принимает snippet с
`TreeSelectTagInfo`: label — bound snippet, value/index/disabled — данные тега,
closable и onClose(event?) — закрытие. Summary имеет isMaxTag=true и не имеет
value/index/onClose. Ant wrapper включает renderer через multiple/treeCheckable;
strict-only без этих flags сохраняет обычные теги. Custom mousedown переключает
popup, false откладывается MessageChannel до close/change callbacks; новый open
и unmount отменяют pending close. Пользовательский child может остановить mousedown.

[49 UMD-сценариев](../../../tests/browser/fixtures/ant-design-tree-select-tags-reference.json),
[55 DOM-free SSR renders](../../../tests/browser/fixtures/ant-design-tree-select-tags-ssr-reference.json),
[browser](../../../tests/browser/tree-select-tags.spec.ts),
[native lifecycle](../../../tests/browser/tree-select-tags-native.spec.ts),
[SSR](../../../tests/package/tree-select-tags.ssr.test.ts) и
[hydration](../../../tests/browser/tree-select-tags-hydration.spec.ts) проверяют tag API.
Source разрывает Unicode pair, скрывает весь список при NaN и резервирует oversized
summary даже для помещающихся тегов. Native сохраняет принятые Select исправления;
для последнего случая public counterpart меняет только неиспользуемый placeholder
при той же ширине 320px. Прежние Native tooltip для literal arrays и treeTitleRender
сохранены, в том числе accessible remove names после изменения выбора.

Для известного узла `treeTitleRender` задаёт label в `onChange` и в записях
`maxTagPlaceholder`, даже если `value` при labelInValue уже содержит label. Без labelInValue
snippets приходят в массиве labels; в labelInValue и strict-режиме они находятся
в записях значения, а второй аргумент `onChange` равен null. Для отсутствующего
узла сохраняется переданная или ранее полученная подпись. Поля value, halfChecked,
disabled и данные onSelect/onDeselect сохраняют свои значения.

Label связывает renderer и исходную запись. Его можно сохранить и затем вывести
через `{@render label()}` после проверки `typeof label === 'function'`, в том
числе после unmount TreeSelect. Содержимое использует контекст места рендера;
создание label не запускает его lifecycle. SSR включает `<head>` и IDs. Hydration
сохраняет DOM, фокус и черновики вложенных полей. Summary связывает labels внутри
своего рендера без вложенного mount или дополнительного DOM-элемента.

[28 браузерных сценариев и два наблюдения](../../../tests/browser/fixtures/ant-design-tree-select-labels-reference.json),
[30 DOM-free SSR renders](../../../tests/browser/fixtures/ant-design-tree-select-labels-ssr-reference.json),
[рендер возвращённых labels](../../../tests/browser/tree-select-labels.spec.ts),
[SSR](../../../tests/package/tree-select-labels.ssr.test.ts) и
[hydration](../../../tests/browser/tree-select-labels-hydration.spec.ts) проверяют этот API.
В Source замена или снятие renderer оставляет старый renderer в summary и следующем
onChange. Native обновляет новые labels сразу; сохранённые ранее snippets
остаются связанными с прежним renderer и записью.

`prefix` выводит содержимое перед полем. `suffixIcon` заменяет стандартный
значок, а `suffixIcon={null}` скрывает его. Стандартный значок учитывает загрузку
и открытую панель с явно включённым поиском. `suffix` имеет приоритет над
`suffixIcon`. Значения `null` и `undefined` возвращают выбор к `suffixIcon`.
`suffix` принимает содержимое или
`Snippet<[TreeSelectSuffixInfo]>` с `searchValue`, `open`, `focused`, `showSearch`
и `loading`. Последние два поля могут быть `undefined`, объект `showSearch`
даёт `true`. Для переданного snippet сохраняется обёртка, даже если он пуст.

`allowClear` принимает boolean или объект с `clearIcon` и `label`. `true` выводит
стандартный значок, объект без значка использует `×`. По умолчанию кнопка получает
локализованное имя. Очистка вызывает `onClear`, `onChange` и `onSearch('')`, если
в поле был поисковый запрос. Клик закрывает single popup, клавиатурная активация
кнопки сохраняет открытое состояние. `removeIcon` меняет содержимое кнопки
обычного тега, `null` использует `×`. `tagRender` задаёт своё содержимое целиком.

`popupRender` принимает `Snippet<[Snippet]>`. Чтобы оставить дерево или empty
state в пользовательской панели, вызовите `{@render menu()}` внутри snippet.
Вложенные поля можно фокусировать. Клик по фону сохраняет открытую панель и запрос.
Граница панели сбрасывает привязку и статус внешнего FormItem и контекст
Space.Compact. Содержимое монтируется при первом открытии и сохраняет состояние
между открытиями. Escape закрывает также панель с заменённым или пустым меню.
При исходном `open` или `defaultOpen` Svelte рендерит скрытую панель на сервере и
при hydration переносит тот же DOM в `getPopupContainer`.

Порядок слотов, приоритеты, callbacks и lifecycle сверены по 29 UMD-сценариям и
29 серверным рендерам. React 6.6.8 оставляет пустую панель открытой после Escape и
создаёт DOM открытой панели после запуска клиента. Отдельная иконка feedback
Form.Item остаётся частью переноса Form.
[UMD](../../../tests/browser/fixtures/ant-design-tree-select-surface-reference.json),
[Source SSR](../../../tests/browser/fixtures/ant-design-tree-select-surface-ssr-reference.json),
[browser](../../../tests/browser/tree-select-surface.spec.ts),
[SSR](../../../tests/package/tree-select-surface.ssr.test.ts),
[hydration](../../../tests/browser/tree-select-surface-hydration.spec.ts).

`classNames` и `styles` принимают объект слотов или функцию с
`TreeSelectSemanticInfo<ValueType, Data>`. В `info.props` передаются исходные
props и разрешённые `size`, `disabled`, `status` и `variant`. `open` отражает
значение владельца. Стили задаются CSS-строками. Слоты поля охватывают
`root`, `prefix`, `input`, `suffix`, `clear`, `content`, `placeholder`, `item`,
`itemContent` и `itemRemove`. Слоты тегов применяются к обычным тегам и счётчику
скрытых тегов. `tagRender` задаёт собственную разметку.

Строка `classNames.popup` задаёт класс `popup.root`. Классы `rootClassName`
и `classNames.root` применяются к полю и панели. `popup.item`, `popup.itemTitle`
и `popup.itemSwitcher` относятся к узлу дерева, заголовку и переключателю.
Панель получает `styles.root`, затем `styles.popup.root`. Числовой
`popupMatchSelectWidth` имеет приоритет над `width` в стилях. По умолчанию
панель берёт ширину поля. При `false` она подстраивается под содержимое с шириной
поля в качестве минимума. Локальный prop имеет приоритет над `ConfigProvider.popupMatchSelectWidth`.
Стили могут задавать границы ширины. Смена стилей открытой панели сохраняет DOM,
фокус и черновики вложенных полей.

`ConfigProvider.treeSelect` задаёт `variant`, `classNames`, `styles` и
`switcherIcon`. Вложенный объект заменяет ближайшую запись целиком, `{}`
сбрасывает её. Классы слотов объединяются с локальными. Локальная CSS-строка
в `styles.popup` заменяет одноимённый слот провайдера. Оформление из провайдера
задаётся через `classNames` и `styles`. Поля `class` и `style` записи принимаются
для совместимости с типом Ant Design 6.6.8.

`placeholder` принимает текст, число, массив или snippet. Текстовый placeholder
также доступен через нативный атрибут поля. Локальный `switcherIcon` имеет
приоритет над настройкой провайдера. `null` и `undefined` используют
провайдер, `false` оставляет пустой переключатель, `0` выводит число.
`treeLine.showLeafIcon` принимает boolean, содержимое или snippet с состоянием
узла. Во время загрузки ветки показывается индикатор загрузки. Классы внутри
snippet задаёт его владелец.

24 UMD-сценария и 24 серверных рендера фиксируют слоты, порядок стилей,
размеры панели, область конфигурации и переключатели узлов.
[UMD](../../../tests/browser/fixtures/ant-design-tree-select-semantic-reference.json),
[Source SSR](../../../tests/browser/fixtures/ant-design-tree-select-semantic-ssr-reference.json),
[browser](../../../tests/browser/tree-select-semantic.spec.ts),
[SSR](../../../tests/package/tree-select-semantic.ssr.test.ts).

ShowSearch по умолчанию false для single и true для multiple. Объект showSearch
поддерживает searchValue/onSearch, autoClearSearchValue, filterTreeNode и
treeNodeFilterProp. Одноимённые deprecated top-level props удалены.
Этот default multiple сохраняет существующий Svelte-контракт и соответствует
документации Ant Design. Raw React 6.6.8 при undefined оставляет multiple input
readonly; независимые наблюдения и counterpart с явным true записаны отдельно.
Default filter prop — буквальное value даже при fieldNames.value='code'; для другой
схемы задаётся treeNodeFilterProp. Поиск без учёта регистра сохраняет предков
совпадения и всех потомков совпавшего родителя. FilterTreeNode=false сохраняет
всё дерево; callback задаёт predicate. Отметка фильтрованного родителя всё равно
считается по полному дереву. AutoClearSearchValue=true очищает внутренний search
после выбора; controlled search очищает владелец. Само автоматическое очищение
не вызывает onSearch. Загрузка узлов во время поиска отключена.

`tokenSeparators` принимает массив разделителей или функцию, возвращающую массив
строк. Как в закреплённом TreeSelect, успешное разбиение очищает поиск и отложенно
закрывает панель, сохраняя выбранные значения без onChange/onSelect/onDeselect.
MaxCount не ограничивает обработку токенов. IME откладывает разбиение до окончания
композиции; переносы строк при вставке сохраняются для соответствующих разделителей
и функций. OnSearch вызывается при изменении запроса. Закрытие single также
очищает поиск; functional splitter получает пустую строку при mount и после
закрытия. При initial open=true выполняется тот же клиентский сброс поиска,
что и в React. SSR не вызывает splitter или callbacks.
Закрытое single поле сохраняет прежнее нативное представление выбранной подписи;
удержанный владельцем query возвращается при открытии. Raw React хранит query
в отдельном input рядом с выбранной подписью; это отличие представления сохранено
в эталоне и проверяется отдельно.
[Сверка token API](../../../tests/browser/tree-select-token.spec.ts).

LoadData(node), treeLoadedKeys/onTreeLoad и treeExpandedKeys/onTreeExpand
используют механизмы Tree; children добавляет потребитель. TreeDefaultExpandAll
и treeDefaultExpandedKeys задают начальное раскрытие. В TreeSelect раскрытие
панели хранится снаружи Tree: после load rejection раскрытая ветка может повторять
загрузку до исходного лимита Tree. Отдельного error callback/слота нет. Закрытый
popup не начинает новых загрузок; уже начатый Promise может завершиться и вызвать
onTreeLoad. После unmount результаты игнорируются.

`treeExpandAction=false | 'click' | 'doubleClick'` включает раскрытие заголовком
через существующий Tree; default=false. В click-режиме onTreeExpand вызывается
перед onChange/onSelect. В multiple настоящий double click сначала выполняет два
обычных выбора, затем dblclick раскрывает ветку. Ctrl/Meta/Shift подавляют раскрытие
заголовком; выбор остаётся самостоятельным действием. Узел с явным isLeaf=true не раскрывается,
disabled узел может раскрываться заголовком, но не выбирается, как в Source.
Switcher, checkbox и keyboard сохраняют свои действия. Controlled expanded keys
принимает владелец; смена action сохраняет DOM, refs, input focus и active IDs.
[28 UMD-сценариев](../../../tests/browser/fixtures/ant-design-tree-select-expand-action-reference.json)
сверяют видимое дерево и порядок callbacks в
[browser](../../../tests/browser/tree-select-expand-action.spec.ts).
Отдельное raw наблюдение фиксирует два вызова loadData для одного pending узла
в React. Native сохраняет существующую защиту Tree: один Promise на узел и
отсутствие callbacks после unmount. [SSR](../../../tests/package/tree-select-expand-action.ssr.test.ts)
не вызывает загрузку и не создаёт timers, включая первоначально открытый shell.

Native combobox удерживает фокус при действиях в панели. Arrows перемещаются/
раскрывают дерево через его keyboard engine; Enter выбирает активный узел, а не
переключает раскрытие. Escape/Tab закрывают popup; Backspace удаляет последний
доступный тег при пустом search. Single закрывает popup после выбора, multiple
оставляет его открытым. `listHeight` ограничивает viewport дерева, по умолчанию
до 256px. `onPopupScroll` получает событие этого viewport. `virtual` наследуется
из `ConfigProvider.virtual` и по умолчанию включён. `popupMatchSelectWidth={false}`
оставляет все строки в DOM. `listItemHeight` задаёт начальную оценку, по умолчанию
`controlHeightSM + paddingXXS`. Нулевая оценка отключает виртуализацию, а `listHeight={0}`
снимает ограничение высоты. `listItemScrollOffset` добавляет отступ при переходе к
активному узлу. Прокрутка сохраняет активный ключ, а `aria-activedescendant`
указывает на узел, пока его строка в DOM.
Движение мыши по строке сбрасывает активный клавиатурный узел, как в `rc-tree`.

`bind:nativeElement` и `bind:inputElement` дают DOM. `bind:this` предоставляет
`TreeSelectRef` с `focus(options)`, `blur()` и `scrollTo(config)`. `TreeScrollConfig`
принимает пиксели, координаты, key или index с `align` и `offset`. Для открытой
пустой панели и отсутствующего ключа вызов безопасен. В закрытой панели
прокрутка сохраняет прежнюю позицию. `autoExpand` добавляет
целевой ключ в собственное раскрытие внутреннего дерева до первой пользовательской
смены `expandedKeys`, если ключи раскрытия не заданы в props.
[Сверка React 6.6.8](../../../tests/browser/tree-select-virtual.spec.ts) охватывает
границы окна, ширину, измерения строк, прокрутку, поиск и повторное открытие.

Унаследованный `showScrollBar` принимает true, false и 'optional', но не меняет
прокрутку TreeSelect: закреплённый rc-tree-select не передаёт его внутреннему Tree.
Полоса по-прежнему появляется при взаимодействии и скрывается после простоя;
при отсутствии переполнения или virtual=false её нет.
[Сверка с React и контрольным Select](../../../tests/browser/tree-scrollbar.spec.ts).

Поддержаны placement, size/status/variant, treeLine/treeIcon/switcherIcon,
notFoundContent/loading, RTL, темы, Compact и ConfigProvider/Form disabled.

Name/FormItem создают hidden inputs с raw values для native FormData. Form model
хранит raw scalar/массивы, поддерживает required/submit/reset; библиотека не меняет
объектный контракт labelInValue ради ограничений Form v1. Его общий object store
остаётся отдельным этапом. SSR не запускает loadData, popover или browser APIs.

Source theme объединяет `components.Select` и `components.TreeSelect` в исходном
порядке: aliases TreeSelect могут менять также поле. Select оформляет теги,
стрелку/clear и focus, TreeSelect — размеры/отступы узлов, цвета и checkbox панели.
Настройки `components.Tree` не меняют дерево внутри TreeSelect. Токены доступны
при SSR; смена темы сохраняет DOM, поиск, выделение, focus, raw FormData и позицию
открытой панели. В source compact высота узла — 21px. Native-only темы сохранены.

GetPopupContainer получает фактический корень: стандартный `.ant-select` либо
зарегистрированный `components.root`. Локальная функция перекрывает
ConfigProvider.getPopupContainer, undefined наследует provider. Getter не вызывается
на сервере и до первого открытия. Перенос в HTMLElement/ShadowRoot сохраняет
Select/TreeSelect tokens, поиск, keyboard engine, lazy load и native FormData.
Зазор до поля — исходные 4 px. При замене функции с тем же контейнером сохраняются
DOM панели, фокус и выделение; ShadowRoot требует собственных стилей. Сверка
TreeSelect/Cascader с 40 сценариями официального UMD —
[choice-container](../../../tests/browser/choice-container.spec.ts), `?fixture=choice-container`.

`components.input` заменяет редактор внутри стандартного selector. Выбранная
подпись, теги, prefix/suffix, очистка и Form feedback сохраняются. React component,
tag и element из `components` переносятся в Svelte snippet; объект
`{render, props}` дополнительно задаёт собственные DOM attrs. Они перекрывают
generated attrs, включая value, class/style, readonly, disabled и ARIA.
Собственный callback input вызывается первым, внутренний — следом, даже после
preventDefault. Нативный `onkeydown` самого TreeSelect сохраняет отмену built-in.

```svelte
<script lang="ts">
  import { TreeSelect, type TreeSelectInputContext } from 'antd-svelte';
  let editor = $state<HTMLInputElement | HTMLTextAreaElement>();
</script>

{#snippet query({ attributes, register }: TreeSelectInputContext<HTMLTextAreaElement>)}
  <textarea {...attributes} {@attach register}></textarea>
{/snippet}
<TreeSelect treeData={[{ value: 'a', title: 'Alpha' }]} showSearch
  components={{ input: { render: query, props: { rows: 2 } } }} bind:inputElement={editor} />
```

Direct textarea сохраняет навигацию стрелками при закрытой панели. Composite ref
следует своему исходному keyboard path. Multiple editor измеряет текст и меняет
ширину; собственный style заменяет generated style целиком. Responsive tags
учитывают весь custom editor, включая wrapper и соседние элементы snippet,
и реагируют на изменение его ширины. При закрытии multiple
query скрывается, если autoClearSearchValue не false; controlled owner сохраняет
свой query. `props.value=undefined` оставляет редактор uncontrolled, фиксированное
значение перекрывает поиск. При гидратации контролируемое значение custom editor
применяется к существующему DOM, как в React; фокус и refs сохраняются.

`components.root` полностью заменяет selector: стандартные подписи, теги,
редактор, affixes и очистка не создаются; `components.input` при этом не вызывается.
Root переключает popup по click, не по selector mousedown. Его generated callbacks
выполняются перед собственными. Generated id, class/style, tabIndex, disabled и
combobox ARIA ему не назначаются; содержимое и DOM attrs задаёт renderer.
Disabled TreeSelect управляет popup, собственный DOM disabled задаётся через props.

```svelte
<script lang="ts">
  import { TreeSelect, type TreeSelectRootContext } from 'antd-svelte';
</script>

{#snippet response({ attributes, register }: TreeSelectRootContext<HTMLButtonElement>)}
  <button {...attributes} {@attach register}>Выбрать узел</button>
{/snippet}
<TreeSelect treeData={[{ value: 'a', title: 'Alpha' }]}
  components={{ root: { render: response, props: { type: 'button', class: 'my-trigger' } } }} />
```

`register(node)` возвращает cleanup для attachment. Composite root регистрирует
`{nativeElement, focus?, blur?}`, composite input —
`{inputElement, nativeElement?, focus?, blur?}`. Native element у input может быть
wrapper; inputElement указывает на редактор. Регистрация заменяется безопасно,
старый cleanup не очищает новый ref. `focus/blur` используют composite методы;
popup привязан к фактическому root. Для composite Svelte-компонента attrs
согласуются с его публичными props, например class/style у Input относятся к root.
Если composite root использует Input со своим текстом, храните его в состоянии
адаптера и передавайте через `bind:value`. Это сохраняет черновик при обновлении
динамического spread attrs; выбранное значение TreeSelect остаётся отдельным.

Обычные bindings остаются HTMLDivElement/HTMLInputElement. Дополнительные параметры
`TreeSelectProps<ValueType, Data, RootElement, EditorElement>` описывают custom DOM.
Bindings используют RootElement | HTMLDivElement и EditorElement | HTMLInputElement:
удаление slot возвращает стандартный элемент. Custom root не создаёт внутренний
inputElement. Renderers наследуют Form status/feedback, не регистрируя второй
successful control; required/help ARIA передаются и в custom root.
Native FormData продолжает хранить raw выбранные значения. Native Input
отражает error status в aria-invalid; Form сохраняет синхронный SSR help
и существующие ids вида `choice-help` вместо Source `choice_help`.

Native input связывается с существующим Tree и его ARIA ids. Focus/blur/input
остаются настоящими DOM events: preventDefault не меняет defaultPrevented у
noncancelable event, в отличие от React SyntheticEvent. Удаление opaque composite
root может доставить blur до отсоединения DOM, тогда как React уже снял synthetic
callbacks. Raw наблюдения сохранены отдельно; после unmount callbacks не приходят.
Удаление сфокусированного редактора может синхронно доставить Native blur до
отключения DOM; после завершения unmount новых callbacks нет.
Native регистрация actual editor также сохраняет безопасное измерение composite
input: Source multiple ref без `.style` выбрасывает TypeError.
В multiple mode с `components.input` и `maxTagCount="responsive"` suffix следует
Source Overflow: может стать absolute и сжаться вокруг fragment, сохраняя
исходные высоту control, overflow, hit targets и порядок тегов. Popup сохраняет
исходный anchor до изменения размера, resize окна или scroll предка; перемещение
его контейнера учитывается в той же системе координат, включая RTL.
[15 сценариев layout](../../../tests/browser/tree-select-suffix-layout.spec.ts) и
[4 сценария контейнера](../../../tests/browser/tree-select-suffix-container.spec.ts)
сверены с независимым React-эталоном в standards mode. Ещё
[5 регрессий](../../../tests/browser/tree-select-suffix-layout-edges.spec.ts) проверяют
static renderers, историю summary и контейнер с `will-change: transform`.
Обычный Native responsive
control сохраняет прежний flow алгоритм. SSR сохраняет скрытые measuring tags
вместо пустого Source Overflow; Native popup сохраняет свой fixed portal contract.
[Строгая гидратация](../../../tests/browser/tree-select-suffix-layout-hydration.spec.ts)
проверяет query, выделение, DOM identity и освобождение observers/RAF.
[Root](../../../tests/browser/tree-select-root.spec.ts),
[input](../../../tests/browser/tree-select-input.spec.ts),
[Form](../../../tests/browser/tree-select-components-form.spec.ts).

Унаследованные `onPopupVisibleChange`, `popupStyle`, `choiceTransitionName` и
`direction` принимаются с поведением Ant Design 6.6.8: wrapper перекрывает
callback/style, текущий Overflow не использует choice transition, RTL и default placement
задаёт ConfigProvider. Для открытий используется `onOpenChange`, для оформления —
`styles.popup.root`. Исходные значения и наличие этих props остаются видимы
в `classNames`/`styles` callbacks, включая live replacement, empty и undefined.
При SSR custom root semantic callbacks также вычисляются; собственные attrs
и стили root сохраняются.
HTML `dir` сохраняет Native контракт: provider задаёт dir стандартному root,
явный native dir передаётся редактору; собственный dir custom slots сохраняется.
[Browser](../../../tests/browser/tree-select-inert-api.spec.ts) и
[SSR](../../../tests/package/tree-select-inert-api.ssr.test.ts) сравнивают независимый
React-эталон и явно учитывают прежнее различие владельца HTML dir.
[Строгая гидратация](../../../tests/browser/tree-select-inert-api-hydration.spec.ts)
сохраняет редактор, query/caret, popup и публичные refs при смене props.

`popupAlign` задаёт shallow override выбранного placement: `offset`, `targetOffset`
и `overflow` заменяются целиком. `builtinPlacements` заменяет всю стандартную карту,
включая явно пустой объект; отсутствующая запись использует исходное центрирование.
Тип `TreeSelectPopupAlign` принимает points, числовые и процентные offsets,
overflow flags, `dynamicInset` и `htmlRegion`. Процентный offset считается от popup,
targetOffset — от control. Четыре текущих `useCssRight`/`useCssBottom`/
`useCssTransform`/`ignoreShake` принимаются с исходным no-op поведением.

Открытый popup сохраняет вычисленное выравнивание до изменения placement,
размера control/popup, resize окна или scroll предка. Смена карты сама по себе
не пересчитывает координаты; изменение `popupAlign` вызывает пересчёт сразу,
только если выбранной записи в карте нет. Это относится и к первому добавлению
props при открытой панели. Flip history сохраняется при замене custom root
и сбрасывается при закрытии. Semantic callbacks получают исходные объекты props.

При использовании alignment props Native popup сохраняет fixed top-layer и
собственный DOM parent; Source absolute CSS frame проецируется в его физические
координаты с учётом border, margin, scale, transforms и ShadowRoot. Смена CSS frame
контейнера учитывается отдельно от пересчёта alignment. Обычный multiple control
сохраняет прежний Native flow редактора и тегов; отдельный запуск настоящего Source
с той же публично заданной высотой control проверяет связанное выравнивание popup.
Публичные Native методы ref сохраняют identity при обновлении props, хотя Source
пересоздаёт их; root и popup сравниваются по фактическим DOM refs.
`htmlRegion` можно задать локально. `ConfigProvider.popupOverflow` выбирает область
стандартной карты; собственная `builtinPlacements`, включая `{}`, её заменяет,
а локальный `popupAlign.htmlRegion` имеет приоритет.
[35 browser-сценариев](../../../tests/browser/tree-select-align.spec.ts),
[два изменения CSS frame/root](../../../tests/browser/tree-select-align-frame.spec.ts),
[DOM-free SSR](../../../tests/package/tree-select-align.ssr.test.ts) и
[строгая гидратация](../../../tests/browser/tree-select-align-hydration.spec.ts)
проверяют независимый React-эталон, geometry, query/caret, refs и cleanup.

`animation` и `transitionName` управляют исходными переходами панели.
Непустой `animation` выбирает `${prefixCls}-dropdown-${animation}` и имеет
приоритет над `transitionName`. При `transitionName=undefined` используется
`${ConfigProvider.prefixCls}-slide-up`; пустая строка отключает именованный переход.
Локальный namespace dropdown и общий namespace motion независимы.
Для своего имени потребитель задаёт CSS. Рецепт `tree-select-popup-motion`
переносит 110 правил и восемь keyframes slide/move из закреплённого архива.
Они ограничены popup TreeSelect и не меняют соседние Select.
Canonical CSS входит в `styles.css`, а `tree-select-popup-motion-prefix`
создаёт template пользовательских namespaces без новых canonical SSR head scopes.

Панель проходит appear/enter/leave с prepare, start и active, сохраняя DOM
после ухода. Повторное открытие прерывает leave без потери draft и refs.
События animationend/transitionend завершают только собственную активную фазу;
имя эффекта не фильтруется, события дочерних элементов игнорируются.
CSSMotion сохраняет отрисованный active frame до готовности следующего шага,
даже если внутренний статус уже завершён. Alignment cache пересчитывается
в prepare и после motion; scroll/resize во время перехода не запускают обычное
выравнивание. Замена custom root сохраняет popup, CSS clock и прежние координаты
до следующего исходного alignment trigger.

Глобальный `theme.token.motion=false` при открытии оставляет только prepare.
Живая смена имени или общего motion не завершает уже начатую фазу.
Component token `motion=false` обнуляет CSS duration, сохраняя исходные шаги
и обработку end. Отдельного JS deadline или завершения по reduced motion нет:
имя без соответствующего CSS может оставаться active до собственного end event.

Native сохраняет fixed top-layer. CSS animations используют реальные браузерные
clocks; для проецируемых transform transitions доступен настоящий WAAPI Animation,
а не Source CSSTransition. В этом случае завершение фазы передаётся контроллеру
без искусственного DOM transitionend. Без использования alignment props и
`ConfigProvider.popupOverflow` сохраняются
прежние Native ограничения ширины и положения панели по viewport; явные
`popupAlign`/`builtinPlacements` или `popupOverflow` включают исходные overflow rules.
Закрытый скрытый popup освобождает position RAF без ожидания отменённого CSS end
и остаётся закрытым при возвращении control в viewport.
Существующие Svelte refs и opaque snippet
остаются живыми: отключение общего motion не пересоздаёт редактор, а закрытая
пользовательская панель получает реактивные изменения вместо React.memo cache.
Эти границы проверяются отдельными запусками Source с публичными настройками;
первичные raw snapshots сохраняются без исправлений.
[Browser](../../../tests/browser/tree-select-motion.spec.ts),
[замена root](../../../tests/browser/tree-select-motion-root-swap.spec.ts),
[завершение leave до activated](../../../tests/browser/tree-select-motion-leave.spec.ts),
[скрытие и повторное открытие](../../../tests/browser/tree-select-motion-visibility.spec.ts),
[DOM-free SSR](../../../tests/package/tree-select-motion.ssr.test.ts) и
[строгая гидратация](../../../tests/browser/tree-select-motion-hydration.spec.ts)
проверяют независимый React-эталон, фазы, geometry, callbacks, identity и cleanup.
Ant Design исключает `treeMotion` из публичного TreeSelect API и передаёт
`null` во вложенное дерево. List/collapse motion панели отключён, как в Source.
Private getInputElement/getRawInputElement не входят в публичный перенос.
Deprecated React extras исключены.
Класс popup задаётся через classNames.popup.root; popupClassName удалён.

`prefixCls` задаёт локальные классы Select control, tags и TreeSelect popup;
пустое значение наследует `ConfigProvider.prefixCls`. Служебные Select variables
следуют общему namespace, canonical token names сохраняются. Общий Native Tree
адаптер с внутренними `ant-tree` classes и generated IDs остаётся прежним.
Смена префикса сохраняет поиск, выделение, refs/focus, значения формы и открытое дерево.
[26 UMD-конфигураций](../../../tests/browser/fixtures/ant-design-tree-select-prefix-reference.json)
в обычной, вложенной и reset областях проверяются в
[browser](../../../tests/browser/tree-select-prefix.spec.ts) и
[SSR](../../../tests/package/tree-select-prefix.ssr.test.ts).

У Ant Design 6.6.8 локальный prefixCls выявил несогласованность style hook и
вложенного дерева: при `prefixCls="choices"` стили адресуют `choices`, а rc-tree-select
создаёт `choices-tree`. В записанном случае пять строк занимают 110px вместо 140px
и теряют фон. Raw measurements сохранены отдельно от public counterpart без
локального override при том же ConfigProvider. Только tree/nodes сравниваются
с этим counterpart; control/popup остаются raw. Его классы отличаются, поэтому
сверка подтверждает оформление, а не одинаковую разметку. Svelte сохраняет
согласованный Native Tree adapter и оформление при локальном префиксе.

[32 сценария данных](../../../tests/browser/fixtures/ant-design-tree-select-data-reference.json)
сверены с неизменённым официальным UMD: aliases, simple topology, search/check
strategies, literal labels и обновления data/schema/mode. Независимый
[SSR-эталон](../../../tests/browser/fixtures/ant-design-tree-select-data-ssr-reference.json)
получен без DOM и timers; [browser](../../../tests/browser/tree-select-data.spec.ts),
[native lifecycle](../../../tests/browser/tree-select-data-native.spec.ts) и
[SSR](../../../tests/package/tree-select-data.ssr.test.ts) проверяют соответствующие границы.
Два дефекта Source записаны отдельно: simple mode дописывает детей во входной
children array, а raw renderer сначала получает labeled value вместо data node.
Native сохраняет входной массив и передаёт renderer полную запись с payload.

## Upload / UploadDragger

Upload переносит Ant Design 6.6.8 и AjaxUploader/request из @rc-component/upload
1.1.1. UploadDragger соответствует Upload.Dragger; UPLOAD_LIST_IGNORE — отдельный
экспорт аналога Upload.LIST_IGNORE. React и rc-upload runtime не устанавливаются.
Лицензия rc-upload сохранена в vendor/LICENSE.rc-upload; CSS-рецепт извлекает
91 правило и четыре keyframes из закреплённого antd.css; неиспользуемые collapse
selectors исключены.
Отдельный рецепт `upload-link-reset` добавляет 14 исходных общих правил ссылок
внутри Upload; цвета error rows сохраняют приоритет.
Иконки взяты из закреплённого @ant-design/icons-svg 4.6.0 с существующей лицензией.

`prefixCls` задаёт namespace Upload/Dragger, списка и всех состояний; пустая строка
наследует ConfigProvider.prefixCls. Canonical variables и link reset сохранены,
Button/Progress/Tooltip используют свои namespaces. CSS-рецепт upload-prefix
воспроизводит те же 91 правило и keyframes в изолированном шаблоне.
[Сверка с официальным UMD](../../../tests/browser/fixtures/ant-design-upload-prefix-reference.json)
покрывает все list types, drag, RTL, states и вложенные/reset scopes. Смена prefix
сохраняет wrapper/input/filename DOM, refs, фокус и выполняющийся запрос; completion
и remove публикуют прежние callbacks. Consumer slot classes автоматически не переименовываются.

```svelte
<script lang="ts">
  import { Upload, Button, UPLOAD_LIST_IGNORE, type UploadFile } from 'antd-svelte';
  let files = $state.raw<UploadFile[]>([]);
</script>
<Upload fileList={files} multiple action="/api/upload" name="attachment"
  beforeUpload={file => file.size > 10_000_000 ? UPLOAD_LIST_IGNORE : true}
  onChange={info => { files = info.fileList; }}>
  <Button>Выбрать файлы</Button>
</Upload>
```

FileList — controlled prop с onChange; defaultFileList задаёт внутренний список.
Элемент UploadFile имеет стабильный uid, name, optional status/percent/url/thumbUrl,
originFileObj/response/error/xhr. Статусы — uploading/done/error/removed. API типов
параметризован типом ответа: UploadProps<T>, UploadFile<T>, UploadRequestOptions<T>.
Необязательные fileName и preview сохраняют metadata API upstream: подпись строки
использует name, изображение — thumbUrl/url. Эти поля не меняют отображение сами по себе.

`bind:this` предоставляет UploadRef<T>, одинаковый для Upload и Dragger:
onBatchStart/onProgress/onSuccess/onError, актуальный fileList и upload.abort.
`onBatchStart` принимает уже подготовленный batch, публикует onChange для каждого
принятого файла и не запускает beforeUpload или транспорт. parsedFile=null
сохраняет ручной файл без статуса uploading. Callback неизвестного или удалённого
uid не меняет список; controlled fileList по-прежнему принимает владелец.
`onSuccess` разбирает JSON-строку ответа, сохраняя обычный текст при ошибке разбора.
Imperative callbacks меняют список независимо от завершения транспорта, поэтому
после прямого onSuccess активный запрос по-прежнему можно отменить.

Прямой abort и bind:nativeElement/bind:inputElement сохранены. Эти DOM refs также
доступны через bind:this и очищаются при unmount; сохранённые callbacks после
unmount не публикуют изменения. Вложенный upload предоставляет abort; базовые
методы React.Component и saveUploader относятся к привязке React renderer.
[18 raw случаев](../../../tests/browser/fixtures/ant-design-upload-ref-reference.json),
[два transport-сценария](../../../tests/browser/fixtures/ant-design-upload-ref-transport-reference.json),
[browser](../../../tests/browser/upload-ref.spec.ts),
[SSR](../../../tests/package/upload-ref.ssr.test.ts) и
[controller](../../../src/lib/upload-controller.engine.test.ts) защищают lifecycle API.

Если первый onChange синхронно размонтирует компонент, оставшийся batch
останавливается до следующих callbacks, изменений статуса и отправки запросов.
В Ant Design 6.6.8 цикл onBatchStart вызывает второй callback уже после unmount;
[raw observation](../../../tests/browser/fixtures/ant-design-upload-batch-disposal-observation.json)
сохраняет это поведение отдельно. Native прекращает цикл и сохраняет прежний
cleanup contract; browser-регрессия проверяет и ref batch, и выбор нескольких файлов.

Передавайте uid для каждого элемента списка. Callback onChange({file,fileList,event?})
предлагает полный новый список; владелец может отклонить изменение. Progress/success/error
файла, уже исключённого владельцем из списка, не вызывают onChange.

BeforeUpload(file,batch) может быть асинхронным. Возврат false или rejected promise
останавливает отправку, но сохраняет файл без uploading-статуса. UPLOAD_LIST_IGNORE
исключает его и из списка. Blob/File заменяет отправляемое содержимое с исходным
uid; action/data получают исходный файл. Batch стартует после обработки всех
beforeUpload/action/data. Для совместимости с upstream onChange.file при false —
нативный File с uid, а элемент fileList содержит originFileObj; тип callback отражает
это различие. MaxCount=1 сохраняет последний файл; большее значение — первые N.
MaxCount ограничивает список и callbacks, но сам по себе не отменяет запросы.

Стандартный транспорт использует XHR и multipart FormData: name='file', method='post',
action='' по умолчанию; data может быть объектом или async callback, массивы
добавляются как key[]. Поддержаны headers/withCredentials и async action. Заголовок
X-Requested-With=XMLHttpRequest можно отключить значением null. 2xx означает успех,
JSON-ответ разбирается; HTTP/network errors передаются в состояние файла.
CustomRequest(options,{defaultRequest}) получает file/action/data/name как filename,
method/headers/withCredentials и onProgress/onSuccess/onError. Он может вызвать
предоставленный defaultRequest и вернуть {abort()}. Bind:this.abort(file|uid) либо
abort() отменяет активные запросы; unmount отменяет их автоматически.

Ручной запуск устроен как в upstream: beforeUpload={() => false}, контролируемый
список и отдельная кнопка потребителя, которая отправляет originFileObj через
свой транспорт и обновляет fileList. Компонент не добавляет прикладных endpoints,
очередей или нового метода submit. Галерея показывает локальную демонстрацию
такого сценария без сетевой отправки файлов.

OnRemove может вернуть false/Promise<false> для запрета удаления; после разрешения
запрос отменяется, onChange получает status='removed'. Preview/download доступны
через onPreview/onDownload; без callbacks ссылки открывают url. Disabled скрывает
remove по умолчанию и блокирует его даже при showRemoveIcon=true; preview/download
остаются доступны как в upstream. ShowUploadList принимает false или объект
showRemoveIcon/showDownloadIcon/showPreviewIcon (boolean либо predicate), extra —
Snippet<[UploadFile]>. ListType: text, picture, picture-card, picture-circle;
previewFile/isImageUrl настраивают thumbnail. По умолчанию thumbnails повторяют
исходный 200px canvas preview, включая GIF/SVG. Progress появляется через 300 ms.

Непустой `thumbUrl` имеет приоритет над `url`. Пустой `thumbUrl` сохраняет
изображение и preview по `url`, но не запускает `previewFile`: генерация нужна
только при `thumbUrl === undefined` и наличии `originFileObj`.
Изменение состояния, прочитанного внутри `previewFile`, само по себе не запускает
генерацию повторно. Замена файла или обработчика сохраняет обычный пересчёт
миниатюры; результат устаревшего Promise не заменяет актуальную миниатюру.
[Raw-замеры](../../../tests/browser/fixtures/ant-design-upload-thumbnail-fallback-reference.json),
[browser](../../../tests/browser/upload-thumbnail-fallback.spec.ts) и
[SSR](../../../tests/package/upload-thumbnail-fallback.ssr.test.ts) проверяют picture/card/circle,
пустые URL, не-изображения и обновления без потери строки, input и внешнего фокуса.

Начальный список появляется без анимации. Новые строки text/picture раскрываются
по высоте и opacity; card/circle используют исходные keyframes размера, margin
и opacity. При удалении строка сохраняется до собственного CSS end event или
deadline 2000 ms; возврат того же uid отменяет уход и сохраняет DOM. Callbacks,
fileList и отмена транспорта не задерживаются до конца оформления.
`theme.token.motion=false` и reduced motion завершают переход сразу.
[Raw-замеры](../../../tests/browser/fixtures/ant-design-upload-motion-reference.json),
[browser](../../../tests/browser/upload-motion.spec.ts) и
[SSR](../../../tests/package/upload-motion.ssr.test.ts) охватывают четыре list types,
prefixCls, RTL, duration tokens, возврат строки и cleanup.

Progress появляется через 300 ms и сохраняет wrapper/полосу до конца исходного
fade при завершении загрузки. Возврат в uploading отменяет уход без замены DOM;
motion=false, reduced motion и unmount очищают переход и его deadline.
Проверка `'percent' in file` повторяет upstream: явный `percent: undefined`
показывает нулевую полосу, отсутствие поля оставляет только пустой fade wrapper.
Fade использует общий `ConfigProvider.prefixCls`, независимо от локального
Upload prefixCls; duration наследует глобальные и компонентные aliases.
[Raw-замеры](../../../tests/browser/fixtures/ant-design-upload-progress-motion-reference.json),
[browser](../../../tests/browser/upload-progress-motion.spec.ts) и
[SSR](../../../tests/package/upload-progress-motion.ssr.test.ts) защищают эти границы.
Во всех raw samples имя полосы задано явно; прежний Native fallback имени сохранён.

Upload хранит один native file input во всех list types. При пустом children
карточка select остаётся скрытой, сохраняя input и его выбранные файлы; id у
скрытого/disabled input удаляется. Dragger не добавляет второй select в card/circle.
Card/circle trigger пропускает начальный appear, сохраняет input при hide/return
и использует исходные leave/enter keyframes. Во время перехода pointer-events:none
идёт до пользовательского style; явный pointer-events/display сохраняет приоритет.
[16 raw случаев структуры](../../../tests/browser/fixtures/ant-design-upload-trigger-structure-reference.json)
и [шесть motion-сценариев](../../../tests/browser/fixtures/ant-design-upload-trigger-motion-reference.json),
[browser](../../../tests/browser/upload-trigger.spec.ts) и
[SSR](../../../tests/package/upload-trigger.ssr.test.ts) проверяют controls, identity и cleanup.

В `diffKeys` @rc-component/motion 1.3.3 перестановка `[a, __proto__]` в
`[__proto__, a]` возвращает дубликаты ключа; то же происходит с `constructor`.
[Исходные результаты](../../../tools/fixtures/ant-design-upload-motion-keys-reference.json)
сохранены без исправлений. Svelte использует `Map` и сохраняет одну строку на uid.
Лицензия зависимости уже включена в [vendor/LICENSE.rc-motion](../../../src/lib/vendor/LICENSE.rc-motion).

UploadDragger принимает height и по умолчанию hasControlInside=false: его trigger
имеет role=button и открывает chooser клавиатурой. Обычный Upload по умолчанию
ожидает native control внутри children snippet; локальный disabled нужно передавать
и этому control. Form.disabled и ConfigProvider.componentDisabled наследуются компонентом;
явный disabled перекрывает контекст.
OpenFileDialogOnClick=false оставляет drop без открытия chooser. Multiple/accept/capture
передаются скрытому native input; native выбор обычно фильтрует сам браузер, drop
использует accept. Поддержан accept={format,filter:'native'|predicate}. В rc-upload
1.1.1 single drop выбирает первый исходный файл, не применяя accept-фильтр;
это поведение сохранено. Input сбрасывается после выбора для повторного файла.
Id удаляется при disabled/отсутствии children, чтобы label не открывал диалог.
Bind:nativeElement/inputElement дают DOM-элементы, без запуска транспорта при SSR.

`ConfigProvider.theme.components.Upload` применяет actionsColor/pictureCardSize,
aliases и algorithms к wrapper, списку и Dragger. ActionsColor задаёт цвет обычных
действий; в карточках сохраняются исходные белые иконки поверх затемнения.
Button, Progress и Tooltip получают свои component tokens. Style остаётся на
области выбора/drop; локальные CSS variables, включая другой cssVar.prefix,
перекрывают вычисленную тему именно на этой области.

Обновления темы сохраняют controller, запросы, fileList, native input и фокус.
Канонические классы иконок подключают исходные размеры/цвета действий;
обёртка Tooltip ошибки сохраняет полную высоту карточки. 16 тем официального UMD
и состояния списка — [upload-theme](../../../tests/browser/upload-theme.spec.ts),
`?fixture=upload-theme`; [SSR](../../../tests/package/upload-theme.ssr.test.ts) не запускает
загрузку и browser timers.

В общих с upstream стилях `pictureCardSize: 0` приводит к наложению карточек:
центр первой карточки может попасть на preview соседней. Исходное наблюдение
сохранено в `zero-metrics.interactions` [эталона](../../../tests/browser/fixtures/ant-design-upload-theme-reference.json).
Этот крайний случай требует отдельного решения.

Текст Tooltip ошибки следует исходному порядку: непустой string response,
затем error.statusText, error.message и locale.uploadError. Controlled error
принимает строковые metadata наряду с Error/ProgressEvent; пустые поля пропускаются,
response object не подменяет сообщение ошибки. Обновление metadata открытого
Tooltip сохраняет строку и file input.
[Десять исходных случаев и четыре transitions](../../../tests/browser/fixtures/ant-design-upload-error-message-reference.json),
[browser](../../../tests/browser/upload-error-message.spec.ts) и
[SSR](../../../tests/package/upload-error-message.ssr.test.ts) проверяют этот порядок;
[чистая логика](../../../src/lib/upload.engine.test.ts) также защищает locale fallback.

`showUploadList.previewIcon/downloadIcon/removeIcon` — snippets `(file)`
для содержимого стандартных действий. Они не меняют show*Icon predicates,
locale labels, status/disabled rules или onPreview/onDownload/onRemove.
Отсутствующий snippet сохраняет исходный SVG; пустой оставляет содержимое пустым,
числовой 0 отображается. Preview icon используется в card/circle, download —
только для done; disabled remove остаётся заблокированным.

Snippet соответствует React content/Fragment, а не возвращаемому falsy значению
render function. ReactElement inspection/clone и перенос его onClick на кнопку
не воспроизводятся: собственные handlers вложенного DOM имеют нативный порядок
событий. Это та же opaque Snippet boundary, что у остальных render hooks.
[21 исходный вариант, действия и transitions](../../../tests/browser/fixtures/ant-design-upload-action-icons-reference.json),
[browser](../../../tests/browser/upload-action-icons.spec.ts) и
[SSR](../../../tests/package/upload-action-icons.ssr.test.ts) проверяют содержимое,
сохранение controls/input DOM и клавиатурный запуск remove.

`ConfigProvider.upload` задаёт общие class/style, classNames/styles, accept,
customRequest и progress. Незаполненный record наследуется; вложенный upload={{}}
заменяет его целиком. ClassNames накапливаются с локальными slots, CSS-слои идут
в исходном порядке: provider styles, provider style на trigger, local styles,
local style на trigger. Локальный accept, включая пустую строку, перекрывает общий;
customRequest использует локальный handler либо общий. Callback semantic slots
видит исходный локальный accept, а не унаследованное значение.

Progress объединяется поверх общего объекта по полям. Поэтому локальный `{}`
сохраняет provider progress; без provider `{}` по-прежнему использует defaults
самого Progress. Новый request handler применяется к следующим файлам;
выполняющийся запрос, fileList и input DOM сохраняются.
[13 случаев, четыре progress samples и события запросов](../../../tests/browser/fixtures/ant-design-upload-config-reference.json),
[browser](../../../tests/browser/upload-config.spec.ts) и
[SSR](../../../tests/package/upload-config.ssr.test.ts) защищают наследование и приоритеты.

В rc-upload 1.1.1 синхронный onSuccess может завершить запрос до его записи во
внутреннее хранилище. Следующий unmount вызывает abort уже завершённого запроса.
Raw requests/rawUnmountEvents сохранены в том же эталоне; publicRequests с
отложенным completion измерены отдельно после raw cases. Svelte сохраняет
существующую защиту завершённого транспорта; незавершённый запрос отменяется.

`classNames` и `styles` задают четыре semantic slots: root, list, item, trigger.
ClassNames содержит строки классов, styles — CSS-строки. Оба prop принимают
callback с `{props}`: переданные props и resolved listType/type/multiple/
hasControlInside/disabled/showUploadList. PrefixCls в этом объекте остаётся
исходным; bindable DOM refs в callback не передаются.

Root оформляет wrapper; item — внутреннюю строку, в том числе внутри error
Tooltip и originNode itemRender. Обычный style по-прежнему относится к trigger
и перекрывает styles.trigger. Class/rootClassName сохраняются на wrapper.
Переменные styles.root наследуются trigger через theme bridge; его собственные
semantic/style variables имеют приоритет. Смена slots сохраняет controller,
wrapper/item/trigger/input DOM, внешний draft/focus/selection.
[16 исходных случаев и пять transitions](../../../tests/browser/fixtures/ant-design-upload-semantic-reference.json),
[browser](../../../tests/browser/upload-semantic.spec.ts) и
[SSR](../../../tests/package/upload-semantic.ssr.test.ts) защищают эту границу.

`progress` настраивает line Progress в uploading-строке. Без prop применяются
size=[-1,2] и showInfo=false. Явный объект, включая `{}`, заменяет эти defaults
целиком и использует defaults самого Progress для пропущенных полей.
Percent принадлежит UploadFile; type и deprecated line strokeWidth не входят
в UploadListProgressProps. Используйте size для толщины полосы.

Передаются size, цвета/gradient, success/status, steps, format, semantic slots
и ARIA существующего Svelte Progress. Поля UploadFile['aria-label'] и
['aria-labelledby'] задают имя прогресса файла; progress props имеют приоритет.
Без явного имени сохраняется прежнее локализованное имя с filename.
Показ по-прежнему отложен на 300 ms; SSR не создаёт полосу и browser timer.
Обновления props/percent сохраняют item/input/progress root и внешний editor.
[16 исходных случаев и шесть transitions](../../../tests/browser/fixtures/ant-design-upload-progress-reference.json),
[browser](../../../tests/browser/upload-progress.spec.ts) и
[SSR](../../../tests/package/upload-progress.ssr.test.ts) защищают эти границы.

`UploadFile.linkProps` задаёт атрибуты ссылки имени файла: объект либо JSON
с теми же нативными Svelte keys (`class`, `onclick`, строковый `style`).
По умолчанию target="_blank", rel="noopener noreferrer", title=file.name;
linkProps может их перекрыть. Href всегда берётся из file.url. Атрибуты не
передаются thumbnail, preview action или имени без url.

Обработчик linkProps.onclick вызывается перед onPreview. Если он вызвал
preventDefault(), preview не запускается; return false и stopPropagation()
сами по себе preview не отменяют. Невалидный JSON выбрасывает SyntaxError,
как исходный renderer. Обновления атрибутов сохраняют ссылку и input DOM.
[19 исходных случаев и пять transitions](../../../tests/browser/fixtures/ant-design-upload-link-props-reference.json),
[browser](../../../tests/browser/upload-link-props.spec.ts) и
[SSR](../../../tests/package/upload-link-props.ssr.test.ts) сверяют эту границу.

`iconRender` — snippet `(file, listType)`, заменяющий видимую иконку файла
во всех list types и статусах. Пустой snippet сохраняет пустое содержимое;
числовой 0 отображается. Готовая image thumbnail сохраняет приоритет над иконкой.
Без prop работают прежние loading/file/picture/paper-clip defaults.
Смена renderer сохраняет строку, filename и input DOM, а также фокус editor.
[25 исходных вариантов](../../../tests/browser/fixtures/ant-design-upload-icon-render-reference.json),
[browser](../../../tests/browser/upload-icon-render.spec.ts) и
[SSR](../../../tests/package/upload-icon-render.ssr.test.ts) проверяют видимое содержимое;
Snippet не воспроизводит side effects вызова React render function.

`itemRender` — snippet `(originNode, file, fileList, actions)`. OriginNode содержит
обычную строку и Tooltip ошибки; его можно обернуть, заменить или не отрисовать.
Внешний list-item-container сохраняется. FileList — текущий readonly список
в исходном порядке; actions.preview/download/remove привязаны к данному файлу.
Preview принимает необязательный MouseEvent и отменяет его default action,
если задан onPreview. Действия custom renderer остаются доступны при disabled,
как в upstream; disabled стандартных controls задаётся отдельно.

```svelte
<Upload fileList={files} onPreview={file => console.log(file.name)}>
  {#snippet itemRender(originNode, file, fileList, actions)}
    <div data-file-count={fileList.length}>
      {@render originNode()}
      <button type="button" onclick={actions.preview}>Открыть {file.name}</button>
    </div>
  {/snippet}
</Upload>
```

Snippet непрозрачен для потребителя: ReactElement introspection/clone не переносится.
Смена renderer может заменить внутренний DOM по выбору renderer; контейнеры,
file input, порядок файлов и внешний focus/selection сохраняются.
[19 исходных вариантов и действия](../../../tests/browser/fixtures/ant-design-upload-item-render-reference.json),
[browser](../../../tests/browser/upload-item-render.spec.ts) и
[SSR](../../../tests/package/upload-item-render.ssr.test.ts) защищают эту границу.

`directory=true` разрешает выбор папки и обход вложенных файлов при drop/paste.
Input получает directory/webkitdirectory; multiple сохраняет своё значение,
потому что режим папки обрабатывает все принятые файлы и при multiple=false.
Обход идёт в ширину, directory reader читается порциями до конца, accept действует
и для выбора папки. Путь доступен в File.webkitRelativePath у beforeUpload и в
fileList[*].originFileObj; существующее непустое значение не перезаписывается.
Смена directory сохраняет input/trigger refs и фокус. SSR канонизирует
webkitdirectory как boolean attribute; в браузере сохраняются значения Source.

Ошибка чтения каталога завершает его перечисление, как upstream. Для ошибки файла
в rc-upload 1.1.1 отсутствует error callback: Promise остаётся pending и блокирует
остальные файлы. Native пропускает нечитаемый файл и продолжает обход. Raw case
и отдельный public Source sample с оставшимся читаемым файлом сохранены в
[замерах directory](../../../tests/browser/fixtures/ant-design-upload-directory-reference.json).
После disable/unmount завершившееся чтение не вызывает beforeUpload.
[Browser](../../../tests/browser/upload-directory.spec.ts),
[SSR](../../../tests/package/upload-directory.ssr.test.ts) и
[обходчик](../../../src/lib/upload-directory.dom.test.ts) защищают эти границы.

`pastable=true` включает paste файлов в документе, как AjaxUploader 1.1.1;
по умолчанию false. UploadDragger наследует этот prop. Наличие файлов отменяет
обычную вставку; текст без файлов не перехватывается. Multiple использует accept,
а single paste/drop сохраняет исходный выбор первого файла до фильтрации.
Файлы проходят обычные beforeUpload, fileList/onChange и customRequest.
Смена pastable/disabled и unmount обновляют listener, сохраняя input/trigger refs.

Локальный и наследуемый disabled блокируют paste. В исходной 6.6.8 document handler
не имеет этого guard и всё равно вызывает beforeUpload/onChange; это поведение
не перенесено. [Raw-замеры](../../../tests/browser/fixtures/ant-design-upload-paste-reference.json)
сохраняют disabled observation отдельно. [Browser](../../../tests/browser/upload-paste.spec.ts)
проверяет callbacks, документ, focus/selection внешнего editor, транспорт и cleanup;
[SSR](../../../tests/package/upload-paste.ssr.test.ts) не создаёт browser listeners.

Locale/upload из ConfigProvider, собственный locale, RU/EN, RTL и theme variables
поддержаны. React.Component/ref renderer internals и ReactElement clone/event
forwarding остаются отдельными границами реестра. Данный этап
не заявляет полного покрытия React Upload.

## Input

Расширение Input перенесено из
[woodger/ant-design@cf3e20c](https://github.com/woodger/ant-design/commit/cf3e20c829cdbcfa46232ea126606dbe853bbcd5).
Эталон исходной реализации — Ant Design 6.6.8 / @rc-component/input 1.3.1 (~1.3.1).
Стили находятся
в [vendor/antd.css](../../../src/lib/vendor/antd.css), [MIT-лицензия rc-input](../../../src/lib/vendor/LICENSE.rc-input)
сохранена. React runtime и новые dependencies не добавлены.

```svelte
<script lang="ts">
  import { Input } from 'antd-svelte';
  let value = $state('example');
</script>
<Input bind:value prefix="https://" suffix=".org" allowClear
  count={{ show: true, max: 24 }} variant="filled" aria-label="Адрес" />
```

Существующие string bind:value/defaultValue, onValueChange, native oninput/
onchange/onblur, атрибуты и FormItem associations сохраняются. Внешние изменения
не вызывают change callbacks; defaultValue фиксируется при создании. Native
name/required/maxlength/readonly остаются на реальном input, а class/style/hidden
относятся к самому внешнему элементу. ReadOnly/maxLength/autoComplete/autoFocus —
добавочные camel aliases; lowercase native attrs сохраняются. Size принимает
medium, htmlSize задаёт native size отдельно.

Prefix/suffix принимают scalar/Snippet. Без affixes и clear/count остаётся
один input. Prefix/suffix/clear/count добавляют ant-input-affix-wrapper.
Порядок suffix: clear → count → suffix content. Счётчик и очистка следуют
исходным useCount/resolveOnChange правилам; их логика находится в
input-count.engine.ts и input-event.dom.ts. Root class/semantic root styles не
попадают на вложенное поле. Click внутри affix wrapper фокусирует input.
Для внешней композиции используйте SpaceCompact/SpaceAddon.

AllowClear — boolean/{disabled,clearIcon}; непереданные поля наследуют
ConfigProvider.input.allowClear, explicit false выключает control. Default icon —
close-circle SVG, scalar/Snippet меняет его; explicit falsy icon использует '✖'.
Source line-height:0 рассчитан на SVG; текстовому icon задайте размеры/line-height.
Clear button остаётся смонтированной с hidden class при пустом/readonly/disabled
value. Mousedown предотвращает blur; clear фокусирует поле, вызывает
onValueChange(''), onChange(click), onClear, без искусственного native input.

ShowCount/count используют UTF-16 length по умолчанию и custom strategy;
count.show перекрывает showCount. MaxLength — native hard limit, count.max — soft
max/out-of-range; 0 отключает soft limit. Только count.exceedFormatter обрезает
пользовательское значение после завершения IME, сохраняя selection; внешнее value
не обрезается. Formatter получает {value,count,maxLength} и возвращает scalar либо
Snippet<[info]> через ()=>snippet. Счётчик не добавляет live region.

Новый onChange получает native Event proxy со стабильным клонированным input
в target/currentTarget и nativeEvent. Input event имеет type=change, очистка —
click. Selection setters делегируются настоящему input; email/type без selection
не вызывают неподдерживаемые setters. Существующий порядок onValueChange → oninput
сохранён, новый onChange находится между ними; native onchange по-прежнему
срабатывает при native commit. Неизменённый compositionend не вызывает повторный
onChange. Если exceedFormatter изменил результат, change
получает type=compositionend. OnCompositionStart/End и прежние native callbacks
доступны одновременно.

OnPressEnter срабатывает один раз до keyup, блокируется isComposing, сбрасывается
при blur/disabled. OnKeyDown/Up дополняют native handlers. Для type=password,
как upstream, value attribute удаляется отложенно при mount/change/focus/blur;
property value сохраняется, timers очищаются при unmount.

Variant: outlined/filled/borderless/underlined; explicit variant → Form.variant → ConfigProvider.input.variant → ConfigProvider.variant → outlined.
ClassNames/styles поддерживают
root/input/prefix/suffix/clear/count как object или callback({props}), где size и
disabled уже разрешены из контекстов. Root priority: context styles.root → context
style → local styles.root → local style. Без wrapper эти root styles идут после
styles.input. ConfigProvider.input задаёт allowClear/autoComplete/variant/class/
style/classNames/styles; nested config наследуется целиком либо явно заменяется.
Form/FormItem disabled, errors/reset, Compact, темы/compact density, RTL, locale
и reduced motion сохраняются.

Bind:inputElement даёт HTMLInputElement, bind:nativeElement — внешний input/span,
как upstream nativeElement. Bind:this предоставляет focus({cursor:'start'|'end'|
'all',preventScroll}), blur(), select(), setSelectionRange(start,end,direction).
Refs очищаются при unmount. SSR не вызывает callbacks или password timers.
Как в полном CSS эталона 6.6.8, native hidden остаётся на root, но authored
inline-block/inline-flex перекрывает его UA display:none; компонент не добавляет
отдельный скрывающий CSS override.

Галерея `/ant-design#inputs` сохраняет старые примеры и добавляет расширенный.
Fixture `?fixture=input-features` дополняет прежний Input/Select integration.
Unit/SSR и browser проверяют count/IME, focus/Enter, clear/event order, refs,
FormData/FormItem/Compact, variants/semantic styles, темы и RTL.

Input и TextArea поддерживают общий базовый prefixCls: непустой local prefix имеет
приоритет, empty/undefined наследуют ConfigProvider. Корень, affix, размеры,
варианты, clear/count и Compact используют выбранный prefix; canonical token
variables и markers сохраняются. Смена prefix не заменяет leaf/wrapper, сохраняет
value, refs, selection/focus и FormData. Сверка с официальным UMD —
`?fixture=input-prefix`, [browser](../../../tests/browser/input-prefix.spec.ts) и
[SSR](../../../tests/package/input-prefix.ssr.test.ts). TextArea сохраняет vertical resize,
autoSize и прежний приоритет semantic styles.

Input.Password, Input.Search и Input.OTP доступны как
InputPassword, InputSearch и InputOTP. Local/shared prefixCls и компонентные
tokens подключены ко всем пяти экспортам. Deprecated internal
classes/structures исключены из переноса. Согласованный string bind:value
сохраняется вместо React controlled rejection/broad value types; native DOM events
и именованные Svelte bindings заменяют SyntheticEvent/ref object. Общий аудит
семейства Input остаётся unreviewed.

## InputPassword (Input.Password)

Переключатель видимости перенесён из Password.tsx и его тестов Ant Design 6.6.8.
InputPassword использует существующий Input: bind:value, defaultValue, native
атрибуты и события, clear/count, affixes, FormItem, Compact и методы refs
сохраняют его контракт. Точные настройки описаны в
[исходных типах](../../../src/lib/input-password.types.ts).

```svelte
<script lang="ts">
  import { InputPassword } from 'antd-svelte';
  let password = $state('');
  let visible = $state(false);
</script>

<InputPassword bind:value={password} autoComplete="new-password"
  visibilityToggle={{ visible, onVisibleChange: next => { visible = next; } }}
  aria-label="Пароль" />
```

Без visibilityToggle.visible компонент хранит видимость сам. В controlled-режиме
callback запрашивает новое состояние, а внешний visible определяет результат;
обновление prop не вызывает callback. При снятии контроля сохраняется последнее
состояние. VisibilityToggle=false скрывает кнопку, сохраняя текущую видимость и
suffix wrapper. Type всегда определяется видимостью.

Как в upstream, action=hover переключает состояние на mouseover; mouseleave
ничего не меняет. Обрабатываются и всплывающие события от иконки: смена SVG под
указателем может вызвать дополнительные переключения. Это поведение подтверждено
в React-версии 6.6.8 и сохранено. Enter и Space переключают один раз, повторные keydown
игнорируются. Disabled блокирует переключение и исключает его из Tab-порядка;
readonly оставляет показ доступным. Mousedown/mouseup не уводят фокус и не меняют
каретку. Вместо React span с role=button используется native button type=button
с тем же поведением и видимым keyboard focus. Переключатель стоит перед suffix,
после Input clear/count. Иконки Eye/EyeInvisible взяты из @ant-design/icons-svg
4.6.0; MIT-лицензия сохранена в vendor. IconRender возвращает scalar либо Snippet;
пустой результат оставляет доступную кнопку.

ConfigProvider.inputPassword задаёт собственные iconRender, variant и semantic
оформление поверх ConfigProvider.input. Вложенный inputPassword заменяет объект
целиком. Подписи переключателя используют locale.global.show/hide; частичный
global наследует остальные поля. Explicit size добавляет класс ant-input-password
с суффиксом размера, а унаследованный размер меняет только Input, как в эталоне.

Скрытый пароль удаляет value attribute после mount/input/focus/blur и запроса
скрытия, не меняя property value. При показе attribute восстанавливается; timers
очищаются при unmount. Bind:inputElement/nativeElement и bind:this методы
focus/blur/select/setSelectionRange делегируются Input. SSR не запускает timers
или callbacks. Фикстура `?fixture=input-password`, source SSR и проверки публичного
пакета покрывают эти сценарии, темы, RTL, локаль и FormItem. Component token engine
Input и variant inheritance подключены; согласованные value/ref conventions сохраняются.

PrefixCls задаёт классы Password и toggle icon, inputPrefixCls — независимые классы
вложенного Input. Empty/undefined наследуют соответствующие ConfigProvider prefixes.
Canonical token variables и native toggle button сохраняются. Смена любого prefix
не заменяет DOM/ref и сохраняет visibility, value, selection/focus и FormData.

В React 6.6.8 CSS иконки ошибочно предполагает связь этих имён: при независимых
prefixes исчезают color/cursor. Здесь четыре исходных правила адресуют оба prefix.
Исходные UMD measurements и public paired-prefix counterpart хранятся раздельно в
[эталоне](../../../tests/browser/fixtures/ant-design-input-password-prefix-reference.json).
Проверки — `?fixture=input-password-prefix`,
[browser](../../../tests/browser/input-password-prefix.spec.ts) и
[SSR](../../../tests/package/input-password-prefix.ssr.test.ts).

## InputSearch (Input.Search)

InputSearch переносит Search.tsx Ant Design 6.6.8: Input и кнопка являются
соседними элементами SpaceCompact. Стили Search уже входят в vendor/antd.css;
геометрия SearchOutlined взята из @ant-design/icons-svg 4.6.0 с сохранением MIT.
Публичный контракт находится в [исходных типах](../../../src/lib/input-search.types.ts).

```svelte
<script lang="ts">
  import { InputSearch } from 'antd-svelte';
  let query = $state('');
</script>

<InputSearch bind:value={query} allowClear enterButton="Найти"
  onSearch={(value, event, info) => console.log(value, info?.source)}
  aria-label="Поиск" />
```

Кнопка и Enter вызывают onSearch с текущим native value и source=input.
OnPressEnter вызывается перед поиском; IME, isComposing, повторный Enter и loading
не запускают поиск. Очистка вызывает onValueChange(''), onSearch с source=clear,
onChange(click), onClear, сохраняя Svelte/native события Input. Loading блокирует
кнопку и Enter, но не очистку. Click кнопки сохраняет фокус Input, если он уже
был в поле. Сам по себе ввод не вызывает onSearch.

Boolean enterButton показывает обычную или primary icon button; scalar задаёт
текст primary button. SearchIcon наследуется из inputSearch config, локальный
prop имеет приоритет, null/false скрывают иконку. Для boolean enterButton
доступное имя кнопки использует locale.searchText. Текстовые кнопки именуются
своим содержимым. Вместо React cloneElement пользовательская кнопка задаётся
snippet с InputSearchButtonContext:

```svelte
<script lang="ts">
  import { Button, InputSearch, type InputSearchButtonContext } from 'antd-svelte';
</script>

{#snippet searchButton(context: InputSearchButtonContext)}
  <Button {...context.getButtonProps({ class: 'custom-search' })}>Найти</Button>
{/snippet}
<InputSearch enterButton={searchButton} aria-label="Поиск" />
```

Snippet заменяет кнопку целиком. GetButtonProps сохраняет собственные
disabled/loading, добавляет size и search class, объединяет callbacks в порядке
«собственный → Search». GetNativeProps аналогично обслуживает native button,
сохраняя его class/type и блокируя его при loading. Onmousedown пользователя
получает событие до preventDefault Search. Semantic button styles Search
применяются к стандартной кнопке; пользовательская сохраняет собственные, как
в upstream. Rich content можно разместить внутри своей Button.

ConfigProvider.inputSearch поддерживает class/style, semantic slots, searchIcon
и variant; вложенный объект заменяется целиком. Общий Input config продолжает
действовать на поле. Как в исходнике, input.variant является fallback для поля,
но не для кнопки: без отдельного Search variant она сохраняет обычный Button
variant. Semantic root относится к Compact, а button содержит root/icon/content;
строка в button — сокращение для button.root.

Class/style/hidden и data-* передаются Compact root; id/name/ARIA/constraints
остаются на Input. RootClassName относится к внутреннему Input.
InputElement/nativeElement и методы
bind:this возвращают внутренний Input, не внешний Compact. String bind:value,
defaultValue, FormItem, RTL, Compact, темы и SSR сохраняют контракты Input.
Fixture `?fixture=input-search` проверяет поиск, IME, callbacks, пользовательские
кнопки, semantic/config приоритеты и геометрию. Component token engine и variant
inheritance подключены; согласованные value/ref conventions сохраняются.
Аудит всего семейства остаётся unreviewed.

PrefixCls задаёт Search root/button classes, inputPrefixCls — независимый Input.
Empty/undefined наследуют ConfigProvider; Button и служебная btn-height variable
используют общий prefix независимо от local class и cssVar.prefix. Canonical token
markers и variables сохраняются. Source component tokens применяются также к
корню Search: small-button min-height учитывает inputFontSizeSM/paddingBlockSM.
Semantic styles и style имеют прежний приоритет над вычисленной темой.

Смена prefix сохраняет DOM/ref, value, selection/focus, FormData и поиск. React
Compact пересоздаёт Input при смене общего prefix из-за ключа с prefix в имени;
Native сохраняет прежний стабильный DOM. Raw переходы и измерения после public ref
focus хранятся раздельно. Для enterButton=true Source создаёт пустое Button content
и лишнюю ширину; Native сохраняет прежнюю icon-only кнопку. Public counterpart
использует официальный Button без children. Source shared-class cache теряет
вложенный private variable namespace; freshNested отдельно измерен со свежим
локальным классом в Inner provider. Данные —
[эталон UMD](../../../tests/browser/fixtures/ant-design-input-search-prefix-reference.json),
проверки — `?fixture=input-search-prefix`,
[browser](../../../tests/browser/input-search-prefix.spec.ts) и
[SSR](../../../tests/package/input-search-prefix.ssr.test.ts).

## InputOTP (Input.OTP)

InputOTP переносит OTP/index.tsx и OTPInput.tsx Ant Design 6.6.8. Каждая ячейка
использует Input; группа сохраняет role=group, классы ant-otp и исходные labels
«OTP Input 1», «OTP Input 2» и далее. Точные Props и настройки находятся в
[исходных типах](../../../src/lib/input-otp.types.ts).

```svelte
<script lang="ts">
  import { InputOTP } from 'antd-svelte';
  let code = $state('');
</script>

<InputOTP value={code} onChange={next => { code = next; }}
  formatter={text => text.replace(/\D/g, '')} autoComplete="one-time-code"
  aria-label="Код подтверждения" />
```

По умолчанию есть шесть ячеек, type=text и любое текстовое содержимое. Каждая
ячейка — одна UTF-16 code unit, как в source split(''); цифры не фильтруются
без formatter. Native size=1 задаёт ширину, maxlength=1 не устанавливается:
вставка нескольких символов распределяет их по ячейкам и заменяет оставшийся
хвост. Formatter получает всю строку с пробелами на пустых позициях до обрезки
до length. Пустые промежуточные позиции сохраняются, пустой хвост удаляется.

OnInput вызывается для каждого native input с массивом ячеек; onChange следует
за ним только для полностью заполненного изменившегося кода. Очистка, неполный
код и повторное событие с прежним полным кодом не вызывают onChange. Как в
upstream, composing input обрабатывается сразу, без отдельного IME-буфера.
Изменение props не вызывает onInput/onChange.

Value синхронизируется при изменении prop. Неизменённый value не отклоняет
локальный draft; снятие контроля сохраняет текущие ячейки. Bind:value не добавлен:
для полного значения используйте onChange, для частичного — onInput. DefaultValue
фиксируется при создании и проходит formatter; внешний value formatter не
проходит. Сохранено SSR-поведение upstream: сервер использует defaultValue,
а value применяется после mount. Для начального SSR-кода можно задать оба значения.

Фокус не пропускает предыдущие пустые ячейки. ArrowLeft/ArrowRight переходят
между физическими индексами, в том числе в RTL; Backspace из пустой ячейки
возвращает к предыдущей. Ctrl/Meta+z блокируется, как в исходнике. Фокус, мышь
и клавиатура восстанавливают выделение через animation frame; все отложенные
выделения отменяются при unmount. AutoFocus и focus() выбирают первую ячейку,
blur() снимает фокус. Bind:nativeElement возвращает div группы.

Mask=true рисует •, строка — собственный символ, включая emoji; реальное value
остаётся в input. По умолчанию mask выбирает type=password, явный type имеет
приоритет. Separator принимает scalar или factory(index); factory может вернуть
Snippet<[number]>, например через () => snippet. Numeric 0 сохраняется,
false/null/undefined/пустая строка не создают separator; true оставляет пустую
обёртку, как source isReactRenderable.

ConfigProvider.otp задаёт class/style, semantic root/input/separator и variant.
Вложенный объект заменяется целиком. Variant наследуется из otp, затем input;
общий Input config продолжает действовать на ячейки. Clear, унаследованный из
Input config, не меняет OTP: source слушает native input, а не onChange(click).
Size группы наследуется из componentSize; Compact продолжает действовать на
внутренние Input. FormItem id, label и описание ошибки относятся к группе,
а не дублируются на каждой ячейке. Статус и disabled передаются ячейкам; reset
учитывает Form.resetKey, в том числе для неполного кода без onChange.

Стили извлекаются рецептом otp в vendor/otp.css: 16 правил, без keyframes,
с проверкой SHA-256 исходного npm-архива. Fixture `?fixture=input-otp`, engine,
SSR и проверки публичного пакета покрывают эти сценарии. Общий аудит Input
остаётся unreviewed; React dev diagnostics, включая предупреждение о длинной
маске, пока не перенесены. Input component tokens применяются к ячейкам и группе,
включая gap и padding aliases; semantic styles и style сохраняют прежний приоритет.

PrefixCls меняет группу, size/RTL states, input, wrappers, mask и separators.
Непустой local prefix имеет приоритет; empty/undefined наследуют ConfigProvider.
Вложенные Input используют общий input namespace независимо от локального OTP.
Canonical token variables/markers сохраняются. Смена prefix не заменяет группу,
ячейки и wrappers; code, callbacks, refs, focused index и selection сохраняются.

В React 6.6.8 wrappers и mask ошибочно используют общий OTP prefix, игнорируя
локальный. Native передаёт prefix владельца всему OTP. Raw UMD results и public
counterpart с вложенным ConfigProvider, согласованным с локальным prefix, сохранены
раздельно в [эталоне](../../../tests/browser/fixtures/ant-design-input-otp-prefix-reference.json).
Native сохраняет независимый общий Input namespace. Проверки —
`?fixture=input-otp-prefix`, [browser](../../../tests/browser/input-otp-prefix.spec.ts),
[SSR](../../../tests/package/input-otp-prefix.ssr.test.ts); дополнительно сравниваются
стандартный и общий prefix в светлой/тёмной и compact Native theme.

## TextArea (Input.TextArea)

Отдельный экспорт TextArea соответствует React Input.TextArea. Базовый объём
включает bind:value/string, defaultValue, name, rows, cols, maxlength, minlength,
required, disabled, readonly, placeholder, autocomplete и остальные native
атрибуты textarea. Значение не обрезается программно до maxlength: как upstream,
ограничение применяется браузером при пользовательском вводе, но управляемое
значение может превышать его. DefaultValue фиксируется при создании, value имеет
приоритет; после редактирования value=undefined очищает поле, как у местного Input.

OnValueChange получает строку на каждом input, затем вызывается native oninput.
Onchange остаётся native change (при завершении редактирования), onselect,
onbeforeinput, composition и keyboard events передаются textarea. OnPressEnter
вызывается перед onkeydown, кроме Enter с isComposing=true; стандартная вставка
переноса строки сохраняется, если callback не вызвал preventDefault().
Bind:nativeElement даёт HTMLTextAreaElement для focus/blur/select/setSelectionRange
и чтения selectionStart/selectionEnd/selectionDirection.

Size и status=error|warning, Compact, RTL, темы, Form/FormItem disabled, name/id,
required, aria-invalid и описания ошибок наследуются из существующих контекстов.
Явные props имеют приоритет. Form.resetFields восстанавливает привязанное поле
через модель формы. Без allowClear/showCount/count.show поле остаётся одним native
textarea; autoSize сам по себе wrapper не добавляет. Счётчик и clear используют
исходные ant-input-affix-wrapper/ant-input-textarea-affix-wrapper.

```svelte
<script lang="ts">
  import { TextArea } from 'antd-svelte';
  let description = $state('');
</script>
<label for="description">Описание</label>
<TextArea id="description" name="description" rows={4} maxlength={2000} required bind:value={description} />
```

Расширенный объём следует Ant Design 6.6.8 / @rc-component/input 1.3.1 (~1.3.1):
изучены TextArea/BaseInput/ResizableTextArea, calculateNodeHeight, useCount,
useCountDisplay/useCountExceed, resolveOnChange, Ant wrapper/style/tests и
@rc-component/resize-observer 1.1.2. Используются существующие CSS Input/TextArea
из [vendor/antd.css](../../../src/lib/vendor/antd.css) и [лицензия rc-input](../../../src/lib/vendor/LICENSE.rc-input).
Новые npm dependencies не добавляются.

AutoSize=true измеряет значение либо placeholder; {minRows,maxRows} ограничивает
высоту. Измерение учитывает box-sizing, padding/border, шрифты, ширину и wrap.
При maxRows появляется vertical scroll; без превышения maxRows overflowY=hidden.
AutoSize устанавливает resize:none; при отключении возвращаются authored styles.
Один скрытый textarea на document повторяет исходное измерение; в Svelte он имеет
native tabIndex=-1 и удаляется после последнего потребителя. ResizeObserver
дедуплицирует floor/offset размеры, вызывает onResize({width,height}) и переносит
измерение в RAF. Frames/observer/mouseup listener и ref bindings очищаются.
Ручной resize:both при mousedown отмечает dirty wrapper; onResize также сохраняет
исходное правило height:auto для непустого wrapper после задания textarea.height.

ShowCount=true выводит UTF-16 length, включая две units на surrogate pair.
Native maxLength (либо прежний maxlength) остаётся ограничением браузера. Count.max
переопределяет отображаемый максимум, но сам по себе не обрезает value;
превышение добавляет ant-input-out-of-range без подмены Form validation.
Count.max=0 отключает soft range/clip. Count.strategy меняет подсчёт. Обрезание
включается только через count.exceedFormatter(value,{max}) и только при заданном
count.max, после завершения composition. Внешние значения не обрезаются;
selection сохраняется с native clamping. Count.show перекрывает showCount,
включая явно переданный show:undefined. ShowCount.formatter и count.show formatter
получают {value,count,maxLength}, возвращают string/number либо Snippet<[info]>;
для rich content используйте formatter:()=>snippet. Счётчик не добавляет live region.

AllowClear принимает boolean или {disabled,clearIcon}; icon — scalar/Snippet.
Непереданные icon/disabled наследуют ConfigProvider.textArea.allowClear. Явный
false отключает clear, а объект disabled=false перекрывает context disabled.
Как source, кнопка остаётся смонтированной с hidden class для пустого/disabled/
readonly значения. Pointerdown сохраняет focus. Очистка фокусирует textarea,
вызывает onValueChange(''), onChange с type=click, затем onClear; native oninput
искусственно не отправляется. Falsy explicit clearIcon использует исходный '✖';
для текстового icon задайте его размеры/line-height, поскольку Source button
использует line-height:0, рассчитанный на SVG.

Новый onChange получает объект с клонированным textarea target/currentTarget и
стабильным value, как resolveOnChange. При input его type=change, nativeEvent
содержит исходный DOM event; compositionend и clear сохраняют соответствующие
типы событий. Target.setSelectionRange делегирует настоящему textarea. Это native
Event proxy с делегированными DOM methods, а не React SyntheticEvent runtime.
Прежний порядок onValueChange → native oninput сохранён; onChange находится между
ними. Compositionend вызывает onChange, не дублируя legacy input callback, кроме
изменённого exceedFormatter значения. Camel callbacks onFocus/onBlur/onKeyDown/
onMouseDown/onCompositionStart/End дополняют прежние native handlers.

Variant поддерживает outlined/filled/borderless/underlined. Explicit variant имеет
приоритет над Form.variant, component config и общим variant; fallback — outlined.
ClassNames/styles принимают root/textarea/clear/
count либо callback({props}); props отражает текущий Svelte value. Context и local
semantic styles объединяются, root style идёт после соответствующих semantic root
styles. Root resize переносится в textarea; styles.textarea имеет приоритет над
этим resize. Без wrapper root styles, как source, идут после textarea styles.
ConfigProvider.textArea поддерживает allowClear/autoComplete/variant/class/style/
classNames/styles; явно заданный nested config заменяет родительский.

Bind:nativeElement по прежнему возвращает HTMLTextAreaElement. Новый rootElement
даёт textarea либо span-wrapper; bind:this предоставляет focus({cursor:'start'|
'end'|'all',preventScroll})/blur(). Native autocomplete/readonly и aliases
maxLength/readOnly/autoComplete/autoFocus сохранены на реальном control. SSR не
создаёт ResizeObserver/shadow и не вызывает resize/change callbacks.

Галерея `/ant-design#textarea` сохраняет старый пример и добавляет расширенный.
Fixture `?fixture=textarea-features` дополняет `?fixture=textarea`. Unit/SSR и browser
проверяют count/clear/IME, размер и cleanup, native refs/events/Form, темы и RTL.

Сохраняется согласованный строковый bind:value: он не заменяется React controlled
rejection. React broad value types и исходный ref shape resizableTextArea
не добавлены; refs представлены именованными Svelte bindings. Local/shared
prefixCls и component token engine Input подключены, как у обычного Input. Полный аудит всего
семейства Input, включая прочие subcomponents, остаётся незавершённым.

## Rate

Rate следует Ant Design 6.6.8 и @rc-component/rate 1.0.1 (~1.0.1).
Изучены wrapper, style, demo, tests и делегированные Rate/Star/util.
[MIT-лицензия rc-rate](../../../src/lib/vendor/LICENSE.rc-rate) включена в пакет;
React runtime и новые npm dependencies не добавляются.

```svelte
<script lang="ts">
  import { Rate } from 'antd-svelte';
  let value = $state(2.5);
</script>
<Rate aria-label="Оценка" {value} allowHalf
  tooltips={['Очень плохо', 'Плохо', 'Нормально', 'Хорошо', 'Отлично']}
  onChange={next => { value = next; }} />
```

Value управляется владельцем через onChange; без value используется внутреннее
значение с defaultValue=0. Count=5 принимает целое неотрицательное число, как
new Array(count) в upstream. Значения и fractions владельца не округляются и
не ограничиваются count. Уменьшение count не меняет value. Native form reset
не сбрасывает внутренний выбор; собственное поле FormData не создаётся.

AllowHalf=false по умолчанию. При allowHalf половина определяется координатой
относительно исходного li, с обратной стороной в RTL; точный midpoint даёт полную
оценку. Hover показывает временный выбор без onChange. OnHoverChange получает
также undefined при выходе и перед публикацией клика. AllowClear=true очищает
повторный выбор до 0; этот же hover подавляется до другой позиции/выхода.
AllowClear=false повторно публикует то же value. Внешняя смена props не вызывает
callbacks. Смена controlled value на undefined очищает внутренний fallback,
как useControlledState зависимости; новое нажатие снова задаёт значение.

ArrowLeft/Right изменяют значение на 1 либо 0.5, направление обратное в RTL.
Фокус при этом не перемещается. Исходная арифметика сохраняется без clamp:
например, внешнее 4.8 при count=5 и allowHalf=true увеличивается до 5.3.
OnKeyDown вызывается после изменения; обработанная стрелка получает preventDefault.
Keyboard=false отключает стрелки; Enter на символе по-прежнему выбирает полное
значение и предотвращает дублирующий native click. Focus/blur callbacks следуют
всплывающему изменению фокуса.

Character — строка, число или Snippet<[RateCharacterInfo]>; snippet получает
index/count, временное отображаемое value, allowHalf/disabled/focused, prefixCls
и исходные onHover(event,index)/onClick(event,index). Он рендерится в двух слоях
звезды, как исходный character. CharacterRender —
Snippet<[Snippet,RateCharacterInfo]> с исходным star snippet; как rest override
Ant wrapper, он заменяет автоматическую Tooltip composition. Tooltips принимает
строки или поддерживаемые локальные TooltipProps без children. Tooltip использует
существующую обёртку с display:contents; отступы между stars сохранены.

Непустой prefixCls задаёт локальные классы Rate; empty/undefined наследуют
ConfigProvider.prefixCls. Состояния, слои звёзд и RateCharacterInfo.prefixCls
используют разрешённый prefix. Tooltip сохраняет самостоятельный общий namespace;
canonical component token marker/variables не переименовываются. Scoped CSS
использует те же 21 правило с native button adapter. Смена local/shared prefix
сохраняет оценку, DOM/ref, focus и соседний draft/selection/FormData.
Сверка с неизменённым UMD: [reference](../../../tests/browser/fixtures/ant-design-rate-prefix-reference.json),
[browser](../../../tests/browser/rate-prefix.spec.ts),
[SSR](../../../tests/package/rate-prefix.ssr.test.ts), `?fixture=rate-prefix`.

Size принимает small/medium/large, наследует componentSize.
Disabled наследует общий disabled-контекст, включая Form; явный false имеет
приоритет. ConfigProvider.rate принимает class/style, локальные class/rootClassName
добавляются, style накладывается после контекстного. Вложенный явно заданный rate
config заменяет родительский. Light/dark, compact, RTL и reduced motion реактивны;
CSS variables --ant-rate-star-color/size/size-sm/size-lg/bg/hover-scale и
--ant-rate-line-width-focus допускают явный inline override.

ConfigProvider.theme.components.Rate применяет все шесть компонентных токенов
со строковым starHoverScale. LineWidthFocus подготавливается по исходному правилу
из lineWidth/lineWidthFocus. Поддержаны нули, undefined, global/component aliases
и algorithms, cssVar.prefix, вложенные/reset/sibling providers, hover/focus и
disabled. Переменные темы идут перед ConfigProvider.rate.style и локальным style;
смена темы сохраняет оценку, radio DOM, фокус, refs и callbacks.
Сверка: [UMD](../../../tests/browser/fixtures/ant-design-rate-theme-reference.json),
[SSR](../../../tests/package/rate-theme.ssr.test.ts),
[browser](../../../tests/browser/rate-theme.spec.ts), `?fixture=rate-theme`.

Массивы и CSSObject в starHoverScale пока не исполняются. Ant Design 6.6.8
не регистрирует для них CSS variable, поэтому его hover transform становится none.
Это наблюдение записано в реестре; native сохраняет прежний scale(1.1).
Пользовательские CSS variables/styles перекрывают этот fallback. Полный CSSObject
API, включая исходные _multi_value_/_skip_check_ markers, остаётся отдельным пробелом.

Bind:this предоставляет focus()/blur(), которые игнорируются при disabled;
bind:nativeElement возвращает ul. AutoFocus применяется только после mount,
SSR не обращается к DOM и не вызывает callbacks. Нативные button type=button
заменяют исходные div role=radio: дополнительно доступна активация Space, корневая
ul получает radiogroup и видимый focus. Исходные cumulative aria-checked,
aria-posinset/setsize и отдельные tab stops сохранены. Декоративные копии символов
скрыты от accessibility tree; имя кнопки — её one-based номер.

[vendor/rate.css](../../../src/lib/vendor/rate.css) содержит все 21 правило из закреплённого
npm-архива с проверкой SHA-256; рецепт rate адаптирует >div к >button, declarations
сохранены. Rate.svelte дополняет native reset styles, focus и reduced motion.
StarFilled SVG взят из Ant Design Icons SVG 4.6.0 с существующей MIT-лицензией.
Галерея — `/ant-design#rate`, fixture — `?fixture=rate`; unit/SSR и browser
сценарии проверяют значения, callbacks, геометрию, контексты и cleanup.

Полный upstream Tooltip API ограничен текущим публичным
Svelte Tooltip. Эти части не считаются покрытыми переносом Rate.

## Mentions

Первый этап следует Ant Design 6.6.8 / @rc-component/mentions 1.12.0 (~1.12.0).
Правила поиска/замены перенесены в mentions.engine.ts, autoSize следует
calculateNodeHeight из @rc-component/input 1.3.1. Лицензии
[rc-mentions](../../../src/lib/vendor/LICENSE.rc-mentions) и [rc-input](../../../src/lib/vendor/LICENSE.rc-input)
включены в пакет; React runtime не устанавливается.

```svelte
<script lang="ts">
  import { Mentions, getMentions } from 'antd-svelte';
  let value = $state('');
</script>
<Mentions {value} options={[{ value: 'alice', label: 'Alice' }]}
  onChange={next => { value = next; }} allowClear
  autoSize={{ minRows: 2, maxRows: 5 }} aria-label="Комментарий" />
<p>{getMentions(value).map(item => item.value).join(', ')}</p>
```

Value/defaultValue — полная строка textarea. Prefix по умолчанию '@', принимает
строку/массив; split по умолчанию один пробел. При поиске выбирается последнее
вхождение префикса перед selectionStart; при равных позициях сохраняется порядок
массива prefix. Default validateSearch проверяет только literal split, без
дополнительной обработки переносов строк. FilterOption ищет по option.value без
учёта регистра; false отключает фильтрацию, predicate получает исходный option.
Options содержит value, label string/number/Snippet, key/disabled/class/style.

CSS prefixCls не меняет текстовые triggers prefix. Непустое локальное значение
имеет приоритет; empty/undefined наследуют ConfigProvider. Editor, mirror,
variants/status, clear и popup/menu используют resolved prefix. Private
cmp-mentions variables и Form feedback selector используют общий namespace;
canonical component tokens/markers остаются прежними. Смена local/shared prefix
сохраняет IDs, root/textarea/popup DOM, query, focus/selection и FormData.
Native clear/ARIA/IME и правила поиска/выбора не меняются.
Сверка: [UMD](../../../tests/browser/fixtures/ant-design-mentions-prefix-reference.json),
[browser](../../../tests/browser/mentions-prefix.spec.ts),
[SSR](../../../tests/package/mentions-prefix.ssr.test.ts), `?fixture=mentions-prefix`.
Прежний простой locale.emptyText без renderEmpty сохраняется: raw Source Small
Empty записан отдельно от nativeEmpty — измерения public notFoundContent с тем
же локализованным текстом. Source результаты не заменяются этим counterpart.

Поиск запускается по keyup, как rc-mentions. Программная смена value сама его не
запускает. OnSearch(text,prefix) позволяет владельцу обновить options/loading;
сетевых запросов внутри нет. Loading показывает disabled spinner вместо выдачи
и блокирует выбор Enter. NotFoundContent заменяет локализованное пустое состояние.

Выбор вставляет prefix+value+split у каретки, добавляет split перед токеном при
необходимости, убирает совпадающий хвост без учёта регистра и сохраняет остальной
текст. OnChange(nextText) вызывается до onSelect(option,prefix), затем после DOM
update восстанавливаются focus/selection. Native selection offsets — UTF-16.
Callback получает исходный option data без React key suffix. Отдельный экспорт
getMentions(value,{prefix,split}) соответствует Mentions.getMentions: извлекает
непустые токены в начале разделённых split частей, без собственной разметки.

Up/Down обходят доступные options, Enter выбирает, Escape закрывает. IME Enter
не выбирает. OnPressEnter работает при закрытых подсказках; onKeyDown/onKeyUp и
нативные onkeydown/onkeyup доступны. OnFocus/onBlur учитывают переход в popup;
отложенный blur очищается при unmount. Readonly/disabled сохраняют native поведение.

Popup выравнивается после префикса и следует переносам/прокрутке textarea.
Placement top/bottom, RTL и viewport adjustment поддержаны; source gap=4 px.
Native popover сохраняет фокус textarea; textarea/listbox/option и
aria-activedescendant заменяют React DropdownMenu на rc-menu. Mirror скрыт от
accessibility tree. Общий popup-механизм сохраняет прежний default gap для остальных
компонентов; AutoComplete использует исходные 4 px, как SelectTrigger.

Локальный getPopupContainer выбирает HTMLElement или ShadowRoot. Как Ant Design,
Mentions не наследует ConfigProvider.getPopupContainer. Тип getter не требует
аргументов. Функция без параметров при открытии сначала получает undefined,
затем span префикса внутри ant-mentions-measure. Функция с параметром ждёт этот
DOM ref, как rc-trigger. Без getter сохраняется native размещение; на сервере
getter не вызывается. Стили ShadowRoot размещает потребитель.

PopupRender — Snippet со стандартным menu Snippet. Можно добавить обёртку или
заменить меню; клавиатура textarea продолжает выбирать из options. Пользовательское
содержимое сохраняет тему и локализацию, но не наследует status/feedback FormItem
и SpaceCompact, как исходный ContextIsolator. Фокус в стандартном меню удерживает
подсказки открытыми; переход в поле вне menu закрывает их по исходному blur.
Закрытие и смена DOM-контейнера создают popupRender заново; смена getter с тем же
контейнером сохраняет DOM/state, текст, фокус и выделение textarea.

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Mentions } from 'antd-svelte';
</script>
{#snippet popup(menu: Snippet)}
  <strong>Участники</strong>
  {@render menu()}
{/snippet}
<Mentions options={[{ value: 'alice', label: 'Alice' }]} popupRender={popup}
  getPopupContainer={() => document.body} aria-label="Комментарий" />
```

AutoSize принимает boolean/{minRows,maxRows}, измеряет содержимое с теми же
font/padding/box-sizing, что и textarea. Shadow node, ResizeObserver, frames и
listeners удаляются при unmount. OnResize получает {width,height}. Это API Mentions;
существующий TextArea этим этапом не расширяется. Rows по умолчанию 1.

AllowClear — boolean/{clearIcon,disabled}; очистка вызывает change(''), затем
onClear. Size/status/variant, native name/required/maxlength, FormItem/validation/
reset, Form/ConfigProvider disabled, locale/themes/compact density/RTL поддержаны.
Focus/blur и bind:nativeElement предоставляют текущий ref API. Текстовое поле
доступно через nativeElement.querySelector('textarea'); deprecated textarea ref удалён.
CSS-рецепт mentions извлекает 102 правила. Галерея `/ant-design#mentions`,
фикстура `?fixture=mentions`; SSR не измеряет DOM и не ставит таймеры.
24 эталона официального UMD для контейнеров и popupRender —
[mentions-popup](../../../tests/browser/mentions-popup.spec.ts), `?fixture=mentions-popup`.

`ConfigProvider.theme.components.Mentions` применяет shared Input tokens,
размеры списка, aliases и algorithms к textarea и popup. Подготавливаются 22
исходных CSS defaults, включая внутренние lineWidthFocus/itemPaddingVertical;
публичный список токенов остаётся в исходных типах. Темы Input/Select не подменяют
тему Mentions. Local style имеет приоритет; обновления сохраняют открытый popup,
draft, focus/caret и активный option. Native button reset не перекрывает исходные
hover/active цвета пунктов.
При нулевом inputFontSize подсказки сохраняются у префикса нулевого размера,
как в исходном компоненте.
16 тем официального UMD — [mentions-theme](../../../tests/browser/mentions-theme.spec.ts),
`?fixture=mentions-theme`; [SSR](../../../tests/package/mentions-theme.ssr.test.ts) сохраняет
native текст формы без popup, измеряющего textarea и timers.

Semantic classNames/styles, feedback suffix,
полный ConfigProvider.mentions API и
исходные rc-trigger motion пока отсутствуют.

## AutoComplete

Первый этап следует Ant Design 6.6.8 и @rc-component/select 1.10.1 (~1.10.1).
Combobox-логика находится в AutoComplete и его engine; существующие single/multiple
контракты Select сохранены. Как upstream, оформление переиспользует CSS Select
из vendor/antd.css; отдельного upstream style-модуля AutoComplete нет.
[MIT-лицензия rc-select](../../../src/lib/vendor/LICENSE.rc-select) включена в пакет.

```svelte
<script lang="ts">
  import { AutoComplete } from 'antd-svelte';
  let value = $state('');
  let search = $state('');
  let options = $derived(search ? [{ value: `${search}@example.com` }] : []);
</script>
<AutoComplete {value} {options} allowClear backfill
  onChange={next => { value = next ?? ''; }}
  showSearch={{ onSearch: next => { search = next; } }} aria-label="Email" />
```

Value/defaultValue — произвольная строка; совпадение с options не требуется.
Выбор показывает option.value, label — string/number/Snippet только в списке.
Options также принимает группы `{label, options}`; disabled пункты пропускаются.
OnChange(value,option) вызывается при изменении ввода/выборе, onSelect(value,option)
при каждом выборе, onSearch(text) при поисковом вводе, но не при выборе пункта.
Для свободного значения второй аргумент onChange — пустой объект, при очистке
списка значений — undefined; React option.props wrapper не переносится.

FilterOption по умолчанию false, как runtime combobox rc-select. True фильтрует
value без учёта регистра, без trim/Unicode folding. Совпавшая группа сохраняет
всех детей; иначе проверяются дети. Predicate получает поверхностную копию raw option/group.
ShowSearch object настраивает filterOption/onSearch; прежние top-level props удалены.
Класс popup задаётся через classNames.popup.root; popupClassName удалён.
PopupRender, prefix, semantic classNames/styles и общий ConfigProvider.select
описаны в [разделе Select](#popup-и-семантическое-оформление). У AutoComplete нет
slots suffix/item/itemContent/itemRemove.
Загрузку данных, debounce и защиту от старых ответов выполняет потребитель.

Open/defaultOpen задают controlled/uncontrolled popup. Без options и непустого
notFoundContent popup скрыт даже при open=true. SSR оставляет его закрытым до
mount, как rc-select useOpen. OnOpenChange получает запрос на смену открытого
состояния, включая отклонённый controlled open=false запрос.
PopupMatchSelectWidth — boolean/число; отсутствующий prop и `undefined` наследуют
`ConfigProvider.popupMatchSelectWidth`. ListHeight ограничивает viewport списка
и по умолчанию равен 256; padding и border popup добавляются снаружи.
OnPopupScroll передаёт native scroll event внутреннего holder; currentTarget и this
указывают на этот div. Поверхность — native popover с сохранением фокуса input,
outside/Escape и cleanup. Virtual, listItemHeight, showScrollBar, scrollTo и
onActive работают так же, как [в Select](#select). DefaultActiveFirstOption у
AutoComplete по умолчанию false.

GetPopupContainer получает корневой элемент Select, включая custom input/textarea.
Локальная функция перекрывает ConfigProvider.getPopupContainer; undefined наследует
provider. Getter выполняется в браузере после открытия. При переносе сохраняются
Select tokens, поиск, фокус и FormData. ShadowRoot требует собственных стилей.
Замена функции с тем же DOM-контейнером сохраняет поле и список.

Стрелки обходят доступные options, Enter/Tab выбирают активный пункт; IME Enter
не выбирает. Backfill меняет только видимый текст до подтверждения. По runtime
rc-select defaultActiveFirstOption=false, хотя таблица Ant Design указывает true;
для непустого текста отдельно активируется первое prefix match. Home/End остаются
у нативного input. AllowClear поддерживает boolean/{clearIcon,label}. Для непустого
текста rc-select выполняет два пути: onClear, change(undefined), change(''),
search(''); этот порядок сохранён. Обработчик controlled value обычно нормализует
undefined в пустую строку. OnInputKeyDown, onFocus/onBlur и focus/blur доступны.

Custom input задаётся `children(control)` Snippet:

```svelte
<AutoComplete options={[{ value: 'example' }]} aria-label="Подсказки">
  {#snippet children(control)}
    <textarea {...control.attributes} use:control.register rows="3"></textarea>
  {/snippet}
</AutoComplete>
```

Attributes/register связывают value, ARIA, события и native ref; собственные
class/style/rows сохраняются. InputElement и nativeElement доступны через bind.
Native name/required/disabled/readonly, FormItem/status/reset, размеры, variants,
Compact, темы и RTL поддержаны. Галерея `/ant-design#auto-complete`, фикстура
`?fixture=auto-complete`. При custom input его native constraints задаются на нём.

Source theme использует `components.Select` и общий Select token scope, как
upstream AutoComplete: размеры options/groups, отступы, цвета, clear и focus.
Custom Input сохраняет собственные `components.Input` и размеры; оболочка не
навязывает ему controlHeight Select. Токены доступны при SSR; смена темы
сохраняет native editor, option content, выделение, фокус, FormData и положение
открытого popup. Native-only темы сохраняют прежнее оформление.

`prefixCls` использует namespace Select, как upstream AutoComplete: непустое
локальное значение перекрывает `ConfigProvider.prefixCls`, пустое наследует его.
Control/content/clear/groups/options/popup получают соответствующие классы и CSS;
вложенный Input/TextArea сохраняет собственный общий namespace. Служебные Select
variables отделены от canonical theme tokens. Смена префикса сохраняет editor,
popup/options, generated IDs, refs, query, text selection, focus, FormData и callbacks.
[28 UMD-конфигураций](../../../tests/browser/fixtures/ant-design-auto-complete-prefix-reference.json)
в normal/nested/reset scopes включают custom Input/TextArea, filled и disabled Input;
[browser](../../../tests/browser/auto-complete-prefix.spec.ts) и
[SSR](../../../tests/package/auto-complete-prefix.ssr.test.ts) проверяют эти границы.

FieldNames и generic `AutoCompleteProps<OptionType>` используют
[общий слой данных](#данные-options-и-fieldnames). Значение свободного ввода остаётся string;
raw OptionType не требует literal value/label и не получает добавленных canonical полей.
`optionRender` — Snippet с flattened option и `{ index }`, как у Select. Index
абсолютный, включая заголовки групп и строки вне текущего virtual window.
Renderer меняет содержимое пункта, сохраняя raw option, выбранный label, title и
фильтрацию. После посещения закрытый список применяет новый renderer к сохранённым
options; следующее открытие принимает актуальные данные. SSR не вызывает optionRender.

`labelRender` — чистая функция с metadata Select; null/undefined возвращают raw value.
Она работает и при SSR. Стандартный editor сохраняет строковое value и прозрачный
display DOM; custom input подавляет этот DOM, сохраняя вызовы producer.
Title сначала берётся из literal title/label текущего raw option, затем из display
item; внешний title имеет приоритет. Переданный `tagRender` остаётся в semantic
metadata, но combobox его не вызывает.

Suffix, suffixIcon, loadingIcon, showSearch.searchIcon, menuItemSelectedIcon и
allowClear описаны в [общем разделе иконок](#иконки-и-очистка-select).
`components.root/input` используют [общий API замены поля](#замена-root-и-input-select).
`children(control)` сохраняет приоритет над `components.input`; `components.root`
полностью заменяет поле и не вызывает оба editor renderers. Исходный motion пока отсутствует.
Deprecated dataSource/Option
и dropdown aliases исключены из переноса. Generic numeric/object values не входят в первый этап.

## Select

Без mode компонент сохраняет одиночный выбор; по умолчанию value скалярный. В
`mode="multiple"` value и callback используют массивы; варианты выбираются
из options, а выбранные элементы показываются с кнопками удаления.
`SelectProps<Value>` описывает прежний одиночный API,
`SelectProps<Value, 'multiple'>` — множественный. При использовании компонента
типы значений и callback выводятся из options и mode. `SelectProps<Value, 'tags'>`
принимает массив Value | string: свободный ввод создаёт строки, исходные числовые
ключи сохраняются.

### Данные options и fieldNames

`SelectProps<Value, Mode, OptionType>` добавляет тип исходных записей третьим параметром;
порядок Value/Mode сохранён. `AutoCompleteProps<OptionType>` параметризует raw данные,
сохраняя строковое значение control. Для условных массивов flat/groups задавайте общий
тип записей явно. Если TypeScript не выводит mixed Value из binding, укажите его в
`Select<string | number>`.

FieldNames задаёт value, label, options и groupLabel. Пустые имена выбирают стандартные
поля, groupLabel по умолчанию совпадает с итоговым label. Поддерживается один уровень
групп: вложенная группа внутри children рассматривается как terminal option, как в Source.

```svelte
<script lang="ts">
  import { Select } from 'antd-svelte';
  interface Entry {
    key?: string;
    uid?: string;
    text?: string;
    heading?: string;
    nodes?: readonly Entry[];
  }
  const MappedSelect = Select<string, undefined, Entry>;
  const options: readonly Entry[] = [{ key: 'teams', heading: 'Teams', nodes: [
    { uid: 'development', text: 'Development' }
  ] }];
  let value = $state<string>();
</script>

<MappedSelect {options} bind:value
  fieldNames={{ value: 'uid', label: 'text', options: 'nodes', groupLabel: 'heading' }} />
```

Значение и подпись читаются из mapped полей. Key строки независимо берётся из literal
key, затем literal value, затем `rc-index-key-${index}`; bigint, 0 и пустой key сохраняются.
Абсолютный index включает headers и отражает текущие filter/sort. Group metadata
отделена от raw records. Title/className/CSS-object style и разрешённые DOM/data-/aria-*
атрибуты options передаются в native button; mapped поля не попадают в DOM. Физический header
использует только className/title и содержимое. Native CSS-строки и class alias сохранены.

OnChange вызывается при изменении последовательности values; onSelect — при каждом
выборе, включая повторный single выбор; onDeselect — при удалении в multiple/tags.
OnClear предшествует onChange и не создаёт onDeselect. Второй аргумент сохраняет raw поля:
это shallow copy выбранного record, а для multiple — массив копий. При одинаковом value
выбирается последний record из текущей карты данных. Вложенные объекты не клонируются;
для свободного tag без исходного record callback получает пустой объект. Bind:value и
onValueChange сохраняются. Удалённый selected option остаётся в cache до снятия выбора.
Без labelInValue selected value остаётся string/number или их массив.

Исходные [40 сценариев](../../../tests/browser/fixtures/ant-design-select-data-reference.json.gz),
[40 SSR](../../../tests/browser/fixtures/ant-design-select-data-ssr-reference.json),
[атрибуты](../../../tests/browser/fixtures/ant-design-select-data-attributes-reference.json) и
[диагностика](../../../tests/browser/fixtures/ant-design-select-data-diagnostic-reference.json)
сохранены независимо от реализации. Большой основной эталон хранится в gzip; загрузчик
распаковывает его стандартным Node.js zlib и проверяет прежний SHA-256 исходных байтов.
Native label/NFKD search и disabled cache проверяются
с отдельными public Source owners
([search](../../../tests/browser/fixtures/ant-design-select-data-label-native-reference.json),
[cache](../../../tests/browser/fixtures/ant-design-select-data-cache-native-reference.json));
исходные ledgers не фильтруются. Virtual Source ошибочно
теряет mapped aria-selected: [парное наблюдение](../../../tests/browser/fixtures/ant-design-select-data-aria-reference.json)
сохраняет этот результат, Native использует корректное mapped состояние. Multiple token
lookup использует mapped value; Source при том же вводе читает literal value и теряет выбор.
Полные [браузерные проверки](../../../tests/browser/select-data.spec.ts),
[атрибуты](../../../tests/browser/select-data-attributes.spec.ts),
[диагностические границы](../../../tests/browser/select-data-diagnostics.spec.ts),
[SSR](../../../tests/package/select-data.ssr.test.ts) и
[строгая hydration](../../../tests/browser/select-data-hydration.spec.ts) проверяют эти контракты.

### Выбранные labels и labelInValue

`labelInValue={true}` меняет value/defaultValue и первый аргумент callbacks на
`{ value, label }`; multiple/tags используют массив таких объектов. Верхний `null`
очищает выбор и не подставляет defaultValue. Входной label может быть строкой, числом,
boolean, массивом содержимого или Svelte Snippet. Явный label имеет приоритет;
отсутствующий/undefined читается из `optionLabelProp` либо mapped label options.

`SelectProps<Value, Mode, OptionType, LabelInValue>` сохраняет первые три параметра.
Четвёртый по умолчанию false; boolean даёт объединение primitive/labeled значений.
При явном `Select<number>` остальные параметры получают defaults: для labeled
специализации задавайте все четыре, например `Select<number, undefined, Entry, true>`.
Без явной специализации компонент выводит labeled domain из props.

`labelRender(info)` — обычный callback. Он получает label/value/key/disabled/title
и возвращает содержимое, включая Snippet; key равен raw value. Результат null/undefined
заменяется raw value, а false/пустая строка сохраняют пустой видимый label. Callback
вызывается и при SSR, поэтому должен быть чистым.

```svelte
<script lang="ts">
  import { Select, type SelectLabelValue } from 'antd-svelte';
  const options = [{ value: 0, label: 'Zero', alternate: 'Number zero' }];
  let value = $state<SelectLabelValue<number> | undefined>();
</script>

{#snippet selectedLabel()}<strong>Number zero</strong>{/snippet}
<Select {options} labelInValue bind:value optionLabelProp="alternate"
  labelRender={() => selectedLabel} name="number" />
```

OnChange получает labels текущего преобразования, а onSelect/onDeselect — mapped
label исходного option независимо от optionLabelProp и labelRender. Удаление тега
кнопкой или Backspace передаёт оставшиеся уже отрисованные labels через onChange,
как в оригинале. Uncontrolled выбор сохраняет label после взаимодействия; controlled
owner с raw value заново читает options. Single className/style/title берутся из
первого совпадения текущей filtered/sorted выдачи, callback option — из последнего
совпадения value. Rich labels сохраняются в tagRender и maxTagPlaceholder;
maxTagTextLength усекает только строку/число. FormData по-прежнему содержит raw values.

[48 исходных сценариев / 278 действий](../../../tests/browser/fixtures/ant-design-select-value-reference.json.gz),
[атомарные смены режима](../../../tests/browser/fixtures/ant-design-select-value-live-reference.json),
[SSR](../../../tests/browser/fixtures/ant-design-select-value-ssr-reference.json) и
[public owner disabled cache](../../../tests/browser/fixtures/ant-design-select-value-cache-native-reference.json)
сохраняют независимые наблюдения оригинала. Проверки:
[browser](../../../tests/browser/select-value.spec.ts), [hydration](../../../tests/browser/select-value-hydration.spec.ts),
[SSR/type contracts](../../../tests/package/select-value.ssr.test.ts) и
[фактическая прозрачность label](../../../tests/browser/select-value-opacity.spec.ts).
Native сохраняет скалярный текст закрытого input и его caret, текущий query владельца,
различие 0/"0" и disabled cache удалённого option. Searchable required проверяет наличие raw выбора, независимо от rich/пустой
отрисованной подписи. Rich содержимое остаётся DOM/Snippet;
оно не превращается в текст input. У оригинала после повторного открытия string "0"
физический selected marker ошибочно остаётся у numeric 0; это наблюдение сохранено,
Native следует raw value. AutoComplete не получает labelInValue/optionLabelProp.

### Оформление и состояние

Variant поддерживает outlined/filled/borderless/underlined в single/multiple/tags;
по умолчанию outlined. Явный variant имеет приоритет над настройками Form и provider. Смена оформления сохраняет DOM,
поисковый текст, выделение, фокус и выбранные значения формы. Классы и computed
styles сверены с официальным UMD 6.6.8 в
[браузерных проверках](../../../tests/browser/select-variants.spec.ts).
Общие [ConfigProvider.variant/Form.variant и Select config](../control-variants.md)
применяются после локальных props.

Непустой `prefixCls` задаёт локальные классы control, tags и popup; пустой или
undefined наследует `ConfigProvider.prefixCls`. CSS scope разделяет owner prefix
и общий namespace служебных переменных, сохраняя canonical theme variables.
Нынешние native wrapper, option buttons, FormData/reset и generated IDs сохранены.
Смена префикса сохраняет открытый список, query, text selection, focus и keyed options;
это действует также с локальным popup container и responsive tags.
[26 UMD-конфигураций](../../../tests/browser/fixtures/ant-design-select-prefix-reference.json)
в обычной, вложенной и reset областях сверяют single/multiple/tags, размеры,
варианты, status, aliases и открытые options. Дополнительный native compact bridge
сохраняет геометрию внешнего container. Проверки:
[browser](../../../tests/browser/select-prefix.spec.ts), [SSR](../../../tests/package/select-prefix.ssr.test.ts).

```svelte
<script lang="ts">
  import { Select } from 'antd-svelte';

  const options = [
    { value: 0, label: 'Разработка' },
    { value: 1, label: 'Дизайн' },
    { value: 2, label: 'Архив', disabled: true }
  ];
  let teams = $state<number[]>([0]);
</script>

<label for="teams">Команды</label>
<Select id="teams" mode="multiple" {options} bind:value={teams} name="teams" allowClear />
```

При source-настройках ConfigProvider Select применяет собственные tokens и aliases
к selector и dropdown: размеры tags/options, padding, цвета, focus border/outline,
стрелку и очистку. Поддерживаются component algorithm, custom CSS prefix, нули и
явный undefined. Смена темы сохраняет DOM поля/списка, ввод, выделение, фокус и
FormData. Native-only темы сохраняют прежнее оформление; style относится к внешней
обёртке. Подробности — в [описании темы](../theme-context.md#токены-select).

GetPopupContainer получает внутренний корень `.ant-select`. Локальная функция
перекрывает ConfigProvider.getPopupContainer; undefined наследует provider.
Список использует fixed native popover по умолчанию с шириной поля, обновлением положения,
outside/Escape и сохранением фокуса. Без getter сохраняется прежний DOM parent.
`placement` принимает bottomLeft/bottomRight/topLeft/topRight; по умолчанию
bottomLeft либо bottomRight в RTL. Getter не вызывается при SSR и до первого открытия.
ShadowRoot требует собственных стилей; смена функции с тем же контейнером
сохраняет DOM списка, поиск и выделение. Закрытие Select удаляет его список;
AutoComplete сохраняет смонтированный popup до unmount. Проверки обоих компонентов —
[select-container](../../../tests/browser/select-container.spec.ts), `?fixture=select-container`;
32 сценария сверены с официальным UMD Ant Design 6.6.8.

`popupMatchSelectWidth` выбирает ширину списка: `true` берёт ширину поля,
`false` подстраивает список под содержимое с шириной поля в качестве минимума,
число задаёт ширину в px с тем же минимумом. Отсутствующий prop и `undefined`
наследуют `ConfigProvider.popupMatchSelectWidth`; без настройки используется `true`.
Смена ширины сохраняет поле, выделение, фокус и выбранные значения формы.
Невалидная числовая CSS-ширина сохраняет последнее принятое значение, как React,
включая смену props закрытой посещённой панели и повторное открытие. До первого
открытия скрытый измерительный DOM AutoComplete/TreeSelect не создаёт такую историю.
ListHeight ограничивает внутренний viewport списка и по умолчанию равен 256 px;
фактические padding и border добавляются снаружи. ListHeight=0 снимает ограничение.
Virtual по умолчанию включён и наследует ConfigProvider.virtual. Собственный prop
перекрывает provider: явно переданный undefined, как в исходном Select, включает
default, даже если provider задаёт false. PopupMatchSelectWidth=false отключает
виртуализацию, числовой 0 её не отключает. ListItemHeight задаёт оценку ещё не
измеренных строк; default — token.controlHeight (обычно 32 px). Реальная высота
каждой отрисованной строки, включая группы AutoComplete, измеряется отдельно.
Нулевая оценка выключает окно, сохраняя исходный доступный listbox.

ShowScrollBar принимает true, false или 'optional'. Optional показывает полосу
при прокрутке и обращении к scrollTo и скрывает через 3 секунды. OnPopupScroll
получает native scroll event внутреннего holder; currentTarget и this — этот div.
При virtual=true доступный listbox содержит соседей активного пункта, а видимое
окно содержит измеренные строки. Virtual=false помещает все options в listbox.

Bind:this предоставляет SelectRef/AutoCompleteRef с focus(FocusOptions), blur()
и scrollTo(config). NativeElement и inputElement привязываются отдельно:
bind:nativeElement указывает на div.ant-select, bind:inputElement — на редактор.
ScrollTo(number) означает индекс; объект принимает index либо key, align
('top'/'bottom'/'auto') и offset — число или функцию от измеренных getSize.
Объект {top,left} задаёт позицию. Null/undefined показывают scrollbar без
изменения позиции. До первого открытия прокрутка не выполняется; закрытые
index/key-запросы игнорируются. Закрытая позиция {top,left} применяется после
открытия к реальному viewport. Это сохраняет согласованность DOM и окна вместо
воспроизведения ошибки rc-select 1.10.1 с разными offsets после reopen.

OnActive(value|null) сообщает активный пункт; defaultActiveFirstOption=true
в Select и false в AutoComplete. Несколько активаций за одну microtask оставляют
последний callback; после unmount callback не вызывается. Существующие native
значения, формы, controlled search при закрытии и синхронный blur сохраняются.

Поиск по умолчанию выключен в одиночном режиме и включён в multiple;
`showSearch` переопределяет это в single/multiple; tags всегда разрешает поиск,
включая `showSearch={false}`. Нажатие варианта во множественном режиме
добавляет или удаляет его, очищает поисковый текст и сохраняет открытый список
и фокус в поле. Дубликаты выбранных значений убираются при отображении,
порядок первого появления и типы сохраняются: числовой `0` и строковый `"0"`
различаются. Массив владельца при этом не переписывается.

Удаление кнопкой или Backspace при пустом поиске снимает доступное выбранное
значение; Backspace выбирает последнее доступное. Disabled options нельзя
выбрать или удалить отдельно, включая уже выбранные. `allowClear` показывает
общую очистку всех значений. После пользовательского изменения callback
получает новый массив; изменение этого массива не меняет привязку. Внешние
обновления value/options не вызывают onValueChange. Если выбранный option
временно отсутствует, сохраняются последнее известное имя и disabled-состояние
в single и multiple. При появлении option берутся актуальные label/disabled. Для
значения, которого ещё не было в options, показывается String(value). Кэш содержит
только выбранные значения; он очищается при снятии выбора.

Для отдельного control `defaultValue` принимает readonly-массив и копируется
один раз. При привязке задавайте начальное значение у владельца, без defaultValue;
для очистки передавайте `[]`. Нативный reset формы в multiple восстанавливает
defaultValue, а при его отсутствии — пустой массив, обновляет привязку и закрывает
список без callbacks. Связь с внешней формой через атрибут form тоже учитывается.
Отменённый reset не изменяет Select; Form модели сбрасывает значения через
resetFields. Одиночный режим сохраняет прежнее управление сбросом владельцем.

С name или FormItem.name каждое выбранное значение создаёт отдельное поле
FormData под тем же именем. Используйте `new FormData(form).getAll('teams')`:
результат содержит строки, например `['0', '1']`. Пустой выбор даёт `[]`,
disabled control не передаёт значения. Поисковый текст в FormData не попадает.
Нативный required в multiple проверяет наличие выбранных значений, включая 0,
и не требует текста в поиске. Подпись удаления задаёт `locale.removeText`,
сообщение нативного required — `locale.selectRequiredText`.

В Form передавайте `value={form.values.teams}` и
`onValueChange={(value) => form.setFieldValue('teams', value)}`. Задайте тип
массива явно, например `createForm<{ teams: number[] }>({ initialValues: { teams: [] } })`.
`required` отклоняет пустой массив, min/max ограничивают количество элементов.
Галерея `/ant-design` содержит форму выбора от одной до трёх команд с отправкой
и сбросом.

### Видимость списка Select

DefaultOpen задаёт только начальную видимость. Open управляет видимостью;
onOpenChange сообщает запрос, который владелец может принять либо отклонить.
Для двустороннего состояния Svelte используется bind:open. Внешняя замена open
и начальное открытие не вызывают onOpenChange и не переводят фокус в поле.

```svelte
<script lang="ts">
  import { Select } from 'antd-svelte';
  let open = $state(false);
  const options = [{ value: 'a', label: 'Alpha' }];
</script>

<Select {options} bind:open />
<!-- Владелец может принимать только разрешённые запросы. -->
<Select {options} {open} onOpenChange={next => { open = next; }} />
```

Open имеет приоритет над defaultOpen. Удаление controlled open возвращает закрытое
uncontrolled состояние, как исходный useControlledState. Смена defaultOpen после
mount не переоткрывает список. Disabled скрывает popup; uncontrolled состояние
закрывается и не возвращается после enable, explicit open=true сохраняет запрос
владельца и снова показывает popup после enable. Эти переходы не создают callbacks.
Внешнее закрытие single очищает внутренний поиск; controlled search меняет владелец.
Input DOM, выбранные values и focus сохраняются. Активный пункт при внешнем открытии
учитывает выбранное single value; ArrowUp при пользовательском открытии сохраняет
прежнее Native поведение перехода к последнему enabled option.

При пустой выдаче notFoundContent=null/false/пустая строка скрывает popup, не сбрасывая
raw open и ввод. После появления options он становится видимым. Число 0 остаётся
видимым содержимым; исходный Select ошибочно скрывает его из-за проверки falsy.
NotFoundContent принимает общий RenderEmptyContent, включая boolean и readonly arrays.
Форма по-прежнему сбрасывает multiple/tags без callbacks; bind:open при этом закрывается.
Явный controlled open продолжает принадлежать владельцу.

SSR всегда выводит aria-expanded=false без popup и без вызова optionRender/getter.
После mount применяется актуальное состояние. Source React откладывает закрытие
через MessageChannel; прежнее немедленное Native закрытие сохранено.
Эталоны: [25 client/React SSR сценариев](../../../tests/browser/fixtures/ant-design-select-open-reference.json).
Проверки: [браузер](../../../tests/browser/select-open.spec.ts),
[SSR и публичные типы](../../../tests/package/select-open.ssr.test.ts).

### Содержимое пунктов Select

OptionRender задаёт пассивный Snippet внутри существующего native option button.
Он получает `(option, { index })`: key/value/raw label, data с record текущей выдачи
и groupOption=true у детей группы, false у плоских пунктов. Для header renderer не вызывается.
Key следует правилам общего слоя данных. Дополнительные data-поля и mapped label
имеют тип unknown, поэтому сложные значения требуют обычного TypeScript narrowing.

```svelte
<script lang="ts">
  import { Select, type SelectFlattenOption } from 'antd-svelte';
  const options = [{ value: 'happy', label: 'Happy', emoji: '😄' }];
</script>

{#snippet optionRender(option: SelectFlattenOption<string>, info: { index: number })}
  <span aria-hidden="true">{option.data.emoji}</span> {option.label} ({info.index + 1})
{/snippet}
<Select {options} {optionRender} />
```

Index относится к текущему порядку после фильтрации и сортировки. Обычный data сохраняет
ссылку на исходный option; filter/sort могут создавать Source shallow copies групп.
Key и дополнительные поля сохраняются; maxCount меняет
доступность кнопки, но не raw disabled внутри data. Для synthetic tags и выбранных
значений вне options передаётся соответствующий временный объект. Selected label,
token matching, callbacks и FormData используют прежние данные, независимо от
Snippet. Пустой renderer оставляет выбираемый пункт без содержимого. Вложенные
интерактивные controls не допускаются семантикой native option button.

Renderer и его отключение обновляются в открытом списке без потери input,
query, selection и focus. В закрытом SSR optionRender не вызывается.
Native value keys и оформление пунктов сохранены. Groups/fieldNames и raw option attrs
подключены общим data pipeline; semantic slots описаны ниже.
Основа — [16 исходных случаев](../../../tests/browser/fixtures/ant-design-select-option-render-reference.json),
[браузерные проверки](../../../tests/browser/select-option-render.spec.ts) и
[SSR/типизация](../../../tests/package/select-option-render.ssr.test.ts).

### Popup и семантическое оформление

`popupRender` — обычная чистая функция, получающая origin-menu Snippet. Она
может вернуть его, scalar/array или Snippet с origin-menu аргументом:

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Select } from 'antd-svelte';
  const options = [{ value: 'reader', label: 'Reader' }];
</script>

{#snippet popup(originMenu: Snippet)}
  <section>
    <header>Роли</header>
    {@render originMenu()}
    <footer>Дополнительная информация</footer>
  </section>
{/snippet}

<Select {options} prefix="Роль" popupRender={() => popup}
  classNames={({ props }) => ({ root: props.disabled ? 'blocked' : 'available' })}
  styles={{ input: { color: 'navy' }, popup: { root: { maxHeight: 320 } } }} />
```

Функция вызывается и при закрытой панели, включая SSR; возвращённый Snippet
создаёт DOM после первого открытия и сохраняет своё состояние при закрытии.
Смена или удаление renderer у закрытой посещённой панели применяется к её
содержимому при следующем открытии. Snippet сохраняет обычную Svelte-реактивность.
Null/undefined/false/пустая строка оставляют пустую пользовательскую панель,
а не возвращают стандартное меню. Без origin-menu стрелки и Enter не выбирают
пункты, Escape не закрывает эту панель; blur/outside сохраняют обычное поведение.
Пользовательский popup сбрасывает FormItem status/feedback и Compact, сохраняя Form disabled/variant
и содержимое errors/warnings.
Стандартная панель Select сохраняет прежнее размонтирование при закрытии до
первого использования пользовательского popup; затем сохраняется и при возврате
к стандартному меню. AutoComplete сохраняет посещённую стандартную панель.

`classNames` и `styles` принимают объект либо чистую функцию `({ props }) => map`.
Metadata сохраняет заданные props с разрешёнными variant/status/disabled/size;
функции работают и при SSR. Metadata Select не различает отсутствие `value`/`open`
и явный `undefined`.
Slots Select: root/prefix/suffix/input/placeholder/
content/item/itemContent/itemRemove/clear и popup.root/list/listItem.
`classNames.popup` также принимает строку. `prefix` — scalar/array/Snippet;
falsy scalar, включая 0, не создаёт affix.

CSS objects принимают camelCase свойства, числа и custom properties; собственный
undefined удаляет ранее заданное свойство. Обновляются изменённые свойства,
поэтому порядок shorthand/longhand и предыдущие записи сохраняют поведение
React. В Select object style и semantic root оформляют сам control, прежние
string style и class — внешний Native container; у AutoComplete это один root.
RootClassName применяется к control и popup.

В multiple/tags с семантическим оформлением ширина input пересчитывается при
изменении поискового текста; смена одного fontSize не запускает измерение.
Как в Ant Design, измерение очищает inline `styles.input.width`. Повторное
задание того же width не восстанавливает его до следующего изменения значения
этого свойства. SSR выводит заданную width без измерения.

`ConfigProvider.select` задаёт общие class/style, classNames/styles, variant,
showSearch, иконки и boolean/object allowClear. Локальные значения перекрывают общие; вложенный
явно заданный select record заменяет родительский. AutoComplete использует этот
же config, сохраняя собственный allowClear=false по умолчанию.

### Иконки и очистка Select

Select и AutoComplete поддерживают `suffix`, `suffixIcon`, `loadingIcon`,
`showSearch.searchIcon`, `menuItemSelectedIcon` и `allowClear={boolean | { clearIcon, label }}`.
В multiple/tags Select также принимает `removeIcon`. Иконки, кроме `suffix`,
наследуются из `ConfigProvider.select`; локальный prop имеет приоритет.
Вложенный select record заменяет родительский целиком.

`SuffixIcon` меняет стандартный значок. При отсутствии локального значения
загрузка выбирает loadingIcon, открытый поиск — searchIcon, иначе используется
provider suffixIcon или стрелка. Локальный `suffixIcon={null}` скрывает значок;
при Form feedback обёртка остаётся для feedback. `Suffix` задаёт содержимое целиком,
включая замену feedback. Его null/undefined возвращают стандартный выбор.

`Suffix`, `menuItemSelectedIcon` и `removeIcon` принимают scalar/array либо чистую
функцию, возвращающую scalar/array/Snippet. Статический Snippet в этих трёх props
передавайте внутри массива или возвращайте из producer; функция считается producer.
В остальных icon props Snippet передаётся напрямую.

```svelte
<script lang="ts">
  import { Select, type SelectSuffixInfo } from 'antd-svelte';
  let value = $state('a');
  const options = [{ value: 'a', label: 'Alpha' }];
</script>
{#snippet arrow()}<span aria-hidden="true">⌄</span>{/snippet}
<Select {options} bind:value suffix={(info: SelectSuffixInfo) => info.loading ? '…' : arrow}
  allowClear={{ clearIcon: '×', label: 'Очистить выбор' }} aria-label="Значение" />
```

Suffix producer получает один новый объект с собственными полями
`{ searchValue, open, focused, showSearch, loading }`; отсутствующая loading остаётся
undefined. Функция вызывается также при закрытом control и SSR, поэтому не должна
изменять состояние. В AutoComplete searchValue — основное value, без временного
backfill. Omitted suffixIcon у AutoComplete скрывает стандартную иконку, включая
provider defaults; собственный `suffixIcon={undefined}` включает стандартный выбор.
Собственный suffix и Form feedback работают при этом независимо.

MenuItemSelectedIcon producer получает `{ value, disabled, isSelected }` для
каждого leaf option; value учитывает fieldNames, disabled — состояние строки и
maxCount. AutoComplete передаёт isSelected=false. Статическая truthy иконка видна
только у выбранного пункта; возвращённый producer undefined использует исходный
fallback. RemoveIcon producer вызывается с одним аргументом undefined только
для кнопки удаления обычного closable tag; custom tagRender и сводный tag его не вызывают.
Стандартные SVG, wrapper classes и обработка мыши следуют Ant Design 6.6.8.

AllowClear object заменяет содержимое и доступное имя кнопки. Falsy clearIcon
использует «×»; label='' сохраняет пустую строку, null/undefined используют 'Clear'.
Boolean true сохраняет локализованное имя Native; прежний AutoComplete Snippet
clearIcon без label также сохраняет его. При очистке multiple/tags, уже достигшего
maxCount, очищается выбор, а старый поиск не сбрасывается и onSearch не вызывается.
Controlled search меняет владелец. Прежний single Select с локальным управляемым
поиском сохраняет query при очистке выбранного значения без дополнительного onSearch('');
после закрытия этот скрытый query не оставляет видимой кнопку очистки.
OnInputKeyDown получает input event после исходного prevention стрелок;
его preventDefault не отменяет навигацию, а stopPropagation прекращает её
в открытом списке. Нативный Select onkeydown по-прежнему может отменить обработку.
Пользовательские иконки сохраняют mousedown/click и фокус editor при выборе;
это также проверяется с обычными декларативными обработчиками Svelte.

[Браузерная сверка](../../../tests/browser/select-icons.spec.ts) охватывает 15 React owners
и 195 действий, [SSR](../../../tests/package/select-icons.ssr.test.ts) — 142 состояния.
[Дополнительные проверки](../../../tests/browser/select-icons-edges.spec.ts) фиксируют
closed tags submit, maxCount и keyboard hooks. Полные Original записи сохранены
без потерь в gzip; [manifest](../../../tests/browser/fixtures/ant-design-select-icons-source-manifest.json)
содержит хеши и независимые повторы, включая реальный дополнительный pure-menu pass.
Согласованные Native editor/ref/buttons, локализованные имена и немедленное закрытие
сохранены. [Отдельный manifest](../../../tests/browser/fixtures/ant-design-select-icons-boundary-source-manifest.json)
описывает public React counterparts для простого empty и закрытия родителем;
они не заменяют исходный корпус.

### Замена root и input Select

Select и AutoComplete принимают `components={{ root, input }}`. `input` заменяет
редактор внутри стандартного поля. `root` заменяет поле целиком: стандартные
input, content, prefix, suffix и clear не создаются, `components.input` не вызывается.
Чистые `suffix`, semantic `classNames` и `styles` продолжают вычисляться, включая SSR.
Ввод текста в custom root сам по себе не меняет поиск или выбранное значение.

Slot принимает строку тега, Snippet с `{ attributes, register }`, `{ render, props }`
либо `{ element, props, ref }` для нативного элемента. Attributes используют имена
Svelte DOM: `class`, `oninput`, `onkeydown`, `onfocusin`/`onfocusout` и строковый CSS style.
Типы [SelectComponents, SelectRootContext и SelectInputContext](../../../src/lib/select-components.types.ts)
экспортируются из пакета; DOM generics добавлены после прежних параметров типов.

```svelte
<script lang="ts">
  import { Select, type SelectInputContext } from 'antd-svelte';
  const options = [{ value: 'a', label: 'Alpha' }];
</script>
{#snippet editor({ attributes, register }: SelectInputContext<HTMLTextAreaElement>)}
  {@const { value, ...rest } = attributes}
  <textarea {...rest} {value} rows="3" {@attach register}></textarea>
{/snippet}
<Select {options} components={{ input: editor }} aria-label="Значение" />
```

Применяйте переданные attributes и регистрируйте реальный DOM через attachment.
`register` возвращает cleanup; при SSR attachments не выполняются.
Composite registration принимает `{ nativeElement, inputElement?, focus?, blur? }`.
`nativeElement`/`inputElement` остаются публичными bindable props; методы доступны
через `bind:this`. У composite без `focus`/`blur` соответствующий метод ничего не делает:
автоматического вызова DOM-метода на `nativeElement` нет. Callback `ref` у element
descriptor получает DOM при подключении и null при очистке; повторный React composeRef detach/attach
при сохранённом DOM не воспроизводится.

Generated attrs root перекрывают собственные `props`, внутренние callbacks идут
перед собственными. Root не получает generated id/class/style/value/disabled/placeholder;
нужные свойства полного replacement задаёт его renderer. У input собственные `props`
перекрывают generated attrs, включая value/class/style, и собственные callbacks идут первыми.
`SelectInputOwnProps` допускает `style: SelectStyle`: CSS object, строку или null.
Передаваемый `context.attributes.style` остаётся CSS-строкой; own style root
сохраняет прежний DOM-тип.
Для AutoComplete существующий `children(control)` имеет приоритет над input slot;
его прежний register action сохраняется.

[Эталон и manifest](../../../tests/browser/fixtures/ant-design-select-components-source-manifest.json)
содержат 13 независимо повторённых owners, 138 действий и 51 SSR-состояние
для single Select и combobox. [Отдельная SSR→hydration сверка](../../../tests/browser/select-components-hydration.spec.ts)
добавляет 6 owners и 34 действия: pre-hydration draft/caret, defaultValue,
textarea/composite refs, DOM identity при hydrate и replacement, события и cleanup.
[Original manifest](../../../tests/browser/fixtures/ant-design-select-components-hydration-source-manifest.json)
сохраняет обе SSR-сериализации и независимый whole-byte-equal повтор.
При замене input на root blur исчезающего default root не вызывается.
При полном удалении сфокусированного AutoComplete сохранён прежний синхронный
connected Native blur до DOM removal/onDestroy; Source не вызывает blur.
Исходный поздний onOpenChange(false) после удаления сохранён raw; Native отменяет
pending close и не вызывает поздние callbacks.
[Отдельный Original-корпус multiple/tags](../../../tests/browser/fixtures/ant-design-select-components-modes-source-manifest.json)
содержит 6 owners, 72 действия и 29 SSR-состояний с input/textarea и function/element slots.
Native сохраняет раздельные значения и keys для `1` и `'1'`. Канонический Source tags
после React key collision оставляет в popup дополнительную устаревшую строку `Number one`.
[Парный Original с явными option.key](../../../tests/browser/fixtures/ant-design-select-components-modes-keyed-source-manifest.json)
снят отдельно: 6 owners/72 действия/29 SSR, first/repeat побайтно совпадают.
Он используется только для popup DOM после точного collision gate; root/editor/layout,
model, events и producer ledgers сверяются с исходным Source. Обе полные raw версии
сохраняются. Все 6 Source CSR diagnostics относятся к disabled и numeric tags.
Измерение ширины зависит от входного value/syncWidth; обновление только own width
применяет CSS без нового измерения. CSSOM сохраняет историю logical props отдельно
от ширины, очищенной измерением. [Composite probe](../../../tests/browser/fixtures/ant-design-select-components-modes-composite-reference.json.gz)
сохраняет отдельный Source CSR TypeError при чтении handle.style и одно успешное SSR-состояние.
[Два Native safety-случая](../../../tests/browser/select-components-modes-composite-safe.spec.ts)
измеряют физический typed textarea за composite handle без style/scrollWidth shim.
[Original-корпус own style AutoComplete](../../../tests/browser/fixtures/ant-design-select-components-ac-style-source-manifest.json)
содержит 2 owners, 20 действий и 16 SSR-состояний: при syncWidth=false own width
сохраняется после ввода, disabled и clear. Без input slot сохраняется прежний
Native путь стандартного редактора и тегов.
[Корпус инициализации CSS-объектов](../../../tests/browser/fixtures/ant-design-select-components-own-style-init-source-manifest.json)
содержит 2 intrinsic редактора, 8 клиентских путей и 96 действий, а также
2 начальных SSR-состояния с обеими сериализациями React. Он охватывает CSR,
обычную гидратацию, различающиеся CSS-объекты сервера и клиента и изменение
DOM-стиля перед гидратацией. CSR применяет свойства в исходном порядке;
гидратация сохраняет фактический CSSOM и исходный текст style до первого
изменения стилей. Клиентские props отдельно задают историю последующих setter updates.
Intrinsic INPUT/TEXTAREA при CSR используют динамические элементы Svelte.
При гидратации публичный Svelte `createRawSnippet` получает исходный редактор
непосредственно из текущего SSR-поддерева, сохраняя DOM, фокус и выделение.
SSR разметку input/textarea по-прежнему создаёт компилятор Svelte. Прежние root-ветки,
DOM-строка `context.attributes.style` и CSS-string API сохранены. Публичный ref
видит начальные стили и textarea defaultValue до измерения ширины.
Повторы CSR/гидратации отличаются только порядком computed custom properties,
который [CSSOM не определяет](https://drafts.csswg.org/cssom/#dom-window-getcomputedstyle):
все имена, значения и priorities проверяются, порядок обычных computed properties,
авторских inline declarations и DOM-атрибутов остаётся строгим. Оба полных raw
варианта сохранены. Прежние Native light scheme, private token aliases и
[исключение deprecated seed vars](../design-tokens.md) учитываются отдельно.
Отдельные минифицированные клиентская и SSR-сборки публичного пакета проверены
на тех же 8 путях и 96 действиях. Два SSR-состояния не обращаются к DOM;
после удаления и через 1000 ms все учитываемые observers, timers, frames и ports
освобождены. [Проверка режима сборки](../../../tests/package/select-components-own-style-popup-build-mode.test.ts)
явно различает фиксированные dev/prod hash-классы popup; остальные классы,
их порядок, CSSOM и геометрия проверяются по прежнему эталону.
[Отдельный корпус владения гидратацией](../../../tests/browser/fixtures/ant-design-select-components-hydration-ownership-source-manifest.json)
проверяет независимые SSR-корни в одном документе и прямые targets в открытом
и закрытом ShadowRoot без обязательного `idPrefix`. Он содержит 12 сценариев,
16 гидратируемых корней и 60 действий; два полных Original-повтора побайтно совпадают.
Проверяются исходный editor, первый authored ref, фокус, value/defaultValue,
выделение и CSSOM, обновления, замена тега и независимая очистка корней.
React layout commit и Svelte onMount, SyntheticEvent/native DOM event и deprecated
getter свободной AutoComplete option сверяются через отдельные точные границы;
оба полных raw снимка сохраняются.
[20 Native-регрессий обновления редактора](../../../tests/browser/select-components-controlled-removal.spec.ts)
проверяют own `undefined`/`null`, value/defaultValue, checked/defaultChecked и тело textarea.
Начальная гидратация следует измеренной семантике React; последующие setters сохраняют
прежнее поведение Svelte, включая отдельные правила defaults для CSR и гидратации.
Общая гидратация family остаётся partial.
[Отдельный responsive Original-корпус](../../../tests/browser/fixtures/ant-design-select-components-responsive-source-manifest.json)
содержит 2 owners, 12 действий и 2 initial SSR-состояния; first/repeat побайтно совпадают.
Он охватывает direct input и Fragment с live adornment: fitting измеряет весь suffix,
сохраняет Source rest-width cache, offset и render cap. При SSR data tag wrappers
не создаются, rest «+ 4 ...» скрыт, suffix имеет order 0. При initial open сначала
публикуется измеренная ширина ещё закрытого input, затем открывается список.
Сохраняются Native remove accessibility/inert и cleanup. В CSR позиция одного style-атрибута
generated INPUT выделена как Blink lazy CSSOM boundary; в SSR отдельно учитывается
Svelte style-attribute hoist у responsive wrappers. Две точные пустые Text anchors
этих CSR snippets проверяются по compiler topology; authored text и SSR/hydration не затрагиваются.
Остальные attrs, порядок/значения CSS declarations, CSSOM, boxes и полные raw остаются строгими.
Браузерные сверки выбирают измеренный Original для точной версии Chromium 156 или 157:
у двух INPUT-случаев изменились clientWidth/scrollWidth, поэтому для них сохранены
отдельные полные записи Ant Design; прежние эталоны не заменены.
[Корпус custom tagRender и leading prefix](../../../tests/browser/fixtures/ant-design-select-components-responsive-tag-prefix-source-manifest.json)
добавляет 2 owners, 18 действий, 20 CSR-точек и 2 SSR-состояния с обеими
сериализациями React. Измеряется весь Fragment-тег; ведущий prefix находится
вне Overflow. Проверяются изменение ширины контейнера, prefix и тегов,
поиск, восстановление prefix и реальное удаление тега. Все DOM/CSSOM/geometry
снимки двух Source-повторов совпадают; повторные и переставленные эквивалентные
вызовы render-функций и их исходные raw graphs сохранены отдельно.
Аргумент tagRender сохраняет семь собственных полей в порядке Source;
у rest value/index/onClose присутствуют со значением undefined.
При components.input закрытие custom tag откладывается через MessageChannel,
поэтому onOpenChange(false) следует после удаления. Оба ports закрываются
после вызова или отмены; удаление компонента отменяет pending callback.
[Три проверки ресурсов](../../../tests/browser/select-components-tag-close-safety.spec.ts)
закрепляют обычное закрытие, отмену через Escape и немедленный unmount.
[Отдельный Source counter](../../../tests/browser/fixtures/ant-design-select-components-tag-close-key-counter-source-manifest.json)
и [три клавиатурные регрессии](../../../tests/browser/select-components-tag-close-key.spec.ts)
проверяют отмену pending close при уже открытом меню: ArrowDown отменяет задачу,
ArrowUp и Ctrl+ArrowDown позволяют ей завершиться. Оба Source-повтора сохраняются
полностью; совпадает измеренная key/open/event-name проекция, полное равенство
хронологии render calls не заявляется.
Отдельные минифицированные client/SSR-сборки публичного пакета проходят
те же 18 действий, 20 CSR-сравнений и 2 SSR-состояния без DOM/resources.
После удаления обоих owners и через 1000 ms нет учитываемых observers,
mutations, frames, timers или открытых ports; callback- и ref-ledgers тихие.
Общая responsive-матрица, disabled/stale custom callbacks и сложные сочетания
style/hydration требуют дальнейшей сверки.
[Source-корпус сохранённых onClose](../../../tests/browser/fixtures/ant-design-select-components-tag-close-handles-source-manifest.json)
добавляет 2 owners, 12 действий, отдельное сохранение callback после initial settle
и 2 initial SSR-состояния; CSR и SSR first/repeat совпали побайтно.
При components.input callback сохраняет display-record, а удаление читает текущие
records. Вызов для closable=false разрешён; устаревший callback сохраняет модель
и отправляет onDeselect с текущей option. Отдельный cached-option counter сохраняет
прежний payload после удаления option из options. Обычный Native remove и его
disabled guards сохранены. Полные аргументы, descriptors, alias identities,
события, DOM/CSSOM и все исходные diagnostics остаются в raw.
При omitted maxTagCount Source создаёт неиспользуемый rest ReactElement через
tagRender, но не монтирует его body/DOM. Неисполняемый Svelte Snippet не имитирует
эти вызовы; Source-only rest records сохранены с точной проверкой семи полей
и отсутствия body/DOM.
[Browser](../../../tests/browser/select-components-tag-close-handles.spec.ts) и
[SSR](../../../tests/package/select-components-tag-close-handles.ssr.test.ts) закрепляют этот объём;
[negative guards](../../../tests/package/select-components-tag-close-handles-boundaries.test.ts)
отклоняют потерянные поля, изменённые aliases и поддельные rest-вызовы.
Прочие сочетания callbacks и renderer API остаются partial.
[Browser](../../../tests/browser/select-components.spec.ts) и
[SSR](../../../tests/package/select-components.ssr.test.ts) проверяют replacement DOM, события,
полные attrs/producer ledgers, refs и cleanup. Полный перенос Select/AutoComplete
ещё не завершён: оставшиеся callback/search и motion возможности отмечены в реестре.

### Tags

```svelte
<script lang="ts">
  import { Select } from 'antd-svelte';
  let tags = $state<string[]>([]);
</script>

<Select mode="tags" options={[]} bind:value={tags} name="tags" allowClear />
```

Tags сохраняет multiple UI, native FormData/required/reset, удаление, disabled,
RTL и selected cache. Без options используется пустой массив; свободные строки
дополняют его временными вариантами. Выбранные значения вне текущей выдачи доступны в списке
с сохранёнными label/disabled. Число 0 и строка "0" остаются разными ключами.
По умолчанию tags фильтрует value через uppercase substring, как source. Для
поиска по подписи задайте showSearch.optionFilterProp="label"; string[] объединяет
собственные поля через OR. В single/multiple без явных полей сохранён прежний
label/NFKD поиск. Predicate filterOption перекрывает выбор полей.

ShowSearch.filterSort сортирует результат фильтрации, включая выбранные отсутствующие
options и synthetic tags. Comparator `(optionA, optionB, { searchValue }) => number`
получает исходные объекты options и текущий поисковый текст; возвращаемое число
следует правилам Array.sort. Равные элементы сохраняют исходный порядок, массив
владельца не изменяется. Без comparator сохраняется прежний порядок. Смена callback,
options и query отражается в открытом списке без пересоздания input или изменения
выбранных значений. При controlled search comparator получает принятую владельцем
строку. [Эталон порядка](../../../tests/browser/fixtures/ant-design-select-sort-reference.json)
получен из официального UMD 6.6.8. Group sort повторяет Source: рекурсия обходит
literal options, переименованное поле children этой рекурсией не используется.

Enter выбирает активный вариант, включая новый. В неуправляемом закрытом списке
сохраняется прежнее Native открытие и выбор первого варианта тем же Enter.
При управляемом open закрытый Enter сначала отправляет непустой trimmed ввод,
затем вызывает onInputKeyDown и запрашивает открытие, как исходный input submit.
Повторный выбор активного выбранного варианта снимает его.
Blur добавляет trimmed строку без дубликата; Escape закрывает
список и сохраняет ввод. Source сохраняет пробелы в выбранном варианте списка,
но обрезает их на blur; это различие сохранено. Новый whitespace-only вариант
не создаётся: исходная ошибка записана в raw reference, явный option с таким value
остаётся допустимым. Clear очищает также pending search и сообщает onSearch(''),
кроме очистки уже достигнутого maxCount, не создавая tag; controlled search
по-прежнему меняет владелец. React откладывает закрытие через MessageChannel:
быстрый Escape/Enter может выбрать исходный вариант с пробелами, а Enter после
завершения закрытия обрезает ввод. Native сохраняет немедленное закрытие и
прежний выбор первого варианта в неуправляемом режиме; оба React наблюдения
сохранены в manifest и проверках tags без замены старого raw reference.

ShowSearch.autoClearSearchValue=false сохраняет поиск при выборе и Escape в
multiple/tags. Blur multiple очищает локальный поиск без callback, blur tags
завершает ввод. Остальные selection/blur/reset пути не вызывают onSearch.
Сверка с [исходными options](../../../tests/browser/fixtures/ant-design-select-tags-options-reference.json)
и [событиями](../../../tests/browser/fixtures/ant-design-select-tags-interaction-reference.json)
использует неизменённый UMD 6.6.8; логика изучена по @rc-component/select 1.10.1,
его MIT-лицензия уже включена в пакет.

### Разделители ввода

TokenSeparators работает в multiple/tags: readonly массив разделителей или функция
`(input: string) => readonly string[]`. Найденный разделитель завершает все части
строки, включая последнюю; значения дополняют выбор без дубликатов, popup закрывается.
В tags части становятся string values, в multiple принимаются только существующие
options с совпавшим label либо явно заданным showSearch.optionFilterProp. Числовой
ключ не совпадает со строкой автоматически; raw пробелы непустых частей сохраняются.

```svelte
<Select mode="tags" options={[]} bind:value={tags} tokenSeparators={[',', ';', '\n']} />
```

Функция получает всю строку, включая восстановленные переносы вставленного текста.
Пустой результат или единственная неизменённая строка оставляют обычный поиск.
При IME разделение откладывается до compositionend. После разделения локальный
поиск очищается независимо от autoClearSearchValue; controlled search меняет
владелец. OnValueChange предшествует onSearch(''); последний вызывается, только
если до ввода поисковая строка была непустой. Разделённый ввод не отправляет
промежуточный onSearch с полной исходной строкой.

Native paste/composition handlers сохраняют receiver input и preventDefault.
[Raw наблюдения Source](../../../tests/browser/fixtures/ant-design-select-token-separators-reference.json)
включают два намеренно исправленных случая: multiple не добавляет disabled option,
а tags не создаёт неявный whitespace-only value. Уже выбранные disabled значения
сохраняются, явный пробельный option допускается; дефекты upstream остаются в raw data
для отдельного разбора.

### Длина текста тегов

MaxTagTextLength ограничивает только видимый текст multiple/tags и добавляет
исходное `...` при усечении. Полные label/title, имена кнопок удаления и values
сохраняются. Single игнорирует ограничение. Длина считается в UTF-16 units, как в
rc-select; Native дополнительно не разрывает корректную surrogate pair. Усечённая
половина emoji исключается целиком, сохраняя остальные правила slice, включая
combining/ZWJ текст. Это не подсчёт grapheme clusters.

[Общие эталоны Select/Cascader](../../../tests/browser/fixtures/ant-design-select-tag-text-reference.json)
включают исходные broken-pair результаты. Изменение длины не пересоздаёт input,
не меняет выбранные значения и не вызывает value callbacks.

### Количество видимых тегов

MaxTagCount ограничивает отображение multiple/tags числом либо значением responsive;
остальные выбранные values остаются в FormData, reset, cache и Backspace.
Сводный тег по умолчанию
показывает `+ N ...` без кнопки удаления. MaxTagPlaceholder заменяет его строкой,
числом, boolean либо Snippet со скрытыми SelectOmittedTag в исходном порядке.
У записей сохраняются typed value/key, полный label и disabled. Null/undefined
выбирают default; false оставляет пустой сводный тег. Scalar content задаёт title,
Snippet управляет своим содержимым. Single игнорирует обе настройки.

```svelte
<script lang="ts">
  import { Select, type SelectOmittedTag } from 'antd-svelte';
  let tags = $state<string[]>([]);
</script>

{#snippet omittedTags(omitted: SelectOmittedTag<string>[])}
  <span>Hidden: {omitted.map(tag => tag.label).join(', ')}</span>
{/snippet}
<Select mode="tags" options={[]} bind:value={tags} maxTagCount={2}
  maxTagPlaceholder={omittedTags} />
```

Числовое ограничение следует Array.slice Source, включая fractional/negative count;
NaN сохраняет весь список вместо исходного исчезновения tags. Скрываемая native
кнопка удаления передаёт фокус input, если владелец не выбрал другой control.
[Эталоны](../../../tests/browser/fixtures/ant-design-select-tag-count-reference.json) сохраняют
Source NaN и responsive observations.

MaxTagCount="responsive" измеряет доступную ширину, tags, сводный тег и текущий
ввод через общий с Cascader ResizeObserver/RAF механизм. Скрытые tags остаются
измеряемыми вне flow, с aria-hidden/inert; до браузерного измерения SSR показывает
все выбранные значения. Смена ширины, текста и поиска не меняет values или DOM input;
ресурсы очищаются при выходе из responsive/unmount.
Измеряются только собственные элементы content; controls внутри maxTagPlaceholder
не заменяют поисковое поле при расчёте ширины. Сначала проверяется, помещается
ли весь список: длинный custom rest не скрывает теги, для которых хватает места.
[Raw геометрия](../../../tests/browser/fixtures/ant-design-select-responsive-tags-reference.json)
сохраняет это исключение upstream с отдельными замерами доступной и занятой ширины.

### Пользовательский рендер тегов

TagRender — Svelte Snippet с SelectTagInfo. Обычный tag получает typed value,
index, option disabled, closable и onClose(event?). Label — Snippet с уже усечённым
текстом. Сводный tag получает isMaxTag=true, disabled=false, closable=false,
с собственными value/index/onClose: undefined; его label использует maxTagPlaceholder. Single игнорирует
renderer. Исходные selected values и поля формы сохраняются.

```svelte
<script lang="ts">
  import { Select, Tag, type SelectTagInfo } from 'antd-svelte';
  let values = $state<string[]>(['a']);
</script>

{#snippet customTag(info: SelectTagInfo<string>)}
  <Tag closable={info.closable} disabled={info.disabled} onClose={info.onClose}
    onmousedown={event => {
      event.preventDefault();
      event.stopPropagation();
    }}>{@render info.label()}</Tag>
{/snippet}
<Select mode="tags" bind:value={values} tagRender={customTag} />
```

Mousedown custom wrapper переключает popup без принудительного фокуса input;
обработчик дочернего control может остановить его, как в примере. OnClose удаляет
разрешённое значение, сохраняя текущий фокус; стандартные Native remove buttons
по-прежнему возвращают фокус input. Renderer управляет собственными стилями,
title и доступными controls. Numeric/responsive overflow и смена renderer после
mount сохраняют поиск и DOM input.

[Raw metadata/events](../../../tests/browser/fixtures/ant-design-select-tag-render-reference.json)
сохраняют source disabled-click, отправляющий onOpenChange(true) при закрытом popup.
Native disabled не отправляет запрос открытия. Согласованный single label в input
также сохраняется; React использует отдельный span.

### Ограничение выбора

MaxCount задаёт максимум выбранных значений в multiple/tags; single его игнорирует.
На лимите новые варианты недоступны, выбранные enabled options можно снять,
удаление и clear продолжают работать. Поисковый ввод на лимите не меняет query и
не вызывает onSearch. Переданные value/defaultValue, включая значения сверх
уменьшенного лимита, сохраняются. Смена лимита обновляет список без пересоздания
input, сброса фокуса или выбранных полей формы.

При tokenSeparators число сырых частей ограничивается оставшимися местами до
lookup, disabled-проверки и удаления дубликатов, как в Source: повтор или неизвестная
опция может оставить место незаполненным. Нулевой/отрицательный maxCount запрещает
новые добавления; NaN и undefined не задают лимит, Infinity его не ограничивает.

[Raw замеры](../../../tests/browser/fixtures/ant-design-select-max-count-reference.json)
сохраняют исходный обход maxCount через controlled search на Enter/blur.
Native не добавляет такие сверхлимитные tags; query по-прежнему меняет владелец.

### Удалённый поиск

Select принимает loading, notFoundContent и onPopupScroll. Поиск настраивается
через текущий API Ant Design 6.6.8: showSearch={{ searchValue, onSearch, filterOption }}.
Одноимённые deprecated top-level props удалены. Boolean showSearch включает
встроенный поиск. FilterOption=false
полностью отключает локальную фильтрацию, true сохраняет прежний поиск по label;
callback (search, option) позволяет собственную фильтрацию непустого запроса.
Для явных Source fields используется optionFilterProp, для поведения при выборе —
autoClearSearchValue в том же объекте showSearch.

SearchValue управляет текстом поиска, onSearch получает пользовательский ввод.
Владелец может отклонить запрос, оставив searchValue прежним; внешняя замена текста
не вызывает onSearch. Без searchValue используется внутренний текст. Выбор,
закрытие и reset по умолчанию очищают внутренний поиск без onSearch; исключения
tags/autoClearSearchValue описаны выше. При управляемом поиске
владелец сам очищает searchValue, если это нужно. Поисковый текст не попадает в
FormData и не меняет выбранные value. OnSearch не имеет встроенного debounce.

Loading показывает spinner и aria-busy, сохраняя доступность уже выданных options.
При пустой выдаче по умолчанию выводится локализованный текст loading/empty;
notFoundContent заменяет его общим RenderEmptyContent; null/false/пустая строка
скрывает пустой popup, 0 остаётся видимым.
При отсутствии local notFoundContent используется ConfigProvider.renderEmpty('Select');
его falsy результат выбирает simple small Empty. Без callback сохраняется прежний
локализованный текст. Остальные правила — в [общем справочнике](../render-empty.md).
Ошибка не является отдельным upstream prop: используйте status="error" и
notFoundContent, при необходимости внешний alert и кнопку повтора. Фокус в controls
кастомного пустого содержимого сохраняет popup, выход наружу закрывает его.
Native input blur-callback остаётся нативным. Для кнопки
внутри popup предотвращайте pointerdown default, если нужно сохранить фокус поля;
дублируйте действие вне popup для последовательной клавиатурной навигации.
OnPopupScroll получает native scroll event с currentTarget=listbox; решение о
следующей странице и объединение options остаются у потребителя.

```svelte
<Select options={remote.options} bind:value
  showSearch={{ searchValue: remote.searchValue, onSearch: remote.search, filterOption: false }}
  loading={remote.loading} notFoundContent={emptyState}
  onPopupScroll={event => {
    const list = event.currentTarget;
    if (list.scrollTop + list.clientHeight >= list.scrollHeight - 16) remote.more();
  }} />
```

Галерея /ant-design#select-remote использует отдельную
[presentation model](https://woodger.org/ant-design#select-remote)
с debounce, AbortSignal, защитой от поздних ответов
уже во время debounce, стабильным объединением страниц по value и повтором
последнего неудачного cursor. Dispose отменяет таймер/запрос. Источник демонстрационный,
сетевые API, таймеры и server-specific ошибки не входят в библиотечный Select.
Пока не перенесены остальные поля showSearch config, оставшиеся render/component
overrides, icons, motion и общий полный rc-select API.

## Checkbox

```svelte
<script lang="ts">
  import { Checkbox } from 'antd-svelte';

  let checked = $state(false);
  let indeterminate = $state(true);
</script>

<Checkbox bind:checked bind:indeterminate name="notifications" value="enabled">
  Получать уведомления
</Checkbox>
```

`checked` поддерживает привязку и callback `onCheckedChange(checked)`.
Для отдельного control можно задать `defaultChecked`; с привязкой задавайте
начальное значение у владельца. Нативный reset формы возвращает `defaultChecked`
и обновляет привязку. Сброс и внешние обновления props не вызывают
`onCheckedChange`; нативный `onchange` также доступен.

`indeterminate` задаёт смешанное состояние, поддерживает привязку и сбрасывается
при пользовательском переключении. Оно не меняет `checked` и значение FormData.
Отмеченный checkbox передаёт `name=value` (по умолчанию value равен `on`),
неотмеченный или disabled checkbox не включается в FormData.

В FormItem передавайте `checked={form.values.accepted}` и
`onCheckedChange={(value) => form.setFieldValue('accepted', value)}`. Для модели
с boolean задайте тип явно: `createForm<{ accepted: boolean }>(...)`.
Чтобы требовать именно `true`, используйте
`validator: (value) => value === true ? undefined : 'Подтвердите согласие.'`.
Встроенное правило `required` проверяет наличие значения, и `false` считается
заданным значением. `form.resetFields()` возвращает значение из `initialValues`.

OnChange получает `{ target, nativeEvent, stopPropagation, preventDefault }` с
типизированными target.checked/value. Нативный onchange остаётся отдельным DOM
событием. Callback Checkbox вызывается до Group.onChange; прежний onCheckedChange
и сброс indeterminate при пользовательском переключении сохранены. NativeEvent —
DOM change, а не React MouseEvent. Label/input используют исходный click bubble
lock; наружу приходит один click на активацию подписи.

ConfigProvider.checkbox задаёт class/style и semantic root/icon/label, в том числе
для вариантов Group и вложенного provider. Локальные classNames/styles принимают
объекты или функции от фактических checked/indeterminate/disabled props. Приоритет
root style: config.styles.root, config.style, styles.root, style. Title относится
к внутреннему span, как в исходном Checkbox; class/rootClassName/style — к label.
PrefixCls меняет классы; CSS для произвольного префикса предоставляет потребитель.

Bind:inputElement и bind:nativeElement возвращают input и внутренний span;
bind:ref — `{ input, nativeElement, focus(options?), blur() }`. Ссылки очищаются при
unmount. Focus/blur есть и у bind:this. AutoFocus вызывает native focus один раз
при mount; lowercase autofocus сохраняет HTML-поведение. TabIndex — alias tabindex.
OnFocus/onBlur/onKeyDown/onKeyPress работают на input, onMouseEnter/onMouseLeave —
на label. Нативные lowercase handlers сохраняются.

## CheckboxGroup

CheckboxGroup переносит выбор нескольких флажков в одно поле с массивом.
`CheckboxGroupProps<Value>` и `CheckboxGroupOption<Value>` поддерживают
string, number и boolean. Options принимает примитивы или объекты
`{ value, label, disabled?, id?, title?, className?, style?, required?, onChange? }`;
подпись примитива получается через String. Label принимает строку, число или
snippet; style — CSS-строка. Nullish entries/values пропускаются.

```svelte
<script lang="ts">
  import { Checkbox, CheckboxGroup } from 'antd-svelte';

  const options = [
    { value: 'read', label: 'Просмотр' },
    { value: 'edit', label: 'Редактирование' },
    { value: 'archive', label: 'Архив', disabled: true }
  ];
  let permissions = $state<string[]>(['read']);
</script>

<CheckboxGroup {options} bind:value={permissions} name="permissions" aria-label="Права доступа" />
```

При options каждое пользовательское переключение обновляет bind:value и вызывает
`onValueChange(values)` с новым массивом в порядке options. Массив callback
не разделяется с привязкой. Повторяющиеся options показываются один раз;
первая подпись и disabled-состояние сохраняются. Числовой 0 и строковый "0",
boolean false и строковый "false" остаются разными значениями.

Внешние обновления value/options не переписывают массив владельца и не вызывают
callback. Временно отсутствующие варианты скрываются, а возвращённые снова
отображают выбранное состояние. При следующем пользовательском переключении
массив содержит только текущие options, без повторов, в их текущем порядке.

Группа наследует disabled из Form/FormItem и ConfigProvider; явный
`disabled={false}` переопределяет наследование. Disabled группы блокирует все
варианты, disabled option блокирует только соответствующий checkbox.
Уже выбранный disabled-вариант сохраняется в массиве.

Для отдельной группы defaultValue принимает readonly-массив и копируется один
раз. С bind:value задавайте начальное значение у владельца без defaultValue.
Нативный reset формы восстанавливает defaultValue или пустой массив, включая
привязку, без callbacks. Массив обновляется в следующей задаче после события
reset, чтобы учесть отмену события; отменённый reset сохраняет текущий выбор.
Внешняя форма через атрибут form поддерживается. В Form сбросом управляет
модель через resetFields.

Группа содержит нативные checkbox: Tab перемещает фокус, Space и нажатие подписи
переключают вариант. С name или FormItem.name отмеченные доступные варианты
попадают в FormData под одним именем. Читайте их через
`new FormData(form).getAll('permissions')`. Результат содержит строки в порядке
options; disabled, отсутствующие и невыбранные варианты исключаются.
Например, выбранные числовой 0 и boolean false передаются как `['0', 'false']`.

В Form используйте `value={form.values.permissions}` и
`onValueChange={(value) => form.setFieldValue('permissions', value)}`.
Правила required/min/max проверяют массив целиком. Required не назначается
каждому input, поэтому выбор всех вариантов не становится обязательным.
Имя поля, описание и ошибки передаются из FormItem; группа использует fieldset
и получает доступное имя из label FormItem либо aria-label/aria-labelledby.
При ошибке или нажатии подписи FormItem фокус переходит к первому доступному
варианту; пустая группа может получить фокус сама, без дополнительного шага Tab.

Галерея `/ant-design#checkbox` показывает форму выбора прав с общим флажком
«Все права», промежуточным состоянием, проверкой количества, отправкой и сбросом.
Общий выбор управляется владельцем через массив, как и в примере Ant Design.
Непустые нормализованные options имеют приоритет над children; пустые оставляют
snippet с вложенными Checkbox, включая Row/Col и другие контейнеры:

```svelte
<CheckboxGroup bind:value={permissions} name="permissions" aria-label="Права доступа">
  <Checkbox value="read">Просмотр</Checkbox>
  <Checkbox value="edit">Редактирование</Checkbox>
</CheckboxGroup>
```

Children регистрируют текущие значения и отменяют регистрацию при удалении или
смене value. Как upstream, их внутренний массив сохраняет порядок выбора и
временно отсутствующие значения. Bind:value отражает этот raw state; callbacks
получают только зарегистрированные значения. Поэтому вернувшийся child снова
показывает сохранённый выбор. OnChange(values) вызывается перед onValueChange,
массивы callbacks не разделяются с state. У options сохраняются описанные выше
сортировка и нормализация прежнего API. Getter/setter function binding позволяет
владельцу отклонять изменения; native checked восстанавливается по типизированным
значениям, не смешивая 0 и '0'.

SkipGroup оставляет Checkbox самостоятельным: его checked/name и callbacks не
входят в группу. Disabled внешнего native fieldset продолжает действовать.
Вложенные CheckboxGroup изолируют context; флажки выбора строк Table используют
skipGroup, как в upstream. Group.nativeElement — bindable fieldset; rootClassName,
prefixCls и явный role относятся к корню. PrefixCls передаётся в generated options,
а children задают собственный prefixCls.

Checkbox/CheckboxGroup подключают CSS для local/shared prefixCls. Непустой
локальный prefix имеет приоритет; empty/undefined наследуют ConfigProvider.
Row использует общий namespace независимо от local Checkbox class; canonical
token markers и Wave target сохраняются. Смена prefix сохраняет group/input DOM,
refs, checked/mixed, выбранный массив, focus/selection и FormData.
В Source shared local class может сохранить Row selector первого provider:
nested Inner Row получает flex-grow:0, а fresh Inner с теми же props/theme — 1.
Оба замера сохранены; Native изолирует CSS по local class и global namespace.

Сохранены native fieldset/form/reset/required, принудительный disabled группы,
primitive values и deduplication options, bind:indeterminate и defaults. Они
отличаются от React state/ref conventions, child disabled override и controlled
indeterminate. Source Checkbox aliases и отдельные theme algorithms применяются
к Checkbox/CheckboxGroup; native-only темы сохраняют прежнее оформление.
Local/shared prefix CSS и Wave подключены; React diagnostics/statics остаются
неперенесёнными. Сверка с официальным UMD — `?fixture=checkbox-prefix` и
[browser](../../../tests/browser/checkbox-prefix.spec.ts). Типы —
[checkbox.types.ts](../../../src/lib/checkbox.types.ts) и
[checkbox-group.types.ts](../../../src/lib/checkbox-group.types.ts); проверки —
[browser](../../../tests/browser/checkbox-features.spec.ts),
[package SSR](../../../tests/package/checkbox-features.ssr.test.ts) и
[engine](../../../src/lib/checkbox-group.engine.test.ts). Изучены @rc-component/checkbox
2.0.0 и @rc-component/util 1.14.0; runtime React dependencies не добавлены.

## Radio и RadioGroup

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
  import { RadioGroup } from 'antd-svelte';

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

Галерея `/ant-design#radio` показывает отдельные Radio для расположения
вариантов и форму с числовым тарифом, boolean-публикацией, отправкой и сбросом.
RadioGroup также принимает children со вложенными Radio и RadioButton.
Непустые options имеют приоритет, пустой массив оставляет children:

```svelte
<script lang="ts">
  import { RadioButton, RadioGroup } from 'antd-svelte';

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
[radio.types.ts](../../../src/lib/radio.types.ts). Изучены Radio/Group/RadioButton и
@rc-component/checkbox 2.0.0; runtime React dependency не добавлена.

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
[browser](../../../tests/browser/radio-features.spec.ts) и
[package SSR](../../../tests/package/radio-features.ssr.test.ts).
Сверка prefix с официальным UMD — `?fixture=radio-prefix` и
[browser](../../../tests/browser/radio-prefix.spec.ts).

## Switch

Switch переключает boolean-состояние через `bind:checked` и
`onCheckedChange(checked)`. Отдельному control можно задать defaultChecked;
он фиксируется при создании. С привязкой задавайте начальное значение у
владельца без defaultChecked. Внешние изменения checked не вызывают callback.

```svelte
<script lang="ts">
  import { Switch } from 'antd-svelte';

  let notifications = $state(false);
</script>

<Switch id="notifications" bind:checked={notifications} name="notifications">
  {#snippet checkedChildren()}Вкл{/snippet}
  {#snippet unCheckedChildren()}Выкл{/snippet}
</Switch>
<label for="notifications">Уведомления</label>
```

Компонент использует button с type=button, role=switch и aria-checked.
Space, Enter, нажатие control или связанной подписи меняют состояние один раз
и не отправляют форму. Нативный onclick доступен; preventDefault в этом
обработчике отменяет переключение. Доступное имя задаётся через label,
FormItem или aria-label/aria-labelledby. Snippets checkedChildren и
unCheckedChildren предназначены для коротких подписей и декоративных иконок.
Они скрыты от accessibility tree, поэтому имя control не меняется вместе
с текстом состояния.

Размеры — medium и small. По умолчанию наследуется componentSize;
small включает малый размер, medium/large провайдера используют обычный.
Явный size переопределяет наследование. Disabled наследуется из Form/FormItem
и ConfigProvider, disabled=false переопределяет его. Loading показывает
индикатор, выставляет aria-busy и блокирует действия даже с disabled=false.
Существующее checked-состояние при блокировке сохраняется. Стили поддерживают
светлую/тёмную тему, основные цвета, RTL и prefers-reduced-motion.

С name или FormItem.name включённый доступный Switch передаёт `name=on` в
нативную FormData, как Checkbox. `new FormData(form).get('notifications')`
возвращает 'on' либо null; false, disabled и loading исключают поле.
Модель Form при этом хранит boolean, включая false. Атрибут form связывает
control с внешней формой. Нативный reset восстанавливает defaultChecked
и обновляет привязку в следующей задаче после события, без callbacks.
Отменённый reset сохраняет текущее состояние. При удалении Switch ожидающий
reset отменяется.

Для Form передавайте `checked={form.values.notifications}` и
`onCheckedChange={(value) => form.setFieldValue('notifications', value)}`.
FormItem передаёт id, имя, required, ошибки и описание кнопке. Ошибка формы
переводит фокус на Switch; blur отмечает поле touched. Reset формы использует
resetFields модели. Правило required считает false заданным значением;
для обязательного включения задайте custom validator:
`validator: (value) => value === true ? undefined : 'Включите настройку.'`.
Проверкой значения управляют правила Form.

Сохранение и ошибки остаются у владельца: Switch сообщает новое состояние,
а владелец задаёт checked и loading. Галерея `/ant-design#switch` содержит
пример асинхронного сохранения с [моделью состояния](https://woodger.org/ant-design#switch):
ожидание блокирует повторные запросы, успех подтверждает значение, ошибка
возвращает последнее сохранённое состояние, следующая попытка очищает ошибку.
При удалении примера запрос отменяется, поздний результат игнорируется.
Флажок ошибки в примере влияет только на следующее сохранение. Ниже показан
малый Switch с проверкой и сбросом Form.

Value/defaultValue — aliases checked/defaultChecked. Определённый checked имеет
приоритет над value; defaultChecked, включая false, — над defaultValue. Defaults
фиксируются при создании. Value поддерживает bind:value; задавайте начальный boolean
у владельца и используйте один способ привязки на протяжении жизни control.
Checked/value сохраняют существующие Svelte state conventions: для отклонения
пользовательского изменения используйте getter/setter function binding.

OnChange(checked, event) и onClick(checked, event) получают native MouseEvent либо
KeyboardEvent с button в currentTarget. При click сначала работает прежний native
onclick, способный отменить переключение, затем onCheckedChange, onChange и onClick.
ArrowLeft задаёт false, ArrowRight — true, в том числе в RTL. Повторная стрелка
вызывает onChange даже при том же состоянии, как rc-switch; onClick не вызывается.
OnKeyDown и native onkeydown работают после обработки стрелок. Внешние обновления
и reset не вызывают source callbacks. OnFocus/onBlur дополняют lowercase handlers.
Синтетические keydown используют keyCode 37/39: это native эквивалент which,
который React нормализует для rc-switch; одного key без кода недостаточно.

CheckedChildren/unCheckedChildren принимают string, number или snippet; ноль
сохраняется. ConfigProvider.switch задаёт class/style и semantic root/content/indicator,
которые наследуются вложенным provider. ClassNames/styles принимают объекты или
функции от props с resolved size/disabled. Content относится к обеим внутренним
подписям, indicator — к handle. Приоритет root style: config.styles.root, config.style,
styles.root, style. PrefixCls меняет классы и подключает извлечённый CSS;
rootClassName относится к button.

Bind:ref и bind:nativeElement возвращают native button и очищаются при unmount;
focus(options?)/blur() доступны и через bind:this. AutoFocus вызывает focus при
mount, tabIndex — alias tabindex. Lowercase autofocus сохраняет HTML-поведение.
Native form/reset/hidden field, отменяемый onclick, скрытые от accessibility tree
подписи и span handle сохраняют прежний Svelte контракт. React использует div handle
и controlled state/event/ref conventions. Source Switch tokens и отдельные theme
algorithms применяются к обоим размерам; native-only темы сохраняют прежнее
оформление. Local/shared prefix CSS и Wave подключены; React diagnostics/statics пока не перенесены.

Изучены Ant Design 6.6.8, @rc-component/switch 1.0.3 и @rc-component/util 1.14.0.
Рецепт switch побайтно воспроизводит прежние 47 правил vendor CSS, включая reduced
motion; keyframes не добавляются. Типы — [switch.types.ts](../../../src/lib/switch.types.ts),
проверки — [browser](../../../tests/browser/switch-features.spec.ts) и
[package SSR](../../../tests/package/switch-features.ssr.test.ts).

Switch поддерживает local/shared prefixCls для root, checked/loading/disabled/size/RTL,
ручки, подписей и loading icon. Empty/undefined наследуют ConfigProvider; непустой
local prefix имеет приоритет. Canonical token variables и внешний anticon
namespace сохраняются. Смена prefix сохраняет DOM/ref, checked, focus/selection
и native hidden form field. Сверка с UMD — `?fixture=switch-prefix` и
[browser](../../../tests/browser/switch-prefix.spec.ts).
