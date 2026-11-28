// Renders the form with its own model through the built public entry point.
import { render } from 'svelte/server';
import FormInitialValuesAuto from './FormInitialValuesAuto.svelte';

/** Produces the initial store and form controls for browser hydration. */
export function renderFormInitialValues() {
  return render(FormInitialValuesAuto);
}
