// Retains the server editor so the test can detect DOM replacement during hydration.
import '@woodger/antd/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import FormControlledFieldsFixtures from './FormControlledFieldsFixtures.svelte';

declare global {
  interface Window {
    controlledFieldsHydration?: { input: Element | null; dispose(): Promise<void> };
  }
}

const target = document.getElementById('root');
if (!target) {
  throw new Error('The hydration host is missing');
}

const input = target.querySelector('#controlled-title');
const fixture = hydrate(FormControlledFieldsFixtures, { target, recover: false });
await tick();

window.controlledFieldsHydration = { input, dispose: () => unmount(fixture) };
