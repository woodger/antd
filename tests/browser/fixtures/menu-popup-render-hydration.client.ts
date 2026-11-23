import '@woodger/antd/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import MenuPopupRenderFixtures from './MenuPopupRenderFixtures.svelte';

declare global {
  interface Window {
    menuPopupRenderHydration?: {
      reused: boolean;
      dispose: () => Promise<void>;
    };
  }
}

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing Menu popup render hydration root');
}
const selectors = '[role="menu"], [role="menuitem"], [data-menu-render-owner], input';
const original = [...target.querySelectorAll(selectors)];
const instance = hydrate(MenuPopupRenderFixtures, {
  target,
  recover: false,
  props: { kind: 'replace-origin', initiallyOpen: true }
});
await tick();

const hydrated = [...target.querySelectorAll(selectors)];
window.menuPopupRenderHydration = {
  reused: original.length > 0 && original.length === hydrated.length
    && original.every((node, index) => node === hydrated[index]),
  dispose: () => unmount(instance)
};
