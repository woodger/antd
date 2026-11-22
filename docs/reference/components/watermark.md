# Watermark

Watermark добавляет повторяющийся текст или изображение поверх содержимого.

```svelte
<script lang="ts">
  import { Watermark } from '@woodger/antd-svelte';
</script>
<Watermark content={['Ant Design', { text: 'Svelte 5', font: { fontSize: 12 } }]}>
  <p>Содержимое страницы</p>
</Watermark>
```

Content принимает строку, WatermarkText {text,font} либо смешанный readonly массив.
Отсутствующий content даёт ноль строк; пустая строка остаётся отдельной строкой.
Font задаёт color (включая CanvasGradient/CanvasPattern), fontSize, fontWeight,
fontStyle, fontFamily и textAlign; построчный font накладывает только определённые
значения. FontSize конвертируется через Number, как source: числовые строки
поддержаны, единицы вроде '18px' не разбираются. Между строками FontGap=3.

Три Canvas повторяют исходные text/image, поворот и alternating clips. Размер
текста определяется measureText/fontBoundingBoxAscent/Descent; width/height
переопределяют измерение. Image имеет приоритет, использует crossOrigin=anonymous
и referrerPolicy=no-referrer. При ошибке рисуется content; image defaults 120x64
сохраняются и для fallback. DPR читается при отрисовке; отдельной подписки на его
изменение нет. Пустой рисунок не копирует нулевые Canvas. В DOM Canvas не остаются:
слой использует PNG data URL, background-repeat=repeat и floor(logical width).

Rotate=-22, gap=[100,100], offset=gap/2. Положительное смещение относительно
центра gap сдвигает и сужает слой; отрицательное меняет background-position.
Координаты физические и не переворачиваются в RTL. ZIndex по умолчанию равен
zIndexPopupBase-1, то есть 999 в стандартной теме. Слой absolute, занимает 100%,
не перехватывает pointer events и имеет visibility:visible!important.
Декоративный слой скрыт от accessibility tree, children/focus не подменяются.

Обёртка имеет position:relative/overflow:hidden. ConfigProvider.watermark
принимает class/style; class и rootClassName добавляются, style владельца идёт
после default/context. Вложенный явно заданный watermark config заменяет
родительский. Bind:nativeElement возвращает div. Как исходный WatermarkProps,
компонент не принимает произвольные HTML attrs/events; они остаются у children.
В source theme font defaults читают глобальные colorFill/fontSizeLG, а zIndex —
zIndexPopupBase - 1. Изменения aliases/seed/algorithm перерисовывают PNG без замены
слоя, контейнера, ref или содержимого. Явный font/zIndex и построчные overrides
имеют приоритет; CSS variables и components.Watermark на Canvas не влияют,
как в исходнике. Без source theme сохранены прежние CSS defaults и реактивные
light/dark/compact. Общий disabled не отключает рисунок.

MutationObserver следует исходному набору subtree/childList/style/class.
Изменение style/class слоя восстанавливает стили, снимает class/hidden;
самостоятельное изменение hidden не наблюдается до следующей наблюдаемой мутации.
Удалённый/перемещённый слой возвращается тем же DOM node с кэшированным PNG,
вызывая onRemove. Изменение только стилей не вызывает onRemove. На root
восстанавливаются лишь ожидаемые position/overflow, включая явные overrides;
прочие утраченные inline styles не восстанавливаются. При штатном unmount и
удалении панели onRemove не вызывается.

Сохранены особенности алгоритма кэша и scheduling Ant Design 6.6.8. Кэш хранит
последний набор параметров, исключая HTMLElement и top-level NaN из ключей.
Поэтому смена только image URL при неизменных геометрии/параметрах использует
прежний PNG; смена rotate/size/gap обновляет изображение. Незавершённые image
requests сохраняют исходный completion order: старый ответ с отличающейся
геометрией может временно заменить уже показанный новый рисунок; наблюдатель
может затем запустить актуальную отрисовку. Нативные paint-объекты без enumerable
полей также следуют исходному глубокому сравнению ключей кэша. Leading RAF throttle
выполняет первый вызов сразу и подавляет остальные до кадра без trailing-вызова;
внутрикадровые изменения могут ждать следующего независимого обновления.
Эти особенности не исправлены скрыто при переносе.

Inherit=true предоставляет контекст дочерним Modal/Drawer. Они регистрируют
соответственно .ant-modal-container и .ant-drawer-section; каждый получает
такой же рисунок, включая native dialog top layer. Регистрация следует
сохранённому lifecycle местных Modal/Drawer. Inherit=false не предоставляет
свой контекст; в nested Watermark остаётся доступен контекст внешнего Watermark.
Смена inherit пересоздаёт children branch, как условный Provider исходника.
Attachment панели снимает регистрацию при уничтожении без её восстановления.

SSR выводит только обёртку/children, без Canvas/Image/observer/callbacks.
После unmount отключаются observer, RAF и callbacks ожидающих изображений,
удаляются принадлежащие компоненту слои. Без 2D context остаются children; без
MutationObserver рисунок создаётся, но не восстанавливается после DOM mutation.
Watermark не имеет собственного CSS/component token/prefixCls API в upstream;
нового CSS-рецепта не требуется. Source global tokens, algorithms, zero/undefined,
cssVar prefix/key, priority и scopes проверяются через `?fixture=watermark-theme`
по замерам официального UMD, включая Canvas calls и повторяемый PNG.
Изменение темы обновляет унаследованные слои Modal/Drawer без потери фокуса.
Источник алгоритмов покрыт существующей
[MIT-лицензией Ant Design](../../../src/lib/vendor/LICENSE.ant-design).

Галерея — `/ant-design#watermark`, fixture — `?fixture=watermark`.
Unit/SSR проверяют geometry/fonts/draw calls и серверную границу; browser
проверяет реальные PNG pixels, восстановление DOM, image/cache, DPI и панели.


