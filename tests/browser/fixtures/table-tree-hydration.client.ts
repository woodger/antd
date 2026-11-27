import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import TableTreeFixture from './TableTreeFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw Error('Missing server-rendered tree table');
}

target.addEventListener('hydrate-table-tree', () => {
  hydrate(TableTreeFixture, { target, props: { profileId: 'named', editor: true }, recover: false });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
