import { describe, expect, it } from 'vitest';
import { treeSelectAlignProjection, treeSelectBuiltinPlacements } from './tree-select-align.engine';
import { getPopupPosition } from './popup-position.engine';

describe('treeSelectBuiltinPlacements', () => {
  it('uses Ant Select corner offsets, visible clipping and vertical shift without arrow offsets', () => {
    const placements = treeSelectBuiltinPlacements();
    expect(Object.keys(placements)).toEqual(['bottomLeft', 'bottomRight', 'topLeft', 'topRight']);
    expect(placements.topRight).toEqual({ points: ['br', 'tr'], offset: [0, -4],
      overflow: { adjustX: true, adjustY: true, shiftY: true }, htmlRegion: 'visible', dynamicInset: true });
    const position = getPopupPosition({ target: { left: 300, top: 200, width: 220, height: 32 },
      popup: { left: 0, top: 0, width: 300, height: 72 }, mirror: { right: 1200, bottom: 800 },
      visible: { left: 0, top: 0, right: 1200, bottom: 800 }, scaleX: 1, scaleY: 1,
      placements, align: placements.bottomRight });
    expect(position).toMatchObject({ x: 220, y: 236, right: 680, bottom: 492, placement: 'bottomRight' });
  });
});

describe('treeSelectAlignProjection', () => {
  function project(matrix: number[], x: number, y: number) {
    const w = matrix[3] * x + matrix[7] * y + matrix[15];
    return [(matrix[0] * x + matrix[4] * y + matrix[12]) / w,
      (matrix[1] * x + matrix[5] * y + matrix[13]) / w];
  }

  it('preserves browser-quantized translation and ancestor scale', () => {
    const matrix = treeSelectAlignProjection([{ x: 184.23828125, y: 206.73828125 },
      { x: 309.23828125, y: 206.73828125 }, { x: 309.23828125, y: 331.73828125 },
      { x: 184.23828125, y: 331.73828125 }]);
    expect(project(matrix, 180, 72)).toEqual([409.23828125, 296.73828125]);
    expect(project(matrix, 0, 0)).toEqual([184.23828125, 206.73828125]);
  });

  it('maps a rotated CSS plane without treating its bounding box as an axis scale', () => {
    const matrix = treeSelectAlignProjection([{ x: 30, y: 40 }, { x: 110, y: 100 },
      { x: 50, y: 180 }, { x: -30, y: 120 }]);
    expect(project(matrix, 50, 25)).toEqual([55, 90]);
  });

  it('retains the four browser-resolved corners of a perspective plane', () => {
    const points = [{ x: 20, y: 30 }, { x: 140, y: 40 }, { x: 130, y: 150 }, { x: 10, y: 120 }] as const;
    const matrix = treeSelectAlignProjection(points);
    for (const [index, pair] of [[0, [0, 0]], [1, [100, 0]], [2, [100, 100]], [3, [0, 100]]] as const) {
      expect(project(matrix, pair[0], pair[1])[0]).toBeCloseTo(points[index].x, 10);
      expect(project(matrix, pair[0], pair[1])[1]).toBeCloseTo(points[index].y, 10);
    }
  });
});
