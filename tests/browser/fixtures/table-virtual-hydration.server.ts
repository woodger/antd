import { render } from 'svelte/server';
import TableVirtualFixture from './TableVirtualFixture.svelte';

/** Рендерит то же начальное окно, с которым клиент начинает гидратацию. */
export function renderVirtualTableFixture() {
  return render(TableVirtualFixture, { props: { profileId: 'fixed', editor: true, captioned: true } });
}
