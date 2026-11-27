import { render } from 'svelte/server';
import DropdownMenuFixtures from './DropdownMenuFixtures.svelte';

/** Serializes open Dropdown with a hidden branch without DOM. */
export function renderDropdownMenu() {
  return render(DropdownMenuFixtures, {
    idPrefix: 'dropdown-menu-hydration',
    props: { initial: 'nested-link', startOpen: true }
  });
}
