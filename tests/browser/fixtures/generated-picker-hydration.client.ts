// Connects strict hydration to the server form assembled from the public package.
import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import GeneratedPickerFixtures from './GeneratedPickerFixtures.svelte';

const target = document.getElementById('root');
if (!target) {
  throw Error('Missing generated picker hydration target');
}

const query = new URLSearchParams(location.search);
const profile = query.has('time-selection') ? 'open-time-selection'
  : query.has('clock') ? 'open-clock' : 'open-range';
hydrate(GeneratedPickerFixtures, { target, props: { profile }, recover: false });
target.dataset.hydrated = 'true';
