import { render } from 'svelte/server';
import Fixture from './TableFilterStateFixture.svelte';
import DropdownFixture from './TableFilterDropdownFixture.svelte';
import OptionsFixture from './TableFilterOptionsFixture.svelte';

/** Формирует отфильтрованные строки и кнопку до подключения обработчиков. */
export function renderTableFilterState() {
  return render(Fixture, { props: { profileId: 'controlled' } });
}

/** Выводит применённый дочерний критерий до первого открытия дерева. */
export function renderTableFilterOptions() {
  return render(OptionsFixture, { props: { profileId: 'tree-cascade' } });
}

/** Выводит заданную колонкой иконку до монтирования пользовательской панели. */
export function renderTableFilterDropdown() {
  return render(DropdownFixture, { props: { profileId: 'custom' } });
}
