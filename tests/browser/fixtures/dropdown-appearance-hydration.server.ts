import { render } from 'svelte/server';
import DropdownAppearanceFixtures from './DropdownAppearanceFixtures.svelte';

/** Gives the client the original shell of the panel and the real child trigger. */
export function renderDropdownAppearance(startOpen: boolean) {
  return render(DropdownAppearanceFixtures, {
    idPrefix: 'dropdown-appearance-hydration',
    props: { initial: 'classes', startOpen }
  });
}
