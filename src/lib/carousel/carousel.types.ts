import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export type CarouselContent = string | number | bigint | boolean | null | undefined | Snippet
  | readonly CarouselContent[];
export type CarouselEffect = 'scrollx' | 'fade';
export type DotPlacement = 'top' | 'bottom' | 'start' | 'end';
export type CarouselLazyLoad = 'ondemand' | 'progressive' | 'anticipated';
export type CarouselSwipeDirection = 'left' | 'right' | 'up' | 'down' | 'vertical';
export type CarouselAutoplayState = 'playing' | 'paused' | 'hovered' | 'focused' | null;
export type CarouselPlayType = 'update' | 'leave' | 'blur' | 'play' | 'playing';

/** One original child. The snippet renders in its div, and width replaces React style.width. */
export interface CarouselItem {
  children?: CarouselContent;
  width?: number | string;
  class?: string;
  style?: string;
  attributes?: Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'style'>;
}

/** Root props for a custom arrow. onClick is omitted for a disabled direction. */
export interface CarouselArrowProps {
  class: string;
  className: string;
  style: string;
  onClick?: (event?: MouseEvent) => void;
  currentSlide: number;
  slideCount: number;
  'data-role': 'none';
}

/** appendDots applies these props to its root. customPaging applies onClick to the button. */
export interface CarouselDotsProps {
  class: string;
  className: string;
  onMouseEnter?: () => void;
  onMouseOver?: () => void;
  onMouseLeave?: () => void;
}

/** Delegated react-slick 2.0.0 Settings. Defaults are defined in the implementation. */
export interface CarouselSlickSettings {
  /** Physical Left and Right keys outside input, textarea, and select. @defaultValue true */
  accessibility?: boolean;
  /** Height of the current slide after browser measurements. @defaultValue false */
  adaptiveHeight?: boolean;
  /** Called after speed elapses. An interrupted transition reports the previous index. */
  afterChange?: (currentSlide: number) => void;
  appendDots?: Snippet<[dots: Snippet, props: CarouselDotsProps]>;
  /** @defaultValue false */
  arrows?: boolean;
  asNavFor?: CarouselRef | null;
  /** The JavaScript autoplay interval is autoplaySpeed + 50ms. @defaultValue 3000 */
  autoplaySpeed?: number;
  autoplay?: boolean;
  /** Runs before currentSlide changes and before the callback for newly loaded lazy slides. */
  beforeChange?: (currentSlide: number, nextSlide: number) => void;
  centerMode?: boolean;
  centerPadding?: string;
  children?: CarouselContent;
  class?: string;
  cssEase?: string;
  /** A custom renderer explicitly applies onClick to its own native button. */
  customPaging?: Snippet<[index: number, props: { onClick: (event: MouseEvent) => void; }]>;
  dots?: boolean;
  dotsClass?: string;
  /** Mouse drag. Touch separately uses swipe and touchMove. @defaultValue false */
  draggable?: boolean;
  /** Retained upstream prop. The CSS transition uses cssEase. */
  easing?: string;
  edgeFriction?: number;
  fade?: boolean;
  focusOnSelect?: boolean;
  infinite?: boolean;
  /** Reapplied when the prop or root RTL setting changes. @defaultValue 0 */
  initialSlide?: number;
  lazyLoad?: CarouselLazyLoad;
  nextArrow?: Snippet<[props: CarouselArrowProps]>;
  onEdge?: (direction: CarouselSwipeDirection) => void;
  onInit?: () => void;
  /** Indexes include upstream Slick's leading and trailing clones. */
  onLazyLoad?: (slidesToLoad: number[]) => void;
  onLazyLoadError?: () => void;
  onReInit?: () => void;
  onSwipe?: (direction: CarouselSwipeDirection) => void;
  pauseOnDotsHover?: boolean;
  pauseOnFocus?: boolean;
  pauseOnHover?: boolean;
  prevArrow?: Snippet<[props: CarouselArrowProps]>;
  /** Registered on mount. The breakpoint is applied on the matchMedia event. */
  responsive?: readonly CarouselResponsiveObject[];
  /** Positive integer. Rows are grouped into logical slides. @defaultValue 1 */
  rows?: number;
  rtl?: boolean;
  /** Retained upstream prop. react-slick does not use it to change the tag. */
  slide?: string;
  /** Positive integer. @defaultValue 1 */
  slidesPerRow?: number;
  /** Positive number. @defaultValue 1 */
  slidesToScroll?: number;
  /** Positive number. @defaultValue 1 */
  slidesToShow?: number;
  /** CSS transition and afterChange timer duration in ms. @defaultValue 500 */
  speed?: number;
  swipeToSlide?: boolean;
  swipe?: boolean;
  swipeEvent?: (direction: CarouselSwipeDirection) => void;
  touchMove?: boolean;
  touchThreshold?: number;
  useCSS?: boolean;
  useTransform?: boolean;
  variableWidth?: boolean;
  vertical?: boolean;
  verticalSwiping?: boolean;
  waitForAnimate?: boolean;
}

export interface CarouselResponsiveObject {
  breakpoint: number;
  settings: CarouselSlickSettings | 'unslick';
}

/** Ant Design Carousel. items supplies slide metadata. children can be a snippet or an array. */
export interface CarouselProps extends Omit<
  CarouselSlickSettings,
  'dots' | 'dotsClass' | 'autoplay' | 'verticalSwiping'
> {
  /** Takes precedence over children. Snippets are not inspected as a React virtual tree. */
  items?: readonly CarouselItem[];
  effect?: CarouselEffect;
  style?: string;
  /** A nonempty local prefix takes precedence. Otherwise uses ConfigProvider.prefixCls. */
  prefixCls?: string;
  rootClassName?: string;
  id?: string;
  /** Present in upstream types but does not control the current slide. Use ref.goTo. */
  slickGoTo?: number;
  dotPlacement?: DotPlacement;
  dots?: boolean | { class?: string; className?: string; };
  /** @defaultValue false */
  autoplay?: boolean | { dotDuration?: boolean; };
  /** @defaultValue false */
  waitForAnimate?: boolean;
  /** Available after mount. Methods preserve the deferred call behavior of upstream Slick. */
  ref?: CarouselRef;
  /** Outer Carousel div. Supports bind:nativeElement. */
  nativeElement?: HTMLDivElement;
}

/** Observable state from the original innerSlider. In RTL, the index is mirrored. */
export interface CarouselState {
  /** Slick leaves undefined after a transition with useCSS=false. */
  animating: boolean | undefined;
  autoplaying: CarouselAutoplayState;
  currentDirection: number;
  currentLeft: number | null;
  currentSlide: number;
  direction: number;
  dragging: boolean;
  edgeDragged: boolean;
  initialized: boolean;
  lazyLoadedList: number[];
  listHeight: number | null;
  listWidth: number | null;
  scrolling: boolean;
  slideCount: number;
  slideHeight: number | null;
  slideWidth: number | string | null;
  swipeLeft: number | null;
  swiped: boolean;
  swiping: boolean;
  touchObject: CarouselTouchObject;
  trackStyle: Record<string, string | number | undefined>;
  trackWidth: number;
  targetSlide: number;
}

export interface CarouselTouchObject {
  startX?: number;
  startY?: number;
  curX?: number;
  curY?: number;
  swipeLength?: number;
}

/** Methods of the delegated slider. A state object and DOM refs replace the React instance. */
export interface CarouselInnerSlider {
  readonly list: HTMLDivElement | undefined;
  readonly track: { readonly node: HTMLDivElement | undefined; };
  readonly state: Readonly<CarouselState>;
  slickNext: () => void;
  slickPrev: () => void;
  slickGoTo: (slide: number, dontAnimate?: boolean) => void;
  slickPause: () => void;
  slickPlay: () => void;
  slideHandler: (index: number, dontAnimate?: boolean) => void;
  autoPlay: (playType?: CarouselPlayType) => void;
  pause: (pauseType: 'paused' | 'hovered' | 'focused') => void;
}

export interface CarouselRef {
  readonly nativeElement: HTMLDivElement | undefined;
  /** Methods run on a timer. Indexes and direction preserve Slick's RTL semantics. */
  goTo: (slide: number, dontAnimate?: boolean) => void;
  next: () => void;
  prev: () => void;
  autoPlay: (playType?: 'update' | 'leave' | 'blur') => void;
  /** Omitted in responsive unslick mode. Regular mode exposes the typed slider API. */
  readonly innerSlider: CarouselInnerSlider | undefined;
}

/** Inherited class and style apply to the inner slick-slider, as in Ant Design. */
export interface CarouselConfig {
  class?: string;
  style?: string;
}

export interface CarouselLocale {
  prevSlide: string;
  nextSlide: string;
}
