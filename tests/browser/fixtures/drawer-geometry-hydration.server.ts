import { render } from 'svelte/server';
import Fixture from './DrawerGeometryFixtures.svelte';

/** Готовит открываемую после hydration панель с handle и destroyOnHidden. */
export function renderHydrationDrawer() {
  return render(Fixture, { props: { initialProfile: 'resize-reset-on-destroy' } });
}
