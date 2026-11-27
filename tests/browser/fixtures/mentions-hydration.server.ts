// Uses the SSR runtime from the same Vite graph to render the fixture.
import { render } from 'svelte/server';
import Fixture from './MentionsHydrationFixture.svelte';

/** Returns the original markings with hydration markers Svelte. */
export function renderMentionsHydration(profile: string) {
  return render(Fixture, { props: { profile } });
}
