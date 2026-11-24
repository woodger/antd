import { render } from 'svelte/server';
import DatePickerProviderFixtures, { hydrationProfile } from './DatePickerProviderFixtures.svelte';

/** Строит закрытый RangePicker без DOM для проверки последующей гидратации. */
export function renderPickerProviderFixture() {
  return render(DatePickerProviderFixtures, {
    props: { profile: hydrationProfile, openOnMount: false }
  });
}
