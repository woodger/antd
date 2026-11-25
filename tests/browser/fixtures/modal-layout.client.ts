// Запускает fixture в viewport Playwright без промежуточного layout wrapper.
import '@woodger/antd/styles.css';
import { hydrate, mount } from 'svelte';
import ModalLayoutFixtures from './ModalLayoutFixtures.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing Modal layout target');
}

const params = new URLSearchParams(location.search);
const props = { profile: params.get('profile') ?? undefined };
if (params.has('hydrate')) {
  target.addEventListener('hydrate-modal-layout', () => {
    hydrate(ModalLayoutFixtures, { target, props, recover: false });
    target.dataset.hydrated = 'true';
  }, { once: true });
}
else {
  mount(ModalLayoutFixtures, { target, props });
}
target.dataset.ready = 'true';
