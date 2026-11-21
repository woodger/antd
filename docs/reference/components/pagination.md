# Pagination

```svelte
<script lang="ts">
  import { Pagination } from 'antd-svelte';

  let current = $state(1);
  let pageSize = $state(10);
</script>

<Pagination total={137} bind:current bind:pageSize>
  {#snippet showTotal(total, range)}{range[0]}–{range[1]} из {total}{/snippet}
</Pagination>
```

`total` по умолчанию равен 0. `current` и `pageSize` поддерживают привязку;
для отдельных controls доступны `defaultCurrent=1` и `defaultPageSize=10`.
Начальные значения читаются один раз. При привязке задавайте их у владельца.

Переход вызывает `onChange(page, pageSize)`. Повторное нажатие текущей страницы
не вызывает событие. Смена размера сначала вызывает
`onShowSizeChange(previousCurrent, pageSize)`, затем
`onChange(clampedCurrent, pageSize)`, сохраняя номер страницы в допустимых пределах.
Callback получает номера с учётом отображаемого диапазона.

Отображаемая страница ограничена диапазоном `1…ceil(total / pageSize)`.
Изменение props, включая уменьшение `total`, само не записывает исправленное
значение владельцу и не вызывает callbacks. Для пустой коллекции отображается
страница 1 и диапазон `[0, 0]`; `hideOnSinglePage` скрывает навигацию.
У пустой коллекции числовая кнопка отключена и не помечена active, как в upstream.
Дробные значения округляются вниз, total ограничен снизу нулём, current и
pageSize — единицей, все значения — сверху `Number.MAX_SAFE_INTEGER`.
Для NaN и бесконечных значений используются defaults 0, 1 и 10.
Список номеров и переходов содержит не более девяти элементов независимо от total.
Расчёт окон и jump boundaries перенесён из @rc-component/pagination 1.4.0:
при двух jump-кнопках между ними остаются три числовые кнопки, включая текущую.
`showLessItems` уменьшает buffer и шаг jump с 5 до 3; `showPrevNextJumpers` скрывает jumps.

Выбор размера автоматически показывается при `total > 50`; это меняется через
`showSizeChanger`. `pageSizeOptions` по умолчанию равен `[10, 20, 50, 100]`.
Допустимы положительные целые безопасные числа; дубликаты удаляются, варианты
сортируются, текущий размер добавляется в список. `showTotal` получает
нормализованный total и диапазон записей с нумерацией от 1.
На узком экране элементы переносятся на следующую строку, а выбор размера
остаётся доступным.

`simple=true` показывает редактируемый current/total. Enter и blur подтверждают ввод,
ArrowUp уменьшает страницу, ArrowDown увеличивает. Объект `{ readOnly: true }`
сохраняет counter без input. Для пустой коллекции simple counter равен 1/0,
как в закреплённой версии. Незавершённый ввод сохраняется при внешнем изменении
total/pageSize, пока отображаемая current не изменилась. Выбор размера сбрасывает
draft к отображаемой странице. `showQuickJumper=true` добавляет ввод цифр: Enter и blur
за пределами paging controls переходят на указанную страницу. Объект
`{ goButton: true }` добавляет подтверждение и отключает переход по blur.
Вместо true у goButton допустим текст/snippet. Quick jumper доступен и в simple mode.
Его кнопка сначала подтверждает simple input, затем значение quick jumper; blur
simple input сохраняет исходное поведение подтверждения. Для одной страницы
quick jumper и его кнопка скрыты. Вложенный в quick jumper React li заменён на span
с тем же классом, чтобы сохранить валидную HTML-структуру; подтверждение — native button.

`align` принимает start/center/end. `showTitle=false` убирает tooltip titles,
сохраняя доступные имена. `responsive` на XS добавляет class mini при
отсутствии явного size. В CSS Ant Design 6.6.8 этот класс сам не меняет высоту:
её меняет size=small. Это поведение проверено на исходной React-сборке и сохранено.
`size` и ConfigProvider.componentSize по-прежнему задают реальные размеры.

Responsive Pagination читает глобальный `theme.token.screenXSMax`; явный size
сохраняет приоритет. Пороги валидируются и при SSR, включая responsive=false,
как в useBreakpoint исходника. Смена токенов заменяет queries, сохраняя текущую
страницу и quick-jump draft/selection/focus. Наблюдение stale Source subscriptions
и fresh public counterpart записаны отдельно. [Browser-проверки](../../../tests/browser/responsive-controls.spec.ts)
охватывают также Masonry columns/gutter; [SSR](../../../tests/package/responsive-controls.ssr.test.ts)
сохраняет исходные defaults и проверяет порядок порогов.

`itemRender` — snippet с `(page, type, originalElement, info)`. OriginalElement
рисует готовый native button; info содержит disabled/active/label/title/onClick
для собственного native control. Это замена ReactNode и cloneElement/LI click.
`prevIcon/nextIcon/jumpPrevIcon/jumpNextIcon` принимают текст или декоративный snippet.
Стандартные jump/ellipsis icons перенесены из @ant-design/icons-svg 4.6.0
под существующей [MIT-лицензией](../../../src/lib/vendor/LICENSE.ant-design-icons).

`showSizeChanger` допускает boolean или поддержанные Select props. Собственный
onChange вызывается после onShowSizeChange и основного onChange Pagination.
Размер Pagination имеет приоритет над size из Select props.
`components.sizeChanger` получает snippet с value/disabled/class/options/onChange.
Не все расширенные React Select props уже существуют у Svelte Select.

ConfigProvider.pagination задаёт class/style, semantic classNames/styles,
showSizeChanger и totalBoundaryShowSizeChanger. Локальные настройки имеют приоритет.
Semantic callbacks получают исходные props и явный resolved size; внутренние
default values не подставляются вместо отсутствующих исходных props.
Semantic root соответствует native nav; прежний class остаётся на ul.
Root style перекрывает styles.root; classNames.item/styles.item относятся к страницам,
prev/next и simple counter, исключая jump controls, как в upstream.
`locale` принимает исходные snake_case aliases; locale.page задаёт suffix quick jumper.
Существующий config.locale.pagination.page остаётся доступным именем страницы.

Сохранены отличия прежнего Svelte API: bind:current/pageSize, нормализация чисел,
сортировка/удаление повторов размеров и доступный size changer на XS. Новые строковые
pageSizeOptions сначала преобразуются в числа. В React options могут сохранять
исходный порядок, а вся options area скрывается на XS. Quick jumper следует
исходному CSS и скрывается на XS. Для controlled compositing с отказом владельца
используйте functional bindings с getter и обработчики onChange.

PrefixCls задаёт локальный namespace Pagination; пустая строка наследует
ConfigProvider.prefixCls. 111 исходных правил styles/media изолированы по local/global
prefix, без четырёх общих Input Group rules. Частные item-size-actual и
item-spacing-actual следуют общему namespace с исходным удалением точек;
публичные token variables сохраняются. Смена префикса сохраняет current/pageSize,
DOM активного пункта и jumper, его draft/focus/selection и callbacks.
Пункты сохраняют `border-box` и размер темы, включая 28px для medium в native compact.
Source button Arial и [public itemRender counterparts с fontFamily:inherit](../../../tests/browser/fixtures/ant-design-pagination-prefix-reference.json)
разделены: прежняя Native typography, active colors и wireframe сохранены.

Генерация CSS selectPrefixCls и React-specific components/dev warnings остаются
в следующих этапах. `selectPrefixCls` доступен custom size changer info;
штатный Select сохраняет свои классы. Обычный disabled, навигация native кнопками,
возврат focus после отключения next и SSR без DOM/media/timers сохранены.

Source `theme.components.Pagination` использует 12 собственных defaults и общий
расчёт 18 Input defaults для quick jumper. Поддержаны component algorithms,
aliases, нули/undefined, runtime CSS lengths и CSS prefix/hash. Токены находятся
на native nav, styled ul наследует их, поэтому styles.root/style сохраняют
приоритет. Внутренний Select получает собственный scope; Input overrides
не подменяют quick jumper. MiniOptionsSizeChangerTop сериализуется, но исходный
CSS 6.6.8 его не использует.

Глобальный token.wireframe включает bordered, независимо от одноимённого
component override. Дополнительные правила перенесены из исходного
pagination/style/bordered.ts: в закреплённом dist/antd.css их нет. Цвета и padding
номеров применяются к сохранённым native buttons. Кнопки prev/next сохраняют
source line-height: normal, в том числе при неопределённой высоте item.
Метрики трёх размеров, disabled/simple и variants, hover/focus и обновления темы
проверяются с официальным UMD в `?fixture=pagination-theme`. Native-only темы,
bind API и согласованное поведение на XS сохраняются.

В теме без `cssVar` активный номер также получает primary-цвет, hover —
primary-hover, disabled — disabled-цвет. Переменные цветов состояний на
`styles.item` и inline-цвет custom `itemRender` сохраняют приоритет. Эти состояния
проверяет [регрессионный тест](../../../tests/browser/pagination-color.spec.ts)
в светлой и тёмной теме, LTR и RTL; существующая native-палитра `primary` сохраняется.
