# Cascader / CascaderPanel

Cascader позволяет выбрать путь в иерархическом списке; CascaderPanel показывает
те же варианты без всплывающей панели. Публичные типы и значения по умолчанию —
в [cascader.types.ts](../../../src/lib/cascader/cascader.types.ts).
Вложенная панель наследует [слой владельца](../theme-context.md#уровни-вложенных-панелей).

```svelte
<script lang="ts">
  import { Cascader, CascaderPanel, type CascaderPath } from '@woodger/antd';

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
[browser](../../../tests/browser/cascader/cascader-prefix.spec.ts),
[SSR](../../../tests/package/cascader/cascader-prefix.ssr.test.ts).

В Ant Design 6.6.8 локальный prefix меняет Select popup class, а сброс Cascader
padding продолжает искать общий Select class. В raw local случае остаётся 4px
вместо 0px; Native сохраняет прежний padding:0. Отдельный public counterpart с
`styles.popup.root.padding:0` сверяет popup и зависящую от padding ширину колонок;
control остаётся raw. У Panel прежний Native root dir=rtl также сохранён: Source
задаёт RTL колонкам, оставляя корень LTR. Raw root direction и отдельный public
counterpart с обычной HTML-обёрткой `dir="rtl"` записаны раздельно. Сам Source Panel
не передаёт dir на свой корень. Эти границы не означают одинаковый DOM.
