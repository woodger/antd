import { render } from 'svelte/server';
import FormHostFixtures from './FormHostFixtures.svelte';

/** Produces the HTML that the client fixture must hydrate without replacing its host. */
export function renderFormHost() {
  return render(FormHostFixtures, { props: { initialHost: 'custom', initialRender: true } });
}
