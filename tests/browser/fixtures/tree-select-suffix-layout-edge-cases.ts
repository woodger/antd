export interface TreeSelectSuffixLayoutEdgeSample {
  id: string;
  width: number;
  initialCount: number;
  direction: 'ltr' | 'rtl';
  willChange?: true;
}

export type TreeSelectSuffixLayoutEdgeAction =
  | { type: 'count'; count: number }
  | { type: 'click-editor' }
  | { type: 'fill'; text: string }
  | { type: 'move-host'; top: number; left: number };

export const treeSelectSuffixLayoutEdgeViewport = { width: 1200, height: 1000 };
export const treeSelectSuffixLayoutEdgeSamples: readonly TreeSelectSuffixLayoutEdgeSample[] = [
  { id: 'static-narrow-initial-one', width: 9, initialCount: 1, direction: 'ltr' },
  { id: 'static-narrow-history-two', width: 9, initialCount: 2, direction: 'ltr' },
  { id: 'static-fit-growth', width: 200, initialCount: 2, direction: 'ltr' },
  {
    id: 'containing-will-change-ltr',
    width: 200,
    initialCount: 4,
    direction: 'ltr',
    willChange: true
  },
  {
    id: 'containing-will-change-rtl',
    width: 200,
    initialCount: 4,
    direction: 'rtl',
    willChange: true
  }
];

export function treeSelectSuffixLayoutEdgeActions(sample: TreeSelectSuffixLayoutEdgeSample): readonly TreeSelectSuffixLayoutEdgeAction[] {
  if (sample.willChange) {
    return [
      { type: 'click-editor' }, { type: 'fill', text: 'BetaWWW12345' },
      { type: 'move-host', top: 20, left: 16 }, { type: 'move-host', top: 35, left: 27 }
    ];
  }
  const counts = sample.id === 'static-narrow-initial-one' ? [2, 3, 1, 2]
    : sample.id === 'static-narrow-history-two' ? [1, 2, 3, 1, 2] : [3, 4, 2, 3];
  return counts.map(count => ({ type: 'count', count }));
}
