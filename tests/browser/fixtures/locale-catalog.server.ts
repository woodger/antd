import { render } from 'svelte/server';
import LocaleCatalogFixtures from './LocaleCatalogFixtures.svelte';

/** Serializes a public package with the selected dictionary for strict hydration. */
export function renderLocaleFixture(preset: string) {
  return render(LocaleCatalogFixtures, { props: { preset } });
}
