import {
  treeSelectMotionSamples, type TreeSelectMotionAction, type TreeSelectMotionSample
} from './tree-select-motion-cases';

export interface TreeSelectMotionLeaveSample extends TreeSelectMotionSample {
  fixtureId: string;
}

export const treeSelectMotionLeaveSamples: readonly TreeSelectMotionLeaveSample[] = [
  {
    ...treeSelectMotionSamples.find(sample => sample.id === 'custom-animation')!,
    id: 'leave-active-animation', scene: 'leave-active-end', fixtureId: 'custom-animation'
  },
  {
    ...treeSelectMotionSamples.find(sample => sample.id === 'custom-transition')!,
    id: 'leave-active-transition', scene: 'leave-active-end', fixtureId: 'custom-transition'
  }
];

export function treeSelectMotionLeaveActions(
  sample: TreeSelectMotionSample
): readonly TreeSelectMotionAction[] {
  const event = sample.css === 'transition' ? 'transitionend' : 'animationend';
  return [
    { type: 'click' },
    { type: 'frame', count: 6 },
    { type: 'end', target: 'popup', event, name: 'any-own-effect' },
    { type: 'frame', count: 4 },
    { type: 'open', value: false },
    { type: 'frame', count: 2 },
    { type: 'clock', time: 250 },
    { type: 'end', target: 'popup', event, name: 'any-own-effect' },
    { type: 'frame', count: 1 },
    { type: 'frame', count: 1 },
    { type: 'frame', count: 4 }
  ];
}
