// Measures cut-off areas in viewport coordinates for popup alignment. rc-trigger 3.10.1 util; MIT,
// vendor/LICENSE.rc-trigger.
import type { PopupArea } from './popup-position.engine';

/** Finds ancestors who limit the visible area or report scrolling. */
export function getPopupScrollers(
  element: Element,
  from: HTMLElement | null = element.parentElement
) {
  // Rule 2: DOM-measurements begin after connecting the popup to the window.
  const view = element.ownerDocument.defaultView!;
  const nodes: HTMLElement[] = [];
  let parent = from;

  while (parent) {
    const style = view.getComputedStyle(parent);
    if ([style.overflow, style.overflowX, style.overflowY].some(value =>
      ['hidden', 'scroll', 'clip', 'auto'].includes(value))) {
      nodes.push(parent);
    }
    parent = parent.parentElement;
  }

  return nodes;
}

/** Reads the numerical size of CSSOM and frames 0 for auto. */
function pixels(value: string) {
  return Number.parseFloat(value) || 0;
}

/** Preserves the accuracy of scale rc-trigger in the measurement of transformed ancestors. */
function viewportScale(physical: number, css: number) {
  const value = Math.round(physical / css * 1000) / 1000;
  return Number.isNaN(value) ? 1 : value;
}

/** Crosses the area with the internal boundaries of scroll containers. */
export function clipPopupArea(initial: PopupArea, scrollers: readonly HTMLElement[]) {
  const area = { ...initial };
  for (const node of scrollers) {
    const document = node.ownerDocument;
    // Rule 2: Containers are assembled from the same connected DOM.
    const view = document.defaultView!;
    if (node === document.body || node === document.documentElement) continue;

    const style = view.getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    const left = pixels(style.borderLeftWidth);
    const right = pixels(style.borderRightWidth);
    const top = pixels(style.borderTopWidth);
    const bottom = pixels(style.borderBottomWidth);
    const scaleX = viewportScale(rect.width, node.offsetWidth);
    const scaleY = viewportScale(rect.height, node.offsetHeight);
    const marginX = style.overflow === 'clip' ? pixels(style.overflowClipMargin) * scaleX : 0;
    const marginY = style.overflow === 'clip' ? pixels(style.overflowClipMargin) * scaleY : 0;

    const clipLeft = rect.x + left * scaleX - marginX;
    const clipTop = rect.y + top * scaleY - marginY;
    const clipRight = clipLeft + rect.width + 2 * marginX - (left + right) * scaleX
      - (node.offsetWidth - node.clientWidth - left - right) * scaleX;
    const clipBottom = clipTop + rect.height + 2 * marginY - (top + bottom) * scaleY
      - (node.offsetHeight - node.clientHeight - top - bottom) * scaleY;

    area.left = Math.max(area.left, clipLeft);
    area.top = Math.max(area.top, clipTop);
    area.right = Math.min(area.right, clipRight);
    area.bottom = Math.min(area.bottom, clipBottom);
  }

  return area;
}
