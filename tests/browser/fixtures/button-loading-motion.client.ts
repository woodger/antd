import '@woodger/antd/styles.css';
import { hydrate, mount } from 'svelte';
import Fixture from './ButtonLoadingMotionFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing Button loading fixture');
}

const query = new URLSearchParams(location.search);
const profile = query.get('loading-motion') ?? 'default';
if (query.has('ssr')) {
  // Connects handlers after the test removes the server icon.
  target.addEventListener('hydrate-loading-button', () => {
    hydrate(Fixture, { target, props: { profile }, recover: false });
    target.dataset.hydrated = 'true';
  }, { once: true });
  target.dataset.hydrationReady = 'true';
}
else {
  mount(Fixture, { target, props: { profile } });
}
