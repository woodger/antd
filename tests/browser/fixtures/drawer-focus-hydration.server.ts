import { render } from 'svelte/server';
import DrawerFocusFixtures from './DrawerFocusFixtures.svelte';

/** Prepares opened at hydration Drawer without mask and autofocus. */
export function renderFocusDrawer() {
  return render(DrawerFocusFixtures, {
    props: { initialProfile: 'mask-false-no-auto', initialOpen: true }
  });
}
