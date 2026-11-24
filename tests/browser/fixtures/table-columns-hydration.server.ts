import { render } from 'svelte/server';
import TableColumnsFixture from './TableColumnsFixture.svelte';

/** Выводит начальную шапку без media queries и оставляет редактор на первой строке. */
export function renderTableColumnsFixture() {
  return render(TableColumnsFixture, { props: { profileId: 'responsive', editor: true } });
}
