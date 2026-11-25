import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import Fixture from './DrawerPanelFixtures.svelte';

const target = document.getElementById('root');
if (!target) throw new Error('Missing Drawer panel hydration target');

// Подключает существующую серверную секцию и запрещает fallback к новому DOM.
target.addEventListener('hydrate-drawer-panel', () => {
  hydrate(Fixture, { target, props: { initialProfile: 'forced' }, recover: false });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
