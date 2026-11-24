import { render } from 'svelte/server';
import TableSpansFixture from './TableSpansFixture.svelte';

/** Выводит редактор в объединённой ячейке до вычисления DOM размеров. */
export function renderTableSpansFixture(profileId: string) {
  return render(TableSpansFixture, { props: { profileId, editor: true } });
}
