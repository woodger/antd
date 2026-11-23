# Masonry

Masonry размещает элементы в колонках с учётом их высоты. Props, semantic
callbacks и тип данных описаны в [исходных объявлениях](../../../src/lib/masonry.types.ts).

```svelte
<script lang="ts">
  import { Masonry } from '@woodger/antd';

  const items = [100, 60, 120, 80].map((height, index) => ({ key: index, data: height }));
</script>

<Masonry {items} columns={{ xs: 1, sm: 2, md: 3 }} gutter={[12, 24]} fresh>
  {#snippet itemRender({ data, index, column })}
    <div style={`height:${data}px`}>
      Карточка {index + 1}, колонка {column + 1}
    </div>
  {/snippet}
</Masonry>
```

Корневой children принимается и игнорируется, как в React PropsWithChildren;
для ячеек используются items. Items появляются после mount; SSR выводит пустой div
с высотой 0, не вызывает renderer или onLayoutChange и не читает DOM. ItemRender — snippet
с данными item, исходным index и текущим column. Item.children принимает scalar
или snippet без аргументов и имеет приоритет над renderer, включая false, 0 и
пустую строку. Поле item.height, как в реализации эталона, не задаёт CSS-высоту:
размер определяет содержимое, а раскладка читает getBoundingClientRect().height.

Элементы обрабатываются в исходном порядке. Следующий попадает в самую короткую
колонку; при равенстве выбирается первая. Item.column закрепляет колонку и
ограничивается сверху columns - 1. Числовые columns не округляются: 0/NaN
выбирают default 3, отрицательные и дробные значения сохраняют RangeError
исходника. Для responsive map используется наибольший совпавший breakpoint;
если совпадений нет — xs, затем 1. Поддерживаются xs/sm/md/lg/xl/xxl/xxxl из Grid.

Masonry использует глобальные `theme.token.screen*` для columns и обеих осей
responsive gutter. Пороги проверяются и при SSR; после mount смена токенов
заменяет media queries без пересоздания items. Editor/ref/focus/selection сохраняются.
Raw stale observer Source отделён от public fresh-mount counterpart в
[замерах responsive controls](../../../tests/browser/fixtures/ant-design-responsive-controls-reference.json).

Одиночный числовой gutter действует по обеим осям, пара разделяет horizontal и
vertical. Каждая ось принимает responsive map. Нижнего gutter после последнего
элемента нет. Хотя общий тип Row.gutter допускает CSS-строку, Masonry эталона
не преобразует её: horizontal участвует в `${value}px`, vertical — в JS-сложении
с высотой. Используйте числа или responsive maps чисел для рабочей геометрии.

Root наблюдается всегда. Fresh дополнительно наблюдает ячейки; без fresh смена
их содержимого сама по себе не запускает замер. Новый массив items, columns,
resize root и захваченные load/error вызывают RAF-замер с объединением событий.
Resize dedup использует floored rect и offset sizes, но для раскладки сохраняется
дробная DOM-высота. При unmount observers/listeners/frames очищаются, поздние
observer microtasks не обновляют состояние.

OnLayoutChange сообщает элементы с исходными полями и вычисленным column.
Сравнение соответствует util isEqual: одинаковые данные и распределение не
вызывают повторный callback. Результат можно записывать обратно в item.column,
как в upstream demo. Функции/snippets сравниваются по ссылке. Ключи должны быть
уникальны после String(key): CSSMotionList использует строковые ключи, тогда
как geometry map сохраняет исходный number/string key.

CSS-рецепты masonry и masonry-prefix воспроизводят все 12 правил эталона,
без keyframes, с проверкой SHA-256. Второй сохраняет CSS как module template для
локального prefix. Appear/leave используют исходные CSS classes и два RAF до
active. Удаляемая ячейка остаётся до собственного transitionend/animationend;
события вложенного содержимого её не удаляют. Возврат того же key сохраняет DOM
и отменяет удаление. Если браузер не создал собственную анимацию, phase завершается
после обновления CSS. Это сохраняет удаление при нулевой длительности, когда
upstream без deadline остаётся в leave-active. Наблюдение записано в реестре.

Bind:nativeElement заменяет React MasonryRef. Перестановка сохраняет native draft,
focus и selection input/textarea, а также selection остающихся contenteditable
узлов; внешний фокус не перехватывается. RTL использует inset-inline-start без
изменения DOM-порядка и column в данных. Controls содержимого сохраняют свою
нативную семантику, Masonry не добавляет собственную keyboard navigation.

ConfigProvider.masonry задаёт class/style/classNames/styles; явно заданный
nested config заменяет родительский объект целиком. Semantic callbacks получают
resolved columns. Root style идёт после semantic root и может перекрыть height;
геометрия ячейки идёт после semantic item. Light/dark и CSS variables наследуются.
Components.Masonry поддерживает alias overrides и algorithms; собственных
component tokens в 6.6.8 нет. Шрифт меняет измеренные высоты: с fresh ячейки
пересчитываются, без fresh сохраняют старый layout до load/error/resize либо смены
items/columns. Обновления сохраняют DOM, refs, draft/selection/focus и не создают
повторный onLayoutChange, если распределение и данные не изменились.
Theme.token.motion=false завершает текущий appear/leave и удаляет без ожидания end;
повторное включение не перезапускает appear уже видимых ячеек.

В 6.6.8 Source Masonry вычисляет ant-masonry-css-var, но пропускает этот класс на
корне: font/alias настройки не доходят до CSS. Native marker сохранён; для сверки
эталон получает его через публичный rootClassName без изменения исходников.
Исходные значения без marker и зависший zero-duration leave сохранены в
[эталоне](../../../tests/browser/fixtures/ant-design-masonry-theme-reference.json).
PrefixCls меняет root/item/motion classes; пустая строка и undefined наследуют
ConfigProvider.prefixCls (по умолчанию ant-masonry). Локальный prefix имеет
приоритет, semantic callbacks получают исходное локальное значение. Служебная
item-width variable использует общий prefix провайдера без точек, независимо от
локального класса и theme.cssVar.prefix. Смена prefix сохраняет DOM, текущую
motion phase, draft, focus и selection. Canonical theme marker остаётся прежним.

В 6.6.8 prefixCls="ant-masonry-rtl" в LTR наследует RTL от стандартного stylesheet,
если рядом был обычный Masonry. В свежем документе без этого stylesheet раскладка
LTR. Native ограничивает root/RTL rules владельцем и сохраняет заданное направление;
[raw замеры](../../../tests/browser/fixtures/ant-design-masonry-prefix-reference.json) и
[изолированный замер](../../../tests/browser/fixtures/ant-design-masonry-prefix-isolated.json)
сохранены для разбора. В закреплённом CSS нет отдельного reduced-motion override.

Fixture — `?fixture=masonry`. Engine, SSR, DOM lifecycle, package SSR и browser
проверяют геометрию, breakpoints, fresh/load/error, данные/callbacks, motion,
focus/selection, semantic/config, темы, RTL и cleanup. Prefix отдельно проверяют
[browser](../../../tests/browser/masonry-prefix.spec.ts),
[SSR](../../../tests/package/masonry-prefix.ssr.test.ts) и fixture `?fixture=masonry-prefix`.

