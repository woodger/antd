# Slider

По умолчанию Slider выбирает одно число через `bind:value` и `onValueChange(value)`.
`defaultValue` фиксируется при создании отдельного control и по умолчанию
равен 0. При привязке задавайте начальное число у владельца без defaultValue.
В одиночном режиме значение всегда числовое. Следующие положения описывают этот
сохранённый native API; режим `range` описан отдельно ниже.

```svelte
<script lang="ts">
  import { Slider } from '@woodger/antd';

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

## Диапазон Slider

`Range` включает исходный multiple-handle API Ant Design 6.6.8 и
@rc-component/slider 1.1.1. Старые одиночные bind, normalization, callbacks,
native events и reset сохраняются. Точные интерфейсы:
[slider.types.ts](../../../src/lib/slider.types.ts) и
[slider-range.types.ts](../../../src/lib/slider-range.types.ts).

```svelte
<script lang="ts">
  import { Slider, type SliderRef } from '@woodger/antd';

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
