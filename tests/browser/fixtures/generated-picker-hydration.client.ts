// Подключает строгое hydration к серверной форме, собранной из публичного пакета.
import '@woodger/antd/styles.css';
import { hydrate } from 'svelte';
import GeneratedPickerFixtures from './GeneratedPickerFixtures.svelte';

const target = document.getElementById('root');
if (!target) {
  throw Error('Missing generated picker hydration target');
}

hydrate(GeneratedPickerFixtures, { target, props: { profile: 'open-range' }, recover: false });
target.dataset.hydrated = 'true';
