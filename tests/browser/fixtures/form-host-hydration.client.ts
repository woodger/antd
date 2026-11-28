import { hydrate, tick, unmount } from 'svelte';
import '@woodger/antd/styles.css';
import FormHostFixtures from './FormHostFixtures.svelte';

declare global {
  interface Window {
    formHostHydration?: { input: Element | null; dispose(): Promise<void> };
  }
}

const target = document.getElementById('root');
if (!target) {
  throw new Error('The hydration host is missing');
}

const input = target.querySelector('input[data-editor]');
const fixture = hydrate(FormHostFixtures, {
  target, props: { initialHost: 'custom', initialRender: true }, recover: false
});
await tick();
window.formHostHydration = { input, dispose: () => unmount(fixture) };
