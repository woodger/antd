import { render } from 'svelte/server';
import MenuPopupRenderFixtures from './MenuPopupRenderFixtures.svelte';

// Collects an open substitution from a public packet without a browser environment.
export function renderMenuPopup(enableMotion = false) {
  return render(MenuPopupRenderFixtures, {
    idPrefix: 'menu-popup-render-hydration',
    props: { kind: 'replace-origin', initiallyOpen: true, enableMotion }
  });
}
