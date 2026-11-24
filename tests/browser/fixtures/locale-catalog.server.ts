import { render } from 'svelte/server';
import LocaleCatalogFixtures from './LocaleCatalogFixtures.svelte';

/** Сериализует публичный пакет с выбранным словарём для строгой гидратации. */
export function renderLocaleFixture(preset: string) {
  return render(LocaleCatalogFixtures, { props: { preset } });
}
