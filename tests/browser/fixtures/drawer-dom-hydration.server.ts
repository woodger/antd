import { render } from 'svelte/server';
import DrawerDomFixtures from './DrawerDomFixtures.svelte';

/** Подготавливает диалог с ARIA, data и целевым контейнером, доступным после hydration. */
export function renderDrawerDom() {
  return render(DrawerDomFixtures, { props: { initialProfile: 'attrs', initialOpen: true } });
}
