import { render } from 'svelte/server';
import TreeSelectSuffixLayoutHydration from './TreeSelectSuffixLayoutHydration.svelte';
import { treeSelectSuffixLayoutSamples } from './tree-select-suffix-layout-cases';

export function renderTreeSelectSuffixLayout(id: string) {
  const sample = treeSelectSuffixLayoutSamples.find(sample => sample.id === id);
  if (!sample) {
    throw Error(`Unknown suffix hydration sample: ${id}`);
  }
  return render(
    TreeSelectSuffixLayoutHydration,
    { props: { sample }, idPrefix: 'tree-select-suffix-layout-hydration' }
  );
}
