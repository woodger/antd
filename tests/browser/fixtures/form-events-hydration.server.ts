// Renders the built package fixture with the same component tree the browser hydrates.
import { render } from 'svelte/server';
import FormEventsFixtures from './FormEventsFixtures.svelte';

/** Creates fresh model and provider state for the server render. */
export function renderFormEvents() {
  return render(FormEventsFixtures);
}
