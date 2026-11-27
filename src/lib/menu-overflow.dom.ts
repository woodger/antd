// It only measures the upper row. Invisible items retain the width for measurement, and copies from
// the pop-up list do not affect the result.
import { getMenuVisibleCount } from './menu-overflow.engine';

export interface MenuOverflowLayout {
  visibleCount: number;
  hasWidth: boolean;
}

/** Synchronizes the width of the row and the indicator after the layout without an update from the resize callback. */
export function connectMenuOverflow(
  root: HTMLUListElement,
  onLayout: (layout: MenuOverflowLayout) => void
) {
  const ownerWindow = root.ownerDocument.defaultView;
  if (!ownerWindow) {
    return;
  }

  const view = ownerWindow;
  let frame = 0;
  const watched = new Set<Element>();
  const resize = new view.ResizeObserver(schedule);
  const children = new view.MutationObserver(schedule);
  resize.observe(root);
  children.observe(root, { childList: true });
  schedule();

  return disconnect;

  // Combines changes in the size and rearrangement of items into one reading layout.
  function schedule() {
    if (!frame) {
      frame = view.requestAnimationFrame(measure);
    }
  }

  // Applies the integer clientWidth and offsetWidth as the Overflow.
  function measure() {
    frame = 0;
    const widths: number[] = [];
    const current = new Set<Element>();
    let more = 0;

    for (const child of root.children) {
      if (!(child instanceof view.HTMLElement)) {
        continue;
      }

      if (child.hasAttribute('data-menu-overflow-rest')) {
        more = child.offsetWidth;
      }
      else if (child.hasAttribute('data-menu-overflow-item')) {
        widths.push(child.offsetWidth);
      }
      else {
        continue;
      }

      current.add(child);
      if (!watched.has(child)) {
        watched.add(child);
        resize.observe(child, { box: 'border-box' });
      }
    }
    for (const node of watched) {
      if (!current.has(node)) {
        resize.unobserve(node);
        watched.delete(node);
      }
    }

    const available = root.clientWidth;
    onLayout({
      visibleCount: available ? getMenuVisibleCount(widths, available, more) : 0,
      hasWidth: available > 0
    });
  }

  // Cancels the delayed measurement when the mode is changed or Menu is deleted.
  function disconnect() {
    view.cancelAnimationFrame(frame);
    resize.disconnect();
    children.disconnect();
    watched.clear();
  }
}
