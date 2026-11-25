import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import DrawerFocusFixtures from './DrawerFocusFixtures.svelte';

const target = document.getElementById('root');
if (!target) throw new Error('Missing server-rendered Drawer');

// Подключает Svelte к уже вставленному серверному dialog.
target.addEventListener('hydrate-drawer-focus', () => {
  hydrate(DrawerFocusFixtures, {
    target,
    props: { initialProfile: 'mask-false-no-auto', initialOpen: true },
    recover: false
  });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
