import { render } from 'svelte/server';
import DefaultsFixture from './TableColumnDefaultsFixture.svelte';
import Fixture from './TableColumnLayoutFixture.svelte';
import LocaleFixture from './TableLocaleFixture.svelte';
import PaginationFixture from './TablePaginationFixture.svelte';
import SemanticFixture from './TableSemanticFixture.svelte';

/** Forms the original grid and the editor before the measurements are connected. */
export function renderColumnLayout(profileId: string) {
  return render(Fixture, { props: { profileId, editor: true } });
}

/** Preparing a team with an editor inherited from the column. */
export function renderColumnDefaults() {
  return render(DefaultsFixture, { props: { profileId: 'groups', editor: true } });
}

/** Transmits the original semantic layers and the editor before the hydration starts. */
export function renderTableSemantic() {
  return render(SemanticFixture, { props: { profileId: 'reactive' } });
}

/** Prepares the top and bottom pagers around one page with the editor. */
export function renderTablePagination() {
  return render(PaginationFixture, { props: { profileId: 'live' } });
}

/** Prepares an empty cell with an editor from a local vocabulary. */
export function renderTableLocale() {
  return render(LocaleFixture, { props: { profileId: 'body-snippet' } });
}
