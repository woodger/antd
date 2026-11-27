import { render } from 'svelte/server';
import ModalInteractionFixtures from './ModalInteractionFixtures.svelte';

/** Renders the controlled form before opening it in the browser. */
export function renderModalInteraction() {
  return render(ModalInteractionFixtures, {
    props: { initial: 'unmasked-no-lock', initiallyOpen: true }
  });
}
