import '@woodger/antd/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import DropdownAppearanceFixtures from './DropdownAppearanceFixtures.svelte';

declare global {
  interface Window {
    disposeDropdownAppearance?: () => Promise<void>;
  }
}

const target = document.getElementById('root');
if (!target) throw new Error('Missing Dropdown appearance hydration root');

const startOpen = new URLSearchParams(location.search).has('open');
const instance = hydrate(DropdownAppearanceFixtures, {
  target,
  recover: false,
  props: { initial: 'classes', startOpen }
});
await tick();
window.disposeDropdownAppearance = () => unmount(instance);
