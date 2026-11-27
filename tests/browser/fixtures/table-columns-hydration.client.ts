import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import TableColumnsFixture from './TableColumnsFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered table columns');
}

// Postpones the hydration so that the test enters the text and establishes the selection on the server node.
target.addEventListener('hydrate-table-columns', () => {
  hydrate(TableColumnsFixture, {
    target, props: { profileId: 'responsive', editor: true }, recover: false
  });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
