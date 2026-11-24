import { render } from 'svelte/server';
import TableSummaryFixture from './TableSummaryFixture.svelte';

/** Рендерит редактор в том же итоговом слоте, который гидратируется в стенде. */
export function renderTableSummaryFixture(profileId: string) {
  return render(TableSummaryFixture, { props: { profileId, editor: true } });
}
