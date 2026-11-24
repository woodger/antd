import { render } from 'svelte/server';
import PickerPanelFixtures, { panelHydrationProfile } from './PickerPanelFixtures.svelte';

/** Выводит открытый диапазон с двумя слотами до появления DOM. */
export function renderPanelFixture() {
  return render(PickerPanelFixtures, { props: { profile: panelHydrationProfile, server: true } });
}
