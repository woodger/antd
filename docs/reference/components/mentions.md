# Mentions

Mentions предлагает варианты упоминаний при вводе текста.
Вложенный список наследует [слой владельца](../theme-context.md#уровни-вложенных-панелей).

```svelte
<script lang="ts">
  import { Mentions, getMentions } from '@woodger/antd';
  let value = $state('');
</script>
<Mentions {value} options={[{ value: 'alice', label: 'Alice' }]}
  onChange={next => { value = next; }} allowClear
  autoSize={{ minRows: 2, maxRows: 5 }} aria-label="Комментарий" />
<p>{getMentions(value).map(item => item.value).join(', ')}</p>
```

Value/defaultValue — полная строка textarea. Prefix по умолчанию '@', принимает
строку/массив; split по умолчанию один пробел. При поиске выбирается последнее
вхождение префикса перед selectionStart; при равных позициях сохраняется порядок
массива prefix. Default validateSearch проверяет только literal split, без
дополнительной обработки переносов строк. FilterOption ищет по option.value без
учёта регистра; false отключает фильтрацию, predicate получает исходный option.
Options содержит value, label string/number/Snippet, key/disabled/class/style.

CSS prefixCls не меняет текстовые triggers prefix. Непустое локальное значение
имеет приоритет; empty/undefined наследуют ConfigProvider. Editor, mirror,
variants/status, clear и popup/menu используют resolved prefix. Private
cmp-mentions variables и Form feedback selector используют общий namespace;
canonical component tokens/markers остаются прежними. Смена local/shared prefix
сохраняет IDs, root/textarea/popup DOM, query, focus/selection и FormData.
Native clear/ARIA/IME и правила поиска/выбора не меняются.
Сверка: [UMD](../../../tests/browser/fixtures/ant-design-mentions-prefix-reference.json),
[browser](../../../tests/browser/mentions-prefix.spec.ts),
[SSR](../../../tests/package/mentions-prefix.ssr.test.ts), `?fixture=mentions-prefix`.
Прежний простой locale.emptyText без renderEmpty сохраняется: raw Source Small
Empty записан отдельно от nativeEmpty — измерения public notFoundContent с тем
же локализованным текстом. Source результаты не заменяются этим counterpart.

Поиск запускается по keyup, как rc-mentions. Программная смена value сама его не
запускает. OnSearch(text,prefix) позволяет владельцу обновить options/loading;
сетевых запросов внутри нет. Loading показывает disabled spinner вместо выдачи
и по умолчанию блокирует Enter. `silent` управляет блокировкой Enter при открытом
списке. При `silent={false}` Enter закрывает список из недоступных вариантов.
NotFoundContent заменяет локализованное пустое состояние.

Выбор вставляет prefix+value+split у каретки, добавляет split перед токеном при
необходимости, убирает совпадающий хвост без учёта регистра и сохраняет остальной
текст. OnChange(nextText) вызывается до onSelect(option,prefix), затем после DOM
update восстанавливаются focus/selection. Native selection offsets — UTF-16.
Callback получает исходный option data без React key suffix. Отдельный экспорт
getMentions(value,{prefix,split}) соответствует Mentions.getMentions: извлекает
непустые токены в начале разделённых split частей, без собственной разметки.

Up/Down обходят доступные options, Enter выбирает, Escape закрывает. IME Enter
не выбирает. OnPressEnter работает при закрытых подсказках; onKeyDown/onKeyUp и
нативные onkeydown/onkeyup доступны. OnFocus/onBlur учитывают переход в popup;
отложенный blur очищается при unmount. Readonly/disabled сохраняют native поведение.

Popup выравнивается после префикса и следует переносам/прокрутке textarea.
Placement top/bottom, RTL и viewport adjustment поддержаны; source gap=4 px.
`direction` задаёт край привязки списка к префиксу и имеет приоритет над
направлением провайдера при размещении. Нативный `dir` задаёт направление текста.
Native popover сохраняет фокус textarea; textarea/listbox/option и
aria-activedescendant заменяют React DropdownMenu на rc-menu. Mirror скрыт от
accessibility tree. Общий popup-механизм сохраняет прежний default gap для остальных
компонентов; AutoComplete использует исходные 4 px, как SelectTrigger.

`transitionName` подключает пользовательский CSS к фазам `appear-prepare`,
`appear-start` и `appear-active` при каждом новом открытии. Без имени или с
пустой строкой действует обычное открытие. `theme.token.motion=false` оставляет
только подготовку позиции. Именованное появление заканчивается по событию
анимации или перехода CSS. Правила `prefers-reduced-motion` для этого CSS
задаёт потребитель. Закрытие сразу удаляет именованную панель и отменяет
ожидающие кадры. После завершения появления новое имя применяется при
следующем открытии. [Браузерная сверка](../../../tests/browser/mentions-lifecycle.spec.ts).

Локальный getPopupContainer выбирает HTMLElement или ShadowRoot. Как Ant Design,
Mentions не наследует ConfigProvider.getPopupContainer. Тип getter не требует
аргументов. Функция без параметров при открытии сначала получает undefined,
затем span префикса внутри ant-mentions-measure. Функция с параметром ждёт этот
DOM ref, как rc-trigger. Без getter сохраняется native размещение; на сервере
getter не вызывается. Стили ShadowRoot размещает потребитель.

PopupRender — Snippet со стандартным menu Snippet. Можно добавить обёртку или
заменить меню; клавиатура textarea продолжает выбирать из options. Пользовательское
содержимое сохраняет тему и локализацию, но не наследует status/feedback FormItem
и SpaceCompact, как исходный ContextIsolator. Фокус в стандартном меню удерживает
подсказки открытыми; переход в поле вне menu закрывает их по исходному blur.
Закрытие и смена DOM-контейнера создают popupRender заново; смена getter с тем же
контейнером сохраняет DOM/state, текст, фокус и выделение textarea.

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Mentions } from '@woodger/antd';
</script>
{#snippet popup(menu: Snippet)}
  <strong>Участники</strong>
  {@render menu()}
{/snippet}
<Mentions options={[{ value: 'alice', label: 'Alice' }]} popupRender={popup}
  getPopupContainer={() => document.body} aria-label="Комментарий" />
```

AutoSize принимает boolean/{minRows,maxRows}, измеряет содержимое с теми же
font/padding/box-sizing, что и textarea. Shadow node, ResizeObserver, frames и
listeners удаляются при unmount. OnResize получает {width,height}. Rows по умолчанию 1.

`count.max` задаёт мягкий предел, а `maxLength` ограничивает нативный ввод.
`maxLength` имеет приоритет над `maxlength`. При отсутствии `count.max`
счётчик использует нативный предел. `count.max: 0` отключает мягкий предел.
По умолчанию счётчик измеряет длину в UTF-16. `count.strategy` позволяет
заменить подсчёт, а `count.show` принимает флаг или функцию форматирования.
Функция получает `{ value, count, maxLength }` и может вернуть Svelte snippet
с теми же аргументами.

`count.exceedFormatter` преобразует пользовательский ввод при превышении
`count.max`. IME сохраняет промежуточный текст до `compositionend`. После
обрезки восстанавливаются позиции выделения в итоговом значении. Вставка
упоминания и очистка работают с полной строкой. `onCompositionStart` и
`onCompositionEnd` получают нативные события, как `oncompositionstart` и
`oncompositionend`. Без `count` завершение композиции сохраняет обычный
порядок `onChange` по событиям ввода.

При включённом `count.show` редактор и счётчик находятся внутри
`rc-textarea-affix-wrapper`. Включение или выключение счётчика заменяет
textarea, сохраняя её значение. При замене список подсказок закрывается
вместе с привязкой к прежней каретке. В Ant Design 6.6.8 этот список
остаётся открытым после замены textarea. Обёртка React с `allowClear` теряет
направление провайдера. Для сравнения ширины счётчика в RTL React-стенд
дополнительно задаёт `dir="rtl"` на внешнем контейнере.

Строгая гидратация счётчика сохраняет textarea, начальный текст и фокус.
Каретка, заданная в предзаполненном поле до гидратации, может сдвинуться.
Это воспроизводится и в сборке `5fc7e251` без счётчика.
[Замеры React](../../../tests/browser/fixtures/ant-design-mentions-count-reference.json)
· [Браузер и hydration](../../../tests/browser/mentions-count.spec.ts)
· [SSR и типы](../../../tests/package/mentions.ssr.test.ts).

AllowClear — boolean/{clearIcon,disabled}; очистка вызывает change(''), затем
onClear. Size/status/variant, native name/required/maxlength, FormItem/validation/
reset, Form/ConfigProvider disabled, locale/themes/compact density/RTL поддержаны.
Focus/blur и bind:nativeElement предоставляют текущий ref API. Текстовое поле
доступно через nativeElement.querySelector('textarea'); deprecated textarea ref удалён.
`autoFocus` использует нативный автофокус. Явный `autofocus` имеет приоритет.
CSS-рецепт mentions извлекает 102 правила. Фикстура `?fixture=mentions`; SSR не измеряет DOM и не ставит таймеры.
24 эталона официального UMD для контейнеров и popupRender —
[mentions-popup](../../../tests/browser/mentions-popup.spec.ts), `?fixture=mentions-popup`.

`ConfigProvider.theme.components.Mentions` применяет shared Input tokens,
размеры списка, aliases и algorithms к textarea и popup. Подготавливаются 22
исходных CSS defaults, включая внутренние lineWidthFocus/itemPaddingVertical;
публичный список токенов остаётся в исходных типах. Темы Input/Select не подменяют
тему Mentions. Local style имеет приоритет; обновления сохраняют открытый popup,
draft, focus/caret и активный option. Native button reset не перекрывает исходные
hover/active цвета пунктов.
При нулевом inputFontSize подсказки сохраняются у префикса нулевого размера,
как в исходном компоненте.
16 тем официального UMD — [mentions-theme](../../../tests/browser/mentions-theme.spec.ts),
`?fixture=mentions-theme`; [SSR](../../../tests/package/mentions-theme.ssr.test.ts) сохраняет
native текст формы без popup, измеряющего textarea и timers.

`classNames` и `styles` принимают карту слотов `root`, `textarea`, `popup` и
`suffix` или функцию от `{ props }` с разрешёнными `disabled` и `status`.
Классы провайдера и экземпляра складываются. Для корня сначала применяется
`ConfigProvider.mentions.styles.root`, затем `ConfigProvider.mentions.style`,
`styles.root` и `style` экземпляра. `rootClassName` оформляет корень и список.
Слот `popup` сохраняет свои стили в пользовательском контейнере, включая
`z-index:0`. Слот `textarea` обновляет измерение каретки и autoSize.

`ConfigProvider.mentions` задаёт `class`, `style`, `classNames`, `styles`,
`variant` и `allowClear`. Вложенный объект заменяет родительский целиком.
Локальное `allowClear={false}` выключает очистку, а локальная настройка иконки
имеет приоритет над иконкой провайдера.

В Ant Design 6.6.8 с RcMentions 1.12.0 обёртка с суффиксом теряет стиль корня,
а суффикс получает классы без переданного `styles.suffix`. Svelte применяет
декларации к обоим слотам. [Замеры и проверки](../../../tests/browser/mentions-semantics.spec.ts).
Расширенный API меню остаётся открытой частью переноса.

