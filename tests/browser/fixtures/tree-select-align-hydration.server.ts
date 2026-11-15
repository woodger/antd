import { render } from 'svelte/server';
import TreeSelectAlignHydration from './TreeSelectAlignHydration.svelte';
import { treeSelectAlignSamples } from './tree-select-align-cases';

export function renderTreeSelectAlign(id: string) {
  const sample = treeSelectAlignSamples.find(sample => sample.id === id);
  if (!sample) throw Error(`Unknown align hydration sample: ${id}`);
  return render(TreeSelectAlignHydration, { props: { sample }, idPrefix: 'tree-select-align-hydration' });
}
