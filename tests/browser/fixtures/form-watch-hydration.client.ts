// Captures the server editor's identity before hydrating the same form and observer tree.
import '@woodger/antd/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import FormWatchFixtures from './FormWatchFixtures.svelte';

declare global {
  interface Window {
    formWatchHydration?: {
      input: Element | null;
      dispose(): Promise<void>;
    };
  }
}

const target = document.getElementById('root');
if (!target) {
  throw new Error('The hydration host is missing');
}

const input = target.querySelector('#title-A');
const fixture = hydrate(FormWatchFixtures, { target, recover: false });
await tick();

window.formWatchHydration = { input, dispose: () => unmount(fixture) };
