import { render } from 'svelte/server';
import DrawerDomFixtures from './DrawerDomFixtures.svelte';

/** Prepares a dialogue with ARIA, data, and a targeted container available after hydration. */
export function renderDrawerDom() {
  return render(DrawerDomFixtures, { props: { initialProfile: 'attrs', initialOpen: true } });
}
