import { render } from 'svelte/server';
import Fixture from './TableFilterStateFixture.svelte';
import DropdownFixture from './TableFilterDropdownFixture.svelte';
import OptionsFixture from './TableFilterOptionsFixture.svelte';
import ContentFixture from './TableFilterContentFixture.svelte';
import PopupContainerFixture from './TablePopupContainerFixture.svelte';

/** Формирует отфильтрованные строки и кнопку до подключения обработчиков. */
export function renderTableFilterState() {
  return render(Fixture, { props: { profileId: 'controlled' } });
}

/** Выводит применённый дочерний критерий до первого открытия дерева. */
export function renderTableFilterOptions() {
  return render(OptionsFixture, { props: { profileId: 'tree-cascade' } });
}

/** Выводит строки и закрытый триггер фильтра с пользовательскими подписями. */
export function renderTableFilterContent() {
  return render(ContentFixture, { props: { profileId: 'single-menu' } });
}

/** Выводит заданную колонкой иконку до монтирования пользовательской панели. */
export function renderTableFilterDropdown() {
  return render(DropdownFixture, { props: { profileId: 'custom' } });
}

/** Выводит триггер и пустой контейнер до первого открытия портала. */
export function renderTablePopupContainer() {
  return render(PopupContainerFixture, { props: { profileId: 'table' } });
}
