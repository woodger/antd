import '@woodger/antd/styles.css';
import { hydrate, unmount } from 'svelte';
import DatePickerMultipleFixtures from './DatePickerMultipleFixtures.svelte';

const root = document.getElementById('root');
if (!root) {
  throw Error('Missing DatePicker multiple hydration target');
}

const component = hydrate(DatePickerMultipleFixtures, {
  target: root, props: { profile: { id: 'hydrate', maxTagCount: 'responsive' } }, recover: false
});

// Открывает тесту явное завершение lifecycle после измерения тегов и календаря.
Object.assign(window, { disposeMultiplePicker: () => unmount(component) });
