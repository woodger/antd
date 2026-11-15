export interface TreeSelectAlignFrameSample {
  id: 'host-rotate-invariant' | 'root-replacement-flip';
  container: 'host' | 'body';
  top: number;
  slot?: 'button';
}

export type TreeSelectAlignFrameAction =
  | { type: 'transform'; value: 'rotate(180deg)' | 'none' }
  | { type: 'replace-root'; kind: 'B'; top: number };

export const treeSelectAlignFrameSamples: readonly TreeSelectAlignFrameSample[] = [
  { id: 'host-rotate-invariant', container: 'host', top: 200 },
  { id: 'root-replacement-flip', container: 'body', top: 740, slot: 'button' }
];

export function treeSelectAlignFrameActions(
  sample: TreeSelectAlignFrameSample
): readonly TreeSelectAlignFrameAction[] {
  if (sample.id === 'host-rotate-invariant') return [
    { type: 'transform', value: 'rotate(180deg)' },
    { type: 'transform', value: 'none' }
  ];
  return [{ type: 'replace-root', kind: 'B', top: 200 }];
}
