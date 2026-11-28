// Tracks the server control through hydration and exercises the same model after hydration.
import '@woodger/antd/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import FormInitialValuesAuto from './FormInitialValuesAuto.svelte';

declare global {
  interface Window {
    formInitialValuesHydration?: { input: Element | null; dispose(): Promise<void> };
  }
}

const target = document.getElementById('root');
if (!target) {
  throw new Error('The hydration host is missing');
}

const input = target.querySelector('#auto-word');
const fixture = hydrate(FormInitialValuesAuto, { target, recover: false });
await tick();
window.formInitialValuesHydration = { input, dispose: () => unmount(fixture) };
