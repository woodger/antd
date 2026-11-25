import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import DrawerDomFixtures from './DrawerDomFixtures.svelte';

const target = document.getElementById('root');
if (!target) throw new Error('Missing Drawer DOM hydration target');

// Подключает locale, callbacks секции и портал к серверному DOM.
target.addEventListener('hydrate-drawer-dom', () => {
  hydrate(DrawerDomFixtures, {
    target,
    props: { initialProfile: 'attrs', initialOpen: true },
    recover: false
  });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
