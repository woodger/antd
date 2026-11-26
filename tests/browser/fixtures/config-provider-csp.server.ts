import { render } from 'svelte/server';
import Fixture from './ConfigProviderCspFixture.svelte';

/** Готовит SSR-страницу для применения CSS до запуска клиента. */
export function renderConfigProviderCsp() {
  return render(Fixture, { props: { profile: 'strict' } });
}
