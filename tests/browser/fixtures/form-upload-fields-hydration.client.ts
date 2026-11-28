import { hydrate, tick, unmount } from 'svelte';
import '@woodger/antd/styles.css';
import FormUploadFieldsFixtures from './FormUploadFieldsFixtures.svelte';

declare global {
  interface Window {
    formUploadFieldsHydration?: {
      readonly inputs: readonly Element[];
      dispose(): Promise<void>;
    };
  }
}

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing upload hydration host');
}

const inputs = Array.from(target.querySelectorAll('input[type="file"]'));
const fixture = hydrate(FormUploadFieldsFixtures, { target, recover: false });
await tick();
window.formUploadFieldsHydration = { inputs, dispose: () => unmount(fixture) };
