// Connects Menu to server nodes and gives the cleanup test of the component.
import '@woodger/antd/styles.css';
import { hydrate, unmount } from 'svelte';
import MenuTooltipFixtures from './MenuTooltipFixtures.svelte';

declare global {
  interface Window {
    menuTooltipHydration?: { dispose: () => Promise<void>; };
  }
}

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing Menu tooltip hydration root');
}

const component = hydrate(MenuTooltipFixtures, {
  target,
  props: { sampleId: 'open-controlled' },
  recover: false
});
window.menuTooltipHydration = { dispose: () => unmount(component) };
