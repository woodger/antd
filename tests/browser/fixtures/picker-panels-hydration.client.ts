import '@woodger/antd/styles.css';
import { hydrate, unmount } from 'svelte';
import PickerPanelFixtures, { panelHydrationProfile } from './PickerPanelFixtures.svelte';

const root = document.getElementById('root');
if (!root) {
  throw Error('Missing custom calendar hydration target');
}
const picker = hydrate(PickerPanelFixtures, {
  target: root, props: { profile: panelHydrationProfile }, recover: false
});
root.dataset.hydrated = 'true';

/** Снимает владельца, чтобы проверить, что ни одна панель не осталась в portal. */
function disposePanelFixture() {
  return unmount(picker);
}

Object.assign(window, { disposePanelFixture });
