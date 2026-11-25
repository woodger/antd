import { render } from 'svelte/server';
import ModalInteractionFixtures from './ModalInteractionFixtures.svelte';

/** Рендерит управляемую форму до открытия в браузере. */
export function renderModalInteraction() {
  return render(ModalInteractionFixtures, {
    props: { initial: 'unmasked-no-lock', initiallyOpen: true }
  });
}
