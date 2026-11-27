import { render } from 'svelte/server';
import Fixture from './TableFilterStateFixture.svelte';
import DropdownFixture from './TableFilterDropdownFixture.svelte';
import OptionsFixture from './TableFilterOptionsFixture.svelte';
import ContentFixture from './TableFilterContentFixture.svelte';
import StaticContentFixture from './TableFilterStaticContentFixture.svelte';
import PopupContainerFixture from './TablePopupContainerFixture.svelte';

/** Forms filtered lines and a button before connecting handlers. */
export function renderTableFilterState() {
  return render(Fixture, { props: { profileId: 'controlled' } });
}

/** Removes the used daughter criterion before the first discovery of the tree. */
export function renderTableFilterOptions() {
  return render(OptionsFixture, { props: { profileId: 'tree-cascade' } });
}

/** Output strings and closed filter trigger with custom labels. */
export function renderTableFilterContent() {
  return render(ContentFixture, { props: { profileId: 'single-menu' } });
}

/** Renders a static editor in the closed panel to verify hydration. */
export function renderTableFilterStaticContent() {
  return render(StaticContentFixture, { props: { profileId: 'live' } });
}

/** Output the icon specified by the column before mounting the custom panel. */
export function renderTableFilterDropdown() {
  return render(DropdownFixture, { props: { profileId: 'custom' } });
}

/** Remove the trigger and empty container before the first opening of the portal. */
export function renderTablePopupContainer() {
  return render(PopupContainerFixture, { props: { profileId: 'table' } });
}
