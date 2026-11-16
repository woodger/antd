import { render } from 'svelte/server';
import SelectDataHydration from './SelectDataHydration.svelte';
import { selectDataSamples } from './select-data-cases';

export function renderSelectData(id: string) {
  const sample = selectDataSamples.find(sample => sample.id === id);
  if (!sample) throw Error(`Unknown Select data sample: ${id}`);
  return render(SelectDataHydration, { props: { sample }, idPrefix: 'select-data-hydration' });
}
