import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import Fixture from './ZIndexContextFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered z-index context');
}

// Server trigger preserves focus until Modal and Dropdown events are connected.
target.addEventListener('hydrate-z-index-context', () => {
  hydrate(Fixture, { target, props: { profileId: 'keyboard' }, recover: false });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
