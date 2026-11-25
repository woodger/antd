import { render } from 'svelte/server';
import DrawerMotionFixtures from './DrawerMotionFixtures.svelte';

/** Подготавливает начальное открытие с теми же callbacks, что получит клиент. */
export function renderDrawerMotion() {
  return render(DrawerMotionFixtures, { props: { initialOpen: true } });
}
