import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import DrawerMotionFixtures from './DrawerMotionFixtures.svelte';

const target = document.getElementById('root');
if (!target) throw new Error('Missing Drawer motion hydration target');

// Подключает browser phases к исходному SSR DOM без замены секции.
target.addEventListener('hydrate-drawer-motion', () => {
  hydrate(DrawerMotionFixtures, { target, props: { initialOpen: true }, recover: false });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
