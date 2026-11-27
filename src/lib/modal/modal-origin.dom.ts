// Stores the last click position for the first frame of Modal, including editing from onclick.
import type { ModalMousePosition } from './modal.types';

interface ModalClick {
  point?: ModalMousePosition;
  time: number;
}

const lastClicks = new WeakMap<Document, ModalClick>();

/** One captive listener per document. The shelf life is checked without a timer. */
function trackClicks(document: Document): ModalClick | undefined {
  const previous = lastClicks.get(document);
  if (previous) {
    return previous;
  }

  const view = document.defaultView;
  if (!view) {
    return undefined;
  }
  const click: ModalClick = { time: -Infinity };

  document.addEventListener('click', event => {
    // A synthetic click without coordinates resets the previous point like a keyboard.
    click.point = event instanceof view.MouseEvent ? { x: event.pageX, y: event.pageY } : undefined;
    click.time = view.performance.now();
  }, { capture: true, passive: true });

  lastClicks.set(document, click);
  return click;
}

// The conditionally mounted window should see the click, which caused the installation itself.
if (typeof document !== 'undefined') trackClicks(document);

/** An apparent point has priority. Null and undefined have been using a click in the last 100 ms. */
export function getModalMousePoint(document: Document, position?: ModalMousePosition | null) {
  if (position) {
    return position;
  }

  const click = trackClicks(document);
  const now = document.defaultView?.performance.now();
  return click && now !== undefined && now - click.time < 100 ? click.point : undefined;
}

/** Translating page coordinates into the panel system prior to transform application. */
export function getModalTransformOrigin(panel: HTMLElement, point?: ModalMousePosition) {
  if (!point || (!point.x && !point.y)) {
    return undefined;
  }

  const view = panel.ownerDocument.defaultView;
  const bounds = panel.getBoundingClientRect();
  const x = point.x - bounds.left - (view?.scrollX ?? 0);
  const y = point.y - bounds.top - (view?.scrollY ?? 0);
  return `${x}px ${y}px`;
}
