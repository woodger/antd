import { render } from 'svelte/server';
import TableSummaryFixture from './TableSummaryFixture.svelte';

/** Renders the editor in the same final slot the harness hydrates. */
export function renderTableSummaryFixture(profileId: string) {
  return render(TableSummaryFixture, { props: { profileId, editor: true } });
}
