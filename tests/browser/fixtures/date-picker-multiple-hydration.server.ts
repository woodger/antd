import { render } from 'svelte/server';
import DatePickerMultipleFixtures from './DatePickerMultipleFixtures.svelte';

/** Renders the same props that the client uses to measure responsive tags. */
export function renderMultiplePickerFixture() {
  return render(DatePickerMultipleFixtures, {
    props: { profile: { id: 'hydrate', maxTagCount: 'responsive' } }
  });
}
