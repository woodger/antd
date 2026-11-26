// Рендерит фикстуру через SSR-рантайм из того же графа Vite.
import { render } from 'svelte/server';
import Fixture from './MentionsHydrationFixture.svelte';

/** Возвращает исходную разметку с гидратационными маркерами Svelte. */
export function renderMentionsHydration(profile: string) {
  return render(Fixture, { props: { profile } });
}
