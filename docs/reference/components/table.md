# Table

```svelte
<script lang="ts">
  import { Table, type TableColumn, type TableKey, type TableSorter } from '@woodger/antd';

  interface Person { id: number; name: string; score: number }

  const people: Person[] = [
    { id: 0, name: 'Анна', score: 30 },
    { id: 1, name: 'Борис', score: 10 }
  ];
  const columns: TableColumn<Person>[] = [
    { key: 'name', title: 'Имя', render: personName },
    { key: 'score', title: 'Баллы', dataIndex: 'score', sorter: (left, right) => left.score - right.score }
  ];
  let current = $state(1);
  let pageSize = $state(10);
  let sorter = $state<TableSorter | null>(null);
  let selectedRowKeys = $state<TableKey[]>([]);
</script>

{#snippet personName(person: Person)}<strong>{person.name}</strong>{/snippet}

<Table
  dataSource={people}
  {columns}
  rowKey="id"
  caption="Участники"
  bind:current
  bind:pageSize
  bind:sorter
  bind:selectedRowKeys
  rowSelection
  scroll={{ x: 600 }}
/>
```

По умолчанию используется `mode="client"`: фильтрация, сортировка и разбиение
на страницы выполняются локально; переданный `total` в этом режиме игнорируется.
`dataSource` и `columns` принимают readonly-массивы. Каждая колонка данных имеет
уникальный строковый `key` и текстовый `title`. `dataIndex` принимает ключ
`keyof Row` или массив сегментов пути. `null` и `undefined` дают пустую ячейку,
остальные значения отображаются текстом. `render(record, index, value)` заменяет
содержимое ячейки типизированным snippet. Index начинается с 0 среди соседних
записей текущей страницы или ветки. Колонка принимает `width`, `align` и
`className`. Это поле дополняет классы заголовка и ячеек данных своей колонки.
Служебные selection/expand
колонки его не получают. Сортировка, selected/fixed classes и native semantics
сохраняются. Обновление класса не пересоздаёт ячейку или snippet editor.
8 состояний официального UMD сверяются в
[browser](../../../tests/browser/table-column-classes.spec.ts), серверная разметка —
в [SSR](../../../tests/package/table-column-classes.ssr.test.ts).
Fixture `?fixture=table-column-classes`.

`rowKey` задаёт поле или функцию получения ключа, по умолчанию используется
поле `key`. Ключ должен быть уникальной строкой или конечным числом; `0`
поддерживается. Отсутствующие/повторные ключи строк, повторные ключи колонок и
пустой список колонок вызывают явную ошибку. Позиции строк не используются как
идентификаторы выбора.

Скалярная сортировка задаётся через `sorter: { columnKey, order } | null` и
поддерживает привязку. Нажатие заголовка по умолчанию переключает
`ascend → descend → null`. Плоские данные фильтруются перед сортировкой,
а номер страницы сохраняется. Равные записи сохраняют исходный порядок.
[Направления и приоритеты сортировки](#направления-и-приоритеты-сортировки)

Пагинация включена по умолчанию: `current=1`, `pageSize=10`; оба props
поддерживают привязку. `pagination={false}` показывает все записи.
Объект `pagination` передаёт настройки `showSizeChanger`, `pageSizeOptions`,
`hideOnSinglePage`, `showTotal` и `aria-label` существующему Pagination. В клиентском
режиме total равен количеству корневых записей после фильтрации. При уменьшении
набора отображаемая страница
ограничивается допустимым диапазоном; props владельца не переписываются.

`rowSelection` включает Checkbox-колонку; объект
`{ getCheckboxProps: (record) => ({ disabled, 'aria-label': ... }) }` позволяет
отключить отдельные строки и изменить их доступное имя. `selectedRowKeys`
поддерживает привязку. Выбор всех строк затрагивает только доступные строки
текущей страницы и сохраняет ключи с других страниц. Заголовок игнорирует
disabled-строки при расчёте checked/indeterminate и отключается, если доступных
строк нет. При выключенной пагинации выбор всех относится ко всему набору.
Выбранные ключи сохраняются после замены или удаления записей, пока владелец
или пользователь не изменит выбор.

`onChange({ action, pagination, sorter, currentDataSource, filters })` вызывается
при пользовательской сортировке, фильтрации или смене страницы/размера.
`action` равен `sort`, `filter` или `paginate`, pagination содержит
`{ current, pageSize, total }`, а currentDataSource в клиентском режиме — весь отфильтрованный и
отсортированный набор до разбиения на страницы. Filters передаётся при наличии
фильтруемых колонок.
`onSelectionChange(keys, records, { type })` вызывается отдельно; type равен
`single` или `all`. По умолчанию records содержат только известные записи
текущего `dataSource`, включая скрытые фильтром, в порядке выбранных ключей.
Полный набор методов выбора доступен через `rowSelection.onChange`.
Внешние изменения props, данных и колонок не вызывают эти callbacks.

Для отдельных таблиц доступны начальные `defaultCurrent`, `defaultPageSize`,
`defaultSorter`, `defaultSelectedRowKeys`, которые читаются один раз. При
привязке задавайте начальные значения у владельца. Для сброса присвойте
`sorter=null`, `selectedRowKeys=[]` и нужную страницу.

`loading` выставляет aria-busy, показывает статус загрузки и блокирует
сортировку, выбор и пагинацию. `disabled` наследуется из ConfigProvider и может
быть явно переопределён. Интерактивное содержимое собственных snippets
отключает владелец. `empty` заменяет текст пустого состояния snippet.
Размер наследуется из `componentSize`; доступны `bordered`, `caption`,
`aria-label`, `class` и `style`. `scroll.x` задаёт минимальную ширину таблицы:
горизонтальная прокрутка остаётся внутри фокусируемого контейнера.

## Настройки выбора строк

`rowSelection.type` выбирает Checkbox или Radio. В режиме `radio` отображается
первый выбранный ключ, а действие пользователя оставляет одну отметку.
В режиме Checkbox Shift переключает диапазон между соседними действиями в
порядке текущей страницы, пропуская недоступные строки. При `checkStrictly: false`
действие применяет связи родителей и потомков.

`rowSelection.selectedRowKeys` управляет отображаемыми ключами через настройки
колонки. Новое значение принимает владелец в `rowSelection.onChange`.
Приоритет имеет `rowSelection.selectedRowKeys`, затем корневой
`bind:selectedRowKeys`. Начальный локальный набор задаёт
`rowSelection.defaultSelectedRowKeys` с запасным вариантом
`defaultSelectedRowKeys` на Table.

`rowSelection.onSelect(record, checked, records, nativeEvent)` вызывается
перед `onChange` при действии на одной строке. `rowSelection.onChange` передаёт
ключи, записи и `info.type`. Значения `single` и `multiple` относятся к
действиям на строках, `all`, `invert` и `none` — к заголовку и меню.
Корневой `onSelectionChange` сохраняет тип события `single` для действий
на строках и `all` для действий в заголовке.

`preserveSelectedRowKeys: true` запоминает выбранные записи при смене
`dataSource`. При повторной загрузке той же строки используется её актуальный
объект. Вложенные связи сохраняются для запомненных веток. Ключ передаётся даже
при отсутствии записи, а массив records содержит известные записи. В замерах
Ant Design встречается `undefined`, если соответствующая запись никогда
не загружалась.
При использовании вложенных ключей, callbacks или явного выключения
`preserveSelectedRowKeys` отсутствующие ключи отбрасываются при следующем
действии, если сохранение записей выключено. Корневой выбор сохраняет ключи
с других серверных страниц.

`selections: true` добавляет меню выбора всех обработанных данных, инверсии
текущей страницы и сброса доступных отметок. В массиве можно сочетать
`Table.SELECTION_ALL`, `Table.SELECTION_INVERT`, `Table.SELECTION_NONE` и
пользовательские пункты `{ key, text, onSelect }`. Callback пункта получает
доступные ключи текущей страницы. `hideSelectAll` скрывает меню и checkbox
в заголовке. У Radio заголовочный checkbox и меню отсутствуют.

`getCheckboxProps` и `getTitleCheckboxProps` задают атрибуты и callbacks
контролов. Их `onChange` получает DOM `change` после событий Table.
`columnWidth`, `align` и `fixed` задают ширину, выравнивание и закрепление
служебной колонки. Меню доступно с клавиатуры и возвращает фокус на кнопку.

Сверка охватывает 79 состояний и 13 серверных снимков Ant Design 6.6.8.
Строгая гидратация проверяет, что управляемый Checkbox или Radio сохраняет
сфокусированный input и учитывает принятие и отклонение изменения.
У Radio с общим `name` при отклонении сохраняется ранее принятая отметка.
[Снимки эталона](../../../tests/browser/fixtures/ant-design-table-selection-reference.json),
[браузерные проверки](../../../tests/browser/table-selection.spec.ts) и
[гидратация](../../../tests/browser/table-selection-hydration.spec.ts).

### Порядок и содержимое служебных колонок

Разместите `Table.SELECTION_COLUMN` и `Table.EXPAND_COLUMN` на верхнем уровне
`columns`. Они задают позиции выбора и раскрытия подробностей среди колонок
данных. Учитывается первый маркер каждого вида. Маркер без активного
`rowSelection` или `expandable.expandedRowRender` пропускается.

```ts
const columns: TableColumn<Person>[] = [
  { key: 'name', title: 'Имя', dataIndex: 'name' },
  Table.SELECTION_COLUMN,
  { key: 'score', title: 'Баллы', dataIndex: 'score' },
  Table.EXPAND_COLUMN
];
```

Без маркеров кнопки подробностей идут первыми, а выбор размещается после них.
Если колонка раскрытия расположена дальше, стандартная колонка выбора идёт
первой. `rowSelection.fixed` по умолчанию наследуется у следующей видимой
колонки верхнего уровня, затем у предыдущей. Если у предшествующей колонки
раскрытия сторона ещё не определена, она получает сторону выбора. Явное
`fixed: false` выключает закрепление. Порядок учитывается в шапке, spans,
виртуальном окне и физических индексах `Table.Summary.Cell`.

`rowSelection.columnTitle` принимает строку или snippet с исходным checkbox.
Snippet заменяет весь стандартный заголовок вместе с меню и может вывести
checkbox при `hideSelectAll: true`. В режиме Radio аргумент равен `undefined`.
`renderCell(checked, record, index, origin)` заменяет содержимое ячейки. Вызов
`{@render origin()}` выводит штатный контрол со всеми его обработчиками.
`index` отсчитывается среди соседей. `rowSelection.onCell(record, index)`
получает индекс во всей раскрытой странице и задаёт атрибуты, события, `colSpan`
и `rowSpan` через тот же контракт, что и `columns.onCell`.

Эталон Ant Design 6.6.8 включает 47 браузерных состояний и 16 серверных снимков.
Строгая гидратация сохраняет фокус и штатный input внутри пользовательской
ячейки, включая виртуальный span.
[Эталон](../../../tests/browser/fixtures/ant-design-table-service-columns-reference.json)
· [Chromium](../../../tests/browser/table-service-columns.spec.ts)
· [SSR](../../../tests/package/table-service-columns.ssr.test.ts)
· [Гидратация](../../../tests/browser/table-service-columns-hydration.spec.ts)

## Раскрываемые строки

`expandable.expandedRowRender` включает отдельную колонку с кнопками раскрытия.
`expandedRowRender(record, index, indent, expanded)` получает запись, индекс
среди строк текущей страницы, глубину строки подробностей и состояние раскрытия.
Snippet может объявить только нужные ему параметры.
`rowExpandable(record)` позволяет скрыть кнопку и подробности отдельных строк.
По умолчанию раскрытие доступно для каждой переданной записи.

```svelte
<script lang="ts">
  import { Button, Table, type TableColumn, type TableKey } from '@woodger/antd';

  interface Person { key: number; name: string; email: string; active: boolean }
  const people: Person[] = [
    { key: 0, name: 'Анна', email: 'anna@example.com', active: true },
    { key: 1, name: 'Борис', email: 'boris@example.com', active: false }
  ];
  const columns: TableColumn<Person>[] = [{ key: 'name', title: 'Имя', dataIndex: 'name', width: 200 }];
  let expanded = $state<TableKey[]>([0]);
</script>

{#snippet details(person: Person, index: number)}<p>{index + 1}. {person.name}: {person.email}</p>{/snippet}
<Button onclick={() => { expanded = []; }}>Свернуть все</Button>
<Table dataSource={people} {columns} caption="Участники"
  expandable={{ expandedRowRender: details, rowExpandable: (person) => person.active,
    fixed: true, expandedRowKeys: expanded, onExpandedRowsChange: next => { expanded = next; } }} />
```

`expandable.expandedRowKeys` управляется владельцем через
`expandable.onExpandedRowsChange`. Для локального состояния доступны
`expandable.defaultExpandedRowKeys`, которые читаются один раз. `[]` сворачивает все строки.
`expandable.defaultExpandAllRows` раскрывает записи начальной страницы, если
`defaultExpandedRowKeys` отсутствует.
Раскрытие использует тот же rowKey, что и выбор; числовой `0` и строковый `"0"`
различаются. Ключи сохраняются при сортировке, фильтрации, смене страниц,
замене/удалении данных, выключении expandable и изменении rowExpandable.
Подробности отображаются только для доступных строк текущего dataSource и страницы;
кэша записей нет. Возвращённая запись с сохранённым ключом снова раскрывается.

Пользовательское переключение обновляет внутренние ключи и вызывает
`expandable.onExpand(expanded, record)`, затем `expandable.onExpandedRowsChange(keys)`.
Управляемые ключи обновляет владелец; callbacks сами не меняют его массив.
[Замер официального UMD](../../../tools/fixtures/ant-design-current-table-expansion-observation.json)
фиксирует отказ владельца, принятие новых ключей и порядок callbacks.
Keys содержит все раскрытые ключи, включая отсутствующие на текущей странице.
Внешние изменения props не вызывают эти callbacks. Раскрытие не меняет выбор
или пагинацию и не вызывает общий onChange. currentDataSource и total считают
только записи, строки подробностей в них не входят.

`expandable.columnWidth` принимает число или CSS-ширину; default без source-темы —
48px, в теме Ant Design ширина выводится из глобальных метрик.
`columnTitle` задаёт видимый заголовок строкой или snippet. По умолчанию заголовок
доступен скринридеру. `fixed: true` закрепляет колонку у начала строки, включая RTL.
`fixed: 'end'` без маркера размещает её у логического конца. Смещения и colspan
учитывают раскрытие, выбор и данные. При горизонтальной прокрутке содержимое
подробностей остаётся в ширине видимой области. Ширины колонок данных сохраняются.

Кнопка имеет type=button и aria-expanded. В раскрытом состоянии aria-controls
ссылается на существующий блок подробностей с уникальным ID. Enter и Space
переключают состояние и сохраняют фокус на кнопке. Loading и disabled блокируют
переключение, disabled наследуется из ConfigProvider. Подписи задаются через
`locale.table.expandColumn`, `expandRow`, `collapseRow`.

`expandable.expandIcon(info, origin)` заменяет кнопку раскрытия подробностей
или ветки. `{@render origin()}` выводит штатный переключатель или отступ
для листа. Для собственной кнопки доступны `info.record`, `prefixCls`,
`expanded`, `expandable`, `disabled` и `ariaControls`. Передайте событие
в `info.onExpand(event)`, чтобы переключить эту строку и остановить всплытие
к обработчику раскрытия по клику на строку.

Локальный snippet имеет приоритет над `ConfigProvider.table.expandable.expandIcon`.
Провайдер без `table` наследует родительскую настройку. `table={{}}` сбрасывает
её в дочернем дереве. Общий snippet получает `record` как `object`, поскольку
провайдер может обслуживать таблицы с разными типами записей.

`expandable.expandRowByClick` включает раскрытие нажатием на строку. Элементы
управления внутри ячеек обрабатывают свои нажатия. `expandable.showExpandColumn=false`
выключает автоматическую колонку подробностей и встроенные переключатели дерева.
Явный `Table.EXPAND_COLUMN` сохраняет колонку подробностей.

`expandable.expandedRowClassName` добавляет классы к строке подробностей
и вложенным строкам дерева. У callback `(record, index, indent)` индекс
относится ко всей раскрытой странице, а `indent` задаёт глубину записи.

`expandable.forceRender: true` создаёт подробности до первого открытия и
сохраняет их DOM после сворачивания. Скрытая строка не занимает высоту и
исключается из Tab-порядка. При виртуализации подробности создаются для строк
текущего DOM-окна, которые могут раскрываться. Выход строки из окна, фильтрация,
смена страницы или запрет `rowExpandable` удаляют её подробности.
SSR сразу выводит раскрытые и принудительно смонтированные скрытые строки.

По умолчанию Svelte освобождает подробности при сворачивании. В обычном режиме
Ant Design на React оставляет уже открывавшиеся подробности смонтированными.
В эталоне сохранены оба режима React и состояние редактора после повторного
открытия. Строгая гидратация Svelte сохраняет серверный редактор и фокус кнопки.
[Эталон](../../../tests/browser/fixtures/ant-design-table-expansion-options-reference.json)
· [Chromium](../../../tests/browser/table-expansion-options.spec.ts)
· [SSR](../../../tests/package/table-expansion-options.ssr.test.ts)
· [Гидратация](../../../tests/browser/table-expansion-options-hydration.spec.ts)

## Древовидные данные

Массив `children` включает раскрытие веток в первом видимом листе сетки.
При включённом выборе кнопки находятся во втором листе, поэтому их позиция
учитывает порядок `Table.SELECTION_COLUMN`. `Table.EXPAND_COLUMN` относится
к подробностям. Имя поля можно поменять через `expandable.childrenColumnName`. Ключи
уникальны на всех уровнях. Пустой массив тоже задаёт раскрываемую ветку и подходит
для заполнения потомков после `onExpand`. Вложенность отображается с шагом
`expandable.indentSize` в пикселях, по умолчанию 15. `expandedRowRender` включает
режим подробностей, в котором `rowExpandable` задаёт доступные строки.

В client mode сортировка действует среди соседних записей на каждом уровне.
При первом критерии родитель получает потомков, прошедших все активные
фильтры. Следующие колонки проверяют родителя с тем же составом ветки.
Если родитель отфильтрован, ветка исчезает целиком. Пагинация делит только
корневые записи. `title`, `footer` и `onChange.currentDataSource` получают
дерево со вложенными записями. В server mode порядок и состав веток определяет
владелец.

На свёрнутом дереве из 127 подходящих записей четыре активных фильтра с одним
выбранным значением в каждом вызывают `onFilter` 508 раз за SSR. Ant Design
6.6.8 в этом сценарии делает 1 198 372 вызова. В обеих реализациях видна
одна корневая строка. [Проверка SSR](../../../tests/package/table-tree.ssr.test.ts)

Флажок заголовка выбирает доступных потомков корней текущей страницы, включая
свёрнутые ветки. По умолчанию флажки строк независимы. При
`rowSelection.checkStrictly=false` выбор распространяется на доступных детей,
а родитель показывает частичную отметку. Отключённый флажок разрывает связь.
`onSelectionChange` получает исходные записи в порядке выбранных ключей.

Девять профилей Ant Design 6.6.8 покрывают раскрытие, пагинацию, фильтры,
сортировку, выбор, RTL и обработчики. UMD добавляет ключ листа при клике по строке.
В Svelte клик раскрывает строки с массивом потомков. Гидратация сохраняет
ячейку, фокус и выделение в редакторе.
[Замеры](../../../tests/browser/fixtures/ant-design-table-tree-reference.json)
· [Chromium](../../../tests/browser/table-tree.spec.ts)
· [SSR](../../../tests/package/table-tree.ssr.test.ts)
· [Гидратация](../../../tests/browser/table-tree-hydration.spec.ts)

## Видимость заголовка колонок

`showHeader` по умолчанию true. False удаляет `thead`, сохраняя caption, title/footer,
данные, сортировку и выбор строк. Внешние изменения видимости не вызывают onChange.
Пустой title snippet сохраняет панель. Класс ant-table-no-header применяется
при отсутствии title и showHeader=false; в bordered-таблице CSS скругляет
верхние углы первой строки body по исходным правилам.

Без шапки ширины fixed columns берутся из первой обычной строки tbody и заново
измеряются после замены страницы или восстановления пустого набора. Закрепление
и expanded viewport работают в LTR/RTL. Скрытие шапки удаляет её открытый фильтр;
содержимое и фокус controls в остающихся body rows сохраняются.
Сравнение 48 состояний UMD: [browser](../../../tests/browser/table-header.spec.ts),
[SSR](../../../tests/package/table-header.ssr.test.ts), fixture `?fixture=table-header`.

## Группы колонок

Задайте `children` у колонки, чтобы добавить уровень заголовка. Группа занимает
ширину своих видимых листьев. Заголовок листа занимает все оставшиеся строки
шапки. Чекбоксы выбора и кнопки раскрытия получают заголовки на полную высоту.
Ключ колонки уникален в дереве. Для описания колонок доступны `TableColumnsType<Row>`,
`TableColumnGroupType<Row>` и `TableColumnType<Row>`.

```ts
const columns: TableColumnsType<Person> = [
  { key: 'name', title: 'Имя', dataIndex: 'name' },
  {
    key: 'metrics', title: 'Показатели', children: [
      { key: 'score', title: 'Баллы', dataIndex: 'score' },
      { key: 'tasks', title: 'Задачи', dataIndex: 'tasks' }
    ]
  }
];
```

Листья наследуют `fixed` группы. У дочерней колонки своё значение имеет
приоритет, в том числе `false`. Заголовок группы закрепляется, если оба
крайних листа закреплены к одной стороне. При вертикальной прокрутке строки
шапки закрепляются одна под другой с учётом их высот.

`hidden` у группы скрывает её поддерево. Если скрыты все дочерние колонки,
видимая группа остаётся отдельной колонкой. Сортировка и фильтры внутри
скрытой группы продолжают обрабатывать данные.

`responsive` у колонки верхнего уровня содержит допустимые breakpoints Grid.
Колонка появляется при совпадении любого из них. У группы настройка управляет
видимостью всего поддерева, пустой список скрывает колонку. Сервер выводит
колонки без `responsive`, а браузер уточняет видимость по теме и `matchMedia`.

Структура, события и геометрия групп проверяются по 33 состояниям UMD и девяти
серверным рендерам Ant Design 6.6.8. Строгая гидратация проверяет, что появление
группы сохраняет активный редактор и выделение текста. [Браузер](../../../tests/browser/table-columns.spec.ts)
и [SSR](../../../tests/package/table-columns.ssr.test.ts).

## Общие свойства колонок

`column` задаёт общие свойства групп и листьев. Например, эти настройки
применятся к каждой колонке, пока она не задаст собственное значение.

```svelte
<Table {columns} {dataSource} column={{ align: 'center', ellipsis: true, width: 160 }} />
```

Отсутствующее свойство и `undefined` наследуют общее значение. `false`, `0`,
пустая строка и `null` сохраняются как явные переопределения. Массивы и объекты
заменяются целиком. Каждая колонка в группе получает тот же общий набор.

`TableColumnDefaults<Row>` содержит необязательные свойства отдельной колонки.
Дерево групп и обязательные `key` и `title` задаются в `columns`.
Служебные колонки используют свои параметры `rowSelection` и `expandable`.
Общий `column` учитывается при выборе видимых колонок, чтении данных и обработке
сортировки и фильтров. Обновление `column` само по себе не вызывает `onChange`.

[Эталон](../../../tests/browser/fixtures/ant-design-table-column-defaults-reference.json)
· [Chromium](../../../tests/browser/table-column-defaults.spec.ts)
· [SSR](../../../tests/package/table-column-defaults.ssr.test.ts)
· [Гидратация](../../../tests/browser/table-column-layout-hydration.spec.ts)

## Видимость колонок

`TableColumn.hidden` по умолчанию false. True убирает col/header/body cells
колонки и её controls из DOM. Сортировка и активные фильтры этой колонки
продолжают обрабатывать данные, как InternalTable перед rc-table. Переданный
список columns остаётся непустым.

При отсутствии видимых колонок данных остаются selection/expand cells.
Без них таблица показывает одну пустую ячейку на запись и пустой заголовок;
colgroup в этом случае отсутствует. Empty и expanded cells получают актуальный
colSpan, минимум 1. Восстановление колонок сохраняет выбранные/раскрытые строки,
controls соседних ячеек и expanded editor, focus/selection и FormData.
Смена hidden не вызывает onChange; controls самой скрытой колонки удаляются.

14 случаев UMD: [browser](../../../tests/browser/table-column-hidden.spec.ts),
[SSR](../../../tests/package/table-column-hidden.ssr.test.ts), fixture `?fixture=table-column-hidden`.
Сравниваются видимый текст, структура и selection controls. Raw textContent,
checkbox counts и colspan attributes сохранены: native TableFilter сохраняет
закрытый popover в DOM, а colSpan=1 может быть явным атрибутом.

## Значения, ширина и обрезка колонок

Строка `dataIndex: 'person.name'` читает буквальный ключ с точкой.
`dataIndex: ['person', 'name']` читает вложенное поле, а `['items', 0, 'name']`
обращается к элементу массива. Отсутствующий сегмент даёт `undefined`.
Третий аргумент `render` получает исходное значение как `unknown`. Пустой путь
или отсутствие `dataIndex` передают snippet саму запись. При обычном
отображении пустой путь оставляет ячейку пустой. Snippet может по-прежнему
объявлять только `record` и `index`.

`tableLayout` задаёт алгоритм ширин `'auto'` или `'fixed'`. При автоматическом
выборе закреплённые колонки с горизонтальной прокруткой, закреплённая шапка
или `ellipsis` у видимой колонки включают `fixed`. Закреплённые колонки с
`scroll.x="max-content"` выбирают `auto`, чтобы таблица выросла до ширины
содержимого. Числовой `minWidth` задаёт минимум в пикселях при `auto`.
В режиме `fixed` обычная таблица использует `width`. `align` поддерживает
логические стороны `start` и `end`, физические стороны, `center`, `justify`
и `match-parent`.

`ellipsis` обрезает длинный текст в заголовке и ячейках колонки. Значение
`true` добавляет нативный `title` для строк и чисел. Объект
`{ showTitle: false }` убирает автоматически созданный `title` в теле.
`onCell` и `onHeaderCell` могут задать свой `title`, в том числе пустую строку.
Для результата пользовательского snippet используйте явный `title` из
`onCell`. При смене обрезки сохраняются DOM редактора и фокус.

У активного виртуального окна общие фиксированные ширины заголовков и ячеек.
Они учитывают `minWidth` при любом значении `tableLayout`.
`virtual` без `scroll.y` сохраняет фиксированную раскладку закреплённых
колонок по умолчанию. Явное `tableLayout` задаёт алгоритм для этого случая.
В эталоне React тело учитывает минимум отдельно от шапки. В профиле
`virtual-min` первый заголовок равен 120 px, а ячейка равна 316 px. В Svelte
общая колонка равна 316 px. Обрезка закреплённого обычного текста выполняется
внутри ячейки, а кнопка сортировки и пользовательский snippet сохраняют
свои DOM-узлы.
[Эталон](../../../tests/browser/fixtures/ant-design-table-column-layout-reference.json)
· [Chromium](../../../tests/browser/table-column-layout.spec.ts)
· [SSR](../../../tests/package/table-column-layout.ssr.test.ts)
· [Гидратация](../../../tests/browser/table-column-layout-hydration.spec.ts)

## Атрибуты и объединение ячеек

`colSpan` и `rowSpan` колонки задают размер её заголовка. `onHeaderCell(column)`
возвращает атрибуты заголовка и может переопределить оба размера. Ноль скрывает
ячейку. Скрытый заголовок сохраняет колонку данных.

Для ячеек тела используйте `onCell(record, index)`. Индекс относится к раскрытой
текущей странице, включая видимых потомков. `column.render(record, index, value)`
получает индекс среди соседних записей. Оба колбэка для атрибутов могут
возвращать `TableCellProps` с `class`, строковым `style`, `data-*`, `aria-*` и
обработчиками Svelte, например `onclick`. CSS-класс дополняет классы колонки,
содержимое ячейки задаётся через `render`, а `scope` определяется шапкой и
`rowScope` колонки.

```ts
const teamColumn: TableColumn<Person> = {
  key: 'team',
  title: 'Команда',
  dataIndex: 'team',
  onCell: (_record, index) => ({
    rowSpan: index === 0 ? 2 : index === 1 ? 0 : 1
  })
};
```

Виртуальное окно показывает объединённую ячейку и после того, как её исходная
строка уходит за пределы окна. Высота учитывает измеренные строки и раскрытые
подробности, а граница объединения ограничена концом текущей страницы.
Совместные `colSpan` и `rowSpan` сохраняют положение соседних колонок.
В обычном режиме используются нативные `colspan` и `rowspan`. В виртуальном
режиме строка объединения размещается над потоком строк с сохранением
нативных ячеек и DOM-событий.

Сверка с 32 состояниями и восемью серверными рендерами Ant Design 6.6.8
проверяет spans, видимые строки, действия внутри объединений и RTL. Строгая
гидратация проверяет состояние редактора при смене окна.
[Браузер](../../../tests/browser/table-spans.spec.ts),
[гидратация](../../../tests/browser/table-spans-hydration.spec.ts),
[SSR](../../../tests/package/table-spans.ssr.test.ts).

## Заголовки строк

`TableColumn.rowScope` принимает `'row'` или `'rowgroup'`: ячейки данных этой
колонки становятся `th` с соответствующим scope, как в Ant Design 6.6.8.
Без настройки используются `td`. Заголовки колонок, selection/expand cells и
строки раскрытого содержимого сохраняют свою семантику. RowScope не объединяет
записи. У заголовков строк используются headerBg/headerColor/fontWeightStrong;
выделение строки и rowHoverable сохраняют исходные цвета.

Fixed row headers используют source headerBg поверх прежней непрозрачной
подложки native sticky cells. Это отдельные CSS-слои; raw UMD computed CSS
сохранён без подмены значений. Row → rowgroup обновляет scope без замены ячейки,
editor, focus/selection или FormData. Добавление/снятие rowScope меняет тег и
пересоздаёт содержимое ячейки, как source React.

18 случаев UMD, DOM/CSS и controls: [browser](../../../tests/browser/table-row-scope.spec.ts),
[SSR](../../../tests/package/table-row-scope.ssr.test.ts), fixture `?fixture=table-row-scope`.

## Классы и подсветка строк

`rowClassName` принимает строку или `(record, index, indent) => string` и добавляет
классы к основным классам строки и selection. Index начинается с 0 на текущей
странице в порядке видимых строк; indent равен глубине вложенности.
Изменение callback или его реактивных зависимостей обновляет классы без замены
строки и её controls.

`rowHoverable` по умолчанию true и управляет встроенной подсветкой при наведении.
В source-теме используются rowHoverBg/rowSelectedHoverBg; native-only темы
сохраняют прежние стили. False снимает подсветку сразу, включая курсор внутри
строки, и сохраняет выбранное состояние, сортировку, focus и keyboard controls.
Проп не блокирует обработку пользовательских событий строки или inputs.

В закреплённом UMD после true → false HoverContext сохраняет подсветку даже
после ухода курсора. Raw [наблюдение](../../../tests/browser/fixtures/ant-design-table-hover-observation.json)
сохранено; native использует CSS guard и очищает paint сразу. Source classes
HoverContext записаны как диагностика, сравнение с native CSS :hover проверяет
цвета. Границы и текущие flat-row случаи покрывают
[browser](../../../tests/browser/table-row-options.spec.ts) и
[SSR](../../../tests/package/table-row-options.ssr.test.ts), fixture `?fixture=table-row-options`.

## Атрибуты строк

`onRow(record, index)` возвращает `TableRowProps` для строки данных. Индекс
начинается с 0 в раскрытой странице после фильтрации, сортировки и пагинации.
Виртуальное окно передаёт тот же индекс. Пустые строки, итоги и подробности
в callback не входят.

`onHeaderRow(columns, index)` получает определения колонок данного уровня
шапки. В них учтены видимость, группы и позиции служебных колонок. Если шапка
содержит только пустую ячейку, callback получает определение с пустыми
`key` и `title`. При `showHeader={false}` callback пропускается.

В возвращаемом объекте можно задать `class`, строковый `style`, `data-*`,
`aria-*` и нативные Svelte-обработчики. Класс строки данных
дополняет `rowClassName`. Раскрытие по клику обновляет ключи и вызывает
`onExpand` и `onExpandedRowsChange` до `onclick` из `onRow`. Штатные кнопки
раскрытия обрабатывают клик сами. Клик по редактору внутри строки можно
получить в `onRow` без раскрытия строки.

`data-row-key` и вычисляемые виртуальные `aria-rowindex` принадлежат таблице.
Пользовательский `id` вложенной строки используется в `aria-controls`
кнопки раскрытия. При двух представлениях виртуальной строки `id` и
`tabindex` остаются у обычной строки. Слой объединённой ячейки сохраняет
атрибуты, класс, стиль и обработчики той же записи.

В Ant Design 6.6.8 `HeaderRow` перезаписывает возвращённые `className` и
`style` значениями semantic DOM. В Svelte `class` и `style` из
`onHeaderRow` применяются к строке шапки. Эталон сохраняет исходный результат
React. Проверки Svelte также покрывают смещения закреплённой шапки и строгую
гидратацию редактора.
[Эталон](../../../tests/browser/fixtures/ant-design-table-row-attributes-reference.json)
· [Chromium](../../../tests/browser/table-row-attributes.spec.ts)
· [SSR](../../../tests/package/table-row-attributes.ssr.test.ts)
· [Гидратация](../../../tests/browser/table-row-attributes-hydration.spec.ts)

## Панели title и footer

`title` и `footer` принимают snippets с readonly-массивом записей текущей страницы.
В client mode он уже отфильтрован, отсортирован и ограничен пагинацией; без
пагинации передаётся весь обработанный набор. Server mode передаёт полученный
`dataSource` без повторного разбиения. Для пустого набора передаётся `[]`.

```svelte
<Table dataSource={people} {columns} caption="Участники">
  {#snippet title(currentPage)}На странице: {currentPage.length}{/snippet}
  {#snippet footer(currentPage)}Всего баллов на странице:
    {currentPage.reduce((sum, person) => sum + person.score, 0)}
  {/snippet}
</Table>
```

Панели находятся внутри `.ant-table` до и после scroll container. Caption
сохраняет нативную подпись таблицы. Переданный пустой snippet сохраняет панель
и её отступы; отсутствие snippet убирает панель. Footer использует footerBg и
footerColor, обе панели — padding/font текущего размера и border/radius темы.
Смена страницы, сортировки, фильтра, loading или темы сохраняет содержимое
остающихся snippets и не создаёт дополнительных onChange callbacks.
Source comparison: [browser](../../../tests/browser/table-panels.spec.ts),
[SSR](../../../tests/package/table-panels.ssr.test.ts), fixture `?fixture=table-panels`.

## Итоговые строки

`summary` получает тот же readonly-массив записей текущей страницы, что
`title` и `footer`. В виртуальном режиме это вся страница. Snippet рендерится
в секции `tfoot` общей таблицы. `Table.Summary` группирует строки,
`Table.Summary.Row` передаёт атрибуты и события элементу `tr`.

```svelte
{#snippet totals(page: readonly Person[])}
  <Table.Summary>
    <Table.Summary.Row>
      <Table.Summary.Cell index={0}>Всего</Table.Summary.Cell>
      <Table.Summary.Cell index={1} align="right">
        {page.reduce((total, person) => total + person.score, 0)}
      </Table.Summary.Cell>
    </Table.Summary.Row>
  </Table.Summary>
{/snippet}

<Table dataSource={people} {columns} rowKey="id"
  scroll={{ y: 320 }} summary={{ fixed: 'bottom', render: totals }} />
```

`Table.Summary.Cell` принимает `colSpan`, `rowSpan`, `align` и HTML-атрибуты
ячейки. `index` отсчитывается с нуля среди видимых колонок, включая колонки
выделения и раскрытия. Объединённая ячейка закрепляется с той стороны,
на которой закреплены обе крайние колонки её `colSpan`.

Передайте `summary={totals}` для обычного итога после строк или
`summary={{ fixed: 'top', render: totals }}` для закрепления под шапкой.
`fixed: true` равнозначно `'bottom'`. Закрепление действует при `scroll.y`
или `sticky`. Конфигурация передаётся таблице, чтобы разместить секцию уже
при SSR. При скрытой шапке верхний итог остаётся видимым. Обычный итог
виртуальной таблицы доступен после последней строки.

Если при гидратации закреплённые колонки перекрывают редактор, который уже
в фокусе, таблица прокручивается к нему по горизонтали при наличии места между
колонками. DOM-узел, значение и выделение сохраняются. Исходное перекрытие
зафиксировано в [замере гидратации](../../../tests/browser/fixtures/ant-design-table-summary-focus-reference.json).

Сохранены 27 состояний Ant Design 6.6.8 и девять серверных снимков.
В двух исходных случаях итог исчезает при `showHeader={false}` с `fixed: 'top'`
и при виртуальном теле с обычным итогом. Эти случаи есть в
[замерах](../../../tests/browser/fixtures/ant-design-table-summary-reference.json).
Нативное размещение, доступ с клавиатуры и фокус редактора проверяют
[браузерные сценарии](../../../tests/browser/table-summary.spec.ts),
[гидратация](../../../tests/browser/table-summary-hydration.spec.ts) и
[SSR](../../../tests/package/table-summary.ssr.test.ts).

## Префиксы Table

`prefixCls` задаёт локальные классы Table; без непустого значения используется
`ConfigProvider.prefixCls + '-table'`. Checkbox, Pagination, Button и shell фильтра
разрешают общий prefix независимо от владельца таблицы. `dropdownPrefixCls`
задаёт префикс списка фильтров (`-menu`), как в исходном FilterDropdown;
он не меняет общий namespace shell и controls.

В upstream собственный dropdownPrefixCls оставляет filter Menu без соответствующих
CSS selectors; raw прозрачный фон сохранён отдельно от public inherited-prefix
counterpart. Svelte сохраняет прежнее оформление списка; только menu background
сравнивается с counterpart, остальные свойства — с raw Source.

187 правил закреплённого CSS изолированы по паре owner/shared prefix.
Публичные component tokens и marker `ant-table-css-var` сохраняют canonical имена,
а private `nested-border-top` следует общему namespace. Source theme, оформление
по умолчанию, fixed offsets/scroll и нативные controls сохраняются при обновлении
префикса. Открытый фильтр сохраняет draft/focus/IDs; раскрытая строка — editor,
выделение текста и FormData. Проверки: [browser](../../../tests/browser/table-prefix.spec.ts)
и [SSR](../../../tests/package/table-prefix.ssr.test.ts).

## Компонентная тема Table

`ConfigProvider.theme.components.Table` применяет исходные component tokens и
aliases к ячейкам, границам, сортировке, hover/selection, expand controls и фильтрам.
Поддержаны algorithms, custom cssVar prefix, вложенные provider и обновления
после mount. Local `style` сохраняет приоритет. Смена темы не пересоздаёт строки,
не меняет выбор/сортировку и не сбрасывает draft/focus в раскрытом snippet.

Native default size по-прежнему наследует `componentSize` (`medium` без настройки).
В теме Ant Design ширина selection column берётся из `selectionColumnWidth`,
а expand column — из исходной формулы `controlInteractiveSize + padding × 2`;
явный `expandable.columnWidth` имеет приоритет. Без source-темы обе колонки
сохраняют default 48px. Для fixed cells сохраняется непрозрачная подложка.

`stickyScrollBarBg` и `stickyScrollBarBorderRadius` оформляют бегунок
дополнительной полосы. Итоговые ячейки наследуют цвета и отступы таблицы.
Сравнение с эталоном, границы покрытия и наблюдение root style описаны в
[справочнике темы](../theme-context.md#тема-table).

## Закрепление заголовка и колонок

В обычном режиме `scroll.y` задаёт максимальную высоту прокручиваемой области
вместе с caption и заголовком. Число означает пиксели, строка — CSS-длину, например `"20rem"` или
`"calc(100vh - 240px)"`. Заголовок остаётся сверху при вертикальной прокрутке;
Pagination находится снаружи этой области. При закреплённом итоге `scroll.y`
относится к телу таблицы, а высоты шапки, caption и итога добавляются после
измерения. Без `scroll.y` высота следует за содержимым.

`sticky` закрепляет шапку при прокрутке окна и показывает дополнительную
горизонтальную полосу, когда тело шире области и продолжается ниже видимой
части окна. `sticky={{ offsetHeader: 48, offsetSummary: 12, offsetScroll: 8 }}`
задаёт отступы в пикселях для шапки, нижнего итога и полосы. По умолчанию
смещения равны нулю. `getContainer` может вернуть прокручиваемый элемент
и вычисляется после появления DOM. Шапка, тело, итоги и дополнительная полоса
прокручиваются по горизонтали вместе.

`column.fixed` принимает `true` (то же, что `"start"`), `"start"`, `"end"` или
`false`. Start закрепляет колонку у начала строки, end — у конца; в RTL стороны
меняются автоматически. `rowSelection={{ fixed: true }}` закрепляет колонку
выбора у начала строки. По умолчанию колонки не закреплены.

```svelte
<script lang="ts">
  import { Table, type TableColumn } from '@woodger/antd';

  interface Person { key: number; name: string; team: string; tasks: number }
  const people: Person[] = Array.from({ length: 30 }, (_, index) => ({
    key: index, name: `Участник ${index + 1}`, team: 'Разработка', tasks: index
  }));
  const columns: TableColumn<Person>[] = [
    { key: 'name', title: 'Участник', dataIndex: 'name', width: 200, fixed: true },
    { key: 'team', title: 'Команда', dataIndex: 'team', width: '24rem' },
    { key: 'tasks', title: 'Задачи', dataIndex: 'tasks', width: 100, fixed: 'end' }
  ];
</script>

<Table dataSource={people} {columns} caption="Участники"
  rowSelection={{ fixed: true }} scroll={{ x: 1000, y: 320 }} pagination={false} />
```

Несколько колонок с одной стороны получают смещения по фактической ширине
ячеек, включая закреплённую колонку выбора. Ширина пересчитывается при resize,
изменении содержимого и состава колонок. Можно использовать числовые и CSS-ширины;
для предсказуемого макета задавайте width и scroll.x. Если суммарная ширина
закреплённых колонок не меньше ширины области, горизонтальное закрепление
временно отключается. Все колонки доступны через прокрутку, заголовок остаётся
закреплённым. При расширении области закрепление восстанавливается.

Используется одна нативная таблица с CSS sticky. Порядок фокуса и snippets
сохраняется; отступы прокрутки учитывают закреплённые области. Фильтры используют
верхний слой popover и обновляют положение при прокрутке и изменении ширин.
Закреплённые ячейки имеют непрозрачный фон с учётом темы, сортировки и выбора.
ResizeObserver отключается при изменении конфигурации и unmount.

SSR обычной таблицы выводит все строки страницы и CSS-закрепление заголовка. Горизонтальное
закрепление активируется после измерения ширин в браузере; до гидратации
колонки доступны обычной прокруткой. Изменения layout не вызывают onChange или
onSelectionChange. Фильтрация, сортировка, выбор и пагинация сохраняют поведение
в обоих режимах данных.

## Виртуальные строки и прокрутка

`virtual` включает окно строк при заданном `scroll.y` и наличии данных. Числовой
`scroll.y` ограничивает высоту тела. Заголовок и caption закрепляются над ним
в одном контейнере прокрутки. Закреплённые итоги занимают отдельную полосу,
обычные прокручиваются после строк. Как в Ant Design 6.6.8, виртуальный режим использует
числовые `scroll.x` и `scroll.y`. Запасные значения равны 1 и 500 px соответственно.
Процентная ширина колонки рассчитывается от `scroll.x`, а свободная ширина
распределяется между колонками с учётом фактической ширины контейнера.

Таблица рендерит семантические `table`, `thead`, `tbody` и окно строк.
Раскрытые подробности входят в измеренную высоту своей строки. Выбор учитывает
всю страницу, в том числе строки вне окна и потомков свёрнутых веток. При выходе
из окна обычные строки и их snippets размонтируются. Объединённые ячейки
сохраняются, пока пересекают окно. SSR выводит первое окно по оценочной
высоте, а после гидратации таблица уточняет высоты по DOM.

`bind:this` предоставляет `TableRef.scrollTo({ top, key, index, align, offset })`.
`bind:nativeElement` даёт корневой `HTMLDivElement`. `top` задаёт абсолютную
вертикальную позицию и имеет приоритет над остальными полями. По `key` или `index`
метод адресует раскрытые строки текущей страницы. В обоих режимах доступны
`start`, `end` и `nearest`. `center` поддерживает обычная таблица. В виртуальном
режиме `offset` по умолчанию оставляет зазор сверху перед целевой строкой.
При `align="end"` зазор остаётся под строкой.

`onScroll` сообщает о прокрутке контейнера. В виртуальном режиме событие
относится к вертикальной оси. После пользовательской сортировки, фильтрации
или пагинации виртуальная таблица прокручивает к началу. Передайте
`scrollToFirstRowOnChange: false` в `scroll`, чтобы сохранить позицию,
или `true`, чтобы включить сброс и в обычном режиме.

Геометрия окна, RTL, выбор за его пределами и публичная прокрутка сверяются
с [замерами UMD](../../../tests/browser/fixtures/ant-design-table-virtual-reference.json).
Если часть строк переменной высоты ещё не измерена, точный `scrollTop` после
перехода по ключу зависит от оценок высоты. Сверка проверяет положение целевой
строки относительно видимой области.
Нативные клавиатура, caption, фокус и гидратация проверяются в Chromium.
React-замена `components.body` остаётся отдельным пробелом.

## Фильтры колонок

В клиентском режиме колонка задаёт варианты `filters: [{ text, value }]` и предикат
`onFilter(value, record)`. Значения string, number и boolean сохраняют тип, включая
числовой `0` и `false`. Несколько выбранных значений одной колонки объединяются
через OR, фильтры разных колонок — через AND.

```svelte
<script lang="ts">
  import { Table, type TableColumn, type TableFilters } from '@woodger/antd';

  interface Person { key: number; name: string; active: boolean }

  const people: Person[] = [
    { key: 0, name: 'Анна', active: true },
    { key: 1, name: 'Борис', active: false }
  ];
  const columns: TableColumn<Person>[] = [
    { key: 'name', title: 'Имя', dataIndex: 'name' },
    {
      key: 'active', title: 'Статус', dataIndex: 'active', filterMultiple: false,
      filters: [{ text: 'Активен', value: true }, { text: 'Приостановлен', value: false }],
      onFilter: (value, person) => person.active === value
    }
  ];
  let filters = $state<TableFilters>({});
</script>

<Table dataSource={people} {columns} bind:filters caption="Участники" />
```

`filters` таблицы — объект, где ключ соответствует `column.key`, а значение
содержит массив выбранных значений. Для отдельной таблицы доступен `defaultFilters`,
который читается один раз; при привязке задавайте начальное состояние у владельца.
`filterMultiple` по умолчанию разрешает несколько выбранных значений.
При `false` остаётся один вариант, а плоский список использует нативные radio.

Дочерние варианты задаются через `children`. При `filterMode: 'menu'` они
открываются как подменю. `filterMode: 'tree'` показывает раскрываемое дерево.
В режиме множественного выбора флажок ветки включает потомков, а общий флажок
выбирает все варианты. У ветвей и листьев сохраняются исходные значения.

`filterSearch: true` включает поиск по подписи. Меню скрывает неподходящие пункты,
а дерево выделяет совпадения. Предикат `filterSearch(input, option)` получает
исходный вариант. В меню запрос приводится к нижнему регистру и обрезается по
краям, в дереве передаётся текст поля. Поиск сохраняет отмеченные значения.
Запрос очищается при закрытии или сбросе, раскрытие дерева сохраняется.

`defaultFilteredValue` задаёт начальный фильтр колонки. Явный ключ в
`defaultFilters` таблицы имеет приоритет. `filteredValue` управляет колонкой,
включая пустое состояние через `null` или `[]`. При снятии управления через
`undefined` возвращается локальный критерий. При наличии `filteredValue`
таблица использует управляемые критерии колонок. Если задан `filters` или
начальный `defaultFilters` таблицы, её карта дополняет состояние остальных колонок.
`bind:filters` передаёт сделанный пользователем выбор, даже когда колонка
ожидает обновления `filteredValue` от владельца.

Критерии скрытых и адаптивных колонок участвуют в обработке данных.
`filtered` включает подсветку кнопки фильтра отдельно от критериев.

Пункты меню меняют черновик. «Применить» подтверждает его и закрывает меню.
«Сбросить» очищает черновик или возвращает `defaultFilteredValue` при
`filterResetToDefaultFilteredValue`. Для применения сброса нажмите «Применить». Escape,
нажатие снаружи и уход фокуса отменяют неподтверждённые изменения. Повторное
открытие начинает с применённого состояния. Изменение применённых значений колонки,
вариантов, режима выбора, disabled/loading или удаление колонки закрывают
устаревшее меню.

Пользовательское применение изменившегося фильтра задаёт `current=1` и вызывает
один `onChange` с `action='filter'`. Неизменившийся набор значений не вызывает
callback и не сбрасывает страницу. Если настроены фильтруемые колонки,
`onChange` также получает `filters` с нормализованными активными критериями;
без таких колонок формат прежних событий сохраняется. В типе `TableChange`
поле `filters` опционально. В клиентском режиме `currentDataSource` содержит
обработанные строки до пагинации по запрошенным критериям. Управляемая колонка
показывает строки по `filteredValue` владельца. `pagination.total` соответствует
отображаемой выборке до пагинации.

Внешние изменения filters, dataSource и columns не вызывают callbacks и не
переписывают страницу владельца. Дубликаты значений удаляются. Встроенный фильтр
игнорирует неизвестные варианты, удалённые колонки и колонки без списка или
предиката в клиентском режиме. При одиночном выборе применяется первое допустимое
значение.
Состояние владельца сохраняется, поэтому возвращённая колонка может снова
применить свой фильтр. Выбранные строки сохраняют ключи при скрытии фильтром;
«выбрать всё» затрагивает только доступные строки видимой страницы.

Меню использует нативный popover поверх прокручиваемой таблицы. Tab перемещает
фокус между controls, Space переключает Checkbox, стрелки меняют radio,
а Enter на нативном поле выбора подтверждает фильтр. В подменю и дереве
Space переключает выбранный вариант. В поле поиска Enter оставляет черновик
открытым. Escape возвращает фокус из подменю к его заголовку и из основной
панели к кнопке фильтра.
Меню остаётся в границах viewport и наследует тему и RTL. Подписи из
`locale.table` включают `filterTitle`, `filterApply`, `filterReset`,
`filterSearchPlaceholder` и `filterCheckAll`.

[Эталон](../../../tests/browser/fixtures/ant-design-table-filter-state-reference.json)
· [Chromium](../../../tests/browser/table-filter-state.spec.ts)
· [SSR](../../../tests/package/table-filter-state.ssr.test.ts)
· [Гидратация](../../../tests/browser/table-filter-state-hydration.spec.ts)

[Эталон вариантов и поиска](../../../tests/browser/fixtures/ant-design-table-filter-options-reference.json)
· [Chromium](../../../tests/browser/table-filter-options.spec.ts)
· [SSR](../../../tests/package/table-filter-options.ssr.test.ts)

### Пользовательская панель фильтра

`filterDropdown` заменяет содержимое панели snippet. `selectedKeys` содержит
черновик. `setSelectedKeys` обновляет его и принимает string, number и boolean.
Пользовательская панель сама определяет допустимые значения и их количество.
`filters` в аргументе snippet доступен как список предложенных вариантов.
Выбор пункта `Menu` внутри snippet оставляет панель открытой. Callback
`onSelect` может передать новые ключи в `setSelectedKeys`.

```svelte
<script lang="ts">
  import { Table, type TableColumn, type TableFilterDropdownProps } from '@woodger/antd';

  type Row = { key: string; team: string };
  const dataSource: Row[] = [{ key: '1', team: 'core' }, { key: '2', team: 'ops' }];
  const columns: TableColumn<Row>[] = [{
    key: 'team',
    dataIndex: 'team',
    title: 'Команда',
    filterDropdown: teamFilter,
    onFilter: (key, row) => key === row.team
  }];
</script>

{#snippet teamFilter(filter: TableFilterDropdownProps)}
  <button type="button" onclick={() => filter.setSelectedKeys(['core'])}>
    Основная команда
  </button>
  <button type="button" onclick={() => filter.confirm()}>Применить</button>
{/snippet}

<Table {columns} {dataSource} pagination={false} />
```

`confirm()` запрашивает закрытие панели перед применением. Вызов
`confirm({ closeDropdown: false })` применяет условия, сохраняя панель открытой.
`close()` закрывает её без изменений. `clearFilters()` возвращает начальный
черновик. При `filterResetToDefaultFilteredValue` это `defaultFilteredValue`.
Опция `confirm: true` снимает применённый фильтр, а `closeDropdown: true`
запрашивает закрытие после этого. Открытая панель синхронизирует черновик
при изменениях применённых значений владельца.

`filterDropdownProps` передаёт параметры в Dropdown. `open` управляет
видимостью, а `onOpenChange` сообщает о запросе. `placement`, `trigger`,
`getPopupContainer`, `destroyOnHidden` и `forceRender` используют правила
Dropdown. `popupRender` получает snippet исходного содержимого. `filterIcon`
заменяет декоративную иконку и получает признак активного фильтра.

Встроенная панель по умолчанию отменяет черновик при закрытии. При
`filterOnClose: true` действия пользователя, закрывающие панель, применяют
черновик. Обновление `open` владельцем переключает видимость. Пользовательская
панель применяет условия через `confirm` или `clearFilters({ confirm: true })`.

[Эталон панели](../../../tests/browser/fixtures/ant-design-table-filter-dropdown-reference.json)
· [Chromium](../../../tests/browser/table-filter-dropdown.spec.ts)
· [SSR](../../../tests/package/table-filter-dropdown.ssr.test.ts)

## Направления и приоритеты сортировки

`column.sorter` принимает компаратор `(left, right, order) => number` или объект
`{ compare, multiple }`. Table передаёт активное направление компаратору и
применяет знак направления к его результату. Компараторы исполняются от большего
`multiple` к меньшему, включая нулевой и отрицательные приоритеты. При равных
приоритетах используется порядок критериев. При равенстве по всем критериям
сохраняется исходный порядок записей. В дереве сравниваются соседи каждого уровня.

`sortDirections` таблицы задаёт цикл. Свой список колонки имеет приоритет.
После последнего направления следующий клик очищает сортировку. Цикл
`['ascend', 'descend', 'ascend']` переключает два направления без очистки.
Стрелки появляются для направлений этого списка. `sortIcon` заменяет их
декоративным snippet и получает `{ sortOrder }`, где отсутствие направления
представлено `null`. Название и фокус остаются у кнопки заголовка.

`column.sortOrder` управляет отображаемым направлением, включая явный `null`.
Table читает эти настройки и у скрытых колонок. При клике `onChange` получает
запрошенные критерии и рассчитанный по ним `currentDataSource`. Отображаемые
строки переходят в этот порядок после обновления колонки владельцем.
Без управляемых колонок заданный корневой `sorter` задаёт один критерий.
Для начального состояния `defaultSorter` имеет приоритет над
`column.defaultSortOrder`. Оба значения читаются при создании таблицы.
Удалённый критерий пропускается, пока колонка отсутствует.

Для нескольких колонок задавайте числовой `multiple` в их конфигурации.
Выбор одиночной колонки заменяет список. При выборе совмещаемой колонки
её критерий переносится в конец списка. В `onChange` скалярный `sorter`
по-прежнему передаёт первый активный критерий или `null`. При настроенном
`multiple` или нескольких активных критериях событие дополнительно
передаёт `sorters` с полным списком активных критериев в порядке состояния.
Объект сортировки без `compare` передаёт критерий владельцу и сохраняет
порядок записей.
[Эталон](../../../tests/browser/fixtures/ant-design-table-sorter-reference.json)
· [Chromium](../../../tests/browser/table-sorter.spec.ts)
· [SSR](../../../tests/package/table-sorter.ssr.test.ts)
· [Гидратация](../../../tests/browser/table-sorter-hydration.spec.ts)

### Подсказка сортировки

`showSorterTooltip` включён по умолчанию и показывает следующее направление
из цикла сортировки. Настройка колонки целиком перекрывает настройку таблицы.
Значение `false` отключает подсказку и оставляет кнопку сортировки доступной.

По умолчанию срабатывает наведение на заголовок. В колонке с фильтром
у сортировки своя область наведения. `{ target: 'sorter-icon' }` ограничивает
её иконкой. За выбор направления отвечает одна кнопка с Enter и Space,
а иконка остаётся декоративной. `trigger: 'focus'` у заголовка подключает
Tooltip к фокусу этой кнопки.

Объект `showSorterTooltip` использует параметры [Tooltip](./tooltip.md),
включая `title`, `placement`, `trigger`, `open`, `onOpenChange`,
`getPopupContainer`, `prefixCls`, `classNames` и `styles`. Явный `title`
заменяет локализованное направление, включая пустую строку и число `0`.
При смене области или отключении Tooltip отменяет ожидающее открытие.
Кнопка сохраняет DOM, фокус и текущее направление.
Доступное описание кнопки сообщает следующее направление при закрытой подсказке.
Открытая подсказка заголовка описывает кнопку своим содержимым.
[Эталон](../../../tests/browser/fixtures/ant-design-table-sorter-tooltip-reference.json)
· [Chromium](../../../tests/browser/table-sorter-tooltip.spec.ts)
· [SSR](../../../tests/package/table-sorter-tooltip.ssr.test.ts)

## Серверный режим

`mode="server"` показывает переданную страницу `dataSource` целиком и в исходном
порядке. Table не фильтрует, не сортирует и не разрезает её повторно, даже если
переданы локальные `sorter`/`onFilter` или число строк отличается от pageSize.
Передавайте `total` из ответа API: он определяет диапазон Pagination. Если total
не указан, используется длина dataSource. Его нормализация совпадает с Pagination.
`pagination={false}` скрывает навигацию и сохраняет все переданные строки.

Для удалённой сортировки задавайте `column.sorter: true` или объект с
`multiple` для совмещения критериев. Для фильтра достаточно `column.filters`
без `onFilter`. Значение `sorter: true` используется в серверном режиме,
а компаратор исполняется в клиентском. Правила нормализации фильтров, одиночного
выбора и цикл сортировки сохраняются. Сортировка сохраняет страницу, применение
изменившегося фильтра задаёт страницу 1.

`onChange` получает текущие `pagination`, `sorter`, `filters` и причину действия.
В серверном режиме `currentDataSource` содержит только переданную страницу,
а `pagination.total` — внешний total. Строки остаются прежними до замены
dataSource владельцем. Внешние обновления props не вызывают callback и не
переписывают состояние владельца, включая current при уменьшении total.
Владелец должен запросить допустимую страницу, если текущая больше нового
диапазона; Table сам запросов не выполняет.

`selectedRowKeys` сохраняет ключи между заменами страниц. `onSelectionChange`
передаёт все выбранные ключи, но records содержит только выбранные записи,
присутствующие в текущем dataSource. Кэш записей других страниц отсутствует.
Выбор всех действует на доступные строки загруженной страницы.

В примере сервер принимает параметры `page` и `pageSize` и возвращает JSON
с массивом `rows` и общим количеством записей `total`. Подставьте адрес своего
API. Когда пользователь меняет страницу, привязки обновляют параметры запроса.
При смене страницы или удалении компонента предыдущий запрос отменяется.

```svelte
<script lang="ts">
  import { Table, type TableColumn } from '@woodger/antd';

  interface Member {
    id: number;
    name: string;
  }

  const columns: TableColumn<Member>[] = [
    { key: 'name', title: 'Участник', dataIndex: 'name' }
  ];
  let current = $state(1);
  let pageSize = $state(10);
  let rows = $state<Member[]>([]);
  let total = $state(0);
  let loading = $state(false);
  let error = $state('');

  $effect(() => {
    const controller = new AbortController();
    const url = `/api/members?page=${current}&pageSize=${pageSize}`;

    async function loadPage() {
      loading = true;
      error = '';
      rows = [];

      try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Ошибка загрузки (HTTP ${response.status})`);
        }

        const page: { rows: Member[]; total: number } = await response.json();

        if (!controller.signal.aborted) {
          rows = page.rows;
          total = page.total;
        }
      }
      catch (cause) {
        if (!controller.signal.aborted) {
          error = cause instanceof Error ? cause.message : 'Не удалось загрузить страницу';
        }
      }
      finally {
        if (!controller.signal.aborted) {
          loading = false;
        }
      }
    }

    void loadPage();

    return () => controller.abort();
  });
</script>

{#if error}
  <p role="alert">{error}</p>
{/if}

<Table
  mode="server"
  rowKey="id"
  dataSource={rows}
  {columns}
  {total}
  {loading}
  bind:current
  bind:pageSize
  caption="Участники"
/>
```
