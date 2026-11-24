import { render } from 'svelte/server';
import TableTreeFixture from './TableTreeFixture.svelte';

/** Создаёт серверную разметку с уже раскрытым корнем и редактором дочерней строки. */
export function renderTableTreeFixture() {
  return render(TableTreeFixture, { props: { profileId: 'named', editor: true } });
}
