import { render } from 'svelte/server';
import Fixture from './TableExpansionOptionsFixture.svelte';

/** Готовит серверные кнопки и скрытые подробности для строгой гидратации. */
export function renderExpansionOptions(profileId: string) {
  return render(Fixture, { props: { profileId } });
}
