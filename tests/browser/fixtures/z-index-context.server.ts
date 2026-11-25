import { render } from 'svelte/server';
import Fixture from './ZIndexContextFixture.svelte';

/** Рендерит закрытый диалог и меню с числовыми слоями для строгой гидратации. */
export function renderZIndexContext() {
  return render(Fixture, { props: { profileId: 'keyboard' } });
}
