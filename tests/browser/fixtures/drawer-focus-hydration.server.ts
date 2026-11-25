import { render } from 'svelte/server';
import DrawerFocusFixtures from './DrawerFocusFixtures.svelte';

/** Готовит открываемый при hydration Drawer без маски и autofocus. */
export function renderFocusDrawer() {
  return render(DrawerFocusFixtures, {
    props: { initialProfile: 'mask-false-no-auto', initialOpen: true }
  });
}
