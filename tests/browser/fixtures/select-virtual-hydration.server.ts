import { render } from 'svelte/server';
import SelectVirtualHydration from './SelectVirtualHydration.svelte';
import { selectVirtualSamples } from './select-virtual-cases';

export function renderSelectVirtual(id: string) {
  const sample = selectVirtualSamples.find(sample => sample.id === id);
  if (!sample) {
    throw Error(`Unknown Select virtual sample: ${id}`);
  }
  return render(SelectVirtualHydration, { props: { sample }, idPrefix: 'select-virtual-hydration' });
}
