import { render } from 'svelte/server';
import Fixture from './MentionsSemanticFixture.svelte';

/** Возвращает редактор с оформлением root, textarea и suffix для гидратации. */
export function renderMentionsSemantics() {
  return render(Fixture, { props: { profile: 'live' } });
}
