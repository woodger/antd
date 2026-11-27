# BorderBeam

BorderBeam добавляет декоративные слои к указанному контейнеру без дополнительной
обёртки. Слои скрыты от accessibility tree. Точные props и значения по умолчанию —
в [исходных типах](../../../src/lib/border-beam/border-beam.types.ts).

В Svelte target явно связывает контейнер с эффектом. Это заменяет клонирование
React child с составным ref; существующий ref вызывающего кода сохраняется.

```svelte
<script lang="ts">
  import { BorderBeam, Card } from '@woodger/antd';

  let container = $state<HTMLDivElement>();
</script>

<BorderBeam target={container} count={3} duration={12} color="#36cfc9">
  <Card bind:nativeElement={container} title="Workspace overview">
    Состояние задач и последних запусков
  </Card>
</BorderBeam>
```

Для нативного элемента используйте bind:this. Контейнер должен задавать
position:relative либо другой positioning context; BorderBeam не исправляет его
style. Отсутствующий target, SVG и обычный текст не получают декорацию. Содержимое
при этом отображается; собственных DOM nodes на SSR нет. Смена target и unmount
удаляют принадлежащие эффекту слои, не меняя controls и содержимое контейнера.

Count округляется вниз; неконечное число или число меньше 1 дают один луч.
Несколько лучей распределяются по циклу отрицательным animation-delay. Первый
луч сохраняет delay из style; остальные используют duration prop либо исходные
6 секунд, даже когда duration переопределена через CSS variable в style.

Градиент сохраняет порядок stops и масштабирует входные проценты 0–100 в видимые
0–70%, оставляя хвост прозрачным. Если последний stop не равен 100%, его цвет
добавляется в конец видимого участка. Пустой массив возвращает градиент темы.
Числовые size/lineWidth используют px; строки остаются CSS lengths.

Без outset четыре отступа измеряются по border-width один раз для каждого
target. Последующие изменения рамки того же узла не вызывают новый замер.
Radius наследуется через CSS и обновляется сразу, включая разные углы. Явный
outset задаётся числом в px либо строкой через calc(-1 * outset); числовое
отрицательное значение сохраняет исходное выражение `--2px` и не нормализуется.

ConfigProvider.borderBeam задаёт class/style слоёв. Вложенный config заменяется
целиком; локальный style идёт после контекстного, а переменные параметров —
после style. Theme light/dark и primary работают через CSS variables; disabled,
locale и направление не меняют декоративное поведение.

BorderBeam принимает alias overrides и algorithms из theme.components.BorderBeam;
собственных component tokens у него нет. Line width, primary gradient и typography
обновляются без пересоздания слоёв. Внешний target получает тему владельца эффекта,
включая CSS overrides его ConfigProvider, независимо от темы физического контейнера.
Context/local style и явные параметры сохраняют приоритет над вычисленной темой.
При удалении source theme возвращается прежнее наследование CSS от target.

CSS-рецепт border-beam сохраняет 10 правил и antBorderBeamMove с проверкой
SHA-256 архива. Слои видимы при поддержке mask-composite и offset-path:rect;
иначе применяется исходный CSS fallback display:none. Reduced motion скрывает
псевдоэлемент и отключает анимацию. Hover/pause настраиваются обычными CSS rules.
Эффект не заменяет focus ring или validation border.

Локальный prefixCls меняет классы слоёв и selectors, включая supports/media rules.
Пустое значение наследует ConfigProvider.prefixCls (по умолчанию ant-border-beam).
Общий prefix задаёт namespace служебных переменных --prefix-border-beam-*;
точки удаляются из namespace, как в source genCssVar. Локальный prefix на него не
влияет, theme.cssVar.prefix независим, имя antBorderBeamMove сохраняется. Смена префикса
сохраняет слои, контейнер, draft и фокус. Scoped stylesheet удаляется вместе
с эффектом либо при возврате к стандартным class/variable prefixes.
Проверки локального prefix — `?fixture=border-beam-prefix`.

Общий prefix проверяется по
[14 исходным примерам и трём переходам](../../../tests/browser/fixtures/ant-design-beam-global-reference.json):
[browser](../../../tests/browser/beam-global.spec.ts),
[SSR](../../../tests/package/border-beam/beam-global.ssr.test.ts), `?fixture=beam-global`.
CSS-кэш 6.6.8 при одинаковом local class и разных общих prefixes повторно использует
namespace родителя: у вложенного луча теряются outset/параметры либо читается размер
родителя. Четыре случая сохранены в raw данных; те же вложенные компоненты на
[отдельной свежей странице](../../../tests/browser/fixtures/ant-design-beam-global-isolated.json)
читают свои переменные правильно. Svelte ограничивает CSS парой class/namespace и
сверяется с этими изолированными исходными результатами. Дефект кэша не перенесён;
raw наблюдение остаётся для отдельного разбора. Слои, target, border snapshot,
draft/focus/selection и reduced motion сохраняются.

