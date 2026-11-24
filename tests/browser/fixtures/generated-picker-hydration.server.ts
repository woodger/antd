// Создаёт открытую панель с opaque adapter до появления браузерного DOM.
import { render } from 'svelte/server';
import GeneratedPickerFixtures from './GeneratedPickerFixtures.svelte';

/** Рендерит ту же форму, которую клиент гидратирует без замены узлов. */
export function renderGeneratedPickerFixture(profile: 'open-range' | 'open-clock' = 'open-range') {
  return render(GeneratedPickerFixtures, { props: { profile } });
}
