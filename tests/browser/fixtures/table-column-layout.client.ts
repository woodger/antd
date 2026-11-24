import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import Fixture from './TableColumnLayoutFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered column layout');
}

const profileId = new URLSearchParams(location.search).get('profile') ?? 'fixed-rtl';
// Стенд оставляет серверные DOM-узлы доступными до начала строгой гидратации.
target.addEventListener('hydrate-table-column-layout', () => {
  hydrate(Fixture, { target, props: { profileId, editor: true }, recover: false });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
