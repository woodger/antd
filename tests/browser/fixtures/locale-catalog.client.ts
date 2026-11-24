import '@woodger/antd/styles.css';
import { hydrate, mount } from 'svelte';
import LocaleCatalogFixtures from './LocaleCatalogFixtures.svelte';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing locale fixture root');
}

if (root.dataset.ssr === 'true') {
  hydrate(LocaleCatalogFixtures, { target: root, recover: false });
  root.dataset.hydrated = 'true';
}
else {
  mount(LocaleCatalogFixtures, { target: root });
}
