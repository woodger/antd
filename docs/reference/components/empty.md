# Empty

```svelte
<script lang="ts">
  import { Button, Empty } from '@woodger/antd-svelte';

  let hasRecords = $state(false);
</script>

<Button onclick={() => { hasRecords = false; }}>Очистить список</Button>
{#if hasRecords}
  <p>Первый участник создан.</p>
{:else}
  <Empty image="simple" description="Участников пока нет.">
    <Button type="primary" onclick={() => { hasRecords = true; }}>Создать участника</Button>
  </Empty>
{/if}
```

Empty показывает отсутствие данных и предлагает действие через Snippet children.
Данными, фильтром и результатом действия управляет владелец; компонент не
выполняет запросов и не создаёт таймеров.

Image принимает default (по умолчанию), simple, URL, собственный Snippet или scalar.
Empty.PRESENTED_IMAGE_DEFAULT/SIMPLE дают прежние aliases default/simple;
остальные строки трактуются как URL и выводятся через img с draggable=false.
Alt берётся из строкового description, иначе используется empty.
False удаляет изображение вместе с контейнером. Встроенные иллюстрации — SVG
Ant Design 6.6.8. В нативном режиме их цвета используют текущие CSS-токены; SVG-паттерны совмещают
полупрозрачный fill с colorBgContainer, сохраняя непрозрачную заливку при
перекрытии частей. Идентификаторы уникальны для каждого экземпляра и стабильны
между SSR и гидратацией. При явной source theme используется исходный getAsSolidColor
и цвета глобальной темы, независимо от component aliases Empty. CSS-переменные
сохраняются без предварительного смешивания; декоративный SVG получает исходный title.
Контейнер изображения декоративный: aria-hidden и inert исключают
его содержимое из accessibility tree, Tab и взаимодействий.

Description принимает scalar или Snippet. Undefined использует
Locale.empty.description: ruRU — «Нет данных», enUS — «No data»; отсутствующие
поля используют ruRU. False, null и пустая строка убирают описание без fallback.
Ноль выводится текстом; true сохраняет пустой description div, как в закреплённом upstream.
Строки экранируются. Generic locale.emptyText для Select и других компонентов
сохраняет прежний смысл и значения.

Children принимает scalar или Snippet и выводится в footer с обычными controls и Tab-навигацией.
Ноль сохраняется; false/null/пустая строка убирают footer, true оставляет пустой div. Изменение
image/description не пересоздаёт сохранённые действия. Без явного aria-label
или aria-labelledby корень остаётся обычным div; с ними — именованная group.
Id/class/style и aria-describedby относятся к корню. Empty не создаёт live-region,
не добавляет остановку Tab и не переносит фокус при показе. Объявление результата
операции и выбор конкретного control после неё остаются у владельца.

При удалении сфокусированного действия внутри сохранённого Empty фокус
переходит к доступному control внутри него, затем к соседу снаружи. При удалении
всего Empty используются сохранённые соседи текущего dialog/документа: сначала
следующий, затем предыдущий, затем сам dialog. Проверка после tick сохраняет
фокус, уже выбранный владельцем. Выбор снаружи также сохраняется. Ресурсы
focusin/MutationObserver освобождаются при unmount; SSR не обращается к DOM.
Escape остаётся у содержащего Modal/Drawer.

Компонент наследует темы, compact и RTL из ConfigProvider. Высота изображения
default — 2.5 controlHeightLG, simple — controlHeightLG; compact уменьшает их
с 100/40 до 90/36px. Изображения ограничены контейнером, длинное описание
переносится, действия footer переходят на следующую строку. Встроенной анимации
нет; reduced motion не требует таймеров или переходов. ConfigProvider.disabled
не скрывает описание и иллюстрацию; disabled controls задаёт их владелец.

Table использует simple Empty в прежней единственной ячейке пустой строки.
Colspan и нативная семантика таблицы сохранены. Description получает
Locale.table.emptyText, включая существующие переопределения. Snippet empty
имеет приоритет; во время loading оба варианта пустого состояния не выводятся.

Галерея `/ant-design#empty` настраивает изображение, описание и действия.
Пример списка создаёт первую запись, показывает пустой результат поиска,
восстанавливает записи при сбросе фильтра и очищает список. Владелец выбирает
стабильный region таблицы после создания/сброса поиска и поле имени после очистки.

ConfigProvider.empty задаёт image, class/style и object/function classNames/styles;
вложенный record заменяется целиком, undefined наследует родительский.
Локальный image имеет приоритет, null/undefined используют context image и затем default.
Semantic slots root/image/description/footer получают исходные props без defaults.
Root styles: context styles.root → context style → local styles.root → local style.
Styles.image задаёт оформление изображения. PrefixCls меняет
BEM-классы; иначе он наследует ConfigProvider (по умолчанию ant-empty).
RootClassName относится к корню.
Bind:nativeElement и поле nativeElement объекта bind:ref указывают на корневой div после mount;
при unmount bindings очищаются до undefined, при SSR не присваиваются.

Empty не имеет собственных component tokens; theme.components.Empty поддерживает
общие aliases/algorithm, variable prefix/key/hash, dark и compact. Все 15 исходных
CSS rules включают small; для совместимого размера можно добавить class="ant-empty-small".
[55 UMD-сценариев](../../../tests/browser/fixtures/ant-design-empty-reference.json) сверяют классы,
slot styles, изображения и их исходные цвета при явной source theme.
Native image=false, inert/ARIA, responsive guards, footer wrapping, paint patterns
прежнего режима и восстановление фокуса сохранены.
Общий ConfigProvider prefix поддержан; React diagnostics остаются в работе.
[RenderEmpty](../render-empty.md) подключён к Select/TreeSelect,
Cascader/Panel, Mentions, Transfer, Table/фильтру; AutoComplete сохраняет
исходное исключение combobox. Без callback действуют прежние native defaults.
Собственный image Snippet отвечает за свои ресурсы и анимацию.

