import { render } from 'svelte/server';
import Fixture from './MentionsLifecycleFixture.svelte';

/** Рендерит редактор с именованным появлением до подключения браузера. */
export function renderMentionsLifecycle() {
  const profile = { id: 'named', transitionName: 'mention-enter', wrap: true, portal: true };
  return render(Fixture, { props: { profile } });
}
