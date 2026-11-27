// Uses the same fixture as the strict hydration client.
import { render } from 'svelte/server';
import ModalLayoutFixtures from './ModalLayoutFixtures.svelte';

/** Render the selected configuration, including rules CSS for breakpoints. */
export function renderModalLayout(profile: string) {
  return render(ModalLayoutFixtures, { props: { profile } });
}
