import { render } from 'svelte/server';
import TableColumnsFixture from './TableColumnsFixture.svelte';

/** Renders the initial header without media queries and keeps the editor in the first row. */
export function renderTableColumnsFixture() {
  return render(TableColumnsFixture, { props: { profileId: 'responsive', editor: true } });
}
