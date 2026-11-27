import { render } from 'svelte/server';
import Fixture from './MentionsLifecycleFixture.svelte';

/** Renders the editor with a named appearance before connecting the browser. */
export function renderMentionsLifecycle() {
  const profile = { id: 'named', transitionName: 'mention-enter', wrap: true, portal: true };
  return render(Fixture, { props: { profile } });
}
