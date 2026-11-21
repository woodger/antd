# Anchor

`Anchor` содержит `items` с key/href/title/target/class, вложенными children,
replace и targetOffset; title принимает текст, число или Snippet. В horizontal
вложенные items не монтируются. Ссылки остаются
нативными a: Tab и Enter работают без дополнительного keyboard engine.

```svelte
<Anchor affix={false} showInkInFixed items={[
  { key: 'intro', href: '#intro', title: 'Введение' },
  { key: 'api', href: '#api', title: 'API', targetOffset: 48 }
]} />
```

По умолчанию Affix включён; `affix` принимает false/true или дополнительные
Affix props без offsetTop/target/children. getContainer возвращает окно
или HTMLElement и используется для scroll и Affix. Приоритет контейнера:
getContainer → ConfigProvider.getTargetContainer → window. Undefined во вложенном
provider сохраняет родительскую функцию; локальный prop имеет приоритет. `offsetTop`
задаёт закрепление; `targetOffset` переопределяет scroll offset, per-link
`targetOffset` имеет высший приоритет, включая 0. `bounds` по умолчанию 5px.
Выбирается наиболее близкий к границе уже достигнутый раздел; порядок items
не заменяет сравнение координат. Raw fragment после # не декодируется, пробелы
сохраняются; используется исходное регулярное выражение Ant Design.

`onClick(event,{title,href})` вызывается перед scroll. preventDefault отменяет
только изменение URL; выбор и анимация всё равно выполняются как в upstream.
Внутренние href используют history.pushState/replaceState (без :target эффекта),
HTTP(S) сохраняют нативный переход, при replace — location.replace.
Item.replace переопределяет общий replace.
`getCurrentAnchor(rawHref)` меняет визуальное выделение; onChange получает
исходный href. Повторная прокрутка с тем же mapped highlight не дублирует callback,
выбор другой raw ссылки сохраняет callback даже при одинаковом highlight.

Прокрутка использует исходную cubic easing длительностью 450ms. Во время
анимации scroll tracking приостановлен; повторный выбор той же ссылки не
перезапускает анимацию, другая ссылка отменяет предыдущую. Удаление компонента
снимает scroll listener и отменяет RAF. SSR не читает getContainer/DOM,
не выбирает active link и не закрепляет контент. Фокус остаётся на ссылке.

`classNames`/`styles` — объект либо функция от {props}, слоты root/item/itemTitle/
indicator. `ConfigProvider.anchor` задаёт общие class/style и semantic defaults.
Undefined наследует родительский record; явно заданный объект, включая {},
заменяет его целиком. Semantic classes накапливаются; root style слои идут после
component variables и вычисленного max-height: context semantic, context plain,
local semantic, local plain. Callback получает текущие Props с resolved direction;
прежние native defaults остальных Props сохранены. Class/rootClassName и
bind:nativeElement относятся к wrapper. `showInkInFixed` сохраняет исходный
класс ant-anchor-fixed при false/affix=false. Тема и RTL наследуются; horizontal
indicator использует offsetLeft/clientWidth и раскрывает активную ссылку
в scrollable ancestors как upstream.

Изменения semantic styles/classes сохраняют ссылки, фокус и callbacks и обновляют
геометрию индикатора. Runtime владеет top/height/left/width индикатора; изменение
его цвета сохраняет эти координаты. Обнаруженный upstream дефект пересчёта
сохранён [отдельно с raw замерами](../anchor-indicator-observation.md).

Базовые отступы пункта Anchor — 4px по вертикали и 16px перед текстом.
У первого горизонтального пункта отступ по inline-оси нулевой; у вложенного
вертикального пункта padding-block равен paddingXXS / 2, обычно 2px.
Переменные отступов объявлены в том же CSS scope, который использует корень
компонента; пользовательский gap для разделения ссылок не требуется.

При source-настройках темы Anchor применяет `components.Anchor`: defaults берутся
из paddingXXS/padding, затем действуют component overrides и отдельный algorithm.
Source compact уменьшает inline-отступ до 8px; native-only compact сохраняет 16px.
Вложенный padding-block по-прежнему равен paddingXXS / 2, независимо от
linkPaddingBlock. Aliases меняют шрифт, цвета и границы; нули/undefined и custom
CSS prefix поддерживаются. Переменные доступны при SSR, semantic/plain styles
сохраняют приоритет. Source-ссылки используют linkDecoration/linkHoverDecoration/
linkFocusDecoration; по умолчанию подчёркивания нет.
Смена темы сохраняет ссылки, фокус, scroll и callbacks.

Для раскрытия ссылки сохранён framework-independent compute-scroll-into-view
3.0.2 (git 0c45c0afce9650b8cc96dd23ea8efdc90cbd32fe), удовлетворяющий ^3.0.2
делегата scroll-into-view-if-needed 3.1.0 (git
8ac397fc9119014eae13069615b16ef4e45b3d9f). Исходник находится в vendor,
единственное изменение алгоритмического файла — удаление неиспользуемого
catch binding; MIT-лицензии обоих пакетов сохранены рядом. Обёртка ограничена
опциями Anchor (if-needed/nearest и scroll margins); npm-зависимости не добавлены.
Сохранено ограничение делегата 3.0.2: отрицательный scrollLeft RTL-контейнера
не поддерживается при автоматическом раскрытии; нативная ручная прокрутка,
выбор и геометрия indicator доступны.
PrefixCls задаёт wrapper/content/link/indicator classes. Empty/undefined наследуют
ConfigProvider.prefixCls (по умолчанию ant-anchor), локальный prefix имеет приоритет.
Items по умолчанию наследуют разрешённый prefix Anchor; item.prefixCls позволяет
явный override, а пустая строка у item возвращает общий prefix провайдера.
Для отдельного item prefix нужны соответствующие внешние стили, как в Source.
Semantic callbacks получают исходный локальный prefix; canonical token marker
сохранён. Смена prefix сохраняет ссылки, refs, ink, фокус, callbacks и history.
Affix получает свой общий prefix независимо от локального prefix Anchor.

В 6.6.8 локальный Anchor.prefixCls не передаётся в items: ссылки остаются с общим
prefix, теряют отступы, а updateInk не находит активную ссылку. Native наследует
prefix владельца, сохраняя явный item override. В
[эталоне](../../../tests/browser/fixtures/ant-design-anchor-prefix-reference.json) записаны
оба случая: raw Source и matchedItems с тем же публичным prefixCls у каждого item,
без правки официального UMD. Сверка полной геометрии использует matchedItems;
исходное наблюдение оставлено для отдельного разбора.

Фикстура — `?fixture=anchor`, пример — `/ant-design#anchor`. Unit/SSR/Chromium
проверяют приоритеты offsets, callbacks/history, анимацию/cleanup, nested items,
RTL/indicator и production hydration. Source tokens и метрики проверяются
[по официальному UMD](../../../src/lib/theme-anchor-tokens-reference.test.ts) и
[в браузере](../../../tests/browser/anchor-theme.spec.ts). CSS-рецепты anchor и anchor-prefix
содержат 22 правила; второй хранит module template для local classes. Prefix
проверяют [browser](../../../tests/browser/anchor-prefix.spec.ts),
[SSR](../../../tests/package/anchor-prefix.ssr.test.ts) и fixture `?fixture=anchor-prefix`.

Ссылки items используют linkDecoration/linkHoverDecoration/
linkFocusDecoration также без cssVar; defaults равны none. Пользовательские
переменные и inline styles.itemTitle сохраняют приоритет.

