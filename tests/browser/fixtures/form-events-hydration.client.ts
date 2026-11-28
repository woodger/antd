// Hydrates the shipped FormProvider fixture and tracks the editor's DOM identity.
import '@woodger/antd/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import FormEventsFixtures from './FormEventsFixtures.svelte';

declare global {
  interface Window {
    formEventsHydration?: {
      input: Element | null;
      dispose(): Promise<void>;
    };
  }
}

const target = document.getElementById('root');
if (!target) {
  throw new Error('The hydration host is missing');
}

const input = target.querySelector('#alpha-plain');
const fixture = hydrate(FormEventsFixtures, { target, recover: false });
await tick();

window.formEventsHydration = { input, dispose: () => unmount(fixture) };
