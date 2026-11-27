import { render } from 'svelte/server';
import TreeSelectMotionHydration from './TreeSelectMotionHydration.svelte';
import { treeSelectMotionSamples } from './tree-select-motion-cases';

export function renderTreeSelectMotion(id: string) {
  const sample = treeSelectMotionSamples.find(sample => sample.id === id);
  if (!sample) {
    throw Error(`Unknown TreeSelect motion hydration sample: ${id}`);
  }
  return render(TreeSelectMotionHydration, {
    props: { sample }, idPrefix: 'tree-select-motion-hydration'
  });
}
