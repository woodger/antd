import { render } from 'svelte/server';
import TableVirtualFixture from './TableVirtualFixture.svelte';
import TableCustomBodyFixture from './TableCustomBodyFixture.svelte';
import TableElementComponentsFixture from './TableElementComponentsFixture.svelte';
import TableLoadingFixture from './TableLoadingFixture.svelte';
import TableConfigFixture from './TableConfigFixture.svelte';
import TableCellUpdateFixture from './TableCellUpdateFixture.svelte';
import TableDomAttributesFixture from './TableDomAttributesFixture.svelte';

/** Рендерит то же начальное окно, с которым клиент начинает гидратацию. */
export function renderVirtualTableFixture() {
  return render(TableVirtualFixture, { props: { profileId: 'fixed', editor: true, captioned: true } });
}

/** Создаёт пользовательское тело до подключения владельца прокрутки. */
export function renderCustomTableBodyFixture() {
  return render(TableCustomBodyFixture, { props: { profileId: 'dom' } });
}

/** Формирует первое окно с заменёнными элементами и редактируемой ячейкой. */
export function renderTableElementsFixture(stringTag: boolean) {
  return render(TableElementComponentsFixture, {
    props: { profileId: 'virtual', editor: true, stringTag }
  });
}

/** Оставляет поле редактируемым до клиентской смены режима loading. */
export function renderLoadingTableFixture() {
  return render(TableLoadingFixture, {
    props: { profileId: 'object-editor', initiallyIdle: true }
  });
}

/** Рендерит Table с унаследованными ключами и размерами до первого resize. */
export function renderTableConfigFixture() {
  return render(TableConfigFixture, { props: { profileId: 'inherit', editor: true } });
}

/** Рендерит начальное содержимое виртуальных ячеек до любого сравнения записей. */
export function renderTableCellUpdateFixture() {
  return render(TableCellUpdateFixture, { props: { profile: 'virtual', editor: true } });
}

/** Рендерит caption, связи ARIA и редактор до подключения виртуального окна. */
export function renderTableDomAttributesFixture() {
  return render(TableDomAttributesFixture, { props: { profileId: 'virtual', editor: true } });
}
