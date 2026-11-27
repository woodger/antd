import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import Fixture from './InputZIndexContextFixture.svelte';

const target = document.getElementById('root');
if (!target) {
  throw new Error('Missing server-rendered input context');
}

target.addEventListener('hydrate-input-layers', () => {
  hydrate(Fixture, { target, props: { profileId: 'keyboard' }, recover: false });
  target.dataset.hydrated = 'true';
}, { once: true });
target.dataset.hydrationReady = 'true';
