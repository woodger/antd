import { render } from 'svelte/server';
import DropdownMenuFixtures from './DropdownMenuFixtures.svelte';

/** Сериализует открытый Dropdown со скрытой веткой без DOM. */
export function renderDropdownMenu() {
  return render(DropdownMenuFixtures, {
    idPrefix: 'dropdown-menu-hydration',
    props: { initial: 'nested-link', startOpen: true }
  });
}
