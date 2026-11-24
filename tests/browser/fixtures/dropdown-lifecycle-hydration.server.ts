import { render } from 'svelte/server';
import DropdownLifecycleFixtures from './DropdownLifecycleFixtures.svelte';

/** React и Svelte создают пользовательскую панель только на клиенте. */
export function renderDropdownLifecycle(startOpen: boolean) {
  return render(DropdownLifecycleFixtures, {
    idPrefix: 'dropdown-lifecycle-hydration',
    props: { initial: 'force-destroy', startOpen }
  });
}
