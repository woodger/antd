import '@woodger/antd/styles.css';
import { hydrate, mount } from 'svelte';
import Fixture from './AppCustomRootFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing App root fixture');
}

const query = new URLSearchParams(location.search);
if (query.has('ssr')) {
  // Сначала тест фокусирует серверный input и вводит черновик.
  target.addEventListener('hydrate-app', () => {
    hydrate(Fixture, { target, recover: false });
    target.dataset.hydrated = 'true';
  }, { once: true });
  target.dataset.hydrationReady = 'true';
}
else {
  mount(Fixture, { target });
}
