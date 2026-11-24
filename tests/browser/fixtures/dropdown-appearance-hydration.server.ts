import { render } from 'svelte/server';
import DropdownAppearanceFixtures from './DropdownAppearanceFixtures.svelte';

/** Отдаёт клиенту исходную оболочку панели и реальный дочерний trigger. */
export function renderDropdownAppearance(startOpen: boolean) {
  return render(DropdownAppearanceFixtures, {
    idPrefix: 'dropdown-appearance-hydration',
    props: { initial: 'classes', startOpen }
  });
}
