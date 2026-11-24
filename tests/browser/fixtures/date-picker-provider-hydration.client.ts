import { hydrate, unmount } from 'svelte';
import DatePickerProviderFixtures, { hydrationProfile } from './DatePickerProviderFixtures.svelte';

const target = document.getElementById('root');
if (!target) {
  throw Error('Missing DatePicker provider hydration target');
}

const component = hydrate(DatePickerProviderFixtures, {
  target, props: { profile: hydrationProfile, openOnMount: false }
});

// Позволяет проверить очистку привязок и popup после гидратации.
Object.assign(window, { disposePickerProvider: () => unmount(component) });
