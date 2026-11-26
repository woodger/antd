import { hydrate, mount } from 'svelte';
import Fixture from './ConfigProviderCspFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing ConfigProvider CSP fixture root');
}
const params = new URLSearchParams(location.search);
const mode = params.get('profile');
const profile = mode === 'strict' || mode === 'shadow' ? mode : 'nested';
if (params.has('ssr')) {
  target.addEventListener('hydrate-csp', () => {
    hydrate(Fixture, { target, props: { profile }, recover: false });
    target.dataset.hydrated = 'true';
  }, { once: true });
  target.dataset.ready = 'true';
}
else {
  mount(Fixture, { target, props: { profile } });
}
