// Uses the same component fixture to test SSR and strict hydration.
import { render } from 'svelte/server';
import ModalSemanticFixtures from './ModalSemanticFixtures.svelte';

/** Renders the initial HTML under the selected semantic profile. */
export function renderModalSemantics(id: string) {
  return render(ModalSemanticFixtures, { props: { id } });
}
