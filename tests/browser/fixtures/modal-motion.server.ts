// Renders the same named mask that the browser fixture hydrates.
import { render } from 'svelte/server';
import ModalMotionFixtures from './ModalMotionFixtures.svelte';

/** Returns the closed SSR dialog for the prepared opening query. */
export function renderModalMotion() {
  return render(ModalMotionFixtures, {
    props: { profile: 'custom', initiallyOpen: true }
  });
}
