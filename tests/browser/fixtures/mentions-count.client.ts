// Connects a public package; strict hydration starts at the script signal.
import '@woodger/antd/styles.css';
import { hydrate, mount } from 'svelte';
import Fixture from './MentionsCountFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing Mentions count root');
}

const query = new URLSearchParams(location.search);
const profile = query.get('mentions-count') ?? 'soft';
if (query.has('ssr')) {
  target.addEventListener('hydrate-mentions-count', () => {
    hydrate(Fixture, { target, props: { profile }, recover: false });
    target.dataset.hydrated = 'true';
  }, { once: true });
  target.dataset.hydrationReady = 'true';
}
else {
  mount(Fixture, { target, props: { profile } });
}
