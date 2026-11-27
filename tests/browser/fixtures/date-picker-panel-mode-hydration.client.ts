import '@woodger/antd/styles.css';
import { hydrate, unmount } from 'svelte';
import DatePickerPanelModeFixtures, { panelModeHydrationProfile }
  from './DatePickerPanelModeFixtures.svelte';

const root = document.getElementById('root');
if (!root) {
  throw Error('Missing DatePicker panel mode hydration target');
}
const component = hydrate(DatePickerPanelModeFixtures, {
  target: root, props: { profile: panelModeHydrationProfile }, recover: false
});
root.dataset.hydrated = 'true';

/** Completes lifecycle to check the removal of the open portal. */
function disposePanelModeFixture() {
  return unmount(component);
}

Object.assign(window, { disposePanelModeFixture });
