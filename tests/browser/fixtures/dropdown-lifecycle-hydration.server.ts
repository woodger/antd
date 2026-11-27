import { render } from 'svelte/server';
import DropdownLifecycleFixtures from './DropdownLifecycleFixtures.svelte';

/** React and Svelte create a custom panel only on the client. */
export function renderDropdownLifecycle(startOpen: boolean) {
  return render(DropdownLifecycleFixtures, {
    idPrefix: 'dropdown-lifecycle-hydration',
    props: { initial: 'force-destroy', startOpen }
  });
}
