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

// Opens the test explicit completion of the lifecycle after measuring the tags and the calendar.
Object.assign(window, { disposeMultiplePicker: () => unmount(component) });
