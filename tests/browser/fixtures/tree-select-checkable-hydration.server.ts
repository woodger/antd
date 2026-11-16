import { render } from 'svelte/server';
import TreeSelectCheckableHydration from './TreeSelectCheckableHydration.svelte';
import { treeSelectCheckableSamples } from './tree-select-checkable-cases';

export function renderTreeSelectCheckable(id: string) {
  const sample = treeSelectCheckableSamples.find(sample => sample.id === id);
  if (!sample?.searchable) throw Error(`Unknown searchable checkable sample: ${id}`);
  return render(TreeSelectCheckableHydration, { props: { sample }, idPrefix: 'tree-select-checkable-hydration' });
}
