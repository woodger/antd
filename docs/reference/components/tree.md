# Tree

Tree отображает иерархические данные и поддерживает раскрытие, выбор и отметку
узлов.

```svelte
<script lang="ts">
  import { Tree, type TreeKey, type TreeCheckedKeys } from '@woodger/antd';
  const nodes = [{key:'docs',title:'Документы',children:[{key:'intro',title:'Введение'}]}];
  let expanded = $state<TreeKey[]>(['docs']);
  let checked = $state<TreeKey[] | TreeCheckedKeys>([]);
</script>
<Tree treeData={nodes} aria-label="Документы" checkable expandedKeys={expanded}
  checkedKeys={checked} onExpand={keys => { expanded = keys; }}
  onCheck={keys => { checked = keys; }} />
```

TreeData — массив узлов со стабильным уникальным key (string/number/bigint), title
(текст, число, пустое содержимое, массив или snippet) и children. Ключи должны быть уникальны и
после String(key), как в upstream entity index. Поддержаны disabled,
disableCheckbox, checkable, selectable, isLeaf, icon и локальные class/style.
ExpandedKeys/selectedKeys/checkedKeys/loadedKeys — controlled props; default-пары
инициализируют внутреннее состояние. Владелец может отклонить callback. Массивы
ключей и treeData обновляются новым значением, как в исходном controlled API.

DefaultExpandParent=true раскрывает родителей начальных expanded keys до disabled
границы. AutoExpandParent=false по умолчанию; true повторяет раскрытие родителей
при изменении controlled keys. Чтобы разрешить сворачивание предка при сохранённом
ключе потомка, отключите autoExpandParent. DefaultExpandAll применяется только
при инициализации к узлам с детьми; данные, поступившие позже, сами по себе не
расширяют этот начальный набор.

Выбор строки независим от checkbox. Multiple переключает отдельные ключи без
обязательного Ctrl и не добавляет range selection. Selectable=false переводит
клик заголовка на отметку. Node.selectable перекрывает tree selectable. В обычном
checkable-режиме отметки распространяются вниз и вверх; disabled,
disableCheckbox и checkable=false останавливают conduction. Disabled-потомки
не мешают полноте отметки разрешённого родителя. Снятие отметки использует исходный
fill/clean algorithm; дети, добавленные в отмеченного родителя, получают отметку.
CheckStrictly=true разрывает связи и onCheck возвращает {checked,halfChecked}.
Без него onCheck возвращает массив и info.halfCheckedKeys/checkedNodesPositions.
CheckedKeys в strict режиме принимает также объект с halfChecked.

OnExpand(keys,{expanded,node,nativeEvent}), onSelect(keys,{event,selected,node,
selectedNodes,nativeEvent}), onCheck(keys,{event,checked,node,checkedNodes,...})
сохраняют отдельные события. Node включает исходные данные, pos и flags
expanded/selected/checked/halfChecked/loaded/loading/active. Mouse callback содержит
нативный event; keyboard callbacks соответствуют внутреннему пути rc-tree и могут
не иметь nativeEvent. Дополнительно поддержаны onClick/onDoubleClick/onRightClick
и onActiveChange. Состояние node в callback относится к узлу до действия.

`expandAction` включает раскрытие заголовком: false по умолчанию, 'click' или
'doubleClick'. Ctrl/Meta/Shift оставляют выбор без раскрытия. При click-expansion
onExpand предшествует onClick и последующему onSelect/onCheck; флаги node остаются
снимком до действия, даже если callback синхронно обновил controlled selection.
Заголовок может свернуть pending-ветку; прежний pointer switcher ждёт загрузку.
Title action проверяет исходный isLeaf: узел без детей сохраняет expanded keys,
чтобы показать детей после обновления данных, и обрабатывает действие при поиске.
Смена expandAction сохраняет DOM, выбранные ключи и внешний draft/focus/selection.
[22 исходных случая](../../../tests/browser/fixtures/ant-design-tree-expand-action-reference.json),
[counterpart с завершёнными переходами](../../../tests/browser/fixtures/ant-design-tree-expand-action-settled-reference.json),
[browser](../../../tests/browser/tree-expand-action.spec.ts) и
[SSR](../../../tests/package/tree-expand-action.ssr.test.ts) проверяют эти границы.

В rc-tree 1.4.0 быстрый двойной клик с expandAction='click' может свернуть узел,
оставив только первый onExpand(expanded=true): предварительное обновление keys
обходит guard listChanging. Raw observation сохранён в случае click-double.
Native сообщает каждый фактический переход, как Source при двух завершённых
кликах. Полный list motion остаётся отдельным неперенесённым объёмом.

LoadData(node) возвращает PromiseLike. Дети добавляются потребителем в treeData;
компонент их не выдумывает. Loading дедуплицируется по ключу; pointer switcher ждёт завершения загрузки,
но клавиатура позволяет свернуть pending-ветку. OnLoad(keys,{event:'load',
node}) вызывается до внутреннего обновления loadedKeys. При controlled loadedKeys
владелец принимает новый набор сам. Загрузка запускается и для изначально раскрытой
видимой незагруженной ветки. Узел с уже имеющимися детьми не загружается повторно;
isLeaf=true запрещает загрузку, isLeaf=false сохраняет switcher даже у пустой
загруженной ветки. Rejection снимает loading и сворачивает uncontrolled ветку,
не вызывая onLoad; повторное раскрытие позволяет retry. После 10 неудачных попыток
загрузка прекращается, ключ помечается загруженным без успешного onLoad. Отдельного
onError/публичного error-state в исходном Tree нет: обработка ошибки остаётся в
loadData потребителя. Результаты после unmount не меняют состояние и callbacks.

Клавиатура использует один tab stop на role=tree и aria-activedescendant. Up/Down
перемещаются циклически по видимым строкам, Home/End — к краям. Left сворачивает
либо переходит к родителю, Right раскрывает либо переходит к первому ребёнку;
эти действия не инвертируются в RTL, как в rc-tree. Enter раскрывает ветку либо
однократно выбирает/отмечает лист; Space переключает отметку, а без checkable —
выбор. Disabled-строки остаются в навигации. Disabled блокирует выбор/отметки,
но switcher допускает раскрытие мышью, как upstream; global disabled отключает
клавиатурную обработку. Native buttons имеют tabindex=-1; роли treeitem/checkbox
и level/posinset/setsize отражают логическое дерево. Bind:nativeElement даёт root;
bind:this предоставляет focus(options)/blur()/scrollTo(config).

BlockNode, showLine и showLine={{showLeafIcon:true}}, showIcon, icon,
switcherIcon/switcherLoadingIcon, titleRender и filterTreeNode поддержаны.
Иконки и заголовки задаются snippets с node-аргументом; filterTreeNode подсвечивает
узел и не удаляет его из дерева. RU/EN подписи switcher берутся из Locale.tree;
темы, compact, RTL, ConfigProvider/Form disabled наследуют существующие контексты.
Height ограничивает viewport и включает виртуальное окно. Без height либо при
height=0 выводятся все раскрытые строки без ограничения высоты, как в Source.
Virtual=false оставляет native scroll со всеми строками. Undefined наследует
ConfigProvider.virtual; по умолчанию Tree включает виртуализацию, Listy — выключает.
SSR использует начальную оценку окна без DOM-измерений, загрузки и timers.

Оценка строки следует Tree tokens: paddingXS/2 + (titleHeight || controlHeightSM).
ItemHeight переопределяет её; itemHeight=0 отключает виртуальное окно. После mount
измеряются реальные строки с margins, cache сохраняется по ключам до unmount.
Границы окна и overscan следуют virtual-list 1.5.1. ScrollWidth включает
горизонтальную прокрутку, включая fitting dataset; колесо, Shift+wheel, touch,
перетаскивание и клики scrollbar поддерживают обе оси и RTL.

```svelte
<script lang="ts">
  import { Tree, type TreeRef } from '@woodger/antd';

  const nodes = Array.from({ length: 100 }, (_, key) => ({ key, title: `Node ${key}` }));
  let tree = $state<TreeRef>();
</script>

<Tree treeData={nodes} height={240} bind:this={tree} aria-label="Nodes" />
<button onclick={() => tree?.scrollTo({ key: 80, align: 'top', offset: 8 })}>Show node</button>
```

ScrollTo принимает число, {top,left}, key либо index с align='top'/'bottom'/'auto'.
Left — неотрицательная логическая позиция и в RTL. Offset бывает числом или
функцией ({getSize,align}) => number; getSize(startKey,endKey?) читает измеренные
либо оценённые top/bottom, неизвестный endKey даёт bottom=undefined. NaN/Infinity
offset заменяются нулём. Измерение и выравнивание повторяются до десяти проходов;
более поздний запрос отменяет предыдущий. Неизвестный key сохраняет позицию.
Null/undefined показывают scrollbar. AutoExpand у key-запроса добавляет только
целевой ключ в uncontrolled expandedKeys, без раскрытия предков или onExpand.
ItemScrollOffset задаёт отступ автоматической прокрутки активного узла.
OnScroll (либо native onscroll) получает событие holder; root ref остаётся прежним.
DirectoryTree предоставляет те же методы. Загрузка изначально раскрытых узлов
начинается при их попадании в смонтированное окно; результаты после unmount игнорируются.

Шесть ошибок Source сохранены как raw observations и не переносятся: stale estimate
при смене itemHeight/theme, потеря active key=0, ссылка aria-activedescendant на
отсутствующий DOM, local virtual=undefined поверх global false и пропущенный
direction в rc-tree NodeList, отрицательный offset при scrollWidth меньше viewport.
Native ограничивает offset снизу нулём, обновляет оценку без клонирования data,
сохраняет key=0, валидный ARIA target, наследование и направление обеих осей.
[28 исходных browser случаев, 12 SSR и шесть наблюдений](../../../tests/browser/fixtures/ant-design-tree-virtual-reference.json),
[Source browser](../../../tests/browser/tree-virtual.spec.ts),
[Native browser](../../../tests/browser/tree-virtual-native.spec.ts) и
[SSR](../../../tests/package/tree-virtual.ssr.test.ts) проверяют эти границы.

Tree и DirectoryTree выводят тип пользовательской записи из `treeData`.
`fieldNames={{ key: 'id', title: 'caption', children: 'items' }}` задаёт имена полей;
пустые имена используют стандартные key/title/children. Поля с прежними именами
не подменяют выбранную схему. Настройка действует на раскрытие, leaf state,
conduction, lazy load, renderers и диапазоны DirectoryTree.

```svelte
<script lang="ts">
  import { Tree } from '@woodger/antd';

  interface Entry {
    id: number;
    caption: string;
    priority: number;
    items?: Entry[];
  }
  const entries: Entry[] = [{ id: 0, caption: 'Документ', priority: 2 }];
</script>

<Tree treeData={entries} fieldNames={{ key: 'id', title: 'caption', children: 'items' }}
  onSelect={(_keys, info) => console.log(info.node.priority, info.selectedNodes)} />
```

`TreeProps<Data>`, `DirectoryTreeProps<Data>`, `TreeEventNode<Data>` и
`TreeCheckInfo<Data>` сохраняют тип payload, включая discriminated unions;
`TreeFieldDataNode<Payload, ChildName>`
помогает объявить рекурсивные записи с общими flags и snippets. `info.node` содержит
исходные поля, но canonical key и state flags перекрываются состоянием дерева.
`selectedNodes`, `checkedNodes` и позиции отметок сохраняют исходные объекты,
включая прежний raw key. `titleRender` получает исходную запись; snippet в самом
поле title имеет приоритет над общим renderer, как в Source. При titleRender
поле заголовка может содержать произвольный payload, который читает этот snippet.

Новые ссылки на `treeData` или `fieldNames` обновляют индекс без замены компонента.
Смена только fieldNames также обновляет заголовки и дочерние поля. Это исправляет
явную ошибку cache в rc-tree 1.4.0: Source оставляет старые flatten entities до
замены treeData. Raw observation сохранено вместе с публичным Source counterpart,
который обновляет оба props. Существующие keys, DOM/ref и active IDs сохраняются.
[27 raw UMD сценариев и наблюдение](../../../tests/browser/fixtures/ant-design-tree-fields-reference.json),
[browser](../../../tests/browser/tree-fields.spec.ts),
[SSR](../../../tests/package/tree-fields.ssr.test.ts) и
[типизированные записи](../../../tests/browser/fixtures/TreeGenericFields.svelte) проверяют
aliases, исходные объекты, strict/conduction, lazy load, controlled keys, snippets,
DirectoryTree, RTL/prefix и смену схемы.

`TreeDataNode.switcherIcon` задаёт switcher конкретного узла, включая лист,
и имеет приоритет над общим renderer, линиями и loading icon. Общий
`switcherIcon` применяется к веткам после loading; `showLine.showLeafIcon`
принимает также snippet. Рендереры получают вычисленный `isLeaf`; пустой snippet
оставляет существующий native switcher без содержимого. Snippets сохраняют своё
содержимое и классы вместо клонирования React elements.
`onMouseEnter`/`onMouseLeave` получают `{event,node}` при входе/уходе с содержимого
строки, включая disabled. Наведение на switcher не является событием содержимого.
Node в событии сохраняет исходный `isLeaf` и актуальные selected/expanded/loading;
вычисленный флаг рендерера не подменяет исходные данные.
После unmount hover callbacks не вызываются, даже если потребитель удерживает
удалённый DOM-узел и отправляет ему событие.
[14 raw UMD сценариев](../../../tests/browser/fixtures/ant-design-tree-node-renderers-reference.json),
[browser](../../../tests/browser/tree-node-renderers.spec.ts) и
[SSR](../../../tests/package/tree-node-renderers.ssr.test.ts) проверяют приоритеты,
текст/элементы/пустое содержимое, центрирование switcher, pending load, hover,
RTL/prefix и DirectoryTree. Сброс native button styles сохраняет исходный
`text-align: center` у switcher; наследуемое выравнивание остаётся у содержимого строки.

`prefixCls` меняет namespace дерева, nodes, checkbox, switcher и линий; пустая
строка наследует ConfigProvider.prefixCls. Canonical Tree tokens и generated IDs
сохранены; общий Row selector независим от local prefix. Шаблон tree-prefix
воспроизводит 98 исходных правил с изоляцией root/RTL/line scopes.
[Raw замеры](../../../tests/browser/fixtures/ant-design-tree-prefix-reference.json)
отделены от public root-style и readonly-selection counterparts. Прежний Native
Tree сохраняет заданный selection при selectable=false; React при initial render
его отбрасывает. Отдельный public вариант запрещает selection на каждом узле.
Смена prefix сохраняет DOM/ref, active descendant, focus, checked/selected state
и pending load. Внутренний TreeSelect пока использует canonical Tree namespace
своего существующего CSS-адаптера; его собственный prefix API переносится отдельно.

`ConfigProvider.theme.components.Tree` подключён к общему механизму компонентной
темы: метрики title/switcher/indent, hover/selected colors, alias overrides,
global/component algorithms и custom cssVar prefix. Локальные CSS variables и
`style` сохраняют приоритет. DirectoryTree использует те же настройки и отдельные
directoryNodeSelectedBg/directoryNodeSelectedColor. Внутреннее дерево
TreeSelect использует тему Select/TreeSelect, независимо от `components.Tree`.
Отдельный UMD-замер проверяет одновременные конфликтующие настройки трёх компонентов.

Сохранён прежний native contract: `Tree.style` оформляет внешний корень. В React
этот prop относится к внутреннему `.ant-tree-list`; исходные замеры обоих слоёв
сохранены в [UMD-эталоне](../../../tests/browser/fixtures/ant-design-tree-theme-reference.json).
Сверка видимого содержимого охватывает 14 тем / 112 наборов CSS-измерений, включая
checkbox, disabled/selected/active nodes, RTL и nested/reset/sibling scopes.
[Browser-проверки](../../../tests/browser/tree-theme.spec.ts) также подтверждают сохранение
DOM, фокуса, active descendant, отметок и pending load при обновлении токенов;
[SSR-проверки](../../../tests/package/tree-theme.ssr.test.ts) не запускают загрузку или
браузерные ресурсы. Декларации сверяются с официальным UMD отдельным
[unit-набором](../../../src/lib/theme-tree-tokens-reference.test.ts).

`classNames` и `styles` настраивают пять частей: root, item, itemIcon, itemTitle
и itemSwitcher. Они принимают объект или `({props}) => slots`; props сохраняют
тип данных и входные Native props. Подставляются defaults Ant wrapper для
showIcon/blockNode/checkable/selectable/disabled, остальные внутренние defaults
дерева не подменяют отсутствующие входные значения. Общий `ConfigProvider.tree`
принимает class/style и те же semantic slots. Отсутствующий record наследуется,
любой собственный объект, включая `{}`, заменяет родительский целиком.

```svelte
<ConfigProvider tree={{ styles: { itemTitle: 'font-weight:600' } }}>
  <Tree treeData={nodes} classNames={{ item: 'document-row' }}
    styles={({ props }) => ({ itemSwitcher: props.disabled ? 'opacity:0.5' : undefined })} />
</ConfigProvider>
```

Классы provider и local накапливаются. Внешний root использует слои
provider styles.root → provider style → local styles.root → local style после
theme variables. Прежний `Tree.style` остаётся на внешнем корне; `tree.style`
следует той же Native границе. В React обычные style/context style относятся к
inner list. Raw наблюдения и публичные Source counterparts через styles.root
сохранены отдельно; это отличие не выдаётся за одинаковую структуру.
На строке `styles.item` перекрывает node.style, как Source. Switcher slots
действуют также на листья; itemIcon существует у pending загрузки при showIcon=false.
TreeSelect сохраняет собственную конфигурацию внутреннего дерева и не читает tree record.

Смена slots сохраняет DOM/ref, выбор и active IDs, фокус и pending load.
Native обновляет также default icon: rc-tree 1.4.0 ошибочно кэширует прежние
itemIcon classes/styles при их изменении без смены prefix/expanded/loading.
Исходный stale-cache сохранён отдельно; корректный Source counterpart использует
публичный custom icon. Ошибка не переносится. Snippets остаются непрозрачным
Svelte-содержимым; CSS относится к существующим wrappers.
[18 Source случаев и три raw наблюдения](../../../tests/browser/fixtures/ant-design-tree-semantic-reference.json),
[browser](../../../tests/browser/tree-semantic.spec.ts) и
[SSR](../../../tests/package/tree-semantic.ssr.test.ts) проверяют slots, callbacks/defaults,
nested/reset/replaced/sibling scopes, DirectoryTree, prefix/RTL, style priorities
и обновления, включая pending loading и независимый TreeSelect.

Deprecated `TreeNode` children не входят в перенос: rc-tree 1.4.0 прямо помечает
`Tree.children` как deprecated и предлагает `treeData`.

## Collapse motion

`motion` принимает Native CSSMotion config или `false`. Undefined/null выбирают
исходный Ant collapse object: `${rootPrefixCls}-motion-collapse`, измеряемые
height/opacity и deadline 500 ms. Пустой объект отключает CSS phases, сохраняя
самостоятельный custom config. Semantic callbacks получают этот итоговый object;
пользовательский config сохраняет identity.

Начальные defaultExpandedKeys/expandedKeys и SSR не анимируются. При изменении
одного expanded key его видимые потомки временно переходят в motion group:
раскрытие использует `appear`, сворачивание — `leave`. Tree перезаписывает
motionAppear по направлению перехода; custom `motionAppear: false` не отключает
раскрытие. При нескольких изменённых keys список обновляется сразу.

`motionName` поддерживает строку и object с именами фаз. Prepare hooks могут
возвращать Promise; start/active hooks получают DOM группы и event=null и
возвращают CSS-строку. End hooks получают нативный transition/animation event
или `{deadline:true}`; false оставляет группу активной. Default collapse игнорирует
opacity end и завершается по height либо deadline. События потомков не завершают
группу. Ant Tree удерживает собственный onVisibleChanged; этот унаследованный
callback, React children/internalRef не добавлены в Svelte API.

`theme.token.motion=false` отключает CSS phases, но сохраняет prepare. Native
также учитывает prefers-reduced-motion и его изменение во время перехода.
Другие expand действия ждут окончания motion; selection/check остаются доступны.
Смена данных, motion=false, завершение drag и unmount очищают удержанную группу
и отменяют старые RAF, prepare completions, deadlines и DOM listeners.

При virtual list группа содержит первые ceil(height/itemHeight)+1 потомков;
сам virtual placeholder сохраняет исходную оценку itemHeight. Virtual=false или
отсутствие height сохраняют весь диапазон. Соседние keyed строки, tree-root,
refs и opaque controls вне диапазона сохраняют DOM. Узлы самого диапазона
монтируются в группе и затем возвращаются в плоский список, как Source.
TreeSelect сохраняет прежнее самостоятельное управление раскрытием.

[23 Source сценария и raw наблюдение](../../../tests/browser/fixtures/ant-design-tree-motion-reference.json),
[12 SSR вариантов](../../../tests/browser/fixtures/ant-design-tree-motion-ssr-reference.json),
[engine](../../../src/lib/tree-motion.engine.test.ts),
[lifecycle](../../../src/lib/tree-motion.dom.test.ts),
[browser](../../../tests/browser/tree-motion.spec.ts),
[Native browser](../../../tests/browser/tree-motion-native.spec.ts) и
[SSR](../../../tests/package/tree-motion.ssr.test.ts) проверяют фазы, callbacks,
измерения, virtual, generic aliases/zero/bigint, prefix/RTL, темы и cleanup.
Ошибка rc-tree1.4.0 со скрытым expanded key сохранена в raw reference: пустой
motion range блокирует видимые ветки до deadline. Native пропускает пустые
и невидимые диапазоны, сохраняя доступное раскрытие.

## Drag/drop

`draggable` включает HTML5 drag/drop в Tree и DirectoryTree. Принимаются boolean,
predicate исходного data-узла или `{ nodeDraggable, icon }`. Predicate=false
отключает и начало drag, и drop handlers строки, как в Source. По умолчанию
показывается Holder icon; `icon: false` убирает handle, snippet заменяет его
содержимое, включая пустой результат. Интерактивное содержимое handle сохраняет
свои DOM controls и фокус. Клик обычного handle возвращает фокус tree-root;
draggable строки имеют tabindex=-1 и не добавляют tree tab stops.

`allowDrop({ dragNode, dropNode, dropPosition })` получает исходные data-объекты
и относительную позицию -1/0/1. Позиция зависит от вертикальной половины
event.target, горизонтального смещения, раскрытых веток и indent; поддержаны
переходы между уровнями, RTL и виртуальные окна. Disabled запрещает начать drag,
но сам по себе не исключает drop target: при необходимости проверяйте
`dropNode.disabled` в allowDrop. Индикатор фиксирован Ant wrapper, который также
перезаписывает унаследованный rc `dropIndicatorRender`.

`onDragStart`, `onDragEnter`, `onDragOver`, `onDragLeave` и `onDragEnd` получают
`{event,node}` с нативным DragEvent и canonical key/state. OnDragEnter добавляет
expandedKeys до отложенного раскрытия. Через 800 ms приходит onExpand с
expanded=true; key добавляется при наличии детей. Для листа набор может остаться
прежним; hover сам по себе не загружает lazy children. Uncontrolled Tree сворачивает
source при dragstart без onExpand; DirectoryTree сохраняет своё управление
expandedKeys и не сворачивает source этим действием.

`onDrop` добавляет dragNode, dragNodesKeys, dropToGap и dropPosition. Последний
равен sibling index dropNode плюс -1/0/1. DropNode может быть предком строки,
над которой находится индикатор; dragOver flags относятся к строке индикатора.
DragNode сохраняет state начала drag и исходную data-ссылку: изменения свойств
этого объекта видны onDrop, а замена узла новым объектом не меняет сохранённую
ссылку. DragNodesKeys содержит source и всех его потомков на начало drag,
включая свёрнутые ветки. Перестановка treeData остаётся у потребителя;
проверки не меняют выбор, checkbox, native refs и существующую клавиатуру.

[38 независимых Source сценариев и шесть raw наблюдений](../../../tests/browser/fixtures/ant-design-tree-drag-reference.json),
[12 Source SSR вариантов без DOM](../../../tests/browser/fixtures/ant-design-tree-drag-ssr-reference.json),
[engine](../../../src/lib/tree-drag.engine.test.ts),
[SSR](../../../tests/package/tree-drag.ssr.test.ts) и
[browser](../../../tests/browser/tree-drag.spec.ts) фиксируют геометрию, snapshots,
defaults, controlled keys, generic data/fieldNames, icons, prefix/RTL и lifecycle.
[Native проверки](../../../tests/browser/tree-drag-native.spec.ts) включают реальные
mouse drags, виртуальную прокрутку, смену данных и сохранение фокуса/DOM.
Ошибки rc-tree1.4.0 не воспроизводятся:

- allowDrop проверяется перед drop; запрет в dragover очищает прежний target.
- Проверяется текущее дерево потомков, включая добавленных после dragstart.
- Оконный dragend сохраняет source node, даже когда его DOM вышел из окна.
- Unmount отменяет таймер раскрытия и listeners; поздних callbacks нет.
- Drop container сохраняет key=0, а handle обновляет namespace при смене prefix.

## Data utilities

`createTree` соответствует React `Tree.useTree`. Модель предоставляет стабильный
`getPath(key)`: массив entities от корня до найденного узла включительно.
Entity содержит `key`, `pos`, `level`, `index`, исходный `node`, путь исходных
объектов `nodes`, `parent` и `children` при наличии потомков. Lookup по string,
number и bigint использует исходное строковое сопоставление ключей.

```svelte
<script lang="ts">
  import { createTree, type TreeFieldNames } from '@woodger/antd';

  interface Item {
    id: string;
    caption: string;
    items?: Item[];
  }
  let items = $state.raw<Item[]>([{ id: 'root', caption: 'Корень', items: [
    { id: 'leaf', caption: 'Лист' }
  ] }]);
  let fields = $state<TreeFieldNames>({ key: 'id', title: 'caption', children: 'items' });
  const model = createTree(() => items, { get fieldNames() { return fields; } });
  let path = $derived(model.getPath('leaf').map(entity => entity.key));
</script>

<output>{path.join(' / ')}</output>
```

Getter data и getter `config.fieldNames` читаются при каждом lookup; новая ссылка
на data или schema перестраивает индекс. Для изменений используйте новый массив
и новый объект fieldNames. Сохранённая функция `getPath` читает актуальные inputs,
включая вызов через `$derived`. Статический массив также принимается.
Модель работает без DOM, effects и timers, в том числе при SSR. Generic payload
и identity исходных объектов сохраняются; title не переименовывается в raw node.
UI-компоненты Tree/DirectoryTree принимают ту же схему полей через prop fieldNames;
модель передаёт её отдельно через config.

[Исходный UMD-эталон](../../../tests/browser/fixtures/ant-design-tree-data-model-reference.json)
фиксирует entities, aliases, positional fallback и обновления data/schema.
Неизвестный ключ возвращает `[]`. Это исправляет явную ошибку rc-tree 1.4.0:
lookup отсутствующих constructor/__proto__/toString читает plain object prototype
и возвращает function/Object.prototype вместо DataEntity. Исходное наблюдение
сохранено; реальные data keys с такими именами поддерживаются.
[Unit](../../../src/lib/tree-data-model.test.ts),
[browser](../../../tests/browser/tree-data-model.spec.ts) и
[package/SSR](../../../tests/package/tree-data-model.ssr.test.ts) проверяют модель.

## DirectoryTree

Отдельный экспорт `DirectoryTree` соответствует React `Tree.DirectoryTree` и
использует существующий Tree. По умолчанию `expandAction='click'`, `showIcon=true`
и `blockNode=true`; эти props можно переопределить. Лист получает file icon,
ветка — закрытую или открытую папку. Snippet `icon` заменяет стандартную иконку.

```svelte
<script lang="ts">
  import { DirectoryTree } from '@woodger/antd';

  const nodes = [{ key: 'docs', title: 'Документы', children: [
    { key: 'intro', title: 'Введение', isLeaf: true },
    { key: 'api', title: 'API', isLeaf: true }
  ] }];
</script>

<DirectoryTree treeData={nodes} multiple defaultExpandAll aria-label="Файлы" />
```

Обычный клик выбирает только строку и не снимает её выбор повторным кликом.
При `multiple` Ctrl/Meta переключает отдельный ключ, Shift добавляет диапазон
между текущей строкой и последним обычным/Ctrl/Meta выбором. Диапазон идёт по
видимому дереву, не включает скрытых потомков и пропускает промежуточные
disabled/nonselectable узлы. Первый Shift без такого выбора не создаёт диапазон.
`onSelect` сообщает `selected=true`, включая снятие ключа через Ctrl/Meta;
`selectedNodes` содержит исходные узлы в порядке полного дерева.

Controlled/default keys и `defaultExpandParent` сохраняют Tree-контракты.
В отличие от обычного Tree, DirectoryTree при `defaultExpandAll` включает
в начальный набор также ключи листьев, как upstream. Lazy load, checkbox,
клавиатура, темы Tree, RTL, prefix, focus/blur/scrollTo и `bind:nativeElement` используют
существующий компонент. Расширенные неперенесённые Tree API перечислены выше.

[Пятнадцать исходных сценариев](../../../tests/browser/fixtures/ant-design-directory-tree-reference.json)
сверяют выбор/диапазоны, callbacks, раскрытие, иконки и directory tokens.
[Browser](../../../tests/browser/directory-tree.spec.ts) и
[SSR](../../../tests/package/directory-tree.ssr.test.ts) проверяют Svelte-реализацию.
При снятии controlled-режима сохраняются последние принятые ключи. Это намеренное
исправление: Ant Design 6.6.8 / rc-tree 1.4.0 после такого перехода теряет
безопасные массивы, и следующий Shift-клик падает на `undefined.includes`.
[Оба исходных наблюдения](../../../tests/browser/fixtures/ant-design-directory-tree-control-release-observation.json)
сохранены отдельно; ошибка не переносится в Svelte.

