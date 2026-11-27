import { render } from 'svelte/server';
import TableSelectionFixture from './TableSelectionFixture.svelte';

/** Prepares the same managed control that will be hydrated in the browser. */
export function renderTableSelectionFixture(profileId: string) {
  return render(TableSelectionFixture, { props: { profileId } });
}
