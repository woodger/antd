import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import Fixture from './TableSorterFixture.svelte';
import TooltipFixture from './TableSorterTooltipFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered Table sorter');
}

// Сценарий устанавливает фокус на серверной кнопке до подключения обработчиков.
target.addEventListener('hydrate-table-sorter', () => {
  if (new URLSearchParams(location.search).has('sorter-tooltip')) {
    hydrate(TooltipFixture, { target, props: { profileId: 'controlled' }, recover: false });
  }
  else {
    hydrate(Fixture, { target, props: { profileId: 'controlled' }, recover: false });
  }
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
