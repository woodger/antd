// Connects semantic fixture in the mode of normal mounting and strict hydration.
import '@woodger/antd/styles.css';
import { hydrate, mount } from 'svelte';
import ModalSemanticFixtures from './ModalSemanticFixtures.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing Modal semantics target');
}

const params = new URLSearchParams(location.search);
const props = { id: params.get('id') ?? 'render' };
if (params.has('hydrate')) {
  target.addEventListener('hydrate-modal-semantics', () => {
    hydrate(ModalSemanticFixtures, { target, props, recover: false });
    target.dataset.hydrated = 'true';
  }, { once: true });
}
else {
  mount(ModalSemanticFixtures, { target, props });
}
target.dataset.ready = 'true';
