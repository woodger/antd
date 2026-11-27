import { render } from 'svelte/server';
import Fixture from './TableServiceColumnsFixture.svelte';

/** Renders the same props for SSR and strict hydration in the browser scenario. */
export function renderServiceColumns(profileId: string) {
  return render(Fixture, { props: { profileId } });
}
