import { hydrate, unmount } from 'svelte';
import DatePickerProviderFixtures, { hydrationProfile } from './DatePickerProviderFixtures.svelte';

const target = document.getElementById('root');
if (!target) {
  throw Error('Missing DatePicker provider hydration target');
}

const component = hydrate(DatePickerProviderFixtures, {
  target, props: { profile: hydrationProfile, openOnMount: false }
});

// Allows you to check the clearing of bindings and popup after hydration.
Object.assign(window, { disposePickerProvider: () => unmount(component) });
