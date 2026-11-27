// Measures parts of a native table separately from rows. Fixed strips reduce the visible area of
// the lines, the usual results lengthen the scroll after them.
import { untrack } from 'svelte';
import { scrollFrame } from '../scroll.engine';
import { alignTableRow } from './table-layout.dom';
import { tableVirtualAlign, tableVirtualColumns, tableVirtualDimension } from './table-virtual.engine';
import type { TableKey, TableScrollConfig, TableScrollOptions } from './table.types';
import { measureVirtualListRow } from '../virtual-list.dom';
import { createVirtualList } from '../virtual-list.model.svelte';

/** The details go immediately behind the line and are included in its size to search for the key. */
function measureTableRow(row: HTMLElement): number | undefined {
  const height = measureVirtualListRow(row);
  if (height === undefined) {
    return undefined;
  }

  const details = row.nextElementSibling as HTMLTableRowElement | null;
  return details?.dataset.antTablePart === 'expanded-row' && !details.hidden
    ? height + (measureVirtualListRow(details) ?? 0) : height;
}

/** Retains DOM-window, horizontal position and canceled reset scrollTop. */
export function createTableViewport<Entry extends { row: { key: TableKey; }; }>(options: {
  rows: () => readonly Entry[];
  widths: () => readonly (string | number | undefined)[];
  minWidths: () => readonly (number | undefined)[];
  estimate: () => number;
  cellPadding: () => number;
  virtual: () => boolean;
  scroll: () => TableScrollOptions | undefined;
  table: () => HTMLTableElement | undefined;
  body: () => HTMLElement | undefined;
  element: () => HTMLDivElement | undefined;
  /** null means its own body without a registered DOM-container. */
  customElement: () => HTMLElement | null | undefined;
  header: () => boolean;
  /** Measures the current DOM-knot after replacing the text label on snippet. */
  caption: () => HTMLTableCaptionElement | undefined;
  summary: () => 'top' | 'bottom' | 'inline' | undefined;
  rtl: () => boolean;
}) {
  let width = $state(0);
  let height = $state(0);
  let headHeight = $state(0);
  let captionHeight = $state(0);
  let summaryHeight = $state(0);
  let lastTop = 0;
  let cancelAnimation: (() => void) | undefined;
  const scroll = $derived(options.scroll());
  const virtualLayout = $derived(options.virtual() && scroll?.y !== undefined);
  const active = $derived(virtualLayout && options.rows().length > 0);
  const summary = $derived(options.summary());
  const fixedSummary = $derived(summary === 'top' || summary === 'bottom');
  const scrollWidth = $derived(tableVirtualDimension(scroll?.x, 1));
  const limit = $derived(tableVirtualDimension(scroll?.y, 500));
  const topInset = $derived(headHeight + captionHeight + (summary === 'top' ? summaryHeight : 0));
  const bottomInset = $derived(summary === 'bottom' ? summaryHeight : 0);
  const reserved = $derived(topInset + bottomInset);
  const scrollTail = $derived(summary === 'inline' ? summaryHeight : 0);
  const maxHeight = $derived.by(() => {
    if (active) {
      return limit + reserved;
    }

    const bodyHeight = scroll?.y;
    if (bodyHeight === undefined || !fixedSummary) {
      return undefined;
    }

    return typeof bodyHeight === 'number' ? bodyHeight + reserved
      : `calc(${bodyHeight} + ${reserved}px)`;
  });
  const layout = $derived(virtualLayout ? tableVirtualColumns(
    options.widths(), scrollWidth, width, active ? options.cellPadding() : 0,
    active ? options.minWidths() : []
  ) : undefined);
  const list = createVirtualList<Entry, TableKey>({
    rows: options.rows,
    getKey: entry => entry.row.key,
    height: () => active ? limit : undefined,
    estimate: options.estimate,
    enabled: () => active,
    width: () => layout?.width,
    scrollTail: () => scrollTail,
    measureRow: measureTableRow,
    viewportHeight: holder => Math.max(0, holder.clientHeight - reserved)
  });
  const renderRows = $derived(active
    ? options.rows().slice(list.range.start, list.range.end + 1) : options.rows());
  const after = $derived.by(() => {
    if (!active) {
      return 0;
    }

    const last = renderRows.at(-1);
    const scrollHeight = list.range.scrollHeight;
    if (!last || scrollHeight === undefined) {
      return 0;
    }

    const bottom = list.getSize(last.row.key).bottom;
    return bottom === undefined ? 0 : Math.max(0, scrollHeight - bottom);
  });

  $effect(() => {
    const element = options.element();
    const table = options.table();
    if (!element || !table || (!active && !fixedSummary)) {
      return;
    }

    const body = active ? options.body() : undefined;
    const head = options.header() ? table.tHead : null;
    const caption = options.caption() ?? null;
    const foot = summary ? table.tFoot : null;
    return untrack(() => connect(element, body, head, caption, foot));
  });

  /** Observes the dimensions of the fixed parts separately from the heights of virtual lines. */
  function connect(
    element: HTMLDivElement,
    body: HTMLElement | undefined,
    head: HTMLTableSectionElement | null,
    caption: HTMLTableCaptionElement | null,
    foot: HTMLTableSectionElement | null
  ) {
    /** Recalculates the line area when you change the wrapper, titles, or outcomes. */
    const resize = () => {
      headHeight = head?.offsetHeight ?? 0;
      captionHeight = caption?.offsetHeight ?? 0;
      summaryHeight = foot?.offsetHeight ?? 0;
      width = element.clientWidth;
      height = Math.max(0, element.clientHeight - reserved);
    };
    const Observer = element.ownerDocument.defaultView?.ResizeObserver;
    const observer = Observer && new Observer(resize);
    observer?.observe(element);
    if (head) observer?.observe(head);
    if (caption) observer?.observe(caption);
    if (foot) observer?.observe(foot);
    resize();

    const disconnect = body ? list.connect(element, body) : undefined;
    if (body) {
      list.sync(element.scrollTop);
      list.syncLeft(Math.abs(element.scrollLeft));
    }

    return () => {
      observer?.disconnect();
      disconnect?.();
    };
  }

  $effect(() => {
    void options.element();
    void options.customElement();
    return cancelReset;
  });

  /** Follows changes in the disclosed details, including after uploading the content. */
  function attachDetails(details: HTMLElement) {
    const Observer = details.ownerDocument.defaultView?.ResizeObserver;
    const observer = Observer && new Observer(list.collect);
    observer?.observe(details);
    list.collect();

    return () => {
      observer?.disconnect();
      list.collect();
    };
  }

  /** In virtual mode, callback refers only to the vertical axis. */
  function handleScroll(element: HTMLDivElement) {
    const top = element.scrollTop;
    const vertical = top !== lastTop;
    lastTop = top;

    if (!active) {
      return true;
    }

    if (list.top !== top) list.sync(top);
    list.syncLeft(Math.abs(element.scrollLeft));
    return vertical;
  }

  /** The user's new position and input is interrupted by reset after onChange. */
  function cancelReset() {
    cancelAnimation?.();
    cancelAnimation = undefined;
  }

  /** Interrupts the reset when captured by the mouse of any of the stripes. */
  function dragScrollbar(moving: boolean) {
    if (moving) cancelReset();
  }

  /** The position of the strip is counted from the logical principle, scrollLeft - from the physical. */
  function scrollHorizontal(offset: number) {
    const element = options.element();
    if (!element) {
      return;
    }

    cancelReset();
    element.scrollLeft = options.rtl() ? -offset : offset;
  }

  /** Addresses the lines on the opened page. scrollTop takes precedence over the key and index. */
  function scrollTo(target: TableScrollConfig) {
    const element = options.element();
    if (!element) {
      return;
    }

    const { top, key, index, align, offset = 0 } = target;
    if (top !== undefined) {
      if (!Number.isFinite(top)) {
        return;
      }

      cancelReset();
      if (active) list.scrollTo(top);
      else element.scrollTop = top;
      return;
    }

    const rows = options.rows();
    const position = key === undefined ? index : rows.findIndex(entry => entry.row.key === key);
    if (position === undefined || position < 0 || !Number.isInteger(position) || !rows.length) {
      return;
    }

    cancelReset();
    const inset = Number.isFinite(offset) ? offset : 0;
    if (active) {
      list.scrollTo({ index: position, align: tableVirtualAlign(align, inset), offset: inset });
      return;
    }

    const table = options.table();
    const body = options.body();
    const rowsInDom = body?.querySelectorAll<HTMLTableRowElement>(
      ':scope > [data-ant-table-part="row"]'
    );
    const item = rowsInDom?.[position];
    if (item) {
      const head = scroll?.y !== undefined ? table?.tHead?.offsetHeight ?? 0 : 0;
      const insets = fixedSummary && scroll?.y !== undefined
        ? { top: topInset, bottom: bottomInset } : { top: head, bottom: 0 };
      alignTableRow(element, item, insets, align ?? 'nearest', inset);
    }
  }

  /** Retains the position on request and adheres to the duration of _util/scrollTo. */
  function resetAfterChange() {
    const custom = options.customElement();
    const shouldReset = scroll?.scrollToFirstRowOnChange ?? (custom === undefined
      ? active : scroll !== undefined);
    if (!shouldReset) {
      return;
    }

    const element = custom === undefined ? options.element() : custom;
    const view = element?.ownerDocument.defaultView;
    const from = element?.scrollTop ?? 0;
    if (!element || !view || !from) {
      return;
    }

    cancelReset();
    if (view.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (active) list.scrollTo(0);
      else element.scrollTop = 0;
      return;
    }

    const started = view.performance.now();
    let frame: number;

    // Updates one position before the completion of the animation or the cancellation of the audit.
    const step = (now: number) => {
      const elapsed = now - started;
      const top = scrollFrame(elapsed, from, 0);
      if (active) list.scrollTo(top);
      else element.scrollTop = top;

      if (top > 0) {
        frame = view.requestAnimationFrame(step);
      }
      else {
        cancelReset();
      }
    };

    const input = ['wheel', 'pointerdown', 'keydown'];
    for (const event of input) {
      element.addEventListener(event, cancelReset, { passive: true });
    }
    frame = view.requestAnimationFrame(step);
    cancelAnimation = () => {
      view.cancelAnimationFrame(frame);
      for (const event of input) {
        element.removeEventListener(event, cancelReset);
      }
    };
  }

  return {
    get active() { return active; },
    get rows() { return renderRows; },
    get start() { return active ? list.range.start : 0; },
    get before() { return active ? list.range.offset ?? 0 : 0; },
    get after() { return after; },
    get layout() { return layout; },
    get tableWidth() { return layout?.width ?? (options.virtual() ? scrollWidth : undefined); },
    get height() { return height; },
    get width() { return width; },
    get contentHeight() { return (list.range.scrollHeight ?? 0) + scrollTail; },
    get left() { return list.left; },
    get top() { return list.top; },
    get flash() { return list.flash; },
    get maxHeight() { return maxHeight; },
    get topInset() { return active || fixedSummary ? topInset : undefined; },
    get bottomInset() { return summary === 'bottom' ? bottomInset : undefined; },
    get captionHeight() {
      return (active || fixedSummary) && options.caption()
        ? captionHeight : undefined;
    },
    getSize: list.getSize,
    attachRow: list.attach,
    attachDetails,
    cancelReset,
    dragScrollbar,
    handleScroll,
    resetAfterChange,
    scrollHorizontal,
    scrollTo,
    /** Moving the strip cancels the current animation. */
    scrollVertical(top: number) { scrollTo({ top }); }
  };
}
