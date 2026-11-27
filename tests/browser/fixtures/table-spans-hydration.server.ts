import { render } from 'svelte/server';
import TableSpansFixture from './TableSpansFixture.svelte';

/** Removes the editor in the combined cell to calculating DOM sizes. */
export function renderTableSpansFixture(profileId: string) {
  return render(TableSpansFixture, { props: { profileId, editor: true } });
}
