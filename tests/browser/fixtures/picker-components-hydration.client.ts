import '@woodger/antd/styles.css';
import { hydrate, unmount } from 'svelte';
import PickerComponentsFixtures, { editorHydrationProfile } from './PickerComponentsFixtures.svelte';

const root = document.getElementById('root');
if (!root) {
  throw Error('Missing custom editor hydration target');
}
const owner = hydrate(PickerComponentsFixtures, {
  target: root, props: { profile: editorHydrationProfile }, recover: false
});
root.dataset.hydrated = 'true';

/** Освобождает обе регистрации и portal после проверки ввода. */
function disposeEditorFixture() {
  return unmount(owner);
}

Object.assign(window, { disposeEditorFixture });
