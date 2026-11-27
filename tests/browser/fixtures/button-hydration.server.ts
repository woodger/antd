import { render } from 'svelte/server';
import Fixture from './ButtonHydrationFixture.svelte';

/** Returns Button markings until the handlers are connected. */
export function renderButton(profile: 'button' | 'link') {
  return render(Fixture, { props: { profile } });
}
