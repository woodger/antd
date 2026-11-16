import { render } from 'svelte/server';
import PopupOverflowHydration from './PopupOverflowHydration.svelte';
import { popupOverflowSamples } from './popup-overflow-cases';

export function renderPopupOverflow(id: string) {
  const sample = popupOverflowSamples.find(sample => sample.id === id);
  if (!sample?.live) throw Error(`Unknown live popup overflow sample: ${id}`);
  return render(PopupOverflowHydration, { props: { sample }, idPrefix: 'popup-overflow-hydration' });
}
