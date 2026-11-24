import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import Fixture from './TableFilterStateFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered Table filter state');
}

// Серверная кнопка получает фокус прежде, чем hydrate подключит обработчики.
target.addEventListener('hydrate-table-filter-state', () => {
  hydrate(Fixture, { target, props: { profileId: 'controlled' }, recover: false });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
