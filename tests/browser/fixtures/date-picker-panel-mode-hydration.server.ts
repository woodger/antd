import { render } from 'svelte/server';
import DatePickerPanelModeFixtures, { panelModeHydrationProfile }
  from './DatePickerPanelModeFixtures.svelte';

/** Forms RangePicker with two different modes without DOM. */
export function renderPanelModeFixture() {
  return render(DatePickerPanelModeFixtures, { props: { profile: panelModeHydrationProfile } });
}
