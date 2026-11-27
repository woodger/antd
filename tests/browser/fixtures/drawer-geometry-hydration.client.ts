import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import Fixture from './DrawerGeometryFixtures.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered Drawer');
}

target.addEventListener('hydrate-drawer-geometry', () => {
  hydrate(Fixture, { target, props: { initialProfile: 'resize-reset-on-destroy' }, recover: false });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
