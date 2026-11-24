import '@woodger/antd/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import DropdownMenuFixtures from './DropdownMenuFixtures.svelte';

declare global {
  interface Window {
    dropdownMenuHydration?: { reused: boolean; dispose: () => Promise<void>; };
  }
}

const target = document.getElementById('root');
if (!target) throw new Error('Missing Dropdown hydration fixture');

const selectors = '[data-ant-dropdown-popup], [role="menu"], [role="menuitem"]';
const original = [...target.querySelectorAll(selectors)];
const instance = hydrate(DropdownMenuFixtures, {
  target,
  recover: false,
  props: { initial: 'nested-link', startOpen: true }
});
await tick();

const hydrated = [...target.querySelectorAll(selectors)];
window.dropdownMenuHydration = {
  reused: original.length > 0 && original.length === hydrated.length
    && original.every((node, index) => node === hydrated[index]),
  dispose: () => unmount(instance)
};
