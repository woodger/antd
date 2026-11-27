// Uses the SSR render from environment Vite with which the fixture is assembled.
import { render } from 'svelte/server';
import Fixture from './MentionsCountFixture.svelte';

/** Returns markings with the initial number and Svelte hydration markers. */
export function renderMentionsCount(profile: string) {
  return render(Fixture, { props: { profile } });
}
