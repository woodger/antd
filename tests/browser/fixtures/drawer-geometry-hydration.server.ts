import { render } from 'svelte/server';
import Fixture from './DrawerGeometryFixtures.svelte';

/** Prepares the opening after hydration panel with handle and destroyOnHidden. */
export function renderHydrationDrawer() {
  return render(Fixture, { props: { initialProfile: 'resize-reset-on-destroy' } });
}
