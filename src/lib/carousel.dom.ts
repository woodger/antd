// Измеряет трек Carousel и управляет DOM-подписками. Состояние слайда приходит из модели, таймеры
// и наблюдатели живут столько же, сколько привязка к списку.
import type { CarouselState } from './carousel.types';
import type { CarouselSettings } from './carousel-settings.engine';
import type { CarouselSlideMetrics } from './carousel.engine';

// Считывает размеры списка и трека. В расчёте горизонтального слайда учитывает centerPadding.
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

// Снимает положение и размеры каждого отрендеренного слайда в порядке DOM.
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

/** Нативные измерения и ресурсы экземпляра; все отложенные операции отменяются в cleanup. */
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

  // Регистрирует таймер, который можно отменить при уничтожении, и снимает запись перед вызовом.
  function defer(callback: () => void, delay: number) {
    const timer = setTimeout(() => {
      pending.delete(timer);
      if (active) callback();
    }, delay);
    pending.add(timer);
  }

  // Объединяет частые запросы пересчёта, сохраняя флаг обновления трека последнего запроса.
  function resize(setTrackStyle = true) {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (active) callbacks.resize(setTrackStyle);
    }, 50);
  }

  // Меняет высоту списка по текущему слайду только при включённом adaptiveHeight.
  function adaptHeight() {
    const { props, state } = read();
    if (!props.adaptiveHeight) {
      return;
    }
    const slide = list.querySelector<HTMLElement>(`[data-index="${state.currentSlide}"]`);
    list.style.height = `${slide?.offsetHeight ?? 0}px`;
  }

  // Планирует обновление размеров и стиля трека при изменении окна.
  function handleWindowResize() {
    resize();
  }

  // Запрашивает паузу для фокуса на самом слайде при включённом pauseOnFocus.
  function handleFocus(event: FocusEvent) {
    const target = event.target;
    if (read().props.pauseOnFocus && target instanceof HTMLElement
      && target.classList.contains('slick-slide')) {
      callbacks.focus();
    }
  }

  // Передаёт модели уход фокуса со слайда, если модель учитывает pauseOnFocus.
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
    // Восстанавливает фокус на DOM-узле текущего слайда, если он отрендерен.
    focusCurrent() {
      list.querySelector<HTMLElement>('.slick-current')?.focus();
    },
    // Обновляет подписки прямого взаимодействия с изображениями по текущему составу трека.
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
        // Передаёт фокус родителю изображения для навигации со слайда.
        function handleClick() {
          image.parentElement?.focus();
        }
        // При lazyLoad обновляет высоту и откладывает измерение. Иначе ждёт завершения загрузки
        // набора.
        function handleLoad() {
          if (read().props.lazyLoad) {
            adaptHeight();
            defer(() => resize(), read().props.speed);
          }
          else if (++loaded >= found.size) {
            resize();
          }
        }
        // Учитывает ошибку в числе завершённых изображений и уведомляет модель вне lazyLoad.
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
    // Отменяет отложенные пересчёты и удаляет наблюдение, обработчики фокуса и подписки
    // изображений.
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

/** MatchMedia повторяет диапазоны json2mq; исходный slick активирует их по change. */
export function connectCarouselResponsive(
  view: Window,
  breakpoints: readonly number[],
  onChange: (breakpoint: number | null) => void
) {
  const sorted = [...breakpoints].sort((a, b) => a - b);
  const disposers: (() => void)[] = [];
  // Добавляет слушатель диапазона и регистрирует его отключение для общей очистки.
  function watch(query: string, breakpoint: number | null) {
    const media = view.matchMedia(query);
    // Передаёт breakpoint только при входе в диапазон media query.
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
  // Снимает media listeners всех диапазонов, принадлежащих этой привязке.
  return () => {
    for (const dispose of disposers) dispose();
  };
}
