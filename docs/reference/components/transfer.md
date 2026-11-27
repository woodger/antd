# Transfer

Transfer показывает два списка для переноса элементов. `targetKeys` всегда
задаёт владелец; `onChange(nextKeys, direction, moveKeys)` предлагает перенос.
Измените targetKeys в callback, чтобы его принять. Локального defaultTargetKeys нет.

```svelte
<script lang="ts">
  import { Transfer, type TransferKey } from '@woodger/antd';

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
<script lang="ts">
  import { Transfer, type TransferKey } from '@woodger/antd';

  const dataSource = [
    { key: 'a', title: 'Анна' },
    { key: 'b', title: 'Борис' }
  ];
  let targetKeys = $state<TransferKey[]>([]);
</script>

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
[SSR](../../../tests/package/transfer/transfer-prefix.ssr.test.ts) проверяют эти границы.
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
[unit-набором](../../../src/lib/theme/theme-transfer-tokens-reference.test.ts),
[SSR](../../../tests/package/transfer/transfer-theme.ssr.test.ts) не создаёт браузерные ресурсы.
