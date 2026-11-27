import { render } from 'svelte/server';
import Fixture from './ConfigProviderCspFixture.svelte';

/** Prepares SSR-page for application CSS until the client is launched. */
export function renderConfigProviderCsp() {
  return render(Fixture, { props: { profile: 'strict' } });
}
