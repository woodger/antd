import { render } from 'svelte/server';
import Fixture from './TooltipUniqueFixtures.svelte';
import Delegates from './TooltipUniqueDelegateFixtures.svelte';

/** Serializes triggers and defaultOpen until the general popup is tied. */
export function renderTooltipUnique(delegates: boolean) {
  const component = delegates ? Delegates : Fixture;
  return render(component, { props: { initialMode: 'default-open' } });
}
