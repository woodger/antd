import { render } from 'svelte/server';
import TreeSelectInertApiHydration from './TreeSelectInertApiHydration.svelte';
import { treeSelectInertApiSamples } from './tree-select-inert-api-cases';

export function renderTreeSelectInertApi() {
  const sample = treeSelectInertApiSamples.find(sample => sample.id === 'inert-live-controls')!;
  return render(TreeSelectInertApiHydration, { props: { sample }, idPrefix: 'tree-select-inert-api-hydration' });
}
