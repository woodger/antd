# TreeSelect

TreeSelect позволяет выбирать значения в иерархическом списке. Состояние
флажков рассчитывается по полному дереву, включая скрытые фильтром узлы.

```svelte
<script lang="ts">
  import { TreeSelect } from '@woodger/antd';
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
проверяются в [package SSR](../../../tests/package/tree-select/tree-select-max-count.ssr.test.ts), без
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
[SSR](../../../tests/package/tree-select/tree-select-tags.ssr.test.ts) и
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
[SSR](../../../tests/package/tree-select/tree-select-labels.ssr.test.ts) и
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
[SSR](../../../tests/package/tree-select/tree-select-surface.ssr.test.ts),
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
Панель получает `styles.root`, затем `styles.popup.root`. Слой поля задаётся
отдельно. Панель берёт `z-index` из `styles.popup.root` или
[контекста владельца](../theme-context.md#уровни-вложенных-панелей).
Числовой `popupMatchSelectWidth` имеет приоритет над `width` в стилях. По умолчанию
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
[SSR](../../../tests/package/tree-select/tree-select-semantic.ssr.test.ts).

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
отсутствие callbacks после unmount. [SSR](../../../tests/package/tree-select/tree-select-expand-action.ssr.test.ts)
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
  import { TreeSelect, type TreeSelectInputContext } from '@woodger/antd';
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
  import { TreeSelect, type TreeSelectRootContext } from '@woodger/antd';
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
[SSR](../../../tests/package/tree-select/tree-select-inert-api.ssr.test.ts) сравнивают независимый
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
[DOM-free SSR](../../../tests/package/tree-select/tree-select-align.ssr.test.ts) и
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
[DOM-free SSR](../../../tests/package/tree-select/tree-select-motion.ssr.test.ts) и
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
[SSR](../../../tests/package/tree-select/tree-select-prefix.ssr.test.ts).

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
[SSR](../../../tests/package/tree-select/tree-select-data.ssr.test.ts) проверяют соответствующие границы.
Два дефекта Source записаны отдельно: simple mode дописывает детей во входной
children array, а raw renderer сначала получает labeled value вместо data node.
Native сохраняет входной массив и передаёт renderer полную запись с payload.

