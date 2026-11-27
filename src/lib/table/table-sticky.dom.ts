// Translate window or container offsets to scrollport coordinates. For a separate body considers a
// strip from the section uniting the body and the cap.
import type { TableSticky } from './table.types';

export const tableStickyBarHeight = 8;

export interface TableStickyBarLayout {
  top: number;
  offset: number;
  range: number;
  size: number;
}

/** Updates the position of the hat, the results and the additional stripe in one frame. */
export function observeTableSticky(
  viewport: HTMLElement,
  table: HTMLTableElement | undefined,
  options: TableSticky,
  summary: 'top' | 'bottom' | 'inline' | undefined,
  setBar: (layout: TableStickyBarLayout | undefined) => void,
  section?: HTMLElement
) {
  const view = viewport.ownerDocument.defaultView;
  if (!view) {
    return;
  }

  const { offsetHeader = 0, offsetSummary = 0, offsetScroll = 0 } = options;
  const container = options.getContainer?.();
  const element = container && 'getBoundingClientRect' in container ? container : undefined;
  let frame = 0;

  /** Counting down the positions from the owner's visible area, including its boundary. */
  const measure = () => {
    const ownerTop = element ? element.getBoundingClientRect().top + element.clientTop : 0;
    const ownerBottom = ownerTop + (element?.clientHeight ?? view.innerHeight);
    const rect = viewport.getBoundingClientRect();
    const visibleBottom = rect.top + viewport.clientHeight;
    if (!section) {
      const headTop = Math.max(0, ownerTop + offsetHeader - rect.top);
      const footBottom = Math.max(0, visibleBottom - ownerBottom + offsetSummary);
      viewport.style.setProperty('--ant-table-sticky-head-top', `${headTop}px`);
      viewport.style.setProperty('--ant-table-sticky-summary-bottom', `${footBottom}px`);
    }

    const headHeight = table?.tHead?.offsetHeight ?? 0;
    const captionHeight = table?.caption?.offsetHeight ?? 0;
    const footHeight = table?.tFoot?.offsetHeight ?? 0;
    const bodyTop = rect.top + headHeight + captionHeight + (summary === 'top' ? footHeight : 0);
    const bodyBottom = visibleBottom - (summary === 'bottom' ? footHeight : 0);
    const barTop = ownerBottom - offsetScroll - tableStickyBarHeight;
    const size = viewport.clientWidth;
    const range = viewport.scrollWidth;
    if (!size || range <= size || bodyTop >= barTop || bodyBottom <= ownerBottom) {
      setBar(undefined);
      return;
    }

    const offset = Math.min(range - size, Math.abs(viewport.scrollLeft));
    const origin = section?.getBoundingClientRect().top ?? rect.top;
    setBar({ top: barTop - origin, offset, range, size });
  };

  /** Combines scroll and resize notifications to the next drawing. */
  const schedule = () => {
    if (frame) {
      return;
    }

    frame = view.requestAnimationFrame(() => {
      frame = 0;
      measure();
    });
  };

  const Observer = view.ResizeObserver;
  const observer = Observer && new Observer(schedule);
  observer?.observe(viewport);
  if (table) observer?.observe(table);
  if (section) observer?.observe(section);
  if (element) observer?.observe(element);
  view.addEventListener('scroll', schedule, { capture: true, passive: true });
  view.addEventListener('resize', schedule);
  element?.addEventListener('scroll', schedule, { passive: true });
  measure();

  // When changing the owner, it no longer affects the displacement of this table.
  return () => {
    view.cancelAnimationFrame(frame);
    observer?.disconnect();
    view.removeEventListener('scroll', schedule, true);
    view.removeEventListener('resize', schedule);
    element?.removeEventListener('scroll', schedule);
    if (!section) {
      viewport.style.removeProperty('--ant-table-sticky-head-top');
      viewport.style.removeProperty('--ant-table-sticky-summary-bottom');
    }
    setBar(undefined);
  };
}
