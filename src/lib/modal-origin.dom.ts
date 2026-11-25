// Хранит последнее положение клика для первого кадра Modal, включая монтаж из onclick.
import type { ModalMousePosition } from './modal.types';

interface ModalClick {
  point?: ModalMousePosition;
  time: number;
}

const lastClicks = new WeakMap<Document, ModalClick>();

/** Один capture listener на документ. Срок годности проверяется без таймера. */
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
    // Синтетический клик без координат сбрасывает предыдущую точку, как клавиатурный.
    click.point = event instanceof view.MouseEvent ? { x: event.pageX, y: event.pageY } : undefined;
    click.time = view.performance.now();
  }, { capture: true, passive: true });

  lastClicks.set(document, click);
  return click;
}

// Условно монтируемое окно должно увидеть клик, который вызвал сам монтаж.
if (typeof document !== 'undefined') trackClicks(document);

/** Явная точка имеет приоритет. Null и undefined используют клик за последние 100 мс. */
export function getModalMousePoint(document: Document, position?: ModalMousePosition | null) {
  if (position) {
    return position;
  }

  const click = trackClicks(document);
  const now = document.defaultView?.performance.now();
  return click && now !== undefined && now - click.time < 100 ? click.point : undefined;
}

/** Переводит координаты страницы в систему панели до применения transform. */
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
