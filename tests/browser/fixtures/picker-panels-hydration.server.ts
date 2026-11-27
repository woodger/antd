import { render } from 'svelte/server';
import PickerPanelFixtures, { panelHydrationProfile } from './PickerPanelFixtures.svelte';

/** Removes an open range with two slots before the appearance of DOM. */
export function renderPanelFixture() {
  return render(PickerPanelFixtures, { props: { profile: panelHydrationProfile, server: true } });
}
