// Сериализует те же публичные props, с которыми клиент подключает обработчики.
import { render } from 'svelte/server';
import MenuTooltipFixtures from './MenuTooltipFixtures.svelte';

/** Открытая по props подсказка получает серверную скрытую поверхность. */
export function renderMenuTooltip() {
  return render(MenuTooltipFixtures, { props: { sampleId: 'open-controlled' } });
}
