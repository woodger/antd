// Renders the initial FormItem projections through the built package.
import { render } from 'svelte/server';
import FormItemUpdateFixtures from './FormItemUpdateFixtures.svelte';

/** Produces the server tree consumed by the hydration test. */
export function renderFormItemUpdates() {
  return render(FormItemUpdateFixtures);
}
