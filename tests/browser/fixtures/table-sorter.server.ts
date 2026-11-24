import { render } from 'svelte/server';
import Fixture from './TableSorterFixture.svelte';
import TooltipFixture from './TableSorterTooltipFixture.svelte';

/** Формирует управляемую таблицу с активной сортировкой до hydration. */
export function renderTableSorter() {
  return render(Fixture, { props: { profileId: 'controlled' } });
}

/** Формирует кнопку и скрытый портал с выбранным владельцем open. */
export function renderTableSorterTooltip() {
  return render(TooltipFixture, { props: { profileId: 'controlled' } });
}
