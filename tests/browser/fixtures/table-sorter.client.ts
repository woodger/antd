import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import Fixture from './TableSorterFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered Table sorter');
}

// Сценарий устанавливает фокус на серверной кнопке до подключения обработчиков.
target.addEventListener('hydrate-table-sorter', () => {
  hydrate(Fixture, { target, props: { profileId: 'controlled' }, recover: false });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
