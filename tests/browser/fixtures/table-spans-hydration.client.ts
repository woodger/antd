import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import TableSpansFixture from './TableSpansFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered Table spans');
}

// Hydration starts with an already focused server editor.
target.addEventListener('hydrate-table-spans', () => {
  const query = new URLSearchParams(location.search);
  const profileId = query.get('profile') ?? 'normal';
  hydrate(TableSpansFixture, { target, props: { profileId, editor: true }, recover: false });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
