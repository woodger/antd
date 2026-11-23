// Хранит геометрию и историю переворотов в пределах одного открытия подменю.
// Как rc-trigger с именованной позицией, применяет изменения настроек при новом замере.
import type { getMenuPopupAlignment } from './menu-popup-align.engine';
import { getTooltipPosition, type TooltipPosition, type TooltipRect } from './tooltip.engine';

/** Возвращает расчёт позиции для текущей пары trigger и popup. */
export function createMenuPopupPosition(
  anchor: Element,
  getAlignment: () => ReturnType<typeof getMenuPopupAlignment>
) {
  const root = anchor.ownerDocument.documentElement;
  let lastGeometry = '';
  let lastPosition: TooltipPosition | undefined;

  // Изменение позиции самого popup не считается новым измерением его размера.
  return (target: DOMRect, popup: DOMRect, viewport: TooltipRect) => {
    const alignment = getAlignment();
    if (!alignment) {
      lastPosition = undefined;
      return undefined;
    }

    const scrollRegion = {
      x: -root.scrollLeft,
      y: -root.scrollTop,
      width: Math.max(root.scrollWidth, popup.width),
      height: Math.max(root.scrollHeight, popup.height)
    };
    const geometry = [
      target.x, target.y, target.width, target.height,
      popup.width, popup.height,
      viewport.x, viewport.y, viewport.width, viewport.height,
      scrollRegion.x, scrollRegion.y, scrollRegion.width, scrollRegion.height
    ].join(':');
    if (lastPosition && geometry === lastGeometry) {
      return lastPosition;
    }

    const position = getTooltipPosition(
      target,
      popup,
      viewport,
      alignment.placement,
      true,
      undefined,
      0,
      {
        builtinPlacements: alignment.placements,
        align: alignment.align,
        flips: lastPosition?.flips,
        scrollRegion
      }
    );
    lastGeometry = geometry;
    lastPosition = position;

    return position;
  };
}
