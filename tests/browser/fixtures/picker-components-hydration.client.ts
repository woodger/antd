import '@woodger/antd/styles.css';
import { hydrate, unmount } from 'svelte';
import PickerComponentsFixtures, { editorHydrationProfile } from './PickerComponentsFixtures.svelte';

const root = document.getElementById('root');
if (!root) {
  throw Error('Missing custom editor hydration target');
}
const nativeSlot = new URLSearchParams(location.search).has('native-slot');
const profile = { ...editorHydrationProfile, nativeSlot };
const owner = hydrate(PickerComponentsFixtures, {
  target: root, props: { profile }, recover: false
});
root.dataset.hydrated = 'true';

/** Liberates both registrations and the portal after checking the entry. */
function disposeEditorFixture() {
  return unmount(owner);
}

Object.assign(window, { disposeEditorFixture });
