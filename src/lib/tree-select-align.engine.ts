import type { PopupSourceAlign } from './popup-position.engine';
import type { PopupOverflow } from './types';

/** Ant Design 6.6.8 Select/TreeSelect/Cascader defaults; MIT, vendor/LICENSE.ant-design. */
export function treeSelectBuiltinPlacements(
  popupOverflow?: PopupOverflow
): Readonly<Record<string, PopupSourceAlign>> {
  const shared = {
    overflow: { adjustX: true, adjustY: true, shiftY: true },
    htmlRegion: popupOverflow === 'scroll' ? 'scroll' as const : 'visible' as const,
    dynamicInset: true
  };
  return {
    bottomLeft: { ...shared, points: ['tl', 'bl'], offset: [0, 4] },
    bottomRight: { ...shared, points: ['tr', 'br'], offset: [0, 4] },
    topLeft: { ...shared, points: ['bl', 'tl'], offset: [0, -4] },
    topRight: { ...shared, points: ['br', 'tr'], offset: [0, -4] }
  };
}

export interface TreeSelectAlignPoint { x: number; y: number; }

/** Project a CSS border-box plane into the Native top layer without changing its DOM parent. */
export function treeSelectAlignProjection(
  points: readonly [TreeSelectAlignPoint, TreeSelectAlignPoint, TreeSelectAlignPoint, TreeSelectAlignPoint],
  unit = 100
) {
  const [a, b, c, d] = points;
  const dx1 = b.x - c.x;
  const dx2 = d.x - c.x;
  const dx3 = a.x - b.x + c.x - d.x;
  const dy1 = b.y - c.y;
  const dy2 = d.y - c.y;
  const dy3 = a.y - b.y + c.y - d.y;
  const denominator = dx1 * dy2 - dx2 * dy1;
  const g = denominator ? (dx3 * dy2 - dx2 * dy3) / denominator : 0;
  const h = denominator ? (dx1 * dy3 - dx3 * dy1) / denominator : 0;
  const x = [(b.x - a.x + g * b.x) / unit, (d.x - a.x + h * d.x) / unit, a.x];
  const y = [(b.y - a.y + g * b.y) / unit, (d.y - a.y + h * d.y) / unit, a.y];
  // CSS matrix3d is column-major. z is unchanged; the last row supplies perspective.
  return [x[0], y[0], 0, g / unit, x[1], y[1], 0, h / unit,
    0, 0, 1, 0, x[2], y[2], 0, 1];
}
