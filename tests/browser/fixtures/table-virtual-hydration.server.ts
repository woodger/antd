import { render } from 'svelte/server';
import TableVirtualFixture from './TableVirtualFixture.svelte';
import TableCustomBodyFixture from './TableCustomBodyFixture.svelte';

/** Рендерит то же начальное окно, с которым клиент начинает гидратацию. */
export function renderVirtualTableFixture() {
  return render(TableVirtualFixture, { props: { profileId: 'fixed', editor: true, captioned: true } });
}

/** Создаёт пользовательское тело до подключения владельца прокрутки. */
export function renderCustomTableBodyFixture() {
  return render(TableCustomBodyFixture, { props: { profileId: 'dom' } });
}
