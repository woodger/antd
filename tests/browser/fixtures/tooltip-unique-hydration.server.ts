import { render } from 'svelte/server';
import Fixture from './TooltipUniqueFixtures.svelte';
import Delegates from './TooltipUniqueDelegateFixtures.svelte';

/** Сериализует триггеры и defaultOpen до привязки общего popup. */
export function renderTooltipUnique(delegates: boolean) {
  const component = delegates ? Delegates : Fixture;
  return render(component, { props: { initialMode: 'default-open' } });
}
