import { render } from 'svelte/server';
import PopupWidthHydration from './PopupWidthHydration.svelte';
import { popupWidthSamples } from './popup-width-cases';

export function renderPopupWidth(id: string) {
  const sample = popupWidthSamples.find(sample => sample.id === id);
  if (!sample?.live) throw Error(`Unknown live popup width sample: ${id}`);
  return render(PopupWidthHydration, { props: { sample }, idPrefix: 'popup-width-hydration' });
}
