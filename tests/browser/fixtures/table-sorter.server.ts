import { render } from 'svelte/server';
import Fixture from './TableSorterFixture.svelte';

/** Формирует управляемую таблицу с активной сортировкой до hydration. */
export function renderTableSorter() {
  return render(Fixture, { props: { profileId: 'controlled' } });
}
