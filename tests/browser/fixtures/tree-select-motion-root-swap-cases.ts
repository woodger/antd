import type { TreeSelectMotionAction, TreeSelectMotionSample } from './tree-select-motion-cases';

export type TreeSelectMotionRootSwapAction = TreeSelectMotionAction
  | { type: 'root-swap'; left: number };

export const treeSelectMotionRootSwapSamples: readonly TreeSelectMotionSample[] = [
  { id: 'active-root-swap-animation', scene: 'active-root-swap', css: 'animation',
    initialOpen: true, slot: 'root-button', transitionName: 'audit-custom' },
  { id: 'active-root-swap-transition', scene: 'active-root-swap', css: 'transition',
    initialOpen: true, slot: 'root-button', transitionName: 'audit-transition' }
];

export function treeSelectMotionRootSwapActions(
  sample: TreeSelectMotionSample
): readonly TreeSelectMotionRootSwapAction[] {
  const event = sample.css === 'transition' ? 'transitionend' : 'animationend';
  return [
    { type: 'frame', count: 6 },
    { type: 'clock', time: 500 },
    { type: 'root-swap', left: 316 },
    { type: 'frame', count: 4 },
    { type: 'clock', time: 500 },
    { type: 'end', target: 'child', event, name: 'any-own-effect' },
    { type: 'end', target: 'popup', event, name: 'any-own-effect' },
    { type: 'frame', count: 4 }
  ];
}
