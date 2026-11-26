// Активирует публичный компонент после действий с SSR-узлом.
import '@woodger/antd/styles.css';
import { hydrate, mount } from 'svelte';
import Fixture from './MentionsHydrationFixture.svelte';

const host = document.getElementById('root');
const target = (host?.shadowRoot ?? host)?.querySelector('section');
if (!host || !target) {
  throw new Error('Missing Mentions hydration target');
}

const profile = new URLSearchParams(location.search).get('mentions-hydration') ?? 'default-backward';
host.addEventListener('activate-mentions-hydration', () => {
  const props = { profile };
  if (profile === 'csr') {
    mount(Fixture, { target, props });
  }
  else {
    hydrate(Fixture, { target, props, recover: false });
  }
  host.dataset.hydrated = 'true';
}, { once: true });
host.dataset.hydrationReady = 'true';
