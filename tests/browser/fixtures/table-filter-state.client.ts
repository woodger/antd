import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import Fixture from './TableFilterStateFixture.svelte';
import DropdownFixture from './TableFilterDropdownFixture.svelte';
import OptionsFixture from './TableFilterOptionsFixture.svelte';
import ContentFixture from './TableFilterContentFixture.svelte';
import StaticContentFixture from './TableFilterStaticContentFixture.svelte';
import PopupContainerFixture from './TablePopupContainerFixture.svelte';

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
  else if (query.has('filter-content')) {
    hydrate(ContentFixture, { target, props: { profileId: 'single-menu' }, recover: false });
  }
  else if (query.has('filter-static-content')) {
    hydrate(StaticContentFixture, { target, props: { profileId: 'live' }, recover: false });
  }
  else if (query.has('popup-container')) {
    hydrate(PopupContainerFixture, { target, props: { profileId: 'table' }, recover: false });
  }
  else {
    hydrate(Fixture, { target, props: { profileId: 'controlled' }, recover: false });
  }
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
