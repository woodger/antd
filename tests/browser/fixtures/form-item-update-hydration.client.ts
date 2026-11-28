// Preserves the original field node for a strict hydration comparison.
import '@woodger/antd/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import FormItemUpdateFixtures from './FormItemUpdateFixtures.svelte';

declare global {
  interface Window {
    formItemUpdateHydration?: { input: Element | null; dispose(): Promise<void> };
  }
}

const target = document.getElementById('root');
if (!target) {
  throw new Error('The hydration host is missing');
}

const input = target.querySelector('#note');
const fixture = hydrate(FormItemUpdateFixtures, { target, recover: false });
await tick();
window.formItemUpdateHydration = { input, dispose: () => unmount(fixture) };
