import { render } from 'svelte/server';
import DrawerMotionFixtures from './DrawerMotionFixtures.svelte';

/** Prepares the initial opening with the same callbacks that the client will receive. */
export function renderDrawerMotion() {
  return render(DrawerMotionFixtures, { props: { initialOpen: true } });
}
