// Determines whether Affix has reached a container edge. Dimensions come from the placeholder,
// which stays in document flow.
import type { AffixPosition } from './affix.types';

// Compares rounded coordinates. The top edge is the default and takes precedence when both offsets
// are set.
export function affixPosition(
  placeholder: Pick<DOMRect, 'top' | 'bottom' | 'width' | 'height'>,
  target: Pick<DOMRect, 'top' | 'bottom'>,
  viewportHeight: number,
  offsetTop?: number,
  offsetBottom?: number
): AffixPosition | undefined {
  const top = offsetTop === undefined && offsetBottom === undefined ? 0 : offsetTop;
  if (top !== undefined && Math.round(target.top) > Math.round(placeholder.top) - top) {
    return {
      edge: 'top',
      offset: top + target.top,
      width: placeholder.width,
      height: placeholder.height
    };
  }
  if (offsetBottom !== undefined
    && Math.round(target.bottom) < Math.round(placeholder.bottom) + offsetBottom) {
    return {
      edge: 'bottom',
      offset: offsetBottom + (viewportHeight - target.bottom),
      width: placeholder.width,
      height: placeholder.height
    };
  }
  return undefined;
}
