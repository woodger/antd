// Stores the geometry and history of coups within a single opening of the substitution. As
// rc-trigger with the named position, applies changes to the settings at a new measurement.
import type { getMenuPopupAlignment } from './menu-popup-align.engine';
import { getTooltipPosition, type TooltipPosition, type TooltipRect } from './tooltip.engine';

/** Returns the position calculation for the current pair trigger and popup. */
export function createMenuPopupPosition(
  anchor: Element,
  getAlignment: () => ReturnType<typeof getMenuPopupAlignment>
) {
  const root = anchor.ownerDocument.documentElement;
  let lastGeometry = '';
  let lastPosition: TooltipPosition | undefined;

  // Changing the position of the popup itself is not considered a new dimension of its size.
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
