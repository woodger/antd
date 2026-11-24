import { render } from 'svelte/server';
import Fixture from './TableFilterStateFixture.svelte';

/** Формирует отфильтрованные строки и кнопку до подключения обработчиков. */
export function renderTableFilterState() {
  return render(Fixture, { props: { profileId: 'controlled' } });
}
