import { render } from 'svelte/server';
import Fixture from './TableServiceColumnsFixture.svelte';

/** Рендерит те же props для SSR и строгой гидратации браузерного сценария. */
export function renderServiceColumns(profileId: string) {
  return render(Fixture, { props: { profileId } });
}
