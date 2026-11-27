// Creates an open panel with opaque adapter before the browser DOM.
import { render } from 'svelte/server';
import GeneratedPickerFixtures, {
  type GeneratedPickerHydrationProfile
} from './GeneratedPickerFixtures.svelte';

/** Renders the same form the client hydrates without replacing nodes. */
export function renderGeneratedPickerFixture(profile: GeneratedPickerHydrationProfile = 'open-range') {
  return render(GeneratedPickerFixtures, { props: { profile } });
}
