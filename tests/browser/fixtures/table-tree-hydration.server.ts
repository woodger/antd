import { render } from 'svelte/server';
import TableTreeFixture from './TableTreeFixture.svelte';

/** Creates server markup with the root already revealed and the child line editor. */
export function renderTableTreeFixture() {
  return render(TableTreeFixture, { props: { profileId: 'named', editor: true } });
}
