// Использует SSR-рендерер из среды Vite, с которой собран fixture.
import { render } from 'svelte/server';
import Fixture from './MentionsCountFixture.svelte';

/** Возвращает разметку с начальным числом и Svelte hydration markers. */
export function renderMentionsCount(profile: string) {
  return render(Fixture, { props: { profile } });
}
