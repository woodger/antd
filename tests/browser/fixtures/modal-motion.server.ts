// Рендерит ту же именованную маску, которую гидратирует browser fixture.
import { render } from 'svelte/server';
import ModalMotionFixtures from './ModalMotionFixtures.svelte';

/** Возвращает закрытый SSR dialog для подготовленного запроса открытия. */
export function renderModalMotion() {
  return render(ModalMotionFixtures, {
    props: { profile: 'custom', initiallyOpen: true }
  });
}
