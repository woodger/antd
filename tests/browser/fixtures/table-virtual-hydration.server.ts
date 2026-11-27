import { render } from 'svelte/server';
import TableVirtualFixture from './TableVirtualFixture.svelte';
import TableCustomBodyFixture from './TableCustomBodyFixture.svelte';
import TableElementComponentsFixture from './TableElementComponentsFixture.svelte';
import TableLoadingFixture from './TableLoadingFixture.svelte';
import TableConfigFixture from './TableConfigFixture.svelte';
import TableCellUpdateFixture from './TableCellUpdateFixture.svelte';
import TableDomAttributesFixture from './TableDomAttributesFixture.svelte';
import TableColumnKeysFixture from './TableColumnKeysFixture.svelte';

/** Renders the same initial window the client starts hydrating. */
export function renderVirtualTableFixture() {
  return render(TableVirtualFixture, { props: { profileId: 'fixed', editor: true, captioned: true } });
}

/** Creates a custom body before connecting the scrolling owner. */
export function renderCustomTableBodyFixture() {
  return render(TableCustomBodyFixture, { props: { profileId: 'dom' } });
}

/** Forms the first window with replaced elements and an edited cell. */
export function renderTableElementsFixture(stringTag: boolean) {
  return render(TableElementComponentsFixture, {
    props: { profileId: 'virtual', editor: true, stringTag }
  });
}

/** Delivers the field editable before the loading mode's client shift. */
export function renderLoadingTableFixture() {
  return render(TableLoadingFixture, {
    props: { profileId: 'object-editor', initiallyIdle: true }
  });
}

/** Renders the Table with inherited keys and sizes before the first resize. */
export function renderTableConfigFixture() {
  return render(TableConfigFixture, { props: { profileId: 'inherit', editor: true } });
}

/** Renders the initial virtual cell content before comparing any rows. */
export function renderTableCellUpdateFixture() {
  return render(TableCellUpdateFixture, { props: { profile: 'virtual', editor: true } });
}

/** Renders the caption, ARIA relationships, and editor before attaching the virtual window. */
export function renderTableDomAttributesFixture() {
  return render(TableDomAttributesFixture, { props: { profileId: 'virtual', editor: true } });
}

/** Prepares a window with allowed keys and an editor for strict hydration. */
export function renderTableColumnKeysFixture() {
  return render(TableColumnKeysFixture, {
    props: { profileId: 'explicit-collision', virtual: true, editor: true }
  });
}
