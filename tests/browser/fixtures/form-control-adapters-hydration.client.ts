// Captures the server editor before hydrating the FormItem control snippet.
import '@woodger/antd/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import FormControlAdaptersFixtures from './FormControlAdaptersFixtures.svelte';

declare global {
  interface Window {
    formAdapterHydration?: { input: Element | null; dispose(): Promise<void> };
  }
}

const target = document.getElementById('root');
if (!target) {
  throw new Error('The hydration host is missing');
}

const input = target.querySelector('#adapter-code');
const fixture = hydrate(FormControlAdaptersFixtures, { target, recover: false });
await tick();
window.formAdapterHydration = { input, dispose: () => unmount(fixture) };
