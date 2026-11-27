import { render } from 'svelte/server';
import Fixture from './InputZIndexContextFixture.svelte';

/** Render the server trigger and the original dialog layer before connecting the keyboard. */
export function renderInputZIndexContext() {
  return render(Fixture, { props: { profileId: 'keyboard' } });
}
