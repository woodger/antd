// Saves the same footer settings on the server side hydration fixure.
import { render } from 'svelte/server';
import ModalActionFixtures from './ModalActionFixtures.svelte';

/** Renders the closed SSR panel with a custom button order. */
export function renderModalActions() {
  return render(ModalActionFixtures, { props: { kind: 'ordinary', profile: 'footer-render' } });
}
