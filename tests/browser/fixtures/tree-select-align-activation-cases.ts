import type { TreeSelectAlignAction, TreeSelectAlignSample } from './tree-select-align-cases';

export const treeSelectAlignActivationSamples: readonly TreeSelectAlignSample[] = [
  { id: 'first-popup-align', scene: 'initially-omitted-first-prop' },
  { id: 'first-builtin-map', scene: 'initially-omitted-first-prop' },
  {
    id: 'provided-missing-entry', scene: 'provided-map-cache',
    builtinPlacements: { bottomLeft: { points: ['tl', 'bl'], offset: [7, 11] } }
  }
];

export function treeSelectAlignActivationActions(sample: TreeSelectAlignSample): readonly TreeSelectAlignAction[] {
  const open: TreeSelectAlignAction = { type: 'click' };
  const resize: TreeSelectAlignAction = { type: 'viewport', width: 1240, height: 820 };
  const outside: TreeSelectAlignAction = { type: 'outside' };
  if (sample.id === 'first-popup-align') return [open,
    { type: 'props', set: { popupAlign: { offset: [19, 23] } } }, resize, outside];
  if (sample.id === 'first-builtin-map') return [open,
    { type: 'props', set: { builtinPlacements: { bottomLeft: { points: ['tl', 'bl'], offset: [11, 17] } } } },
    resize, outside];
  if (sample.id === 'provided-missing-entry') return [open,
    { type: 'props', set: { builtinPlacements: { bottomLeft: { points: ['tl', 'bl'], offset: [11, 17] } } } },
    { type: 'props', set: { builtinPlacements: {} } },
    { type: 'props', set: { popupAlign: { points: ['tl', 'bl'], offset: [19, 23] } } },
    { type: 'props', set: {
      builtinPlacements: { bottomLeft: { points: ['tr', 'br'], offset: [11, 17] } }, popupAlign: {}
    } }, resize, outside];
  throw new Error(`Unknown TreeSelect alignment activation sample: ${sample.id}`);
}
