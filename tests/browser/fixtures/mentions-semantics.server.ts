import { render } from 'svelte/server';
import Fixture from './MentionsSemanticFixture.svelte';

/** Returns an editor with root, textarea and suffix design for hydration. */
export function renderMentionsSemantics() {
  return render(Fixture, { props: { profile: 'live' } });
}
