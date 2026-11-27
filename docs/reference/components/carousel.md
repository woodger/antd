# Carousel

Carousel отображает слайды с поддержкой прокрутки и автоматического переключения.
Props, snippets и refs описаны в [carousel.types.ts](../../../src/lib/carousel/carousel.types.ts).

```svelte
<script lang="ts">
  import { Carousel, type CarouselRef } from '@woodger/antd';

  let carousel = $state<CarouselRef>();
</script>

<Carousel arrows autoplay={{ dotDuration: true }} bind:ref={carousel}
  children={['Первый слайд', 'Второй слайд', 'Третий слайд']} />
<button type="button" onclick={() => carousel?.goTo(0)}>В начало</button>
```

Каждый элемент массива children — отдельный логический слайд. Один непрозрачный
snippet тоже образует один слайд: его внутренние DOM-узлы не разбираются.
Для нескольких snippets и метаданных используйте items: каждый элемент задаёт
children, class, attributes и width исходного child div. Items имеет приоритет
над children. Числовой width нужен для variableWidth, включая SSR; строки rows
и slidesPerRow группируются до создания клонов. Как в Slick, группировка заменяет
child style своими width/display; произвольный стиль содержимого задавайте внутри
snippet. Клоны создают независимые экземпляры snippets, поэтому их DOM ids должны
учитывать возможное повторение.

По умолчанию dots включены, arrows/draggable/autoplay/waitForAnimate выключены,
infinite включён, speed равен 500ms. Effect="fade" включает fade и один слайд на
страницу; centerMode устанавливает slidesToScroll=1. DotPlacement принимает
top/bottom/start/end.
Start/end включают vertical по умолчанию; явный vertical имеет приоритет.
Вертикальный режим отключает наследуемое зеркалирование RTL. В горизонтальном
RTL currentSlide зеркальный, но next/prev сохраняют исходное направление Slick.

InitialSlide задаёт начальную позицию и повторно применяется при изменении этого
prop или root RTL. Смена количества слайдов сама по себе его не применяет.
Как в Ant Design, RTL reset считает исходные children до rows grouping.
BeforeChange/afterChange сохраняют порядок и прерывание перехода; waitForAnimate
блокирует повторный переход. GoTo/next/prev откладываются на native timer, как
исходные методы. Ref появляется после mount, nativeElement указывает на внешний
div. InnerSlider предоставляет типизированные state/list/track и методы Slick;
это Svelte adapter, а не произвольный React class instance. В responsive unslick
innerSlider отсутствует, а методы Carousel ничего не переключают.

Autoplay использует интервал autoplaySpeed+50ms; duration dots — autoplaySpeed.
PauseOnHover/pauseOnDotsHover/pauseOnFocus сохраняют исходные состояния
playing/paused/hovered/focused. Focus pause относится к самому slick-slide,
а не к вложенному input. CSS-прогресс dots не останавливается вместе с JS autoplay.
LazyLoad поддерживает ondemand, anticipated и progressive с исходными индексами
onLazyLoad, включая клоны. AdaptiveHeight обновляется после измерений и image load.
Responsive регистрирует media listeners при mount и применяет breakpoint по
событию matchMedia; исходного принудительного применения при mount нет.

Клавиатура использует physical Left/Right и RTL, пропуская input/textarea/select.
Мышиный drag требует draggable; touch учитывает swipe/touchMove/touchThreshold,
edgeFriction и swipeToSlide. Controls — native button с type="button"; они не
отправляют форму. У arrows, dots и слайдов есть видимый keyboard focus. Отключённая
стрелка сохраняет исходные class/pointer semantics без добавления native disabled.
FocusOnSelect фокусирует прежний current DOM slide до commit, как react-slick.

PrevArrow/nextArrow получают class/style/onClick/currentSlide/slideCount;
customPaging — индекс и onClick, appendDots — default dots snippet и root props.
Пользовательский renderer явно применяет эти props к своим элементам.
ConfigProvider.carousel задаёт class/style внутреннего slick-slider; локальные
значения имеют приоритет. RootClassName/id относятся к внешнему wrapper.
Locale.carousel и исходный alias Carousel задают имена стрелок; локальный
Carousel имеет приоритет. Темы light/dark/compact и RTL используют общие CSS variables.

Локальный `prefixCls` задаёт wrapper, RTL/vertical classes и имена duration
keyframes; пустое значение наследует `ConfigProvider.prefixCls`. Классы Slick
сохраняются. Prefix вложенных Radio/Checkbox selectors берётся из общего provider,
независимо от локального имени Carousel и namespace theme variables. Смена prefix
сохраняет текущий слайд, DOM, ref, draft/selection/focus и управление стрелками.
Сверка: [официальные замеры](../../../tests/browser/fixtures/ant-design-carousel-prefix-reference.json),
[браузер](../../../tests/browser/carousel/carousel-prefix.spec.ts) и
[SSR](../../../tests/package/carousel/carousel-prefix.ssr.test.ts), `?fixture=carousel-prefix`.

ConfigProvider.theme.components.Carousel применяет семь компонентных токенов:
размеры и отступ стрелок, ширину/высоту/отступ/интервал точек и ширину активной
точки. Вертикальный режим меняет местами размеры точек по исходным правилам.
Поддержаны alias tokens, глобальные и компонентные algorithms, cssVar.prefix,
вложенные providers и реактивное обновление без пересоздания слайдов.
DotActiveWidth поддерживает явный 0; по умолчанию используется 24.
Тематические переменные задаются wrapper; пользовательские class/style и
ConfigProvider.carousel по-прежнему относятся к inner slider и сохраняют приоритет.
Сверка: [официальные CSS tokens](../../../tools/fixtures/ant-design-carousel-tokens-reference.json),
[геометрия четырёх размещений](../../../tests/browser/fixtures/ant-design-carousel-theme-reference.json),
[SSR](../../../tests/package/carousel/carousel-theme.ssr.test.ts) и
[browser](../../../tests/browser/carousel/carousel-theme.spec.ts), `?fixture=carousel-theme`.

SSR выводит исходную процентную либо variable-width геометрию и lazy placeholders
без DOM, callbacks, timers или media queries. При уничтожении очищаются timers,
ResizeObserver, image/focus/touch/media listeners и refs; поздние callbacks не
вызываются. React development diagnostics и устаревшие IE fallbacks не воспроизводятся.
