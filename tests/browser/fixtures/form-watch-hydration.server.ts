// Renders the actual watch fixture for strict client hydration.
import { render } from 'svelte/server';
import FormWatchFixtures from './FormWatchFixtures.svelte';

/** Renders fresh models and watchers without browser effects. */
export function renderWatchForm() {
  return render(FormWatchFixtures);
}
