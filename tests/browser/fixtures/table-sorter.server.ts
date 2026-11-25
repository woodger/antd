import { render } from 'svelte/server';
import Fixture from './TableSorterFixture.svelte';
import TooltipFixture from './TableSorterTooltipFixture.svelte';
import TitleFixture from './TableColumnTitleFixture.svelte';
import HeadingFixture from './TableHeadingContentFixture.svelte';

/** Формирует управляемую таблицу с активной сортировкой до hydration. */
export function renderTableSorter() {
  return render(Fixture, { props: { profileId: 'controlled' } });
}

/** Формирует кнопку и скрытый портал с выбранным владельцем open. */
export function renderTableSorterTooltip() {
  return render(TooltipFixture, { props: { profileId: 'controlled' } });
}

/** Формирует исходную кнопку сортировки и отдельные контролы заголовка. */
export function renderTableColumnTitle() {
  return render(TitleFixture, { props: { profileId: 'interactive' } });
}

/** Формирует заголовок и caption с общим составным содержимым для hydration. */
export function renderTableHeadingContent() {
  return render(HeadingFixture, { props: { profileId: 'live' } });
}
