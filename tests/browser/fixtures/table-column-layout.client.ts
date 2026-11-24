import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import DefaultsFixture from './TableColumnDefaultsFixture.svelte';
import Fixture from './TableColumnLayoutFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered column layout');
}

const query = new URLSearchParams(location.search);
const profileId = query.get('profile') ?? 'fixed-rtl';
// Стенд оставляет серверные DOM-узлы доступными до начала строгой гидратации.
target.addEventListener('hydrate-table-column-layout', () => {
  if (query.has('defaults')) {
    hydrate(DefaultsFixture, { target, props: { profileId: 'groups', editor: true }, recover: false });
  }
  else {
    hydrate(Fixture, { target, props: { profileId, editor: true }, recover: false });
  }
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
