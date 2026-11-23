import { render } from 'svelte/server';
import MenuPopupRenderFixtures from './MenuPopupRenderFixtures.svelte';

// Собирает открытое подменю из публичного пакета без браузерного окружения.
export function renderMenuPopup(enableMotion = false) {
  return render(MenuPopupRenderFixtures, {
    idPrefix: 'menu-popup-render-hydration',
    props: { kind: 'replace-origin', initiallyOpen: true, enableMotion }
  });
}
