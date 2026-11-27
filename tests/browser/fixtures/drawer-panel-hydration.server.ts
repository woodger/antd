import { render } from 'svelte/server';
import Fixture from './DrawerPanelFixtures.svelte';

/** Renders a closed Drawer with forceRender, a wrapper, and Skeleton. */
export function renderDrawerPanel() {
  return render(Fixture, { props: { initialProfile: 'forced' } });
}
