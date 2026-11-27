// Serializes the same public props, with which the client connects the handlers.
import { render } from 'svelte/server';
import MenuTooltipFixtures from './MenuTooltipFixtures.svelte';

/** Open on the props prompt receives a server hidden surface. */
export function renderMenuTooltip() {
  return render(MenuTooltipFixtures, { props: { sampleId: 'open-controlled' } });
}
