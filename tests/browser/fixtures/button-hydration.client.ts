import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import Fixture from './ButtonHydrationFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered Button');
}

const query = new URLSearchParams(location.search);
const profile = query.get('button') === 'link' ? 'link' : 'button';

// The test sets the focus to the connection of Svelte handlers.
target.addEventListener('hydrate-button', () => {
  hydrate(Fixture, { target, props: { profile }, recover: false });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
