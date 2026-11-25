// Подключает одну фикстуру Modal для обычного mount и строгой гидратации.
import '@woodger/antd/styles.css';
import { hydrate, mount } from 'svelte';
import ModalLifecycleFixtures from './ModalLifecycleFixtures.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing Modal lifecycle target');
}
const params = new URLSearchParams(location.search);
const props = {
  profile: params.get('profile') ?? undefined,
  initiallyOpen: params.has('open'),
  managed: params.has('managed')
};

if (params.has('hydrate')) {
  target.addEventListener('hydrate-modal-lifecycle', () => {
    hydrate(ModalLifecycleFixtures, { target, props, recover: false });
    target.dataset.hydrated = 'true';
  }, { once: true });
}
else {
  mount(ModalLifecycleFixtures, { target, props });
}
target.dataset.ready = 'true';
