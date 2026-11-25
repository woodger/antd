import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import Fixture from './TableFilterStateFixture.svelte';
import DropdownFixture from './TableFilterDropdownFixture.svelte';
import OptionsFixture from './TableFilterOptionsFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered Table filter state');
}

// Серверная кнопка получает фокус прежде, чем hydrate подключит обработчики.
target.addEventListener('hydrate-table-filter-state', () => {
  const query = new URLSearchParams(location.search);
  if (query.has('filter-dropdown')) {
    hydrate(DropdownFixture, { target, props: { profileId: 'custom' }, recover: false });
  }
  else if (query.has('filter-options')) {
    hydrate(OptionsFixture, { target, props: { profileId: 'tree-cascade' }, recover: false });
  }
  else {
    hydrate(Fixture, { target, props: { profileId: 'controlled' }, recover: false });
  }
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
