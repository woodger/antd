import { hydrate, tick, unmount } from 'svelte';
import '@woodger/antd/styles.css';
import FormItemMessagesFixtures from './FormItemMessagesFixtures.svelte';
import FormNoStyleFixtures from './FormNoStyleFixtures.svelte';

declare global {
  interface Window {
    formItemMessagesHydration?: {
      input: Element | null;
      holder: Element | null;
      dispose(): Promise<void>;
    };
  }
}

const target = document.getElementById('root');
if (!target) {
  throw new Error('The hydration host is missing');
}

const nested = Boolean(target.querySelector('#form-no-style-fixture'));
const input = target.querySelector(nested ? 'input[aria-label="first"]' : '.motion-probe-item input');
const holder = target.querySelector(nested ? '.ant-form-item-explain' : '.probe-form-item-explain');
const fixture = nested ? hydrate(FormNoStyleFixtures, {
  target, props: { initialCase: 'error', initialMetadata: true }, recover: false
}) : hydrate(FormItemMessagesFixtures, {
  target, props: { initialProfile: 'extra-and-prefix', initialMessages: true }, recover: false
});

await tick();
window.formItemMessagesHydration = { input, holder, dispose: () => unmount(fixture) };
