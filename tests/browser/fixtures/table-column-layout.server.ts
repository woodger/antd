import { render } from 'svelte/server';
import DefaultsFixture from './TableColumnDefaultsFixture.svelte';
import Fixture from './TableColumnLayoutFixture.svelte';
import SemanticFixture from './TableSemanticFixture.svelte';

/** Формирует исходную сетку и редактор до подключения измерений. */
export function renderColumnLayout(profileId: string) {
  return render(Fixture, { props: { profileId, editor: true } });
}

/** Готовит группу с редактором, унаследованным из column. */
export function renderColumnDefaults() {
  return render(DefaultsFixture, { props: { profileId: 'groups', editor: true } });
}

/** Передаёт исходные semantic слои и редактор до запуска hydration. */
export function renderTableSemantic() {
  return render(SemanticFixture, { props: { profileId: 'reactive' } });
}
