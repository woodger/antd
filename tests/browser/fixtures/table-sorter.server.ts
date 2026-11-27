import { render } from 'svelte/server';
import Fixture from './TableSorterFixture.svelte';
import TooltipFixture from './TableSorterTooltipFixture.svelte';
import TitleFixture from './TableColumnTitleFixture.svelte';
import HeadingFixture from './TableHeadingContentFixture.svelte';

/** Forms a managed table with an active sorting to hydration. */
export function renderTableSorter() {
  return render(Fixture, { props: { profileId: 'controlled' } });
}

/** Forms a button and a hidden portal with the selected owner open. */
export function renderTableSorterTooltip() {
  return render(TooltipFixture, { props: { profileId: 'controlled' } });
}

/** Forms the original sorting button and individual header controls. */
export function renderTableColumnTitle() {
  return render(TitleFixture, { props: { profileId: 'interactive' } });
}

/** Forms a header and caption with overall composite contents for hydration. */
export function renderTableHeadingContent() {
  return render(HeadingFixture, { props: { profileId: 'live' } });
}
