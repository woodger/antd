import '@woodger/antd/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import DropdownLifecycleFixtures from './DropdownLifecycleFixtures.svelte';

declare global {
  interface Window {
    dropdownLifecycleHydration?: { reusedTrigger: boolean; dispose: () => Promise<void>; };
  }
}

const target = document.getElementById('root');
if (!target) throw new Error('Missing Dropdown lifecycle hydration root');

const original = target.querySelector('#trigger');
const startOpen = new URLSearchParams(location.search).has('open');
const instance = hydrate(DropdownLifecycleFixtures, {
  target,
  recover: false,
  props: { initial: 'force-destroy', startOpen }
});
await tick();

window.dropdownLifecycleHydration = {
  reusedTrigger: Boolean(original) && original === target.querySelector('#trigger'),
  dispose: () => unmount(instance)
};
