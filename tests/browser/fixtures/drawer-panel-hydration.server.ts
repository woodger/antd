import { render } from 'svelte/server';
import Fixture from './DrawerPanelFixtures.svelte';

/** Рендерит закрытый Drawer с forceRender, обёрткой и Skeleton. */
export function renderDrawerPanel() {
  return render(Fixture, { props: { initialProfile: 'forced' } });
}
