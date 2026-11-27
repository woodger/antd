import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import Fixture from './TableExpansionOptionsFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered expansion options');
}

const profileId = new URLSearchParams(location.search).get('profile') ?? 'forced';
// The test preserves links to server nodes and translates the focus before hydration.
target.addEventListener('hydrate-table-expansion-options', () => {
  hydrate(Fixture, { target, props: { profileId }, recover: false });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
