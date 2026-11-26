# Select

Без mode компонент сохраняет одиночный выбор; по умолчанию value скалярный. В
`mode="multiple"` value и callback используют массивы; варианты выбираются
из options, а выбранные элементы показываются с кнопками удаления.
`SelectProps<Value>` описывает прежний одиночный API,
`SelectProps<Value, 'multiple'>` — множественный. При использовании компонента
типы значений и callback выводятся из options и mode. `SelectProps<Value, 'tags'>`
принимает массив Value | string: свободный ввод создаёт строки, исходные числовые
ключи сохраняются.

## Данные options и fieldNames

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
  import { Select } from '@woodger/antd';
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

Select запоминает подпись и исходные данные до передачи нового значения владельцу.
Пункт сохраняет подпись и данные для `onDeselect`, даже если владелец принимает
выбор и удаляет пункт из `options` одним обновлением. При сверке с принятым
`value` кэш удаляет отклонённые записи. В повторённых замерах React 6.6.8
одновременное обновление теряло подпись или данные option в зависимости от режима.
[Замеры React](../../../tests/browser/fixtures/ant-design-select-immediate-cache-reference.json)

Исходные [40 сценариев](../../../tests/browser/fixtures/ant-design-select-data-reference.json.gz),
[40 SSR](../../../tests/browser/fixtures/ant-design-select-data-ssr-reference.json.gz),
[атрибуты](../../../tests/browser/fixtures/ant-design-select-data-attributes-reference.json.gz) и
[диагностика](../../../tests/browser/fixtures/ant-design-select-data-diagnostic-reference.json.gz)
сохранены независимо от реализации. Большой основной эталон хранится в gzip; загрузчик
распаковывает его стандартным Node.js zlib и проверяет прежний SHA-256 исходных байтов.
Native label/NFKD search и disabled cache проверяются
с отдельными public Source owners
([search](../../../tests/browser/fixtures/ant-design-select-data-label-native-reference.json.gz),
[cache](../../../tests/browser/fixtures/ant-design-select-data-cache-native-reference.json));
исходные ledgers не фильтруются. Virtual Source ошибочно
теряет mapped aria-selected: [парное наблюдение](../../../tests/browser/fixtures/ant-design-select-data-aria-reference.json.gz)
сохраняет этот результат, Native использует корректное mapped состояние. Multiple token
lookup использует mapped value; Source при том же вводе читает literal value и теряет выбор.
Полные [браузерные проверки](../../../tests/browser/select-data.spec.ts),
[атрибуты](../../../tests/browser/select-data-attributes.spec.ts),
[диагностические границы](../../../tests/browser/select-data-diagnostics.spec.ts),
[SSR](../../../tests/package/select-data.ssr.test.ts) и
[строгая hydration](../../../tests/browser/select-data-hydration.spec.ts) проверяют эти контракты.

## Выбранные labels и labelInValue

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
  import { Select, type SelectLabelValue } from '@woodger/antd';
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
[атомарные смены режима](../../../tests/browser/fixtures/ant-design-select-value-live-reference.json.gz),
[SSR](../../../tests/browser/fixtures/ant-design-select-value-ssr-reference.json.gz) и
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

## Оформление и состояние

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
  import { Select } from '@woodger/antd';

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

## Видимость списка Select

DefaultOpen задаёт только начальную видимость. Open управляет видимостью;
onOpenChange сообщает запрос, который владелец может принять либо отклонить.
Для двустороннего состояния Svelte используется bind:open. Внешняя замена open
и начальное открытие не вызывают onOpenChange и не переводят фокус в поле.

```svelte
<script lang="ts">
  import { Select } from '@woodger/antd';
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

## Содержимое пунктов Select

OptionRender задаёт пассивный Snippet внутри существующего native option button.
Он получает `(option, { index })`: key/value/raw label, data с record текущей выдачи
и groupOption=true у детей группы, false у плоских пунктов. Для header renderer не вызывается.
Key следует правилам общего слоя данных. Дополнительные data-поля и mapped label
имеют тип unknown, поэтому сложные значения требуют обычного TypeScript narrowing.

```svelte
<script lang="ts">
  import { Select, type SelectFlattenOption } from '@woodger/antd';
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

## Popup и семантическое оформление

Вложенная панель наследует [слой владельца](../theme-context.md#уровни-вложенных-панелей).

`popupRender` — обычная чистая функция, получающая origin-menu Snippet. Она
может вернуть его, scalar/array или Snippet с origin-menu аргументом:

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Select } from '@woodger/antd';
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

## Иконки и очистка Select

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
  import { Select, type SelectSuffixInfo } from '@woodger/antd';
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

## Замена root и input Select

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
  import { Select, type SelectInputContext } from '@woodger/antd';
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

## Tags

```svelte
<script lang="ts">
  import { Select } from '@woodger/antd';
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

## Разделители ввода

TokenSeparators работает в multiple/tags: readonly массив разделителей или функция
`(input: string) => readonly string[]`. Найденный разделитель завершает все части
строки, включая последнюю; значения дополняют выбор без дубликатов, popup закрывается.
В tags части становятся string values, в multiple принимаются только существующие
options с совпавшим label либо явно заданным showSearch.optionFilterProp. Числовой
ключ не совпадает со строкой автоматически; raw пробелы непустых частей сохраняются.

```svelte
<script lang="ts">
  import { Select } from '@woodger/antd';

  let tags = $state<string[]>([]);
</script>

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

## Длина текста тегов

MaxTagTextLength ограничивает только видимый текст multiple/tags и добавляет
исходное `...` при усечении. Полные label/title, имена кнопок удаления и values
сохраняются. Single игнорирует ограничение. Длина считается в UTF-16 units, как в
rc-select; Native дополнительно не разрывает корректную surrogate pair. Усечённая
половина emoji исключается целиком, сохраняя остальные правила slice, включая
combining/ZWJ текст. Это не подсчёт grapheme clusters.

[Общие эталоны Select/Cascader](../../../tests/browser/fixtures/ant-design-select-tag-text-reference.json)
включают исходные broken-pair результаты. Изменение длины не пересоздаёт input,
не меняет выбранные значения и не вызывает value callbacks.

## Количество видимых тегов

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
  import { Select, type SelectOmittedTag } from '@woodger/antd';
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

## Пользовательский рендер тегов

TagRender — Svelte Snippet с SelectTagInfo. Обычный tag получает typed value,
index, option disabled, closable и onClose(event?). Label — Snippet с уже усечённым
текстом. Сводный tag получает isMaxTag=true, disabled=false, closable=false,
с собственными value/index/onClose: undefined; его label использует maxTagPlaceholder. Single игнорирует
renderer. Исходные selected values и поля формы сохраняются.

```svelte
<script lang="ts">
  import { Select, Tag, type SelectTagInfo } from '@woodger/antd';
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

## Ограничение выбора

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

## Удалённый поиск

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

Например, для поиска по справочнику сотрудников передайте введённую строку
своему API. В этом примере `/api/members?q=…` возвращает массив объектов
`{ value: string, label: string }`. При новом вводе или удалении компонента
Svelte отменяет предыдущий запрос через `getAbortSignal()`.

```svelte
<script lang="ts">
  import { getAbortSignal } from 'svelte';
  import { Select } from '@woodger/antd';

  let query = $state('');
  let options = $state<{ value: string; label: string }[]>([]);
  let loading = $state(false);
  let error = $state('');

  $effect(() => {
    const text = query.trim();
    const signal = getAbortSignal();

    options = [];
    error = '';
    loading = Boolean(text);

    if (text) {
      void search(text, signal);
    }
  });

  async function search(text: string, signal: AbortSignal) {
    try {
      const response = await fetch(`/api/members?q=${encodeURIComponent(text)}`, { signal });

      if (!response.ok) {
        throw new Error(`Ошибка поиска (HTTP ${response.status})`);
      }

      const matches = await response.json();

      if (!signal.aborted) {
        options = matches;
      }
    }
    catch (cause) {
      if (!signal.aborted) {
        error = cause instanceof Error ? cause.message : 'Не удалось загрузить список';
      }
    }
    finally {
      if (!signal.aborted) {
        loading = false;
      }
    }
  }
</script>

<Select
  {options}
  {loading}
  showSearch={{ searchValue: query, onSearch: text => { query = text; }, filterOption: false }}
  status={error ? 'error' : undefined}
  aria-label="Поиск сотрудника"
/>
{#if error}
  <p role="alert">{error}</p>
{/if}
```
