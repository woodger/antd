import '@woodger/antd/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import AutoCompleteEditorHeightFixtures from './AutoCompleteEditorHeightFixtures.svelte';

declare global {
  interface Window {
    disposeAutoCompleteEditorHeight?: () => Promise<void>;
  }
}

const target = document.getElementById('root');
if (!target) throw new Error('Missing AutoComplete hydration root');

const instance = hydrate(AutoCompleteEditorHeightFixtures, {
  target,
  recover: false,
  props: { initial: 'initial-value' }
});
await tick();
window.disposeAutoCompleteEditorHeight = () => unmount(instance);
