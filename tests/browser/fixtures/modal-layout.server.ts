// Использует ту же fixture, что и клиент строгой гидратации.
import { render } from 'svelte/server';
import ModalLayoutFixtures from './ModalLayoutFixtures.svelte';

/** Рендерит выбранную конфигурацию, включая правила CSS для брейкпоинтов. */
export function renderModalLayout(profile: string) {
  return render(ModalLayoutFixtures, { props: { profile } });
}
