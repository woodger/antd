// The user body owns strings and scrolls. Table translates the position into the coordinates of the
// cap and the results, and the handle remains with its owner.
import { untrack } from 'svelte';
import { alignTableRow, getTableFocusOffset } from './table-layout.dom';
import type {
  TableBodyRenderInfo, TableBodyScrollEvent, TableBodyScrollHandle, TableKey, TableScrollConfig
} from './table.types';

/** Defines DOM from his own window, including the body in another document. */
function isScrollElement(target: HTMLElement | TableBodyScrollHandle): target is HTMLElement {
  if (!('ownerDocument' in target)) {
    return false;
  }

  const constructor = target.ownerDocument.defaultView?.HTMLElement;
  return constructor !== undefined && target instanceof constructor;
}

/** Excludes the frame of the scrolling element from the width of the occupied strip. */
function scrollbarWidth(element: HTMLElement) {
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  const leftBorder = parseFloat(style?.borderLeftWidth ?? '') || 0;
  const rightBorder = parseFloat(style?.borderRightWidth ?? '') || 0;
  return Math.max(0, element.offsetWidth - element.clientWidth - leftBorder - rightBorder);
}

/** Measures the database of the document, when only the handle of the virtualizer is registered. */
function defaultScrollbarWidth(container: HTMLElement) {
  const probe = container.ownerDocument.createElement('div');
  probe.style.cssText = (
    'position:absolute;'
    + 'visibility:hidden;'
    + 'width:100px;'
    + 'height:100px;'
    + 'overflow:scroll'
  );
  container.append(probe);
  const width = scrollbarWidth(probe);
  probe.remove();
  return width;
}

/** Shares the position between the custom body and fixed strips. */
export function createTableCustomBody(options: {
  container: () => HTMLDivElement | undefined;
  bands: () => readonly (HTMLDivElement | undefined)[];
  rows: () => readonly { key: TableKey; }[];
  rtl: () => boolean;
}) {
  let registration = $state.raw<{ target: HTMLElement | TableBodyScrollHandle; }>();
  const target = $derived(registration?.target);
  const element = $derived(target && isScrollElement(target) ? target : undefined);
  let scrollbarSize = $state(0);
  let syncing = false;

  $effect(() => {
    const current = target;
    const node = element;
    const container = options.container();
    if (!current || !container) {
      scrollbarSize = 0;
      return;
    }

    if (!node) {
      scrollbarSize = defaultScrollbarWidth(container);
      return;
    }

    /** Measures only the band of the registered DOM-container. */
    const measure = () => {
      scrollbarSize = scrollbarWidth(node);
    };

    const Observer = node.ownerDocument.defaultView?.ResizeObserver;
    const observer = Observer && new Observer(measure);
    observer?.observe(node);
    measure();
    return () => observer?.disconnect();
  });

  $effect(() => {
    const bands = options.bands();
    const current = target;
    void scrollbarSize;
    if (current) {
      untrack(() => alignBands(bands, current.scrollLeft));
    }
  });

  /** Cleanup old attachment retains an already registered replacement. */
  function register(body: HTMLElement | TableBodyScrollHandle) {
    const handle = { target: body };
    registration = handle;
    return () => {
      if (registration === handle) {
        registration = undefined;
      }
    };
  }

  /** Applies a general physical coordinate for the cap and the fixed result. */
  function alignBands(bands: readonly (HTMLDivElement | undefined)[], left: number) {
    for (const band of bands) {
      if (band && band.scrollLeft !== left) {
        band.scrollLeft = left;
      }
    }
  }

  /** Accepts a native scroll event or a clear coordinate from the body owner. */
  function syncScroll(event: TableBodyScrollEvent) {
    const current = target;
    const left = event.scrollLeft ?? event.currentTarget?.scrollLeft;
    if (syncing || !current || left === undefined || !Number.isFinite(left)) {
      return;
    }

    syncing = true;
    try {
      if (current.scrollLeft !== left) {
        current.scrollLeft = left;
      }
      alignBands(options.bands(), current.scrollLeft);
    }
    finally {
      syncing = false;
    }
  }

  /** Translates the wheel and keyboard navigation of the strip into the scrolling of the body. */
  function attachBand(band: HTMLDivElement) {
    /** Takes into account the maximum scrolling of the strip, including the difference from the width of the body. */
    function clamp(left: number) {
      const range = band.scrollWidth - band.clientWidth;
      return options.rtl() ? Math.max(-range, Math.min(0, left))
        : Math.max(0, Math.min(range, left));
    }

    /** Passes the physical RTL or LTR coordinate within the strip. */
    function wheel(event: WheelEvent) {
      if (!event.deltaX || !target) {
        return;
      }

      const left = clamp(band.scrollLeft + event.deltaX);
      syncScroll({ scrollLeft: left });
      event.preventDefault();
    }

    /** The browser can leave visible only the edge of a broad focused button. */
    function revealFocus(event: FocusEvent) {
      const focused = event.target;
      const view = band.ownerDocument.defaultView;
      if (!view || !(focused instanceof view.Element) || !focused.matches(':focus-visible')) {
        return;
      }

      const cell = focused.closest('th, td');
      if (cell && view.getComputedStyle(cell).position === 'sticky') {
        return;
      }

      const start = parseFloat(band.style.getPropertyValue('--ant-table-fixed-start-width')) || 0;
      const end = parseFloat(band.style.getPropertyValue('--ant-table-fixed-end-width')) || 0;
      const offset = getTableFocusOffset(band, focused, start, end, options.rtl());
      if (offset) {
        syncScroll({ scrollLeft: clamp(band.scrollLeft + offset) });
      }
    }

    /** Maintains the shared position on click and opens the visible region for Tab navigation. */
    function scroll() {
      const current = target;
      if (!current || syncing) {
        return;
      }

      const expected = clamp(current.scrollLeft);
      if (Math.abs(band.scrollLeft - expected) < 1) {
        return;
      }
      if (band.querySelector(':focus-visible')) {
        syncScroll({ scrollLeft: band.scrollLeft });
      }
      else {
        band.scrollLeft = expected;
      }
    }

    band.addEventListener('wheel', wheel, { passive: false });
    band.addEventListener('scroll', scroll, { passive: true });
    band.addEventListener('focusin', revealFocus);
    return () => {
      band.removeEventListener('wheel', wheel);
      band.removeEventListener('scroll', scroll);
      band.removeEventListener('focusin', revealFocus);
    };
  }

  /** Finds a DOM row by key on the current page or forwards the original request to the handle. */
  function scrollTo(config: TableScrollConfig) {
    const current = target;
    if (!current) {
      return;
    }

    if (!isScrollElement(current)) {
      current.scrollTo?.(config);
      return;
    }

    const { top, index, align = 'nearest', offset = 0 } = config;
    if (top !== undefined && Number.isFinite(top)) {
      current.scrollTop = top;
      return;
    }

    const key = config.key ?? (index === undefined ? undefined : options.rows()[index]?.key);
    if (key === undefined) {
      return;
    }

    const keyText = String(key);
    const rows = current.querySelectorAll<HTMLElement>('[data-row-key]');
    const row = Array.from(rows).find(row => row.dataset.rowKey === keyText);
    if (row) {
      const bottom = Math.max(0, current.offsetHeight - current.clientHeight - current.clientTop);
      alignTableRow(current, row, { top: current.clientTop, bottom }, align, offset);
    }
  }

  const info: TableBodyRenderInfo = {
    get scrollbarSize() { return scrollbarSize; },
    ref: register,
    onScroll: syncScroll
  };

  return {
    info,
    get element() { return element; },
    attachBand,
    syncScroll,
    scrollTo
  };
}
