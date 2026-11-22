# AutoComplete

AutoComplete позволяет вводить произвольный текст и выбирать подсказки из списка.

```svelte
<script lang="ts">
  import { AutoComplete } from '@woodger/antd-svelte';
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
описаны в [разделе Select](select.md#popup-и-семантическое-оформление). У AutoComplete нет
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
onActive работают так же, как [в Select](select.md#select). DefaultActiveFirstOption у
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
[общий слой данных](select.md#данные-options-и-fieldnames). Значение свободного ввода остаётся string;
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
allowClear описаны в [общем разделе иконок](select.md#иконки-и-очистка-select).
`components.root/input` используют [общий API замены поля](select.md#замена-root-и-input-select).
`children(control)` сохраняет приоритет над `components.input`; `components.root`
полностью заменяет поле и не вызывает оба editor renderers. Исходный motion пока отсутствует.
Generic numeric/object values не поддерживаются.

