import { render } from 'svelte/server';
import Fixture from './AppCustomRootFixture.svelte';

/** Brings back the App and the custom root before the handlers are connected. */
export function renderCustomApp() {
  return render(Fixture);
}
