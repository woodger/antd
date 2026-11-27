import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import TableSelectionFixture from './TableSelectionFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered Table selection fixture');
}

// Server input remains available before the hydration check command.
target.addEventListener('hydrate-table-selection', () => {
  const profileId = new URLSearchParams(location.search).get('profile') ?? 'controlled';
  hydrate(TableSelectionFixture, { target, props: { profileId }, recover: false });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
