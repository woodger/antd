import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import ModalInteractionFixtures from './ModalInteractionFixtures.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing Modal interaction hydration target');
}

// Hydration uses the available DOM forms and click area.
target.addEventListener('hydrate-modal-interaction', () => {
  hydrate(ModalInteractionFixtures, {
    target,
    props: { initial: 'unmasked-no-lock', initiallyOpen: true },
    recover: false
  });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
