// Renders the model defaults before the client attaches the external field records.
import { render } from 'svelte/server';
import FormControlledFieldsFixtures from './FormControlledFieldsFixtures.svelte';

/** Runs SSR for the component tree used in the browser test. */
export function renderControlledFields() {
  return render(FormControlledFieldsFixtures);
}
