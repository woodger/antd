import { hydrate, tick, unmount } from 'svelte';
import '@woodger/antd/styles.css';
import FormItemMessagesFixtures from './FormItemMessagesFixtures.svelte';
import FormNoStyleFixtures from './FormNoStyleFixtures.svelte';
import FormRichValidationFixtures from './FormRichValidationFixtures.svelte';

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
const rich = Boolean(target.querySelector('#form-rich-validation-fixture'));
const inputSelector = rich ? '.rich-name-item input'
  : nested ? 'input[aria-label="first"]' : '.motion-probe-item input';
const holderSelector = rich ? '.rich-name-item .ant-form-item-explain'
  : nested ? '.ant-form-item-explain' : '.probe-form-item-explain';
const input = target.querySelector(inputSelector);
const holder = target.querySelector(holderSelector);
const fixture = hydrateFixture(target);

await tick();
window.formItemMessagesHydration = { input, holder, dispose: () => unmount(fixture) };

/** Uses the props that seeded the matching server fixture and surfaces any hydration mismatch. */
function hydrateFixture(host: HTMLElement) {
  if (rich) {
    return hydrate(FormRichValidationFixtures, {
      target: host, props: { initialMessages: true }, recover: false
    });
  }
  if (nested) {
    return hydrate(FormNoStyleFixtures, {
      target: host, props: { initialCase: 'error', initialMetadata: true }, recover: false
    });
  }

  return hydrate(FormItemMessagesFixtures, {
    target: host, props: { initialProfile: 'extra-and-prefix', initialMessages: true }, recover: false
  });
}
