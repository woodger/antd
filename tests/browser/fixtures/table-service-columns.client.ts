import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import Fixture from './TableServiceColumnsFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered service columns');
}

const profileId = new URLSearchParams(window.location.search).get('profile') ?? 'placed';
// Triggers strict hydration after focusing the server input.
target.addEventListener('hydrate-table-service-columns', () => {
  hydrate(Fixture, { target, props: { profileId }, recover: false });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
