import { render } from 'svelte/server';
import DatePickerPanelModeFixtures, { panelModeHydrationProfile }
  from './DatePickerPanelModeFixtures.svelte';

/** Формирует RangePicker с двумя разными режимами без DOM. */
export function renderPanelModeFixture() {
  return render(DatePickerPanelModeFixtures, { props: { profile: panelModeHydrationProfile } });
}
