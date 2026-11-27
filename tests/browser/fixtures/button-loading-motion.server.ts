import { render } from 'svelte/server';
import Fixture from './ButtonLoadingMotionFixture.svelte';

/** Returns Button with an already visible full-time hydration badge. */
export function renderLoadingButton() {
  return render(Fixture, { props: { profile: 'initial' } });
}
