import { render } from 'svelte/server';
import DatePickerProviderFixtures, { hydrationProfile } from './DatePickerProviderFixtures.svelte';

/** Built closed RangePicker without DOM to check subsequent hydration. */
export function renderPickerProviderFixture() {
  return render(DatePickerProviderFixtures, {
    props: { profile: hydrationProfile, openOnMount: false }
  });
}
