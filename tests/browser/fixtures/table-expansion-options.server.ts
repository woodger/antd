import { render } from 'svelte/server';
import Fixture from './TableExpansionOptionsFixture.svelte';

/** Prepares server buttons and hidden details for strict hydration. */
export function renderExpansionOptions(profileId: string) {
  return render(Fixture, { props: { profileId } });
}
