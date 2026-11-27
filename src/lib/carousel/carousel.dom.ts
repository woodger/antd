// Measures the Carousel track and manages DOM subscriptions. Slide state comes from the model.
// Timers and observers live for the duration of the list attachment.
import type { CarouselState } from './carousel.types';
import type { CarouselSettings } from './carousel-settings.engine';
import type { CarouselSlideMetrics } from './carousel.engine';

// Reads list and track dimensions. Horizontal slide measurement accounts for centerPadding.
export function carouselMeasure(
  list: HTMLDivElement,
  track: HTMLDivElement,
  props: CarouselSettings
) {
  const listWidth = Math.ceil(list.offsetWidth);
  let padding = props.centerMode ? Number.parseInt(props.centerPadding) * 2 : 0;
  if (props.centerPadding.endsWith('%')) padding *= listWidth / 100;
  const slideWidth = props.vertical ? listWidth
    : Math.ceil((listWidth - padding) / props.slidesToShow);
  const slideHeight = list.querySelector<HTMLElement>('[data-index="0"]')?.offsetHeight ?? 0;
  return {
    listWidth,
    trackWidth: Math.ceil(track.offsetWidth),
    slideWidth,
    slideHeight,
    listHeight: slideHeight * props.slidesToShow
  };
}

// Captures each rendered slide's position and size in DOM order.
export function carouselMetrics(track: HTMLDivElement | undefined): CarouselSlideMetrics[] {
  return Array.from(track?.children ?? [], element => {
    const slide = element as HTMLElement;
    return {
      index: Number(slide.dataset.index),
      offsetLeft: slide.offsetLeft,
      offsetTop: slide.offsetTop,
      offsetWidth: slide.offsetWidth,
      offsetHeight: slide.offsetHeight
    };
  });
}

/** Native measurements and instance resources. Cleanup cancels every deferred operation. */
export function connectCarouselDOM(
  list: HTMLDivElement,
  read: () => { props: CarouselSettings; state: Readonly<CarouselState>; },
  callbacks: {
    resize: (setTrackStyle: boolean) => void;
    focus: () => void;
    blur: () => void;
    imageError: () => void;
  }
) {
  const view = list.ownerDocument.defaultView!;
  let active = true;
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  const pending = new Set<ReturnType<typeof setTimeout>>();
  const images = new Map<HTMLImageElement, () => void>();

  // Registers a timer that can be cancelled on destruction and removes its entry before invoking it.
  function defer(callback: () => void, delay: number) {
    const timer = setTimeout(() => {
      pending.delete(timer);
      if (active) callback();
    }, delay);
    pending.add(timer);
  }

  // Coalesces frequent recalculation requests and retains the last request's track update flag.
  function resize(setTrackStyle = true) {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (active) callbacks.resize(setTrackStyle);
    }, 50);
  }

  // Adjusts the list height to the current slide only when adaptiveHeight is enabled.
  function adaptHeight() {
    const { props, state } = read();
    if (!props.adaptiveHeight) {
      return;
    }
    const slide = list.querySelector<HTMLElement>(`[data-index="${state.currentSlide}"]`);
    list.style.height = `${slide?.offsetHeight ?? 0}px`;
  }

  // Schedules track dimension and style updates when the window changes.
  function handleWindowResize() {
    resize();
  }

  // Requests a pause when the slide itself receives focus and pauseOnFocus is enabled.
  function handleFocus(event: FocusEvent) {
    const target = event.target;
    if (read().props.pauseOnFocus && target instanceof HTMLElement
      && target.classList.contains('slick-slide')) {
      callbacks.focus();
    }
  }

  // Notifies the model when focus leaves the slide if it handles pauseOnFocus.
  function handleBlur(event: FocusEvent) {
    const target = event.target;
    if (read().props.pauseOnFocus && target instanceof HTMLElement
      && target.classList.contains('slick-slide')) {
      callbacks.blur();
    }
  }

  const observer = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(() => {
    const { props, state } = read();
    if (state.animating) {
      resize(false);
      defer(() => resize(), props.speed);
    }
    else {
      resize();
    }
  }) : undefined;
  observer?.observe(list);
  view.addEventListener('resize', handleWindowResize);
  list.addEventListener('focus', handleFocus, true);
  list.addEventListener('blur', handleBlur, true);

  return {
    adaptHeight,
    // Restores focus to the current slide's DOM node if it is rendered.
    focusCurrent() {
      list.querySelector<HTMLElement>('.slick-current')?.focus();
    },
    // Updates direct image interaction subscriptions for the current track contents.
    scanImages() {
      const found = new Set(list.querySelectorAll<HTMLImageElement>('.slick-slide img'));
      for (const [image, dispose] of images) {
        if (!found.has(image)) {
          dispose();
          images.delete(image);
        }
      }
      let loaded = 0;
      for (const image of found) {
        if (images.has(image)) continue;
        // Focuses the image's parent to allow navigation from the slide.
        function handleClick() {
          image.parentElement?.focus();
        }
        // With lazyLoad, updates height and defers measurement. Otherwise waits for the whole image
        // set to finish.
        function handleLoad() {
          if (read().props.lazyLoad) {
            adaptHeight();
            defer(() => resize(), read().props.speed);
          }
          else if (++loaded >= found.size) {
            resize();
          }
        }
        // Counts image errors as completed loads and notifies the model outside lazyLoad.
        function handleError() {
          if (!read().props.lazyLoad) {
            if (++loaded >= found.size) resize();
            callbacks.imageError();
          }
        }
        image.addEventListener('click', handleClick);
        image.addEventListener('load', handleLoad);
        image.addEventListener('error', handleError);
        images.set(image, () => {
          image.removeEventListener('click', handleClick);
          image.removeEventListener('load', handleLoad);
          image.removeEventListener('error', handleError);
        });
      }
    },
    // Cancels deferred recalculations and removes observers, focus handlers, and image
    // subscriptions.
    destroy() {
      active = false;
      clearTimeout(resizeTimer);
      for (const timer of pending) clearTimeout(timer);
      pending.clear();
      for (const dispose of images.values()) dispose();
      images.clear();
      observer?.disconnect();
      view.removeEventListener('resize', handleWindowResize);
      list.removeEventListener('focus', handleFocus, true);
      list.removeEventListener('blur', handleBlur, true);
    }
  };
}

/** matchMedia mirrors json2mq ranges. Upstream Slick activates them on change. */
export function connectCarouselResponsive(
  view: Window,
  breakpoints: readonly number[],
  onChange: (breakpoint: number | null) => void
) {
  const sorted = [...breakpoints].sort((a, b) => a - b);
  const disposers: (() => void)[] = [];
  // Adds a range listener and registers its removal for shared cleanup.
  function watch(query: string, breakpoint: number | null) {
    const media = view.matchMedia(query);
    // Reports a breakpoint only when entering the media query's range.
    function handleChange(event: MediaQueryListEvent) {
      if (event.matches) onChange(breakpoint);
    }
    media.addEventListener('change', handleChange);
    disposers.push(() => media.removeEventListener('change', handleChange));
  }
  sorted.forEach((value, index) => {
    const minimum = index === 0 ? 0 : sorted[index - 1] + 1;
    watch(`(min-width: ${minimum}px) and (max-width: ${value}px)`, value);
  });
  if (sorted.length) watch(`(min-width: ${sorted[sorted.length - 1]}px)`, null);
  // Removes media listeners for all ranges owned by this attachment.
  return () => {
    for (const dispose of disposers) dispose();
  };
}
