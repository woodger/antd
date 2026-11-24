// Измеряет области отсечения в координатах viewport для выравнивания popup.
// rc-trigger 3.10.1 util; MIT, vendor/LICENSE.rc-trigger.
import type { PopupArea } from './popup-position.engine';

/** Находит предков, которые ограничивают видимую область или сообщают о прокрутке. */
export function getPopupScrollers(
  element: Element,
  from: HTMLElement | null = element.parentElement
) {
  // Правило 2: DOM-измерения начинаются после подключения popup к окну.
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

/** Читает числовой размер из CSSOM и подставляет 0 для auto. */
function pixels(value: string) {
  return Number.parseFloat(value) || 0;
}

/** Сохраняет точность масштаба rc-trigger при измерении трансформированных предков. */
function viewportScale(physical: number, css: number) {
  const value = Math.round(physical / css * 1000) / 1000;
  return Number.isNaN(value) ? 1 : value;
}

/** Пересекает область с внутренними границами scroll-контейнеров. */
export function clipPopupArea(initial: PopupArea, scrollers: readonly HTMLElement[]) {
  const area = { ...initial };
  for (const node of scrollers) {
    const document = node.ownerDocument;
    // Правило 2: контейнеры собраны из того же подключённого DOM.
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
