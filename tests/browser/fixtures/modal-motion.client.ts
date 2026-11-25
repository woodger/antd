// Одна fixture для обычного mount и строгой гидратации именованных переходов.
import '@woodger/antd/styles.css';
import { hydrate, mount } from 'svelte';
import ModalMotionFixtures from './ModalMotionFixtures.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing Modal motion target');
}
const params = new URLSearchParams(location.search);
const props = {
  profile: params.get('profile') ?? undefined,
  lifetime: params.has('lifetime'),
  initiallyOpen: params.has('open')
};

if (params.has('hydrate')) {
  target.addEventListener('hydrate-modal-motion', () => {
    hydrate(ModalMotionFixtures, { target, props, recover: false });
    target.dataset.hydrated = 'true';
  }, { once: true });
}
else {
  mount(ModalMotionFixtures, { target, props });
}
target.dataset.ready = 'true';
