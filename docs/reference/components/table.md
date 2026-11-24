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
`dataSource` и `columns` принимают readonly-массивы. Каждая колонка имеет
уникальный строковый `key` и текстовый `title`. `dataIndex` выбирает одно поле
`keyof Row`; null/undefined отображаются пустой строкой, остальные значения —
через безопасное текстовое преобразование. `render(record, index)` заменяет
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

Сортировка задаётся через `sorter: { columnKey, order } | null` и поддерживает
привязку. Компаратор принадлежит `column.sorter`. Нажатие заголовка переключает
`ascend → descend → null`. Равные значения сохраняют порядок исходных записей
в обоих направлениях; входной массив не изменяется. Плоские данные фильтруются
перед сортировкой. После обработки выбирается текущая страница. Номер страницы при сортировке
сохраняется. Если колонка удалена или не имеет компаратора, отображается исходный
порядок прошедших фильтр записей без изменения состояния владельца.

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
`single` или `all`. Records идут в порядке выбранных ключей и содержат только
записи, присутствующие в текущем dataSource, включая скрытые фильтром;
отсутствующие записи не кэшируются.
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

## Раскрываемые строки

`expandable.expandedRowRender` добавляет перед колонкой выбора отдельную колонку с кнопками
раскрытия. `expandedRowRender(record, index)` — типизированный snippet с
подробностями; index начинается с 0 среди строк данных текущей страницы.
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
`columnTitle` задаёт видимый заголовок; по умолчанию он только доступен скринридеру.
`fixed: true` закрепляет колонку у начала строки, включая RTL. Смещения и colspan
учитывают раскрытие, выбор и данные. При горизонтальной прокрутке содержимое
подробностей остаётся в ширине видимой области. Ширины колонок данных сохраняются.

Кнопка имеет type=button и aria-expanded. В раскрытом состоянии aria-controls
ссылается на существующий блок подробностей с уникальным ID. Enter и Space
переключают состояние и сохраняют фокус на кнопке. Loading и disabled блокируют
переключение, disabled наследуется из ConfigProvider. Подписи задаются через
`locale.table.expandColumn`, `expandRow`, `collapseRow`.

`expandable.expandRowByClick` включает раскрытие нажатием на строку. Элементы
управления внутри ячеек обрабатывают свои нажатия. `expandable.showExpandColumn=false`
скрывает колонку подробностей либо встроенные переключатели дерева.

Snippet создаётся только для видимой раскрытой строки. Сворачивание, скрытие
фильтром, уход со страницы или запрет rowExpandable удаляют его из DOM и
сбрасывают локальное состояние controls. Данные, которые нужно сохранить,
держите у владельца. SSR сразу отображает переданные раскрытые строки.
Поддержка React-настройки `forceRender` остаётся в очереди.

## Древовидные данные

Массив `children` включает раскрытие веток кнопками в первой видимой колонке
данных. Имя поля можно поменять через `expandable.childrenColumnName`. Ключи
уникальны на всех уровнях. Пустой массив тоже задаёт раскрываемую ветку и подходит
для заполнения потомков после `onExpand`. Вложенность отображается с шагом
`expandable.indentSize` в пикселях, по умолчанию 15. `expandedRowRender` включает
режим подробностей, в котором `rowExpandable` задаёт доступные строки.

В client mode сортировка действует среди соседних записей на каждом уровне.
После неё фильтр рекурсивно обрабатывает потомков перед проверкой родителя.
Если родитель отфильтрован, ветка исчезает целиком. Пагинация делит только
корневые записи. `title`, `footer` и `onChange.currentDataSource` получают
дерево со вложенными записями. В server mode порядок и состав веток определяет
владелец.

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

Summary и отдельная sticky scrollbar ещё не реализованы:
соответствующие declarations готовятся, но сами по себе не добавляют этот API.
Сравнение с эталоном, границы покрытия и наблюдение root style описаны в
[справочнике темы](../theme-context.md#тема-table).

## Закрепление заголовка и колонок

`scroll.y` задаёт максимальную высоту прокручиваемой области вместе с caption
и заголовком. Число означает пиксели, строка — CSS-длину, например `"20rem"` или
`"calc(100vh - 240px)"`. Заголовок остаётся сверху при вертикальной прокрутке;
Pagination находится снаружи этой области. Без scroll.y высота не ограничена
и заголовок прокручивается вместе с таблицей.

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

SSR сохраняет полную разметку, данные и CSS-закрепление заголовка. Горизонтальное
закрепление активируется после измерения ширин в браузере; до гидратации
колонки доступны обычной прокруткой. Изменения layout не вызывают onChange или
onSelectionChange. Фильтрация, сортировка, выбор и пагинация сохраняют поведение
в обоих режимах данных.

## Фильтры колонок

В клиентском режиме в колонке задаются плоский список `filters: [{ text, value }]` и предикат
`onFilter(value, record)`. Значения — string, number или boolean; числовой `0`
и `false` сохраняют тип. Несколько выбранных значений одной колонки объединяются
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
`filterMultiple` по умолчанию равен true и использует Checkbox; false включает
одиночный выбор нативными radio.

Пункты меню меняют черновик. «Применить» подтверждает его и закрывает меню;
«Сбросить» очищает черновик, после чего нужно нажать «Применить». Escape,
нажатие снаружи и уход фокуса отменяют неподтверждённые изменения. Повторное
открытие начинает с применённого состояния. Изменение применённых значений колонки,
вариантов, режима выбора, disabled/loading или удаление колонки закрывают
устаревшее меню.

Пользовательское применение изменившегося фильтра задаёт `current=1` и вызывает
один `onChange` с `action='filter'`. Неизменившийся набор значений не вызывает
callback и не сбрасывает страницу. Если настроены фильтруемые колонки,
`onChange` также получает `filters` с нормализованными активными критериями;
без таких колонок формат прежних событий сохраняется. В типе TableChange
поле filters опционально. В клиентском режиме `currentDataSource` содержит отфильтрованный и
отсортированный набор до пагинации, pagination.total — его длину.

Внешние изменения filters, dataSource и columns не вызывают callbacks и не
переписывают страницу владельца. Дубликаты значений удаляются; неизвестные
варианты, удалённые колонки и колонки без списка/предиката в клиентском режиме игнорируются при
отображении. В одиночном режиме используется первое допустимое значение.
Состояние владельца сохраняется, поэтому возвращённая колонка может снова
применить свой фильтр. Выбранные строки сохраняют ключи при скрытии фильтром;
«выбрать всё» затрагивает только доступные строки видимой страницы.

Меню использует нативный popover поверх прокручиваемой таблицы. Tab перемещает
фокус между controls, Space переключает Checkbox, стрелки меняют radio,
Enter на пункте подтверждает фильтр, Escape закрывает меню с возвратом к кнопке.
Меню остаётся в границах viewport и наследует тему, RTL и `locale.table`:
`filterTitle`, `filterApply`, `filterReset`.

## Серверный режим

`mode="server"` показывает переданную страницу `dataSource` целиком и в исходном
порядке. Table не фильтрует, не сортирует и не разрезает её повторно, даже если
переданы локальные `sorter`/`onFilter` или число строк отличается от pageSize.
Передавайте `total` из ответа API: он определяет диапазон Pagination. Если total
не указан, используется длина dataSource. Его нормализация совпадает с Pagination.
`pagination={false}` скрывает навигацию и сохраняет все переданные строки.

Для удалённой сортировки задавайте `column.sorter: true`; для фильтра достаточно
`column.filters` без `onFilter`. Значение `sorter: true` используется только в
серверном режиме; компаратор поддерживается в обоих режимах, но исполняется только
в клиентском. Правила нормализации фильтров, одиночного выбора и цикл сортировки
сохраняются. Сортировка сохраняет страницу, применение изменившегося фильтра
задаёт страницу 1.

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
