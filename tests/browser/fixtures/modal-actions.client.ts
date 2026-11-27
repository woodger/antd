// Connects some action settings for mount and strict hydration.
import '@woodger/antd/styles.css';
import { hydrate, mount, type ComponentProps } from 'svelte';
import ModalActionFixtures from './ModalActionFixtures.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing Modal actions target');
}
const params = new URLSearchParams(location.search);
const kind = params.get('kind');
const props: ComponentProps<typeof ModalActionFixtures> = {
  kind: kind === 'confirmation' || kind === 'overrides' || kind === 'live' ? kind : 'ordinary',
  profile: params.get('profile') ?? undefined
};

if (params.has('hydrate')) {
  target.addEventListener('hydrate-modal-actions', () => {
    hydrate(ModalActionFixtures, { target, props, recover: false });
    target.dataset.hydrated = 'true';
  }, { once: true });
}
else {
  mount(ModalActionFixtures, { target, props });
}
target.dataset.ready = 'true';
