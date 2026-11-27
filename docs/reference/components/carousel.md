# Carousel

Carousel displays slides with scrolling and autoplay. [Props, snippets, and refs](../../../src/lib/carousel/carousel.types.ts)

```svelte
<script lang="ts">
  import { Carousel, type CarouselRef } from '@woodger/antd';

  let carousel = $state<CarouselRef>();
</script>

<Carousel arrows autoplay={{ dotDuration: true }} bind:ref={carousel}
  children={['Первый слайд', 'Второй слайд', 'Третий слайд']} />
<button type="button" onclick={() => carousel?.goTo(0)}>В начало</button>
```

Each entry in the children array is one logical slide. An opaque snippet also
forms a single slide. Its internal DOM stays opaque. Use items for multiple
snippets with metadata. Each entry supplies children, class, attributes, and
width for the original child div. Items takes precedence over children.
VariableWidth needs numeric width, including in SSR. Rows and slidesPerRow
are grouped before creating clones. As in Slick, grouping gives the child
its own width and display styles. Set custom content style inside the snippet.
Clones create independent snippet instances, so use DOM IDs that allow repetition.

Dots and infinite are enabled by default. Arrows, draggable, autoplay, and
waitForAnimate are disabled. Speed defaults to 500ms. Effect="fade" enables
fade and one slide per page. CenterMode sets slidesToScroll=1. DotPlacement
accepts top, bottom, start, and end. Start and end default to vertical.
An explicit vertical takes precedence. Vertical mode disables inherited RTL
mirroring. In horizontal RTL, currentSlide is mirrored while next and prev
keep Slick's direction.

InitialSlide sets the initial position and is reapplied when the prop or root RTL
changes. A slide count change alone leaves it untouched. As in Ant Design, RTL reset
counts the original children before row grouping. BeforeChange and afterChange
preserve transition order and interruption. WaitForAnimate blocks repeated
transitions. GoTo, next, and prev use a deferred native timer like upstream.
The ref is available after mount. NativeElement points to the outer div.
InnerSlider exposes typed state, list, track, and Slick methods through a
Svelte adapter. Responsive unslick has no innerSlider and its methods leave the
current slide unchanged.

Autoplay ticks every autoplaySpeed+50ms. The dots duration is autoplaySpeed.
PauseOnHover, pauseOnDotsHover, and pauseOnFocus preserve playing, paused, hovered,
and focused states. Focus pause applies to the slick-slide itself. The CSS
dots progress continues during a JavaScript autoplay pause. LazyLoad supports
ondemand, anticipated, and progressive with upstream onLazyLoad indexes,
including clones. AdaptiveHeight updates after measurements and image load.
Responsive registers media listeners on mount and applies a breakpoint on a
matchMedia event. Mount alone does not force the breakpoint.

Keyboard handling uses physical Left and Right and RTL, skipping input, textarea,
and select. Mouse drag requires draggable. Touch considers swipe, touchMove,
touchThreshold, edgeFriction, and swipeToSlide. Controls are native buttons with
type="button" and leave form submission alone. Arrows, dots, and slides have
visible keyboard focus. An unavailable arrow keeps upstream class and pointer
semantics without native disabled. FocusOnSelect focuses the previous current DOM
slide before commit, as in react-slick.

PrevArrow and nextArrow receive class, style, onClick, currentSlide, and slideCount.
CustomPaging receives the index and onClick. AppendDots receives the default dots
snippet and root props. Custom renderers apply these props explicitly.
ConfigProvider.carousel sets class and style on the inner slick-slider. Local
values take precedence. RootClassName and id apply to the outer wrapper.
Locale.carousel and upstream alias Carousel set arrow names, with local
Carousel taking precedence. Light, dark, compact, and RTL use shared CSS variables.

Local `prefixCls` sets the wrapper, RTL and vertical classes, and duration keyframe
names. An empty value inherits `ConfigProvider.prefixCls`. Slick classes stay in
place. Nested Radio and Checkbox selectors use the shared provider prefix independently
of local Carousel and the theme variable namespace. Prefix changes preserve slide,
DOM, ref, draft, selection, focus, and arrow controls. The fixture is
`?fixture=carousel-prefix`. [Official measurements](../../../tests/browser/fixtures/ant-design-carousel-prefix-reference.json) · [Browser](../../../tests/browser/carousel/carousel-prefix.spec.ts) ·
[SSR](../../../tests/package/carousel/carousel-prefix.ssr.test.ts)

ConfigProvider.theme.components.Carousel applies seven component tokens for arrow
size and spacing, dot width, height, margin, interval, and active dot width.
Vertical mode swaps dot dimensions as upstream does. Alias tokens, global and
component algorithms, cssVar.prefix, nested providers, and live updates without
remounting slides are supported. DotActiveWidth accepts explicit 0 and defaults
to 24. The wrapper receives theme variables. User class and style and
ConfigProvider.carousel still apply to the inner slider and retain precedence.
The theme fixture is `?fixture=carousel-theme`. [Official CSS tokens](../../../tests/reference/ant-design-carousel-tokens-reference.json) ·
[Geometry for four placements](../../../tests/browser/fixtures/ant-design-carousel-theme-reference.json) · [SSR](../../../tests/package/carousel/carousel-theme.ssr.test.ts) · [Browser](../../../tests/browser/carousel/carousel-theme.spec.ts)

SSR renders upstream percentage or variable-width geometry and lazy placeholders
without browser DOM, callbacks, timers, or media queries. Unmount clears timers,
ResizeObserver, image, focus, touch, and media listeners, and refs, and prevents
late callbacks. React development diagnostics and old IE fallbacks remain
outside the port.
