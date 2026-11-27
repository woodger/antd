# InputNumber

InputNumber редактирует `number | null` через `bind:value` и
`onValueChange(value)`. Очистка возвращает null, а `0` остаётся числом.
`defaultValue` фиксируется при создании отдельного control. При использовании
привязки задайте начальное число или null у владельца без defaultValue.

```svelte
<script lang="ts">
  import { InputNumber } from '@woodger/antd';

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
  import { InputNumber } from '@woodger/antd';
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
Публичные типы и JSDoc находятся в [input-number.types.ts](../../../src/lib/input-number/input-number.types.ts).

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

Новые сценарии: `?fixture=input-number-features`,
[browser](../../../tests/browser/input-number/input-number-features.spec.ts) и
[package SSR](../../../tests/package/input-number/input-number-features.ssr.test.ts).


InputNumber поддерживает local/shared prefixCls вместе с CSS обоих modes,
вариантов, размеров, affixes/actions и Compact. Непустой local prefix имеет
приоритет; empty/undefined наследуют ConfigProvider. Canonical token variables
и marker сохраняются; native geometry и reduced-motion adapters используют
стабильные классы/атрибуты. Смена prefix сохраняет root/input/ref, текстовый draft,
selection/focus, callbacks, keyboard и canonical FormData. Source measurements
снимаются в stringMode; Source FormData хранит редактируемый текст, а Native
hidden field — каноническое decimal value, как прежде. Проверки —
`?fixture=input-number-prefix`,
[browser](../../../tests/browser/input-number/input-number-prefix.spec.ts),
[SSR](../../../tests/package/input-number/input-number-prefix.ssr.test.ts),
[эталон UMD](../../../tests/browser/fixtures/ant-design-input-number-prefix-reference.json).
Рецепт input-number-prefix выводит 124 исходных CSS rules без deprecated addons.
В rc-input-number 1.6.2 focus class не совпадает с классом, ожидаемым CSS стрелок.
Raw focused measurements и counterpart с public className сохранены раздельно;
Native сохраняет прежний mode-focused class и видимые стрелки.

