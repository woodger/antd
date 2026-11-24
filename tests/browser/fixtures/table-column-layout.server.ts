import { render } from 'svelte/server';
import Fixture from './TableColumnLayoutFixture.svelte';

/** Формирует исходную сетку и редактор до подключения измерений. */
export function renderColumnLayout(profileId: string) {
  return render(Fixture, { props: { profileId, editor: true } });
}
