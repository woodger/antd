import { render } from 'svelte/server';
import Fixture from './ZIndexContextFixture.svelte';

/** Renders the closed dialog and menu with numerical layers for strict hydration. */
export function renderZIndexContext() {
  return render(Fixture, { props: { profileId: 'keyboard' } });
}
