import { render } from 'svelte/server';
import TableSelectionFixture from './TableSelectionFixture.svelte';

/** Готовит тот же управляемый контрол, который будет гидратирован в браузере. */
export function renderTableSelectionFixture(profileId: string) {
  return render(TableSelectionFixture, { props: { profileId } });
}
